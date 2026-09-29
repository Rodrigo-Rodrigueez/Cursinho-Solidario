/* Execute: node --test tests/pistao.test.cjs
   Executa o JavaScript real do HTML, com DOM/canvas e relogio controlados.
   A instrumentacao fica apenas nesta copia em memoria. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'slides_termologia.html'), 'utf8');

function simulation(seed = 42) {
  let source = html.slice(html.indexOf("(function(){\n  var V = view('cv-pist')"));
  source = source.slice(0, source.indexOf('/* ================= primeira renderizacao'));
  const end = source.lastIndexOf('})();');
  source = source.slice(0, end) + `
    globalThis.probe = { physStep, setMode, draw, reset, clearTrail, scatterPair,
      state: () => ({mode, steps, H, Heff, Weff, Tmeas, bathT, lockT, lockP, lockH,
        pistonY, uP, pDisp, pServo, ref: {...ref}, trail: trail.map(p => ({...p})),
        plotPMax, particles: ps.map(p => ({...p}))})
    };
  ` + source.slice(end);
  const math = Object.create(Math);
  math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const elements = {};
  const documentEvents = {};
  const labels = [];
  const canvas = new Proxy({}, { get: (_, name) => name === 'fillText'
    ? text => labels.push(text) : () => {}, set: () => true });
  function element(id) {
    return elements[id] ||= {value: id === 'sl-vol' ? '50' : '42', disabled: false,
      handlers: {}, attributes: {}, classList: {toggle() {}},
      setAttribute(k, v) { this.attributes[k] = v; },
      getAttribute(k) { return this.attributes[k]; },
      addEventListener(k, fn) { this.handlers[k] = fn; }};
  }
  const buttons = ['livre', 'isotermica', 'isobarica', 'isovolumetrica'].map(mode => {
    const button = element(mode); button.attributes['data-mode'] = mode; return button;
  });
  const frames = new Map(); let frameId = 0;
  const ctx = { Math: math, Float64Array, document: {
    hidden: false, getElementById: element, querySelectorAll: () => buttons,
    addEventListener: (k, fn) => documentEvents[k] = fn },
    view: () => ({g: canvas, w: 1440, h: 440}),
    rnd: (a, b) => a + math.random() * (b - a),
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)), heatColor: () => '#123456',
    requestAnimationFrame: fn => {frames.set(++frameId, fn); return frameId;},
    cancelAnimationFrame: id => frames.delete(id), sims: {} };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  ctx.sims.pistao.start();
  return { ctx, elements, labels, frames,
    step(n) {for (let k = 0; k < n; k++) ctx.probe.physStep();},
    mode(m) {ctx.probe.setMode(m);},
    state() {return ctx.probe.state();},
    frame(t) {const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(t));},
    visibility(hidden) {ctx.document.hidden = hidden; documentEvents.visibilitychange();}
  };
}
function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual / expected - 1) <= tolerance,
    `${message}: obtido ${actual}, esperado ${expected}, tolerância ${tolerance}`);
}
function equilibrium(sim, n = 700) {
  let pressure = 0;
  for (let k = 0; k < n; k++) {sim.step(1); pressure += sim.ctx.probe.state().pDisp;}
  const st = sim.state();
  near(pressure / n * st.Heff * st.Weff / (6000 * st.Tmeas), 1, .05, 'P V = N T');
  return st;
}

test('todos os scripts do HTML têm sintaxe válida', () => {
  for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
});

test('equilíbrio térmico e partículas confinadas nos extremos de volume e temperatura', () => {
  const sim = simulation();
  for (const [volume, temperature] of [[26, 12], [26, 100], [98, 100], [98, 12]]) {
    sim.elements['sl-vol'].value = String(volume);
    sim.elements['sl-tmp'].value = String(temperature);
    sim.step(1800);
    const st = equilibrium(sim, 300);
    near(st.Tmeas, .35 + temperature / 100 * 3.1, 1e-8, 'temperatura do banho');
    for (const q of st.particles) {
      assert.ok([q.x,q.y,q.vx,q.vy].every(Number.isFinite));
      assert.ok(q.x >= 130.8 && q.x <= 429.2 && q.y >= st.pistonY+.8 && q.y <= 351.2);
    }
    sim.ctx.probe.draw();
    assert.ok(st.pDisp / st.ref.p < sim.state().plotPMax, 'pressão visível no gráfico');
  }
});

test('isotérmica fixa a temperatura atual, conserva T durante o movimento e usa a isoterma correta', () => {
  const sim = simulation();
  sim.elements['sl-tmp'].value = '85'; sim.step(8); // troca antes de atingir o alvo
  const before = sim.state(); sim.mode('isotermica');
  near(sim.state().lockT, before.Tmeas, 1e-12, 'T fixada na entrada');
  assert.equal(sim.elements['sl-tmp'].disabled, true);
  const fixed = before.Tmeas;
  for (const volume of ['26','98']) {
    sim.elements['sl-vol'].value = volume;
    for (let j=0;j<1800;j++) {
      sim.step(1);
      if(j % 120 === 0) near(sim.state().Tmeas, fixed, 1e-10, 'T durante compressão/expansão');
    }
    equilibrium(sim, 300);
  }
  sim.ctx.probe.draw();
  assert.ok(sim.labels.includes('T fixa: P·V = ' + (fixed/before.ref.t*1000).toFixed(0) + ' kPa·L'));
});

test('isovolumétrica mantém V e pressão proporcional a T', () => {
  const sim = simulation(); sim.mode('isovolumetrica');
  const initial = equilibrium(sim, 300);
  sim.elements['sl-tmp'].value = '90'; sim.step(800);
  const heated = equilibrium(sim, 300);
  assert.equal(heated.H, initial.H);
  near(heated.pDisp / initial.pDisp, heated.Tmeas / initial.Tmeas, .05, 'P/T constante');
  assert.equal(sim.elements['sl-vol'].disabled, true);
  sim.ctx.probe.draw();
  assert.ok(sim.labels.includes('V constante (pistão travado)'));
});

test('isobárica aquece e resfria perto da carga constante, com três sementes aleatórias', () => {
  for (const seed of [7,42,2026]) {
    const sim = simulation(seed); sim.step(600); sim.mode('isobarica');
    const initial = sim.state(); let maxError = 0, errorSum = 0, samples = 0;
    for (const temperature of [65,30,42]) {
      const beforeH = sim.state().H;
      sim.elements['sl-tmp'].value = String(temperature);
      for(let j=0;j<1800;j++) {
        sim.step(1);
        if(j % 6 === 0) {
          const st = sim.state(); const error = Math.abs(st.pDisp/st.lockP-1);
          maxError = Math.max(maxError, error); errorSum += error; samples++;
        }
      }
      const st = sim.state();
      assert.ok(temperature === 30 ? st.H < beforeH : st.H > beforeH);
      near(st.Heff / initial.Heff, st.Tmeas / initial.Tmeas, .05, 'V/T constante');
    }
    assert.ok(maxError < .09, `pico da pressão: ${maxError}`);
    assert.ok(errorSum/samples < .025, `erro médio: ${errorSum/samples}`);
  }
});

test('trocas não provocam saltos; clicar no mesmo modo não muda a carga', () => {
  const sim = simulation(); sim.mode('isobarica');
  sim.elements['sl-tmp'].value = '65'; sim.step(200);
  const initial = sim.state(); sim.mode('isobarica');
  assert.equal(sim.state().lockP, initial.lockP);
  assert.equal(sim.state().trail.length, initial.trail.length);
  sim.mode('isotermica'); const iso = sim.state();
  assert.equal(iso.H, initial.H);
  near(iso.lockT, initial.Tmeas, 1e-12, 'T preservada');
  sim.step(1); near(sim.state().H, iso.H, 1e-12, 'pistão sem salto');
  sim.mode('livre'); const free = sim.state(); sim.step(1);
  near(sim.state().Tmeas, free.Tmeas, 1e-9, 'banho sem alvo antigo');
  assert.equal(sim.elements['sl-vol'].disabled, false);
  assert.equal(sim.elements['sl-tmp'].disabled, false);
});

test('limites mecânicos, retorno e reinício', () => {
  const sim = simulation(); sim.mode('isobarica');
  sim.elements['sl-tmp'].value = '12'; sim.step(2600); sim.ctx.probe.draw();
  near(sim.state().H, 70, 1e-10, 'batente inferior');
  assert.ok(sim.labels.includes('Limite do pistão: não é possível manter P constante.'));
  sim.elements['sl-tmp'].value = '65'; sim.step(2400);
  assert.ok(sim.state().H > 170 && sim.state().H < 220, 'recupera expansão após batente');
  sim.ctx.probe.reset(); const reset = sim.state();
  assert.equal(reset.mode, 'livre'); assert.equal(reset.H, 140);
  assert.equal(reset.trail.length, 0);
  near(reset.Tmeas/reset.ref.t, 1, 1e-12, 'nova referência');
  assert.equal(sim.frames.size, 1, 'reinício não duplica animação');
});

test('mesma evolução a 30, 60 e 120 Hz, pausa fora do slide e sem salto após aba oculta', () => {
  const states = [];
  for (const hz of [30,60,120]) {
    const sim = simulation(); sim.mode('isobarica'); sim.elements['sl-tmp'].value='65';
    for(let i=0;i<=hz*2;i++) sim.frame(i*1000/hz);
    states.push(sim.state());
    sim.ctx.sims.pistao.stop(); const stopped = sim.state().steps;
    sim.frame(5000); assert.equal(sim.state().steps, stopped);
    sim.ctx.sims.pistao.start(); sim.frame(10000);
    assert.equal(sim.state().steps, stopped);
    sim.visibility(true); sim.frame(10016); sim.visibility(false); sim.frame(90000);
    assert.equal(sim.state().steps, stopped);
  }
  for(const st of states.slice(1)) {
    assert.equal(st.steps, states[0].steps);
    assert.equal(st.H, states[0].H);
    assert.equal(st.Tmeas, states[0].Tmeas);
    assert.equal(st.trail.length, states[0].trail.length);
  }
});


test('colisões de pares conservam energia e momento', () => {
  const sim = simulation();
  const a = {vx:2.7, vy:-1.1}, b = {vx:-.2, vy:3.4};
  const energy = () => a.vx*a.vx+a.vy*a.vy+b.vx*b.vx+b.vy*b.vy;
  const initial = {energy:energy(), px:a.vx+b.vx, py:a.vy+b.vy};
  for(let j=0;j<1000;j++) sim.ctx.probe.scatterPair(a,b);
  near(energy(), initial.energy, 1e-11, 'energia dos pares');
  near(a.vx+b.vx, initial.px, 1e-11, 'momento x');
  near(a.vy+b.vy, initial.py, 1e-11, 'momento y');
});

test('todas as 16 combinações de troca de modo preservam posição e temperatura', () => {
  const modes = ['livre','isotermica','isobarica','isovolumetrica'];
  for(const from of modes) for(const to of modes) {
    const sim = simulation(); sim.mode(from);
    sim.elements['sl-tmp'].value = '75'; sim.elements['sl-vol'].value = '70'; sim.step(100);
    const before = sim.state(); sim.mode(to); const after = sim.state();
    assert.equal(after.H, before.H);
    assert.equal(after.Tmeas, before.Tmeas);
    if(to === 'isotermica' && from !== to) assert.equal(after.lockT, before.Tmeas);
    if(to === 'isovolumetrica') assert.equal(after.lockH, before.H);
    if(from !== to) assert.equal(after.trail.length, 0);
  }
});


test('mostradores, eixos e fórmulas usam a mesma escala física', () => {
  const sim = simulation();
  assert.equal(sim.elements['g-p'].textContent, '100,0 kPa');
  assert.equal(sim.elements['g-v'].textContent, '10,0 L');
  assert.equal(sim.elements['g-t'].textContent, '300 K (26,9 °C)');
  assert.ok(sim.labels.includes('P (kPa)'));
  assert.ok(sim.labels.includes('V (L)'));
  assert.ok(sim.labels.includes('P·V/T = 3,33 kPa·L/K'));
  assert.ok(sim.labels.includes('Isoterma inicial: P·V = 1000 kPa·L'));
  sim.step(600); sim.ctx.probe.draw();
  assert.equal(sim.elements['g-t'].textContent, '300 K (26,9 °C)');
  sim.mode('isovolumetrica'); sim.elements['sl-tmp'].value = '100'; sim.step(1000);
  sim.ctx.probe.draw();
  const st = sim.state();
  const kelvin = st.Tmeas/st.ref.t*300;
  const fmt = (n,d) => n.toFixed(d).replace('.', ',');
  assert.equal(sim.elements['g-t'].textContent, fmt(kelvin,0)+' K ('+fmt(kelvin-273.15,1)+' °C)');
  assert.equal(sim.elements['g-v'].textContent, '10,0 L');
  assert.equal(sim.elements['g-p'].textContent, fmt(st.pDisp/st.ref.p*100,1)+' kPa');
  sim.ctx.probe.reset();
  assert.equal(sim.elements['g-t'].textContent, '300 K (26,9 °C)');
  assert.equal(sim.elements['g-p'].textContent, '100,0 kPa');
});
