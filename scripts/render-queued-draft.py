#!/usr/bin/env python3
"""Deprecated text-only renderer. Production must use the reviewed original-wildlife-footage pipeline."""
from __future__ import annotations

APPROVED_URL = "https://selar.com/0u19v8u99l"


def validate_render_authorization(meta: dict) -> bool:
    if not isinstance(meta, dict):
        raise SystemExit("BLOCKED: render metadata must be an object.")
    if meta.get("channel") != "SonicVhibez" or meta.get("productUrl") != APPROVED_URL:
        raise SystemExit("BLOCKED: render destination or approved Selar URL does not match.")
    if (
        meta.get("voiceApprovalStatus") != "OWNER_APPROVED"
        or meta.get("licenseStatus") != "COMMERCIAL_USE_CLEARED"
        or meta.get("commercialUseAllowed") is not True
    ):
        raise SystemExit("BLOCKED: production rendering requires an owner-approved, commercially cleared narration voice; non-commercial Edge TTS auditions are never production audio.")
    if meta.get("rightsConfirmed") is not True or meta.get("complianceReviewed") is not True:
        raise SystemExit("BLOCKED: production rendering requires verified rights and completed human compliance review.")
    if (
        meta.get("mediaSourceType") != "ORIGINAL_CREATOR_CAPTURED"
        or meta.get("mediaProvenanceStatus") != "VERIFIED"
    ):
        raise SystemExit("BLOCKED: production rendering requires verified original creator-captured wildlife media and exact asset provenance.")
    if meta.get("stockMediaUsed") is True or meta.get("containsAIWildlifeVisuals") is True:
        raise SystemExit("BLOCKED: stock or AI-generated wildlife visuals cannot substitute for genuine original wildlife media.")
    return True


def main() -> None:
    raise SystemExit(
        "BLOCKED: the generic text-only draft renderer is disabled. It does not create a finished wildlife production. "
        "Use scripts/render-reviewed-wildlife-footage.py only after original source files, hashes, technical probes, "
        "commercial rights, owner-approved narration and human review are verified. No MP4 was created."
    )


if __name__ == "__main__":
    main()
