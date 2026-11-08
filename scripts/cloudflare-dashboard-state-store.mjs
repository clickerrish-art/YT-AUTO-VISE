import fs from "node:fs";
import crypto from "node:crypto";
import { atomicWriteJson } from "./atomic-json-file.mjs";
import { validateRemoteDashboardState } from "./cloudflare-dashboard-state-client.mjs";

const ARRAY_KEYS = ["queueItems", "campaigns", "audit", "jobs", "uploads", "facebookDrafts", "facebookPosts", "facebookAttempts"];

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function readJsonFile(file) {
  let stat;
  try { stat = fs.lstatSync(file); }
  catch (error) { if (error?.code === "ENOENT") return null; throw error; }
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error("Dashboard sync journal or metadata must be a regular file");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJsonFile(file, value) {
  atomicWriteJson(file, value, { mode: 0o600 });
}

function removeFile(file) {
  try { fs.unlinkSync(file); }
  catch (error) { if (error?.code !== "ENOENT") throw error; }
}

function normalizePolicy(input) {
  const state = JSON.parse(JSON.stringify(input));
  state.publishingEnabled = false;
  for (const campaign of state.campaigns ?? []) {
    if (campaign?.type !== "safari_affiliate") continue;
    campaign.status = "INACTIVE";
    campaign.destinationUrl = "";
    campaign.destinationValidation = "not_verified";
    campaign.ownerApproved = false;
    campaign.disclosureText = "";
    delete campaign.pendingDestinationUrl;
    delete campaign.pendingDisclosureText;
    delete campaign.pendingDestinationVersion;
    delete campaign.approval;
  }
  return validateRemoteDashboardState(state);
}

function matchesPendingSnapshot(remoteState, pending) {
  const remote = normalizePolicy(remoteState);
  const sent = normalizePolicy(pending.state);
  if (remote.audit.length !== sent.audit.length + 1) return false;
  const receipt = remote.audit.at(-1);
  if (receipt?.action !== "DASHBOARD_STATE_SNAPSHOT_UPDATED" ||
      receipt.previousRevision !== pending.expectedRevision) return false;
  return digest({ ...remote, audit: remote.audit.slice(0, -1) }) === pending.stateSha256;
}

function mergeSeedSnapshot(local, remote, actor) {
  const merged = { ...remote, ...local };
  for (const key of ARRAY_KEYS) {
    const items = [];
    const positions = new Map();
    for (const item of [...(remote[key] ?? []), ...(local[key] ?? [])]) {
      const identity = item && typeof item === "object" && !Array.isArray(item) && item.id
        ? "id:" + String(item.id)
        : "json:" + JSON.stringify(item);
      if (positions.has(identity)) items[positions.get(identity)] = item;
      else { positions.set(identity, items.length); items.push(item); }
    }
    merged[key] = items;
  }
  merged.audit.push({
    id: crypto.randomUUID(),
    action: "DASHBOARD_LOCAL_STATE_MERGED_TO_CLOUDFLARE",
    actor,
    at: new Date().toISOString(),
    sourceRevision: 1
  });
  return normalizePolicy(merged);
}

export class CloudflareDashboardStateStore {
  constructor({ client, stateFile, actor = "dashboard-operator" } = {}) {
    if (!client || typeof client.getState !== "function" || typeof client.updateState !== "function") {
      throw new TypeError("A Cloudflare dashboard state client is required");
    }
    if (typeof stateFile !== "string" || !stateFile.trim()) throw new TypeError("stateFile is required");
    if (typeof actor !== "string" || actor.trim().length < 2) throw new TypeError("A verified operator identity is required");
    this.client = client;
    this.stateFile = stateFile;
    this.metadataFile = stateFile + ".cloudflare-meta.json";
    this.journalFile = stateFile + ".cloudflare-pending.json";
    this.actor = actor.trim();
    this.revision = null;
  }

  readLocalState() {
    return readJsonFile(this.stateFile);
  }

  writeMetadata(revision, state, updatedAt = null) {
    writeJsonFile(this.metadataFile, {
      version: 1,
      revision,
      stateSha256: digest(state),
      updatedAt: new Date().toISOString(),
      remoteUpdatedAt: updatedAt
    });
  }

  finalize(revision, state, updatedAt = null) {
    const normalized = normalizePolicy(state);
    writeJsonFile(this.stateFile, normalized);
    this.writeMetadata(revision, normalized, updatedAt);
    removeFile(this.journalFile);
    this.revision = revision;
    return normalized;
  }

  async initialize() {
    let local = this.readLocalState();
    let remote;
    let bootstrapped = false;
    try {
      remote = await this.client.getState();
    } catch (error) {
      if (error?.code !== "STATE_NOT_INITIALIZED") throw error;
      const bootstrap = normalizePolicy(local);
      try {
        remote = await this.client.bootstrapState(bootstrap);
        bootstrapped = true;
      } catch (bootstrapError) {
        if (bootstrapError?.status !== 409) throw bootstrapError;
        remote = await this.client.getState();
      }
    }
    if (bootstrapped) return this.finalize(remote.revision, remote.state, remote.updatedAt);

    const pending = readJsonFile(this.journalFile);
    if (pending) {
      if (!Number.isSafeInteger(pending.expectedRevision) || pending.expectedRevision < 1 ||
          !pending.state || pending.stateSha256 !== digest(normalizePolicy(pending.state))) {
        throw new Error("Cloudflare state sync journal is invalid; preserve it and inspect remote state before continuing");
      }
      if (remote.revision === pending.expectedRevision + 1 && matchesPendingSnapshot(remote.state, pending)) {
        return this.finalize(remote.revision, remote.state, remote.updatedAt);
      }
      if (remote.revision === pending.expectedRevision) {
        const committed = await this.client.updateState(pending.state, pending.expectedRevision);
        return this.finalize(committed.revision, committed.state, committed.updatedAt);
      }
      throw new Error("Cloudflare state changed during an interrupted sync; preserve local and remote snapshots for reconciliation");
    }

    local = this.readLocalState();
    if (!local) return this.finalize(remote.revision, remote.state, remote.updatedAt);
    local = normalizePolicy(local);
    const localHash = digest(local);
    const remoteHash = digest(remote.state);
    const metadata = readJsonFile(this.metadataFile);

    if (!metadata) {
      if (localHash === remoteHash) {
        this.writeMetadata(remote.revision, remote.state, remote.updatedAt);
        this.revision = remote.revision;
        return remote.state;
      }
      const seeded = remote.revision === 1 &&
        (remote.state.audit ?? []).some(entry => entry?.action === "STAGING_BASELINE_IMPORTED_FROM_TRACKED_SOURCE");
      if (!seeded) throw new Error("Local dashboard history differs from Cloudflare and has no sync checkpoint; refusing to overwrite either copy");
      await this.client.createBackup();
      const merged = mergeSeedSnapshot(local, remote.state, this.actor);
      const committed = await this.client.updateState(merged, remote.revision);
      return this.finalize(committed.revision, committed.state, committed.updatedAt);
    }

    if (metadata.version !== 1 || !Number.isSafeInteger(metadata.revision) ||
        metadata.revision < 1 || !/^[a-f0-9]{64}$/.test(metadata.stateSha256 ?? "")) {
      throw new Error("Cloudflare state sync metadata is invalid; preserve both state copies for inspection");
    }
    if (remote.revision < metadata.revision) {
      throw new Error("Cloudflare state revision moved backwards; preserve both state copies for inspection");
    }
    if (localHash === remoteHash) {
      this.writeMetadata(remote.revision, remote.state, remote.updatedAt);
      this.revision = remote.revision;
      return remote.state;
    }
    if (localHash === metadata.stateSha256 && remote.revision >= metadata.revision) {
      return this.finalize(remote.revision, remote.state, remote.updatedAt);
    }
    throw new Error("Local dashboard state and Cloudflare state both changed since the last checkpoint; refusing a lossy merge");
  }

  async persist(input) {
    if (!Number.isSafeInteger(this.revision) || this.revision < 1) {
      throw new Error("Cloudflare state store has not completed startup reconciliation");
    }
    const state = normalizePolicy(input);
    const expectedRevision = this.revision;
    const pending = { version: 1, expectedRevision, state, stateSha256: digest(state), createdAt: new Date().toISOString() };
    writeJsonFile(this.journalFile, pending);
    let committed;
    try {
      committed = await this.client.updateState(state, expectedRevision);
    } catch (error) {
      if (error?.status === 409 || error?.code === "REVISION_CONFLICT") removeFile(this.journalFile);
      throw error;
    }
    return this.finalize(committed.revision, committed.state, committed.updatedAt);
  }
}
