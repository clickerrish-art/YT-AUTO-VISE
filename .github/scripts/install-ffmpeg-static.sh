#!/usr/bin/env bash
set -euo pipefail

: "${RUNNER_TEMP:?RUNNER_TEMP must be set by GitHub Actions}"
: "${GITHUB_PATH:?GITHUB_PATH must be set by GitHub Actions}"

# CI-only static binaries. They are installed into the ephemeral runner temp
# directory and are not added to the application package or distributed.
INSTALL_DIR="$RUNNER_TEMP/ffmpeg-static-tools"
BIN_DIR="$RUNNER_TEMP/ffmpeg-static-bin"
mkdir -p "$INSTALL_DIR" "$BIN_DIR"

timeout 240s npm install \
  --prefix "$INSTALL_DIR" \
  --no-save \
  --no-package-lock \
  --no-audit \
  --no-fund \
  --prefer-online \
  ffmpeg-static@5.3.0 \
  @derhuerst/ffprobe-static@5.3.0

FFMPEG_PATH="$(node -e 'process.stdout.write(require(process.argv[1]))' "$INSTALL_DIR/node_modules/ffmpeg-static")"
FFPROBE_PATH="$(node -e 'process.stdout.write(require(process.argv[1]))' "$INSTALL_DIR/node_modules/@derhuerst/ffprobe-static")"

test -x "$FFMPEG_PATH"
test -x "$FFPROBE_PATH"
ln -sf "$FFMPEG_PATH" "$BIN_DIR/ffmpeg"
ln -sf "$FFPROBE_PATH" "$BIN_DIR/ffprobe"
echo "$BIN_DIR" >> "$GITHUB_PATH"
export PATH="$BIN_DIR:$PATH"

"$BIN_DIR/ffmpeg" -version
"$BIN_DIR/ffprobe" -version
