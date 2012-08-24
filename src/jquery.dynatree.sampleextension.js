/*!
 * jquery.dynatree.sampleextension.js
 * Sample extension for jquery.dynatree.js (http://dynatree.googlecode.com/).
 * 
 * Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *     http://code.google.com/p/dynatree/wiki/LicenseInfo
 */

(function($) {

"use strict";

// prevent duplicate loading
// if ( $.ui.dynatree && $.ui.dynatree.version ) {
//     $.ui.dynatree.warn("Dynatree: duplicate include");
//     return;
// }

/**
 * Sample function that extends the widget API. 
 * 
 * Called like 
 *     $("#tree").dynatree("fooBar", "mymode");
 *     
 * @lends Dynatree.prototype
 * @requires jquery.dynatree.sampleextension.js
 */
$.ui.dynatree._Dynatree.prototype.fooBar = function(mode){
	var tree = this,
	    treeOptions = tree.options,
	    extOptions = tree.options.sampleextension,
		color = extOptions.color;
	//...
};

/**
 * Extension code
 */
$.ui.dynatree.registerExtension("sampleextension", {
	/** @type String Optional version information */
	version: "1.0.0",
	/** Default options for this extension. */
	options: {
		color: "#001122", 
		types: "active expanded focus selected"
	},
	/** Local function. 
	 * 
	 * Local functions are prefixed with an underscore '_'.
	 */
	_setKey: function(type, key, flag){
		var cookieName = this.cookiePrefix + type,
			cookie = $.cookie(cookieName),
			cookieList = cookie ? cookie.split(this.delimiter) : [];
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Dynatree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			self = this;

		// TODO: use tree ID in cookie ID prefix by default
		this.delimiter = "";
		this.cookiePrefix = opts.persist.cookiePrefix || "dynatree-" + tree._id + "-";
		
		// Bind postinit-handler to apply cookie state
		tree.$div.bind("dynatreepostinit", function(e){
			var cookie,
				prevFocus = $.cookie(self.cookiePrefix + "focus"), // record this before we activate
				node;
			tree.debug("COOKIE " + document.cookie);
			if(self.storeFocus && prevFocus){
				node = tree.getNodeByKey(prevFocus);
				if(node){
					node.setFocus();
				}
			}
		});
		// Init the tree
		this._super(ctx);
	},
	/* Destroy this tree instance (we only call the default implementation, so 
	 * this method could as well be omitted). */
	treeDestroy: function(ctx){
		this._super(ctx);
	},
	nodeSetActive: function(ctx, flag) {
		this._super(ctx, flag);
		if(this.storeActive){
			$.cookie(this.cookiePrefix + "active", 
					ctx.tree.activeNode ? ctx.tree.activeNode.key : null, 
					this.cookieOpts);
		}
	},
	nodeSetSelected: function(ctx, flag) {
		this._super(ctx, flag);
		if(this.storeSelected){
			this._setKey("selected", ctx.node.key, flag);
		}
	}
});
}(jQuery));
