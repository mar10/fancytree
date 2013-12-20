/*!
 * jquery.fancytree.edit.js
 *
 * Make node titles editable.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2013, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version DEVELOPMENT
 * @date DEVELOPMENT
 */

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
		instOpts = tree.options.edit,
//		triggerCancel = instOpts.triggerCancel,
		$title = $(".fancytree-title", node.span),
		eventData = {node: node, tree: tree, options: tree.options};

	if( instOpts.beforeEdit.call(node, {type: "beforeEdit"}, eventData) === false){
		return false;
	}
//	tree._triggerNodeEvent("beforeEdit", node, null, {});
	node.debug("startEdit");
	// if( tree._trigger)
	// Disable standard Fancytree mouse- and key handling
	tree.widget._unbind();

	// Replace node with <input>
	$input = $("<input />", {
		"class": "fancytree-edit-input",
		value: prevTitle
	});
	if ( instOpts.adjustWidthOfs != null ) {
		$input.width($title.width() + instOpts.adjustWidthOfs);
	}
	if ( instOpts.inputCss != null ) {
		$input.css(instOpts.inputCss);
	}
	eventData.input = $input;

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
				node.endEdit(false, event);
				break;
			case $.ui.keyCode.ENTER:
				node.endEdit(true, event);
				return false; // so we don't start editmode on Mac
			}
		}).blur(function(event){
			return node.endEdit(true, event);
		});

	instOpts.edit.call(node, {type: "edit"}, eventData);
};


/**
 * Stop inline editing.
 * @param {Boolean} [applyChanges=false]
 * @lends FancytreeNode.prototype
 * @requires jquery.fancytree.edit.js
 */
$.ui.fancytree._FancytreeNodeClass.prototype.endEdit = function(applyChanges, _event){
	var node = this,
		tree = this.tree,
		local = tree.ext.edit,
		instOpts = tree.options.edit,
		$title = $(".fancytree-title", node.span),
		$input = $title.find("input.fancytree-edit-input"),
		newVal = $input.val(),
		dirty = $input.hasClass("fancytree-edit-dirty"),
		doSave = (applyChanges || (dirty && applyChanges !== false)) && (newVal !== node.title),
		eventData = {
			node: node, tree: tree, options: tree.options, originalEvent: _event,
			dirty: dirty,
			save: doSave,
			input: $input,
			value: newVal
			};

	if( instOpts.beforeClose.call(node, {type: "beforeClose"}, eventData) === false){
		return false;
	}
	if( doSave && instOpts.save.call(node, {type: "save"}, eventData) === false){
		return false;
	}
	$input
		.removeClass("fancytree-edit-dirty")
		.unbind();

	if( doSave ) {
		node.setTitle( newVal );
	}else{
		node.renderTitle();
	}
	// Re-enable mouse and keyboard handling
	tree.widget._bind();
	local.currentNode = null;
	node.setFocus();
	eventData.input = null;
	instOpts.close.call(node, {type: "close"}, eventData);
	return true;
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
		adjustWidthOfs: 4,   // null: don't adjust input size to content
		inputCss: {minWidth: "3em"},
		triggerCancel: ["esc", "tab", "click"],
		triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
		beforeClose: $.noop, // Return false to prevent cancel/save (data.input is available)
		beforeEdit: $.noop,  // Return false to prevent edit mode
		close: $.noop,       // Editor was removed
		edit: $.noop,        // Editor was opened (available as data.input)
//		keypress: $.noop,    // Not yet implemented
		save: $.noop         // Save data.input.val() or return false to keep editor open
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
		if( $.inArray("shift+click", ctx.options.edit.triggerStart) >= 0 ){
			if( ctx.originalEvent.shiftKey ){
				ctx.node.startEdit();
				return false;
			}
		}
		this._super(ctx);
	},
	nodeDblclick: function(ctx) {
		if( $.inArray("dblclick", ctx.options.edit.triggerStart) >= 0 ){
			ctx.node.startEdit();
		}
		return false;
	},
	nodeKeydown: function(ctx) {
		switch( ctx.originalEvent.which ) {
		case 113: // [F2]
			if( $.inArray("f2", ctx.options.edit.triggerStart) >= 0 ){
				ctx.node.startEdit();
				return false;
			}
			break;
		case $.ui.keyCode.ENTER:
			if( $.inArray("mac+enter", ctx.options.edit.triggerStart) >= 0 && isMac ){
				ctx.node.startEdit();
				return false;
			}
			break;
		}
		this._super(ctx);
	}
});
}(jQuery, window, document));
