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

;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "./jquery.fancytree" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */

var FT = $.ui.fancytree,
	PRESETS = {
	"awesome3": {
		checkbox: "icon-check-empty",
		checkboxSelected: "icon-check",
		checkboxUnknown: "icon-check icon-muted",
		radio: "icon-circle-blank",
		radioSelected: "icon-circle",
		radioUnknown: "icon-circle icon-muted",
		// radioUnknown: "icon-remove-circle-blank",
		dragHelper: "icon-caret-right",
		dropMarker: "icon-caret-right",
		error: "icon-exclamation-sign",
		expanderClosed: "icon-caret-right",
		expanderLazy: "icon-angle-right",
		expanderOpen: "icon-caret-down",
		loading: "icon-refresh icon-spin",
		nodata: "icon-meh",
		noExpander: "",
		// Default node icons.
		// (Use tree.options.icon callback to define custom icons based on node data)
		doc: "icon-file-alt",
		docOpen: "icon-file-alt",
		folder: "icon-folder-close-alt",
		folderOpen: "icon-folder-open-alt"
		},
	"awesome4": {
		checkbox: "fa fa-square-o",
		checkboxSelected: "fa fa-check-square-o",
		// checkboxUnknown: "fa fa-window-close-o",
		checkboxUnknown: "fa fa-square",
		radio: "fa fa-circle-o",
		radioSelected: "fa fa-circle",
		radioUnknown: "fa fa-dot-circle-o",
		dragHelper: "fa fa-arrow-right",
		dropMarker: "fa fa-long-arrow-right",
		error: "fa fa-warning",
		expanderClosed: "fa fa-caret-right",
		expanderLazy: "fa fa-angle-right",
		expanderOpen: "fa fa-caret-down",
		loading: "fa fa-spinner fa-pulse",
		nodata: "fa fa-meh-o",
		noExpander: "",
		// Default node icons.
		// (Use tree.options.icon callback to define custom icons based on node data)
		doc: "fa fa-file-o",
		docOpen: "fa fa-file-o",
		folder: "fa fa-folder-o",
		folderOpen: "fa fa-folder-open-o"
		},
	"bootstrap3": {
		checkbox: "glyphicon glyphicon-unchecked",
		checkboxSelected: "glyphicon glyphicon-check",
		checkboxUnknown: "glyphicon glyphicon-expand",
		radio: "glyphicon glyphicon-remove-circle",
		radioSelected: "glyphicon glyphicon-ok-circle",
		radioUnknown: "glyphicon glyphicon-ban-circle",
		dragHelper: "glyphicon glyphicon-play",
		dropMarker: "glyphicon glyphicon-arrow-right",
		error: "glyphicon glyphicon-warning-sign",
		expanderClosed: "glyphicon glyphicon-menu-right",  // glyphicon-plus-sign
		expanderLazy: "glyphicon glyphicon-menu-right",  // glyphicon-plus-sign
		expanderOpen: "glyphicon glyphicon-menu-down",  // glyphicon-minus-sign
		loading: "glyphicon glyphicon-refresh glyphicon-spin",
		nodata: "glyphicon glyphicon-info-sign",
		noExpander: "",
		// Default node icons.
		// (Use tree.options.icon callback to define custom icons based on node data)
		doc: "glyphicon glyphicon-file",
		docOpen: "glyphicon glyphicon-file",
		folder: "glyphicon glyphicon-folder-close",
		folderOpen: "glyphicon glyphicon-folder-open"
		}
	};


function _getIcon(opts, type){
	return opts.map[type];
}


$.ui.fancytree.registerExtension({
	name: "glyph",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		preset: null,  // 'awesome3', 'awesome4', 'bootstrap3'
		map: {
		}
	},

	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options.glyph;

		if( opts.preset ) {
			FT.assert( !!PRESETS[opts.preset],
				"Invalid value for `options.glyph.preset`: " + opts.preset);
			opts.map = $.extend({}, PRESETS[opts.preset], opts.map);
		} else {
			tree.warn("ext-glyph: missing `preset` option.");
		}
		this._superApply(arguments);
		tree.$container.addClass("fancytree-ext-glyph");
	},
	nodeRenderStatus: function(ctx) {
		var checkbox, className, icon, res, span,
			node = ctx.node,
			$span = $(node.span),
			opts = ctx.options.glyph,
			map = opts.map;

		res = this._super(ctx);

		if( node.isRoot() ){
			return res;
		}
		span = $span.children("span.fancytree-expander").get(0);
		if( span ){
			// if( node.isLoading() ){
				// icon = "loading";
			if( node.expanded && node.hasChildren() ){
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

		if( node.tr ){
			span = $("td", node.tr).find("span.fancytree-checkbox").get(0);
		}else{
			span = $span.children("span.fancytree-checkbox").get(0);
		}
		if( span ){
			checkbox = FT.evalOption("checkbox", node, node, ctx.options, false);
			if( checkbox && !node.isStatusNode() ) {
				className = "fancytree-checkbox ";
				if( checkbox === "radio" || (node.parent && node.parent.radiogroup) ) {
					className += "fancytree-radio ";
					icon = node.selected ? "radioSelected" : (node.partsel ? "radioUnknown" : "radio");
				} else {
					icon = node.selected ? "checkboxSelected" : (node.partsel ? "checkboxUnknown" : "checkbox");
				}
				span.className = className + map[icon];
			}
		}

		// Standard icon (note that this does not match .fancytree-custom-icon,
		// that might be set by opts.icon callbacks)
		span = $span.children("span.fancytree-icon").get(0);
		if( span ){
			if( node.statusNodeType ){
				icon = _getIcon(opts, node.statusNodeType); // loading, error
			}else if( node.folder ){
				icon = node.expanded && node.hasChildren() ? _getIcon(opts, "folderOpen") : _getIcon(opts, "folder");
			}else{
				icon = node.expanded ? _getIcon(opts, "docOpen") : _getIcon(opts, "doc");
			}
			span.className = "fancytree-icon " + icon;
		}
		return res;
	},
	nodeSetStatus: function(ctx, status, message, details) {
		var res, span,
			opts = ctx.options.glyph,
			node = ctx.node;

		res = this._superApply(arguments);

		if( status === "error" || status === "loading" || status === "nodata" ){
			if(node.parent){
				span = $("span.fancytree-expander", node.span).get(0);
				if( span ) {
					span.className = "fancytree-expander " + _getIcon(opts, status);
				}
			}else{ //
				span = $(".fancytree-statusnode-" + status, node[this.nodeContainerAttrName])
					.find("span.fancytree-icon").get(0);
				if( span ) {
					span.className = "fancytree-icon " + _getIcon(opts, status);
				}
			}
		}
		return res;
	}
});
// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
}));  // End of closure
