/*!
 * jquery.fancytree.filter.js
 *
 * Remove or highlight tree nodes, based on a filter.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2014, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";


/*******************************************************************************
 * Private functions and variables
 */

function _escapeRegex(str){
	/*jshint regexdash:true */
	return (str + "").replace(/([.?*+\^\$\[\]\\(){}|-])/g, "\\$1");
}

/* EXT-TABLE: Show/hide all rows that are structural descendants of `parent`. */
// function setChildRowVisibility(parent, flag) {
// 	parent.visit(function(node){
// 		var tr = node.tr;
// 		if(tr){
// 			tr.style.display = flag ? "" : "none";
// 		}
// 		node.debug(flag ? "SHOW" : "HIDE");
// 		if(!node.expanded){
// 			return "skip";
// 		}
// 	});
// }

/**
 * [ext-filter] Dimm or hide nodes.
 *
 * @param {function | string} filter
 * @returns {integer} count
 * @alias Fancytree#applyFilter
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.applyFilter = function(filter){
	var match, re,
		count = 0,
		leavesOnly = this.options.filter.leavesOnly;

	// Default to 'match title substring (not case sensitive)'
	if(typeof filter === "string"){
		match = _escapeRegex(filter); // make sure a '.' is treated literally
		re = new RegExp(".*" + match + ".*", "i");
		filter = function(node){
			return !!re.exec(node.title);
		};
	}

	this.enableFilter = true;
	this.$div.addClass("fancytree-ext-filter");
	if( this.options.filter.mode === "hide"){
		this.$div.addClass("fancytree-ext-filter-hide");
	} else {
		this.$div.addClass("fancytree-ext-filter-dimm");
	}
	// Reset current filter
	this.visit(function(node){
		node.hide = true;
		delete node.match;
		delete node.subMatch;
	});
	// Adjust node.hide, .match, .subMatch flags
	this.visit(function(node){
		if ((!leavesOnly || node.children == null) && filter(node)) {
			count++;
			node.hide = false;
			node.match = true;
			node.visitParents(function(p){
				p.hide = false;
				p.subMatch = true;
			});
		}
	});
	// Redraw
	this.render();
	return count;
};

/**
 * [ext-filter] Reset the filter.
 *
 * @alias Fancytree#applyFilter
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.clearFilter = function(){
	this.visit(function(node){
		delete node.hide;
		delete node.match;
		delete node.subMatch;
	});
	this.enableFilter = false;
	this.$div.removeClass("fancytree-ext-filter fancytree-ext-filter-dimm fancytree-ext-filter-hide");
	this.render();
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "filter",
	version: "0.0.2",
	// Default options for this extension.
	options: {
		mode: "dimm",
		leavesOnly: false
	},
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
	nodeRenderStatus: function(ctx) {
		// Set classes for current status
		var res,
			node = ctx.node,
			tree = ctx.tree,
			$span = $(node[tree.statusClassPropName]);

		res = this._super(ctx);

		if(!$span.length){
			return res; // nothing to do, if node was not yet rendered
		}
		if(!tree.enableFilter){
			return res;
		}
		$span.toggleClass("fancytree-match", !!node.match);
		$span.toggleClass("fancytree-submatch", !!node.subMatch);
		$span.toggleClass("fancytree-hide", !!node.hide);

		// if(opts.filter.mode === "hide"){
		// 	// visible = !!(node.match || node.subMatch);
		// 	visible = !node.hide;
		// 	node.debug(node.title + ": visible=" + visible);
		// 	if( node.li ) {
		// 		$(node.li).toggle(visible);
		// 	} else if( node.tr ) {
		// 		// Show/hide all rows that are structural descendants of `parent`
		// 		$(node.tr).toggle(visible);
		// 		// if( !visible ) {
		// 		// 	setChildRowVisibility(node, visible);
		// 		// }
		// 	}
		// }
		return res;
	}
});
}(jQuery, window, document));
