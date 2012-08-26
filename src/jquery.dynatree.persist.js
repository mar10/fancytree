/*!
 * jquery.dynatree.persist.js
 * Persistence extension for jquery.dynatree.js (http://dynatree.googlecode.com/).
 * 
 * Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/dynatree/wiki/LicenseInfo
 */
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

var ACTIVE = "active",
	EXPANDED = "expanded",
	FOCUS = "focus",
	SELECTED = "selected";

/**
 * 
 * Called like 
 *     $("#tree").dynatree("getTree").clearCookies("active expanded focus selected");
 * 
 * @lends Dynatree.prototype
 * @requires jquery.dynatree.persist.js
 */
$.ui.dynatree._DynatreeClass.prototype.clearCookies = function(types){
	var cookiePrefix = this.persist.cookiePrefix;
	types = types || "active expanded focus selected";
	// TODO: optimize
	if(types.indexOf(ACTIVE) >= 0){
		$.cookie(cookiePrefix + ACTIVE, null);
	}
	if(types.indexOf(EXPANDED) >= 0){
		$.cookie(cookiePrefix + EXPANDED, null);
	}
	if(types.indexOf(FOCUS) >= 0){
		$.cookie(cookiePrefix + FOCUS, null);
	}
	if(types.indexOf(SELECTED) >= 0){
		$.cookie(cookiePrefix + SELECTED, null);
	}
};


/* TODO:
DynaTreeStatus._getTreePersistData = function(cookieId, cookieOpts) {
	// Static member: Return persistence information from cookies
	var ts = new DynaTreeStatus(cookieId, cookieOpts);
	ts.read();
	return ts.toDict();
};
*/

/*******************************************************************************
 * Extension code
 */
$.ui.dynatree.registerExtension("persist", {
	// Default options for this extension.
	options: {
		cookieDelimiter: "~",
		cookiePrefix: undefined, // 'dynatree-<treeId>-' by default 
		cookie: {
			raw: false,
			expires: "",
			path: "",
			domain: "",
			secure: false
		},
		overrideSource: false,  // true: cookie takes precedence over `source` data attributes.
		types: "active expanded focus selected"
	},
	
	/**Append `key` to a cookie. */
	_setKey: function(type, key, flag){
		var instData = this.persist,
		    instOpts = this.options.persist,
		    cookieName = instData.cookiePrefix + type,
		    cookie = $.cookie(cookieName),
			cookieList = cookie ? cookie.split(instOpts.cookieDelimiter) : [];
		// Remove, even if we add a key,  so the key is always the last entry
		var idx = $.inArray(key, cookieList); 
		if(idx >= 0){
			cookieList.splice(idx, 1);
		}
		// Append key to cookie
		if(flag){
			cookieList.push(key);
		}
		$.cookie(cookieName, cookieList.join(instOpts.cookieDelimiter), instOpts.cookie);
	},
	// Overide virtual methods for this extension.
	// `this`       : is this Dynatree object
	// `this._super`: the virtual function that was overridden (member of prev. extension or Dynatree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			instData = this.persist,
		    instOpts = this.options.persist;

		_assert($.cookie, "Missing required plugin for 'persist' extension: jquery.cookie.js");

		instData.cookiePrefix = instOpts.cookiePrefix || "dynatree-" + tree._id + "-";
		instData.storeActive = instOpts.types.indexOf(ACTIVE) >= 0;
		instData.storeExpanded = instOpts.types.indexOf(EXPANDED) >= 0;
		instData.storeSelected = instOpts.types.indexOf(SELECTED) >= 0;
		instData.storeFocus = instOpts.types.indexOf(FOCUS) >= 0;
		
		// Bind init-handler to apply cookie state
		tree.$div.bind("dynatreeinit", function(e){
			var cookie,
				keyList,
				i,
				prevFocus = $.cookie(instData.cookiePrefix + FOCUS), // record this before node.setActive() overrides it
				node;

			tree.debug("COOKIE " + document.cookie);
			
			if(instData.storeExpanded){
				cookie = $.cookie(instData.cookiePrefix + EXPANDED);
				if(cookie){
					keyList = cookie.split(instOpts.cookieDelimiter);
					for(i=0; i<keyList.length; i++){
						node = tree.getNodeByKey(keyList[i]);
						if(node){
							if(node.expanded === undefined || instOpts.overrideSource && (node.expanded === false)){
//								node.setExpanded();
								node.expanded = true;
								node.render();
							}
						}else{
							// node is no longer member of the tree: remove from cookie
							instData._setKey(EXPANDED, keyList[i], false);
						}
					}
			    }
			}
			if(instData.storeSelected){
				cookie = $.cookie(instData.cookiePrefix + SELECTED);
				if(cookie){
					keyList = cookie.split(instOpts.cookieDelimiter);
					for(i=0; i<keyList.length; i++){
						node = tree.getNodeByKey(keyList[i]);
						if(node){
							if(node.selected === undefined || instOpts.overrideSource && (node.selected === false)){
//								node.setSelected();
								node.selected = true;
								node.renderStatus();
							}
						}else{
							// node is no longer member of the tree: remove from cookie also
							instData._setKey(SELECTED, keyList[i], false);
						}
					}
			    }
			}
			if(instData.storeActive){
				cookie = $.cookie(instData.cookiePrefix + ACTIVE);
				if(cookie && (opts.persist.overrideSource || !tree.activeNode)){
					node = tree.getNodeByKey(cookie);
					if(node){
						node.setActive();
					}
				}
			}
			if(instData.storeFocus && prevFocus){
				node = tree.getNodeByKey(prevFocus);
				if(node){
					node.setFocus();
				}
			}
		});
		// Init the tree
		this._super(ctx);
	},
//	treeDestroy: function(ctx){
//		this._super(ctx);
//	},
	nodeSetActive: function(ctx, flag) {
		var instData = this.persist,
		    instOpts = this.options.persist;
		this._super(ctx, flag);
		if(instData.storeActive){
			$.cookie(instData.cookiePrefix + ACTIVE, 
					 this.activeNode ? this.activeNode.key : null, 
					 instOpts.cookie);
		}
	},
	nodeSetExpanded: function(ctx, flag) {
		var node = ctx.node,
			instData = this.persist;
		
		this._super(ctx, flag);
		
		if(instData.storeExpanded){
			instData._setKey(EXPANDED, node.key, flag);
		}
	},
	nodeSetFocus: function(ctx) {
		var instData = this.persist,
		    instOpts = this.options.persist;
		
		this._super(ctx);
		
		if(instData.storeFocus){
			$.cookie(this.cookiePrefix + FOCUS, 
					 this.focusNode ? this.focusNode.key : null, 
					 instOpts.cookie);
		}
	},
	nodeSetSelected: function(ctx, flag) {
		var node = ctx.node,
			instData = this.persist;
		
		this._super(ctx, flag);
		
		if(instData.storeSelected){
			instData._setKey(SELECTED, node.key, flag);
		}
	}
});
}(jQuery));
