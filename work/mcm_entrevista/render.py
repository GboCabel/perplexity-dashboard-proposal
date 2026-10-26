#!/usr/bin/env python3
"""Fase 4 - render reproducible de final/mcm_entrevista.mp4.

Uso (desde la raíz del repo):
    .venv-whisper/bin/python work/mcm_entrevista/render.py
Requiere: ffmpeg con libass, numpy, scipy, soundfile, Pillow (venv .venv-whisper).
Temporales en work/mcm_entrevista/build/ (gitignored). No toca raw/.
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
import scipy.signal as ss
from PIL import ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
W = os.path.join(ROOT, 'work')
B = os.path.join(W, 'mcm_entrevista', 'build')
os.makedirs(B, exist_ok=True)
os.makedirs(os.path.join(ROOT, 'final'), exist_ok=True)
SR = 48000
FPS = 25
OUT = os.path.join(ROOT, 'final', 'mcm_entrevista.mp4')
ASS = os.path.join(W, 'mcm_entrevista', 'subs.ass')

FONT_NAME = 'Inter Display'
FONT_FILE = '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'

# ---- parámetros de mezcla ----
VOICE_END_SRC = 80.24      # el whoosh agudo de la placa de El Tiempo arranca en 80.25 (fade de 18 ms antes)
MUSIC_OFFSET = 5.1          # el final natural de la pista (decay ~70,9-73,5) cae en la cola
AMB_BELOW = 22.0           # LU por debajo de la voz (antes del ducking)
MUSIC_SPEECH_BELOW = 19.5  # LU por debajo de la voz (mediana en habla) antes del rider
XF = 0.015                 # crossfade de voz en empalmes
TAIL = 1.4                 # cola musical tras la última palabra (toma 24)


def sh(cmd, **kw):
    print('+', cmd if isinstance(cmd, str) else ' '.join(cmd)[:300], flush=True)
    return subprocess.run(cmd, shell=isinstance(cmd, str), check=True, **kw)


def load(path):
    a, sr = sf.read(path, dtype='float64', always_2d=True)
    assert sr == SR, (path, sr)
    if a.shape[1] == 1:
        a = np.repeat(a, 2, 1)
    return a


def to_wav48(src, dst):
    if not os.path.exists(dst):
        sh(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', dst])
    return load(dst)


# ---------- loudness BS.1770 ----------
def kweight(x):
    # coeficientes para 48 kHz (ITU-R BS.1770)
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return ss.lfilter(b2, a2, ss.lfilter(b1, a1, x, axis=0), axis=0)


def ms_blocks(x, win=0.4, hop=0.1):
    k = kweight(x)
    p = (k ** 2).sum(1)
    n, h = int(win * SR), int(hop * SR)
    c = np.concatenate([[0], np.cumsum(p)])
    starts = np.arange(0, max(1, len(p) - n + 1), h)
    return (c[starts + n] - c[starts]) / n, starts / SR


def lufs(x):
    z, _ = ms_blocks(x)
    z = z[z > 0]
    if not len(z):
        return -99.0
    l = -0.691 + 10 * np.log10(z)
    z = z[l > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[(-0.691 + 10 * np.log10(z)) > rel]
    return -0.691 + 10 * np.log10(z.mean())


def db(g):
    return 10 ** (g / 20)


# ======================================================================
cuts = json.load(open(os.path.join(W, 'eltiempo', 'cuts.json')))
keeps = cuts['keeps']
edl = json.load(open(os.path.join(W, 'mcm_entrevista', 'edl.json')))['shots']
TOTAL = sum(b - a for a, b in keeps) + TAIL
NFR = int(round(TOTAL * FPS))
TOTAL = NFR / FPS
NS = int(round(TOTAL * SR))
print(f'duración total {TOTAL:.3f}s = {NFR} frames')

# offsets de cada keep en tiempo editado
kofs = []
acc = 0.0
for a, b in keeps:
    kofs.append(acc)
    acc += b - a


def src2edit(t):
    for (a, b), o in zip(keeps, kofs):
        if a <= t <= b:
            return o + t - a
    return None


# ---------- 1. VOZ ----------
vsrc = to_wav48(os.path.join(ROOT, 'raw', 'eltiempo.mp4'), os.path.join(B, 'voice_src.wav'))
voice = np.zeros((NS, 2))
h = XF / 2
nxf = int(round(XF * SR))
for i, ((a, b), o) in enumerate(zip(keeps, kofs)):
    first, last = i == 0, i == len(keeps) - 1
    sa = a if first else a - h
    sb = b if last else b + h
    seg = vsrc[int(round(sa * SR)):int(round(sb * SR))].copy()
    if last:  # corte de voz antes del whoosh de la placa final
        cut = int(round((VOICE_END_SRC - sa) * SR))
        nf = int(0.018 * SR)
        seg[cut - nf:cut] *= np.linspace(1, 0, nf)[:, None]
        seg[cut:] = 0
    n = len(seg)
    env = np.ones(n)
    if not first:
        env[:nxf] = np.sin(np.linspace(0, np.pi / 2, nxf)) ** 2   # equal-gain (cos^2) crossfade
    if not last:
        env[-nxf:] = np.cos(np.linspace(0, np.pi / 2, nxf)) ** 2
    d0 = int(round((o - (0 if first else h)) * SR))
    d1 = min(NS, d0 + n)
    voice[d0:d1] += (seg * env[:, None])[:d1 - d0]
# "en Venezuela" llega débil en la fuente: +3 dB desde el final de "hay" (automatización de ganancia)
VZ_FROM = src2edit(79.80)
voice *= db(np.interp(np.arange(NS) / SR, [VZ_FROM - 0.04, VZ_FROM], [0, 3.0]))[:, None]
sf.write(os.path.join(B, 'voice_cat.wav'), voice.astype(np.float32), SR, subtype='FLOAT')

# highpass + compresión suave (gain previo para que el umbral -20 dB trabaje sobre la voz)
pre = -20.0 - lufs(voice) + 4  # voz ~ -16 LUFS antes del compresor
sh(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'voice_cat.wav'), '-af',
    f'volume={pre:.2f}dB,highpass=f=80:poles=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=180:knee=4:detection=rms:makeup=1',
    '-c:a', 'pcm_f32le', os.path.join(B, 'voice_proc.wav')])
vproc = load(os.path.join(B, 'voice_proc.wav'))[:NS]
V_L = lufs(vproc)
print(f'voz procesada {V_L:.2f} LUFS')

# ---------- 5a. palabras -> tiempo editado ----------
tr = json.load(open(os.path.join(W, 'eltiempo', 'transcript.json')))
EXCLUDE = [('¿Por', 13.0), ('qué?', 13.5), ('Termino.', 56.7)]
words = []
for s in tr['segments']:
    for w in s['words']:
        a, b, txt = w['start'], w['end'], w['word'].strip()
        if any(txt == e and abs(a - t) < 1.0 for e, t in EXCLUDE):
            continue
        # solapamiento con keeps
        best = None
        for (ka, kb), o in zip(keeps, kofs):
            ov = min(b, kb) - max(a, ka)
            if ov > 0 and (best is None or ov > best[0]):
                best = (ov, max(a, ka), min(b, kb), ka, o)
        if best is None or (best[0] < 0.12 and best[0] < 0.5 * (b - a)):
            print('  descartada (en corte):', txt, a, b)
            continue
        ov, ca, cb, ka, o = best
        words.append({'w': txt, 's': o + ca - ka, 'e': o + cb - ka, 'src': (a, b)})

# envolvente de energía 10 ms sobre la voz editada
mono = vproc.mean(1)
bh, ah = ss.butter(2, [120, 4000], btype='band', fs=SR)
f = ss.lfilter(bh, ah, mono)
hop = int(0.01 * SR)
nfr = len(f) // hop
E = 10 * np.log10((f[:nfr * hop].reshape(nfr, hop) ** 2).mean(1) + 1e-10)
speech_lvl = np.percentile(E, 90)
floor = np.percentile(E, 8)
THR = max(floor + 10, speech_lvl - 24)
print(f'envolvente: piso {floor:.1f} habla {speech_lvl:.1f} umbral {THR:.1f}')


def Eat(t):
    i = int(t * 100)
    return E[max(0, min(nfr - 1, i))]


def on(t0, t1):  # primer frame >= umbral (2 frames seguidos)
    for i in range(int(t0 * 100), min(nfr - 2, int(t1 * 100))):
        if E[i] > THR and E[i + 1] > THR:
            return i / 100
    return None


# Alineación forzada liviana: Whisper "estira" palabras (absorbe pausas). Se reubica el onset de
# cada palabra por programación dinámica sobre la envolvente de energía (10 ms): prior = tiempo de
# Whisper (+-0,6 s), penaliza onsets en silencio, premia onsets de "islas" de habla y compara la
# duración sonora de cada palabra con la esperada según sus sílabas.
V = (E > THR).astype(float)
CV = np.concatenate([[0], np.cumsum(V)])
isl_on = np.zeros(nfr, bool)
for i in range(6, nfr):
    if V[i] and V[i + 1 if i + 1 < nfr else i] and not V[i - 6:i].any():
        isl_on[i] = True


def syll(w):
    w = w.lower()
    if re.search(r'\d', w):
        return 5
    g = re.findall(r'[aeiouáéíóúü]+', w)
    n = 0
    for x in g:   # hiato con vocal fuerte+fuerte o tilde en débil = 2
        n += 1 + len(re.findall(r'(?<=[aeo])[aeo]|[íú](?=[aeo])|(?<=[aeo])[íú]', x))
    return max(1, n)


SYL = 0.14
nW = len(words)
R = 100  # +-1,0 s
cand = [np.clip(np.arange(int(w['s'] * 100) - R, int(w['s'] * 100) + R + 1), 0, nfr - 2) for w in words]
# Fijaciones manuales (revisadas contra la envolvente: islas de habla tras pausas >0,4 s que el DP
# asignaba a la palabra equivocada). (texto, onset Whisper editado aprox) -> onset real editado
ONSET_FIX = {('irresponsable,', 12.97): 13.62, ('que', 23.72): 24.21, ('Y', 38.05): 38.64,
             # QA fase 5: "y que al final" (ráfagas en 27,48 y 27,68; re-transcripción del recorte)
             ('y', 26.02): 27.46, ('que', 27.44): 27.64,
             # QA fase 5: "Pero ahí se | quebró una" (habla 34,34-34,62 / 34,78-34,88 / 35,54-)
             ('Pero', 34.12): 34.32, ('ahí', 34.38): 34.46, ('se', 34.58): 34.76,
             ('quebró', 34.76): 35.53, ('una', 35.88): 35.86, ('al', 27.6): 28.0,
             # cierre: el realce +3 dB desplazaba el DP; se fija a Whisper/islas (66,56 / 66,68)
             ('en', 66.58): 66.56, ('Venezuela.', 66.70): 66.68}
for (txt, tw), tf in ONSET_FIX.items():
    for i, w in enumerate(words):
        if w['w'] == txt and abs(w['s'] - tw) < 0.1:
            cand[i] = np.array([int(round(tf * 100))])
local = []
for i, w in enumerate(words):
    c = cand[i]
    dev = np.abs(c / 100 - w['s'])
    cost = np.maximum(0, dev - 0.08) * 2.5
    cost += np.where(V[c] > 0, 0, 3.0)
    cost -= np.where(isl_on[c] | isl_on[np.minimum(c + 1, nfr - 1)] | isl_on[np.maximum(c - 1, 0)], 1.2, 0)
    local.append(cost)
exp = [syll(w['w']) * SYL for w in words]
D = [local[0].copy()]
BP = []
for i in range(1, nW):
    a, b = cand[i - 1], cand[i]
    vc = (CV[b[None, :]] - CV[a[:, None]]) / 100       # tiempo sonoro de la palabra i-1
    span = (b[None, :] - a[:, None]) / 100
    dc = np.abs(np.log((np.maximum(vc, 0) + 0.04) / (exp[i - 1] + 0.04))) * 1.6
    tot = D[-1][:, None] + dc + local[i][None, :]
    tot = np.where(span >= 0.07, tot, 1e9)
    k = np.argmin(tot, 0)
    BP.append(k)
    D.append(tot[k, np.arange(len(b))])
# última palabra: duración contra el fin de Whisper
lastc = cand[-1]
vc = (CV[np.full_like(lastc, int(min(nfr - 1, words[-1]['e'] * 100 + 1)))] - CV[lastc]) / 100
D[-1] = D[-1] + np.abs(np.log((np.maximum(vc, 0) + 0.04) / (exp[-1] + 0.04))) * 1.6
j = int(np.argmin(D[-1]))
on_idx = [0] * nW
for i in range(nW - 1, -1, -1):
    on_idx[i] = cand[i][j]
    if i:
        j = BP[i - 1][j]
refine_log = []
for i, w in enumerate(words):
    ns = on_idx[i] / 100 - 0.01
    if abs(ns - w['s']) > 0.04:
        refine_log.append((w['w'], round(w['s'], 2), round(ns, 2)))
    w['s_whisper'] = w['s']
    w['s'] = max(0.0, ns)
print('onsets reubicados (whisper -> energía):', refine_log)
for i, w in enumerate(words):
    nxt = words[i + 1]['s'] if i + 1 < nW else min(TOTAL, w['e'])
    letters = len(re.sub(r'[^\wáéíóúñÁÉÍÓÚÑ]', '', w['w']))
    maxd = min(1.0, max(0.25, 0.12 + 0.075 * letters))
    # fin = último frame sonoro antes del próximo onset
    a_, b_ = int(w['s'] * 100), int(nxt * 100)
    vv = np.nonzero(V[a_:b_])[0]
    e = (a_ + vv[-1]) / 100 + 0.04 if len(vv) else w['s'] + 0.15
    e = min(e, w['s'] + maxd, nxt)
    w['e'] = max(e, min(nxt, w['s'] + 0.12))

# ---------- 5b. bloques ----------
SUB_FS = 64
HOOK_FS = 58
RT_FS = 46


def em_scale(fs):
    f = ImageFont.truetype(FONT_FILE, 100)
    a, d = f.getmetrics()
    return fs * 100 / (a + d)    # libass escala \fs a asc+desc


def text_w(txt, fs, spacing=0):
    f = ImageFont.truetype(FONT_FILE, max(1, int(round(em_scale(fs)))))
    return f.getlength(txt) + spacing * len(txt)


WEAK = {'de', 'la', 'el', 'y', 'que', 'del', 'los', 'las', 'una', 'un', 'al', 'en', 'a', 'o', 'por', 'lo', 'se', 'nos', 'ha', 'no', 'para', 'tan', 'más', 'mucho', 'como', 'cuando', 'hay', 'tanto', 'sí'}
MAXW = 612  # 600 px de caja + tolerancia mínima


def punct(w):
    return w[-1] in '.,;:?!'


# 1) frases: cortar en puntuación y en pausas > 0,45 s
phrases, cur = [], []
for i, w in enumerate(words):
    cur.append(w)
    nxt = words[i + 1] if i + 1 < len(words) else None
    if nxt is None or punct(w['w']):
        phrases.append(cur); cur = []
    elif (nxt['s'] - w['e']) > 0.45 and len(cur) >= 2:
        if w['w'].lower() in WEAK and len(cur) >= 3:   # la palabra débil pasa a la frase siguiente
            phrases.append(cur[:-1]); cur = [cur[-1]]
        else:
            phrases.append(cur); cur = []
# 2) cada frase -> bloques de 2-4 palabras por programación dinámica
def chunk_cost(ch, whole):
    n = len(ch)
    txt = ' '.join(x['w'] for x in ch).upper()
    if text_w(txt, SUB_FS) > MAXW:
        return 1e9
    c = {1: 6.0, 2: 1.0, 3: 0.0, 4: 0.6}[n] if n <= 4 else 1e9
    if n == 1 and len(whole) == 1:
        c = 0
    last = ch[-1]['w']
    if not punct(last) and last.lower().strip('¿?,.') in WEAK:
        c += 6.0          # no terminar bloque en palabra débil
    dur = ch[-1]['e'] - ch[0]['s']
    if dur > 2.2:
        c += (dur - 2.2) * 2
    return c
blocks = []
for ph in phrases:
    n = len(ph)
    best = [0.0] + [1e18] * n
    arg = [0] * (n + 1)
    for j in range(1, n + 1):
        for k in range(max(0, j - 4), j):
            v = best[k] + chunk_cost(ph[k:j], ph)
            if v < best[j]:
                best[j], arg[j] = v, k
    cuts_, j = [], n
    while j > 0:
        cuts_.append((arg[j], j)); j = arg[j]
    for a_, b_ in reversed(cuts_):
        blocks.append(ph[a_:b_])
for bl in blocks:
    print(f"  [{bl[0]['s']:6.2f}-{bl[-1]['e']:6.2f}] " + ' '.join(x['w'] for x in bl))


def ts(t):
    t = max(0, t)
    cs = int(round(t * 100))
    return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'


YEL = '&H0000D4FF&'
ev = []
for bi, bl in enumerate(blocks):
    up = [x['w'].upper() for x in bl]
    bstart = bl[0]['s'] - 0.04
    nxt_start = blocks[bi + 1][0]['s'] - 0.04 if bi + 1 < len(blocks) else TOTAL
    bend = min(bl[-1]['e'] + 0.3, nxt_start)
    if bi + 1 == len(blocks):
        bend = min(bl[-1]['e'] + 0.6, TOTAL)
    # partir en 2 líneas si excede ancho
    def render(hi):
        parts = []
        for j, u in enumerate(up):
            parts.append(('{\\c' + YEL + '}' + u + '{\\c&HFFFFFF&}') if j == hi else u)
        full = ' '.join(up)
        if text_w(full, SUB_FS) > MAXW and len(up) > 1:
            best = min(range(1, len(up)), key=lambda k: abs(text_w(' '.join(up[:k]), SUB_FS) - text_w(' '.join(up[k:]), SUB_FS)))
            return ' '.join(parts[:best]) + '\\N' + ' '.join(parts[best:])
        return ' '.join(parts)
    t = bstart
    for j, x in enumerate(bl):
        if x['s'] > t + 0.005:
            ev.append((t, x['s'], render(-1)))
        we = x['e'] if j + 1 < len(bl) else x['e']
        ev.append((max(t, x['s']), we, render(j)))
        t = we
        if j + 1 < len(bl) and bl[j + 1]['s'] > we + 0.005:
            pass
    if bend > t + 0.005:
        ev.append((t, bend, render(-1)))

# ---------- 6. gráficos ----------
hook_lines = ['ESTO DEPENDE DE NOSOTROS']
if text_w(hook_lines[0], HOOK_FS) > MAXW - 40:
    hook_lines = ['ESTO DEPENDE', 'DE NOSOTROS']
hook_w = max(text_w(l, HOOK_FS) for l in hook_lines)
hook_lh = HOOK_FS * 1.0
hook_h = hook_lh * len(hook_lines)
HY = 180
padx, pady = 26, 16
bx0, bx1 = 360 - hook_w / 2 - padx, 360 + hook_w / 2 + padx
by0, by1 = HY - hook_h / 2 - pady, HY + hook_h / 2 + pady

rt_txt = 'María Corina Machado'
rt_w = text_w(rt_txt, RT_FS)
RY = int(0.44 * 1280)   # con el recorte de la toma 1 corrido a x=650 MCM queda centrada: 0,52 le tapaba la cabeza
rt_h = 68
rx0 = 60
acc_w = 10
rx_text = rx0 + acc_w + 22
rx1 = rx_text + rt_w + 26


def rect(x0, y0, x1, y1):
    return f'm {x0:.0f} {y0:.0f} l {x1:.0f} {y0:.0f} {x1:.0f} {y1:.0f} {x0:.0f} {y1:.0f}'


hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,{FONT_NAME},{SUB_FS},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,5,2,5,60,60,0,1
Style: Hook,{FONT_NAME},{HOOK_FS},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,5,60,60,0,1
Style: Box,{FONT_NAME},20,&H50000000,&H50000000,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Rotulo,{FONT_NAME},{RT_FS},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,0,2,4,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
lines = []
end_all = ts(TOTAL)
# gancho fijo
lines.append(f'Dialogue: 0,0:00:00.00,{end_all},Box,,0,0,0,,{{\\an7\\pos(0,0)\\p1}}{rect(bx0, by0, bx1, by1)}{{\\p0}}')
lines.append(f'Dialogue: 1,0:00:00.00,{end_all},Hook,,0,0,0,,{{\\an5\\pos(360,{HY})}}' + '\\N'.join(hook_lines))
# rótulo
rt_end = ts(3.5)
lines.append(f'Dialogue: 2,0:00:00.00,{rt_end},Box,,0,0,0,,{{\\an7\\pos(0,0)\\fad(250,250)\\1c&H000000&\\1a&H38&\\p1}}{rect(rx0, RY - rt_h / 2, rx1, RY + rt_h / 2)}{{\\p0}}')
lines.append(f'Dialogue: 3,0:00:00.00,{rt_end},Box,,0,0,0,,{{\\an7\\pos(0,0)\\fad(250,250)\\1c{YEL}\\1a&H00&\\p1}}{rect(rx0, RY - rt_h / 2, rx0 + acc_w, RY + rt_h / 2)}{{\\p0}}')
lines.append(f'Dialogue: 4,0:00:00.00,{rt_end},Rotulo,,0,0,0,,{{\\an4\\pos({rx_text},{RY})\\fad(250,250)}}{rt_txt}')
# cuantizar a frames de 25 fps (múltiplos de 4 cs) y encadenar: ningún frame con 2 eventos Sub
qf = lambda t: int(round(t * FPS))
evq = sorted([(qf(a), qf(b), txt) for a, b, txt in ev], key=lambda x: x[0])
sub_ev = []
for i, (a, b, txt) in enumerate(evq):
    if i + 1 < len(evq):
        b = min(b, evq[i + 1][0])
    a = max(a, sub_ev[-1][1]) if sub_ev else a
    if b > a:
        sub_ev.append((a, b, txt))
for i in range(len(sub_ev) - 1):
    assert sub_ev[i][1] <= sub_ev[i + 1][0]
def tsf(f_):
    cs = f_ * 4
    return f'{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}'
for a, b, txt in sub_ev:
    lines.append(f'Dialogue: 5,{tsf(a)},{tsf(b)},Sub,,0,0,0,,{{\\an5\\pos(360,832)}}{txt}')
with open(ASS, 'w', encoding='utf-8') as fh:
    fh.write(hdr + '\n'.join(lines) + '\n')
print('ASS escrito:', ASS, len(ev), 'eventos de subtítulo')
json.dump([{k: v for k, v in w.items()} for w in words], open(os.path.join(B, 'words_edit.json'), 'w'), ensure_ascii=False, indent=1)

# ---------- 3. AMBIENTE ----------
srcs = {c: to_wav48(os.path.join(ROOT, 'raw', f'{c}.mp4'), os.path.join(B, f'{c}_a.wav')) for c in ('mcm_a', 'mcm_b')}
amb = np.zeros((NS, 2))
AXF = 0.2
for k_, sh_ in enumerate(edl):
    if sh_['clip'] == 'convzlacomando':
        continue   # muteado (música agregada)
    src = srcs[sh_['clip']]
    t0 = round(sh_['t_in'] * FPS) / FPS
    t1 = round(sh_['t_out'] * FPS) / FPS
    # junto a una toma muteada (o al inicio/fin) no hay pre-roll: fade-in/out de 0,3 s dentro de la toma
    pre_ = AXF / 2 if (k_ > 0 and edl[k_ - 1]['clip'] != 'convzlacomando') else 0.0
    post_ = AXF / 2 if (k_ + 1 < len(edl) and edl[k_ + 1]['clip'] != 'convzlacomando') else 0.0
    s0 = sh_['src_in'] - pre_
    d0 = t0 - pre_
    dur = (t1 - t0) + pre_ + post_
    i0 = int(round(s0 * SR)); n = int(round(dur * SR))
    seg = np.zeros((n, 2))
    lo = max(0, i0); hi = min(len(src), i0 + n)
    seg[lo - i0:hi - i0] = src[lo:hi]
    L = lufs(seg)
    g = np.clip(-30 - L, -8, 8) if L > -70 else 0
    seg *= db(g)
    nfi = int((AXF if pre_ else 0.3) * SR); nfo = int((AXF if post_ else 0.3) * SR)
    env = np.ones(n)
    env[:nfi] = np.sin(np.linspace(0, np.pi / 2, nfi)) ** 2
    env[-nfo:] = np.cos(np.linspace(0, np.pi / 2, nfo)) ** 2
    seg *= env[:, None]
    p0 = int(round(d0 * SR))
    a_, b_ = max(0, p0), min(NS, p0 + n)
    amb[a_:b_] += seg[a_ - p0:b_ - p0]
amb *= db((V_L - AMB_BELOW) - lufs(amb))
sf.write(os.path.join(B, 'amb_pre.wav'), amb.astype(np.float32), SR, subtype='FLOAT')

# ---------- 4. MÚSICA (pre-nivelado de la curva de la pista) ----------
msrc = to_wav48(os.path.join(W, 'music', 'epic.wav'), os.path.join(B, 'music_src.wav'))
i0 = int(round(MUSIC_OFFSET * SR))
mus = np.zeros((NS, 2))
avail = min(NS, len(msrc) - i0)
mus[:avail] = msrc[i0:i0 + avail]
# loudness de corto plazo (3 s) de la pista -> compresión lenta del crecimiento (70 %)
z, tt = ms_blocks(mus, win=3.0, hop=0.1)
stl = -0.691 + 10 * np.log10(z + 1e-12)
ref = np.median(stl[tt < 30])
gcurve = -1.0 * np.clip(stl - ref, 0, None)       # aplanar los crecimientos de la pista (desde ~48 s)
gcurve = np.convolve(gcurve, np.ones(10) / 10, mode='same')
tc = tt + 1.5
gs = np.interp(np.arange(NS) / SR, tc, gcurve)
mus *= db(gs)[:, None]
sf.write(os.path.join(B, 'music_pre.wav'), mus.astype(np.float32), SR, subtype='FLOAT')

# ---------- ducking con sidechaincompress (key = voz) ----------
sh(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'voice_proc.wav'), '-i', os.path.join(B, 'amb_pre.wav'),
    '-i', os.path.join(B, 'music_pre.wav'), '-filter_complex',
    '[0:a]asplit=2[k1][k2];'
    '[1:a][k1]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=300:knee=3:detection=rms[ad];'
    '[2:a][k2]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=300:knee=4:detection=rms[md]',
    '-map', '[ad]', '-c:a', 'pcm_f32le', os.path.join(B, 'amb_duck.wav'),
    '-map', '[md]', '-c:a', 'pcm_f32le', os.path.join(B, 'music_duck.wav')])
ambd = load(os.path.join(B, 'amb_duck.wav'))[:NS]
musd = load(os.path.join(B, 'music_duck.wav'))[:NS]

# tramos con habla (palabras), en bloques de 400 ms
speech = np.zeros(NS, bool)
for w in words:
    speech[int(w['s'] * SR):int(w['e'] * SR)] = True
last_word_end = words[-1]['e']


def speech_windows(x):
    z, t = ms_blocks(x)
    return z, t


zv, tb = ms_blocks(vproc)
mask = np.array([speech[int(t * SR):int(t * SR) + int(0.4 * SR)].mean() > 0.6 for t in tb])
mask &= (-0.691 + 10 * np.log10(zv + 1e-12)) > V_L - 10
zm, _ = ms_blocks(musd)
LV = -0.691 + 10 * np.log10(zv + 1e-12)
LM = -0.691 + 10 * np.log10(zm + 1e-12)
# ganancia estática para que la música quede MUSIC_SPEECH_BELOW debajo (mediana en habla)
gm = (V_L - MUSIC_SPEECH_BELOW) - np.median(LM[mask])
musd *= db(gm)
# ducking adicional "rider" (música y ambiente): donde haya habla y voz-(música+amb) < 17 LU (ventanas 400 ms),
# se baja la música lo que falte (suavizado ~60 ms / 300 ms). Dos iteraciones.
# cierre: en los últimos 2,5 s la música crece (+6 dB) y el rider se relaja a 15,5 LU
tax = np.arange(NS) / SR
musd *= db(np.interp(tax, [TOTAL - TAIL - 3.2, TOTAL - TAIL - 2.5], [0, 6.0]))[:, None]
tgt = np.where(tb + 0.4 > TOTAL - TAIL - 2.5, 15.5, 17.0)
spk = np.array([speech[int(t * SR):int(t * SR) + int(0.4 * SR)].mean() > 0.3 for t in tb]) & (LV > V_L - 14)
for it in range(3):
    zb_, _ = ms_blocks(ambd + musd)
    need = np.where(spk, np.maximum(0, tgt - (LV - (-0.691 + 10 * np.log10(zb_ + 1e-12)))), 0)
    need = np.maximum.reduce([need, np.roll(need, 1), np.roll(need, -1)])
    gtd = np.interp(np.arange(NS) / SR, tb + 0.2, -need)
    # suavizado asimétrico (ataque rápido, release lento) en 1 kHz
    dec = gtd[::48]
    out = np.zeros_like(dec); cur_ = 0.0
    for q, x in enumerate(dec):
        k_ = 1 - np.exp(-1 / (0.06 * 1000)) if x < cur_ else 1 - np.exp(-1 / (0.3 * 1000))
        cur_ += (x - cur_) * k_; out[q] = cur_
    # adelantar 40 ms (look-ahead) para que el ataque llegue a tiempo
    out = np.concatenate([out[40:], np.full(40, out[-1])])
    gr_ = db(np.interp(np.arange(NS), np.arange(len(out)) * 48, out))[:, None]
    musd *= gr_
    ambd *= gr_
# cierre: después de la última palabra la música sube a protagonista; red de seguridad fade-out 0,5 s
tax = np.arange(NS) / SR
boost = np.interp(tax, [last_word_end + 0.02, last_word_end + 0.2], [0, 12.0])
fo = np.interp(tax, [TOTAL - 0.8, TOTAL], [1, 0])
musd *= (db(boost) * fo)[:, None]
ambd *= np.interp(tax, [TOTAL - 0.8, TOTAL], [1, 0])[:, None]

bed = ambd + musd
mix = vproc + bed
zb, _ = ms_blocks(bed)
LB = -0.691 + 10 * np.log10(zb + 1e-12)
diff = (LV - LB)[mask]
stats = {'voice_LUFS_pre': round(V_L, 2), 'music_gain_db': round(float(gm), 2),
         'speech_windows': int(mask.sum()), 'voice_minus_bed_min': round(float(diff.min()), 1),
         'p5': round(float(np.percentile(diff, 5)), 1), 'median': round(float(np.median(diff)), 1),
         'last_word_end': round(last_word_end, 2)}
worst = np.argsort(diff)[:5]
stats['worst_at'] = [round(float(tb[mask][k]), 1) for k in worst]
print('voz vs (música+ambiente) en habla:', stats)
sf.write(os.path.join(B, 'mix_pre.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for nm, x in (('voice', vproc), ('bed', bed), ('music', musd), ('amb', ambd)):
    sf.write(os.path.join(B, f'stem_{nm}.wav'), x.astype(np.float32), SR, subtype='FLOAT')

# ---------- loudnorm two-pass ----------
# pre-ganancia a ~-14 LUFS + limitador sobremuestreado x4 (true peak) para que loudnorm quede lineal
g0 = -14.0 - lufs(mix)
sh(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(B, 'mix_pre.wav'), '-af',
    f'volume={g0:.2f}dB,aresample=192000:resampler=soxr,alimiter=limit=0.75:attack=2:release=60:level=disabled,aresample=48000:resampler=soxr',
    '-c:a', 'pcm_f32le', os.path.join(B, 'mix_lim.wav')])
r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', os.path.join(B, 'mix_lim.wav'), '-af',
                    'loudnorm=I=-14:TP=-1.5:LRA=20:print_format=json', '-f', 'null', '-'],
                   capture_output=True, text=True, check=True)
m = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=20:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', os.path.join(B, 'mix_lim.wav'), '-af', ln, '-ar', str(SR),
                    '-c:a', 'pcm_f32le', os.path.join(B, 'mix_final.wav')], capture_output=True, text=True, check=True)
m2 = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
print('loudnorm pass2:', {k: m2[k] for k in ('output_i', 'output_tp', 'normalization_type')})
stats['loudnorm'] = {k: m2[k] for k in ('output_i', 'output_tp', 'normalization_type')}
json.dump(stats, open(os.path.join(B, 'audio_stats.json'), 'w'), indent=1)

# ---------- 2. VIDEO ----------
if os.environ.get('SKIP_VIDEO'):
    sys.exit(0)
MODES = ['in', 'out', 'panR', 'inUp', 'out', 'panL']


def kb(mode):
    # (z0, z1, dx0, dx1, dy0, dy1)  dx,dy en fracción de W/H; |d| <= (1-1/z)/2
    return {'in': (1.00, 1.06, 0, 0, 0, 0),
            'out': (1.06, 1.00, 0, 0, 0, 0),
            'panR': (1.055, 1.06, -0.018, 0.018, 0, 0),
            'panL': (1.06, 1.055, 0.018, -0.018, 0, 0),
            'inUp': (1.00, 1.06, 0, 0, 0, -0.014)}[mode]


# Seguimiento de MCM en la toma 23 (src 63,3-66,0): la cámara la deja salir por la derecha con el
# recorte fijo x=560 de la EDL. Centros medidos sobre fotogramas de raw/mcm_b.mp4 (px de origen).
# QA fase 5: en la toma 1 con x=560 asomaba arriba a la izq. una valla publicitaria (src x 360-440 en 60,6 s,
# luego se va a la izquierda). Con centro 650 (recorte 448-852) queda fuera y MCM sigue en cuadro.
CROP_FIX = {1: 650}
TRACK = {23: [(63.3, 600), (64.0, 604), (64.6, 640), (65.2, 744), (65.6, 800), (66.0, 824)]}
inputs, chains = [], []
frame_log = []
dims = {'convzlacomando': (720, 1280), 'mcm_a': (576, 1024), 'mcm_b': (1276, 718)}
for k, s in enumerate(edl):
    f0 = int(round(s['t_in'] * FPS)); f1 = int(round(s['t_out'] * FPS))
    N = f1 - f0
    frame_log.append((s['n'], f0, f1, N))
    clip = s['clip']
    inputs += ['-ss', f"{s['src_in']:.3f}", '-t', f"{N / FPS + 0.6:.3f}", '-i', os.path.join(ROOT, 'raw', f'{clip}.mp4')]
    c = f'[{k}:v]setpts=PTS-STARTPTS,'
    Wp = 1440
    track = TRACK.get(s['n'])
    if clip == 'mcm_b':
        cw = 404
        if track:   # recorte ancho + paneo subpíxel dentro de perspective (sin jitter)
            xs = [x_ for _, x_ in track]
            xa = int(max(0, min(xs) - cw / 2)); xb = int(min(1276, max(xs) + cw / 2 + 1))
            xa -= xa % 2; cwid = xb - xa; cwid += cwid % 2
            c += f'crop={cwid}:718:{xa}:0,'
            Wp = int(round(cwid * 2560 / 718 / 2)) * 2
            sfx = Wp / cwid
            pp = np.array([(t_ - s['src_in']) / (s['src_out'] - s['src_in']) for t_, _ in track])
            co = np.polyfit(pp, (np.array(xs) - xa) * sfx, 3)  # suave; se recorta con max/min abajo
        else:
            cxc = CROP_FIX.get(s['n'], s['crop_x_center'])
            x = int(round(min(max(cxc - cw / 2, 0), 1276 - cw)))
            c += f'crop={cw}:718:{x}:0,'
    if clip == 'mcm_a':
        c += f'setpts=N/{FPS}/TB,'   # retime 24,935->25 fps 1:1 (0,26 % más rápido, sin duplicar frames)
    c += f'scale={Wp}:2560:flags=lanczos,setsar=1,format=yuv444p,'
    z0, z1, dx0, dx1, dy0, dy1 = kb(MODES[k % len(MODES)])
    M = max(1, N - 1)
    P = f'(in/{M})'
    Z = f'({z0}+{z1 - z0:.4f}*{P})'
    if track:
        a3, a2, a1, a0 = co
        CX = f'({a0:.3f}+{a1:.3f}*{P}+{a2:.3f}*{P}*{P}+{a3:.3f}*{P}*{P}*{P}+1440*({dx0}+{dx1 - dx0:.4f}*{P}))'
        CX = CX.replace('+-', '-')
    else:
        CX = f'(1440*(0.5+{dx0}+{dx1 - dx0:.4f}*{P}))'
    CY = f'(H*(0.5+{dy0}+{dy1 - dy0:.4f}*{P}))'
    HW = f'(720/{Z})'
    HH = f'(1280/{Z})'
    if track:   # el centro nunca deja salir el recorte del cuadro
        CX = f'max({HW},min({Wp}-{HW},{CX}))'
    c += (f"perspective=x0='{CX}-{HW}':y0='{CY}-{HH}':x1='{CX}+{HW}':y1='{CY}-{HH}':"
          f"x2='{CX}-{HW}':y2='{CY}+{HH}':x3='{CX}+{HW}':y3='{CY}+{HH}':interpolation=cubic:eval=frame,")
    c += f'scale=720:1280:flags=lanczos,setsar=1,trim=end_frame={N},setpts=N/{FPS}/TB[v{k}]'
    chains.append(c)
assert sum(x[3] for x in frame_log) == NFR, (sum(x[3] for x in frame_log), NFR)
fc = ';'.join(chains) + ';' + ''.join(f'[v{k}]' for k in range(len(edl))) + \
    f'concat=n={len(edl)}:v=1:a=0,format=yuv420p,subtitles=filename={ASS}:fontsdir=/usr/share/fonts/opentype/inter[vout]'
open(os.path.join(B, 'filter_video.txt'), 'w').write(fc)
json.dump(frame_log, open(os.path.join(B, 'frames.json'), 'w'))
na = len(edl)
cmd = ['ffmpeg', '-hide_banner', '-y'] + inputs + ['-i', os.path.join(B, 'mix_final.wav'),
       '-filter_complex_script', os.path.join(B, 'filter_video.txt'),
       '-map', '[vout]', '-map', f'{na}:a', '-r', str(FPS), '-frames:v', str(NFR),
       '-c:v', 'libx264', '-crf', '19', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
       '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-t', f'{TOTAL:.3f}',
       '-movflags', '+faststart', OUT]
sh(cmd)
print('OK ->', OUT)
