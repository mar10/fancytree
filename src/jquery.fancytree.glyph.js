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

/* *****************************************************************************
 * Private functions and variables
 */

var FT = $.ui.fancytree,
	PRESETS = {
		"awesome3": {  // Old version
			_addClass: "",
			checkbox: "icon-check-empty",
			checkboxSelected: "icon-check",
			checkboxUnknown: "icon-check icon-muted",
			dragHelper: "icon-caret-right",
			dropMarker: "icon-caret-right",
			error: "icon-exclamation-sign",
			expanderClosed: "icon-caret-right",
			expanderLazy: "icon-angle-right",
			expanderOpen: "icon-caret-down",
			loading: "icon-refresh icon-spin",
			nodata: "icon-meh",
			noExpander: "",
			radio: "icon-circle-blank",
			radioSelected: "icon-circle",
			// Default node icons.
			// (Use tree.options.icon callback to define custom icons based on node data)
			doc: "icon-file-alt",
			docOpen: "icon-file-alt",
			folder: "icon-folder-close-alt",
			folderOpen: "icon-folder-open-alt"
			},
		"awesome4": {
			_addClass: "fa",
			checkbox: "fa-square-o",
			checkboxSelected: "fa-check-square-o",
			checkboxUnknown: "fa-square",
			dragHelper: "fa-arrow-right",
			dropMarker: "fa-long-arrow-right",
			error: "fa-warning",
			expanderClosed: "fa-caret-right",
			expanderLazy: "fa-angle-right",
			expanderOpen: "fa-caret-down",
			loading: "fa-spinner fa-pulse",
			nodata: "fa-meh-o",
			noExpander: "",
			radio: "fa-circle-thin",
			radioSelected: "fa-circle",
			// Default node icons.
			// (Use tree.options.icon callback to define custom icons based on node data)
			doc: "fa-file-o",
			docOpen: "fa-file-o",
			folder: "fa-folder-o",
			folderOpen: "fa-folder-open-o"
			},
		"bootstrap3": {
			_addClass: "glyphicon",
			checkbox: "glyphicon-unchecked",
			checkboxSelected: "glyphicon-check",
			checkboxUnknown: "glyphicon-share",
			dragHelper: "glyphicon-play",
			dropMarker: "glyphicon-arrow-right",
			error: "glyphicon-warning-sign",
			expanderClosed: "glyphicon-plus-sign",
			expanderLazy: "glyphicon-plus-sign",
			expanderOpen: "glyphicon-minus-sign",
			loading: "glyphicon-refresh glyphicon-spin",
			nodata: "glyphicon-info-sign",
			noExpander: "",
			radio: "glyphicon-unchecked",
			radioSelected: "glyphicon-check",
			// Default node icons.
			// (Use tree.options.icon callback to define custom icons based on node data)
			doc: "glyphicon-file",
			docOpen: "glyphicon-file",
			folder: "glyphicon-folder-close",
			folderOpen: "glyphicon-folder-open"
			},
		"material": {
			_addClass: "material-icons",
			checkbox: { text: "check_box_outline_blank" },
			checkboxSelected: { text: "check_box" },
			checkboxUnknown: { text: "indeterminate_check_box" },
			dragHelper: { text: "play_arrow" },
			dropMarker: { text: "arrow-forward" },
			error: { text: "warning" },
			expanderClosed: { text: "chevron_right" },
			expanderLazy: { text: "last_page" },
			expanderOpen: { text: "expand_more" },
			loading: { text: "autorenew", addClass: "glyphicon-spin" },
			nodata: { text: "info" },
			noExpander: { text: "" },
			radio: { text: "radio_button_unchecked" },
			radioSelected: { text: "radio_button_checked" },
			// Default node icons.
			// (Use tree.options.icon callback to define custom icons based on node data)
			doc: { text: "web_asset" },
			docOpen: { text: "web_asset" },
			folder: { text: "folder" },
			folderOpen: { text: "folder" }
			}
	};


function setIcon( span, baseClass, opts, type ) {
	var map = opts.map,
		icon = map[ type ],
		$span = $( span ),
		setClass = baseClass + " " + (map._addClass || "");

	if( typeof icon === "string" ) {
		$span.attr( "class", setClass + " " + icon );
	} else {
		if( icon.text ) {
			$span.text( "" + icon.text );
		}
		$span.attr( "class", setClass + " " + ( icon.addClass || "" ) );
	}
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
		var checkbox, icon, res, span,
			node = ctx.node,
			$span = $( node.span ),
			opts = ctx.options.glyph;

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
			// span.className = "fancytree-expander " + map[icon];
			setIcon( span, "fancytree-expander", opts, icon );
		}

		if( node.tr ){
			span = $("td", node.tr).find("span.fancytree-checkbox").get(0);
		}else{
			span = $span.children("span.fancytree-checkbox").get(0);
		}
		if( span ) {
			checkbox = FT.evalOption("checkbox", node, node, opts, false);
			if( (node.parent && node.parent.radiogroup ) || checkbox === "radio" ) {
				icon = node.selected ? "radioSelected" : "radio";
				setIcon( span, "fancytree-checkbox fancytree-radio", opts, icon );
			} else {
				icon = node.selected ? "checkboxSelected" : (node.partsel ? "checkboxUnknown" : "checkbox");
				// span.className = "fancytree-checkbox " + map[icon];
				setIcon( span, "fancytree-checkbox", opts, icon );
			}
		}

		// Standard icon (note that this does not match .fancytree-custom-icon,
		// that might be set by opts.icon callbacks)
		span = $span.children("span.fancytree-icon").get(0);
		if( span ){
			if( node.statusNodeType ){
				icon = node.statusNodeType; // loading, error
			}else if( node.folder ){
				icon = ( node.expanded && node.hasChildren() ) ? "folderOpen" : "folder";
			}else{
				icon = node.expanded ? "docOpen" : "doc";
			}
			setIcon( span, "fancytree-icon", opts, icon );
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
					setIcon( span, "fancytree-expander", opts, status );
				}
			}else{ //
				span = $(".fancytree-statusnode-" + status, node[this.nodeContainerAttrName])
					.find("span.fancytree-icon").get(0);
				if( span ) {
					setIcon( span, "fancytree-icon", opts, status );
				}
			}
		}
		return res;
	}
});
}(jQuery, window, document));
