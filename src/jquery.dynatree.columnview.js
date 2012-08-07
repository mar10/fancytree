/*******************************************************************************
	jquery.dynatree.columnview.js
	Table extension for jquery.dynatree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/dynatree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://dynatree.googlecode.com/

*******************************************************************************/

// Start of local namespace
(function($) {

"use strict";

// prevent duplicate loading
// if ( $.ui.dynatree && $.ui.dynatree.version ) {
//     $.ui.dynatree.warn("Dynatree: duplicate include");
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
 * Private functions and variables
 */
$.ui.dynatree.registerExtension("columnview", {
	// Default options for this extension.
	options: {
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Dynatree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			$table = tree.$widget.element;
		tree.tr = $("tbody tr", $table)[0];
		tree.columnCount = $(">td", tree.tr).length;
		// Perform default behavior
		this._super(ctx);
		// Standard Dynatree created a root <ul>. Now move this into first table cell
		var $ul = $(tree.rootNode.ul),
//            tdList = $(">td", tree.tr).get(),
			$tdFirst = $(">td", tree.tr).eq(0);
		$ul.removeClass("dynatree-container");
		$table.addClass("dynatree-container dynatree-ext-columnview");
		$tdFirst.empty();
		$ul.detach().appendTo($tdFirst);

		// Force some required options
		tree.$widget.options.autoCollapse = true;
		tree.$widget.options.clickFolderMode = 1;

		// Make sure that only active path is expanded when a node is activated:
		$table.bind("dynatreeactivate", function(e, data){
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
		}).bind("dynatreekeydown", function(e, data){
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
		var tree = ctx.tree,
			node = ctx.node;
		// Render standard nested <ul> - <li> hierarchy
		this._super(ctx, force, deep, collapsed, _recursive);
		// Move <ul> with children into the appropriate <td>
		if(node.ul){
			var level = node.getLevel();
			if(level < tree.columnCount){
				var $tdChild = $(">td", tree.tr).eq(level),
					$ul = $(node.ul).detach();
				$tdChild.empty().append($ul);
			}
		}
	}
});
}(jQuery));
