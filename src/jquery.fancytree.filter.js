/*!
 * jquery.fancytree.filter.js
 *
 * Remove or highlight tree nodes, based on a filter.
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

function _escapeRegex(str){
	/*jshint regexdash:true */
	return (str + "").replace(/([.?*+\^\$\[\]\\(){}|-])/g, "\\$1");
}


/**
 * Dimm or hide nodes.
 *
 * @param {function | string} filter
 * @returns {integer} count
 * @lends Fancytree.prototype
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.applyFilter = function(filter){
	var match, re,
		count = 0;
	// Reset current filter
	this.visit(function(node){
		delete node.match;
		delete node.subMatch;
	});

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
	this.visit(function(node){
		if(filter(node)){
			count++;
			node.match = true;
			node.visitParents(function(p){
				p.subMatch = true;
			});
		}
	});
	this.render();
	return count;
};

/**
 * Reset the filter.
 *
 * @lends Fancytree.prototype
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.clearFilter = function(){
	this.visit(function(node){
		delete node.match;
		delete node.subMatch;
		$(node.li).show();
	});

	this.enableFilter = false;
	this.render();
	this.$div.removeClass("fancytree-ext-filter");
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("filter", {
	version: "0.0.1",
	// Default options for this extension.
	options: {
		mode: "dimm"
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
		var visible,
			node = ctx.node,
			opts = ctx.options,
			tree = ctx.tree,
			$span = $(node[tree.statusClassPropName]);

		if(!$span.length){
			return; // nothing to do, if node was not yet rendered
		}
		this._super(ctx);
		if(!tree.enableFilter){
			return;
		}
		if( node.match ){
			$span.addClass("fancytree-match");
		}else{
			$span.removeClass("fancytree-match");
		}
		if( node.subMatch ){
			$span.addClass("fancytree-submatch");
		}else{
			$span.removeClass("fancytree-submatch");
		}
		if(opts.filter.mode === "hide"){
			visible = !!(node.match || node.subMatch);
			node.debug(node.title + ": visible=" + visible);
			$(node.li).toggle(visible);
		}
	}
});
}(jQuery, window, document));
