# 2.38.0-0 / Unreleased
  * [Added] #1041 Make assertions more debuggable
  * [Added] #1051 ext-filter Fuzzy matched title segment is not highlighted
  * [Added] #1053 ext-dnd5 new option `dnd5.sourceCopyHook` (optional callback
    passed to `toDict` on dragStart)
  * [Added] #1054 ext-filter tree.updateFilter()
  * [Fixed] #700 ext-filter Doing fuzzy filtering doesn't escape regex characters like the non fuzzy case
  * [Fixed] #1045 re-init exception (grid-ext)

# 2.37.0 / 2020-09-11
  * [Changed] #871, #1032 ext-glyph:
    * Support for SVG tags as used by fontawesome 5 with `all.js` library
    * Improved padding and alignment for skin-awesome icons
    * Allow to pass a callback() as `glyph.map<TYPE>` option
    * Update Fontwesome demos to v5.0.13
  * [Changed] #1025 ext-dnd5: changed behavior when `dndOpts.multiSource` is
    true. Now dragging an unselected node will only drag that single node (while
    keeping the other nodes selected). You have to drag one of the *selected*
    nodes in order to drag the whole group.
  * [Fixed] #1022 ext-persist: Handle 'Access is denied for this document'
  * [Fixed] #1028 Uncaught TypeError: apply is not a function (regression of #1019)
  * [Fixed] #1029 Fast expand/collapse of folder leads to inconsistent state

# 2.36.1 / 2020-07-25
  * [Fixed] #1021 ext-dnd5 Regression (#1012) in drop marker

# 2.36.0 / 2020-07-15
  * [Changed] #1005 Cast key to string in getNodeByKey()
  * [Changed] #1013 ext-dnd5: log warning when jQuery is too old
  * [Added] #1012 `dnd5.dropMarkerParent` allows usage in Webcomponents (i.e. shadow DOM)
  * [Added] #1017 `copyFunctionsToData` allows also copying functions to the data property of the node
  * [Fixed] #921 ext-edit / focus handling: Internet Explorer scrolls briefly
    to the top/left after editing if the tree container is partially outside the viewport
  * [Fixed] #1001 Invalid urls in skin-xp CSS
  * [Fixed] ext-dnd5: dropEffectCallback=none was not reset in some cases
  * [Fixed] #1018 ContextMenu extension always focuses the first node in the tree

# 2.35.0 / 2020-03-27
  * [Changed] The `enableAspx` option will default to 'false' in the future.
    For now, a warning is emitted, to explicitly set it or use the `postProcess`
    event instead.
  * [Added] #988 New option `dnd5.preventLazyParents` prevents dropping items on
    unloaded lazy nodes (defaults to true)
  * [Fixed] #983 lazyLoad with promise not calling postProcess
  * [Fixed] #984 ext-edit: Exception when cancelling addSibling() or addChildren()
  * [Fixed] #987 Lazy load puts "Load error" for content outside tree div
    if parent folder is removed before loads ends
  * [Fixed] #989 `node.toDict()` keeps empty `children` array
  * [Fixed] #998 dnd5 triggering multiple loads of lazy nodes on hover

# 2.34.0 / 2019-12-26
  * [DEPRECATED] jQuery UI widget methods:
    Use `tree.METHOD()` instead of `$().fancytree("METHOD")`.
  * [Added] `tree.debugTime()`, `tree.debugTimeEnd()` for debugging.
  * [Added] `tree.destroy()` as alternative for `tree.widget.destroy()`.
  * [Fixed] `$.ui.fancytree.getTree()` for Element arg.
  * [Fixed] #973 when use ext-grid in one tree, other tree not use ext-grid has error on click.
  * [Fixed] #974 ext-grid: too much output in production mode.
  * [Fixed] #975 ext-grid: fix `tree.visitRows()` for empty tree.
  * [Fixed] #978 ext-grid: addChildren() throws error when grid is hidden.

# 2.33.0 / 2019-10-29
  * [Added] event `preInit` (fired before nodes are loaded).
  * [Changed] jQuery is now a peerDependency (>=1.9), so users can install or re-use their own version.
  * [Changed] ext-grid: `updateViewport` event is now also triggered for 'renumber' (i.e. expand, collapse)
  * [Fixed] #963: tree.setExpanded() fails when autoScroll is enabled
  * [Fixed] #964: handle case when `source` is not passed and no `<ul>` is embedded.
  * [Fixed] #966: ext-dnd5: bug in function onDropEvent (case 'dragover')
  * [Fixed] ext-filter: sub-match counter is one too high.

# 2.32.0 / 2019-09-10
  * [Added] `node.hasClass()`
  * [Added] `tree.applyCommand()` and `node.applyCommand()` (experimental!)
  * [Added] `tree.isLoading()`
  * [Added] `tree.toDict(includeRoot, callback)` and `node.toDict(recursive, callback)`:
    callback can now return `false` or `"skip"` to skip nodes.
  * [Fixed] #951 Hover issue in unselectable radio
  * ext-dnd5: allow autoExpand even if dropping is prevented
  * [Fixed] ext-filter: tree.rootNode.subMatchCount is now set correctly
  * [Fixed] #955 node.navigate($.ui.keyCode.DOWN, false) does not return promise
  * Stop testing with jQuery UI 1.10 and 1.11 (only jQuery UI 1.12 remains)

