"use strict";
/* =================================================================
   PRANCHAS 2D — canvas desenhado por JS, relogio e transicoes GSAP.
   Toda grandeza fisica mostrada vem de Fisica.*; aqui so se desenha.
   ================================================================= */

/* transicao de parametro: some com prefers-reduced-motion */
function tween(obj, props, L){
  return gsap.to(obj, Object.assign({duration: REDUZIR || IMPRIMIR ? 0 : .7, ease: 'power2.inOut',
    onUpdate: function(){ if (L) L.agita(); }}, props));
}

/* ---------------------------------------------------------------
   CAPA — interferencia de duas fontes, em linhas de cianotipia
   --------------------------------------------------------------- */
SIM.capa = function(fig){
  var c = document.createElement('canvas');
  fig.appendChild(c);
  var W = 400, H = 225;                      /* campo em baixa resolucao, esticado */
  c.width = W; c.height = H;
  c.style.imageRendering = 'auto';
  var g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  var F = [{x: 300, y: 70, fase: 0}, {x: 352, y: 128, fase: 0}];
  var lam = 15;
  /* mascara: o campo esmaece sob o titulo (esquerda-baixo) */
  var mask = new Float32Array(W * H);
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++){
    var u = x / W, v = y / H;
    mask[y * W + x] = clamp(.15 + 1.25 * u - .55 * v * (1 - u), 0, 1);
  }
  var L = laco(function(t){
    var k = 0;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++, k++){
      var s = Fisica.cuba(x, y, F, lam, .35, t) / 2;
      var crista = Math.pow(clamp((s + 1) / 2, 0, 1), 3);
      var a = mask[k] * crista;
      d[k * 4]     = 18 + a * (143 - 18);
      d[k * 4 + 1] = 58 + a * (179 - 58);
      d[k * 4 + 2] = 99 + a * (212 - 99);
      d[k * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    /* as fontes: dois pontos quentes */
    F.forEach(function(p){
      g.fillStyle = COR.laser; g.beginPath(); g.arc(p.x, p.y, 1.8, 0, 7); g.fill();
    });
  });
  return L;
};

/* ---------------------------------------------------------------
   PULSO — a corda: a perturbacao anda, o ponto so sobe e desce
   --------------------------------------------------------------- */
SIM.pulso = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var N = 56, x0 = 70, x1 = w - 70, yc = h * .5, marc = 20;
  var PX = 100;                               /* 100 px = 1 m */
  var modo = 'continuo', tp = -99, trilha = [];
  var st = {A: 90};
  var vpx = 260, lam = 380, f = vpx / lam;
  function y(x, t){
    if (modo === 'continuo') return Fisica.onda(x - x0, t, st.A, lam, f);
    var s = 55, c = x0 - 3 * s + vpx * (t - tp);
    return st.A * Math.exp(-Math.pow(x - c, 2) / (2 * s * s));
  }
  var L = laco(function(t){
    T.limpa();
    if (modo === 'pulso' && vpx * (t - tp) > (x1 - x0) + 400) tp = t + .6;
    /* eixo de repouso */
    g.strokeStyle = rgba(COR.traco, .35); g.setLineDash([6, 8]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x0 - 30, yc); g.lineTo(x1 + 30, yc); g.stroke(); g.setLineDash([]);
    /* corda */
    g.strokeStyle = COR.traco; g.lineWidth = 3; g.beginPath();
    for (var X = x0; X <= x1; X += 4){ var Y = yc - y(X, t); X === x0 ? g.moveTo(X, Y) : g.lineTo(X, Y); }
    g.stroke();
    var xm = x0 + (x1 - x0) * marc / (N - 1), ym = yc - y(xm, t);
    /* trilha vertical do ponto marcado */
    trilha.push(ym); if (trilha.length > 28) trilha.shift();
    trilha.forEach(function(yy, k){
      g.fillStyle = rgba(COR.laser, .08 + .3 * k / trilha.length);
      g.beginPath(); g.arc(xm, yy, 4, 0, 7); g.fill();
    });
    g.strokeStyle = rgba(COR.laser, .35); g.lineWidth = 1.5; g.setLineDash([4, 6]);
    g.beginPath(); g.moveTo(xm, yc - st.A - 26); g.lineTo(xm, yc + st.A + 26); g.stroke(); g.setLineDash([]);
    /* contas */
    for (var i = 0; i < N; i++){
      var X = x0 + (x1 - x0) * i / (N - 1), Y = yc - y(X, t);
      g.fillStyle = i === marc ? COR.laser : COR.folha;
      g.beginPath(); g.arc(X, Y, i === marc ? 11 : 5, 0, 7); g.fill();
    }
    seta(g, xm + 36, yc - 40, xm + 36, yc - st.A - 20, COR.laser, 2.5);
    seta(g, xm + 36, yc + 40, xm + 36, yc + st.A + 20, COR.laser, 2.5);
    texto(g, 'só oscila', xm, yc - st.A - 52, COR.laser, 19, 'center');
    /* seta de propagacao */
    var ya = h - 110;
    seta(g, x0, ya, x0 + 330, ya, COR.folha, 2.5, 14);
    texto(g, 'a energia viaja: ' + fmt(vpx / PX, 1) + ' m/s', x0, ya - 26, COR.folha, 19);
  });
  botoes(fig, 'acao', function(v){
    if (v === 'pulso'){ modo = 'pulso'; tp = L.tempo(); }
    else modo = 'continuo';
    trilha = []; L.agita();
    etiqueta(fig, modo === 'pulso' ? 'pulso único\nponto laranja: sobe, desce e volta' : 'onda contínua\nf = ' + fmt(f, 2) + ' Hz · λ = ' + fmt(lam / PX, 1) + ' m');
  });
  etiqueta(fig, 'onda contínua\nf = ' + fmt(f, 2) + ' Hz · λ = ' + fmt(lam / PX, 1) + ' m');
  return L;
};

/* ---------------------------------------------------------------
   TRANSVERSAL x LONGITUDINAL
   --------------------------------------------------------------- */
SIM.translong = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var x0 = 60, x1 = w - 60, lam = 300, f = .45, A = 60;
  var y1 = h * .27, y2 = h * .70;
  var cols = 46, rows = 7, mk = 17;
  var L = laco(function(t){
    T.limpa();
    /* rotulos */
    texto(g, 'TRANSVERSAL', x0, 36, COR.traco, 17);
    texto(g, 'vibra na vertical, anda na horizontal', x0 + 150, 36, COR.folha2, 17);
    texto(g, 'LONGITUDINAL', x0, h * .47, COR.traco, 17);
    texto(g, 'vibra e anda na mesma direção', x0 + 158, h * .47, COR.folha2, 17);
    /* transversal: fila de particulas deslocadas em y */
    for (var i = 0; i < cols; i++){
      var X = x0 + (x1 - x0) * i / (cols - 1), Y = y1 - Fisica.onda(X, t, A, lam, f);
      g.fillStyle = i === mk ? COR.laser : COR.folha;
      g.beginPath(); g.arc(X, Y, i === mk ? 9 : 5.5, 0, 7); g.fill();
    }
    /* longitudinal: grade deslocada em x -> compressoes */
    var dx = (x1 - x0) / (cols - 1);
    for (var r = 0; r < rows; r++){
      for (var j = 0; j < cols + 2; j++){
        /* A = 0,75 lam/2pi: forte, mas |ds/dx| < 1, particulas nunca se cruzam */
        var xe = x0 + dx * (j - 1), s = .75 * lam / Fisica.TAU * Math.sin(Fisica.TAU * (xe / lam - f * t));
        var X2 = xe + s, Y2 = y2 - 88 + r * 29 + ((j % 2) ? 6 : 0);
        if (X2 < x0 - 8 || X2 > x1 + 8) continue;
        var alvo = (j - 1) === mk && r === 3;
        g.fillStyle = alvo ? COR.laser : rgba(COR.folha, .85);
        g.beginPath(); g.arc(X2, Y2, alvo ? 9 : 4.5, 0, 7); g.fill();
      }
    }
    /* marcas de compressao: onde a densidade e maxima (derivada de s negativa) */
    for (var n = -2; n < 8; n++){
      var xc = lam * (n + f * t) + lam / 2;       /* compressao: ds/dx minimo */
      if (xc < x0 || xc > x1) continue;
      texto(g, 'C', xc, y2 + 128, COR.laser, 18, 'center');
      if (xc + lam / 2 < x1) texto(g, 'R', xc + lam / 2, y2 + 128, COR.traco, 18, 'center');
    }
    texto(g, 'C = compressão   R = rarefação', x1, y2 + 162, COR.folha2, 16, 'right');
  });
  etiqueta(fig, '');
  return L;
};

/* ---------------------------------------------------------------
   ESPECTRO — escala logaritmica de lambda, com a faixa visivel aberta
   --------------------------------------------------------------- */
