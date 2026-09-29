const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname,'..','slides_termologia.html'),'utf8');
function create(){
  const start = html.indexOf("(function(){\n  var V = view('cv-eq')");
  const end = html.indexOf('\n})();',start);
  const source = html.slice(start,end)+`\nglobalThis.probe={advance,draw,state:()=>({T1,T2,time,joined,contact,paused,equilibrium,history:history.slice()})};\n})();`;
  const elements={}, frames=new Map(), text=[];let id=0;
  const g = new Proxy({}, {get:(_,k)=>k==='fillText'?(s,x,y)=>text.push({s,x,y}):()=>{}, set:()=>true});
  const ctx = {Math, document:{hidden:false, addEventListener(){},getElementById(id){return elements[id]||=(
    {textContent:'',handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},setAttribute(){}});}},
    sims:{},view:()=>({w:780,h:480,g}),heatColor:()=> '#123',clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
  vm.createContext(ctx); vm.runInContext(source,ctx);ctx.sims.equilibrio.start();
  return {ctx,text,frames,step:dt=>ctx.probe.advance(dt),state:()=>ctx.probe.state(),
    click:id=>elements[id].handlers.click(),
    frame:t=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(t));}};
}
test('sem contato não há troca; faces precisam se encontrar',()=>{
  const s=create();for(let k=0;k<100;k++)s.step(.1);
  assert.equal(s.state().T1,80);s.click('bt-eq');s.step(.3);
  assert.equal(s.state().T1,80);s.step(.3);s.step(.1);assert.ok(s.state().T1<80);
});
test('energia conservada, temperaturas monotônicas e equilíbrio em 50 graus',()=>{
  const s=create();s.click('bt-eq');let previous=s.state();
  for(let k=0;k<400;k++){
    s.step(.1);const st=s.state();assert.ok(Math.abs(st.T1+st.T2-100)<1e-10);
    assert.ok(st.T1<=previous.T1 && st.T2>=previous.T2);assert.ok(st.T1>=st.T2);previous=st;
  }
  assert.equal(s.state().T1,50);assert.equal(s.state().T2,50);assert.equal(s.state().equilibrium,true);
  s.ctx.probe.draw();assert.ok(s.text.some(p=>p.s.includes('fluxo líquido de calor zero')));
});
test('separar interrompe a troca e contato retoma do estado atual',()=>{
  const s=create();s.click('bt-eq');for(let k=0;k<30;k++)s.step(.1);
  s.click('bt-eq');const t=s.state().T1;for(let k=0;k<50;k++)s.step(.1);
  assert.equal(s.state().T1,t);s.click('bt-eq');for(let k=0;k<20;k++)s.step(.1);assert.ok(s.state().T1<t);
});
test('pausa congela física e reinício restaura o estado',()=>{
  const s=create();s.click('bt-eq');s.step(.1);s.click('bt-eq-p');const before=s.state();
  s.step(.1);assert.deepEqual(s.state(),before);s.click('bt-eq-p');s.step(.1);assert.ok(s.state().time>before.time);
  s.click('bt-eq-r');assert.equal(s.state().time,0);assert.equal(s.state().contact,false);
  assert.equal(s.state().T1,80);assert.equal(s.state().T2,20);assert.equal(s.state().history.length,1);
  assert.equal(s.frames.size,1);
});
test('mesmo resultado a 30, 60 e 120 Hz e pausa fora do slide',()=>{
  const states=[];
  for(const hz of [30,60,120]){
    const s=create();s.click('bt-eq');for(let k=0;k<=hz*8;k++)s.frame(k*1000/hz);
    states.push(s.state());s.ctx.sims.equilibrio.stop();const before=s.state().time;
    s.frame(10000);assert.equal(s.state().time,before);s.ctx.sims.equilibrio.start();s.frame(20000);
    assert.equal(s.state().time,before);
  }
  for(const st of states)assert.ok(Math.abs(st.T1-states[0].T1)<1e-9);
});
test('mensagens e rótulos ficam dentro do canvas',()=>{
  const s=create();s.ctx.probe.draw();s.click('bt-eq');for(let k=0;k<400;k++)s.step(.1);s.ctx.probe.draw();
  for(const p of s.text)assert.ok(p.y>=0 && p.y<=480, p.s);
});
