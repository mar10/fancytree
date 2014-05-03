/*!
 * jquery.fancytree.glyph.js
 *
 * Use glyph fonts as instead of icon sprites.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2014, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version 2.0.0
 * @date 2014-05-01T21:48
 */

;(function($, window, document, undefined) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */

function _getIcon(opts, type){
	return opts.map[type];
}

$.ui.fancytree.registerExtension({
	name: "glyph",
	version: "0.1.0",
	// Default options for this extension.
	options: {
		prefix: "icon-",
		extra: null,
		map: {
			doc: "icon-file-alt",
			docOpen: "icon-file-alt",
			checkbox: "icon-check-empty",
			checkboxSelected: "icon-check",
			checkboxUnknown: "icon-check icon-muted",
			error: "icon-exclamation-sign",
			expanderClosed: "icon-caret-right",
			expanderLazy: "icon-angle-right",
			expanderOpen: "icon-caret-down",
			folder: "icon-folder-close-alt",
			folderOpen: "icon-folder-open-alt",
			loading: "icon-refresh icon-spin",
			noExpander: ""
		},
		icon: null // TODO: allow callback here
	},

	treeInit: function(ctx){
		var tree = ctx.tree;
		this._super(ctx);
		tree.$container.addClass("fancytree-ext-glyph");
	},
	nodeRenderStatus: function(ctx) {
		var icon, span,
			node = ctx.node,
			opts = ctx.options.glyph,
			// callback = opts.icon,
			map = opts.map
			// prefix = opts.prefix
			// $span = $(node.span)
			;

		this._super(ctx);

		if( node.isRoot() ){
			return;
		}

		span = $("span.fancytree-expander", node.span).get(0);
		if( span ){
			if( node.isLoading() ){
				icon = "loading";
			}else if( node.expanded ){
				icon = "expanderOpen";
			}else if( node.isUndefined() ){
				icon = "expanderLazy";
			}else if( node.hasChildren() ){
				icon = "expanderClosed";
			}else{
				icon = "noExpander";
			}
			span.className = "fancytree-expander " + map[icon];
		}

		span = $("span.fancytree-checkbox", node.tr || node.span).get(0);
		if( span ){
			icon = node.selected ? "checkboxSelected" : (node.partsel ? "checkboxUnknown" : "checkbox");
			span.className = "fancytree-checkbox " + map[icon];
		}

		span = $("span.fancytree-icon", node.span).get(0);
		if( span ){
			if( node.folder ){
				icon = node.expanded ? _getIcon(opts, "folderOpen") : _getIcon(opts, "folder");
			}else{
				icon = node.expanded ? _getIcon(opts, "docOpen") : _getIcon(opts, "doc");
			}
			span.className = "fancytree-icon " + icon;
		}
	},
	nodeSetStatus: function(ctx, status, message, details) {
		var span,
			opts = ctx.options.glyph,
			node = ctx.node;

		this._super(ctx, status, message, details);

		if(node.parent){
			span = $("span.fancytree-expander", node.span).get(0);
		}else{
			span = $(".fancytree-statusnode-wait, .fancytree-statusnode-error", node[this.nodeContainerAttrName])
				.find("span.fancytree-expander").get(0);
		}
		if( status === "loading"){
			// $("span.fancytree-expander", ctx.node.span).addClass(_getIcon(opts, "loading"));
			span.className = "fancytree-expander " + _getIcon(opts, "loading");
		}else if( status === "error"){
			span.className = "fancytree-expander " + _getIcon(opts, "error");
		}
	}
});
}(jQuery, window, document));
