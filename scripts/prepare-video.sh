#!/usr/bin/env bash
# Local processing only; never calls a generation service.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -hide_banner -loglevel error -i docs/media/departure-original.mp4 -vf 'crop=1024:576:160:0,scale=1280:720' -an -c:v libx264 -crf 19 -preset medium -movflags +faststart -y public/assets/departure-v1.mp4
ffmpeg -hide_banner -loglevel error -i public/assets/departure-v1.mp4 -vf reverse -an -c:v libx264 -crf 19 -preset medium -movflags +faststart -y public/assets/return-v1.mp4
ffmpeg -hide_banner -loglevel error -sseof -0.1 -i public/assets/departure-v1.mp4 -frames:v 1 -q:v 2 -y public/assets/arrival-v1.jpg
ffmpeg -hide_banner -loglevel error -i public/assets/departure-v1.mp4 -vf 'fps=1,scale=480:-1,tile=3x2' -frames:v 1 -y docs/media/departure-contact-sheet.jpg
