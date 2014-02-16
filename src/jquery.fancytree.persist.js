/*!
 * jquery.fancytree.persist.js
 *
 * Persist tree status in cookiesRemove or highlight tree nodes, based on a filter.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * @depends: jquery.cookie.js
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
 *     $("#tree").fancytree("getTree").clearCookies("active expanded focus selected");
 *
 * @lends Fancytree.prototype
 * @requires jquery.fancytree.persist.js
 */
$.ui.fancytree._FancytreeClass.prototype.clearCookies = function(types){
	var inst = this.ext.persist,
		cookiePrefix = inst.cookiePrefix;

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


/**
* Return persistence information from cookies
*
* Called like
*     $("#tree").fancytree("getTree").getPersistData();
*
* @lends Fancytree.prototype
* @requires jquery.fancytree.persist.js
*/
$.ui.fancytree._FancytreeClass.prototype.getPersistData = function(){
	var inst = this.ext.persist,
		instOpts= this.options.persist,
		delim = instOpts.cookieDelimiter,
		res = {};

	res[ACTIVE] = $.cookie(inst.cookiePrefix + ACTIVE);
	res[EXPANDED] = ($.cookie(inst.cookiePrefix + EXPANDED) || "").split(delim);
	res[SELECTED] = ($.cookie(inst.cookiePrefix + SELECTED) || "").split(delim);
	res[FOCUS] = $.cookie(inst.cookiePrefix + FOCUS);
};


/* *****************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "persist",
	version: "0.1.0",
	// Default options for this extension.
	options: {
//		appendRequestInfo: false,
		cookieDelimiter: "~",
		cookiePrefix: undefined, // 'fancytree-<treeId>-' by default
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

	/* Append `key` to a cookie. */
	_setKey: function(type, key, flag){
		key = "" + key; // #90
		var instData = this._local,
			instOpts = this.options.persist,
			cookieName = instData.cookiePrefix + type,
			cookie = $.cookie(cookieName),
			cookieList = cookie ? cookie.split(instOpts.cookieDelimiter) : [],
			idx = $.inArray(key, cookieList);
		// Remove, even if we add a key,  so the key is always the last entry
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
	// `this`       : is this Fancytree object
	// `this._super`: the virtual function that was overridden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			instData = this._local,
			instOpts = this.options.persist;

		_assert($.cookie, "Missing required plugin for 'persist' extension: jquery.cookie.js");

		instData.cookiePrefix = instOpts.cookiePrefix || ("fancytree-" + tree._id + "-");
		instData.storeActive = instOpts.types.indexOf(ACTIVE) >= 0;
		instData.storeExpanded = instOpts.types.indexOf(EXPANDED) >= 0;
		instData.storeSelected = instOpts.types.indexOf(SELECTED) >= 0;
		instData.storeFocus = instOpts.types.indexOf(FOCUS) >= 0;

		// Bind init-handler to apply cookie state
		tree.$div.bind("fancytreeinit", function(e){
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
	nodeSetActive: function(ctx, flag, opts) {
		var instData = this._local,
			instOpts = this.options.persist;

		this._super(ctx, flag, opts);

		if(instData.storeActive){
			$.cookie(instData.cookiePrefix + ACTIVE,
					 this.activeNode ? this.activeNode.key : null,
					 instOpts.cookie);
		}
	},
	nodeSetExpanded: function(ctx, flag, opts) {
		var res,
			node = ctx.node,
			instData = this._local;

		res = this._super(ctx, flag, opts);

		if(instData.storeExpanded){
			instData._setKey(EXPANDED, node.key, flag);
		}
		return res;
	},
	nodeSetFocus: function(ctx) {
		var instData = this._local,
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
			instData = this._local;

		this._super(ctx, flag);

		if(instData.storeSelected){
			instData._setKey(SELECTED, node.key, flag);
		}
	}
});
}(jQuery, window, document));
