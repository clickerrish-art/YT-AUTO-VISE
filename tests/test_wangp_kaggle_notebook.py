import ast
import json
import unittest
from pathlib import Path

NOTEBOOK = Path(__file__).resolve().parents[1] / "notebooks" / "sonicvhibez_wangp_kaggle.ipynb"
POLICY_STOP = 'raise RuntimeError("DISABLED_BY_OWNER_ORIGINAL_MEDIA_POLICY: genuine original creator-captured wildlife media is required; AI wildlife generation is prohibited.")'

class WanGPKaggleNotebookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
        cls.cells = cls.notebook.get("cells", [])

    def test_notebook_is_valid_nbformat_4(self):
        self.assertEqual(self.notebook.get("nbformat"), 4)
        self.assertGreaterEqual(len(self.cells), 10)

    def test_every_code_cell_parses_as_python(self):
        for index, cell in enumerate(self.cells):
            if cell.get("cell_type") != "code":
                continue
            with self.subTest(cell=index):
                ast.parse("".join(cell.get("source", [])), filename=f"notebook-cell-{index}")

    def test_source_and_checkpoint_pins_are_not_executable_or_present(self):
        source = "\\n".join("".join(c.get("source", [])) for c in self.cells)
        for forbidden in ("git clone", "huggingface_hub", "snapshot_download", "gradio", "WanGP", "safetensors", "cuda"):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden.lower(), source.lower())
        self.assertIn("No generation is authorized", source)

    def test_every_code_cell_fails_closed_before_side_effects(self):
        code_cells = [c for c in self.cells if c.get("cell_type") == "code"]
        self.assertGreaterEqual(len(code_cells), 3)
        for index, cell in enumerate(code_cells):
            source = "".join(cell.get("source", []))
            with self.subTest(code_cell=index):
                self.assertEqual(source.strip(), POLICY_STOP.strip())
                self.assertEqual(len(ast.parse(source).body), 1)

    def test_notebook_explicitly_enforces_original_media_policy(self):
        source = "\\n".join("".join(c.get("source", [])) for c in self.cells)
        self.assertIn("DISABLED_BY_OWNER_ORIGINAL_MEDIA_POLICY", source)
        self.assertIn("genuine original creator-captured media", source)
        self.assertIn("AI-generated wildlife visuals", source)
        self.assertIn("generic stock footage", source)

    def test_notebook_keeps_commercial_and_review_gates_closed(self):
        source = "\\n".join("".join(c.get("source", [])) for c in self.cells)
        self.assertIn("verified provenance and usage rights", source)
        self.assertIn("Missing or unverified evidence means HOLD", source)
        self.assertIn("No GPU session, paid API, model download", source)
        self.assertIn("grants no publishing, scheduling, or approval authority", source)

if __name__ == "__main__":
    unittest.main()
