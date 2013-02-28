/*************************************************************************
	jquery.fancytree.menu.js
	Context menu extension for jquery.fancytree.js.

	@see http://api.jqueryui.com/menu/

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/fancytree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://fancytree.googlecode.com/
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

$.ui.fancytree.registerExtension("menu", {
	version: "1.0.0pre",
	// Default options for this extension.
	options: {
		enable: true,
		selector: null,  //
		position: {},    //
		// Events:
		create: $.noop,  //
		beforeOpen: $.noop,    //
		open: $.noop,    //
		focus: $.noop,   //
		select: $.noop,  //
		close: $.noop    //
	},
	// Override virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overridden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var opts = ctx.options,
			tree = ctx.tree;

		this._super(ctx);

		// Prepare an object that will be passed with menu events
		tree.menu.data = {
			tree: tree,
			node: null,
			$menu: null,
			menuId: null
		};

//        tree.$container[0].oncontextmenu = function() {return false;};
		// Replace the standard browser context menu with out own
		tree.$container.delegate("span.fancytree-node", "contextmenu", function(event) {
			var node = $.ui.fancytree.getNode(event),
				ctx = {node: node, tree: node.tree, orgEvent: event, options: tree.options};
			tree.menu._openMenu(ctx);
			return false;
		});

		// Use jquery.ui.menu
		$(opts.menu.selector).menu({
			create: function(event, ui){
				tree.menu.data.$menu = $(this).menu("widget");
				var data = $.extend({}, tree.menu.data);
				opts.menu.create.call(tree, event, data);
			},
			focus: function(event, ui){
				var data = $.extend({}, tree.menu.data, {
					menuItem: ui.item,
					menuId: ui.item.find(">a").attr("href")
				});
				opts.menu.focus.call(tree, event, data);
			},
			select: function(event, ui){
				var data = $.extend({}, tree.menu.data, {
					menuItem: ui.item,
					menuId: ui.item.find(">a").attr("href")
				});
				if( opts.menu.select.call(tree, event, data) !== false){
					tree.menu._closeMenu(ctx);
				}
			}
		}).hide();
	},
	treeDestroy: function(ctx){
		this._super(ctx);
	},
	_openMenu: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			$menu = $(opts.menu.selector);

		tree.menu.data.node = ctx.node;
		var data = $.extend({}, tree.menu.data);

		if( opts.menu.beforeOpen.call(tree, ctx.orgEvent, data) === false){
			return;
		}

		$(document).bind("keydown.fancytree", function(event){
			if( event.which === $.ui.keyCode.ESCAPE ){
				tree.menu._closeMenu(ctx);
			}
		}).bind("mousedown.fancytree", function(event){
			// Close menu when clicked outside menu
			if( $(event.target).closest(".ui-menu-item").length === 0 ){
				tree.menu._closeMenu(ctx);
			}
		});
//        $menu.position($.extend({my: "left top", at: "left bottom", of: event}, opts.menu.position));
		$menu
			.css("position", "absolute")
			.show()
			.position({my: "left top", at: "right top", of: ctx.orgEvent, collision: "fit"})
			.focus();

		opts.menu.open.call(tree, ctx.orgEvent, data);
	},
	_closeMenu: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			data = $.extend({}, tree.menu.data);
		if( opts.menu.close.call(tree, ctx.orgEvent, data) === false){
			return;
		}
		var $menu = $(opts.menu.selector);
		$(document).unbind("keydown.fancytree, mousedown.fancytree");
		$menu.hide();
		tree.menu.data.node = null;
	}
//	,
//	nodeClick: function(ctx) {
//		var event = ctx.orgEvent;
//		if(event.which === 2 || (event.which === 1 && event.ctrlKey)){
//			event.preventDefault();
//			ctx.tree.menu._openMenu(ctx);
//			return false;
//		}
//		this._super(ctx);
//	}
});
}(jQuery));
