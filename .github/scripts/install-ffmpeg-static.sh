#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP must be set by GitHub Actions}"
: "${GITHUB_PATH:?GITHUB_PATH must be set by GitHub Actions}"
: "${GITHUB_ENV:?GITHUB_ENV must be set by GitHub Actions}"

# Pinned full renderer build for CI. The npm ffmpeg-static binary lacks the
# drawtext filter needed by production thumbnail rendering. This GPL shared
# build is ephemeral CI tooling only; it is not bundled into production.
ARCHIVE="$RUNNER_TEMP/ffmpeg-renderer-build.tar.xz"
EXTRACT_DIR="$RUNNER_TEMP/ffmpeg-renderer-build"
BIN_DIR="$RUNNER_TEMP/ffmpeg-renderer-bin"
URL="https://github.com/FFmpeg-Builds/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl-shared.tar.xz"
EXPECTED_SHA256="1fb258c5d1ed0a135143a5be228684e60f2b1cbf09462104370db23093709794"

mkdir -p "$EXTRACT_DIR" "$BIN_DIR"
curl --fail --location --silent --show-error \
  --retry 3 --retry-all-errors --connect-timeout 20 --max-time 240 \
  "$URL" --output "$ARCHIVE"
echo "$EXPECTED_SHA256  $ARCHIVE" | sha256sum --check -

tar -xJf "$ARCHIVE" -C "$EXTRACT_DIR"
FFMPEG_PATH="$(find "$EXTRACT_DIR" -type f -name ffmpeg -perm -111 -print -quit)"
FFPROBE_PATH="$(find "$EXTRACT_DIR" -type f -name ffprobe -perm -111 -print -quit)"
LIB_FILE="$(find "$EXTRACT_DIR" -type f -name 'libavcodec.so*' -print -quit)"
if [[ -z "$FFMPEG_PATH" || -z "$FFPROBE_PATH" || -z "$LIB_FILE" ]]; then
  echo "Pinned FFmpeg build is missing ffmpeg, ffprobe or shared libraries" >&2
  exit 1
fi
LIB_DIR="$(dirname "$LIB_FILE")"
export LD_LIBRARY_PATH="$LIB_DIR:${LD_LIBRARY_PATH:-}"
echo "LD_LIBRARY_PATH=$LD_LIBRARY_PATH" >> "$GITHUB_ENV"

ln -sf "$FFMPEG_PATH" "$BIN_DIR/ffmpeg"
ln -sf "$FFPROBE_PATH" "$BIN_DIR/ffprobe"
echo "$BIN_DIR" >> "$GITHUB_PATH"
export PATH="$BIN_DIR:$PATH"

"$BIN_DIR/ffmpeg" -version
"$BIN_DIR/ffprobe" -version
"$BIN_DIR/ffmpeg" -hide_banner -filters 2>&1 | grep -Eq '[[:space:]]drawtext[[:space:]]'
"$BIN_DIR/ffmpeg" -hide_banner -encoders 2>&1 | grep -q 'libx264'

FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
if [[ ! -f "$FONT" ]]; then
  FONT="$(find /usr/share/fonts -type f -name DejaVuSans.ttf -print -quit)"
fi
if [[ -z "$FONT" || ! -f "$FONT" ]]; then
  echo "A DejaVuSans font is required for the drawtext smoke test" >&2
  exit 1
fi
SMOKE="$RUNNER_TEMP/ffmpeg-drawtext-smoke.mp4"
"$BIN_DIR/ffmpeg" -hide_banner -loglevel error \
  -f lavfi -i "color=c=black:s=320x180:r=24:d=1" \
  -vf "drawtext=fontfile=$FONT:text='CI drawtext smoke test':fontcolor=white:fontsize=14:x=10:y=10" \
  -c:v libx264 -pix_fmt yuv420p -t 1 "$SMOKE"
"$BIN_DIR/ffprobe" -v error -show_entries stream=codec_name,width,height -of csv=p=0 "$SMOKE"
