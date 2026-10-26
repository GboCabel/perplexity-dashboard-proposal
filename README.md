# Edición de reels: entrevista MCM

Pipeline de edición con ffmpeg + faster-whisper.

- `raw/`: material original (no se modifica).
- `work/`: análisis, transcripción, cortes (`work/eltiempo/cuts.json`), EDL de B-roll (`work/mcm_entrevista/edl.json`), música y brief (`work/brief.json`).
- `final/`: entregas.

Transcripción: `python3 -m venv .venv-whisper && .venv-whisper/bin/pip install faster-whisper` (large-v3, int8, language="es").