SIM.espectro = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var x0 = 50, x1 = w - 50, W = x1 - x0;
  function X(lam){ return x0 + (3 - Math.log10(lam)) / 15 * W; }     /* 1e3 m ... 1e-12 m */
  var faixas = [
    ['rádio', 1e3, 1], ['micro-ondas', 1, 1e-3], ['infravermelho', 1e-3, 7e-7],
    ['', 7e-7, 4e-7], ['ultravioleta', 4e-7, 1e-8], ['raios X', 1e-8, 1e-11], ['gama', 1e-11, 1e-12]
  ];
  /* forno, wi-fi e controle de drone: 2,4 GHz, lambda = 12 cm */
  var marcas = [['rádio FM · 100 MHz', 3], ['forno, wi-fi, drone', .122], ['controle da TV', 9.4e-7], ['raio X médico', 1e-10]];
  var yb = 210, hb = 56;
  var L = laco(function(t){
    T.limpa();
    /* onda "chirp": lambda encolhe da esquerda para a direita */
    g.strokeStyle = COR.traco; g.lineWidth = 2.2; g.beginPath();
    var ph = -t * 2.2;
    for (var x = x0; x <= x1; x += 1){
      var u = (x - x0) / W, lpx = 260 * Math.pow(6 / 260, u);
      ph += Fisica.TAU / lpx;
      var y = 96 - 38 * Math.sin(ph);
      x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    texto(g, 'λ grande · f baixa · pouca energia', x0, 40, COR.folha2, 16);
    texto(g, 'λ pequeno · f alta · muita energia', x1, 40, COR.folha2, 16, 'right');
    /* faixas */
    faixas.forEach(function(F, i){
      var a = X(F[1]), b = X(F[2]);
      if (F[0] === ''){
        var gr = g.createLinearGradient(a, 0, b, 0);
        for (var k = 0; k <= 10; k++){ var c = Fisica.corDoComprimento(700 - 30 * k);
          gr.addColorStop(k / 10, 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')'); }
        g.fillStyle = gr;
      } else g.fillStyle = i % 2 ? rgba(COR.traco, .16) : rgba(COR.traco, .28);
      g.fillRect(a, yb, b - a, hb);
      if (F[0]) texto(g, F[0], (a + b) / 2, yb + hb / 2, COR.folha, 17, 'center');
    });
    /* eixo de lambda */
    g.strokeStyle = COR.traco; g.lineWidth = 1.5;
    for (var e = 3; e >= -12; e -= 3){
      var xe = X(Math.pow(10, e));
      g.beginPath(); g.moveTo(xe, yb + hb); g.lineTo(xe, yb + hb + 10); g.stroke();
      var rot = e === 0 ? '1 m' : e === 3 ? '1 km' : e === -3 ? '1 mm' : e === -6 ? '1 μm' : e === -9 ? '1 nm' : '10⁻¹² m';
      texto(g, rot, xe, yb + hb + 28, COR.folha2, 16, 'center');
    }
    /* marcas de aparelhos */
    marcas.forEach(function(m, i){
      var xm = X(m[1]), yy = yb - 16 - (i % 2) * 26;
      g.strokeStyle = COR.laser; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xm, yy + 6); g.lineTo(xm, yb); g.stroke();
      texto(g, m[0], xm + (i === 0 ? -6 : i === 1 ? 6 : 0), yy - 6, COR.laser, 16, i === 0 ? 'right' : i === 1 ? 'left' : i === 3 ? 'right' : 'center');
    });
    /* lupa na faixa visivel */
    var va = X(7e-7), vb = X(4e-7), zy = yb + hb + 90, zh = 70;
    g.strokeStyle = rgba(COR.folha, .5); g.lineWidth = 1; g.setLineDash([4, 5]);
    g.beginPath(); g.moveTo(va, yb + hb); g.lineTo(x0 + 120, zy); g.moveTo(vb, yb + hb); g.lineTo(x1 - 120, zy); g.stroke();
    g.setLineDash([]);
    var zx0 = x0 + 120, zx1 = x1 - 120;
    for (var xx = zx0; xx < zx1; xx++){
      var nm = 700 - 300 * (xx - zx0) / (zx1 - zx0), c = Fisica.corDoComprimento(nm);
      g.fillStyle = 'rgb(' + (c[0] * 255 | 0) + ',' + (c[1] * 255 | 0) + ',' + (c[2] * 255 | 0) + ')';
      g.fillRect(xx, zy, 1.5, zh);
    }
    [700, 600, 500, 400].forEach(function(nm){
      var xx = zx0 + (700 - nm) / 300 * (zx1 - zx0);
      g.strokeStyle = COR.folha; g.beginPath(); g.moveTo(xx, zy + zh); g.lineTo(xx, zy + zh + 10); g.stroke();
      texto(g, nm + ' nm', xx, zy + zh + 28, COR.folha, 17, 'center');
    });
    texto(g, 'vermelho', zx0, zy - 16, COR.folha2, 16);
    texto(g, 'violeta', zx1, zy - 16, COR.folha2, 16, 'right');
    texto(g, 'LUZ VISÍVEL', (zx0 + zx1) / 2, zy - 16, COR.folha, 17, 'center');
  });
  etiqueta(fig, 'todas no vácuo: c = 3 × 10⁸ m/s\nc = λ · f');
  return L;
};

/* ---------------------------------------------------------------
   GRANDEZAS — A e lambda na foto; T no grafico do tempo
   --------------------------------------------------------------- */
