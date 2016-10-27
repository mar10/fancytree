/*!
 * jquery.fancytree.fixed.js
 *
 * Render tree as table (aka 'treegrid', 'tabletree').
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2016, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date 2015-09-08T23:02
 */

;(function($, window, document, undefined) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */
function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}


$.ui.fancytree.registerExtension({
	name: "fixed",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		checkboxColumnIdx: null, // render the checkboxes into the this column index (default: nodeColumnIdx)
		customStatus: false,	 // true: generate renderColumns events for status nodes
		indentation: 16,         // indent every node level by 16px
		nodeColumnIdx: 0         // render node expander, icon, and title to this column (default: #0)
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			$table = tree.widget.element;

		// 'fixed' requires the table extension to be loaded before itself
		this._requireExtension("table", true, true);
		$table.addClass("fancytree-ext-fixed");

		return this._superApply(arguments);
	},
	/* Called by nodeRender to sync node order with tag order.*/
//    nodeFixOrder: function(ctx) {
//    },
	nodeRemoveChildMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeRemoveMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		return this._superApply(arguments);
	},
	nodeRenderTitle: function(ctx, title) {
		return this._superApply(arguments);
	},
	nodeRenderStatus: function(ctx) {
		return this._superApply(arguments);
	},
	nodeSetExpanded: function(ctx, flag, opts) {
		return this._superApply(arguments);
	},
	nodeSetStatus: function(ctx, status, message, details) {
		return this._superApply(arguments);
	},
	treeClear: function(ctx) {
		return this._superApply(arguments);
	},
	treeDestroy: function(ctx) {
		return this._superApply(arguments);
	}
	/*,
	treeSetFocus: function(ctx, flag) {
//	        alert("treeSetFocus" + ctx.tree.$container);
		ctx.tree.$container.focus();
		$.ui.fancytree.focusTree = ctx.tree;
	}*/
});
}(jQuery, window, document));