# 2.31.0 / 2019-05-30
  * New extension **ext-grid** (experimental)<br>
    This is a variant of `ext-table` that introduces viewport support, which
    allows to maintain *huge* data models while only rendering as many DOM elements as necessary.<br>
    Main changes:
    - A viewport is defined by the number of visible rows (`tree.viewport.count`) and the index of the first visible row (`.start`)
    - When scrolling, rows are not hidden, but removed and replaced. (This implies that the contents of embedded input fields should be written into the model immediately.)
  * Refactored **ext-dnd5**<br>
    Some **breaking changes** were made, mainly to improve handling of the dropEffect
    (note that ext-dnd5 was and still is experimental and in progress).
    - Remove  `dnd5.dropEffect` callback option (set `data.dropEffect` instead)
    - Remove  `dnd5.dragImage` callback option (call  `data.dataTransfer.setDragImage()`
    - and set `data.useDefaultImage = false` instead)
    - Rename `dnd5.preventRecursiveMoves` to `dnd5.preventRecursion`
    - `dnd5.preventVoidMoves` now only aplies to 'move' operations, so we can *copy* before self
    - [Added] `dnd5.preventSameParent` option
  * [Added] hook `treeStructureChanged`
  * [Added] methods `tree.findRelatedNode()`, `node.findRelatedNode()`
  * [Added] method `node.getPath()`
  * [Added] methods `$.ui.fancytree.getDragNode()`, `$.ui.fancytree.getDragNodeList()`
  * [Added] event `updateViewport`
  * [Added] tree option `.checkboxAutoHide` to hide checkboxes unless selected or hovered.
  * [Added] tree option `.treeId` to prevent generation of a new sequence if the tree is re-initialized on a page.
  * [Changed] `.getTree()` now also accepts the tree id string
  * [Changed] #939: Keep a `partsel` flag that was explicitly set on a lazy node
  * [Changed] ext-clones: make default key generation more robust against collisions
  * [DEPRECATED] loaderror and lazyload options now throw an error instead of falling back to the correct loadError and lazyLoad
  * [DEPRECATED] `tree.applyFilter` was removed
  * [Fixed] #918 SVG font awesome 5 glyphs remove badge counter when parent node is collapsed
  * [Fixed] #921 ext-edit respectively focus handling: Internet Explorer scrolls briefly
    to the top/left of the tree container element after editing a node title if the
    tree container is partially outside the viewport
  * [Fixed] #931 Selecting grandparent selects all nodes of radiogroup in selectMode=3
  * [Fixed] #946 dnd5 - Counter badge shows up, although the drag was cancelled from dragStart callback
  * [Fixed] #947 dnd5 - dragEnd is fired only when re-ordering nodes within the same parent
  * [Fixed] missing tree.error() and broken node.error()
  * [Fixed] a bug in ext-logger
  * Optimized performance of `expandAll()` and `ext-filter`
  * Replace jshint/jscs with eslint
  * Now testing on Puppeteer/Chromium instead of PhantonJS
  * Use LF on Windows when checking out from git (added .gitattributes)
  * Update to jQuery 3.4

# 2.30.2 / 2019-01-13
  * Stop testing on IE 8 (no longer available on Saucelabs)
  * [Fixed] #910 ext-dnd5 throws error for draggable column headers
  * [Fixed] overrideMethod()'s calling context
  * [Fixed] #912 ext-dnd5 + ext-glyph awesome5 does not show the icons when dragging an item
  * [Fixed] #919 ext-multi: JavaScript error (event is not defined) in nodeKeydown
  * [Fixed] #922 scrollIntoView for plain trees that don't have a scrollbar
  * [Fixed] #924 ext-edit: Fix caret position for mouse-click in input
  * [Fixed] #928 ext-dnd5: Fix `preventNonNodes` option
  * [Fixed] #929 Fix `.getTree()` for jQuery 3
  * [Fixed] #930 ext-dnd5: If drag does not start, no drag data should be stored

# 2.30.1 / 2018-11-13
  * [Changed] Apply and enforce 'prettier' codestyle
  * [Changed] #897 Set font for table extension
  * [Fixed] #883: Font Awesome 4 animation spinner stays visible
  * [Fixed] #894: Fancytree assertion failed: scrollParent should be a simple element or `window`, not document or body.
  * [Fixed] #896 _requireExtension: order managment
  * [Fixed] #899 Creating duplicate icon when removing node using extension columnview
  * [Fixed] #900 ColumnView Extension - Toggle between parent and children not working
  * [Fixed] #909 With quicksearch enabled, does not search for non-Latin character

# 2.30.0 / 2018-09-02
  * [Changed] ext-edit trigger 'clickActive' now only triggers if no modifier keys
    (shift, meta, control, ...) are pressed.<br>
    Trigger 'shift+click' now only triggers if no other modifier key (control, ...)
    is pressed.
  * [Changed] #879 Rename ext-debug to ext-logger
    (jquery.fancytree.debug.js => jquery.fancytree.logger.js)
  * [Added] ext-multi is now deployed with jquery.fancytree-all.js (still experimental)
  * [Added] tree.activateKey(key, opts) now has an `opts` argument
  * [Added] `nodata` option (bool, string, or callback)
  * [Added] ext-table `mergeStatusColumns` option
  * [Added] new method `tree.enable(flag)`
  * [Added] new method `tree.expandAll(flag, opts)`
  * [Added] new methods `tree.setOption(name, value)` and `tree.getOption(name)`
  * [Fixed] ES6 import dependency on jquery for jquery.fancytree.ui-deps.js
  * [Fixed] #863 setActive() sometimes does not scroll node into view
  * [Fixed] #877 postProcess may now also return the object form `{..., children: []}`
  * [Fixed] #884 ReferenceError: jQuery is not defined at _simpleDeepMerge
  * [Fixed] autoScroll, node.scrollIntoView(), and .makeVisible() now work for tables as well.

