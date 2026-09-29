"use strict";
/* =================================================================
   MOTOR — palco, navegacao, passos e ciclo de vida das simulacoes.

   Cada <figure data-sim="nome"> e ligada a SIM[nome] = funcao(fig)
   que devolve {start, stop, draw}. So a prancha visivel anima: ao
   sair dela chamamos stop(), e o laco do GSAP deixa de rodar ali.
   ================================================================= */
var COR = {
  prussia: '#123a63', fundo: '#0b2745', borda: '#2b5680',
  folha: '#eef3f6', folha2: '#b9cde0', traco: '#8fb3d4', laser: '#ff6a3d', tinta: '#0f1b24'
};
var FONTE = {
  mono: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
  sans: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, Arial, sans-serif',
  serif: '"Young Serif", Georgia, serif'
};
var SIM = {};
var REDUZIR = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var IMPRIMIR = location.hash === '#imprimir';

/* ---------- utilitarios ---------- */
function fmt(v, d){ return v.toFixed(d == null ? 0 : d).replace('.', ','); }
/* milhar com espaco fino, como no ENEM: 5 240 */
function milhar(v){ return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function rgba(hex, a){
  var n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}

/* Canvas 2D que ocupa a figura. Resolucao interna = tamanho no palco
   x2 (o palco e escalado por CSS, entao px de layout sao fixos). */
function tela(fig){
  var c = document.createElement('canvas');
  fig.insertBefore(c, fig.firstChild);
  var w = fig.clientWidth, h = fig.clientHeight, k = 2;
  c.width = w * k; c.height = h * k;
  var g = c.getContext('2d');
  g.scale(k, k);
  return {c: c, g: g, w: w, h: h,
    limpa: function(){ g.clearRect(0, 0, w, h); }};
}

/* Liga botoes de uma figura: grupo por atributo data-*, marca .sel */
function botoes(fig, attr, fn){
  var bs = fig.querySelectorAll('button[data-' + attr + ']');
  bs.forEach(function(b){
    b.addEventListener('click', function(ev){
      ev.stopPropagation();
      bs.forEach(function(o){ o.classList.toggle('sel', o === b); });
      b.blur();
      fn(b.getAttribute('data-' + attr), b);
    });
  });
}
function acao(fig, nome, fn){
  var b = fig.querySelector('button[data-acao="' + nome + '"]');
  if (b) b.addEventListener('click', function(ev){ ev.stopPropagation(); b.blur(); fn(b); });
}
function faixa(id, fn){
  var el = document.getElementById(id);
  el.addEventListener('input', function(){ fn(parseFloat(el.value)); });
  el.addEventListener('click', function(ev){ ev.stopPropagation(); });
  el.addEventListener('keydown', function(ev){ ev.stopPropagation(); });
  el.addEventListener('change', function(){ el.blur(); });   /* soltou: setas voltam a navegar */
  return parseFloat(el.value);
}
function etiqueta(fig, txt){ var v = fig.querySelector('.val'); if (v) v.textContent = txt; }

/* Laco de animacao por prancha, no relogio do GSAP. dt em segundos. */
function laco(fn){
  var on = false, t = 0;
  function tick(time, dm){ var dt = Math.min(dm / 1000, 1 / 20); t += dt; fn(t, dt); }
  return {
    start: function(){ if (on) return; on = true; if (REDUZIR || IMPRIMIR){ fn(t + 0.37, 0); return; } gsap.ticker.add(tick); },
    stop: function(){ on = false; gsap.ticker.remove(tick); },
    tempo: function(){ return t; },
    /* avanca um quadro com relogio externo (tests/animacoes.html) */
    quadro: function(dt){ t += dt; fn(t, dt); },
    /* depois de mudar um parametro: sem animacao, redesenha uma vez */
    agita: function(){ if (REDUZIR || IMPRIMIR) fn(t + 0.37, 0); }
  };
}

/* Desenho de apoio: seta, texto mono, regua com cotas */
function seta(g, x0, y0, x1, y1, cor, lw, ponta){
  var a = Math.atan2(y1 - y0, x1 - x0), p = ponta || 12;
  g.strokeStyle = cor; g.fillStyle = cor; g.lineWidth = lw || 2;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - Math.cos(a) * p * .6, y1 - Math.sin(a) * p * .6); g.stroke();
  g.beginPath(); g.moveTo(x1, y1);
  g.lineTo(x1 - p * Math.cos(a - .38), y1 - p * Math.sin(a - .38));
  g.lineTo(x1 - p * Math.cos(a + .38), y1 - p * Math.sin(a + .38));
  g.closePath(); g.fill();
}
function texto(g, s, x, y, cor, tam, alinh, fonte){
  g.fillStyle = cor || COR.folha;
  g.font = (tam || 18) + 'px ' + (fonte || FONTE.mono);
  g.textAlign = alinh || 'left'; g.textBaseline = 'middle';
  g.fillText(s, x, y);
}
function cota(g, x0, y0, x1, y1, rot, cor, lado){
  cor = cor || COR.laser;
  g.save(); g.setLineDash([]);
  var a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * 8, ny = Math.cos(a) * 8;
  g.strokeStyle = cor; g.lineWidth = 2;
  g.beginPath(); g.moveTo(x0 + nx, y0 + ny); g.lineTo(x0 - nx, y0 - ny); g.moveTo(x1 + nx, y1 + ny); g.lineTo(x1 - nx, y1 - ny); g.stroke();
  seta(g, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, cor, 2, 10);
  seta(g, (x0 + x1) / 2, (y0 + y1) / 2, x0, y0, cor, 2, 10);
  if (rot){
    var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    var ox = Math.abs(a) < .2 || Math.abs(Math.abs(a) - Math.PI) < .2 ? 0 : (lado === 'e' ? -22 : 22), oy = ox ? 0 : -18;
    g.font = '26px ' + FONTE.serif; g.textBaseline = 'middle';
    g.fillStyle = COR.fundo; var m = g.measureText(rot).width;
    var xt = ox > 0 ? mx + ox : ox < 0 ? mx + ox - m : mx - m / 2;     /* canto esquerdo do texto */
    g.fillRect(xt - 6, my + oy - 16, m + 12, 32);
    g.textAlign = 'left'; g.fillStyle = cor; g.fillText(rot, xt, my + oy);
  }
  g.restore();
}

