# Figuras originais das provas

As onze questoes do deck sao **recortes da arte original** do caderno
oficial do INEP. Nenhum enunciado foi redigitado e nenhuma figura foi
redesenhada --- o que aparece projetado e a pagina da prova.

## Recortes

| arquivo | prova | caderno | pagina | coluna | tamanho |
|---|---|---|---|---|---|
| `q2022_129.png` | ENEM 2022, 2º dia, Q129 | Amarelo (caderno 5) | 14 | direita | 1828x721 |
| `q2020_101.png` | ENEM 2020, 2º dia, Q101 | Amarelo (caderno 5) | 4 | esq.+dir. | 919x1028 |
| `q2024_100.png` | ENEM 2024, 2º dia, Q100 | Cinza (caderno 6) | 5 | esquerda | 900x782 |
| `q2023_095.png` | ENEM 2023, 2º dia, Q95 | Amarelo (caderno 5) | 3 | largura total | 1815x557 |
| `q2025_091.png` | ENEM 2025, 2º dia, Q91 | Amarelo (caderno 5) | 2 | esquerda | 1810x592 |
| `q2024_117.png` | ENEM 2024, 2º dia, Q117 | Cinza (caderno 6) | 10 | direita | 1828x710 |
| `q2023_117.png` | ENEM 2023, 2º dia, Q117 | Amarelo (caderno 5) | 9 | direita | 1828x581 |
| `q2021_111.png` | ENEM 2021, 2º dia, Q111 | Amarelo (caderno 5) | 9 | esquerda | 1800x1025 |
| `q2020_133.png` | ENEM 2020, 2º dia, Q133 | Amarelo (caderno 5) | 15 | esquerda | 900x912 |
| `q2024_101.png` | ENEM 2024, 2º dia, Q101 | Cinza (caderno 6) | 5 | direita | 1830x1169 |
| `q2024_112.png` | ENEM 2024, 2º dia, Q112 | Cinza (caderno 6) | 9 | esquerda | 1800x1284 |

## PDFs de origem

- https://download.inep.gov.br/educacao_basica/enem/provas/2020/2020_PV_impresso_D2_CD5.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2021/2021_PV_impresso_D2_CD5.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2022/2022_PV_impresso_D2_CD5.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2023/2023_PV_impresso_D2_CD5.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2024/2024_PV_impresso_D2_CD6.pdf
- https://download.inep.gov.br/educacao_basica/enem/provas/2025/2025_PV_impresso_D2_CD5.pdf

## Como o recorte foi feito

Renderizado com `pdftoppm -r 250` sobre a caixa da questao. A caixa vem
das posicoes de palavra do proprio PDF (`pdftotext -bbox`):

- **topo**: o rotulo `QUESTAO n`, travado no fim da questao anterior
  (sem essa trava a margem arrasta a ultima linha dela);
- **base**: o ultimo conteudo real da questao. Rodape, numero de pagina
  e o nome do arquivo de diagramacao (`020225CI.indb`, que aparece na
  margem!) sao descartados por lista explicita de termos, nao por
  posicao --- eles ficam acima do limiar de altura;
- **laterais**: derivadas do conteudo, nao da coluna da pagina. E o que
  exclui a moldura decorativa dos cadernos de 2024 e a calha.

Uma questao ocupa a largura toda da pagina (2023 Q95); as demais estao
em coluna. O teste e se ha texto cruzando a calha central.

### Dois casos que precisaram de tratamento

**2020 Q101 quebra de coluna.** O enunciado fecha a coluna esquerda da
pagina 4 e a pergunta com as alternativas esta no topo da coluna
direita da mesma pagina. Um retangulo nao a cobre: o arquivo e a
emenda vertical das duas partes.

**Questoes altas viram duas colunas.** Numa lamina 16:9, uma questao de
proporcao 2,7 (a 2024 Q112) ficaria com ~240 px de largura, ilegivel na
projecao. Essas foram cortadas ao meio e remontadas lado a lado, como
na pagina impressa. O corte procura uma linha **branca** perto do meio,
para nao partir texto: na Q111 caiu entre as duas figuras, na 2024
Q101 entre o texto e a tabela de etapas.

### Tamanho

PNG de paleta: 32 tons de cinza para as questoes de texto, 128 cores
para as que tem figura colorida (2024 Q117 e Q112, 2024 Q101, 2023
Q95). Os arquivos estao embutidos em base64 no
`slides_termologia.html`, que por isso continua sendo um arquivo unico
que abre offline.

