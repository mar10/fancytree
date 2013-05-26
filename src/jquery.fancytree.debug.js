/*************************************************************************
	jquery.fancytree.tracecalls.js
	Table extension for jquery.fancytree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/fancytree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://fancytree.googlecode.com/

	$Version:$
	$Revision:$

	@depends: jquery.js
	@depends: jquery.ui.widget.js
	@depends: jquery.ui.core.js
	@depends: jquery.fancytree.js
*************************************************************************/

;(function($, window, document, undefined) {

"use strict";

// prevent duplicate loading
// if ( $.ui.fancytree && $.ui.fancytree.version ) {
//     $.ui.fancytree.warn("Fancytree: duplicate include");
//     return;
// }


/* *****************************************************************************
 * Private functions and variables
 */
var HOOK_NAMES = "nodeClick nodeCollapseSiblings".split(" ");
var EVENT_NAMES = "activate beforeActivate".split(" ");
var HOOK_NAME_MAP = {},
	EVENT_NAME_MAP = {},
	i;

for(i=0; i<HOOK_NAMES.length; i++){ HOOK_NAME_MAP[HOOK_NAMES[i]] = true; }
for(i=0; i<EVENT_NAMES.length; i++){ EVENT_NAME_MAP[EVENT_NAMES[i]] = true; }

/* *****************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("tracecalls", {
	// Default options for this extension.
	options: {
		logTarget: null,   // optional redirect logging to this <div> tag
		traceEvents: false, // `true`or list of hook names
		traceHooks: false  // `true`or list of event names
	},
	// Overide virtual methods for this extension.
	// `this`       : is this Fancytree object
	// `this._super`: the virtual function that was overridden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var tree = ctx.tree;

		// Bind init-handler to apply cookie state
		tree.$div.bind("fancytreeinit", function(e){
			tree.debug("COOKIE " + document.cookie);
		});
		// Init the tree
		this._super(ctx);
	},
	nodeClick: function(ctx) {
		if(this.options.tracecalls.traceHooks){
			this.debug();
		}
	},
	nodeCollapseSiblings: function(ctx) {
	},
	nodeDblclick: function(ctx) {
	},
	nodeKeydown: function(ctx) {
	},
	nodeLoadChildren: function(ctx, source) {
	},
	nodeMakeVisible: function(ctx) {
	},
	nodeOnFocusInOut: function(ctx) {
	},
	nodeRemoveChildMarkup: function(ctx) {
	},
	nodeRemoveMarkup: function(ctx) {
	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
	},
	nodeRenderStatus: function(ctx) {
	},
	nodeRenderTitle: function(ctx, title) {
	},
	nodeSetActive: function(ctx, flag) {
	},
	nodeSetExpanded: function(ctx, flag) {
	},
	nodeSetFocus: function(ctx) {
	},
	nodeSetSelected: function(ctx, flag) {
	},
	nodeSetStatus: function(ctx, status, message, details) {
	},
	nodeToggleExpanded: function(ctx) {
	},
	nodeToggleSelected: function(ctx) {
	},
	treeClear: function(ctx) {
	},
	treeCreate: function(ctx) {
	},
	treeDestroy: function(ctx) {
	},
//	treeInit: function(ctx) {
//	},
	treeLoad: function(ctx, source) {
	},
	treeSetFocus: function(ctx, flag) {
	}
});

}(jQuery, window, document));



/* *****************************************************************************
 * Fancytree extension: profiler
 */
;(function($, window, document, undefined) {
	$.ui.fancytree.registerExtension("profiler", {
		// Default options for this extension
		options: {
			prefix: ""
		},
		// Overide virtual methods for this extension
		nodeRender: function(ctx, force, deep, collapsed){
			// ctx.tree.debug("**** PROFILER nodeRender");
			var s = this.options.prefix + "render '" + ctx.node + "'";
			/*jshint expr:true */
			window.console && window.console.time && window.console.time(s);
			this._super(ctx, force, deep, collapsed);
			window.console && window.console.timeEnd && window.console.timeEnd(s);
		}
	 });
}(jQuery, window, document));
