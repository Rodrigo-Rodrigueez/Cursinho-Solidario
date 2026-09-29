"use strict";
/* =================================================================
   PRANCHAS 3D — Three.js (0.158, build UMD). Cada cena cria o proprio
   renderizador na primeira vez que a prancha aparece e so renderiza
   enquanto ela esta visivel.
   ================================================================= */

function cena3d(fig, o){
  o = o || {};
  var w = fig.clientWidth, h = fig.clientHeight;
  var r = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: IMPRIMIR});
  r.setPixelRatio(1.6);
  r.setSize(w, h, false);
  r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  fig.insertBefore(r.domElement, fig.firstChild);
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(COR.fundo);
  var cam = new THREE.PerspectiveCamera(o.fov || 38, w / h, .1, 200);
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  var sol = new THREE.DirectionalLight(0xffffff, 1.1);
  sol.position.set(-4, 10, 6); scene.add(sol);
  var rots = [];
  var v3 = new THREE.Vector3();
  return {
    r: r, scene: scene, cam: cam, w: w, h: h,
    /* rotulo HTML preso a um ponto 3D */
    rotulo: function(txt, pos){
      var el = document.createElement('div'); el.className = 'lbl3d'; el.textContent = txt;
      fig.appendChild(el); var R = {el: el, pos: pos.clone()}; rots.push(R); return R;
    },
    render: function(){
      r.render(scene, cam);
      rots.forEach(function(R){
        v3.copy(R.pos).project(cam);
        R.el.style.left = ((v3.x * .5 + .5) * w) + 'px';
        R.el.style.top = ((-v3.y * .5 + .5) * h) + 'px';
        R.el.style.display = v3.z < 1 ? '' : 'none';
      });
    }
  };
}
function cor3(hex){ return new THREE.Color(hex); }
function misturaCor(out, a, b, t){ out.r = a.r + (b.r - a.r) * t; out.g = a.g + (b.g - a.g) * t; out.b = a.b + (b.b - a.b) * t; return out; }

/* ---------------------------------------------------------------
   MURO — equacao de onda 2D por diferencas finitas (FDTD).
   A difracao nao e desenhada: ela SAI da equacao, porque o muro e
   so uma regiao onde a onda e forcada a zero.
   --------------------------------------------------------------- */
