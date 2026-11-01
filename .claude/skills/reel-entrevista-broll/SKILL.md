---
name: reel-entrevista-broll
description: Editar un reel vertical (Reels/TikTok/Shorts) que usa solo la voz de una entrevista sobre B-roll, con subtítulos karaoke, gancho fijo, rótulo y música épica. Usar cuando el usuario trae una entrevista y clips de B-roll en raw/ y pide un reel, short o video vertical.
---

# Reel de entrevista sobre B-roll

La entrevista solo aporta la voz; en pantalla se ve únicamente B-roll. Salida 9:16 con subtítulos karaoke,
gancho fijo arriba, rótulo con el nombre y música de fondo que baja sola cuando habla la entrevistada.

Archivos del skill:
- `defaults.json`: valores por defecto del brief (plataforma, formato, estilo de subtítulos, mezcla). Copiarlo
  a `work/brief.json` y preguntar solo lo que falte o cambie.
- `scripts/transcribe.py`: transcripción con timestamps por palabra.
- `scripts/analyze_voice.py`: silencios por energía, candidatos a voz del entrevistador, placa final, propuesta de `cuts.json`.
- `scripts/render_referencia.py`: render completo del primer proyecto (mezcla, karaoke ASS, Ken Burns sin
  jitter, ensamblado). Es una referencia, no un script genérico: rutas y constantes como `ONSET_FIX`,
  `CROP_FIX`, `TRACK`, `VOICE_END_SRC` y `MUSIC_OFFSET` son de esa pieza. Copiarlo a `work/<pieza>/render.py` y adaptarlo.

## Reglas
- `raw/` nunca se modifica. Trabajo en `work/<pieza>/`, entregas en `final/`.
- No editar nada hasta que el usuario apruebe el plan de la fase 3.
- Antes de afirmar algo sobre una herramienta o versión, verificarlo en el entorno (se actualizan seguido).

## Fase 0: entorno
- `ffmpeg -filters | grep -E " (ass|subtitles|sidechaincompress|loudnorm)"` (libass es obligatorio).
- `python3 -m venv .venv-whisper && .venv-whisper/bin/pip install faster-whisper soundfile scipy pillow`.
- Probar el acceso a huggingface.co (el modelo large-v3 se baja de ahí).
- `.gitignore`: `.venv-whisper/`, `work/**/*.wav`, `work/*/build/`.

## Fase 1: brief
Partir de `defaults.json` y preguntar solo:
- duración objetivo;
- nombre del rótulo y ortografía exacta;
- si va crédito de la fuente, y dónde (recomendar el caption si no va en el video);
- de dónde sale la música (ver fase 4).

## Fase 2: análisis
**B-roll**, un `work/<clip>/segments.json` por clip:
- tramos con `start`, `end`, `desc`, `calidad` (buena/regular/mala) y `motivo`;
- para clips 16:9, `crop_x_center_px` para recortar a 9:16;
- marcar posibles menores, vallas o logos de terceros, movidas y audio con música agregada.

**Entrevista:**
1. `ffprobe` de la entrevista y extracción de frames del principio y del final: los clips de medios suelen venir
   ya editados, con subtítulos y logos grabados y una placa final con música.
2. `scripts/transcribe.py raw/<entrevista>.mp4 work/<entrevista>/transcript.json "Entrevista a <Nombre>."`
   (el tercer argumento ayuda a escribir bien los nombres propios).
3. `scripts/analyze_voice.py raw/<entrevista>.mp4 work/<entrevista>/transcript.json work/<entrevista>/cuts.json`.
   - **Silencios:** se miden por energía, no por Whisper. Whisper estira palabras (una de 1,8 s) y esconde pausas dentro.
   - **Voz del entrevistador:** el script lista candidatos (frases cortas o interrogativas). Confirmarlos a oído.
     NO usar el tono de voz (F0/pyin) como prueba: en audio de broadcast da errores de octava.
   - **Placa final:** si hay audio fuerte después de la última palabra, mirar el espectrograma (suele haber un whoosh)
     y cortar justo antes.
   - **Muletillas y falsos arranques:** marcarlos. Las repeticiones enfáticas ("unida, unida") se dejan.

## Fase 3: plan (esperar aprobación)
Presentarlo en el chat:
- **`cuts.json`:** tramos a conservar, 0,15 s de aire por lado y crossfade de 15 ms, con el motivo de cada corte y la duración resultante.
- **`work/<pieza>/edl.json`:** tomas de 1,5 a 4,5 s cortadas en límites de frase, con lo que se dice
  (multitud en lo oscuro, sonrisas y fuegos en lo esperanzador). Cierre con callback al plano de apertura y una cola de ~1,4 s.
