DOCS = plano_aula_trabalho_energia lista_questoes_trabalho_energia \
       slides_questoes_trabalho_energia

.PHONY: all clean

all:
	for doc in $(DOCS); do \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	  pdflatex -interaction=nonstopmode $$doc.tex; \
	done

clean:
	rm -f *.aux *.log *.out *.toc
