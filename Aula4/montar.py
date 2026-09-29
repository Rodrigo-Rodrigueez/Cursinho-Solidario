#!/usr/bin/env python3
"""Monta slides_ondas.html a partir de src/: injeta os scripts e embute os
recortes das questoes (figuras/q*.png) em base64, para o deck abrir como
um arquivo unico. Procedencia dos recortes: figuras/FONTES.md."""
import base64, glob, json, os

AQUI = os.path.dirname(os.path.abspath(__file__))
src = lambda n: open(os.path.join(AQUI, 'src', n), encoding='utf-8').read()

html = src('deck.html')
usados = set(__import__('re').findall(r'data-img="([^"]+)"', html))
qimg = {}
for f in sorted(glob.glob(os.path.join(AQUI, 'figuras', 'q*.png'))):
    nome = os.path.splitext(os.path.basename(f))[0]
    if nome not in usados:          # recorte guardado, mas fora do deck
        continue
    qimg[nome] = 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
blocos = {
    '/*@FISICA@*/': src('fisica.js'),
    '/*@QIMG@*/': '/* Recortes das provas (figuras/FONTES.md) */\nvar QIMG = ' +
                  json.dumps(qimg, indent=0) + ';',
    '/*@MOTOR@*/': src('motor.js'),
    '/*@SIMS2D@*/': src('sims2d.js'),
    '/*@SIMS3D@*/': src('sims3d.js'),
    '/*@INICIO@*/': src('inicio.js'),
}
for k, v in blocos.items():
    assert k in html, k
    html = html.replace(k, v)
faltam = [n for n in usados if n not in qimg]
assert not faltam, 'recortes faltando: %s' % faltam
out = os.path.join(AQUI, 'slides_ondas.html')
open(out, 'w', encoding='utf-8').write(html)
print('%s: %.1f MB, %d recortes' % (os.path.basename(out), len(html) / 1e6, len(qimg)))
