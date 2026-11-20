#!/usr/bin/env node
/**
 * Sign one exact private-upload authorization with the owner's Ed25519 private key.
 * The private key is read locally and is never copied into the repository or output.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { oneShotUploadAuthorizationPayload, resolveRegularFileNoSymlinks } from "./upload-private.mjs";

const [recordArg, privateKeyArg] = process.argv.slice(2);
if (!recordArg || !privateKeyArg) {
  console.error("Usage: node scripts/sign-youtube-upload-authorization.mjs <authorization.json> <owner-private-key.pem>");
  process.exit(2);
}

let recordPath, privateKeyPath;
try {
  recordPath = resolveRegularFileNoSymlinks(recordArg, "Unsigned one-shot authorization");
  privateKeyPath = resolveRegularFileNoSymlinks(privateKeyArg, "Owner Ed25519 private key");
} catch (error) {
  console.error("BLOCKED: authorization or private-key path is missing or unsafe: " + error.message);
  process.exit(2);
}

let record, privateKey;
try {
  record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("authorization must be a JSON object");
  if (Object.hasOwn(record, "signature")) throw new Error("authorization is already signed; create a fresh one-shot record instead of re-signing it");
  privateKey = crypto.createPrivateKey(fs.readFileSync(privateKeyPath));
} catch (error) {
  console.error("BLOCKED: could not read the unsigned authorization or private key: " + error.message);
  process.exit(2);
}
if (privateKey.asymmetricKeyType !== "ed25519") {
  console.error("BLOCKED: owner private key must be Ed25519.");
  process.exit(2);
}
if (process.platform !== "win32" && (fs.statSync(privateKeyPath).mode & 0o077) !== 0) {
  console.error("BLOCKED: private-key file permissions are too broad; restrict the key to owner-only access (chmod 600).");
  process.exit(2);
}

const signature = crypto.sign(null, Buffer.from(oneShotUploadAuthorizationPayload(record), "utf8"), privateKey).toString("base64");
const signedRecord = { ...record, signature };
const temporaryPath = path.join(path.dirname(recordPath), "." + path.basename(recordPath) + "." + crypto.randomUUID() + ".tmp");
let fd;
try {
  fd = fs.openSync(temporaryPath, "wx", 0o600);
  fs.writeFileSync(fd, JSON.stringify(signedRecord, null, 2) + "\n", "utf8");
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fd = undefined;
  fs.renameSync(temporaryPath, recordPath);
  try {
    const directoryFd = fs.openSync(path.dirname(recordPath), "r");
    try { fs.fsyncSync(directoryFd); } finally { fs.closeSync(directoryFd); }
  } catch (error) {
    if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM"].includes(error?.code)) throw error;
  }
} catch (error) {
  if (fd !== undefined) { try { fs.closeSync(fd); } catch {} }
  try { fs.unlinkSync(temporaryPath); } catch {}
  console.error("BLOCKED: could not atomically write the signed one-shot authorization: " + error.message);
  process.exit(1);
}
console.log("PASS: one-shot private-upload authorization signed with Ed25519.");
console.log("The private key was not copied, printed, or stored in the authorization record.");
