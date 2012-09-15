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

// Start of local namespace
(function($) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
// if ( $.ui.fancytree && $.ui.fancytree.version ) {
//     $.ui.fancytree.warn("Fancytree: duplicate include");
//     return;
// }


/*******************************************************************************
 * Private functions and variables
 */
function _raiseNotImplemented(msg){
	msg = msg || "";
	$.error("Not implemented: " + msg);
}

/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("tracecalls", {
	nodeClick: function(ctx) {
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
	treeInit: function(ctx) {
	},
	treeLoad: function(ctx, source) {
	}
});
}(jQuery));