SIM.muro = function(fig){
  var C = cena3d(fig, {fov: 36});
  var NX = 200, NZ = 120, DX = .1;                 /* 20 m x 12 m */
  var WX = NX * DX, WZ = NZ * DX;
  var u = new Float32Array(NX * NZ), up = new Float32Array(NX * NZ), un = new Float32Array(NX * NZ);
  var amort = new Float32Array(NX * NZ), parede = new Uint8Array(NX * NZ);
  var C2 = .25, borda = 30;
  var iw = 100, zw1 = 75;                           /* muro em x = 10 m, de z = 0 a 7,5 m */
  for (var j = 0; j < NZ; j++) for (var i = 0; i < NX; i++){
    var k = j * NX + i, dist = Math.min(i, NX - 1 - i, j, NZ - 1 - j);
    /* camada absorvente: amortecimento cresce devagar ate a borda, senao ela reflete */
    amort[k] = dist < borda ? Math.exp(-.09 * Math.pow((borda - dist) / borda, 2)) : 1;
    if (i >= iw - 2 && i <= iw + 1 && j <= zw1) parede[k] = 1;
  }
  var SI = 64, SJ = 34, OI = 136, OJ = 34;          /* fonte e ouvinte, os dois atras do muro */
  var PER = 24, passo = 0, acc = 0;                          /* lambda = PER * sqrt(C2) celulas = 12 = 1,2 m */
  function avanca(){
    for (var j = 1; j < NZ - 1; j++) for (var i = 1; i < NX - 1; i++){
      var k = j * NX + i;
      if (parede[k]){ un[k] = 0; continue; }
      var lap = u[k - 1] + u[k + 1] + u[k - NX] + u[k + NX] - 4 * u[k];
      un[k] = (2 * u[k] - up[k] + C2 * lap) * amort[k];
    }
    /* fonte macia: soma ao campo em vez de impor o valor (fonte dura reflete) */
    var sfonte = .5 * Math.sin(Fisica.TAU * passo / PER);
    for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) un[(SJ + dj) * NX + SI + di] += sfonte * (di || dj ? .5 : 1);
    var tmp = up; up = u; u = un; un = tmp; passo++;
  }
  /* malha do chao */
  var geo = new THREE.PlaneGeometry(WX, WZ, NX - 1, NZ - 1);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position, cols = new Float32Array(NX * NZ * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  var mat = new THREE.MeshBasicMaterial({vertexColors: true});
  var chao = new THREE.Mesh(geo, mat);
  C.scene.add(chao);
  var cF = cor3(COR.fundo), cT = cor3(COR.traco), cL = cor3(COR.folha), tmpc = new THREE.Color();
  function xw(i){ return i * DX - WX / 2 + DX / 2; }
  function zw(j){ return j * DX - WZ / 2 + DX / 2; }
  /* muro */
  var muro = new THREE.Mesh(new THREE.BoxGeometry(.4, 2.4, zw1 * DX),
    new THREE.MeshLambertMaterial({color: cor3(COR.folha2)}));
  muro.position.set(xw(iw) - DX / 2, 1.2, zw(0) + zw1 * DX / 2 - DX / 2);
  C.scene.add(muro);
  var fonte = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 16), new THREE.MeshBasicMaterial({color: cor3(COR.laser)}));
  fonte.position.set(xw(SI), .5, zw(SJ)); C.scene.add(fonte);
  var voce = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 1.6, 20), new THREE.MeshLambertMaterial({color: cor3(COR.folha)}));
  voce.position.set(xw(OI), .8, zw(OJ)); C.scene.add(voce);
  C.rotulo('quem fala', new THREE.Vector3(xw(SI), 1.4, zw(SJ)));
  C.rotulo('você', new THREE.Vector3(xw(OI), 2.1, zw(OJ)));
  C.rotulo('muro', new THREE.Vector3(muro.position.x, 2.9, zw(45)));
  /* modo luz: raios retos e sombra */
  var raios = new THREE.Group(); raios.visible = false; C.scene.add(raios);
  (function(){
    var S = new THREE.Vector3(xw(SI), .3, zw(SJ)), xm = muro.position.x - .2, zTop = zw(zw1) + DX / 2;
    var pts = [];
    for (var a = -Math.PI * .47; a <= Math.PI * .47; a += Math.PI / 30){
      var dx = Math.cos(a), dz = Math.sin(a), s = (xm - S.x) / dx, zh = S.z + dz * s, fim;
      if (zh <= zTop && zh >= zw(0) - DX) fim = new THREE.Vector3(xm, .3, zh);
      else {
        var sx = (WX / 2 - S.x) / dx, sz = dz > 0 ? (WZ / 2 - S.z) / dz : (-WZ / 2 - S.z) / dz;
        var sm = Math.min(sx, sz); fim = new THREE.Vector3(S.x + dx * sm, .3, S.z + dz * sm);
      }
      pts.push(S, fim);
    }
    var lg = new THREE.BufferGeometry().setFromPoints(pts);
    raios.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color: cor3(COR.laser)})));
    /* sombra: atras do muro, limitada pela reta que passa rente a ponta */
    var dzT = (zTop - S.z) / (xm - S.x), zFar = zTop + dzT * (WX / 2 - xm);
    var sh = new THREE.Shape();
    sh.moveTo(xm + .2, -WZ / 2); sh.lineTo(WX / 2, -WZ / 2); sh.lineTo(WX / 2, Math.min(zFar, WZ / 2)); sh.lineTo(xm + .2, zTop); sh.closePath();
    var sg = new THREE.ShapeGeometry(sh); sg.rotateX(Math.PI / 2);
    var sm2 = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: .45, side: THREE.DoubleSide}));
    sm2.position.y = .02; raios.add(sm2);
  })();
  var rotSombra = C.rotulo('sombra', new THREE.Vector3(xw(160), .4, zw(20)));
  rotSombra.el.style.visibility = 'hidden';
  var modo = 'som';
  function pinta(){
    for (var k = 0; k < NX * NZ; k++){
      /* tanh: comprime o brilho perto da fonte sem apagar o campo distante */
      var v = modo === 'som' ? Math.tanh(u[k] * 2.2) : 0, a = Math.abs(v);
      pos.setY(k, parede[k] ? 0 : v * .45);
      if (v > 0) misturaCor(tmpc, cF, cL, Math.pow(a, .8)); else misturaCor(tmpc, cF, cT, a * .45);
      cols[k * 3] = tmpc.r; cols[k * 3 + 1] = tmpc.g; cols[k * 3 + 2] = tmpc.b;
    }
    pos.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  }
  C.cam.position.set(-1.5, 15.5, 12.5); C.cam.lookAt(0.5, -1.2, 0);
  for (var q = 0; q < 360; q++) avanca();          /* a prancha ja abre com a onda formada */
  var L = laco(function(t, dt){
    if (modo === 'som'){
      if (dt === 0){ while (passo < 700) avanca(); }       /* estado parado: campo ja formado */
      else {
        /* 20 passos por segundo: PER = 24 passos por oscilacao -> ~0,8 oscilacao por segundo */
        acc += dt * 20;
        while (acc >= 1){ avanca(); acc -= 1; }
      }
    }
    pinta(); C.render();
  });
  function rot(){
    etiqueta(fig, modo === 'som' ? 'som: λ = 1,2 m · muro: 7,5 m\no som contorna a ponta do muro e chega a você'
      : 'luz: λ ≈ 0,0000005 m, muito menor que o muro\nvai reto e deixa sombra');
  }
  botoes(fig, 'modo', function(v){
    modo = v; raios.visible = v === 'luz';
    rotSombra.el.style.visibility = v === 'luz' ? 'visible' : 'hidden';
    rot(); L.agita();
  });
  rot();
  return L;
};

