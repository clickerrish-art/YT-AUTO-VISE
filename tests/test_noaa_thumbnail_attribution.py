from __future__ import annotations

import ast
import json
import unittest
from pathlib import Path

from PIL import ImageFont

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "create-noaa-lobster-thumbnail-review.py"
CANDIDATE_PATH = ROOT / "content" / "asset-candidates" / "noaa-spiny-lobsters-california.json"


class NoaaThumbnailAttributionTests(unittest.TestCase):
    def test_thumbnail_uses_exact_owner_required_attribution(self):
        source = SCRIPT_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        candidate = json.loads(CANDIDATE_PATH.read_text(encoding="utf-8"))
        required = candidate["ownerAuthorization"]["requiredAttribution"]

        assignments = {
            node.targets[0].id: node.value.value
            for node in ast.walk(tree)
            if isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
            and isinstance(node.value, ast.Constant)
            and isinstance(node.value.value, str)
        }
        self.assertEqual(assignments.get("REQUIRED_ATTRIBUTION"), required)

        attribution_draws = [
            node for node in ast.walk(tree)
            if isinstance(node, ast.Call)
            and isinstance(node.func, ast.Attribute)
            and isinstance(node.func.value, ast.Name)
            and node.func.value.id == "draw"
            and node.func.attr == "text"
            and len(node.args) >= 2
            and isinstance(node.args[1], ast.Name)
            and node.args[1].id == "REQUIRED_ATTRIBUTION"
        ]
        self.assertEqual(len(attribution_draws), 1)

        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15
        )
        available_width = 1225 - 786 - 32
        self.assertLessEqual(font.getlength(required), available_width)


if __name__ == "__main__":
    unittest.main()
