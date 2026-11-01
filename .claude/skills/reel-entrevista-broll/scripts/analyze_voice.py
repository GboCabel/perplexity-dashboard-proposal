"""Analiza la voz de una entrevista y propone cuts.json.

Uso: .venv-whisper/bin/python analyze_voice.py <entrevista.mp4> <transcript.json> <cuts.json> [--pad 0.15] [--min-gap 0.5]

Hace lo que Whisper no resuelve bien:
- Silencios por envolvente de energía (10 ms). Whisper estira palabras y esconde pausas dentro de ellas.
- F0 mediana (pyin) por segmento. Una frase con F0 muy distinta a la de la entrevistada suele ser
  del entrevistador. Se reporta; NO se corta sola: revisar y agregar a mano en "cuts" con su motivo.
- Fin de voz: energía después de la última palabra (placas finales con música del medio).

El cuts.json resultante es una propuesta para la fase 3: revisarlo antes de editar.
"""
import argparse, json, os, subprocess, tempfile, wave

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('transcript'); ap.add_argument('out')
ap.add_argument('--pad', type=float, default=0.15)
ap.add_argument('--min-gap', type=float, default=0.5)
a = ap.parse_args()

SR = 16000
with tempfile.TemporaryDirectory() as td:
    wav = os.path.join(td, 'v.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.src, '-ac', '1', '-ar', str(SR), wav], check=True)
    wf = wave.open(wav)
    y = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768
tr = json.load(open(a.transcript))
W = [w for s in tr['segments'] for w in s['words']]

# envolvente 10 ms, mediana de 5 para no cortar por consonantes sordas
h = SR // 100
r = np.array([20 * np.log10(np.sqrt(np.mean(y[i:i + h] ** 2)) + 1e-9) for i in range(0, len(y) - h, h)])
sm = np.r_[r[:2], np.median(sliding_window_view(r, 5), axis=1), r[-2:]]
floor = np.percentile(sm, 10)
thr = floor + 6
print(f'piso de ruido {floor:.1f} dB, umbral silencio {thr:.1f} dB')
runs, s = [], None
for i, v in enumerate(sm < thr):
    if v and s is None:
        s = i
    if not v and s is not None:
        if (i - s) * 0.01 >= a.min_gap:
            runs.append((round(s * 0.01, 2), round(i * 0.01, 2)))
        s = None

# Candidatos a voz del entrevistador: segmentos cortos o interrogativos entre respuestas largas.
# No usar F0 (pyin) como detector: en audio de broadcast comprimido da errores de octava
# (marcó 74-79 Hz en frases de la entrevistada). Confirmar cada candidato a oído en la fase 3.
def seg_db(a_, b_):
    x = sm[int(a_ * 100):int(b_ * 100)]
    return float(np.median(x)) if len(x) else -99.0

speech_db = np.median([seg_db(s_['start'], s_['end']) for s_ in tr['segments']])
print('Candidatos a entrevistador (revisar a oído):')
for s_ in tr['segments']:
    d = s_['end'] - s_['start']
    rel = seg_db(s_['start'], s_['end']) - speech_db
    if d < 1.5 or s_['text'].rstrip().endswith('?') or rel < -6:
        print(f"  [{s_['start']:6.2f}-{s_['end']:6.2f}] {d:.2f}s, energía {rel:+.1f} dB vs mediana: {s_['text'][:60]}")

end_words = W[-1]['end'] if W else len(y) / SR
tail = sm[int(end_words * 100) + 10:]
if len(tail) and np.median(tail) > thr + 6:
    print(f'OJO: hay audio fuerte después de la última palabra ({end_words:.2f}s): placa/música del medio. '
          'Revisar frames y cortar antes.')

cuts = [{'from': round(x + a.pad, 2), 'to': round(z - a.pad, 2), 'motivo': f'silencio {z - x:.2f}s'}
        for x, z in runs if z - x - 2 * a.pad > 0.1 and z <= end_words + 0.3]
out = end_words + 0.1
keeps, t = [], 0.0
for c in cuts:
    keeps.append([t, c['from']]); t = c['to']
keeps.append([t, out])
dur = sum(b - x for x, b in keeps)
json.dump({'fuente': a.src, 'in': 0.0, 'out': round(out, 2), 'padding_s': a.pad, 'crossfade_audio_ms': 15,
           'cuts': cuts, 'keeps': [[round(x, 2), round(b, 2)] for x, b in keeps],
           'duracion_estimada_s': round(dur, 2)},
          open(a.out, 'w'), ensure_ascii=False, indent=1)
print(f'{len(cuts)} cortes de silencio, duración estimada {dur:.2f}s -> {a.out}')
print('Agregar a mano los cortes del entrevistador y recalcular keeps si hace falta.')
