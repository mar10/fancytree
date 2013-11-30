# 2.0.0-5 / Unreleased

  * [BREAKING CHANGE] Refactored drag'n'drop extension.  
    `dnd.onDrop(node)` --> `dnd.dragDrop(node, data)`
  * [BREAKING CHANGE] Renamed `rencercolumns` event to `renderColumns`
  * [BREAKING CHANGE] Renamed `fancytree-focused` class to `fancytree-treefocus` (container only)
  * [FEATURE] Refectored CSS style to use a common LESS template
  * [FEATURE] Allow to pass metadata with `source` on initialization
  

# 2.0.0-4

  * Fixes

# 2.0.0-3

  * [BREAKING CHANGE] Changed extension syntax
  * [FEATURE] Edit extension


# 2.0.0-2

  * **2013-08-31** [BREAKING CHANGE] Renamed `onCustomRender` to `renderTitle`.  
    `renderTitle`, `renderNode` and `createNode` events are only triggered as options callback (not DOM events), for performance reasons.
  * **2013-08-25** [BREAKING CHANGE] Renamed `data.orgEvent` to `data.originalEvent`
  * **2013-08-17** [BREAKING CHANGE] Renamed events to camelCase as suggested by the jQuery style guide (`rendernnode` -> `renderNode`, ...)
  * See also [[WhatsNew]] since Dynatree 1.x in general.


# 1.x

* See [Dynatree](https://code.google.com/p/dynatree/)