/* ---------------------------------------------------------------
   ONDA ELETROMAGNETICA (e polarizacao, com filtro)
   --------------------------------------------------------------- */
function ondaEM(fig, polar){
  var C = cena3d(fig, {fov: 34});
  var N = 56, X0 = -7, X1 = 7, lam = 4.2, A = 1.6;
  var matE = new THREE.MeshLambertMaterial({color: cor3(COR.laser)});
  var matB = new THREE.MeshLambertMaterial({color: cor3(COR.traco)});
  var gv = new THREE.CylinderGeometry(.045, .045, 1, 8); gv.translate(0, .5, 0);
  var E = [], B = [];
  for (var i = 0; i < N; i++){
    var x = X0 + (X1 - X0) * i / (N - 1);
    var e = new THREE.Mesh(gv, matE); e.position.x = x; C.scene.add(e); E.push(e);
    if (!polar){ var b = new THREE.Mesh(gv, matB); b.position.x = x; b.rotation.x = Math.PI / 2; C.scene.add(b); B.push(b); }
  }
  /* curvas pelas pontas */
  function curva(cor){
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(200 * 3), 3));
    var l = new THREE.Line(g, new THREE.LineBasicMaterial({color: cor3(cor)})); C.scene.add(l); return l;
  }
  var cE = curva(COR.laser), cB = polar ? null : curva(COR.traco);
  /* eixo de propagacao */
  var eixo = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, X1 - X0 + 1.4, 8), new THREE.MeshLambertMaterial({color: cor3(COR.folha)}));
  eixo.rotation.z = Math.PI / 2; eixo.position.x = .7; C.scene.add(eixo);
  var ponta = new THREE.Mesh(new THREE.ConeGeometry(.16, .5, 16), new THREE.MeshLambertMaterial({color: cor3(COR.folha)}));
  ponta.rotation.z = -Math.PI / 2; ponta.position.x = X1 + 1.6; C.scene.add(ponta);
  C.rotulo('propagação', new THREE.Vector3(X1 + 1.2, .5, 0));
  if (!polar){ C.rotulo('E', new THREE.Vector3(X0, A + .6, 0)); C.rotulo('B', new THREE.Vector3(X0, 0, A + .6)); }
  /* filtro polarizador: moldura com fendas */
  var filtro = null, st = {ang: 0};
  if (polar){
    filtro = new THREE.Group();
    var mf = new THREE.MeshLambertMaterial({color: cor3(COR.folha2)});
    var S = 2.6;
    [[0, S, S * 2 + .3, .18], [0, -S, S * 2 + .3, .18], [S, 0, .18, S * 2], [-S, 0, .18, S * 2]].forEach(function(b){
      var m = new THREE.Mesh(new THREE.BoxGeometry(.12, b[3], b[2]), mf); m.position.set(0, b[1], b[0]); filtro.add(m);
    });
    var mfenda = new THREE.MeshBasicMaterial({color: cor3(COR.traco), transparent: true, opacity: .55});
    for (var q = -S + .35; q < S; q += .35){
      var f = new THREE.Mesh(new THREE.BoxGeometry(.04, S * 2, .05), mfenda); f.position.z = q; filtro.add(f);
    }
    /* as fendas sao verticais: deixam passar vibracao vertical */
    C.scene.add(filtro);
    C.rotulo('filtro', new THREE.Vector3(0, S + .6, 0));
  }
  C.cam.position.set(6.5, 4.2, 10.5); C.cam.lookAt(.6, 0, 0);
  var baseCam = C.cam.position.clone();
  var L = laco(function(t){
    var k = Fisica.TAU / lam, wt = Fisica.TAU * .45 * t;
    var fator = polar ? Math.cos(st.ang) : 1;              /* Malus, em amplitude */
    var pe = cE.geometry.attributes.position, pb = cB && cB.geometry.attributes.position;
    for (var i = 0; i < N; i++){
      var x = E[i].position.x, v = A * Math.sin(k * x - wt);
      if (polar && x > 0) v *= fator;
      E[i].scale.y = Math.abs(v) < 1e-3 ? 1e-3 : v;
      if (!polar) B[i].scale.y = Math.abs(v) < 1e-3 ? 1e-3 : v;
    }
    for (var j = 0; j < 200; j++){
      var xx = X0 + (X1 - X0) * j / 199, vv = A * Math.sin(k * xx - wt);
      if (polar && xx > 0) vv *= fator;
      pe.setXYZ(j, xx, vv, 0);
      if (pb) pb.setXYZ(j, xx, 0, vv);
    }
    pe.needsUpdate = true; if (pb) pb.needsUpdate = true;
    if (filtro) filtro.rotation.x = st.ang;
    /* balanco leve da camera, para ler o 3D */
    var a = .22 * Math.sin(t * .25);
    C.cam.position.set(baseCam.x * Math.cos(a) - baseCam.z * Math.sin(a), baseCam.y, baseCam.x * Math.sin(a) + baseCam.z * Math.cos(a));
    C.cam.lookAt(.6, 0, 0);
    C.render();
  });
  if (polar){
    botoes(fig, 'filtro', function(v){
      tween(st, {ang: +v * Math.PI / 180, duration: REDUZIR || IMPRIMIR ? 0 : 1}, L);
      etiqueta(fig, v === '0' ? 'onda vibrando na vertical\nfiltro vertical: passa inteira' : 'onda vibrando na vertical\nfiltro horizontal: bloqueada');
    });
    etiqueta(fig, 'onda vibrando na vertical\nfiltro vertical: passa inteira');
  }
  return L;
}
SIM.em = function(fig){ return ondaEM(fig, false); };
SIM.polar = function(fig){ return ondaEM(fig, true); };

