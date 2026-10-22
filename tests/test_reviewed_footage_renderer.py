import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "render-reviewed-wildlife-footage.py"

class ReviewedFootageRendererSafetyTests(unittest.TestCase):
    def run_script_with_root(self, root: Path):
        # Exercise the entry point in an isolated project-shaped tree without
        # changing repository files or requiring FFmpeg to run.
        import shutil
        with tempfile.TemporaryDirectory() as td:
            copy = Path(td) / "scripts" / SCRIPT.name
            copy.parent.mkdir(parents=True)
            shutil.copy2(SCRIPT, copy)
            (Path(td) / "media").mkdir(exist_ok=True)
            result = subprocess.run([sys.executable, str(copy)], cwd=td,
                                    text=True, capture_output=True)
            return result

    def test_missing_manifest_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            import shutil
            root = Path(td)
            (root / "scripts").mkdir()
            shutil.copy2(SCRIPT, root / "scripts" / SCRIPT.name)
            (root / "media").mkdir()
            result = subprocess.run([sys.executable, str(root / "scripts" / SCRIPT.name)],
                                    cwd=root, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("No reviewed footage manifest", result.stderr)
            self.assertFalse((root / "media" / "rendered-drafts").exists())

    def test_empty_manifest_fails_closed(self):
        with tempfile.TemporaryDirectory() as td:
            import shutil, json
            root = Path(td)
            (root / "scripts").mkdir()
            shutil.copy2(SCRIPT, root / "scripts" / SCRIPT.name)
            footage = root / "media" / "approved-footage"
            footage.mkdir(parents=True)
            (footage / "manifest.json").write_text(json.dumps({"clips": []}), encoding="utf-8")
            result = subprocess.run([sys.executable, str(root / "scripts" / SCRIPT.name)],
                                    cwd=root, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("at least one reviewed clip", result.stderr)

if __name__ == "__main__":
    unittest.main()
