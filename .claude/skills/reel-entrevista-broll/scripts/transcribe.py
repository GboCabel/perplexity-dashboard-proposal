"""Transcribe una entrevista con faster-whisper y timestamps por palabra.

Uso: .venv-whisper/bin/python transcribe.py <entrevista.mp4|wav> <salida.json> ["prompt con nombres propios"]

Convierte a wav mono 16 kHz con ffmpeg y pasa el audio como array numpy:
faster-whisper 1.2.x falla con algunas versiones de PyAV al abrir archivos.
"""
import json, os, subprocess, sys, tempfile, time, wave

import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 else None
t = time.time()
with tempfile.TemporaryDirectory() as td:
    wav = os.path.join(td, 'voice16k.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', wav], check=True)
    wf = wave.open(wav)
    audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
m = WhisperModel('large-v3', device='cpu', compute_type='int8', cpu_threads=os.cpu_count() or 4)
segs, info = m.transcribe(audio, language='es', word_timestamps=True, vad_filter=False, beam_size=5,
                          initial_prompt=prompt)
res = {'language': info.language, 'duration': info.duration, 'model': 'large-v3 int8', 'segments': []}
for s in segs:
    res['segments'].append({'start': s.start, 'end': s.end, 'text': s.text.strip(),
                            'words': [{'start': w.start, 'end': w.end, 'word': w.word.strip(),
                                       'prob': round(w.probability, 3)} for w in s.words]})
json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
print('ok', round(time.time() - t), 's', len(res['segments']), 'segmentos')
