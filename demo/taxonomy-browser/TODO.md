# Taxonomy Browser

  - prevent concurrent reload()'s
  	https://github.com/mar10/fancytree/issues/356
  - Print mode
  - language
  - ext-wide: broken selecton bar when depth > 20
  - offer diferent taxonomy checklists (e.g. itis?)
  - Responsive columns:
    use renderColumns() callback, or add a new template definition option?
  	table-ext: opts.rowTemplate = "<td>...</td><td>...</td>"
    defineColumns()...
    https://github.com/mar10/fancytree/issues/436
  - Support special status node 'More...'
      - optional colspan
      - own calback 'paging..'
      - impleme
  - homo sapiens: http://localhost:8080/demo/taxonomy-browser/#key=7348228
    http://rawgit.com/mar10/fancytree/master/demo/taxonomy-browser/index.html#key=7348228
