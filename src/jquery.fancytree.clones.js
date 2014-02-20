/*!
 * jquery.fancytree.clones.js
 *
 * Support faster lookup of nodes by key and shared ref-ids.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2014, Martin Wendt (http://wwWendt.de)
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
function _assert(cond, msg){
	// TODO: see qunit.js extractStacktrace()
	if(!cond){
		msg = msg ? ": " + msg : "";
		$.error("Assertion failed" + msg);
	}
}


/* Return first occurrence of member from array. */
function _removeArrayMember(arr, elem) {
	// TODO: use Array.indexOf for IE >= 9
	var i;
	for (i = arr.length - 1; i >= 0; i--) {
		if (arr[i] === elem) {
			arr.splice(i, 1);
			return true;
		}
	}
	return false;
}


/**
 * [ext-clones] Return a list of clone-nodes or null.
 * @param {Boolean} [includeSelf=false]
 * @requires jquery.fancytree.clones.js
 * @returns {FancytreeNode[] | null}
 */
$.ui.fancytree._FancytreeNodeClass.prototype.clonesFind = function(includeSelf){
	var key,
		node = this,
		tree = this.tree,
		refList = tree.refMap[node.data.refKey] || null;

	if( refList ) {
		// always return a copy!
		key = node.key;
		refList = includeSelf ? refList.slice(0) : $.map(refList, function(val){ return val === key ? null : val;	});
			//_removeArrayMember(refList, node.key);
	}
	return refList;
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "clones",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		highlightClones: false   //
	},

	treeCreate: function(ctx){
		this._super(ctx);
//		this.$container.addClass("fancytree-ext-clones");
		ctx.tree.refMap = {};
		ctx.tree.keyMap = {};
	},
	treeRegisterNode: function(ctx, add, node) {
		var refList, len,
//			opts = ctx.options.clones,
			tree = ctx.tree,
			keyMap = tree.keyMap,
			refMap = tree.refMap,
			key = node.key,
			refKey = (node && node.data.refKey != null) ? "" + node.data.refKey : null;

//		ctx.tree.debug("treeRegisterNode", add, node);

		if( key === "_statusNode" ){
			return this._super(ctx, add, node);
		}

		if( add ) {
			if( keyMap[node.key] != null ) {
				$.error("treeRegisterNode: node.key already exists: " + node.key);
			}
			keyMap[key] = node;
			if( refKey ) {
				if( refMap[refKey] ) {
					refMap[refKey].push(key);
				} else {
					refMap[refKey] = [key];
				}
				node.debug("treeRegisterNode: add clone =>", refMap[refKey]);
			}
		}else {
			if( keyMap[key] == null ) {
				$.error("treeRegisterNode: node.key not registered: " + node.key);
			}
			delete keyMap[key];
			if( refKey ) {
				refList = refMap[refKey];
				if( refList ) {
					len = refList.length;
					if( len <= 2 ){
						_assert(len === 2);
						_assert(refList[0] === key || refList[1] === key);
						delete refMap[refKey];
					}else{
						_removeArrayMember(refList, refKey);
					}
					node.debug("treeRegisterNode: remove clone =>", refMap[refKey]);
				}
			}
		}
		return this._super(ctx, add, node);
	}
});
}(jQuery, window, document));