# 2.29.1 / 2018-06-27
  * [Fixed] #848 Drag End Error with dnd5 extension (again):
    fancytree-drag-remove class not removed on drop/dragend
  * [Fixed] #875 ext-dnd5: Unwanted expanding of folder node when a node is dragged
    before/after it
  * [Fixed] #876 `triggerStart: []` does not override the default settings.<br>
    **NOTE:** Options of type `Array` will now override the default option.
    Before, arrays were merged with the default.
  * [Fixed] ext-ariagrid default actions

# 2.29.0 / 2018-06-16
  * [Changed]
    `toggleEffect` now also accepts "toggle" or "slideToggle" to use jQuery effects instead of jQueryUI.<br>
    `toggleEffect: { effect: "slideToggle", duration: 200 }` is now the default.<br>
    'effects' component was removed from the bundled jquery.fancytree.ui-deps.js
  * [Fixed] #746 Animation bug when expanding/collapsing nodes
  * [Fixed] #848 Drag End Error with dnd5 extension
  * [Fixed] #850 ext-childcounter doesn't work with custom icons
  * [Fixed] #859 Fix log level configuration problem
  * [Fixed] #865 toggleEffect animation (effect: blind) sometimes got stuck.
  * Stop testing jQuery UI 1.9
  * Update to jQuery 3.3.1

# 2.28.1 / 2018-03-19
  * [Fixed] #844 Fix RTL for ext-table
  * [Fixed] #845 Fix RTL for ext-dnd/ext-dnd5
  * [Fixed] #764 Fix clicks on embedded <a> tags when filter is on

# 2.28.0 / 2018-03-02
  * [Added] New extension ext-multi (experimental).
  * [Added] ext-dnd5 support for dragging multiple selected nodes.
  * [Added] #830 support for Font Awesome 5 (ext-glyph preset).
  * [Added] ext-glyph supports SVG icons.
  * [Added] `icon` option supports `{html: "..."}` content (also available for glyph-ext mapping).
  * [Added] New method tree.visitRows()
  * [Added] New method tree.selectAll()
  * [Added] New method node.isBelowOf()
  * [Added] New extension ext-fixed (experimental).
  * [Changed] Re-rename clearData() to clearPersistData()
  * [Changed] #828 Re-scale debugLevel from 0:quiet to 4:verbose, allowing to suppress warnings
    and even errors.
  * [Added] CSS helper classes:<br>
    `.fancytree-helper-disabled`<br>
    `.fancytree-helper-hidden` (replaces `ui-helper-hidden`)<br>
    `.fancytree-helper-indeterminate-cb`<br>
    `fancytree-helper-spin` for icon animations (replaces `glyphicon-spin`)
  * [Fixed] #819: ext-filter: Handle nodes without title.
  * [Fixed] #835: ext-dnd5: Accept drop externals after drag.

