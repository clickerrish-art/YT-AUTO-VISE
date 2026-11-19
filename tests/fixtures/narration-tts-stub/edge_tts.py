"""Deterministic, silent Edge-TTS-compatible test double for dashboard browser tests.

This module is injected only through PYTHONPATH by browser-tests/dashboard.spec.mjs.
It never runs in production. It generates a silent MP3 with ffmpeg and emits
synthetic ordered word-boundary events so the browser suite tests persistence,
hashing, concurrency, restart and reconciliation without a network TTS service.
"""
from __future__ import annotations

import asyncio
import subprocess
import tempfile
from pathlib import Path


class Communicate:
    def __init__(self, text: str, voice: str = "", rate: str = "", boundary: str = "") -> None:
        self.text = text
        self.voice = voice
        self.rate = rate
        self.boundary = boundary

    async def stream(self):
        if self.boundary != "WordBoundary":
            raise ValueError("The narration test double requires WordBoundary events")
        with tempfile.TemporaryDirectory(prefix="dashboard-tts-fixture-") as directory:
            audio_path = Path(directory) / "fixture.mp3"
            subprocess.run(
                [
                    "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
                    "-f", "lavfi", "-i", "anullsrc=channel_layout=mono:sample_rate=22050",
                    "-t", "55", "-codec:a", "libmp3lame", "-b:a", "64k", "-y",
                    str(audio_path),
                ],
                check=True,
                timeout=30,
                capture_output=True,
            )
            audio = audio_path.read_bytes()
        if not audio:
            raise RuntimeError("The narration test double failed to create an MP3")
        yield {"type": "audio", "data": audio}

        words = self.text.split()
        if not words:
            raise ValueError("The narration test double requires non-empty text")
        duration_ticks = 55 * 10_000_000
        for index, word in enumerate(words):
            start = index * duration_ticks // len(words)
            end = (index + 1) * duration_ticks // len(words)
            yield {
                "type": "WordBoundary",
                "text": word,
                "offset": start,
                "duration": max(1, end - start),
            }