## Figuras da lista impressa

Estes sete recortes trazem **apenas a figura** de cada questao --- o
enunciado da `lista_questoes_termologia.tex` foi transcrito. Sao a arte
original do caderno, renderizada a 300 dpi direto do PDF do INEP.

| arquivo | prova | caderno | pagina | o que e | tamanho |
|---|---|---|---|---|---|
| `enem2025_q130_sensores_platina.png` | ENEM 2025, Q130 | Amarelo (cad. 5) | 14 | grafico R x T, cinco sensores | 1067x917 |
| `enem2025r_q124_lamina_bimetalica.png` | ENEM 2025 reapl., Q124 | Amarelo (cad. 5) | 12 | lamina bimetalica, dois estados | 2020x474 |
| `enem2024_q112_tirinha_iglu.png` | ENEM 2024, Q112 | Cinza (cad. 6) | 9 | tirinha do Laerte, tres quadrinhos | 1534x596 |
| `enem2024_q117_aquecedor_solar.png` | ENEM 2024, Q117 | Cinza (cad. 6) | 10 | esquema do aquecedor solar | 1014x496 |
| `enem2021_q111_ilha_calor.png` | ENEM 2021, Q111 | Amarelo (cad. 5) | 9 | Sol, brisa maritima e ilha de calor | 1071x971 |
| `enem2020_q131_prisma_herschel.png` | ENEM 2020, Q131 | Amarelo (cad. 5) | 14 | prisma e os cinco recipientes | 826x1065 |
| `enem2024_q101_ciclo_otto.png` | ENEM 2024, Q101 | Cinza (cad. 6) | 5 | diagrama P-V do ciclo de Otto | 923x626 |
| `enem2023_q119_grafico_pxt.png` | ENEM 2023, Q119 | Amarelo (cad. 5) | 10 | as cinco alternativas: graficos P x T | 2133x2137 |

### Como a caixa da figura foi achada

Duas estrategias, porque uma so nao cobre os casos:

- **faixa sem texto**: dentro da caixa da questao, procura-se a maior
  faixa vertical em que nenhuma palavra aparece. Funciona quando a
  figura nao tem rotulos.
- **entre ancoras de texto**: quando a figura tem rotulos internos
  (`PRISMA`, `Vermelho`, `Sol`, `Ilha de calor`), nao existe faixa vazia.
  Nesses casos o corte vai da ultima palavra do paragrafo anterior a
  primeira do seguinte. Na Q111 de 2021 nem isso serviu, porque o PDF
  daquele ano tem fonte sem mapa Unicode: a caixa veio das *posicoes*
  das palavras, que continuam legiveis (texto acima termina em y=217,9;
  paragrafo seguinte comeca em y=457,8).

### Dois tratamentos

**Tirinha do iglu recomposta.** Os tres quadrinhos vem empilhados na
prova (508 x 1738 px). Numa pagina A4 isso sairia com 3,5 cm de largura
e balao ilegivel. Foram cortados nas faixas brancas entre eles e
remontados lado a lado (1534 x 596). A ordem de leitura e a mesma.

**Molduras decorativas aparadas.** Os cadernos de 2024 tem uma tira
vertical de marca d'agua na borda da coluna, que entrava nos recortes.
Foram removidos 18 px da esquerda dessas tres figuras.

### O que NAO virou imagem

As tabelas das questoes 4, 6 e 16 foram recompostas em LaTeX, com os
mesmos valores e unidades da prova. Sao dados numericos, nao arte: em
LaTeX ficam mais nitidas na impressao e acompanham a tipografia da
lista. A arte propriamente dita (graficos, esquemas, tirinha) e sempre
recorte do original.

### A Q119 e a excecao: a figura sao as alternativas

Nas sete primeiras a figura entra no meio do enunciado e as alternativas
sao texto. Na Q119 de 2023 e o contrario: as cinco alternativas **sao**
graficos, e por isso o recorte cobre o bloco inteiro delas, com as
letras A a E como estao na prova. A lista nao repete um `enumerate`
depois da figura -- as letras ja estao na imagem.

A caixa veio das posicoes de palavra do PDF: topo logo abaixo da linha
"...sao representados pelo grafico:" (y=190 pt), base no ultimo rotulo
de eixo (y=705 pt), largura total da mancha (x de 28 a 540 pt), porque a
questao ocupa as duas colunas. Renderizado com `pdftoppm -r 300` e
reduzido a 32 tons.
