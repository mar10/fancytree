/* *****************************************************************************
 * Virtual objects for jsdoc documentation
 */
/**
 * Context object passed too hook functions.
 * @name HookContext
 *
 * @property {Fancytree} tree
 * @property {any} widget
 * @property {FancytreeOptions} options
 * @property {Event} orgEvent
 * @property {FancytreeNode | null} node
 * @property {String | undefined} targetType (only for click and dblclick events) 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon'
 */
var HookContext = {};


/**
 * Data object passed to FancytreeNode() constructor.
 * @name NodeData
 *
 * @property {String} title
 * @property {String} key unique key for this node (quto-generated if omitted)
 */
var NodeData = {};


/**
 * Data object similar to {@link NodeData}, but with additional options.
 * May be passed to {@link FancytreeNode#applyPatch}.
 * @name NodePatch
 *
 * @property {String} title
 */
var NodePatch = {};


/**
 * List of [key, {@link NodePatch}]  tuples.
 * May be passed to {@link Fancytree#applyPatch}.
 * @name NodePatch
 *
 */
var TreePatch = {};

/*
	title: "Dynatree", // Tree's name (only used for debug output)
	minExpandLevel: 1, // 1: root node is not collapsible
	imagePath: null, // Path to a folder containing icons. Defaults to 'skin/' subdirectory.
	children: null, // Init tree structure from this object array.
	initId: null, // Init tree structure from a <ul> element with this ID.
	initAjax: null, // Ajax options used to initialize the tree strucuture.
	autoFocus: true, // Set focus to first child, when expanding or lazy-loading.
	keyboard: true, // Support keyboard navigation.
	persist: false, // Persist expand-status to a cookie
	autoCollapse: false, // Automatically collapse all siblings, when a node is expanded.
	clickFolderMode: 3, // 1:activate, 2:expand, 3:activate and expand
	activeVisible: true, // Make sure, active nodes are visible (expanded).
	checkbox: false, // Show checkboxes.
	selectMode: 2, // 1:single, 2:multi, 3:multi-hier
	fx: null, // Animations, e.g. null or { height: "toggle", duration: 200 }
	noLink: false, // Use <span> instead of <a> tags for all nodes
	// Low level event handlers: onEvent(dtnode, event): return false, to stop default processing
	onClick: null, // null: generate focus, expand, activate, select events.
	onDblClick: null, // (No default actions.)
	onKeydown: null, // null: generate keyboard navigation (focus, expand, activate).
	onKeypress: null, // (No default actions.)
	onFocus: null, // null: set focus to node.
	onBlur: null, // null: remove focus from node.

	// Pre-event handlers onQueryEvent(flag, dtnode): return false, to stop processing
	onQueryActivate: null, // Callback(flag, dtnode) before a node is (de)activated.
	onQuerySelect: null, // Callback(flag, dtnode) before a node is (de)selected.
	onQueryExpand: null, // Callback(flag, dtnode) before a node is expanded/collpsed.

	// High level event handlers
	onPostInit: null, // Callback(isReloading, isError) when tree was (re)loaded.
	onActivate: null, // Callback(dtnode) when a node is activated.
	onDeactivate: null, // Callback(dtnode) when a node is deactivated.
	onSelect: null, // Callback(flag, dtnode) when a node is (de)selected.
	onExpand: null, // Callback(flag, dtnode) when a node is expanded/collapsed.
	onLazyRead: null, // Callback(dtnode) when a lazy node is expanded for the first time.
	onCustomRender: null, // Callback(dtnode) before a node is rendered. Return a HTML string to override.
	onCreate: null, // Callback(dtnode, nodeSpan) after a node was rendered for the first time.
	onRender: null, // Callback(dtnode, nodeSpan) after a node was rendered.
				// postProcess is similar to the standard dataFilter hook,
				// but it is also called for JSONP
	postProcess: null, // Callback(data, dataType) before an Ajax result is passed to dynatree

	// Drag'n'drop support
	dnd: {
		// Make tree nodes draggable:
		onDragStart: null, // Callback(sourceNode), return true, to enable dnd
		onDragStop: null, // Callback(sourceNode)
//      helper: null,
		// Make tree nodes accept draggables
		autoExpandMS: 1000, // Expand nodes after n milliseconds of hovering.
		preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
		onDragEnter: null, // Callback(targetNode, sourceNode)
		onDragOver: null, // Callback(targetNode, sourceNode, hitMode)
		onDrop: null, // Callback(targetNode, sourceNode, hitMode)
		onDragLeave: null // Callback(targetNode, sourceNode)
	},
	ajaxDefaults: { // Used by initAjax option
		cache: false, // false: Append random '_' argument to the request url to prevent caching.
		timeout: 0, // >0: Make sure we get an ajax error for invalid URLs
		dataType: "json" // Expect json format and pass json object to callbacks.
	},
	strings: {
		loading: "Loading&#8230;",
		loadError: "Load error!"
	},
	generateIds: false, // Generate id attributes like <span id='dynatree-id-KEY'>
	idPrefix: "dynatree-id-", // Used to generate node id's like <span id="dynatree-id-<key>">.
	keyPathSeparator: "/", // Used by node.getKeyPath() and tree.loadKeyPath().
//    cookieId: "dynatree-cookie", // Choose a more unique name, to allow multiple trees.
	cookieId: "dynatree", // Choose a more unique name, to allow multiple trees.
	cookie: {
		expires: null //7, // Days or Date; null: session cookie
//      path: "/", // Defaults to current page
//      domain: "jquery.com",
//      secure: true

 */