SIM.grandezas = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var PX = 100, A = 110, lam = 360, f = .25, x0 = 40, x1 = w - 40, yc = h * .32;
  var tx0 = 90, tx1 = w - 60, ty = h * .79, ta = 58, tjan = 8;     /* grafico y(t), 8 s */
  var xp = x0 + 470;                                              /* ponto P observado */
  var L = laco(function(t){
    T.limpa();
    texto(g, 'FOTO DA ONDA · y × x', x1, 26, COR.traco, 16, 'right');
    g.strokeStyle = rgba(COR.traco, .35); g.setLineDash([6, 8]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x0, yc); g.lineTo(x1, yc); g.stroke(); g.setLineDash([]);
    g.strokeStyle = COR.folha; g.lineWidth = 3; g.beginPath();
    for (var x = x0; x <= x1; x += 3){ var y = yc - Fisica.onda(x - x0, t, A, lam, f); x === x0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    /* cristas: onda(x) = A quando (x-x0)/lam - f t = 1/4 + n */
    var cr = [];
    for (var n = -2; n < 6; n++){ var xc = x0 + lam * (.25 + f * t + n); if (xc > x0 + 20 && xc < x1 - 20) cr.push(xc); }
    if (cr.length >= 2) cota(g, cr[0], yc - A - 34, cr[1], yc - A - 34, 'λ');
    if (cr.length >= 1){
      var xa = cr[cr.length - 1];
      cota(g, xa, yc, xa, yc - A, 'A', COR.laser, 'e');
    }
    /* ponto P */
    var yp = yc - Fisica.onda(xp - x0, t, A, lam, f);
    g.fillStyle = COR.laser; g.beginPath(); g.arc(xp, yp, 10, 0, 7); g.fill();
    texto(g, 'P', xp - 26, yp, COR.laser, 20, 'center');
    /* grafico no tempo do ponto P */
    texto(g, 'O PONTO P AO LONGO DO TEMPO · y × t', tx1, ty + ta + 56, COR.traco, 16, 'right');
    g.strokeStyle = rgba(COR.traco, .5); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(tx0, ty); g.lineTo(tx1, ty); g.moveTo(tx0, ty - ta - 16); g.lineTo(tx0, ty + ta + 16); g.stroke();
    texto(g, 't (s)', tx1, ty + 22, COR.folha2, 16, 'right');
    for (var s = 0; s <= tjan; s += 2) texto(g, String(s), tx0 + (tx1 - tx0) * s / tjan, ty + ta + 28, COR.folha2, 15, 'center');
    g.strokeStyle = COR.laser; g.lineWidth = 2.5; g.beginPath();
    var tfim = REDUZIR || IMPRIMIR ? tjan : Math.min(t % 12, tjan);
    for (var k = 0; k <= 400; k++){
      var tt = tjan * k / 400; if (tt > tfim) break;
      var X = tx0 + (tx1 - tx0) * k / 400, Y = ty - ta * Math.sin(Fisica.TAU * ((xp - x0) / lam - f * tt));
      k ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.stroke();
    if (tfim >= 5){
      var tpk = function(m){ return ((xp - x0) / lam - .25 - m) / f; };      /* maximos de y(t) */
      var picos = [];
      for (var m = -10; m < 10; m++){ var tk = tpk(m); if (tk > 0 && tk < tfim) picos.push(tk); }
      picos.sort(function(a, b){ return a - b; });
      if (picos.length >= 2){
        var X0 = tx0 + (tx1 - tx0) * picos[0] / tjan, X1 = tx0 + (tx1 - tx0) * picos[1] / tjan;
        cota(g, X0, ty - ta - 20, X1, ty - ta - 20, 'T');
      }
    }
  });
  etiqueta(fig, 'A = ' + fmt(A / PX, 1) + ' m · λ = ' + fmt(lam / PX, 1) + ' m\nT = ' + fmt(1 / f, 0) + ' s · f = ' + fmt(f, 2) + ' Hz');
  return L;
};

/* ---------------------------------------------------------------
   v = lambda f — a fonte dita f, o meio dita v
   --------------------------------------------------------------- */
SIM.vlf = function(fig){
  /* Tres faixas, uma fonte: a mesma f vai para ar, agua e aco.
     O desenho usa uma escala unica (PXM px por metro), entao a
     diferenca de lambda na tela e a diferenca real. O tempo e
     desacelerado (FV): 1 000 Hz viram ~0,6 oscilacao por segundo,
     igual nas tres faixas, porque f e da fonte. */
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var PXM = 120, FV = .0006, x0 = 130, x1 = w - 36, A = 40;
  var ORDEM = ['ar', 'agua', 'aco'];
  var yc = [h * .27, h * .53, h * .79];
  var st = {f: 1000}, ph = 0, fAlvo = 1000;
  var L = laco(function(t, dt){
    T.limpa();
    ph += Fisica.TAU * st.f * FV * dt;
    /* a fonte: um alto-falante que empurra as tres faixas ao mesmo tempo */
    var m = 8 * Math.sin(ph);
    g.fillStyle = COR.folha2; g.fillRect(26, yc[0] - 30, 26, yc[2] - yc[0] + 60);
    g.fillStyle = COR.laser; g.fillRect(56 + m, yc[0] - 30, 10, yc[2] - yc[0] + 60);
    texto(g, 'uma', 46, yc[2] + 64, COR.folha2, 15, 'center');
    texto(g, 'fonte só', 46, yc[2] + 84, COR.folha2, 15, 'center');
    ORDEM.forEach(function(k, i){
      var M = Fisica.MEIOS[k], lm = Fisica.comprimento(M.v, st.f), lpx = lm * PXM, y0 = yc[i];
      g.fillStyle = rgba(COR.traco, .05 + .06 * i); g.fillRect(x0 - 20, y0 - A - 44, x1 - x0 + 30, 2 * A + 70);
      texto(g, M.nome.toUpperCase(), x0 - 8, y0 - A - 26, COR.folha, 18);
      texto(g, 'v = ' + milhar(M.v) + ' m/s', x0 + 80, y0 - A - 26, COR.folha2, 16);
      g.strokeStyle = rgba(COR.traco, .35); g.setLineDash([5, 7]); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke(); g.setLineDash([]);
      g.strokeStyle = COR.folha; g.lineWidth = 3; g.beginPath();
      for (var x = x0; x <= x1; x += 2){
        var y = y0 - A * Math.sin(ph - Fisica.TAU * (x - x0) / lpx);
        x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      /* ponto na saida da fonte: sobe e desce igual nas tres faixas */
      g.fillStyle = COR.laser; g.beginPath(); g.arc(x0, y0 - A * Math.sin(ph), 7, 0, 7); g.fill();
      /* cota de lambda, fixa, a partir da fonte */
      var xf = Math.min(x0 + lpx, x1);
      cota(g, x0, y0 + A + 16, xf, y0 + A + 16, '', COR.laser);
      texto(g, 'λ = ' + fmt(lm, 2) + ' m', Math.min(x0 + lpx / 2, x1 - 70), y0 + A + 36, COR.laser, 17, 'center');
    });
  });
  function rot(){ etiqueta(fig, 'f = ' + milhar(fAlvo) + ' Hz nos três meios\n(quem decide a frequência é a fonte)'); }
  fAlvo = st.f = faixa('vlf-f', function(v){
    fAlvo = v; rot();
    tween(st, {f: v, duration: REDUZIR || IMPRIMIR ? 0 : .4}, L);
  });
  rot();
  return L;
};

/* ---------------------------------------------------------------
   REFLEXAO NA CORDA — ponta presa inverte, ponta solta nao
   --------------------------------------------------------------- */
SIM.reflexao = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var x0 = 50, xL = w - 150, yc = h * .45, A = 95, s = 42, c = 300;
  var ponta = 'fixa', t0 = -1.6;          /* parado: pulso a caminho da parede */
  function pulso(x){ return A * Math.exp(-x * x / (2 * s * s)); }
  var L = laco(function(t){
    T.limpa();
    var tt = t - t0;
    if (c * tt > 2 * (xL - x0) + 300) t0 = t + .5;
    var sg = ponta === 'fixa' ? -1 : 1, xi = x0 - 3 * s;
    /* suporte */
    if (ponta === 'fixa'){
      g.fillStyle = COR.folha2; g.fillRect(xL, yc - 150, 26, 300);
      g.strokeStyle = COR.fundo; g.lineWidth = 2;
      for (var k = -150; k < 150; k += 18){ g.beginPath(); g.moveTo(xL + 26, yc + k); g.lineTo(xL + 8, yc + k + 18); g.stroke(); }
    } else {
      g.strokeStyle = COR.folha2; g.lineWidth = 5;
      g.beginPath(); g.moveTo(xL + 10, yc - 170); g.lineTo(xL + 10, yc + 170); g.stroke();
    }
    g.strokeStyle = COR.traco; g.lineWidth = 3; g.beginPath();
    var yEnd = 0;
    for (var x = x0; x <= xL; x += 3){
      var ida = pulso(x - xi - c * tt), volta = sg * pulso((2 * xL - x) - xi - c * tt);
      var y = yc - (ida + volta);
      x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      yEnd = y;
    }
    g.lineTo(xL + (ponta === 'fixa' ? 0 : 10), yEnd); g.stroke();
    if (ponta === 'livre'){ g.strokeStyle = COR.laser; g.lineWidth = 4; g.beginPath(); g.arc(xL + 10, yEnd, 11, 0, 7); g.stroke(); }
    var foi = xi + c * tt > xL;
    texto(g, foi ? 'volta ' + (ponta === 'fixa' ? 'INVERTIDO' : 'do mesmo lado') : 'ida', x0 + 70, h - 90, foi ? COR.laser : COR.folha, 22);
    if (foi) seta(g, x0 + 58, h - 90, x0 + 8, h - 90, COR.laser, 3); else seta(g, x0 + 8, h - 90, x0 + 58, h - 90, COR.folha, 3);
  });
  botoes(fig, 'ponta', function(v){ ponta = v; t0 = L.tempo(); L.agita();
    etiqueta(fig, v === 'fixa' ? 'ponta presa na parede\nreflete com inversão de fase' : 'ponta solta (anel na haste)\nreflete sem inverter'); });
  acao(fig, 'pulso', function(){ t0 = L.tempo(); L.agita(); });
  etiqueta(fig, 'ponta presa na parede\nreflete com inversão de fase');
  return L;
};

/* ---------------------------------------------------------------
   REFRACAO — frentes de onda passando para agua rasa
   --------------------------------------------------------------- */
SIM.refracao = function(fig){
  /* Um FEIXE de frentes de onda (so a faixa perto do raio), para o
     olho seguir uma frente so. A frente que esta atravessando a
     fronteira fica em destaque: a ponta que ja entrou na agua rasa
     anda mais devagar, a outra ainda anda depressa -> a frente gira. */
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var yb = h * .5, l1 = 120, razao = .55, l2 = l1 * razao, FV = .22, B = 230;
  var th = 35 * Math.PI / 180;
  var P = {x: w * .56, y: yb};                         /* onde o eixo do feixe cruza a fronteira */
  function seg(cx, cy, dx, dy, meia, cor, lw){
    g.strokeStyle = cor; g.lineWidth = lw;
    g.beginPath(); g.moveTo(cx - dy * meia, cy + dx * meia); g.lineTo(cx + dy * meia, cy - dx * meia); g.stroke();
  }
  var L = laco(function(t){
    T.limpa();
    var s1 = Math.sin(th), c1 = Math.cos(th), s2 = s1 * razao, c2 = Math.sqrt(1 - s2 * s2);
    var B2 = B * c2 / c1;                              /* o feixe estreita/alarga ao mudar de direcao */
    g.fillStyle = rgba(COR.traco, .13); g.fillRect(0, yb, w, h - yb);
    g.strokeStyle = COR.folha2; g.lineWidth = 2; g.beginPath(); g.moveTo(0, yb); g.lineTo(w, yb); g.stroke();
    texto(g, 'ÁGUA FUNDA: a onda anda mais rápido', 24, yb - 24, COR.traco, 17);
    texto(g, 'ÁGUA RASA: a onda anda mais devagar', 24, h - 70, COR.traco, 17);
    /* posicao das frentes: distancia u ao longo do eixo, contada a partir de P */
    var avanco = (FV * t) % 1;                         /* fracao de periodo */
    var destaque = null;
    for (var n = -7; n <= 7; n++){
      var fr = n + avanco;                             /* em unidades de periodo */
      var u1 = fr * l1, u2 = fr * l2;                  /* mesma fase: acima anda l1, abaixo l2 por periodo */
      /* parte acima da fronteira (meio 1) */
      g.save(); g.beginPath(); g.rect(0, 0, w, yb); g.clip();
      var cx = P.x + s1 * u1, cy = P.y + c1 * u1;
      var perto = Math.abs(fr) < .5 + 1e-9 && fr > -.5;
      seg(cx, cy, s1, c1, B / 2, perto ? COR.laser : rgba(COR.folha, .75), perto ? 5 : 3);
      g.restore();
      /* parte abaixo (meio 2): outra direcao, mesma fase na fronteira */
      g.save(); g.beginPath(); g.rect(0, yb, w, h - yb); g.clip();
      var cx2 = P.x + s2 * u2, cy2 = P.y + c2 * u2;
      seg(cx2, cy2, s2, c2, B2 / 2, perto ? COR.laser : rgba(COR.folha, .75), perto ? 5 : 3);
      g.restore();
      if (perto) destaque = {cx: cx, cy: cy, cx2: cx2, cy2: cy2};
    }
    /* velocidades nas duas pontas da frente em destaque */
    if (destaque){
      var e1 = {x: destaque.cx + c1 * B / 2, y: destaque.cy - s1 * B / 2};        /* ponta ainda no meio rapido */
      var e2 = {x: destaque.cx2 - c2 * B2 / 2, y: destaque.cy2 + s2 * B2 / 2};    /* ponta que ja entrou */
      if (e1.y < yb){
        seta(g, e1.x, e1.y, e1.x + s1 * 70, e1.y + c1 * 70, COR.laser, 3, 14);
        texto(g, 'ainda rápida', e1.x + 14, e1.y - 16, COR.laser, 16);
      }
      if (e2.y > yb){
        seta(g, e2.x, e2.y, e2.x + s2 * 70 * razao, e2.y + c2 * 70 * razao, COR.laser, 3, 14);
        texto(g, 'já entrou: mais devagar', e2.x - 14, e2.y + 58, COR.laser, 16, 'right');
      }
    }
    /* o raio: perpendicular as frentes, dobra na fronteira */
    g.strokeStyle = rgba(COR.folha, .5); g.setLineDash([7, 7]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(P.x, yb - 200); g.lineTo(P.x, yb + 200); g.stroke(); g.setLineDash([]);
    texto(g, 'normal', P.x + 8, yb - 190, COR.folha2, 14);
    seta(g, P.x - s1 * 330, yb - c1 * 330, P.x - s1 * 250, yb - c1 * 250, COR.folha, 3, 14);
    texto(g, 'a onda vem daqui', P.x - s1 * 330 + 14, yb - c1 * 330 - 6, COR.folha2, 15);
    /* comprimentos de onda, um de cada lado */
    var ua = -2.4 * l1, ub = 2.2 * l2;
    var q1 = {x: P.x + s1 * (ua) - c1 * (B / 2 + 26), y: P.y + c1 * ua + s1 * (B / 2 + 26)};
    cota(g, q1.x, q1.y, q1.x + s1 * l1, q1.y + c1 * l1, 'λ₁', COR.folha2);
    var q2 = {x: P.x + s2 * ub + c2 * (B2 / 2 + 26), y: P.y + c2 * ub - s2 * (B2 / 2 + 26)};
    cota(g, q2.x, q2.y, q2.x + s2 * l2, q2.y + c2 * l2, 'λ₂', COR.folha2);
  });
  function rot(){
    var t2 = Math.asin(Math.sin(th) * razao);
    etiqueta(fig, 'chega inclinada ' + fmt(th * 180 / Math.PI) + '° · sai ' + fmt(t2 * 180 / Math.PI) + '°\n' +
      'na água rasa: λ menor, mesma frequência');
  }
  th = faixa('ref-a', function(v){ th = v * Math.PI / 180; rot(); L.agita(); }) * Math.PI / 180;
  rot();
  return L;
};

/* ---------------------------------------------------------------
   DIFRACAO — Huygens: soma de fontes ao longo da fenda
   O campo complexo e calculado uma vez por abertura; a animacao
   so gira a fase (barato a 60 fps).
   --------------------------------------------------------------- */
SIM.difracao = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var xb = Math.round(w * .30), lam = 38, S = 2;       /* S: 1 celula = 2 px */
  var GW = Math.ceil((w - xb) / S), GH = Math.ceil(h / S);
  var re = new Float32Array(GW * GH), im = new Float32Array(GW * GH), norm = 1;
  var off = document.createElement('canvas'); off.width = GW; off.height = GH;
  var og = off.getContext('2d'), img = og.createImageData(GW, GH), d = img.data;
  var a = 1.2;
  function calcula(){
    var abertura = a * lam, N = clamp(Math.round(abertura / 6), 8, 40), k = Fisica.TAU / lam, yc = h / 2, mx = 0;
    for (var j = 0; j < GH; j++) for (var i = 0; i < GW; i++){
      var x = i * S + S / 2, y = j * S, R = 0, I = 0;
      for (var n = 0; n < N; n++){
        var ys = yc - abertura / 2 + abertura * (n + .5) / N, dy = y - ys, r = Math.sqrt(x * x + dy * dy) + 1;
        var amp = 1 / Math.sqrt(r);
        R += amp * Math.cos(k * r); I += amp * Math.sin(k * r);
      }
      re[j * GW + i] = R / N; im[j * GW + i] = I / N;
      if (i > 20){ var m = Math.sqrt(R * R + I * I) / N; if (m > mx) mx = m; }
    }
    norm = 1 / (mx || 1);
  }
  var L = laco(function(t){
    T.limpa();
    var wt = Fisica.TAU * .5 * t, cw = Math.cos(wt), sw = Math.sin(wt);
    for (var k = 0; k < GW * GH; k++){
      var v = (re[k] * cw + im[k] * sw) * norm * 1.25;          /* -1..1 aprox */
      /* so as cristas acendem: onde a onda nao chega (sombra) fica escuro */
      var cr = Math.pow(clamp(v, 0, 1), .9);
      d[k * 4] = 11 + cr * 200; d[k * 4 + 1] = 39 + cr * 190; d[k * 4 + 2] = 69 + cr * 170;
      d[k * 4 + 3] = 255;
    }
    og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(off, xb, 0, GW * S, GH * S);
    /* ondas planas chegando pela esquerda */
    g.lineWidth = 3;
    var desl = (.5 * t * lam) % lam;
    for (var x = desl; x < xb; x += lam){
      g.strokeStyle = rgba(COR.folha, .85);
      g.beginPath(); g.moveTo(x, 20); g.lineTo(x, h - 20); g.stroke();
    }
    /* anteparo */
    var ab = a * lam;
    g.fillStyle = COR.folha2;
    g.fillRect(xb - 5, 0, 10, h / 2 - ab / 2);
    g.fillRect(xb - 5, h / 2 + ab / 2, 10, h / 2 - ab / 2);
    texto(g, 'λ', 24, 36, COR.laser, 24, 'left', FONTE.serif);
    g.strokeStyle = COR.laser; g.lineWidth = 2; g.beginPath(); g.moveTo(50, 36); g.lineTo(50 + lam, 36); g.stroke();
  });
  var agenda = null;
  function rot(){ etiqueta(fig, 'abertura = ' + fmt(a, 1) + ' λ\n' + (a < 2 ? 'espalha muito: parece fonte nova' : a < 4 ? 'espalha um pouco' : 'passa quase reto: sombra nítida')); }
  a = faixa('dif-a', function(v){
    a = v; rot();
    clearTimeout(agenda); agenda = setTimeout(function(){ calcula(); L.agita(); }, 30);
  });
  calcula(); rot();
  return L;
};

/* ---------------------------------------------------------------
   SUPERPOSICAO — duas ondas no mesmo lugar, tres casos lado a lado:
   construtiva completa, destrutiva completa e parcial. Em cada
   linha: onda 1 e onda 2 no mesmo eixo, e a soma ao lado.
   --------------------------------------------------------------- */
SIM.superposicao = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var A = 1, lam = 1, f = .35;
  var casos = [
    {nome: 'CONSTRUTIVA', sub: 'crista com crista', fase: 0},
    {nome: 'DESTRUTIVA', sub: 'crista com vale', fase: Math.PI},
    {nome: 'PARCIAL', sub: 'nem uma nem outra', fase: Math.PI / 2}
  ];
  var topo = 20, base = h - 20, alt = (base - topo) / 3;
  var xe = 190, wg = (w - xe - 90) / 2, xs = xe + wg + 70;   /* eixo das ondas 1 e 2; eixo da soma */
  var esc = alt * .19;                                        /* px por unidade de amplitude: 2A cabe */
  function eixo(x0, yc, rot){
    g.strokeStyle = rgba(COR.traco, .35); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, yc); g.lineTo(x0 + wg, yc); g.stroke();
    [-2, 2].forEach(function(k){
      g.setLineDash([3, 6]); g.beginPath(); g.moveTo(x0, yc - k * esc); g.lineTo(x0 + wg, yc - k * esc); g.stroke();
    });
    g.setLineDash([]);
    texto(g, rot, x0, yc - 2 * esc - 14, COR.folha2, 14);
  }
  function curva(x0, yc, fn, cor, lw, tr){
    g.strokeStyle = cor; g.lineWidth = lw; g.setLineDash(tr || []);
    g.beginPath();
    for (var i = 0; i <= 200; i++){
      var X = x0 + wg * i / 200, y = yc - esc * fn(2 * lam * i / 200);   /* duas ondas completas na largura */
      i ? g.lineTo(X, y) : g.moveTo(X, y);
    }
    g.stroke(); g.setLineDash([]);
  }
  var L = laco(function(t){
    T.limpa();
    casos.forEach(function(c, k){
      var y0 = topo + alt * k, yc = y0 + alt * .55;
      if (k){ g.strokeStyle = rgba(COR.traco, .3); g.lineWidth = 1; g.beginPath(); g.moveTo(16, y0); g.lineTo(w - 16, y0); g.stroke(); }
      texto(g, c.nome, 20, yc - 16, k === 2 ? COR.folha : COR.laser, 20);
      texto(g, c.sub, 20, yc + 14, COR.folha2, 16);
      var y1 = function(x){ return Fisica.onda(x, t, A, lam, f); };
      var y2 = function(x){ return Fisica.onda(x, t, A, lam, f, c.fase); };
      eixo(xe, yc, 'onda 1 e onda 2');
      curva(xe, yc, y1, COR.traco, 3.5);
      curva(xe, yc, y2, COR.folha, 3, [9, 7]);
      texto(g, '=', xe + wg + 35, yc, COR.folha, 34, 'center', FONTE.serif);
      eixo(xs, yc, 'soma');
      curva(xs, yc, function(x){ return y1(x) + y2(x); }, COR.laser, 4.5);
      var As = Fisica.amplitudeSoma(A, c.fase);
      texto(g, 'amplitude ' + (As < 1e-9 ? '0' : As > 1.99 ? '2A' : 'A√2 ≈ 1,4A'), xs + wg, yc + 2 * esc + 16, COR.laser, 15, 'right');
    });
  });
  return L;
};

