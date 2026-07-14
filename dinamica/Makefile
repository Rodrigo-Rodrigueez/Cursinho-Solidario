DOCS = plano_aula_dinamica lista_questoes_dinamica

.PHONY: all clean

all:
	for doc in $(DOCS); do \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	done

clean:
	rm -f *.aux *.log *.out *.toc