# 2.27.0 / 2017-12-16
  * **BREAKING CHANGES:**
    - `node.type` is now a first-class property of FancytreeNode.
      Node data `{..., type: "foo"}` is now available as `node.type` (before: `node.data.type`).
    - The properties `tree.types` and `tree.columns` have been added to Fancytree.
      If passed with source data, they are now available directly instead of
      `tree.data.types` or `tree.data.columns`.
  * **Support patterns for node types:**
    - The properties `node.type` and `tree.types` are recommended to implement node-type
      specific configuration ([details](https://github.com/mar10/fancytree/wiki/TutorialNodeTypes)).
    - Event `data` argument contains `typeInfo == tree.types[node.type]`.
  * **Improved ext-glyph:**
    - [Added] support for ligature icons (e.g. [material icons](https://material.io/icons/)).
    - [Added] `icon` option can now return a dict to create a ligature icon.
  * **Improved tree.loadKeyPath():**
    - [Added] support for a custom path segment matcher.
      This allows to have key paths with segments other than `node.key`.
    - [Improved] the returned deferred promise now triggers `progress()` events which can
      be used instead of the callback.
  * The property `tree.columns` was added to Fancytree. Currently only reserved as
    recommended pattern to pass global meta-data for ext-table.
  * [Added] ext-edit: new trigger mode `clickActive` for option `triggerStart: [...]`.
  * [Added] #798 Tooltip support for icons (dynamic option `iconTooltip`).
  * [Added] #808 Pass custom storage providers to ext-persist.
  * [Improved] ext-table no longer needs empty tbody/tr if thead is present.
  * [Fixed] #796 UMD requirements for node/CommonJS
  * [Fixed] #803 jquery.fancytree.ui-deps.js does not override existing widgets.
  * [Fixed] #815 `<mark>` element missing in filtered nodes (minified bundle, IE 11).
  * [Fixed] #816 findNextNode() doesn't set default for 'startNode' argument.
  * [Added] Material Design demo
  * [Added] Demo for Fancytree inside a jquery-confirm popup
  * [Changed] String representation is now `"FancytreeNode@_4[title='My name']"`
  * [DEPRECATED] `tree.clearCookies()`. Use <del>`tree.clearData()`</del> `tree.clearPersistData()` instead.

# 2.26.0 / 2017-11-04
  * **BREAKING CHANGES:**
    - [Fixed] #792 postProcess is now also called for non-Ajax sources.
  * [Improved] LESS now compiles with webpack
  * [Added] #791 ext-glyph support for radio buttons
  * [Added] Color definitions for skin-awesome (taken from skin-lion)
  * [Fixed] `$.ui.fancytree.getNode()` for ES6 environments
  * [Fixed] #789 Wrong node is activated in IE, when clicking in unfocused container

# 2.25.0 / 2017-10-31
  * **BREAKING CHANGES:**
    - The `dist/src/` folder was renamed to `dist/modules`.
    - Some directories like `demo/` are no longer part of the npm install.
  * **Improved Module Support and Distribution**<br>
    - The `dist/` folder now includes a `modules/` directory with fancytree core
      and all extensions.
    - All modules have UMD wrappers with defined dependencies.
    - Internal jQuery UI dependencies are deployed as module and implicitly loaded.
    - `jquery.fancytree/dist/modules/jquery.fancytree` is defined as
      package main module, so Fancytree can be included using a simple<br>
      `fancytree = require('jquery.fancytree')`.<br>
      See [the docs](https://github.com/mar10/fancytree/wiki/TutorialIntegration)
      for details.
    - All modules now return the
      [$.ui.fancytree object](https://wwWendt.de/tech/fancytree/doc/jsdoc/Fancytree_Static.html).
    - [Added] new static method `$.ui.fancytree.createTree(elem, opts)`
  * [Added] Source map files for `jquery.fancytree-all-deps.min.js`
  * [Added] New extension ext-fixed (work-in-progress, experimental)
  * [Fixed] #767: Input inside table head not working
  * [Fixed] #768: Can't use keyboard to select nodes when `checkbox` option is false
  * [Fixed] #782: wide extension - padding is off when checkbox option is changed
  * [Fixed] #787: Fix getEventTarget() for custom icons

# 2.24.0 / 2017-08-26
  * [Added] ext-glyph option `preset` (making the `map` option optional)
  * [Fixed] Drop marker for ext-glyph + ext-dnd5
  * [Fixed] #695: List AMD dependency on jQuery UI
  * [Fixed] #735: Trying to set root node selected throws an error
  * [Fixed] #740: Filtering must not consider escaped html entities
  * [Fixed] #741: Passing an empty string ("") as filter calls clearFilter()
  * [Fixed] #748: Drag start should not activate a node
  * [Fixed] #761: ext-dnd5 throws exception when tree is empty
  * [Fixed] #764: ext-filter breaks links
  * Updated jsdoc to 3.5

# 2.23.0 / 2017-05-27
  * **The external dependency on jQuery UI was removed**.<br>
    A new library `jquery.fancytree-all-deps.min.js` is now added to the
    distribution. It includes all dependencies on jQuery UI, so the only
    remaining external dependency is jQuery.<br>
    Continue to use `jquery.fancytree-all.min.js` if jQuery UI is already
    included anyway.

  * **Refactored the select behavior**<br>
    [details](https://github.com/mar10/fancytree/wiki/SpecSelect):
    <!-- [details](https://github.com/mar10/fancytree/wiki#selection-and-checkboxes) -->
    * [Added] Allow control of selection status propagation with new options:
      `unselectable`, `unselectableIgnore`, `unselectableStatus`.
    * [Added] node option `radiogroup` to enable single-select for child nodes
    * [Added] option `opts.noEvents` to `setSelected(flag, opts)`
    * [Improved] Option 'checkbox' can have the string value "radio" (only has
      the visual effect of replacing the icon)

  * **BREAKING CHANGES:**
    * The `hideCheckbox` option was removed. Use `checkbox: false` instead.<br>
      Note that the `<li class='hideCheckbox'>` is still parsed from input
      HTML and converted accordingly.
    * The optional modifier class `<div class='fancytree-radio'>` was removed.
      This class was used on the *container* to turn all checkbox items into
      radio buttons.<br>
      Instead, this class is now added to `<span class="fancytree-checkbox fancytree-radio">`.
      Use the `tree.checkox: "radio"` option to activate this for the whole tree.
    * The callback signature for the `tree.tooltip` option has changed to
      `tooltip(event, data)`

  * [Improved] `aria` option is now on by default
  * Use the new dynamic options pattern for
    `checkbox`, `icon`, `tooltip`, `unselectable`, `unselectableIgnore`,
    `unselectableStatus`.<br>
    See also <a href="https://github.com/mar10/fancytree/wiki#dynamic-options">dynamic options</a>.
  * [Added] New method `node.visitSiblings()`
  * [Added] #730 ext-persist option `expandOpts` is passed to setExpanded()
    Allows to suppress animation or event generation.

# 2.22.5 / 2017-05-11
 * [Improved] #709 experimental ext-ariagrid

# 2.22.4 / 2017-05-06
 * [Improved] #709 experimental ext-ariagrid

# 2.22.3 / 2017-05-05
 * [Improved] #709 experimental ext-ariagrid

# 2.22.2 / 2017-04-29
  * [Fixed] #729 Fix regression with addChild performance improvements (#708)

# 2.22.1 / 2017-04-21
  * [Fixed] #722 Fix regression with addChild performance improvements (#708)

# 2.22.0 / 2017-04-11
  * [Added] ext-dnd5 now part of standard distribution
  * [Added] #693 ext-dnd/dnd5: configurable drop marker offset
  * [Added] #616 ext-wide: configurable left padding
  * [Added] New method $.ui.fancytree.evalOption()
  * [Improved] #601 ext-filter: improve performance (don't render hidden nodes)
  * [Improved] ext-contextMenu: disable keyboard while popup is open and restore focus
  * [Improved] #701 ext-hotkeys: Prevent default behavior on hot key combination
  * [Improved] #708 speedup improvement for addChildren
  * [Fixed] #680 ext-dnd5: top level nodes not draggable
  * [Fixed] #681 ext-table: exception when a lazy node has `children: []`
  * [Fixed] #699 ext-dnd5: Icon remains after dnd is cancelled
  * [Fixed] #702 $.ui.fancytree.getNode(jQuery)' for jQuery v3.x
  * [Fixed] #706 Fix DND where fancytree-title span is not a direct child due to custom layouts
  * [Fixed] #712 When clicking in a scrolled tree for the first time, focus is not set properly
  * [Fixed] #716 ext-wide: animation 'jumps' (jQuery UI 1.12)
  * [Fixed] #717, #719 expand/collapse shows displaced child nodes when scrolled (jQuery UI 1.12)
  * Update demos to jQuery 3.2.1 / jQuery UI 1.12.1

# 2.21.0 / 2017-01-15
  * [Added] New extension 'ext-dnd5' (beta) for native HTML5 drag'n'drop support
  * [Added] `rtl` option for right-to-left script support
  * [Added] Add $.ui.fancytree.overrideMethod()
  * [Added] hook `treeSetOption` allows extensions to update on option changes
  * [Changed] standard CSS no longer defines `overflow: auto` for the container.
    If the tree container has a fixed height, `overflow: auto` or `overflow: scroll`
    should be added to make it scrollable.
    (Otherwise this always would be the scroll parent for ext-dnd5.)
  * [Improved] better support for initializing from embedded JSON using the
    `data-type="json"` attribute
  * [Fixed] corner case of #658 when ext-edit is loaded, but inactive
  * [Fixed] #396 Don't load 'loading.gif' for glyph skins
  * [Fixed] #675 ext-table: node.render(false) puts first node at end

# 2.20.0 / 2016-11-13
  * [Added] #419 `modifyChild` event. This event is also a good place to
    implement auto sorting (#559)
  * [Added] #419 node.triggerModifyChild() and node.triggerModify()
  * [Added] #595 add custom node filter to `generateFormElements()`
  * [Added] #610 `tree.tooltip` option allows automatic or custom tooltips
  * [Added] #620 improved tooltip escaping to allow newlines
  * [DEPRECATED] `removeNode` event. Listen for `modifyChild` with operation
    'remove' instead (which is fired on the parent)
  * [Improved] ThemeRoller theme
  * [Improved] ext-filter
    - #297 add filter option 'hideExpanders' to remove expanders if all child
      nodes are hidden by filter
    - Filter options and the `opts` argument of `filterNodes()` / `filterBranches()`
      have been unified
    - [Fixed] #230 themeroller theme compatible with ext-filter
    - [Fixed] #528 autoCollapse option blocks filter's autoExpand option
    - [Fixed] #529 Filter: Mark matching nodes even if parent was matched in branch mode
    - [Fixed] #643 Exceptions in ext-filter if expression contains special chars
    - [Fixed] #658 ext-filter does not work with ext-edit `editCreateNode()`
  * [Improved] #656 WAI-ARIA support
    - Set focus to first node on first tab-in
    - Support [home] and [end] keys
    - Set aria-activedescendant on container to active ID
    - Set aria-multiselectable on container if selectMode != 1
    - Set aria-treeitem, -selected, -expanded, on title span instead `<li>`
  * [Fixed] #576 `loadKeyPath()` sometimes gets the root wrong
  * [Fixed] #615 Drag & drop helper icons lose indentation with table extension
  * [Fixed] #632 Tabbing is not working if there is an anchor tag in treeview
  * [Fixed] #644 New nodes created with ext-edit, are hidden in filtered trees
  * [Fixed] #647 ext-table: tree.render(true) does not discard existing markup
  * [Fixed] #659 handling of function keys, when quicksearch is on
  * Use QUnit 2.0

# 2.19.0 / 2016-08-11
  * [Added] #607 tree.enableUpdate() to temporarily disable rendering to improve
    performance on bulk updates
  * [Added] modifier class `.fancytree-connectors` to be set on container<br>
    Note: Experimental! Not required for skin-xp and not compatible with ext-table
  * [Added] #623 ext-edit: `data.originalEvent` is now passed to `beforeClose`
  * [Fixed] #604 Set `source` option does not update tree
  * [Fixed] #609 node.load(true); doesn't maintain expanded
  * [Fixed] #621 Cannot focus embedded input controls
  * [Improved] #611 Keyboard navigation honors autoScroll option
  * Extensions inherit main version number

# 2.18.0 / 2016-05-02
  * [Added] #586 node.discardMarkup() (useful in  the `collapsed` event)
  * [Added] #171 new option `.escapeTitles`
  * [Added] new callback `.enhanceTitle()`
  * [Fixed] #515 Html tags included in filter results
  * [Fixed] #593 ext-dnd revert position fails for tables

# 2.17.0 / 2016-04-11
  * [Added]  `node.addClass()`, `.removeClass()`, and `.toggleClass()`
  * [Added] ext-filter: matcher-callback for `tree.filterNodes()` may now return
    `"branch"` and `"skip"`
  * [Added] ext-filter: new option`nodata` allows to configure a status node for
    empty results
  * [Added] `digits` argument to `node.getIndexHier(separator, digits)`
  * [Added] tree option `.tabindex`, default is "0". Pass "" to resolve #577
  * [DEPRECATED] tree option `.tabbable`. Use `.tabindex` instead
  * [Added] New option `mode='firstChild'` for `node.moveTo()`
  * [Added] New option `digits=<int>` for `node.getIndexHier()`
  * [Fixed] ext-filter: branch mode honors `autoExpand: true`
  * [Fixed] #584: aria-labelledby ids not unique
  * Update to jQuery UI 1.11.4

# 2.16.1 / 2016-03-18
  * [Added] ext-glyph: new icon for 'nodata' status nodes
  * [Fixed] #575 missing loading icon in non-bootstrap themes.<br>
    Glyph themes now display status images in icon span (was expander span before)

# 2.16.0 / 2016-03-16
  * [Added] ext-clones: new method node.setRefKey(refKey)
  * [Added] modifier class `.fancytree-fade-expander` to be set on container
  * [Added] ext-dnd: `.dragExpand()` callback to prevent auto-expand
  * [Improved] load error reporting
  * [Improved] bootstrap theme icons and style (samples use bootstrap 3.3)
  * [Improved] status nodes don't have icons
  * [Improved] pass data argument to `source` callback
  * [Improved] Handle exceptions inside `postProcess`
  * [Improved] #568 ext-dnd: Auto-expanding of collapsed nodes should also work
    when dropping is not allowed
  * [Improved] #567 ext-dnd: fix revert position
  * [Improved] #565 ext-dnd: fix intermediate display of wrong icon (sending 'over' after 'enter')
  * [Fixed] #569 node.navigate does not return a Promise object
  * [Fixed] #563 `tree.reactivate(false)` sets fancytree-treefocus and `tree.reactivate(true)`
    doesn't set keyboard focus
  * [Fixed] #562 Node span tag leaks outside table cell
  * [Fixed] #526 tree.setFocus() does not set keyboard focus
  * Updated to jQuery 1.12.1
  * Updated grunt devDependencies
  * Add jQuery 3.0 beta to test suite
  * Added LICENSE.txt to dist

# 2.15.0 / 2016-01-11
  * [Changed] Renamed class `fancytree-statusnode-wait` to `fancytree-statusnode-loading`
  * [Added] new event `renderStatusColumns`
  * [DEPRECATED] ext-table option `customStatus`. Use `renderStatusColumns` instead
  * [Added] new event `clickPaging`
  * [Added] new mode `nodata` for use with node.setStatus()
  * [Added] new method `node.addPagingNode()`
  * [Added] new method `node.replaceWith()`
  * [Added] new type 'paging' for `node.statusNodeType`
  * [Added] #542 new method `node.getSelectedNodes()`
  * [Added] Helper class `glyphicon-spin` to allow rotating loading icon with bootstrap3
  * [Improved] #356: serialize load requests
  * [Improved] #538: Be more robust if site css defines custom li:before
  * [Improved] ext-table: Define table row templates in `<tbody>`
  * [Improved] ext-table: `<thead>` is now optional if `<tbody>` contains `<td>`s

# 2.14.0 / 2015-12-19
  * [CHANGED] #519 Refactored custom icon configuration:<br>
    (see also the [theming tutorial](https://github.com/mar10/fancytree/wiki/TutorialTheming))
    * [Added] `options.icon` option/callback.<br>
      Valid values are true, false, a string containing a class name or image
      url, or a callback returning that.
    * [Changed] `node.icon` option. Valid values are true, false, or a string
      containing a class name or image url.<br>
      This option existed before, but was stored in the `node.data.icon` namespace,
      and did not accept class names.
    * [DEPRECATED] `options.iconClass` callback: use `options.icon` instead
    * [DEPRECATED] `options.icons`: use `options.icon` instead
    * [DEPRECATED] `node.data.iconclass` option: use `node.icon` instead
    * [DEPRECATED] `node.data.icon` option: use `node.icon` instead
  * [Added] `tree.clear()` method.
  * [Added] #520 ext-persist: new event `beforeRestore`
  * [Fixed] #533 table-ext: nodeSetExpanded triggers redundant events

# 2.13.0 / 2015-11-16
  * [Changed] If a node is initalized as `lazy: true`, and `children: []`,
    treat it as 'loaded leaf node'.<br>
    This is consistent with a lazy node that has no children property at all (i.e.
    `undefined`). This would issue a lazyLoad event and a resopnse of `[]` would
    mark the node as leaf node.
  * [Added] new function $.ui.fancytree.getTree()
  * [Added] ext-filter methods node.isMatched() and tree.isFilterActive()
  * [Added] CSS for ext-childcounter badges is now part of the standard themes
  * [Added] ext-childcounter method node.updateCounter()`
  * [Fixed] #507 data-hideCheckbox="true"
  * [Fixed] #513 activeVisible option does not work on init
  * [Fixed] #516 ExtPersist requires cookie.js even when not using cookies

# 2.12.0 / 2015-09-10
  * [Changed] Documented `iconClass` callback and changed signature from
    `iconClass(node)` to `iconClass(event, data)`
  * [Added] ext-dnd events `initHelper` and `updateHelper`
  * [Added] ext-dnd option `smartRevert`
  * [Added] #146 sample for multi-node drag'n'drop
  * [Added] Sample for modifier keys to control copy/move behavior while dragging
  * [Added] `highlight` and `fuzzy` options to ext-filter
  * [Added] `fireActivate` option to ext-persist (default: true)
  * [Added] #496 new methods tree.findFirst() / .findAll()
  * [Improved] clearFilter() performance #491
  * [Improved] dnd registers global handlers to cancel on ESC and mousedown
  * [Fixed] #475 Font color while editing node title with bootstrap skin
  * [Fixed] #484 Glyph plugin: Missing margin-left for span.fancytree-custom-icon
  * [Fixed] #486 node.render(true) moves the node to the end of the list
  * [Fixed] #489 `focusOnClick` option is ignored for tables if 'dnd' is listed after 'table' extension
  * [Fixed] #495 Double clicking on expander with lazy-load causes assertion error

# 2.11.0 / 2015-07-26
  * [Changed] Adding `fancytree-plain` class to container (if not table), allowing for more efficient css
  * [Changed] #434: Use data-uris to inline loading.gif image
  * [Changed] #460: Use padding-left instead of margin-left for table indent
  * [Changed] #465: Add `node` argument to the `toDict()` callback
  * [Improved] Nicer bootstrap theme and added table to the example
  * [Improved] #464: ext-dnd supports ext-glyph
  * [Improved] #466: Add counter badges to ext-filter
  * [Fixed] Win8 theme jumpy hover effects
  * [Fixed] #411: ext-edit fails with ext-table, when edit was cancelled
  * [Fixed] #463: ext-table: render(deep) does not work
  * [Fixed] #470: Wide plugin not present in jquery.fancytree-all.min.js

# 2.10.2 / 2015-07-02
  * [Fixed] Add `dist/skin-custom-1` sample (again)
  * [Fixed] #459 Don't collapse root folder when last node is removed

# 2.10.1 / 2015-06-27
  * [Changed] Undo #340: Revert dist folder layout to v2.9.0, but add
    dist/skin-common.less

# 2.10.0 / 2015-06-26 [YANKED]
  * [Changed] #340: New dist folder layout: moved skin-* folders into src/ folder
    (**Note:** this change was reverted in v2.10.1)
  * [Improved] Update to jQuery UI 1.11.4, jQuery 1.11.3
  * [Improved] #340: add `dist/skin-common.less` to fix theme imports
  * [Improved] #443 Support js-cookie (still compatible with jquery-cookie)
  * [Fixed] #415 selected and unselectable shows unchecked checkbox
  * [Fixed] #427 table + themeroller: apply color to TR
  * [Fixed] #442 filterBranches shall use opts to allow autoExpand
  * [Fixed] #445 enter key not handled correctly
  * [Fixed] #449 After deleting last child, parent node remains expanded
  * [Fixed] #452 destroy not removing nodes with ext-table
  * [Fixed] #457 Autoscroll fails with lazyloading returning empty list

# 2.9.0 / 2015-04-19
  * [Changed] ext-filter: `tree.filterNodes(filter, opts)` now accept an `opts`
    object instead of `leavesOnly`
  * [Improved] #417 only raise exception about data being a string if dataType is "json"
  * [Added] #394 New option `autoExpand` for [ext-filter]
  * [Fixed] #402, #405 rare exception in dnd events
  * [Fixed] #420 nodeSetActive not returning promise
  * [Fixed] #270 Keyboard focus not working when using dnd extension

# 2.8.1 / 2015-03-01
  * [Improved] generateFormElements() new argument `opts`, default: `{stopOnParents: true}`
  * [Fixed] #393 ext-table: checkboxColumnIdx not working
  * [Fixed] #397 ext-edit: Creating sub category fails
  * [Fixed] #403 generateFormElements() doesn't work with string args

# 2.8.0 / 2015-02-08
  * [Changed] Deprecated ext-menu (was never officially supported, see http://localhost:8080/demo/index.html#sample-ext-menu.html)
  * [Improved] Bluring the widget will now blur the focused node too.
  * [Improved] Persistence will only set node focus if widget had focus (otherwise only activate the node).
  * [Improved] Set default focus on first keypress to active node (first node otherwise)
  * [Improved] #383 Accept [ECMAScript 6 Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) as source
  * [Added] `_superApply()` for hook handlers.
  * [Added] eventToString() supports mouse events
  * [Fixed] persistence for focus (when using non-cookie storage)
  * [Fixed] #391 Exception on autoscrolling filtered trees

# 2.7.0 / 2014-12-21
  * [CHANGED] Dropped `fx` option. Use `toggleEffect` instead.
  * [CHANGED] 'win8' and 'bootstrap' skins where modified to highlight the
    title span instead of the node span, in order to be compatible with
    [ext-wide]. The original skins are available as 'skin-win8-n' and
    'skin-bootstrap-n' respectively.
  * [Added] ext-wide extension (experimental)
  * [Added] LESS files to distribution
  * [Added] Publish on [cdnjs](https://cdnjs.com/libraries/jquery.fancytree)
  * [Improved] tree.reactivate() returns a promise
  * [Fixed] #246 Gaps when filtering in hide mode (patch by @lefunque)
  * [Fixed] #287 wrong image on hovers
  * [Fixed] #368 Standard browser behavior prevented (e.g. zoom with Ctrl+'+'/'-')
  * [Fixed] #369 Suppress warning, when dropping top- on top-node

# 2.6.0 / 2014-11-29
  * [Added] Option `focusOnSelect` to set focus when node is checked by a mouse
    click (default: false)
  * [Added] `restore` event, sent after ext-persist has restored the tree state
  * [Improved] #359 Better navigation performance when skipping hidden nodes
  * Publish on npm Registry

# 2.5.0 / 2014-11-23
  * [CHANGED] [ext-persist] overrideSource option now defaults to true
  * [Added] [ext-filter] Option `autoApply` re-applies filter on lazy loading
    (on by default)
  * [Added] quicksearch: navigate to next node by typing the first letters
  * [Improved] [ext-dnd] Make draggable helper and parent configurable
  * [Improved] #153 Add class `fancytree-unselectable` to respective nodes and
    dim unselectable checkboxes
  * [Improved] Update to jQuery 1.1.11, jQuery UI 1.11.2
  * [Improved] New mode 'firstChild' for node.addNode()
  * [Fixed] #324 Fix problem where minExpandLevel was not expanding root node
  * [Fixed] #300 dnd.focusOnClick for jQuery UI 1.11
  * [Fixed] #354 [ext-persist] with selectMode 3

# 2.4.1 / 2014-09-23
  * [Fixed] Regression #323

# 2.4.0 / 2014-09-21
  * [CHANGED] Renamed dist/jquery.fancytree-custom.min.js to jquery.fancytree-all.min.js
  * [CHANGED] ext-edit callbacks no longer pass `data.value` (use `data.input.val()` instead).
  * [Added] CDN support (http://www.jsdelivr.com/#!jquery.fancytree)
  * [Added] New method `node.visitAndLoad()`
  * [Added] New method `node.editCreateNode()` (ext-edit)
  * [Added] New method `node.isRootNode()`
  * [Added] New method `node.isTopLevel()`
  * [Added] New option `id` to override default tree id
  * [Added] New argument `stopOnParents` for tree.generateFormElements()
  * [Improved] #294 node.load() should resolve 'ok', if node is already loaded
  * [Improved] #293 minExpandLevel does not auto-expand
  * [Improved] #313 Allow HTML in tooltips
  * [Fixed] crash in scrollIntoView() when parent is `window`
  * [Fixed] #305 Checkbox doesn't show with Glyph + Table
  * [Fixed] #316 Fix hasChildren() when children = []
  * [Fixed] #237 Ajax LoadError not updated in StatusNode with Table ext
  * [Fixed] #295 loadKeyPath with multiple paths
  * [DEPRECATED] node.isRoot(). Use node.isRootNode() instead

# 2.3.0 / 2014-08-17
  * [CHANGED] renamed (undocumented) event 'loaderror' to 'loadError'
  * [Added] postProcess now allows to signal error conditions (so it becomes easy to handle custom Ajax response formats)
  * [Added] node.setStatus()
  * [Added] ext-clones to the standard distribution.
  * [Improved] loadError allows to return `false` to prevent default handling
  * [Fixed] #258 Fix moveTo when moving a node to same parent
  * [Fixed] #257 Glyph expander sometimes disappears

# 2.2.0 / 2014-06-28
  * [Added] Option dnd.focusOnClick sets focus to tree widget, even when dragging
    is enabled
  * [Added] node.info()
  * [Improved] #245 tree.generateInput() now returns data using PHPs array
    convention, i.e. by appending brackets to the name: 'ft_1[]'.
  * [Fixed] #250: Children lazy empty nodes remain checked when parent is
    unchecked with hierarchical multi-selection
  * [Fixed] #272 Navigation in filtered trees

# 2.1.0 / 2014-05-29
  * [Added] #210: [ext-persist] optionally store information in sessionStorage or localStorage
  * [Added] #64 [ext-filter] filterBranches() will restrict display to sub-trees
  * [Added] New options 'scrollParent' and 'scrollOfs' are evaluated by node.scrollIntoView()
    (which is also called on expand). This allows autoScroll to work with
    [ext-table]: set scrollParent to `window` or a wrapper DIV with  overflow: auto
  * [Added] [ext-wide] use 100% wide selection bar (experimental)
  * [Added] $.ui.fancytree.debounce()
  * [Improved] [ext-columnview] css
  * [Improved] skin-win8 now includes the loading.gif as inline CSS for faster response
  * [Improved] Add 'fancytree-icon' class to icon IMG
  * [Improved] css v-align for checkboxes and icons
  * [Fixed] #217: persistence when node keys are numeric
  * [Fixed] #228: html in node title prevents click
  * [Fixed] #235: D'n'd helper is displaced, when window is scrolled
  * [Fixed] #241: fromDict() does not update node title
  * [Fixed] relative custom imagePath option
  * [DEPRECATED] [ext-filter] Use filterNodes() instead of applyFilter()
  * [DEPRECATED] [ext-filter] 'leavesOnly' option removed (see filterNodes())

# 2.0.0 / 2014-05-01
  * Released 2.0.0

# 1.x

  * See [Dynatree](https://code.google.com/p/dynatree/)