/* ---------------------------------------------------------------
   ALTURA, INTENSIDADE, TIMBRE — osciloscopio com dois tracos
   --------------------------------------------------------------- */
SIM.som = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var qual = 'altura';
  /* timbre: serie de harmonicos (amplitudes relativas) */
  var FLAUTA = [1, .12, .05], VIOLINO = [1, .5, .33, .25, .2, .16, .14, .12];
  var CFG = {
    altura:      [{r: 'grave · 220 Hz', f: 1, A: .8, H: [1]}, {r: 'agudo · 440 Hz', f: 2, A: .8, H: [1]}],
    intensidade: [{r: 'fraco · A pequena', f: 1.5, A: .3, H: [1]}, {r: 'forte · A grande', f: 1.5, A: .9, H: [1]}],
    timbre:      [{r: 'flauta · 330 Hz', f: 1.5, A: .8, H: FLAUTA}, {r: 'violino · 330 Hz', f: 1.5, A: .8, H: VIOLINO}]
  };
  var HZ = {altura: [220, 440], intensidade: [330, 330], timbre: [330, 330]};
  function soma(H, ph){ var s = 0; for (var i = 0; i < H.length; i++) s += H[i] * Math.sin((i + 1) * ph); return s; }
  var PICO = new Map();
  function forma(H, ph){
    if (!PICO.has(H)){ var m = 0; for (var k = 0; k < 720; k++) m = Math.max(m, Math.abs(soma(H, k * Fisica.TAU / 720))); PICO.set(H, m); }
    return soma(H, ph) / PICO.get(H);
  }
  var L = laco(function(t){
    T.limpa();
    var cfg = CFG[qual];
    cfg.forEach(function(c, i){
      var y0 = h * (.26 + .42 * i), a = 118, x0 = 40, x1 = w - 40;
      g.strokeStyle = rgba(COR.traco, .25); g.lineWidth = 1;
      for (var gx = x0; gx <= x1; gx += 50){ g.beginPath(); g.moveTo(gx, y0 - a); g.lineTo(gx, y0 + a); g.stroke(); }
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      texto(g, c.r.toUpperCase(), x0, y0 - a - 16, i ? COR.laser : COR.folha, 18);
      g.strokeStyle = i ? COR.laser : COR.folha; g.lineWidth = 3; g.beginPath();
      for (var x = x0; x <= x1; x += 2){
        var ph = Fisica.TAU * (c.f * (x - x0) / 190 - .4 * t);
        var y = y0 - a * .95 * c.A * clamp(forma(c.H, ph), -1.05, 1.05);
        x === x0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    });
  });
  var TXT = {
    altura: 'mesma amplitude\nfrequência dobra: uma oitava acima',
    intensidade: 'mesma frequência (mesma nota)\namplitude maior: som mais forte',
    timbre: 'mesma nota, mesma amplitude\nformas diferentes: harmônicos'
  };
  botoes(fig, 'q', function(v){ qual = v; etiqueta(fig, TXT[v]); L.agita(); });
  etiqueta(fig, TXT.altura);
  /* som de verdade: toca os dois tracos em sequencia */
  var ctx = null;
  acao(fig, 'ouvir', function(){
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var cfg = CFG[qual], t0 = ctx.currentTime + .05;
      cfg.forEach(function(c, i){
        var o = ctx.createOscillator(), gn = ctx.createGain();
        var real = new Float32Array(c.H.length + 1), imag = new Float32Array(c.H.length + 1);
        c.H.forEach(function(a, k){ imag[k + 1] = a; });
        o.setPeriodicWave(ctx.createPeriodicWave(real, imag));
        o.frequency.value = HZ[qual][i];
        var vol = .16 * c.A / (c.H.length > 3 ? 1.6 : 1);
        var ti = t0 + i * 1.1;
        gn.gain.setValueAtTime(0, ti);
        gn.gain.linearRampToValueAtTime(vol, ti + .04);
        gn.gain.setValueAtTime(vol, ti + .8);
        gn.gain.linearRampToValueAtTime(0, ti + .95);
        o.connect(gn); gn.connect(ctx.destination);
        o.start(ti); o.stop(ti + 1);
      });
    } catch (e){ console.warn('sem áudio', e); }
  });
  return L;
};

