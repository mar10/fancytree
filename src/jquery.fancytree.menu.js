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


/*******************************************************************************
 * Private functions and variables
 */
function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}

/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("menu", {
	version: "1.0.0pre",
	// Default options for this extension.
	options: {
		enable: true,
		selector: null,  //
		position: {},    //
		create: $.noop,  //
		open: $.noop,    //
		select: $.noop,  //
		close: $.noop    //
	},
	// Override virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		ctx.options.filter = false;

		var opts = ctx.options,
			tree = ctx.tree,
			$menu = null,
			currentNode = null;
		// Use jquery.ui.menu / jquery.ui.popup
		// NOTE: The trigger option is not yet part of the official release!
		$(opts.menu.selector).menu({
			trigger: tree.$div,
			create: function(event, ui){
					$menu = $(this).menu("widget");
					var data = {
						tree: tree,
						menu: $menu
						};
//                    data.menu.position($.extend({my: "left top", at: "left bottom", of: event}, opts.menu.position));
					opts.menu.create.call(tree, event, data);
				},
			select: function(event, ui){
				var data = {
						tree: tree,
						node: currentNode,
						menu: $menu,
						menuItem: ui.item,
						menuId: ui.item.find(">a").attr("href")
						};
					opts.menu.select.call(tree, event, data);
				}
		}).bind("popupopen", function(event){
//            alert("pop on " + $.ui.fancytree.getNode(event.originalEvent));
			$menu.position($.extend({my: "left top", at: "left bottom", of: event}, opts.menu.position));
			currentNode = $.ui.fancytree.getNode(event.originalEvent);
			var data = {
					tree: tree,
					node: currentNode,
					menu: $menu
					};
			opts.menu.open.call(tree, event, data);
		}).bind("popupclose", function(event){
			var data = {
					tree: tree,
					menu: $menu
					};
			opts.menu.close.call(tree, event, data);
		});

	},
	treeDestroy: function(ctx){
		this._super(ctx);
	},
	nodeClick: function(ctx) {
		if($(".ui-menu").is(":visible")){
			return false;
		}
		this._super(ctx);
	}
});
}(jQuery));
