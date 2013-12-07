# 2.0.0-5 / Unreleased

  * [BREAKING CHANGE] Refactored drag'n'drop extension.  
    For example `dnd.onDrop(node)` --> `dnd.dragDrop(node, data)`.  
    See [[TutorialExtDnd]]
  * [BREAKING CHANGE] Renamed `rencercolumns` event to `renderColumns`
  * [BREAKING CHANGE] Renamed `fancytree-focused` class to `fancytree-treefocus` (container only)
  * [FEATURE] Experimental `ext-gridnav` implents key navigation for tables.
    Refactored keyboard handling. Keydown handlers are now bound to the container instead of document  
    (Co-work with Koloto)
  * [FEATURE] Allow to return 'preventNav' in keydown event to prevent withput blocking keys in embedded input controls.
  * [FEATURE] new method `node.navigate()` to support custom keyboard handlers
  * [FEATURE] Refactored CSS style to use a common LESS template
  * [FEATURE] Improvement of lazy load errors handling (Koloto, issue #87)
  * [FEATURE] Allow to pass metadata with `source` on initialization
  * [BUG] Fixed BACKSPACE on top-level nodes
  * [BUG] Fixed #71, #75, #90, #104, #105
  * Improved table render speed by 15%
  * `grunt dev` combines `grunt server` + `grunt watch` (trigger jshint and 
    less on save)


# 2.0.0-4

  * Misc. fixes


# 2.0.0-3

  * [BREAKING CHANGE] Changed extension syntax
  * [FEATURE] Edit extension (alpha)


# 2.0.0-2

  * [BREAKING CHANGE] Renamed `onCustomRender` to `renderTitle`.  
    `renderTitle`, `renderNode` and `createNode` events are only triggered as options callback (not DOM events), for performance reasons.
  * [BREAKING CHANGE] Renamed `data.orgEvent` to `data.originalEvent`
  * [BREAKING CHANGE] Renamed events to camelCase as suggested by the jQuery style guide (`rendernnode` -> `renderNode`, ...)
  * See also [[WhatsNew]] since Dynatree 1.x in general.


# 1.x

* See [Dynatree](https://code.google.com/p/dynatree/)
