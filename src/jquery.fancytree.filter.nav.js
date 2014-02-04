/*!
 * jquery.fancytree.filter.nav.js
 *
 * Skip hidden filtered nodes during keyboard navigation.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 * Expects extension filter to be active.
 *
 * Copyright (c) 2014, Wolfgang Scherer (https://github.com/wolfmanx)
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
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "filter_nav",
	version: "0.0.1",
	// Default options for this extension.
	options: {},
	// Override virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		// ctx.tree.filter = false;
	},
	treeDestroy: function(ctx){
		this._super(ctx);
	},
	// skip filtered hidden nodes for UP/DOWN
	nodeKeydown: function(ctx) {
		var res,
			event = ctx.originalEvent,
			node = ctx.node,
			// tree = ctx.tree,
			opts = ctx.options,
			KC = $.ui.keyCode,
			activate = !(event.ctrlKey || !opts.autoActivate ),
			handled = false,
			replaced = null,
			parents, sib, visible, i;

		// replicated from FancytreeNode.navigate
		function _goto(n){
			if( n ){
				n.makeVisible();
				return activate === false ? n.setFocus() : n.setActive();
			}
		}

		if (node && this.enableFilter && opts.filter.mode === "hide") {
			handled = true;
			switch( event.which ) {
			// charCodes:
			case KC.LEFT:
				if( node.expanded ) {
					node.setExpanded(false);
					_goto(node);
				} else {
					while (node.parent && node.parent.parent) {
						node = node.parent;
						visible = node && !!(node.match || node.subMatch);
						if (visible) {
							break;
						}
					}
					_goto(node);
				}
				break;
			case KC.RIGHT:
				if( !node.expanded && (node.children || node.lazy) ) {
					node.setExpanded();
					_goto(node);
				} else if( node.children && node.children.length ) {
					$.each(node.children, function (i, n) {
						visible = n && !!(n.match || n.subMatch);
						if (visible) {
							node = n;
							return false;
						}
					});
					_goto(node);
				}
				break;
			case KC.UP:
				while (node) {
					sib = node.getPrevSibling();
					while( sib && sib.expanded && sib.children && sib.children.length ){
						sib = sib.children[sib.children.length - 1];
					}
					if( !sib && node.parent && node.parent.parent ){
						sib = node.parent;
					}
					node = sib;
					visible = node && !!(node.match || node.subMatch);
					if (visible) {
						break;
					}
				}
				_goto(node);
				break;
			case KC.DOWN:
				while (node) {
					if( node.expanded && node.children && node.children.length ) {
						sib = node.children[0];
					} else {
						parents = node.getParentList(false, true);
						for(i=parents.length-1; i>=0; i--) {
							sib = parents[i].getNextSibling();
							if( sib ){ break; }
						}
					}
					node = sib;
					visible = node && !!(node.match || node.subMatch);
					if (visible) {
						break;
					}
				}
				_goto(node);
				break;
			default:
				handled = false;
			}
		}
		if (handled) {
			event.preventDefault();
		} else {
			res = this._super(ctx);
		}
		// currently inactive
		if (replaced !== null) {
			// console.log('replaced:', replaced, 'with', event.which);
			event.which = replaced;
		}
		return res;
	}
});
}(jQuery, window, document));
