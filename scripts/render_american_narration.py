#!/usr/bin/env python3
"""Render a review-only American male storyteller narration using pinned Piper Norman."""
from __future__ import annotations
import argparse, hashlib, json, math, struct, sys, urllib.request, wave
from pathlib import Path

# Ensure direct CLI execution can import sibling repository modules.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.generate_piper_voice_audition import extract_short_narration, sha256_file, sha256_text

REPO = "rhasspy/piper-voices"
REVISION = "8e602cc224300e0961258a0c885bccbfcc515a7f"
MODEL_PATH = "en/en_US/norman/medium/en_US-norman-medium.onnx"
CONFIG_PATH = MODEL_PATH + ".json"
CARD_PATH = "en/en_US/norman/medium/MODEL_CARD"
MODEL_MD5 = "829cea515dc724d694b83b71e8083f9f"
CONFIG_MD5 = "975830d6f230f6eccf657d265de99eba"
CARD_MD5 = "c34f20bbc4918681ad7a070a8321f2fa"
MODEL_BYTES = 63531379
CONFIG_BYTES = 4968
VOICE_ID = "en_US-norman-medium"
OUTPUT = "american-short-001-narration-review.wav"
DIRECTION = ("American English male voice; mature approximately-45-year-old vocal character; "
             "clean, clear, warm, confident, passionate wildlife storyteller; natural conversational pacing; "
             "controlled emphasis; no robotic cadence or exaggerated theatricality.")

def md5_file(path: Path) -> str:
    h=hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""): h.update(chunk)
    return h.hexdigest()

def download(path: str, destination: Path) -> None:
    url=f"https://huggingface.co/{REPO}/resolve/{REVISION}/{path}"
    req=urllib.request.Request(url,headers={"User-Agent":"SonicVhibez-American-Voice-Review/1.0"})
    with urllib.request.urlopen(req,timeout=120) as response, destination.open("wb") as out:
        total=0
        while True:
            chunk=response.read(1024*1024)
            if not chunk: break
            total+=len(chunk)
            if total>130*1024*1024: raise ValueError("Pinned voice asset exceeded safety limit")
            out.write(chunk)
    if not destination.is_file() or destination.stat().st_size==0:
        raise ValueError("Pinned voice asset download was empty: "+path)

def validate_asset(path: Path, expected_md5: str, expected_bytes: int|None=None) -> None:
    if expected_bytes is not None and path.stat().st_size != expected_bytes:
        raise ValueError("Pinned asset byte-size mismatch: "+path.name)
    if md5_file(path) != expected_md5:
        raise ValueError("Pinned asset MD5 mismatch: "+path.name)

def apply_headroom(path: Path, ceiling: int = 30000) -> dict:
    """Apply minimal whole-file gain reduction before strict clipping validation."""
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        if source.getnchannels() != 1 or source.getsampwidth() != 2:
            raise ValueError("Headroom processing requires mono 16-bit PCM")
        raw = source.readframes(source.getnframes())
    samples = [item[0] for item in struct.iter_unpack("<h", raw)]
    if not samples:
        raise ValueError("Cannot apply headroom to an empty WAV")
    peak_before = max(abs(sample) for sample in samples)
    gain = min(1.0, ceiling / peak_before) if peak_before else 1.0
    if gain < 1.0:
        adjusted = b"".join(struct.pack("<h", round(sample * gain)) for sample in samples)
        temporary = path.with_name(path.stem + ".headroom.wav")
        with wave.open(str(temporary), "wb") as output:
            output.setparams(params)
            output.writeframes(adjusted)
        temporary.replace(path)
    peak_after = max(abs(item[0]) for item in struct.iter_unpack("<h", adjusted if gain < 1.0 else raw))
    return {
        "applied": gain < 1.0,
        "gainDb": round(20 * math.log10(gain), 3) if gain < 1.0 else 0.0,
        "peakBefore": peak_before,
        "peakAfter": peak_after
    }

def inspect_wav(path: Path) -> dict:
    with wave.open(str(path),"rb") as w:
        channels,width,rate,frames=w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getnframes()
        raw=w.readframes(frames)
    if channels!=1 or width!=2 or rate!=22050 or frames<=0 or len(raw)!=frames*2:
        raise ValueError("Output is not valid mono 16-bit 22050 Hz PCM")
    samples=[v[0] for v in struct.iter_unpack("<h",raw)]
    peak=max(map(abs,samples)); rms=math.sqrt(sum(v*v for v in samples)/len(samples))
    clipped=sum(abs(v)>=32760 for v in samples)
    duration=frames/rate
    if duration<20 or duration>180 or peak==0 or rms<8 or clipped:
        raise ValueError(f"Output duration/level/clipping validation failed: duration={duration:.3f}s peak={peak} rms={rms:.2f} clipped={clipped}")
    return {"channels":channels,"sampleRateHz":rate,"sampleWidthBits":16,
            "durationSeconds":round(duration,3),"peakDbfs":round(20*math.log10(peak/32768),2),
            "rmsDbfs":round(20*math.log10(rms/32768),2),"clippedSampleCount":clipped}