/* ---------- palco e navegacao ---------- */
var stage = document.getElementById('stage');
var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
var atual = -1, passo = 0;
var vivas = {};  /* nome da prancha -> instancia da simulacao */

slides.forEach(function(s, i){
  var r = document.createElement('div');
  r.className = 'rod';
  var bl = s.querySelector('.cab .bloco');
  r.innerHTML = '<span>ondas · som · luz</span><span class="n">' +
    String(i + 1).padStart(2, '0') + ' / ' + slides.length + '</span>';
  if (!s.classList.contains('capa')) s.appendChild(r);
});

function escala(){
  if (IMPRIMIR) return;
  var k = Math.min(innerWidth / 1600, innerHeight / 900);
  stage.style.transform = 'translate(' + (innerWidth - 1600 * k) / 2 + 'px,' + (innerHeight - 900 * k) / 2 + 'px) scale(' + k + ')';
}
addEventListener('resize', escala);

function instancia(fig){
  if (fig._sim) return fig._sim;
  var nome = fig.getAttribute('data-sim');
  if (!SIM[nome]) return null;
  try { fig._sim = SIM[nome](fig); }
  catch (e){ console.error('prancha', nome, e); fig._sim = null; }
  return fig._sim;
}

function mostraPassos(s, n, anima){
  s.querySelectorAll('[data-step]').forEach(function(el){
    var on = +el.getAttribute('data-step') <= n, era = el.classList.contains('vis');
    el.classList.toggle('vis', on);
    if (on && !era && anima && !REDUZIR && window.gsap)
      gsap.fromTo(el, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'transform'});
  });
}

function vai(i, p){
  i = clamp(i, 0, slides.length - 1);
  if (i !== atual){
    if (atual >= 0){
      slides[atual].classList.remove('on');
      slides[atual].querySelectorAll('[data-sim]').forEach(function(f){ if (f._sim && f._sim.stop) f._sim.stop(); });
    }
    atual = i;
    slides[i].classList.add('on');
    slides[i].querySelectorAll('[data-sim]').forEach(function(f){ var s = instancia(f); if (s && s.start) s.start(); });
    try { history.replaceState(null, '', '#' + (i + 1)); } catch (e){ /* file:// em alguns contextos */ }
  }
  passo = p || 0;
  mostraPassos(slides[i], passo, true);
  document.getElementById('prog').style.width = (100 * (i + 1) / slides.length) + '%';
}
function avanca(){
  var max = +(slides[atual].getAttribute('data-steps') || 0);
  if (passo < max){ passo++; mostraPassos(slides[atual], passo, true); }
  else vai(atual + 1, 0);
}
function volta(){
  if (passo > 0){ passo--; mostraPassos(slides[atual], passo, false); }
  else { var j = atual - 1; vai(j, +(slides[Math.max(j, 0)].getAttribute('data-steps') || 0)); }
}

addEventListener('keydown', function(e){
  if (e.target && /input|textarea/i.test(e.target.tagName)) return;
  var k = e.key;
  if (k === 'ArrowRight' || k === ' ' || k === 'PageDown' || k === 'Enter'){ e.preventDefault(); avanca(); }
  else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace'){ e.preventDefault(); volta(); }
  else if (k === 'Home') vai(0, 0);
  else if (k === 'End') vai(slides.length - 1, 0);
  else if (k === 'f' && document.documentElement.requestFullscreen)
    document.documentElement.requestFullscreen().catch(function(){});
});
/* clique fora de controles: metade direita avanca, esquerda volta */
stage.addEventListener('click', function(e){
  if (e.target.closest('button, input, label, a, .ctl')) return;
  var r = stage.getBoundingClientRect();
  if (e.clientX - r.left > r.width * .35) avanca(); else volta();
});
