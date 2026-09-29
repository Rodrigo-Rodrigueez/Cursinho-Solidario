/* =================================================================
   FISICA — funcoes puras usadas pelas pranchas.

   Nada aqui desenha: as simulacoes chamam estas funcoes e so pintam
   o resultado. Os testes (tests/fisica.test.html) exercitam este
   bloco isolado, entao toda afirmacao fisica do deck passa por aqui.
   Unidades SI, angulos em radianos.
   ================================================================= */
var Fisica = (function(){
  var TAU = Math.PI * 2;

  /* y(x,t) = A sen(2pi(x/lambda - f t) + fase): onda progressiva para +x */
  function onda(x, t, A, lambda, f, fase){
    return A * Math.sin(TAU * (x / lambda - f * t) + (fase || 0));
  }

  function comprimento(v, f){ return v / f; }        /* lambda = v/f */
  function frequencia(v, lambda){ return v / lambda; }
  function periodo(f){ return 1 / f; }

  /* Velocidade do som (m/s) nos meios usados nas pranchas. */
  var MEIOS = {
    ar:   {nome: 'ar',   v: 340},
    agua: {nome: 'água', v: 1540},
    aco:  {nome: 'aço',  v: 5100}
  };

  /* Duas fontes de mesma amplitude e frequencia, defasadas de 'fase'.
     Amplitude resultante (normalizada: 2 = construtiva maxima) num
     ponto a r1 e r2 das fontes, sem atenuacao com a distancia. */
  function amplitudeDuasFontes(r1, r2, lambda, fase){
    return Math.abs(2 * Math.cos(Math.PI * (r1 - r2) / lambda - (fase || 0) / 2));
  }

  /* Deslocamento instantaneo da superficie da cuba (com atenuacao 1/sqrt r). */
  function cuba(x, y, fontes, lambda, f, t){
    var k = TAU / lambda, w = TAU * f, s = 0;
    for (var i = 0; i < fontes.length; i++){
      var F = fontes[i], dx = x - F.x, dy = y - F.y, r = Math.sqrt(dx * dx + dy * dy);
      s += Math.sin(k * r - w * t + (F.fase || 0)) / Math.sqrt(1 + r / lambda);
    }
    return s;
  }

  /* Amplitude com que cada ponto da cuba oscila (a "envoltoria"):
     modulo da soma dos fasores das fontes. E o que separa as faixas
     de interferencia construtiva (claras) das destrutivas (escuras). */
  function envelopeCuba(x, y, fontes, lambda){
    var k = TAU / lambda, re = 0, im = 0;
    for (var i = 0; i < fontes.length; i++){
      var F = fontes[i], dx = x - F.x, dy = y - F.y, r = Math.sqrt(dx * dx + dy * dy);
      var a = 1 / Math.sqrt(1 + r / lambda), ph = k * r + (F.fase || 0);   /* mesma convencao de cuba() */
      re += a * Math.cos(ph); im += a * Math.sin(ph);
    }
    return Math.sqrt(re * re + im * im);
  }

  /* Lei de Snell: n1 sen t1 = n2 sen t2. Devolve t2, ou null quando
     ha reflexao total (sen t2 > 1). */
  function snell(n1, n2, t1){
    var s = n1 * Math.sin(t1) / n2;
    if (s > 1) return null;
    return Math.asin(s);
  }
  function anguloCritico(n1, n2){
    if (n2 >= n1) return null;                 /* so do mais para o menos refringente */
    return Math.asin(n2 / n1);
  }
  function indice(c, v){ return c / v; }       /* n = c/v */

  /* Efeito Doppler do som. vo > 0: observador se aproxima da fonte;
     vf > 0: fonte se aproxima do observador. */
  function doppler(f, v, vo, vf){
    return f * (v + vo) / (v - vf);
  }

  /* Superposicao de duas ondas de mesma A, lambda e f, defasadas de
     'fase': a soma e outra onda, com amplitude 2A|cos(fase/2)|.
     fase 0: construtiva completa (2A); fase pi: destrutiva completa (0). */
  function amplitudeSoma(A, fase){ return Math.abs(2 * A * Math.cos(fase / 2)); }

  /* Espelho esferico, equacao de Gauss: 1/f = 1/p + 1/p'.
     f > 0 concavo, f < 0 convexo; p' > 0 imagem real (na frente do
     espelho), p' < 0 virtual. Objeto no foco: p' = Infinity. */
  function gauss(f, p){
    var inv = 1 / f - 1 / p;
    return Math.abs(inv) < 1e-12 ? Infinity : 1 / inv;
  }
  function aumento(p, pl){ return -pl / p; }     /* A = i/o = -p'/p */
  /* Natureza da imagem de um objeto real. */
  function imagemEspelho(f, p){
    var pl = gauss(f, p);
    if (!isFinite(pl)) return {pl: pl, A: Infinity, impropria: true};
    var A = aumento(p, pl);
    return {pl: pl, A: A, impropria: false, real: pl > 0, direita: A > 0,
      tamanho: Math.abs(Math.abs(A) - 1) < 1e-9 ? 'igual' : Math.abs(A) > 1 ? 'maior' : 'menor'};
  }

  /* Nivel sonoro: beta = 10 log(I/I0), I0 = 1e-12 W/m2 */
  var I0 = 1e-12;
  function decibeis(I){ return 10 * Math.log10(I / I0); }
  function intensidade(dB){ return I0 * Math.pow(10, dB / 10); }

  /* Lentes finas encostadas: vergencias somam. V = 1/f (f em m -> di) */
  function vergencia(f){ return 1 / f; }
  function focoCombinado(f1, f2){ return 1 / (1 / f1 + 1 / f2); }

  /* Lente corretora a uma distancia D antes da lente do olho (foco fe),
     com a retina a Lr da lente do olho. Tracado paraxial de um raio
     paralelo: queremos que ele cruze o eixo exatamente na retina.
       h1 = 1 - D/fc ;  s1 = -1/fc - h1/fe ;  -h1/s1 = Lr
     => fc = (Lr + a D) / a,  com a = 1 - Lr/fe.
     Devolve Infinity quando o olho ja focaliza na retina (a = 0). */
  function lenteCorretora(fe, Lr, D){
    var a = 1 - Lr / fe;
    return Math.abs(a) < 1e-9 ? Infinity : (Lr + a * D) / a;
  }
  /* Onde um raio paralelo (altura 1) cruza o eixo depois da lente do
     olho, com ou sem a corretora (fc = Infinity: sem lente). */
  function focoNoOlho(fe, fc, D){
    var h1 = 1 - (isFinite(fc) ? D / fc : 0), s1 = -(isFinite(fc) ? 1 / fc : 0) - h1 / fe;
    return -h1 / s1;
  }

  /* Cor percebida de um objeto: luz incidente (rgb 0..1) vezes a
     refletancia do objeto, canal a canal. */
  function corRefletida(luz, refl){
    return [luz[0] * refl[0], luz[1] * refl[1], luz[2] * refl[2]];
  }

  /* Comprimento de onda visivel (nm) -> rgb aproximado (0..1).
     Aproximacao classica por trechos (Bruton), com queda nas pontas. */
  function corDoComprimento(nm){
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440){ r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490){ g = (nm - 440) / 50; b = 1; }
    else if (nm < 510){ g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580){ r = (nm - 510) / 70; g = 1; }
    else if (nm < 645){ r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780){ r = 1; }
    var k = 1;
    if (nm < 420) k = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700) k = 0.3 + 0.7 * (780 - nm) / 80;
    if (nm < 380 || nm > 780) k = 0;
    return [r * k, g * k, b * k];
  }

  return {
    TAU: TAU, MEIOS: MEIOS, C: 3e8,
    onda: onda, comprimento: comprimento, frequencia: frequencia, periodo: periodo,
    amplitudeDuasFontes: amplitudeDuasFontes, cuba: cuba, envelopeCuba: envelopeCuba,
    snell: snell, anguloCritico: anguloCritico, indice: indice,
    doppler: doppler,
    amplitudeSoma: amplitudeSoma,
    gauss: gauss, aumento: aumento, imagemEspelho: imagemEspelho,
    decibeis: decibeis, intensidade: intensidade,
    vergencia: vergencia, focoCombinado: focoCombinado,
    lenteCorretora: lenteCorretora, focoNoOlho: focoNoOlho,
    corRefletida: corRefletida, corDoComprimento: corDoComprimento
  };
})();
