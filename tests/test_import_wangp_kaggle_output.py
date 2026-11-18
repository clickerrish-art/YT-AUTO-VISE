import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "import_wangp_kaggle_output.py"
spec = importlib.util.spec_from_file_location("import_wangp_kaggle_output", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class WanGPKaggleImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.video = Path(self.temp.name) / "wildlife-test.mp4"
        self.video.write_bytes(b"synthetic-test-mp4-bytes")
        self.manifest = {
            "provider": "wangp_kaggle",
            "channel": "SonicVhibez",
            "status": "GENERATED_TEST_UNREVIEWED",
            "wanGpCommit": module.EXPECTED_WAN_GP_COMMIT,
            "modelRepository": "DeepBeepMeep/Wan2.2",
            "modelRevision": module.EXPECTED_MODEL_REVISION,
            "checkpointFilename": "wan2.2_text2video_5B_quanto_mbf16_int8.safetensors",
            "checkpointSha256": module.EXPECTED_CHECKPOINT_SHA256,
            "vaeSha256": module.EXPECTED_VAE_SHA256,
            "prompt": "A photorealistic elephant family walks through the savannah at sunrise.",
            "negativePrompt": "cartoon, malformed anatomy",
            "seed": 12345,
            "videoSha256": hashlib.sha256(self.video.read_bytes()).hexdigest(),
            "videoFilename": self.video.name,
            "fullDecodePassed": True,
            "loras": [],
            "commercialUseApproved": False,
            "humanVisualReviewStatus": "PENDING",
            "checkpointLicenseStatus": "HOLD_UNVERIFIED_MIRROR_DERIVATIVE_PROVENANCE"
        }

    def tearDown(self):
        self.temp.cleanup()

    def test_accepts_exact_pinned_test_manifest(self):
        self.assertEqual(module.validate_manifest(self.manifest, self.video), [])

    def test_rejects_mutated_checkpoint_hash(self):
        self.manifest["checkpointSha256"] = "0" * 64
        self.assertIn("checkpoint SHA-256 does not match the inspected artifact",
                      module.validate_manifest(self.manifest, self.video))

    def test_rejects_any_lora(self):
        self.manifest["loras"] = ["unreviewed-lora.safetensors"]
        self.assertIn("test must use no LoRAs; LoRA licence/provenance is not approved",
                      module.validate_manifest(self.manifest, self.video))

    def test_rejects_video_hash_mismatch(self):
        self.manifest["videoSha256"] = "f" * 64
        self.assertIn("video SHA-256 does not match the manifest",
                      module.validate_manifest(self.manifest, self.video))

    def test_rejects_commercial_approval_claim(self):
        self.manifest["commercialUseApproved"] = True
        self.assertIn("commercialUseApproved must remain false",
                      module.validate_manifest(self.manifest, self.video))

if __name__ == "__main__":
    unittest.main()