/* ---------------------------------------------------------------
   DECIBEIS — regua de 0 a 130 dB com situacoes reais
   --------------------------------------------------------------- */
SIM.db = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  /* regua vertical: cada situacao na propria altura, sem colisao */
  var xa = 250, y0 = h - 50, y1 = 50;
  function Y(db){ return y0 - (y0 - y1) * db / 130; }
  var marcas = [
    [0, 'limiar da audição'], [20, 'folhas ao vento'], [45, 'ruído de fundo da sala'],
    [60, 'conversa a 1 m'], [85, 'trânsito pesado: limite de 8 h'], [100, 'fone no volume máximo'],
    [120, 'limiar da dor'], [130, 'turbina de avião próxima']
  ];
  var SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  var st = {p: 0};
  var L = laco(function(){
    T.limpa();
    for (var db = 0; db < 130; db++){
      g.fillStyle = db < 85 ? rgba(COR.traco, .18 + db / 130 * .4) : rgba(COR.laser, .4 + (db - 85) / 45 * .5);
      g.fillRect(xa - 16, Y(db + 1), 32, Y(db) - Y(db + 1) + .5);
    }
    g.strokeStyle = COR.folha2; g.lineWidth = 1.5;
    for (var d = 0; d <= 130; d += 10){
      g.beginPath(); g.moveTo(xa - 16, Y(d)); g.lineTo(xa - 28, Y(d)); g.stroke();
      texto(g, d + ' dB', xa - 36, Y(d), COR.folha2, 15, 'right');
      if (d % 20 === 0) texto(g, d === 0 ? '×1' : '×10' + String(d / 10).split('').map(function(c){ return SUP[+c]; }).join(''), 70, Y(d), COR.traco, 15, 'right');
    }
    texto(g, 'I / I₀', 70, y1 - 26, COR.traco, 15, 'right');
    var nv = Math.round(st.p * marcas.length);
    marcas.forEach(function(m, i){
      if (i >= nv) return;
      var y = Y(m[0]), quente = m[0] >= 85;
      g.strokeStyle = quente ? COR.laser : COR.folha; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xa + 16, y); g.lineTo(xa + 60, y); g.stroke();
      texto(g, m[0] + ' dB', xa + 72, y, quente ? COR.laser : COR.folha, 20, 'left', FONTE.serif);
      texto(g, m[1], xa + 160, y, quente ? COR.laser : COR.folha, 19, 'left', FONTE.sans);
    });
    /* de 60 para 80 dB: x100 */
    var xc = w - 90;
    cota(g, xc, Y(60), xc, Y(80), '', COR.laser);
    texto(g, '+20 dB', xc - 16, (Y(60) + Y(80)) / 2 - 14, COR.folha2, 16, 'right');
    texto(g, '= ×100', xc - 16, (Y(60) + Y(80)) / 2 + 14, COR.laser, 20, 'right', FONTE.serif);
  });
  var tw = null, S = L.start;
  L.start = function(){
    S(); st.p = 0; tw && tw.kill();
    if (REDUZIR || IMPRIMIR){ st.p = 1; L.agita(); return; }
    tw = gsap.to(st, {p: 1, duration: 2.4, ease: 'none'});
  };
  etiqueta(fig, '');
  return L;
};

/* ---------------------------------------------------------------
   DOPPLER — frentes de onda emitidas por uma fonte em movimento
   --------------------------------------------------------------- */
SIM.doppler = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var v = 190, fE = 1.6, beta = .35, f0 = 500;       /* v em px/s; f de emissao visual */
  var frentes = [], xs = 0, tUlt = -9, yc = h * .47;
  var oE = 60, oD = w - 60;
  /* recomeca ja com 3 s de historia: a prancha nunca abre vazia */
  function reinicia(t){
    frentes = []; var hist = 3;
    for (var te = 0; te < hist; te += 1 / fE) frentes.push({x: w * .22 + beta * v * te, r: v * (hist - te)});
    xs = w * .22 + beta * v * hist; tUlt = t;
  }
  var L = laco(function(t, dt){
    T.limpa();
    if (!frentes.length && xs === 0) reinicia(t);
    if (REDUZIR || IMPRIMIR){
      /* estado parado: frentes emitidas ao longo do caminho ate o meio */
      frentes = []; var tt = 7, xf = w * .22 + beta * v * tt;
      for (var k = 0; k < tt * fE; k++){ var te = k / fE; frentes.push({x: w * .22 + beta * v * te, r: v * (tt - te)}); }
      xs = xf;
    } else {
      xs += beta * v * dt;
      if (t - tUlt >= 1 / fE){ frentes.push({x: xs, r: 0}); tUlt = t; }
      frentes.forEach(function(F){ F.r += v * dt; });
      frentes = frentes.filter(function(F){ return F.r < w * 1.3; });
      if (xs > oD - 110) reinicia(t);
    }
    frentes.forEach(function(F){
      var a = clamp(1 - F.r / (w * 1.1), .08, 1);
      g.strokeStyle = rgba(COR.traco, a); g.lineWidth = 2.5;
      g.beginPath(); g.arc(F.x, yc, F.r, 0, 7); g.stroke();
    });
    /* ambulancia */
    g.fillStyle = COR.folha; g.fillRect(xs - 34, yc - 18, 68, 36);
    g.fillStyle = COR.laser; g.fillRect(xs - 8, yc - 28, 16, 10);
    seta(g, xs + 40, yc, xs + 40 + 40 + beta * 160, yc, COR.laser, 3);
    /* ouvintes */
    var fF = Fisica.doppler(f0, 340, 0, beta * 340), fT = Fisica.doppler(f0, 340, 0, -beta * 340);
    [[oD, 'na frente', fF], [oE, 'atrás', fT]].forEach(function(o, i){
      g.fillStyle = COR.folha2; g.beginPath(); g.arc(o[0], yc, 14, 0, 7); g.fill();
      var dir = i === 0 ? 'right' : 'left';
      texto(g, o[1].toUpperCase(), o[0], yc + 150, COR.traco, 16, dir);
      texto(g, milhar(o[2]) + ' Hz', o[0], yc + 180, i === 0 ? COR.laser : COR.folha, 26, dir, FONTE.serif);
      texto(g, i === 0 ? 'mais agudo' : 'mais grave', o[0], yc + 212, COR.folha2, 17, dir);
    });
  });
  function rot(){ etiqueta(fig, 'sirene emite f = ' + f0 + ' Hz\nv fonte = ' + fmt(beta, 2) + ' × v som = ' + milhar(beta * 340) + ' m/s'); }
  beta = faixa('dop-v', function(val){ beta = val; rot(); L.agita(); });
  rot();
  return L;
};

/* ---------------------------------------------------------------
   COR — luz incidente x refletancia do objeto
   --------------------------------------------------------------- */
SIM.cor = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var LUZES = {branca: [1, 1, 1], vermelha: [1, .04, .04], verde: [.04, 1, .04], azul: [.05, .05, 1]};
  var OBJ = [
    ['camiseta', 'vermelha', [.88, .1, .1]],
    ['folha', 'verde', [.12, .7, .16]],
    ['banana', 'amarela', [.95, .82, .08]],
    ['papel', 'branco', [.93, .93, .93]]
  ];
  var st = {r: 1, gg: 1, b: 1};
  function css(c){ return 'rgb(' + (255 * Math.pow(clamp(c[0], 0, 1), 1 / 1.6) | 0) + ',' + (255 * Math.pow(clamp(c[1], 0, 1), 1 / 1.6) | 0) + ',' + (255 * Math.pow(clamp(c[2], 0, 1), 1 / 1.6) | 0) + ')'; }
  var L = laco(function(){
    T.limpa();
    var luz = [st.r, st.gg, st.b];
    /* lampada e cone de luz */
    var lx = w / 2, ly = 44;
    var gr = g.createLinearGradient(0, ly, 0, h * .62);
    gr.addColorStop(0, 'rgba(' + (luz[0] * 255 | 0) + ',' + (luz[1] * 255 | 0) + ',' + (luz[2] * 255 | 0) + ',.30)');
    gr.addColorStop(1, 'rgba(' + (luz[0] * 255 | 0) + ',' + (luz[1] * 255 | 0) + ',' + (luz[2] * 255 | 0) + ',0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(lx - 30, ly); g.lineTo(lx + 30, ly); g.lineTo(w - 30, h * .62); g.lineTo(30, h * .62); g.closePath(); g.fill();
    g.fillStyle = css(luz); g.beginPath(); g.arc(lx, ly, 18, 0, 7); g.fill();
    /* objetos */
    var n = OBJ.length, cw = (w - 120) / n;
    OBJ.forEach(function(o, i){
      var cx = 60 + cw * (i + .5), sy = h * .40, sz = Math.min(cw - 50, 170);
      var vista = Fisica.corRefletida(luz, o[2]);
      g.fillStyle = css(vista); g.fillRect(cx - sz / 2, sy - sz / 2, sz, sz);
      g.strokeStyle = rgba(COR.traco, .5); g.lineWidth = 1; g.strokeRect(cx - sz / 2, sy - sz / 2, sz, sz);
      texto(g, o[0], cx, sy + sz / 2 + 34, COR.folha, 22, 'center', FONTE.sans);
      texto(g, o[1], cx, sy + sz / 2 + 60, COR.folha2, 16, 'center');
      /* barras de refletancia R G B */
      var bw = 26, by = sy + sz / 2 + 150;
      ['R', 'G', 'B'].forEach(function(ch, k){
        var bx = cx - 1.5 * bw - 8 + k * (bw + 8), hh = 70 * o[2][k];
        g.fillStyle = rgba(COR.traco, .2); g.fillRect(bx, by - 70, bw, 70);
        g.fillStyle = ['#e0483a', '#3fae5a', '#3f7de0'][k]; g.fillRect(bx, by - hh, bw, hh);
        texto(g, ch, bx + bw / 2, by + 16, COR.folha2, 14, 'center');
      });
    });
    texto(g, 'O QUE CADA OBJETO REFLETE', 60, h - 36, COR.traco, 15);
  });
  botoes(fig, 'luz', function(v){
    var c = LUZES[v];
    tween(st, {r: c[0], gg: c[1], b: c[2], duration: REDUZIR || IMPRIMIR ? 0 : .6}, L);
    etiqueta(fig, 'luz ' + v + (v === 'branca' ? '\ncada objeto mostra a sua cor' : '\nquem não reflete essa cor fica escuro'));
  });
  etiqueta(fig, 'luz branca\ncada objeto mostra a sua cor');
  return L;
};

