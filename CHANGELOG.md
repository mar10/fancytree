# 2.0.0-12 / Unreleased
  * [Added] /dist/src folder contains uncompressed extensions for bower
  * [Improved] cleanup


# 2.0.0-11 / 2014-04-27
  * [Added] /dist/jquery.fancytree-custom.min.js with AMD support
  * [Added] #56: Allow to set special node.attributes from data-...
  * [Added] #191: Allow to set additional tree.data attributes from <ul data-...>
  * [Added] [ext-childcounter] #202: Allow lazy children count
  * [Improved] #192: Removed 'height: 100%' for container (was introduced to fix 
     an IE 9 bug, that now should be solved by 'min-height: 0%')
  * [Improved] [ext-table] #93 renderColumns called for status nodes 
    (added 'customStatus' option)
  * [Improved] [ext-dnd] #196 Make draggable/droppable options configurable
  * [Fixed] [ext-glyph] #194 Render noExpander icon from icon map for leaf nodes
  * [Fixed] #197: Allow special characters in tooltips
  * [Fixed] #68: renderStatus method doesn't render 'loading' status
  * [Fixed] #201: originalEvent not passed along to activate callback
  * [Fixed] [ext-glyph] compatible with ext-table


# 2.0.0-10 / 2014-04-13
  * [Added] New method node.appendSibling()
  * [Improved] setExpanded resolves promise *after* scrollIntoView
  * [Improved] Allow to return false in lazyLoad for manual loading.
  * [Improved] [ext-table] trigger expand event *after* animations
  * [Improved] [ext-gridnav] skips empty and merged cells
  * [Improved] grunt build no longer depends on tabfix.py
  * [Fixed] selectMode: 1 + "selected": true looks buggy


# 2.0.0-9 / 2014-04-02
  * [Added] New helper method $.ui.fancytree.escapeHtml().
  * [Added] [ext-clones] new method node,reRegister(key, refKey)
  * [Added] Support for bower.
  * [Added] dist/ folder to repository
  * [Improved] [ext-edit] handles `<`, `>`, ...
  * [Improved] [ext-table] node.render(force) trigger renderColumns event
  * [Fixed] [ext-table] #178 children are not displayed when filtering


# 2.0.0-8 / 2014-04-01
  * [FEATURE] #18: load lazy nodes, if initialized as 'expanded'.
  * [FEATURE] #162: Optional parameter `noEvents` for node.setActive() and .setExpanded().
  * [CHANGE] Prefixed all Less variables with '@fancy-' and introduced '@fancy-image-dir'.
  * [CHANGE] 'loadChildren' event is now also triggered for initial tree load (before it was only triggered for lazy child nodes)
  * [BUGFIX] #117: line height too large when using doctype xhtml
  * [BUGFIX] #115: Fixed error when trying to drag table headers
  * [BUGFIX] #163: lazy load throws error if autoscroll: true and result is empty
  * [FEATURE] [ext-clones] (experimental) new extension that introduces 
    `node.refKey`, which may occur multiple times in one tree (as opposed to `key`, 
    which must be unique).
    New methods `node.isClone()`, `node.getCloneList()` and `tree.getNodesByRef()`.
    Optionally, clones are tagged wit the `fancytree-clone` class.  
  * [FEATURE] New option 'defaultKey'. This calback allows to generate keys while loading.
  * build process creates /dist folder
  * "bower install fancytree" delivers dist folder


# 2.0.0-7 / 2014-03-09
  * [BREAKING CHANGE] node.isStatusNode() is now a function (was a property before).
    Added new property `node.statusNodeType`.
  * [BREAKING CHANGE] Renamed ext-awesome to ext-glyph
  * [DEPRECATION] Deprecated event `lazyload`, use `lazyLoad` (upper case L) instead.
  * [DEPRECATION] Deprecated methods node.lazyLoad() and node.discard(). use load() and resetLazy() instead.
  * [FEATURE] Added node.isUndefined(), isLoaded(), resetLazy(), load(), resetLazy()
  * [FEATURE] [ext-persist] Added option `expandLazy` for recursive loading (still experimental).
  * [FEATURE] [ext-filter] 'mode: hide' now works with ext-table (still experimental).
  * [FEATURE] node.makeVisible() accepts options, scrolls into view, and returns a promise.
  * [FEATURE] Sample xxl and bootstrap themes.
  * [CHANGE] nodeRenderStatus() is now implicitly called by nodeRenderTitle().  
    This also means that now all markup and css classes are finshed, when `renderNode` 
    is fired.
  * [CHANGE] Calling setExpanded() on a leaf node fires .done() (not .fail())
  * [CHANGE] Removing the last child node collapses the parent; lazy nodes become empty (not undefined).


# 2.0.0-6 / 2014-02-08

  * [BREAKING CHANGE] Removed 'name' argument from `$.ui.fancytree.registerExtension()`
    (now the extension object requires a 'name' property)
  * [DEPRECATION]  Deprecated startEdit/endEdit to use editStart/editEnd
  * [FEATURE] New method `tree._requireExtension()`
  * [FEATURE] Fixed d'n'd for ext-table
  * [FEATURE] New option `titlesTabbable`
  * [FEATURE] New argument `opts` for setExpanded() and setActive()
  * [BUGFIX] ext-edit: fixed loosing focus and made chainable
  * [BUGFIX] ext-filter: fixed navigation for hidden nodes
  * Added browser test matrix (saucelabs)


# 2.0.0-5 / 2013-12-23

  * [BREAKING CHANGE] Refactored drag'n'drop extension.
    For example `dnd.onDrop(node)` --> `dnd.dragDrop(node, data)`.
    See [[TutorialExtDnd]]
  * [BREAKING CHANGE] Renamed `rencercolumns` event to `renderColumns`
  * [BREAKING CHANGE] Renamed `fancytree-focused` class to `fancytree-treefocus` (container only)
  * [FEATURE] Experimental `ext-gridnav` implents key navigation for tables.
    Refactored keyboard handling. Keydown handlers are now bound to the container instead of document
    (Co-work with Koloto)
  * [FEATURE] Allow to return 'preventNav' in keydown event to prevent withput blocking keys in embedded input controls.
  * [FEATURE] New method `node.navigate()` to support custom keyboard handlers
  * [FEATURE] Refactored CSS style to use a common LESS template
  * [FEATURE] Improvement of lazy load errors handling (Koloto, issue #87)
  * [FEATURE] Allow to pass metadata with `source` on initialization
  * [FEATURE] The edit extension is now beta
  * [BUGFIX] Fixed BACKSPACE on top-level nodes
  * [BUGFIX] Fixed #71, #75, #90, #104, #105
  * Improved table render speed by 15%
  * `grunt dev` combines `grunt server` + `grunt watch` (trigger jshint and
    less on save)


# 2.0.0-4 / 2013-10-14

  * Misc. fixes


# 2.0.0-3

  * [BREAKING CHANGE] Changed extension syntax
  * [FEATURE] Edit extension (alpha)


# 2.0.0-2 / 2013-09-15

  * [BREAKING CHANGE] Renamed `onCustomRender` to `renderTitle`.
    `renderTitle`, `renderNode` and `createNode` events are only triggered as options callback (not DOM events), for performance reasons.
  * [BREAKING CHANGE] Renamed `data.orgEvent` to `data.originalEvent`
  * [BREAKING CHANGE] Renamed events to camelCase as suggested by the jQuery style guide (`rendernnode` -> `renderNode`, ...)
  * See also [[WhatsNew]] since Dynatree 1.x in general.


# 1.x

* See [Dynatree](https://code.google.com/p/dynatree/)
