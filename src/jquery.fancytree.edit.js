/*************************************************************************
	jquery.fancytree.edit.js
	Table extension for jquery.fancytree.js.

	Copyright (c) 2013, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/fancytree/wiki/LicenseInfo

	A current version and some documentation is available at
		https://github.com/mar10/fancytree/
*************************************************************************/

;(function($, window, document, undefined) {

"use strict";


/*******************************************************************************
 * Private functions and variables
 */

// function _escapeRegex(str){
// 	/*jshint regexdash:true */
// 	return (str + "").replace(/([.?*+\^\$\[\]\\(){}|-])/g, "\\$1");
// }

var isMac = /Mac/.test(navigator.platform);

/**
 * Start inline editing of current node title.
 *
 * @lends FancytreeNode.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeNodeClass.prototype.startEdit = function(){
	// this: tree
	var prevTitle = this.title,
		node = this,
		tree = this.tree;
	// Disable standard Fancytree mouse- and key handling
	tree.widget._unbind();
	// Replace node with <input>
	$(".fancytree-title", node.span)
		.html("<input id='editNode' value='" + prevTitle + "'>");
	$.ui.fancytree.assert(!tree.edit.currentNode, "recursive edit");
	tree.edit.currentNode = this;
	// Focus <input> and bind keyboard handler
	$("input#editNode")
		.focus()
		.keydown(function(event){
			switch( event.which ) {
			case 27: // [esc]
				// discard changes on [esc]
				$("input#editNode").val(prevTitle);
				$(this).blur();
				break;
			case 13: // [enter]
				// simulate blur to accept new value
				$(this).blur();
				break;
			}
		}).blur(function(event){
			// Accept new value, when user leaves <input>
			var title = $("input#editNode").val();
			node.setTitle(title);
			// Re-enable mouse and keyboard handlling
			tree.widget._bind();
			tree.edit.currentNode = null;
			node.setFocus();
		});
};


/**
 * Start inline editing of current node title.
 *
 * @lends Fancytree.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeClass.prototype.isEditing = function(){
	return this.edit.currentNode;
};


/**
 * Check if this node is in edit mode.
 *
 * @lends FancytreeNode.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeNodeClass.prototype.isEditing = function(){
	return this.tree.isEditing() === this;
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("edit", {
	version: "0.0.1",
	// Default options for this extension.
	options: {
		beforeEdit: $.noop,
		edit: $.noop
	},
	// Override virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		ctx.tree.$container.addClass("fancytree-ext-edit");
		ctx.tree.edit.currentNode = null;
	},
	nodeClick: function(ctx) {
		if( ctx.originalEvent.shiftKey ){
			ctx.node.startEdit();
			return false;
		}
		this._super(ctx);
	},
	nodeDblclick: function(ctx) {
		ctx.node.startEdit();
		return false;
	},
	nodeKeydown: function(ctx) {
		switch( ctx.originalEvent.which ) {
		case 113: // [F2]
			ctx.node.startEdit();
			return false;
		case 13: // [enter]
			if( isMac ){
				ctx.node.startEdit();
				return false;
			}
		}
		this._super(ctx);
	}
});
}(jQuery, window, document));