/* ---------------------------------------------------------------
   ESPELHOS — plano, concavo, convexo (tracado de raios real)
   --------------------------------------------------------------- */
SIM.espelhos = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var tipo = 'plano', st = {p: 1};
  function refl(d, n){ var k = 2 * (d[0] * n[0] + d[1] * n[1]); return [d[0] - k * n[0], d[1] - k * n[1]]; }
  function linha(x0, y0, x1, y1, cor, lw, tracejada){
    g.strokeStyle = cor; g.lineWidth = lw || 3; g.setLineDash(tracejada ? [8, 8] : []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
  }
  var L = laco(function(){
    T.limpa();
    var p = st.p;
    if (tipo === 'plano'){
      var mx = w * .58, oy = h * .66, ox = mx - 270, ot = 140;
      g.fillStyle = COR.folha2; g.fillRect(mx, 50, 10, h - 150);
      seta(g, ox, oy, ox, oy - ot, COR.folha, 5, 18);
      texto(g, 'objeto', ox, oy + 28, COR.folha, 18, 'center');
      var ix = 2 * mx - ox;                         /* imagem: simetrica em relacao ao espelho */
      g.globalAlpha = .75; linha(ix, oy, ix, oy - ot, COR.traco, 4, true); g.globalAlpha = 1;
      texto(g, 'imagem virtual', ix, oy + 28, COR.traco, 18, 'center');
      var ex = ox + 70, ey = 150;                   /* olho */
      [oy - ot, oy].forEach(function(py0){
        /* o raio que chega ao olho parece vir do ponto-imagem */
        var t0 = (mx - ex) / (ix - ex), hy = ey + t0 * (py0 - ey);
        var q = clamp(p * 2, 0, 1), q2 = clamp(p * 2 - 1, 0, 1);
        linha(ox, py0, ox + (mx - ox) * q, py0 + (hy - py0) * q, COR.laser, 3);
        if (q2 > 0) seta(g, mx, hy, mx + (ex - mx) * q2, hy + (ey - hy) * q2, COR.laser, 3);
        if (p >= 1) linha(mx, hy, ix, py0, rgba(COR.laser, .45), 2, true);
      });
      /* normal e angulos no ponto do raio de cima */
      var hy0 = ey + (mx - ex) / (ix - ex) * (oy - ot - ey);
      g.setLineDash([5, 6]); g.strokeStyle = rgba(COR.folha, .6); g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(mx - 150, hy0); g.lineTo(mx, hy0); g.stroke(); g.setLineDash([]);
      texto(g, 'normal', mx - 156, hy0, COR.folha2, 15, 'right');
      g.fillStyle = COR.folha; g.beginPath(); g.ellipse(ex, ey, 22, 12, 0, 0, 7); g.fill();
      g.fillStyle = COR.fundo; g.beginPath(); g.arc(ex, ey, 6.5, 0, 7); g.fill();
      texto(g, 'olho', ex - 32, ey, COR.folha, 18, 'right');
      cota(g, ox, oy + 64, mx, oy + 64, 'd', COR.folha2);
      cota(g, mx + 10, oy + 64, ix, oy + 64, 'd', COR.folha2);
      return;
    }
    /* concavo / convexo: circulo de raio R; espelho e o arco do lado direito (concavo)
       ou esquerdo virado para a luz (convexo) */
    var R = 520, yc = h * .5, cav = tipo === 'concavo';
    var cx = cav ? w * .82 - R : w * .52 + R;
    var ang = .62;
    g.strokeStyle = COR.folha2; g.lineWidth = 8; g.beginPath();
    if (cav) g.arc(cx, yc, R, -ang, ang); else g.arc(cx, yc, R, Math.PI - ang, Math.PI + ang);
    g.stroke();
    g.setLineDash([6, 8]); g.strokeStyle = rgba(COR.traco, .6); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(20, yc); g.lineTo(w - 20, yc); g.stroke(); g.setLineDash([]);
    var fx = cav ? cx + R / 2 : cx - R / 2;
    g.fillStyle = COR.laser; g.beginPath(); g.arc(fx, yc, 7, 0, 7); g.fill();
    texto(g, 'F', fx, yc + 30, COR.laser, 26, 'center', FONTE.serif);
    [-190, -120, -55, 55, 120, 190].forEach(function(hh){
      var y = yc + hh, dx = Math.sqrt(R * R - hh * hh);
      var px = cav ? cx + dx : cx - dx;
      var n = [(px - cx) / R, (y - yc) / R];
      var d2 = refl([1, 0], n);
      var q = clamp(p * 2, 0, 1), q2 = clamp(p * 2 - 1, 0, 1);
      linha(30, y, 30 + (px - 30) * q, y, COR.laser, 3);
      if (q2 > 0){
        var comp = cav ? 560 : 380;
        seta(g, px, y, px + d2[0] * comp * q2, y + d2[1] * comp * q2, COR.laser, 3);
        if (!cav && p >= 1){                     /* prolongamento virtual ate o foco */
          var sv = (fx - px) / -d2[0];
          linha(px, y, px - d2[0] * sv, y - d2[1] * sv, rgba(COR.laser, .4), 2, true);
        }
      }
    });
    texto(g, cav ? 'os raios paralelos se encontram no foco (real)' : 'os raios se espalham; parecem vir do foco atrás (virtual)', 30, h - 90, COR.folha, 20);
  });
  function rot(){
    etiqueta(fig, tipo === 'plano' ? 'a luz volta com o mesmo ângulo com que chegou\nimagem virtual, direita, mesmo tamanho'
      : tipo === 'concavo' ? 'espelho côncavo\njunta a luz num ponto: o foco' : 'espelho convexo\nespalha a luz: campo de visão maior');
  }
  botoes(fig, 'esp', function(v){
    tipo = v; rot(); st.p = 0;
    tween(st, {p: 1, duration: REDUZIR || IMPRIMIR ? 0 : 1.1, ease: 'power1.inOut'}, L);
  });
  rot();
  var S = L.start;
  L.start = function(){ S(); st.p = 0; tween(st, {p: 1, duration: REDUZIR || IMPRIMIR ? 0 : 1.1, ease: 'power1.inOut'}, L); if (REDUZIR || IMPRIMIR){ st.p = 1; L.agita(); } };
  return L;
};

/* ---------------------------------------------------------------
   ELEMENTOS DO ESPELHO ESFERICO — C, R, V, F e os tres tipos de
   imagem. O espelho e um arco de verdade (pedaco da esfera); os
   raios de cada imagem passam pelo ponto dado por Gauss.
   --------------------------------------------------------------- */