/**
 * @name FancytreeOptions
 *
 * @description
 * Fancytree options (see also example)
 * line 2
 *
 * @example $("#tree").fancytree({source: "/myService"});
 *
 * @property {Boolean} activeVisible Make sure that the active node is always visible, i.e. it's parents are expanded (default: true).
 * @property {object} ajax
 * @property {Boolean} autoCollapse Automatically collapse all siblings, when a node is expanded (default: false).
 * @property {Boolean} autoFocus Set focus to first child, when expanding or lazy-loading (default: true).
 * @property {Boolean} checkbox Display checkboxes to allow selection  (default: false)
 * @property {Integer} clickFolderMode Defines what happens, when the user click a folder node.<br>1:activate, 2:expand, 3:activate and expand  (default: 3)
 * @property {String[]} extensions List of active extensions (default: [])
 * @property {String} idPrefix (default: "ft_")
 * @property {String} keyPathSeparator (default: "/")
 * @property {object} fx Animation options, null:off (default: { height: "toggle", duration: 200 })
 * @property {String} imagePath Path to a folder containing icons (default: null, using 'skin/' subdirectory).
 * @property {Boolean} keyboard Support keyboard navigation (default: true).
 * @property {Integer} minExpandLevel 1: root node is not collapsible (default: 1)
 * @property {Boolean} noLink Use <span> instead of <a> tags for all nodes (default: false)
 * @property {Boolean} tabbable add 'tabindex=0' to container (default: true)
 * @property {Integer} selectMode 1:single, 2:multi, 3:multi-hier (default: 2)
 * @property {any} source Used to Initialize the tree.
 *     line 2
 * @property {object} strings Translation table
 */
var FancytreeOptions = {};

/** Fancytree events
 * @name FancytreeEvents
 *
 * @description
 * Events are called this way:
 *    CALLBACK_NAME(event, data)
 * where `event` is a jQuery Event object and `data` is of type {@link HookContext}
 *
 * @see <a href="http://api.jquery.com/category/events/event-object/">jQuery Event</a>
 * @see HookContext
 *
 * @example $("#tree").fancytree({
 *     activate: function(event, data){
 *         var node = data.node;
 *     }
 * });
 *
 * @property {function} lazyload
 */
var FancytreeEvents = {};