/* ---------------------------------------------------------------
   CUBA DE ONDAS — duas fontes, superficie 3D
   --------------------------------------------------------------- */
SIM.cuba = function(fig){
  var C = cena3d(fig, {fov: 34});
  var SX = 150, SZ = 110, W = 15, H = 11, lam = 1.2, FV = .35;   /* FV: frequencia visual, lenta */
  var geo = new THREE.PlaneGeometry(W, H, SX - 1, SZ - 1); geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position, n = pos.count, cols = new Float32Array(n * 3);
  var env = new Float32Array(n);                    /* amplitude de cada ponto (envoltoria) */
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  var agua = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors: true, roughness: .5, metalness: .05}));
  C.scene.add(agua);
  var st = {fase: 0, d: 2.5, alvo: 0};
  var zF = -H / 2 + 2.6;
  var pinos = [0, 1].map(function(){
    var m = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.2, 16), new THREE.MeshBasicMaterial({color: cor3(COR.laser)}));
    C.scene.add(m); return m;
  });
  var r1 = C.rotulo('fonte 1', new THREE.Vector3()), r2 = C.rotulo('fonte 2', new THREE.Vector3());
  /* ponto de prova: comeca no meio, o clique na agua o move */
  var sonda = {x: 0, z: 2.6};
  var marca = new THREE.Mesh(new THREE.TorusGeometry(.32, .06, 8, 32), new THREE.MeshBasicMaterial({color: cor3(COR.laser)}));
  marca.rotation.x = Math.PI / 2; C.scene.add(marca);
  var rP = C.rotulo('ponto marcado', new THREE.Vector3());
  /* quadro com as duas ondas e a soma, no ponto marcado */
  var qc = document.createElement('canvas'); qc.className = 'sonda'; fig.appendChild(qc);
  var QW = 360, QH = 190; qc.width = QW * 2; qc.height = QH * 2;
  var q = qc.getContext('2d'); q.scale(2, 2);
  var cF = cor3(COR.fundo), cL = cor3(COR.folha), tmpc = new THREE.Color();
  C.cam.position.set(0, 10.5, 10.8); C.cam.lookAt(0, -1.6, -.7);
  var base = C.cam.position.clone();
  function fontes(){ var fx = st.d * lam / 2; return [{x: -fx, y: zF, fase: 0}, {x: fx, y: zF, fase: st.fase}]; }
  var ultimo = '';
  function envoltoria(F){
    var chave = st.d + '|' + st.fase.toFixed(3);
    if (chave === ultimo) return;
    ultimo = chave;
    for (var k = 0; k < n; k++){
      var e = Fisica.envelopeCuba(pos.getX(k), pos.getZ(k), F, lam) / 2;   /* 0..~1 */
      env[k] = e;
      /* claro = oscila muito (construtiva); escuro = quase parado (destrutiva) */
      misturaCor(tmpc, cF, cL, Math.pow(clamp(e * 1.15, 0, 1), 1.3));
      cols[k * 3] = tmpc.r; cols[k * 3 + 1] = tmpc.g; cols[k * 3 + 2] = tmpc.b;
    }
    geo.attributes.color.needsUpdate = true;
  }
  function quadro(F, t){
    /* y1, y2 e y1 + y2 no ponto marcado, nos ultimos 2,5 periodos */
    var k = Fisica.TAU / lam, w = Fisica.TAU * FV;
    var ps = F.map(function(P){ var r = Math.hypot(sonda.x - P.x, sonda.z - P.y); return {a: 1 / Math.sqrt(1 + r / lam), ph: k * r + (P.fase || 0)}; });
    var esc = 21 / ps[0].a;                        /* escala: a soma (ate 2x) cabe no quadro */
    q.clearRect(0, 0, QW, QH);
    texto(q, 'NO PONTO MARCADO', 12, 16, COR.traco, 13);
    var linhas = [
      {y: 62, rot: 'fonte 1', f: function(tt){ return ps[0].a * Math.sin(ps[0].ph - w * tt); }, cor: COR.traco},
      {y: 62, rot: 'fonte 2', f: function(tt){ return ps[1].a * Math.sin(ps[1].ph - w * tt); }, cor: COR.folha2, tr: true},
      {y: 136, rot: 'soma', f: function(tt){ return ps[0].a * Math.sin(ps[0].ph - w * tt) + ps[1].a * Math.sin(ps[1].ph - w * tt); }, cor: COR.laser}
    ];
    linhas.forEach(function(Li){
      q.strokeStyle = rgba(COR.traco, .25); q.lineWidth = 1;
      q.beginPath(); q.moveTo(70, Li.y); q.lineTo(QW - 10, Li.y); q.stroke();
      q.strokeStyle = Li.cor; q.lineWidth = Li.cor === COR.laser ? 3 : 2; q.setLineDash(Li.tr ? [5, 4] : []);
      q.beginPath();
      for (var i = 0; i <= 140; i++){
        var tt = t - 2.5 / FV * (1 - i / 140), X = 70 + (QW - 80) * i / 140, Y = Li.y - esc * Li.f(tt);
        i ? q.lineTo(X, Y) : q.moveTo(X, Y);
      }
      q.stroke(); q.setLineDash([]);
    });
    texto(q, '1 e 2', 12, 62, COR.folha2, 14);
    texto(q, 'soma', 12, 136, COR.laser, 14);
  }
  function rot(){
    var F = fontes(), r1s = Math.hypot(sonda.x - F[0].x, sonda.z - F[0].y), r2s = Math.hypot(sonda.x - F[1].x, sonda.z - F[1].y);
    var A = Fisica.amplitudeDuasFontes(r1s, r2s, lam, st.alvo * Math.PI / 180);
    var tipo = A > 1.6 ? 'construtiva: as ondas se reforçam' : A < .4 ? 'destrutiva: as ondas se cancelam' : 'meio-termo';
    etiqueta(fig, 'fontes ' + (st.alvo ? 'opostas (180°)' : 'em fase') + '\n' +
      'diferença de caminho: ' + fmt(Math.abs(r1s - r2s) / lam, 1) + ' λ\n' + tipo);
  }
  var L = laco(function(t){
    var F = fontes();
    envoltoria(F);
    for (var k = 0; k < n; k++){
      pos.setY(k, Fisica.cuba(pos.getX(k), pos.getZ(k), F, lam, FV, t) * .16);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    var osc = Fisica.TAU * FV * t;
    pinos[0].position.set(F[0].x, .3 + .15 * Math.sin(osc), zF);
    pinos[1].position.set(F[1].x, .3 + .15 * Math.sin(osc - st.fase), zF);
    r1.pos.set(F[0].x, .1, zF + 1); r2.pos.set(F[1].x, .1, zF + 1);   /* rotulos abaixo dos pinos */
    marca.position.set(sonda.x, .3, sonda.z); rP.pos.set(sonda.x, .9, sonda.z);
    var a2 = .1 * Math.sin(t * .15);
    C.cam.position.set(base.x * Math.cos(a2) - base.z * Math.sin(a2), base.y, base.x * Math.sin(a2) + base.z * Math.cos(a2));
    C.cam.lookAt(0, -1.6, -.7);
    C.render();
    quadro(F, t);
  });
  /* clique na agua: move o ponto marcado (raio da camera ate o plano y = 0) */
  var ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), alvo = new THREE.Vector3();
  C.r.domElement.style.cursor = 'crosshair';
  C.r.domElement.addEventListener('click', function(ev){
    ev.stopPropagation();
    var R = C.r.domElement.getBoundingClientRect();
    mouse.set((ev.clientX - R.left) / R.width * 2 - 1, -(ev.clientY - R.top) / R.height * 2 + 1);
    ray.setFromCamera(mouse, C.cam);
    if (ray.ray.intersectPlane(plano, alvo) && Math.abs(alvo.x) < W / 2 && Math.abs(alvo.z) < H / 2){
      sonda.x = alvo.x; sonda.z = alvo.z; rot(); L.agita();
    }
  });
  botoes(fig, 'fase', function(v){
    st.alvo = +v;
    tween(st, {fase: st.alvo * Math.PI / 180, duration: REDUZIR || IMPRIMIR ? 0 : .8}, L);
    rot();
  });
  st.d = faixa('cuba-d', function(v){ st.d = v; rot(); L.agita(); });
  rot();
  return L;
};

