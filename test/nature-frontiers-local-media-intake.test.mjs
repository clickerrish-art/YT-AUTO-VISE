import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { registerLocalMedia, persistRegister } from "../scripts/register-nature-frontiers-local-media.mjs";
import { validateMediaRegister } from "../scripts/validate-nature-frontiers-media-register.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "nf-media-"));
  fs.mkdirSync(path.join(root, "media/nature-frontiers"), { recursive: true });
  fs.writeFileSync(path.join(root, "media/nature-frontiers/clip.mp4"), "real local media bytes");
  const register = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content/nature-frontiers-media-register.json"), "utf8"));
  register.assets = [structuredClone(register.assets[0])];
