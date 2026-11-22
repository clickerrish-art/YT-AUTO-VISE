from __future__ import annotations

import json
from pathlib import Path


def require_owner_authorized_alternative_voice() -> None:
    """Fail closed unless the owner explicitly authorizes a non-Roderic voice."""
    policy_path = Path(__file__).resolve().parents[1] / "config" / "narration-voice-candidates.json"
    try:
        policy = json.loads(policy_path.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError) as exc:
        raise SystemExit("BLOCKED: cannot verify the current owner narrator policy: " + str(exc))
    decision = policy.get("ownerDecision", {})
    if decision.get("alternativeVoicesAuthorized") is not True:
        raise SystemExit(
            "BLOCKED: Speechma Andrew is the only owner-selected zero-cost audition and must be generated through the browser tool. "
            "This local Piper/Edge TTS generator is not authorized; no audio will be generated."
        )