/* ---------------------------------------------------------------
   OLHO — tracado paraxial de raios em 3D (feixe de raios paralelos)
   Unidade: 1 = 1 cm. A lente do olho e tratada como lente fina.
   --------------------------------------------------------------- */
SIM.olho = function(fig){
  var C = cena3d(fig, {fov: 32});
  var Rg = 1.2, xl0 = -.95, fe = 2.15;              /* olho normal: foco cai na retina (x = 1.2) */
  var st = {esc: 1, lente: 0};                      /* esc: alongamento do olho; lente: 0..1 entrada */
  var modo = 'normal', comLente = false;
  var olho = new THREE.Group(); C.scene.add(olho);
  /* globo em corte: meia esfera + contornos */
  var globo = new THREE.Mesh(new THREE.SphereGeometry(Rg, 48, 32, 0, Math.PI),
    new THREE.MeshLambertMaterial({color: cor3(COR.traco), transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false}));
  globo.rotation.y = Math.PI / 2; olho.add(globo);
  var anel = new THREE.Mesh(new THREE.TorusGeometry(Rg, .02, 8, 96), new THREE.MeshBasicMaterial({color: cor3(COR.traco)}));
  olho.add(anel);
  var retina = new THREE.Mesh(new THREE.SphereGeometry(Rg * .985, 48, 24, 0, Math.PI * 2, 0, Math.PI * .32),
    new THREE.MeshLambertMaterial({color: cor3(COR.folha), transparent: true, opacity: .55, side: THREE.DoubleSide}));
  retina.rotation.z = -Math.PI / 2; olho.add(retina);
  var crist = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 24), new THREE.MeshLambertMaterial({color: cor3(COR.folha), transparent: true, opacity: .45}));
  crist.scale.set(.32, 1, 1); crist.position.x = xl0; olho.add(crist);
  var cornea = new THREE.Mesh(new THREE.SphereGeometry(.62, 32, 16, 0, Math.PI * 2, 0, Math.PI * .3),
    new THREE.MeshLambertMaterial({color: cor3(COR.traco), transparent: true, opacity: .35, side: THREE.DoubleSide}));
  cornea.rotation.z = Math.PI / 2; cornea.position.x = -Rg + .45; olho.add(cornea);
  var rRet = C.rotulo('retina', new THREE.Vector3(Rg, 1.05, 0));
  C.rotulo('cristalino', new THREE.Vector3(xl0, .8, 0));
  /* lente corretora (torno): perfil biconvexo ou bicôncavo */
  var matLente = new THREE.MeshLambertMaterial({color: cor3(COR.folha2), transparent: true, opacity: .55, side: THREE.DoubleSide});
  var lenteM = null, XC = -2.6;
  function fazLente(conv){
    if (lenteM){ C.scene.remove(lenteM); lenteM.geometry.dispose(); }
    var pts = [], Rr = .75;
    for (var i = 0; i <= 20; i++){ var r = Rr * i / 20; pts.push(new THREE.Vector2(r, conv ? .16 * (1 - Math.pow(r / Rr, 2)) + .02 : .03 + .16 * Math.pow(r / Rr, 2))); }
    for (i = 20; i >= 0; i--){ var r2 = Rr * i / 20; pts.push(new THREE.Vector2(r2, -(conv ? .16 * (1 - Math.pow(r2 / Rr, 2)) + .02 : .03 + .16 * Math.pow(r2 / Rr, 2)))); }
    lenteM = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), matLente);
    lenteM.rotation.z = Math.PI / 2; lenteM.position.x = XC; C.scene.add(lenteM);
  }
  var rLente = C.rotulo('', new THREE.Vector3(XC, 1.1, 0)); rLente.el.style.visibility = 'hidden';
  /* feixe: raios paralelos num anel + o central */
  var ALT = [], grupo = new THREE.Group(); C.scene.add(grupo);
  for (var a = 0; a < 8; a++) ALT.push([Math.cos(a * Math.PI / 4) * .42, Math.sin(a * Math.PI / 4) * .42]);
  ALT.push([.2, 0]);
  var matRaio = new THREE.MeshBasicMaterial({color: cor3(COR.laser)});
  var fotons = [], caminhos = [];
  var focoM = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({color: 0xffffff}));
  C.scene.add(focoM);
  function geometria(){
    var e = st.esc, xl = xl0 * e, xr = Rg * e;       /* olho alongado/encurtado ao longo de x */
    olho.scale.set(e, 1, 1);
    rRet.pos.set(xr, 1.05, 0);
    /* lente corretora que leva o foco a retina (Fisica.lenteCorretora) */
    var Lr = xr - xl, D = xl - XC, fc = Fisica.lenteCorretora(fe, Lr, D);
    return {xl: xl, xr: xr, fc: fc, Lr: Lr};
  }
  function traca(){
    var G = geometria(), usa = st.lente > .5 && isFinite(G.fc);
    while (grupo.children.length){ var c = grupo.children.pop(); c.geometry.dispose(); }
    caminhos = [];
    var xFoco = null;
    ALT.forEach(function(p){
      var y = p[0], z = p[1], sy = 0, sz = 0, pts = [new THREE.Vector3(-5.6, y, z)];
      if (usa){
        pts.push(new THREE.Vector3(XC, y, z));
        sy = -y / G.fc; sz = -z / G.fc;
      }
      var xa = usa ? XC : -5.6, dx = G.xl - xa;
      y += sy * dx; z += sz * dx;
      pts.push(new THREE.Vector3(G.xl, y, z));
      sy -= y / fe; sz -= z / fe;
      if (xFoco === null && Math.abs(sy) > 1e-9 && Math.abs(p[1]) < 1e-9) xFoco = G.xl - y / sy;
      /* ate a retina (aprox. plano em xr, depois ajusta para a esfera) */
      var dxr = G.xr - G.xl;
      var yr = y + sy * dxr, zr = z + sz * dxr;
      pts.push(new THREE.Vector3(G.xr - .02, yr, zr));
      caminhos.push(pts);
      for (var i = 0; i < pts.length - 1; i++){
        var a0 = pts[i], a1 = pts[i + 1], len = a0.distanceTo(a1);
        var cil = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, len, 6), matRaio);
        cil.position.copy(a0).add(a1).multiplyScalar(.5);
        cil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a1.clone().sub(a0).normalize());
        grupo.add(cil);
      }
    });
    focoM.position.set(xFoco === null ? G.xr : xFoco, 0, 0);
    focoM.visible = xFoco !== null;
    if (lenteM) lenteM.visible = usa;
    rLente.el.style.visibility = usa ? 'visible' : 'hidden';
    var onde = xFoco === null ? '' : Math.abs(xFoco - G.xr) < .05 ? 'foco sobre a retina' : xFoco < G.xr ? 'foco ANTES da retina' : 'foco DEPOIS da retina';
    etiqueta(fig, (modo === 'normal' ? 'olho normal' : modo === 'miopia' ? 'olho míope (alongado)' : 'olho hipermetrope (curto)') + '\n' + onde +
      (usa ? '\nlente ' + (G.fc < 0 ? 'divergente' : 'convergente') : ''));
  }
  var L = laco(function(t){
    /* fotons andando pelos raios */
    var vel = 3.2;
    if (fotons.length !== caminhos.length){
      fotons.forEach(function(f){ C.scene.remove(f); });
      fotons = caminhos.map(function(){ var m = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({color: 0xffffff})); C.scene.add(m); return m; });
    }
    caminhos.forEach(function(pts, i){
      var tot = 0, seg = [];
      for (var k = 0; k < pts.length - 1; k++){ var l = pts[k].distanceTo(pts[k + 1]); seg.push(l); tot += l; }
      var s = (t * vel + i * .13) % tot;
      for (k = 0; k < seg.length; k++){ if (s <= seg[k]) break; s -= seg[k]; }
      k = Math.min(k, seg.length - 1);
      fotons[i].position.copy(pts[k]).lerp(pts[k + 1], seg[k] ? s / seg[k] : 0);
    });
    var a = -.55 + .25 * Math.sin(t * .3);
    C.cam.position.set(-.8 + 5.6 * Math.sin(a), 1.9, 5.6 * Math.cos(a));
    C.cam.lookAt(-.9, 0, 0);
    C.render();
  });
  var ESC = {normal: 1, miopia: 1.2, hiper: .84};
  function aplica(){
    var conv = modo === 'hiper';
    if (modo !== 'normal') fazLente(conv);
    rLente.el.textContent = conv ? 'lente convergente' : 'lente divergente';
    var alvo = {esc: ESC[modo], lente: comLente && modo !== 'normal' ? 1 : 0};
    gsap.to(st, Object.assign({duration: REDUZIR || IMPRIMIR ? 0 : .9, ease: 'power2.inOut', onUpdate: function(){ traca(); L.agita(); }}, alvo));
    if (REDUZIR || IMPRIMIR){ Object.assign(st, alvo); traca(); L.agita(); }
  }
  botoes(fig, 'olho', function(v){ modo = v; comLente = false; fig.querySelector('[data-acao="lente"]').classList.remove('sel'); aplica(); });
  acao(fig, 'lente', function(b){ comLente = !comLente; b.classList.toggle('sel', comLente); aplica(); });
  traca();
  return L;
};