SIM.elementos = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var R = 360, fpx = R / 2, V = w * .68, Cx = V - R, Fx = V - fpx, yc = h * .46, ang = .5;
  var modo = 'elementos', st = {p: 1};
  function linha(x0, y0, x1, y1, cor, lw, tr){
    g.strokeStyle = cor; g.lineWidth = lw || 3; g.setLineDash(tr ? [8, 7] : []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
  }
  function naEsfera(y){ return Cx + Math.sqrt(R * R - (y - yc) * (y - yc)); }   /* ponto do arco na altura y */
  function ponto(x, rot, cor, dx){
    g.fillStyle = cor; g.beginPath(); g.arc(x, yc, 7, 0, 7); g.fill();
    texto(g, rot, x + (dx || 0), yc + 30, cor, 26, 'center', FONTE.serif);
  }
  function rotulo(s, x, y, cor){
    g.font = '18px ' + FONTE.mono; var m = g.measureText(s).width;
    g.fillStyle = rgba(COR.fundo, .9); g.fillRect(x - m / 2 - 6, y - 13, m + 12, 26);
    texto(g, s, x, y, cor, 18, 'center');
  }
  function olho(x, y){
    g.fillStyle = COR.folha; g.beginPath(); g.ellipse(x, y, 22, 12, 0, 0, 7); g.fill();
    g.fillStyle = COR.fundo; g.beginPath(); g.arc(x + 6, y, 6.5, 0, 7); g.fill();
  }
  var cores = ['#ffd166', '#7fd8be', '#ff8fab'];
  var L = laco(function(){
    T.limpa();
    var p = st.p;
    /* a esfera inteira, apagada, e o pedaco que vira espelho */
    g.setLineDash([4, 8]); g.strokeStyle = rgba(COR.traco, .35); g.lineWidth = 1.5;
    g.beginPath(); g.arc(Cx, yc, R, 0, 7); g.stroke(); g.setLineDash([]);
    g.strokeStyle = COR.folha2; g.lineWidth = 8; g.beginPath(); g.arc(Cx, yc, R, -ang, ang); g.stroke();
    g.setLineDash([6, 8]); g.strokeStyle = rgba(COR.traco, .6); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(10, yc); g.lineTo(w - 10, yc); g.stroke(); g.setLineDash([]);
    if (modo === 'elementos'){
      texto(g, 'eixo principal', 20, yc - 16, COR.traco, 15);
      /* raio de curvatura ate um ponto qualquer do espelho: e sempre R */
      var a2 = -.38, xr = Cx + R * Math.cos(a2), yr = yc + R * Math.sin(a2);
      linha(Cx, yc, xr, yr, rgba(COR.folha, .8), 2);
      texto(g, 'R', (Cx + xr) / 2 - 8, (yc + yr) / 2 - 18, COR.folha, 26, 'center', FONTE.serif);
      /* raios paralelos convergem no foco */
      [-120, -70, 70, 120].forEach(function(hh, i){
        var y = yc + hh, xm = naEsfera(y), q = clamp(p * 2, 0, 1), q2 = clamp(p * 2 - 1, 0, 1);
        linha(20, y, 20 + (xm - 20) * q, y, COR.laser, 2.5);
        if (q2 > 0){ var dx = Fx - xm, dy = yc - y; seta(g, xm, y, xm + dx * 1.35 * q2, y + dy * 1.35 * q2, COR.laser, 2.5, 12); }
      });
      cota(g, Cx, yc + 90, V, yc + 90, 'R', COR.folha2);
      cota(g, Fx, yc + 150, V, yc + 150, 'f = R/2', COR.laser);
      ponto(Cx, 'C', COR.traco); ponto(Fx, 'F', COR.laser); ponto(V, 'V', COR.folha2, 30);
      return;
    }
    ponto(Cx, 'C', COR.traco); ponto(Fx, 'F', COR.laser);
    var real = modo === 'real', ho = real ? 80 : 60;
    var pp = real ? 2.4 * fpx : .5 * fpx, im = Fisica.imagemEspelho(fpx, pp);
    var xo = V - pp, yo = yc - ho, xi = V - im.pl, yi = yc - im.A * ho;
    seta(g, xo, yc, xo, yo, COR.folha, 5, 18);
    texto(g, 'objeto', xo, yo - 22, COR.folha, 17, 'center');
    /* tres raios do topo do objeto ate o espelho; na volta, todos pelo ponto-imagem */
    var olhoEm = null;
    [yo, yc - ho * .15, yc + ho * .9].forEach(function(ym, i){
      var xm = naEsfera(ym), q = clamp(p * 2, 0, 1), q2 = clamp(p * 2 - 1, 0, 1);
      linha(xo, yo, xo + (xm - xo) * q, yo + (ym - yo) * q, cores[i], 3);
      if (q2 <= 0) return;
      var dx = real ? xi - xm : xm - xi, dy = real ? yi - ym : ym - yi, n = Math.hypot(dx, dy), comp = real ? n * 1.5 : 420;
      seta(g, xm, ym, xm + dx / n * comp * q2, ym + dy / n * comp * q2, cores[i], 3, 13);
      if (i === 1) olhoEm = [xm + dx / n * (comp + 60), ym + dy / n * (comp + 60)];   /* olho no caminho do raio do meio */
      if (!real && p >= 1) linha(xm, ym, xi, yi, rgba(cores[i], .6), 2, true);    /* prolongamento */
    });
    if (p < 1) return;
    if (real){
      g.fillStyle = rgba(COR.folha, .12); g.fillRect(xi - 6, yc - 40, 12, 230);   /* tela */
      g.strokeStyle = COR.folha2; g.lineWidth = 2; g.strokeRect(xi - 6, yc - 40, 12, 230);
      texto(g, 'tela', xi, yc + 210, COR.folha2, 16, 'center');
      seta(g, xi, yc, xi, yi, COR.laser, 5, 18);
      rotulo('imagem real', xi, yc + 250, COR.laser);
    } else {
      linha(xi, yc, xi, yi + 14, COR.laser, 4, true); seta(g, xi, yi + 14, xi, yi, COR.laser, 4, 16);
      texto(g, 'imagem virtual', xi, yi - 22, COR.laser, 18, 'center');
      if (olhoEm){ olho(olhoEm[0], olhoEm[1]); texto(g, 'olho', olhoEm[0], olhoEm[1] + 30, COR.folha, 16, 'center'); }
    }
  });
  function rot(){
    etiqueta(fig, modo === 'elementos' ? 'raios paralelos ao eixo → passam pelo foco F\nF fica no meio entre C e V: f = R/2'
      : modo === 'real' ? 'objeto além de C\nos raios SE CRUZAM de verdade: imagem real\ndá para projetar numa tela'
      : 'objeto entre F e V\nos raios se espalham; só os PROLONGAMENTOS se cruzam\nimagem virtual, atrás do espelho: só o olho vê');
  }
  botoes(fig, 'el', function(v){
    modo = v; rot(); st.p = 0;
    tween(st, {p: 1, duration: REDUZIR || IMPRIMIR ? 0 : 1.1, ease: 'power1.inOut'}, L);
  });
  rot();
  var S = L.start;
  L.start = function(){ S(); st.p = 0; tween(st, {p: 1, duration: REDUZIR || IMPRIMIR ? 0 : 1.1, ease: 'power1.inOut'}, L); if (REDUZIR || IMPRIMIR){ st.p = 1; L.agita(); } };
  return L;
};

/* ---------------------------------------------------------------
   ESPELHO ESFERICO — raios notaveis e a imagem (esquema de Gauss:
   raios perto do eixo, reflexao desenhada no plano do vertice)
   --------------------------------------------------------------- */
SIM.gauss = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var fpx = 150, yc = h * .47, ho = 90, tipo = 'concavo', pf = 2.5;   /* pf: p em unidades de f */
  function linha(x0, y0, x1, y1, cor, lw, tracejada){
    g.strokeStyle = cor; g.lineWidth = lw || 3; g.setLineDash(tracejada ? [8, 7] : []);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
  }
  /* raio que sai de M na direcao (dx, dy) ate a borda esquerda */
  function saida(M, dx, dy, cor){
    var s = (M[0] - 10) / -dx;
    if (!(s > 0)) s = 900;
    var q = Math.min(s, 1400 / Math.hypot(dx, dy));
    seta(g, M[0], M[1], M[0] + dx * q * .55, M[1] + dy * q * .55, cor, 3, 14);
    linha(M[0], M[1], M[0] + dx * q, M[1] + dy * q, cor, 3);
  }
  function marca(x, rot, cor, dx){
    g.fillStyle = cor; g.beginPath(); g.arc(x, yc, 6, 0, 7); g.fill();
    rotulo(rot, x + (dx || 0), yc + 28, cor, 24, FONTE.serif);
  }
  /* texto com fundo, para nao se perder no meio dos raios */
  function rotulo(s, x, y, cor, tam, fonte){
    g.font = tam + 'px ' + (fonte || FONTE.mono);
    var m = g.measureText(s).width;
    g.fillStyle = rgba(COR.fundo, .85); g.fillRect(x - m / 2 - 6, y - tam * .65, m + 12, tam * 1.3);
    texto(g, s, x, y, cor, tam, 'center', fonte);
  }
  var L = laco(function(){
    T.limpa();
    var cav = tipo === 'concavo', f = cav ? fpx : -fpx;
    var V = w * .62, Fx = V - f, Cx = V - 2 * f;
    var p = pf * fpx, xo = V - p, yo = yc - ho;
    var im = Fisica.imagemEspelho(f, p);
    /* eixo, espelho (linha com as pontas curvadas para o lado que reflete) */
    g.setLineDash([6, 8]); g.strokeStyle = rgba(COR.traco, .6); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(10, yc); g.lineTo(w - 10, yc); g.stroke(); g.setLineDash([]);
    var Hm = 250, cv = cav ? -1 : 1;
    g.strokeStyle = COR.folha2; g.lineWidth = 7; g.beginPath();
    g.moveTo(V + cv * 22, yc - Hm - 8); g.quadraticCurveTo(V, yc - Hm + 14, V, yc - Hm + 40);
    g.lineTo(V, yc + Hm - 40); g.quadraticCurveTo(V, yc + Hm - 14, V + cv * 22, yc + Hm + 8); g.stroke();
    g.strokeStyle = rgba(COR.folha2, .35); g.lineWidth = 2;               /* hachura: costas do espelho */
    for (var y = yc - Hm + 30; y < yc + Hm - 30; y += 22){ g.beginPath(); g.moveTo(V + 5, y); g.lineTo(V + 19, y - 12); g.stroke(); }
    marca(V, 'V', COR.folha2, -24);
    if (Fx > 10 && Fx < w - 10) marca(Fx, 'F', COR.laser);
    if (Cx > 10 && Cx < w - 10) marca(Cx, 'C', COR.traco);
    /* raios notaveis */
    var cores = ['#ffd166', '#7fd8be', '#ff8fab'];
    var M1 = [V, yo];                                  /* 1: paralelo -> pelo foco */
    var d1 = cav ? [Fx - V, yc - yo] : [V - Fx, yo - yc];
    var yM2 = yo + (yc - yo) * (V - xo) / (Fx - xo);   /* 2: na direcao do foco -> volta paralelo */
    var M2 = [V, yM2];
    var M3 = [V, yc];                                  /* 3: no vertice -> volta simetrico */
    var d3 = [xo - V, yc - yo];
    var raios = [[M1, d1], [M2, [-1, 0]], [M3, d3]];
    var ok2 = isFinite(yM2) && Math.abs(yM2 - yc) < 1.8 * Hm;
    raios.forEach(function(R, i){
      if (i === 1 && !ok2) return;
      linha(xo, yo, R[0][0], R[0][1], cores[i], 3);
      saida(R[0], R[1][0], R[1][1], cores[i]);
    });
    /* objeto e imagem */
    seta(g, xo, yc, xo, yo, COR.folha, 5, 18);
    rotulo('objeto', xo, yo - 24, COR.folha, 18);
    if (!im.impropria){
      var xi = V - im.pl, yi = yc - im.A * ho;
      if (!im.real){                                   /* prolongamentos atras do espelho */
        raios.forEach(function(R, i){ if (i !== 1 || ok2) linha(R[0][0], R[0][1], xi, yi, rgba(cores[i], .55), 2, true); });
      }
      if (xi > -50 && xi < w + 50){
        g.globalAlpha = im.real ? 1 : .85;
        if (im.real) seta(g, xi, yc, xi, yi, COR.laser, 5, 18);
        else { linha(xi, yc, xi, yi, COR.laser, 4, true); seta(g, xi, yi + (im.A > 0 ? 12 : -12), xi, yi, COR.laser, 4, 16); }
        g.globalAlpha = 1;
        rotulo(im.real ? 'imagem real' : 'imagem virtual', xi, yi > yc ? yi + 26 : yi - 24, COR.laser, 18);
      }
    }
    texto(g, cav ? 'raio paralelo volta pelo F · raio pelo F volta paralelo · raio no V volta simétrico'
      : 'no convexo, F e C ficam atrás: os raios refletidos parecem vir do F', 20, h - 78, COR.folha2, 16);
  });
  function rot(){
    var f = tipo === 'concavo' ? 1 : -1, im = Fisica.imagemEspelho(f, pf), s;
    s = (tipo === 'concavo' ? 'côncavo' : 'convexo') + ' · f = ' + (f > 0 ? '+' : '−') + fmt(fpx / 10) + ' cm · p = ' + fmt(pf * fpx / 10) + ' cm\n';
    if (im.impropria) s += 'objeto no foco: raios saem paralelos\nimagem imprópria (no infinito)';
    else s += 'p′ = ' + (im.pl < 0 ? '−' : '') + fmt(Math.abs(im.pl) * fpx / 10, 1) + ' cm · A = ' + (im.A < 0 ? '−' : '+') + fmt(Math.abs(im.A), 2) + '\n' +
      (im.real ? 'real' : 'virtual') + ', ' + (im.direita ? 'direita' : 'invertida') + ', ' + im.tamanho +
      (Math.abs(im.pl) * fpx > (im.real ? T.w * .62 : T.w * .38) ? '\n(a imagem ficou fora da tela)' : '');
    etiqueta(fig, s);
  }
  botoes(fig, 'esf', function(v){ tipo = v; rot(); L.agita(); });
  pf = faixa('gauss-p', function(v){ pf = Math.round(v * 10) / 10; rot(); L.agita(); });
  rot();
  return L;
};

