#!/usr/bin/env python3
"""Import one WanGP/Kaggle test MP4 and its provenance manifest into SonicVhibez media evidence.

This is a technical evidence intake tool, not a rights approval or publishing command.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

JOB_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,119}$")
EXPECTED_WAN_GP_COMMIT = "f4cfc1259215577be9a2ee280c41efbedfb4459a"
EXPECTED_MODEL_REVISION = "16bb1ad02fe4ca8319b67261397ea4eeaa4896c4"
EXPECTED_CHECKPOINT_SHA256 = "463076f7625d8c7fc8912011cf5d02db7f0a8ae666e1758cd835e5a8517ef0e0"
EXPECTED_VAE_SHA256 = "bb6e5e515ca6af2cb2b7bbf8bfc790b8c306832c34e0a76193507c3739ebf54a"

def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def validate_manifest(manifest: dict, video: Path) -> list[str]:
    errors: list[str] = []
    if not isinstance(manifest, dict):
        return ["manifest must be a JSON object"]
    required = ("provider", "channel", "status", "wanGpCommit", "modelRepository",
                "modelRevision", "checkpointFilename", "checkpointSha256", "vaeSha256",
                "prompt", "negativePrompt", "seed", "videoSha256", "videoFilename")
    for key in required:
        if key not in manifest:
            errors.append(f"missing manifest field: {key}")
    if errors:
        return errors
    if manifest["provider"] != "wangp_kaggle": errors.append("provider must be wangp_kaggle")
    if manifest["channel"] != "SonicVhibez": errors.append("channel must be SonicVhibez")
    if manifest["status"] != "GENERATED_TEST_UNREVIEWED": errors.append("status must be GENERATED_TEST_UNREVIEWED")
    if manifest["wanGpCommit"] != EXPECTED_WAN_GP_COMMIT: errors.append("WanGP commit does not match the inspected pin")
    if manifest["modelRevision"] != EXPECTED_MODEL_REVISION: errors.append("model revision does not match the inspected pin")
    if manifest["checkpointSha256"] != EXPECTED_CHECKPOINT_SHA256: errors.append("checkpoint SHA-256 does not match the inspected artifact")
    if manifest["vaeSha256"] != EXPECTED_VAE_SHA256: errors.append("VAE SHA-256 does not match the inspected artifact")
    if manifest.get("loras") != []: errors.append("test must use no LoRAs; LoRA licence/provenance is not approved")
    if manifest.get("commercialUseApproved") is not False: errors.append("commercialUseApproved must remain false")
    if manifest.get("humanVisualReviewStatus") != "PENDING": errors.append("humanVisualReviewStatus must remain PENDING at import")
    if manifest.get("checkpointLicenseStatus") != "HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE":
        errors.append("checkpoint licence status must retain the unresolved provenance hold")
    if not isinstance(manifest["seed"], int) or manifest["seed"] < 0: errors.append("seed must be a recorded non-negative integer")
    if not isinstance(manifest["prompt"], str) or len(manifest["prompt"].strip()) < 20: errors.append("prompt is missing or too short")
    if not isinstance(manifest["negativePrompt"], str) or not manifest["negativePrompt"].strip(): errors.append("negativePrompt is required")
    if manifest["videoFilename"] != video.name: errors.append("videoFilename does not match the supplied MP4")
    if not re.fullmatch(r"[a-f0-9]{64}", str(manifest["videoSha256"])): errors.append("videoSha256 must be a 64-character SHA-256")
    if sha256_file(video) != manifest["videoSha256"]: errors.append("video SHA-256 does not match the manifest")
    if manifest.get("fullDecodePassed") is not True: errors.append("fullDecodePassed must be true")
    return errors

def inspect_video(video: Path) -> dict:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate",
         "-of", "json", str(video)],
        check=False, capture_output=True, text=True, timeout=30,
    )
    if probe.returncode:
        raise RuntimeError("ffprobe failed: " + probe.stderr[-1500:])
    data = json.loads(probe.stdout)
    stream = next((item for item in data.get("streams", []) if item.get("codec_type") == "video"), None)
    if not stream:
        raise RuntimeError("MP4 has no video stream")
    duration = float(data.get("format", {}).get("duration", 0))
    if not 1 <= duration <= 15:
        raise RuntimeError(f"test clip duration must be 1–15 seconds; got {duration}")
    decode = subprocess.run(
        ["ffmpeg", "-v", "error", "-xerror", "-i", str(video), "-f", "null", "-"],
        check=False, capture_output=True, text=True, timeout=120,
    )
    if decode.returncode:
        raise RuntimeError("full MP4 decode failed: " + decode.stderr[-1500:])
    return {"ffprobe": data, "durationSeconds": duration, "fullDecodePassed": True}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", required=True, help="wildlife-test.mp4 from the Kaggle ZIP")
    parser.add_argument("--manifest", required=True, help="generation-manifest.json from the same ZIP")
    parser.add_argument("--job-id", default="sonicvhibez-wangp-test-001")
    parser.add_argument("--repo-root", default=".")
    args = parser.parse_args()
    if not JOB_ID.fullmatch(args.job_id):
        print("BLOCKED: invalid job ID", file=sys.stderr); return 2
    root = Path(args.repo_root).resolve()
    video = Path(args.video).resolve()
    manifest_path = Path(args.manifest).resolve()
    if not video.is_file() or video.is_symlink() or video.stat().st_size == 0:
        print("BLOCKED: video must be a non-empty regular file", file=sys.stderr); return 2
    if not manifest_path.is_file() or manifest_path.is_symlink():
        print("BLOCKED: manifest must be a regular file", file=sys.stderr); return 2
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        errors = validate_manifest(manifest, video)
        if errors:
            print("BLOCKED — manifest validation failed:", file=sys.stderr)
            for error in errors: print("- " + error, file=sys.stderr)
            return 1
        media_info = inspect_video(video)
    except Exception as exc:
        print("BLOCKED: " + str(exc), file=sys.stderr); return 1

    job_dir = root / "media" / "jobs" / args.job_id
    evidence_dir = root / "content" / "generation-evidence"
    evidence_path = evidence_dir / (args.job_id + ".json")
    target_video = job_dir / "generated-shot.mp4"
    if job_dir.exists() or evidence_path.exists():
        print("BLOCKED: destination already exists; refusing to overwrite evidence or media", file=sys.stderr); return 2
    job_dir.mkdir(parents=True)
    evidence_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(video, target_video)
    imported_sha = sha256_file(target_video)
    if imported_sha != manifest["videoSha256"]:
        target_video.unlink(missing_ok=True)
        print("BLOCKED: copied video hash changed", file=sys.stderr); return 1

    record = {
        "schemaVersion": 1,
        "jobId": args.job_id,
        "channel": "SonicVhibez",
        "artifactRole": "generated_source_clip",
        "provider": "wangp_kaggle",
        "status": "GENERATED_TEST_UNREVIEWED",
        "mediaPath": str(target_video.relative_to(root)).replace("\\", "/"),
        "mediaSha256": imported_sha,
        "generation": manifest,
        "technicalInspection": media_info,
        "rightsStatus": "HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE",
        "commercialUseApproved": False,
        "humanVisualReviewStatus": "PENDING",
        "factualReviewStatus": "PENDING",
        "syntheticMediaDisclosureReviewStatus": "PENDING",
        "publishingStatus": "NOT_APPROVED",
        "notes": "Technical evidence intake only. Do not treat this generated clip as authentic wildlife footage or a completed long-form render. The exact mirror checkpoint's licence/provenance must be resolved before commercial use."
    }
    evidence_path.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print("PASS: MP4 imported and full-file decode verified.")
    print("Media:", target_video.relative_to(root))
    print("Evidence:", evidence_path.relative_to(root))
    print("SHA-256:", imported_sha)
    print("HOLD: rights, human review, factual review and publishing remain blocked.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
