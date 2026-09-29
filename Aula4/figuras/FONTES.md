# Figuras das questões — procedência

Treze questões do deck são **recortes da arte original** dos cadernos do
INEP que estão em `Provas_antigas_ENEM/`. Nenhum enunciado foi redigitado
e nenhuma figura foi redesenhada. Duas questões de óptica (2012 e 2019)
não estavam nos cadernos do diretório e foram **transcritas** no próprio
HTML, com o texto oficial.

## Recortes

| arquivo | prova | caderno | página | gabarito | observação |
|---|---|---|---|---|---|
| `q2020_094.png` | ENEM 2020, 2º dia, Q94 | Amarelo (5) | 2 | B | remontada em duas colunas |
| `q2020_109.png` | ENEM 2020, 2º dia, Q109 | Amarelo (5) | 7 | C | remontada em duas colunas; **fora do deck** desde que o tubo sonoro saiu (montar.py só embute recortes usados) |
| `q2021_115.png` | ENEM 2021, 2º dia, Q115 | Amarelo (5) | 10 | A | largura total |
| `q2021_134.png` | ENEM 2021, 2º dia, Q134 | Amarelo (5) | 16 | D | continua na coluna direita: emendada |
| `q2022_095.png` | ENEM 2022, 2º dia, Q95 | Amarelo (5) | 3 | D | continua na coluna direita: emendada |
| `q2022_096.png` | ENEM 2022, 2º dia, Q96 | Amarelo (5) | 3 | E | remontada em duas colunas |
| `q2023_091.png` | ENEM 2023, 2º dia, Q91 | Amarelo (5) | 2 | C | largura total |
| `q2023_092.png` | ENEM 2023, 2º dia, Q92 | Amarelo (5) | 2 | A | largura total |
| `q2024_115.png` | ENEM 2024, 2º dia, Q115 | Cinza (6) | 10 | A | remontada em duas colunas |
| `q2024_130.png` | ENEM 2024, 2º dia, Q130 | Cinza (6) | 14 | D | |
| `q2024_131.png` | ENEM 2024, 2º dia, Q131 | Cinza (6) | 14 | C | remontada em duas colunas |
| `q2025_126.png` | ENEM 2025, 2º dia, Q126 | Amarelo (5) | 12 | D | largura total |
| `q2025_128.png` | ENEM 2025, 2º dia, Q128 | Amarelo (5) | 13 | E | |

**Gabarito de 2024.** O `2024_GB_*` do diretório é o da **reaplicação
(PPL)**, que não corresponde ao caderno regular `2024_PV_impresso_D2_CD6`.
As respostas das três questões de 2024 foram conferidas no gabarito oficial
do caderno cinza regular
(`download.inep.gov.br/enem/provas_e_gabaritos/2024_GB_impresso_D2_CD6.pdf`)
e nas resoluções do Poliedro. As demais conferem com os `*_GB_*` do
diretório.

## Transcritas

| prova | caderno | gabarito | fonte do texto |
|---|---|---|---|
| ENEM 2012, 1º dia, Q64 (pesca com lança) | Azul | E | descomplica.com.br/gabarito-enem, conferido com resolveenem |
| ENEM 2019, 2º dia, Q132 (povo moken) | Azul | D | descomplica.com.br/gabarito-enem, conferido com Elite/Kuadro |

## Como o recorte foi feito

Mesmo método de `termologia/figuras/FONTES.md`: a caixa vem das posições
de palavra do PDF (`pdftotext -bbox`); o topo é o rótulo `QUESTÃO n`, a
base é o próximo rótulo da mesma coluna ou o último conteúdo real;
rodapé, número de página e a marca d'água vertical (`ENEM2024ENEM…`)
são descartados por lista explícita; as laterais vêm da mancha de texto
da coluna (exclui a moldura decorativa dos cadernos de 2024/2025).
Renderizado com `pdftoppm -r 250`.

- **Emendas:** 2021 Q134 e 2022 Q95 começam na coluna esquerda e
  terminam no topo da direita; as duas partes foram empilhadas.
- **Duas colunas:** recortes com altura > 1,1 × largura ficariam
  ilegíveis numa lâmina 16:9. Foram cortados na faixa branca mais larga
  perto do meio e remontados lado a lado.
- **Tamanho:** PNG de paleta com 32 tons, largura máxima de 1 800 px,
  embutido em base64 no `slides_ondas.html` por `montar.py`.

O caderno de 2021 usa fonte sem mapa Unicode (o texto extraído sai
ilegível); as questões 115 e 134 foram achadas olhando as páginas
renderizadas, e as caixas vieram das posições das palavras, que
continuam corretas.
