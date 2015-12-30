# Taxonomy Browser TODOs
## Fancytree

  - Support special status node 'More...' and 'Empty'
      - optional colspan
      - own calback 'paging..'
      - keyboard handling

  - smart expand mode
  	The tree gets way too large

  - Search could be improved.
    - After clicking a link, we shoud jump to the details?
 	- Result should be collapsibel without dismissing the query?

  - concept: 'sparse tree': `node.partload = true`.
    only shows the parent paths, but knows that those parents may have more children, 
    that need to be reloaded later.
    -> use to load Path to target species without reqursive loadPath requests.

  - Table:
    Support re-definition of colum templates (i.e. adding removing columns)
    - https://github.com/mar10/fancytree/issues/436

  - bootstrap theme 'jumps' just before expand animation ends

  - ext-wide: broken selecton bar when depth > 20


## GUI

  - Marine / Extinct / Terrestrial may have multiple values
  - Print mode
