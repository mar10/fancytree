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
	var $input,
		node = this,
		tree = this.tree,
		local = tree.ext.edit,
		prevTitle = node.title,
		$title = $(".fancytree-title", node.span);

	node.debug("startEdit");
	// if( tree._trigger)
	// Disable standard Fancytree mouse- and key handling
	tree.widget._unbind();

	// Replace node with <input>
	$input = $("<input>", {
		"class": "fancytree-edit-input",
		value: prevTitle

	}).width($title.width());
	$title.html($input);

	$.ui.fancytree.assert(!local.currentNode, "recursive edit");
	local.currentNode = this;
	// Focus <input> and bind keyboard handler
	$input
		.focus()
		.change(function(event){
			$input.addClass("fancytree-edit-dirty");
		}).keydown(function(event){
			switch( event.which ) {
			case $.ui.keyCode.ESCAPE:
				node.endEdit(false);
				break;
			case $.ui.keyCode.ENTER:
				node.endEdit(true);
				return false; // so we don't start editmode on Mac
			}
		}).blur(function(event){
			node.endEdit(true);
		});
};


/**
 * Stop inline editing.
 * @param {Boolean} [applyChanges=false]
 * @lends FancytreeNode.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeNodeClass.prototype.endEdit = function(applyChanges){
	var node = this,
		tree = this.tree,
		local = tree.ext.edit,
		$title = $(".fancytree-title", node.span),
		$input = $title.find("input.fancytree-edit-input"),
		dirty = $input.hasClass("fancytree-edit-dirty");

	node.debug("endEdit");
	$input
		.removeClass("fancytree-edit-dirty")
		.unbind();

	if( applyChanges || (dirty && applyChanges !== false) ){
		node.setTitle( $input.val() );
	}else{
		node.renderTitle();
	}
	// Re-enable mouse and keyboard handlling
	tree.widget._bind();
	local.currentNode = null;
	node.setFocus();
};


/**
 * Check if any node in this tree  in edit mode.
 *
 * @returns {FancytreeNode | null}
 * @lends Fancytree.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeClass.prototype.isEditing = function(){
	return this.ext.edit.currentNode;
};


/**
 * Check if this node is in edit mode.
 * @returns {Boolean} true if node is currently beeing edited
 * @lends FancytreeNode.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeNodeClass.prototype.isEditing = function(){
	return this.tree.ext.edit.currentNode === this;
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("edit", {
	version: "0.0.1",
	// Default options for this extension.
	options: {
		startKeys: [],
		beforeEdit: $.noop, //
		edit: $.noop //
	},
	// Local attributes
	currentNode: null,

	// Override virtual methods for this extension.
	// `this`       : the Fancytree instance
	// `this._local`: the namespace that contains extension attributes and private methods (same as this.ext.EXTNAME)
	// `this._super`: the virtual function that was overridden (member of previous extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		this.$container.addClass("fancytree-ext-edit");
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
		case $.ui.keyCode.ENTER:
			if( isMac ){
				ctx.node.startEdit();
				return false;
			}
			break;
		}
		this._super(ctx);
	}
});
}(jQuery, window, document));
