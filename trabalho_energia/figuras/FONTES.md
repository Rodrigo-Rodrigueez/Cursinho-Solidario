# Figuras originais das provas

Todas as figuras da lista são a arte original da questão. Nenhuma é
redesenhada. Sempre que possível, o recorte foi feito do caderno
oficial da banca; quando o caderno original não foi localizado, o
recorte veio da compilação pública que a lista já cita como fonte.

## Recortadas do caderno oficial (INEP) — vetoriais

| arquivo | prova | caderno | página do PDF |
|---|---|---|---|
| `enem2011_q86_salto_vara.pdf` | ENEM 2011, 1º dia, Q86 | Azul (caderno 1) | 29 |
| `enem2018_q131_mola_trilho.pdf` | ENEM 2018, 2º dia, Q131 | Azul (caderno 7) | 14 |
| `enem2019_q121_disco_maxwell.pdf` | ENEM 2019, 2º dia, Q121 | Azul (caderno 7) | 12 |

PDFs de origem:

- https://download.inep.gov.br/educacao_basica/enem/provas/2011/01_AZUL_GAB.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2018/2018_PV_impresso_D2_CD7.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2019/2019_PV_impresso_D2_CD7.pdf

O recorte deslocou a página e fixou o tamanho da mídia na região da
figura (Ghostscript, `-dDEVICEWIDTHPOINTS` + `PageOffset`), então o
conteúdo continua vetorial e amplia sem serrilhar.

## Recortadas das compilações — imagens, resolução limitada

Extraídas com `pdfimages`. São a arte original da prova, mas na
resolução em que a compilação a distribui.

| arquivo | questão | resolução | origem |
|---|---|---|---|
| `uff_q1_carro_empurrado.png` | Q1 (UFF) | 377×390 | Projeto Medicina, *Energia Mecânica* (médio), p. 11 |
| `escs_q6_salto_vertical.png` | Q6 (ESCS DF) | 416×333 | Projeto Medicina, *Energia Mecânica* (fácil), p. 6 |
| `uff_q7_grafico_forca_posicao.png` | Q7 (UFF) | 281×161 | Projeto Medicina, *Energia Mecânica* (médio), p. 12 |
| `uerj_q10_tiro_de_meta.png` | Q10 (UERJ) | 452×184 | Projeto Medicina, *Energia Mecânica* (médio), p. 4 |
| `ufla_q14_mola_plano_inclinado.png` | Q14 (UFLA MG) | 338×350 | lista `tm221/tee2` (elicardo.com), p. 4 |

**A da Q7 é a mais fraca** (281 px de largura). Está impressa pequena
para disfarçar, mas se aparecer o caderno original da UFF vale trocar.

## Sem figura original

Q13 (UNIFOR CE) e Q15 (UTFPR) não trazem figura na prova. Os desenhos
que aparecem **só nos slides** são esquemas didáticos feitos aqui, e
estão marcados como tal.
