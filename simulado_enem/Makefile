DOCS = lista_questoes_simulado_enem

.PHONY: all clean

all:
	for doc in $(DOCS); do \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	done

clean:
	rm -f *.aux *.log *.out *.toc
