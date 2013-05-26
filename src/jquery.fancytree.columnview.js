/*******************************************************************************
	jquery.fancytree.columnview.js
	Table extension for jquery.fancytree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/fancytree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://fancytree.googlecode.com/

*******************************************************************************/

;(function($, window, document, undefined) {

"use strict";

// prevent duplicate loading
// if ( $.ui.fancytree && $.ui.fancytree.version ) {
//     $.ui.fancytree.warn("Fancytree: duplicate include");
//     return;
// }


/*******************************************************************************
 * Private functions and variables
 */
/*
function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}
*/

/*******************************************************************************
 * Private functions and variables
 */
$.ui.fancytree.registerExtension("columnview", {
	// Default options for this extension.
	options: {
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			$table = tree.widget.element;
		tree.tr = $("tbody tr", $table)[0];
		tree.columnCount = $(">td", tree.tr).length;
		// Perform default behavior
		this._super(ctx);
		// Standard Fancytree created a root <ul>. Now move this into first table cell
		var $ul = $(tree.rootNode.ul),
			$tdFirst = $(">td", tree.tr).eq(0);

		$ul.removeClass("fancytree-container");
		$ul.removeAttr("tabindex");
		tree.$container = $table;
		$table.addClass("fancytree-container fancytree-ext-columnview");
		$table.attr("tabindex", "0");

		$tdFirst.empty();
		$ul.detach().appendTo($tdFirst);

		// Force some required options
		tree.widget.options.autoCollapse = true;
//      tree.widget.options.autoActivate = true;
		tree.widget.options.fx = false;
		tree.widget.options.clickFolderMode = 1;

		// Make sure that only active path is expanded when a node is activated:
		$table.bind("fancytreeactivate", function(e, data){
			var node = data.node,
				tree = data.tree,
				level = node.getLevel(),
				i;
			tree._callHook("nodeCollapseSiblings", node);
			// Clear right neighbours
			if(level <= tree.columnCount){
				var tdList = $(">td", tree.tr);
				for(i=level; i<tree.columnCount; i++){
					tdList.eq(i).empty();
				}
			}
			// Expand nodes on activate, so we populate the right neighbor cell
			if(!node.expanded && (node.children || node.lazy)) {
				node.setExpanded();
			}
		// Adjust keyboard behaviour:
		}).bind("fancytreekeydown", function(e, data){
			var next = null;
			switch(e.which){
			case $.ui.keyCode.DOWN:
				next = data.node.getNextSibling();
				if( next ){
					next.setFocus();
				}
				return false;
			case $.ui.keyCode.LEFT:
				next = data.node.getParent();
				if( next ){
					next.setFocus();
				}
				return false;
			case $.ui.keyCode.UP:
				next = data.node.getPrevSibling();
				if( next ){
					next.setFocus();
				}
				return false;
			}
		});
	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		// Render standard nested <ul> - <li> hierarchy
		this._super(ctx, force, deep, collapsed, _recursive);
		// Remove expander and add a trailing triangle instead
		var tree = ctx.tree,
			node = ctx.node,
			$span = $(node.span);
		$span.find("span.fancytree-expander").remove();
		if(node.hasChildren() !== false && !$span.find("span.fancytree-cv-right").length){
			$span.append($("<span class='fancytree-icon fancytree-cv-right'>"));
		}
		// Move <ul> with children into the appropriate <td>
		if(node.ul){
			node.ul.style.display = ""; // might be hidden if RIGHT was pressed
			var level = node.getLevel();
			if(level < tree.columnCount){
				var $tdChild = $(">td", tree.tr).eq(level),
					$ul = $(node.ul).detach();
				$tdChild.empty().append($ul);
			}
		}
	}
});
}(jQuery, window, document));
