# Os slides desta aula sao HTML (slides_termologia.html), nao .tex:
# nao passam pelo pdflatex e nao entram aqui.
DOCS = plano_aula_termologia lista_questoes_termologia

.PHONY: all clean

all:
	for doc in $(DOCS); do \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	done

clean:
	rm -f *.aux *.log *.out *.toc
