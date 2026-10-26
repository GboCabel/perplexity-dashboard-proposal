# Handoff: edición de reel MCM

Rama: `ccr-905199ba-9ong4l`. Preferencias completas en `work/brief.json`.

## Flujo (definido por el usuario)
- `raw/` nunca se modifica; trabajar en `work/`, entregas en `final/`.
- **Fase 0** OK: ffmpeg/ffprobe con libass. faster-whisper se instala con `python3 -m venv .venv-whisper && .venv-whisper/bin/pip install faster-whisper`. En la sesión anterior huggingface.co estaba bloqueado.
- **Fase 1** OK: respuestas en `work/brief.json`.
- **Fase 2**: B-roll analizado (`work/{convzlacomando,mcm_a,mcm_b}/`). FALTA la entrevista `raw/eltiempo.mp4`: subagente que haga ffprobe, transcripción con timestamps por palabra en `work/eltiempo/transcript.json` (modelo large-v3 int8, language="es"), silencios >0,5 s, muletillas, falsos arranques. Que devuelva solo un resumen corto.
- **Fase 3**: plan en el chat con `cuts.json` por pieza, tratamiento visual/audio, riesgos y 3 opciones de gancho. ESPERAR aprobación. Incluye borrar la app React del dashboard (el usuario ya eligió borrarla).
- **Fase 4**: un subagente por pieza. Mantener resolución y fps, H.264 CRF 18-20, AAC 192k.
- **Fase 5**: QA con un subagente distinto: duración, subtítulos vs audio (≥5 puntos), sin cortes a mitad de palabra, sin saturación, resolución.
- **Fase 6**: lista de piezas (ruta, duración, contenido) y proponer un skill en `.claude/skills/` con `brief.json` como valores por defecto.

## Hallazgos B-roll
- convzlacomando: 720x1280, 25 fps. Mejores tramos: 5,3–8,8 (MCM), 1–3,8 (fuegos). Evitar 8,8–10 y 17,5–19,8 (posibles menores). **Audio probablemente música agregada → proponer mutearlo.**
- mcm_a: 576x1024, 24,935 fps CFR. Mejores tramos: 20–26,9, 0–3,5, 12–14. Evitar 5,5–9,5. Ken Burns ≤1,08.
- mcm_b: 1276x718 → crop 404x718 + escala 1,78x. Mejores tramos: 60–66 (x≈610), 40–60 (x≈600, valla publicitaria), 23–36 (x≈800). Evitar 3–23, 36–40 y 66–71 (posible menor).
- Todos los clips están a ~-14 LUFS: bajar ~20-24 dB + ducking + limitador.
- Riesgo: la entrevista es de El Tiempo y el usuario eligió no poner crédito de fuente.