def render(output: Path, source: Path) -> dict:
    output.mkdir(parents=True,exist_ok=True)
    cache=output/".model-cache"; cache.mkdir(exist_ok=True)
    model,config,card=cache/"en_US-norman-medium.onnx",cache/"en_US-norman-medium.onnx.json",output/"MODEL_CARD"
    download(MODEL_PATH,model); validate_asset(model,MODEL_MD5,MODEL_BYTES)
    download(CONFIG_PATH,config); validate_asset(config,CONFIG_MD5,CONFIG_BYTES)
    download(CARD_PATH,card); validate_asset(card,CARD_MD5)
    card_text=card.read_text(encoding="utf-8")
    if "US English male voice" not in card_text or "public domain" not in card_text.lower():
        raise ValueError("Pinned model card does not confirm US male voice and public-domain recordings")
    cfg=json.loads(config.read_text(encoding="utf-8"))
    if cfg.get("language",{}).get("code")!="en_US" or cfg.get("num_speakers")!=1:
        raise ValueError("Pinned Norman model config has unexpected language/speaker metadata")
    source_text=source.read_text(encoding="utf-8")
    narration=extract_short_narration(source_text)
    from piper import PiperVoice, SynthesisConfig
    voice=PiperVoice.load(str(model))
    wav_path=output/OUTPUT
    with wave.open(str(wav_path),"wb") as wav:
        voice.synthesize_wav(narration,wav,SynthesisConfig())
    headroom=apply_headroom(wav_path)
    metrics=inspect_wav(wav_path)
    report={
      "schemaVersion":1,"status":"AMERICAN_MALE_STORYTELLER_REVIEW_RENDERED_HUMAN_REVIEW_REQUIRED",
      "voiceId":VOICE_ID,"voiceName":"Norman","gender":"male","accent":"American English (en_US)",
      "vocalDirection":DIRECTION,"provider":"piper_local","engine":"OHF-Voice/piper1-gpl",
      "engineVersion":"1.8.0","engineLicense":"GPL-3.0-or-later",
      "modelRepository":REPO,"modelRevision":REVISION,"modelFile":MODEL_PATH,
      "modelMd5":md5_file(model),"modelSha256":sha256_file(model),"modelBytes":model.stat().st_size,
      "modelConfigMd5":md5_file(config),"modelCardMd5":md5_file(card),
      "modelLicense":"Public-domain LibriVox recordings (per pinned MODEL_CARD)",
      "modelCardPath":"MODEL_CARD","modelCardSha256":sha256_file(card),
      "sourceScriptPath":str(source),"sourceScriptSha256":sha256_text(source_text),
      "sourceNarrationSha256":sha256_text(narration),"sourceNarrationWordCount":len(narration.split()),
      "audioFile":wav_path.name,"audioSha256":sha256_file(wav_path),"audioBytes":wav_path.stat().st_size,
      "audioMetrics":metrics,"headroomProcessing":headroom,"humanVoiceQualityReview":"PENDING",
      "commercialAttributionReview":"PENDING","productionApproved":False,"finalNarration":False,
      "publishingEnabled":False,"releaseStatus":"HOLD",
      "limitations":["Perceived age is a direction, not a verified human age.","Piper has limited expressive controls; passionate delivery requires human listening."]
    }
    (output/"american-narration-review.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    (output/"ATTRIBUTION.txt").write_text(
      "Voice: en_US-norman-medium (Norman), American English male.\n"
      "Pinned model card states US English male voice; source recordings from LibriVox are public domain.\n"
      "Model card: https://huggingface.co/"+REPO+"/blob/"+REVISION+"/"+CARD_PATH+"\n"
      "Piper engine: OHF-Voice/piper1-gpl 1.8.0, GPL-3.0-or-later.\n"
      "Human quality and commercial-use review remain pending; not production approved.\n",encoding="utf-8")
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output",default="artifacts/american-narration-review")
    p.add_argument("--source-script",default="content/short-001-wildlife-video-storytelling.md")
    a=p.parse_args()
    try:
        r=render(Path(a.output),Path(a.source_script))
        print(f"PASS: American male review render {r['audioMetrics']['durationSeconds']}s; {r['sourceNarrationWordCount']} words.")
        print("HOLD: owner listening and rights review pending; not production-approved.")
        return 0
    except Exception as e:
        print("BLOCKED: "+str(e),file=sys.stderr); return 1
if __name__=="__main__": raise SystemExit(main())