- **Tratamiento** de audio y video.
- **Riesgos:** derechos de la fuente, desajuste de tono entre lo que se dice y lo que se ve, material escaso
  (tomas repetidas), reescalados que ablandan la imagen, menores y vallas.
- **Tres ganchos** sacados de la transcripción, con una recomendación y el porqué.

## Fase 4: render (un subagente por pieza)
- **Formato:** 720x1280, el fps de la mayoría de los clips (normalmente 25), H.264 CRF 18-20 preset slow, yuv420p,
  +faststart, AAC 192k a 48 kHz.
- **Video:**
  - clips 16:9: recorte de 404x718 alrededor de `crop_x_center` y escalado lanczos;
  - clips con fps raros (24,935): `setpts=N/25/TB`, nunca duplicar frames;
  - Ken Burns de 1,00 a 1,06 (máx. 1,08) con dirección alternada, hecho con `perspective` sobre una versión agrandada
    para que no tiemble;
  - revisar los frames: si asoma una valla o el sujeto se sale del cuadro, recentrar o hacer un paneo.
- **Voz:** keeps con crossfade, highpass 80 Hz, compresión suave y loudnorm de dos pasadas a -14 LUFS,
  true peak ≤ -1,5 dBTP.
- **Ambiente:** audio de los clips ~22 dB bajo la voz, con crossfades coseno y sidechain. Los clips con música
  agregada van muteados.
- **Música:**
  - Fuente: si el usuario no trae un archivo, ofrecer generarla con vidIQ `vidiq_generate_music`
    (25 créditos; avisar el costo y consultar el saldo antes). Prompt usado: "Cinematic orchestral epic, hopeful and
    emotional, building from soft piano and warm strings into a powerful swell with taiko drums, brass and choir pads,
    steady mid tempo around 90 BPM, sustained and spacious to sit under spoken voice, triumphant crescendo near the end,
    instrumental".
  - Offset: elegirlo para que el final natural de la pista caiga en la cola y su crescendo caiga sobre la frase del gancho.
  - Nivel: ~20 dB bajo la voz, con sidechain y una automatización de ganancia que garantice que la voz quede
    ≥15 dB sobre música + ambiente en ventanas de 400 ms con habla.
- **Subtítulos (ASS):**
  - remapear las palabras al tiempo editado y descartar las que caen en cortes;
  - corregir el inicio de cada palabra con la envolvente de energía; fijar a mano en `ONSET_FIX` las que fallen;
  - bloques de 2 a 4 palabras cortados en la puntuación, en MAYÚSCULAS, Inter Display Bold de ~64 px, blanco con contorno negro
    de 5 px y palabra activa en #FFD400, a y=0,65;
  - **todos los tiempos cuantizados a frames (múltiplos de 0,04 s) y sin dos eventos activos en el mismo frame.**
- **Gráficos:**
  - gancho fijo a y≈0,14, sobre una caja semitransparente;
  - rótulo de 0 a 3,5 s con fade de 0,25 s, en lower third con acento amarillo. Bajarlo o subirlo para que no tape la cara.
- El subagente devuelve un resumen corto: métricas, desvíos de la spec y por qué, y problemas pendientes.

## Fase 5: QA (otro subagente, solo mide)
- Formato, duración (video = audio ±1 frame), LUFS y true peak, clipping.
- Sincronía del karaoke en ≥8 puntos, incluidas las zonas dudosas: re-transcribir el mp4 y comparar con
  el resaltado del ASS. Tolerancia ±0,15 s.
- Que no haya frames con dos subtítulos.
- Cada empalme cae en una pausa, sin palabras cortadas ni clics.
- No se oyen el entrevistador ni la placa del medio.
- La voz es inteligible donde la música crece.
- Frames: encuadre, superposiciones que no se pisan, sin bandas negras, sin jitter, sin frames duplicados,
  sin menores ni vallas.
- Iterar render y QA hasta aprobar. Después de cada corrección, revisar lo que el arreglo pudo haber movido
  (por ejemplo, la cola de la música).

## Fase 6: entrega
- Commit y push de `final/` y `work/`.
- Mandar el video al usuario. Por cada pieza: ruta, duración, contenido y métricas.
- Pendientes menores y lo que tiene que revisar el usuario (menores, cambios respecto del brief).
- Texto sugerido para la publicación, con el crédito de la fuente si corresponde.
