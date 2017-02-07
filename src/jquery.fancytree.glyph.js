/*!
 * jquery.fancytree.glyph.js
 *
 * Use glyph fonts as instead of icon sprites.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2017, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";

function hasStdIcons(opts) {
	var map = opts.map;
	return map["doc"] || map["docOpen"] || map["folder"] || map["folderOpen"];
}
function hasCheckboxIcons(opts) {
	var map = opts.map;
	return map["checkbox"] || map["checkboxSelected"] || map["checkboxUnknown"];
}

$.ui.fancytree.registerExtension({
	name: "glyph",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		map: {
			// Samples from Font Awesome 3.2
			//   http://fortawesome.github.io/Font-Awesome/3.2.1/icons/
			// See here for alternatives:
			//   http://fortawesome.github.io/Font-Awesome/icons/
			//   http://getbootstrap.com/components/
			// Expander icons:
			expanderClosed: "icon-caret-right",
			expanderLazy: "icon-angle-right",
			expanderOpen: "icon-caret-down",
			noExpander: "",
			// d-n-d icons:
			// TODO: dragHelper: "icon-caret-right",
			// TODO: dropMarker: "icon-caret-right",
			// Checkbox icons:
			checkbox: "icon-check-empty",
			checkboxSelected: "icon-check",
			checkboxUnknown: "icon-check icon-muted",
			// Default node statuses icons:
			loading: "icon-refresh icon-spin",
			nodata: "icon-meh",
			error: "icon-exclamation-sign",
			// Default node icons:
			// (use tree.options.icon callback to define custom icons based on node data)
			doc: "icon-file-alt",
			docOpen: "icon-file-alt",
			folder: "icon-folder-close-alt",
			folderOpen: "icon-folder-open-alt"
		}
	},

	treeInit: function(ctx){
		var tree = ctx.tree;
		this._superApply(arguments);
		tree.$container.addClass("fancytree-ext-glyph");
	},
	nodeRenderStatus: function(ctx) {
		var icon, res, span,
			node = ctx.node,
			$span = $(node.span),
			opts = ctx.options.glyph,
			map = opts.map;

		res = this._superApply(arguments);

		if( node.isRootNode() ){
			return res;
		}

		// Expander icon
		span = $span.children("span.fancytree-expander").get(0);
		if( span ){
			if( node.isLoading() ) {
				// NOTE: it's important to handle "loading" as nodeRenderStatus can be called w/o nodeSetStatus
				icon = "loading";
			}else if( node.expanded && node.hasChildren() ){
				icon = "expanderOpen";
			}else if( node.isUndefined() ){
				icon = "expanderLazy";
			}else if( node.hasChildren() ){
				icon = "expanderClosed";
			}else{
				icon = "noExpander";
			}
			// noExpander is usually empty, so we must update class in any way
			span.className = "fancytree-expander " + map[icon];
		}

		// Checkbox icon (optional)
		if( hasCheckboxIcons(opts) ) {
			if( node.tr ){
				span = $("td", node.tr).find("span.fancytree-checkbox").get(0);
			}else{
				span = $span.children("span.fancytree-checkbox").get(0);
			}
			if( span ){
				icon = map[node.selected ? "checkboxSelected" : (node.partsel ? "checkboxUnknown" : "checkbox")];
				if( icon ){
					span.className = "fancytree-checkbox " + icon;
				}
			}
		}

		// Status node icon and Standard icon (optional)
		// (note that this does not match .fancytree-custom-icon, 
		// that might be set by opts.icon callbacks)
		if( node.statusNodeType || hasStdIcons(opts) ) {
			span = $span.children("span.fancytree-icon").get(0);
			if( span ){
				if( node.statusNodeType ){
					// it's a "status node"
					icon = node.statusNodeType; // loading, error
				}else if( node.folder ){
					icon = node.expanded && node.hasChildren() ? "folderOpen" : "folder";
				}else{
					icon = node.expanded ? "docOpen" : "doc";
				}
				icon = map[icon];
				if( icon ){
					span.className = "fancytree-icon " + icon;
				}	
			}
		}

		return res;
	},
	nodeSetStatus: function(ctx, status, message, details) {
		var res, span, icon,
			opts = ctx.options.glyph,
			node = ctx.node;

		res = this._superApply(arguments);

		if( status === "error" || status === "loading" || status === "nodata" ){
			if(node.parent){
				span = $("span.fancytree-expander", node.span).get(0);
				if( span ) {
					icon = opts.map[status];
					if( icon ){
						span.className = "fancytree-expander " + icon;
					}	
				}
			}else{ // no parent, there could be a stub node
				span = $(".fancytree-statusnode-" + status, node[this.nodeContainerAttrName])
					.find("span.fancytree-icon").get(0);
				if( span ) {
					icon = opts.map[status];
					if( icon ){
						span.className = "fancytree-icon " + icon;
					}
				}
			}
		}
		return res;
	}
});
}(jQuery, window, document));
