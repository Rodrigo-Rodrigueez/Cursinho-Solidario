# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

LaTeX teaching materials (in Brazilian Portuguese) for physics classes at a volunteer college-prep course ("cursinho solidário"). Each physics topic lives in its own directory (`cinematica/`, `dinamica/`, ...) containing self-contained `.tex` documents of three kinds:

- `plano_aula_*` — lesson plan for the instructor, organized in timed blocks
- `notas_aula_*` — lecture notes / handout for students
- `lista_questoes_*` — exercise list (ENEM/vestibular-style questions)
- `slides_questoes_*` — beamer deck (16:9) with only the questions marked for in-class
  solving, one per slide plus an answer slide; question numbers must stay in sync with
  the corresponding `lista_questoes_*`
- `videos_*` — curated list of verified YouTube videos with where each fits in the
  lesson plan; ends in a projectable page of QR codes

All content is written in Portuguese; keep new material in Portuguese.

## Building

Each topic directory has its own Makefile. From inside the directory:

```sh
make        # compiles with pdflatex (runs twice for TOC/cross-refs)
make clean  # removes .aux/.log/.out/.toc
```

To compile a single document directly (always run twice):

```sh
pdflatex -interaction=nonstopmode plano_aula_dinamica.tex
pdflatex -interaction=nonstopmode plano_aula_dinamica.tex
```

Use `pdflatex` specifically — the documents rely on `inputenc`/`fontenc`, not fontspec, so xelatex/lualatex are not the target. Required packages beyond a base install: `tcolorbox` (skins, breakable), `tikz`/`pgfplots` (`compat=1.18`), `mathpazo`, `fontawesome5`, `qrcode`, `beamer`, `babel` with the `brazil` option.

Beamer has no auto-shrink: after editing a slide, check `pdflatex` output for `Overfull \vbox` — that means content is running off the bottom of a frame and being clipped in projection.

Generated PDFs (and even aux files) are committed to git; after editing a `.tex` file, rebuild and commit the regenerated PDF alongside it.

## Structure and conventions

There is no shared preamble or class file — every document duplicates its full preamble inline. Two visual styles are in use:

- **"azulphysics" style** (`cinematica/` documents): 12pt, `tcolorbox` styles like `defbox`/`formulabox`/`atencaobox`/`exemplobox`, color palette defined with `azulphysics` blue as primary.
- **"vinho" style** (`dinamica/` documents): 11pt, Palatino (`mathpazo`), small-caps headings, bordô (`vinho`) accent color, custom `\bloco{n}{title}{minutes}` / `\secao{}` / `\objetivo{}` commands and left-bar `quadro` panels instead of framed boxes.

When creating a new document, copy the preamble from the existing document of the same kind/topic style rather than inventing a new one, and keep the custom command names (`\bloco`, `\secao`, colors, box styles) consistent so documents within a topic look uniform.
