# Aula 4 -- ondas, som e luz.
# O deck e HTML (slides_ondas.html), montado a partir de src/ por
# montar.py; nao passa pelo pdflatex.
NAVEGADOR ?= brave
SEM_TELA = $(NAVEGADOR) --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader

.PHONY: all testes filme pdf vendor clean

all: slides_ondas.html lista_questoes_ondas.pdf

# lista de exercicios: LaTeX, pdflatex duas vezes (referencias)
lista_questoes_ondas.pdf: lista_questoes_ondas.tex figuras/enem*.png
	pdflatex -interaction=nonstopmode lista_questoes_ondas.tex
	pdflatex -interaction=nonstopmode lista_questoes_ondas.tex

slides_ondas.html: montar.py src/*.html src/*.js figuras/q*.png
	python3 montar.py

# testes da fisica: roda o bloco <script id="fisica"> do deck montado
testes: slides_ondas.html
	$(SEM_TELA) --allow-file-access-from-files --virtual-time-budget=3000 \
	  --dump-dom tests/fisica.test.html 2>/dev/null | sed -n '/<pre/,/<\/pre>/p' | sed 's/<[^>]*>//g'

# revisar animacao sem tela: make filme N='17~0.5,1,2,4~fase=180'
filme: slides_ondas.html
	$(SEM_TELA) --allow-file-access-from-files --window-size=1600,900 --hide-scrollbars \
	  --virtual-time-budget=8000 --screenshot=tests/quadros.png "file://$(CURDIR)/tests/animacoes.html#$(N)" 2>/dev/null

# PDF: todas as pranchas, passos revelados, animacoes no estado parado
pdf: slides_ondas.html
	$(SEM_TELA) --virtual-time-budget=20000 --run-all-compositor-stages-before-draw \
	  --no-pdf-header-footer --print-to-pdf=slides_ondas.pdf \
	  "file://$(CURDIR)/slides_ondas.html#imprimir" 2>/dev/null

# copia local das bibliotecas, para a sala sem internet
vendor:
	mkdir -p vendor
	curl -fsSL -o vendor/three.min.js https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js
	curl -fsSL -o vendor/gsap.min.js https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js

clean:
	rm -f slides_ondas.pdf tests/quadros.png *.aux *.log *.out *.toc