/* ---------------------------------------------------------------
   SNELL — transferidor, ar -> agua
   --------------------------------------------------------------- */
SIM.snell = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var n1 = 1, n2 = 1.33, th = 45 * Math.PI / 180, cx = w / 2, cy = h * .5, R = Math.min(w, h) * .42;
  var L = laco(function(t){
    T.limpa();
    g.fillStyle = rgba(COR.traco, .14); g.fillRect(0, cy, w, h - cy);
    texto(g, 'AR · n = 1,00', 26, 34, COR.traco, 18);
    texto(g, 'ÁGUA · n = 1,33', 26, cy + 34, COR.traco, 18);
    g.strokeStyle = COR.folha2; g.lineWidth = 2; g.beginPath(); g.moveTo(0, cy); g.lineTo(w, cy); g.stroke();
    /* transferidor */
    g.strokeStyle = rgba(COR.traco, .5); g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    for (var a = 0; a < 360; a += 10){
      var r0 = a % 30 ? R - 10 : R - 20, rr = a * Math.PI / 180;
      g.beginPath(); g.moveTo(cx + Math.cos(rr) * r0, cy + Math.sin(rr) * r0); g.lineTo(cx + Math.cos(rr) * R, cy + Math.sin(rr) * R); g.stroke();
    }
    [0, 30, 60].forEach(function(a){
      var rr = (a - 90) * Math.PI / 180;
      texto(g, a + '°', cx + Math.cos(rr) * (R + 26), cy + Math.sin(rr) * (R + 26), COR.folha2, 15, 'center');
      texto(g, a + '°', cx + Math.cos(Math.PI - rr) * (R + 26), cy + Math.sin(Math.PI - rr) * (R + 26), COR.folha2, 15, 'center');
    });
    /* normal */
    g.strokeStyle = rgba(COR.folha, .6); g.setLineDash([7, 7]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke(); g.setLineDash([]);
    texto(g, 'normal', cx + 10, cy - R + 16, COR.folha2, 15);
    var t2 = Fisica.snell(n1, n2, th);
    /* incidente, refletido fraco, refratado */
    seta(g, cx - Math.sin(th) * R, cy - Math.cos(th) * R, cx, cy, COR.laser, 5, 18);
    g.globalAlpha = .28; seta(g, cx, cy, cx + Math.sin(th) * R * .8, cy - Math.cos(th) * R * .8, COR.laser, 3, 14); g.globalAlpha = 1;
    seta(g, cx, cy, cx + Math.sin(t2) * R, cy + Math.cos(t2) * R, COR.laser, 5, 18);
    g.strokeStyle = COR.folha; g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, 80, -Math.PI / 2 - th, -Math.PI / 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, 80, Math.PI / 2 - t2, Math.PI / 2); g.stroke();
    texto(g, 'θ₁', cx - Math.sin(th / 2) * 110, cy - Math.cos(th / 2) * 110, COR.folha, 26, 'center', FONTE.serif);
    texto(g, 'θ₂', cx + Math.sin(t2 / 2) * 110, cy + Math.cos(t2 / 2) * 110, COR.folha, 26, 'center', FONTE.serif);
  });
  function rot(){
    var t2 = Fisica.snell(n1, n2, th), d = 180 / Math.PI;
    etiqueta(fig, 'θ₁ = ' + fmt(th * d) + '°  →  θ₂ = ' + fmt(t2 * d, 1) + '°\n' +
      '1,00 × sen ' + fmt(th * d) + '° = ' + fmt(n1 * Math.sin(th), 2) + '\n' +
      '1,33 × sen ' + fmt(t2 * d, 1) + '° = ' + fmt(n2 * Math.sin(t2), 2));
  }
  th = faixa('sn-a', function(v){ th = v * Math.PI / 180; rot(); L.agita(); }) * Math.PI / 180;
  rot();
  return L;
};

/* ---------------------------------------------------------------
   REFLEXAO TOTAL — agua -> ar, e a fibra optica
   --------------------------------------------------------------- */
SIM.total = function(fig){
  var T = tela(fig), g = T.g, w = T.w, h = T.h;
  var n1 = 1.33, n2 = 1, th = 30 * Math.PI / 180;
  var cy = h * .36, cx = w * .5, R = 250;
  var thc = Fisica.anguloCritico(n1, n2);
  var L = laco(function(t){
    T.limpa();
    g.fillStyle = rgba(COR.traco, .14); g.fillRect(0, cy, w, h * .62 - cy);
    texto(g, 'AR · n = 1,00', 26, 30, COR.traco, 18);
    texto(g, 'ÁGUA · n = 1,33', 26, cy + 30, COR.traco, 18);
    g.strokeStyle = COR.folha2; g.lineWidth = 2; g.beginPath(); g.moveTo(0, cy); g.lineTo(w, cy); g.stroke();
    g.strokeStyle = rgba(COR.folha, .6); g.setLineDash([7, 7]);
    g.beginPath(); g.moveTo(cx, cy - 200); g.lineTo(cx, cy + 200); g.stroke(); g.setLineDash([]);
    /* marca do angulo critico */
    g.strokeStyle = rgba(COR.laser, .5); g.setLineDash([3, 6]); g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.sin(thc) * 230, cy + Math.cos(thc) * 230); g.stroke(); g.setLineDash([]);
    texto(g, 'ângulo limite', cx - Math.sin(thc) * 250 - 10, cy + Math.cos(thc) * 250, COR.laser, 17, 'right');
    var t2 = Fisica.snell(n1, n2, th), tot = t2 === null;
    seta(g, cx - Math.sin(th) * R, cy + Math.cos(th) * R, cx, cy, COR.laser, 5, 18);
    g.globalAlpha = tot ? 1 : .3;
    seta(g, cx, cy, cx + Math.sin(th) * R, cy + Math.cos(th) * R, COR.laser, tot ? 5 : 3, tot ? 18 : 14);
    g.globalAlpha = 1;
    if (!tot) seta(g, cx, cy, cx + Math.sin(t2) * 220, cy - Math.cos(t2) * 220, COR.laser, 5, 18);
    texto(g, tot ? 'REFLEXÃO TOTAL: nada sai para o ar' : 'parte sai (refrata) e parte volta (reflete)', w - 26, 30, tot ? COR.laser : COR.folha, 19, 'right');
    /* fibra optica */
    var fy = h * .80, fh = 70, fx0 = 40, fx1 = w - 40;
    g.fillStyle = rgba(COR.traco, .22); g.fillRect(fx0, fy - fh / 2, fx1 - fx0, fh);
    g.strokeStyle = COR.folha2; g.lineWidth = 2; g.strokeRect(fx0, fy - fh / 2, fx1 - fx0, fh);
    texto(g, 'FIBRA ÓPTICA: a luz fica presa por reflexão total', fx0, fy - fh / 2 - 22, COR.traco, 16);
    var passo = 150, fase = (t * 260) % (2 * passo);
    g.strokeStyle = rgba(COR.laser, .35); g.lineWidth = 2; g.beginPath();
    for (var x = fx0; x <= fx1; x += 4){
      var u = ((x - fx0) % (2 * passo)) / passo, y = fy + (fh / 2 - 6) * (u < 1 ? 1 - 2 * u : 2 * u - 3);
      x === fx0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    /* pulso de luz percorrendo o zigue-zague */
    var xp = fx0 + ((t * 260) % (fx1 - fx0));
    var up = ((xp - fx0) % (2 * passo)) / passo, yp = fy + (fh / 2 - 6) * (up < 1 ? 1 - 2 * up : 2 * up - 3);
    g.fillStyle = COR.laser; g.beginPath(); g.arc(xp, yp, 8, 0, 7); g.fill();
  });
  function rot(){
    var t2 = Fisica.snell(n1, n2, th), d = 180 / Math.PI;
    etiqueta(fig, 'inclinação do raio: ' + fmt(th * d) + '°\n' +
      (t2 === null ? 'passou do ângulo limite: reflexão total' : 'ainda sai para o ar'));
  }
  th = faixa('tot-a', function(v){ th = v * Math.PI / 180; rot(); L.agita(); }) * Math.PI / 180;
  rot();
  return L;
};
