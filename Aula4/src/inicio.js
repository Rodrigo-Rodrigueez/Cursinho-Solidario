"use strict";
/* =================================================================
   INICIO — escala o palco e abre a prancha pedida na URL (#12).
   Em #imprimir, liga todas as pranchas de uma vez, com todos os
   passos revelados, para o Chromium gerar o PDF.
   ================================================================= */
(function(){
  /* questoes: recortes embutidos (QIMG) */
  document.querySelectorAll('img[data-img]').forEach(function(im){
    var k = im.getAttribute('data-img');
    if (QIMG[k]) im.src = QIMG[k];
  });
  if (IMPRIMIR){
    document.documentElement.classList.add('imprimir');
    slides.forEach(function(s){
      s.querySelectorAll('[data-sim]').forEach(function(f){ var m = instancia(f); if (m && m.start) m.start(); });
      mostraPassos(s, 99, false);
    });
    document.documentElement.setAttribute('data-pronto', '1');
    return;
  }
  escala();
  var n = parseInt(location.hash.slice(1), 10);
  vai(isNaN(n) ? 0 : n - 1, 0);
})();
