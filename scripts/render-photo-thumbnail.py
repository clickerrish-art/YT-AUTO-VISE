#!/usr/bin/env python3
"""Disabled stock-photo thumbnail generator.

Pexels and other generic stock imagery must not substitute for genuine original
creator-captured wildlife photographs. This script intentionally performs no
network request and creates no thumbnail.
"""


def main() -> None:
    raise SystemExit(
        "BLOCKED: Pexels stock-thumbnail generation is disabled. Use only an original creator-captured "
        "wildlife photograph after source provenance, exact file hash, technical quality, usage rights "
        "and human review have been verified. No image was downloaded or created."
    )


if __name__ == "__main__":
    main()
