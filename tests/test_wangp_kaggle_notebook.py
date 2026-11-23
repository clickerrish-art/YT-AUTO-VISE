import ast
import json
import unittest
from pathlib import Path

NOTEBOOK = Path(__file__).resolve().parents[1] / "notebooks" / "sonicvhibez_wangp_kaggle.ipynb"

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
            source = "".join(cell.get("source", []))
            with self.subTest(cell=index):
                ast.parse(source, filename=f"notebook-cell-{index}")

    def test_source_and_checkpoint_pins_are_present(self):
        source = "\n".join("".join(c.get("source", [])) for c in self.cells)
        self.assertIn("f4cfc1259215577be9a2ee280c41efbedfb4459a", source)
        self.assertIn("16bb1ad02fe4ca8319b67261397ea4eeaa4896c4", source)
        self.assertIn("463076f7625d8c7fc8912011cf5d02db7f0a8ae666e1758cd835e5a8517ef0e0", source)
        self.assertIn("bb6e5e515ca6af2cb2b7bbf8bfc790b8c306832c34e0a76193507c3739ebf54a", source)

    def test_every_code_cell_checks_the_pinned_generation_authorization(self):
        code_cells = [c for c in self.cells if c.get("cell_type") == "code"]
        first = "".join(code_cells[0].get("source", []))
        self.assertIn("POLICY_COMMIT = \"4a99cc9abfb47fcf8d32dc517711322ea8a08fff\"", first)
        self.assertIn("zeroCostBackendVerification", first)
        self.assertIn("modelRightsVerification", first)
        self.assertIn("commercialUseApproved", first)
        self.assertIn("AI wildlife reconstructions", first)
        for index, cell in enumerate(code_cells[1:], start=1):
            with self.subTest(code_cell=index):
                self.assertTrue("require_generation_authorized()" in "".join(cell.get("source", [])))

    def test_notebook_does_not_claim_ai_wildlife_is_prohibited(self):
        source = "\\n".join("".join(c.get("source", [])) for c in self.cells)
        self.assertNotIn("DISABLED_BY_OWNER_AI_WILDLIFE_VISUAL_POLICY", source)
        self.assertNotIn("AI-generated wildlife visuals remain prohibited", source)

    def test_notebook_keeps_commercial_and_review_gates_closed(self):
        source = "\\n".join("".join(c.get("source", [])) for c in self.cells)
        self.assertIn("HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE", source)
        self.assertIn("'commercialUseApproved': False", source)
        self.assertIn("'humanVisualReviewStatus': 'PENDING'", source)
        self.assertIn("'loras': []", source)
        self.assertIn("'videoFilename': 'wildlife-test.mp4'", source)
        self.assertIn("'sourceVideoFilename': video_path.name", source)

if __name__ == "__main__":
    unittest.main()
