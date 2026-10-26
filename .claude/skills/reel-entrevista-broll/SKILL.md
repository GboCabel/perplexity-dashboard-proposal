---
name: reel-entrevista-broll
description: Editar un reel vertical (Reels/TikTok/Shorts) con la voz de una entrevista sobre B-roll, subtítulos karaoke, gancho fijo, rótulo y música. Usar cuando el usuario trae una entrevista + clips en raw/ y pide un reel o short.
---

# Reel de entrevista sobre B-roll

Valores por defecto: `work/brief.json` (copiarlo y ajustar solo lo que el usuario cambie).
Script de referencia: `work/mcm_entrevista/render.py` (mezcla, karaoke ASS, Ken Burns sin jitter, ensamblado).

## Reglas
- `raw/` nunca se modifica; trabajo en `work/<pieza>/`, entregas en `final/`.
- No editar nada hasta que el usuario apruebe el plan de la fase 3.

## Fases
0. **Entorno**: ffmpeg con libass; `python3 -m venv .venv-whisper && .venv-whisper/bin/pip install faster-whisper`.
   faster-whisper 1.2.x choca con PyAV: pasarle el audio como array float32 a 16 kHz leído de un wav.
1. **Brief**: preguntar solo lo que difiera de `brief.json` (plataforma, duración, gancho, crédito, música).
2. **Análisis**:
   - **B-roll**: un `segments.json` por clip con calidad, motivo y `crop_x_center` si es 16:9. Marcar menores, vallas y movidas.
   - **Entrevista**: large-v3 int8 con `word_timestamps`.
   - **Silencios**: medirlos con la envolvente de energía a 10 ms. Whisper estira palabras y esconde pausas.
   - **Voces ajenas**: detectar la del entrevistador por F0 (pyin) y cortarla.
   - **Material ya editado**: buscar placas o música de cierre del medio.
3. **Plan** (esperar aprobación):
   - `cuts.json` con los tramos a conservar y 0,15 s de aire;
   - `edl.json` con las tomas alineadas a frases;
   - tratamiento de audio y video, riesgos y 3 ganchos tomados de la transcripción.
4. **Render** (subagente): H.264 CRF 18-20, AAC 192k, -14 LUFS, true peak ≤ -1,5 dBTP.
   - **Voz**: debe quedar ≥15 dB sobre el fondo (música + ambiente) en todos los tramos con habla.
   - **Subtítulos**: tiempos del ASS cuantizados a frame y sin eventos superpuestos.
   - **Clips de fps raros**: `setpts=N/25/TB`, nunca duplicar frames.
   - **Cola musical**: dejar ~1,4 s tras la última palabra y elegir el offset para que el final natural de la pista caiga ahí.
5. **QA** (otro subagente, solo mide):
   - formato y loudness;
   - sincronía del karaoke en ≥8 puntos, con tolerancia de ±0,15 s;
   - empalmes sin palabras cortadas;
   - frames: encuadre, superposiciones, menores y vallas.
   Iterar hasta aprobar.
6. **Entrega**: ruta, duración y contenido de cada pieza, y texto sugerido para la publicación (con el crédito de la fuente si aplica).
