#!/usr/bin/env bash
# Render reproducible de final/mcm_entrevista.mp4 (Fase 4). Ejecutar desde cualquier lugar.
# Requiere .venv-whisper con numpy, scipy, soundfile, Pillow (pip install pillow) y ffmpeg con libass.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec .venv-whisper/bin/python -u work/mcm_entrevista/render.py "$@"
