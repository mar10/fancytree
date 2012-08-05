/*************************************************************************
	jquery.dynatree.persist.js
	Persistence extension for jquery.dynatree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/dynatree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://dynatree.googlecode.com/
		
@
*************************************************************************/

// Start of local namespace
(function($) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
// if ( $.ui.dynatree && $.ui.dynatree.version ) {
//     $.ui.dynatree.warn("Dynatree: duplicate include");
//     return;
// }


/*******************************************************************************
 * Private functions and variables
 */
function _raiseNotImplemented(msg){
	msg = msg || "";
	$.error("Not implemented: " + msg);
}

function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}

/*************************************************************************
 * class DynaTreeStatus
 * @class
 * @name DynaTreeStatus
 * @constructor
 */

 var DynaTreeStatus = function (cookieId, cookieOpts){
//		this._log("DynaTreeStatus: initialize");
	if( cookieId === undefined ){
		cookieId = $.ui.dynatree.prototype.options.cookieId;
	}
	cookieOpts = $.extend({}, $.ui.dynatree.prototype.options.cookie, cookieOpts);

	this.cookieId = cookieId;
	this.cookieOpts = cookieOpts;
	this.cookiesFound = undefined;
	this.activeKey = null;
	this.focusedKey = null;
	this.expandedKeyList = null;
	this.selectedKeyList = null;
 }


DynaTreeStatus._getTreePersistData = function(cookieId, cookieOpts) {
	// Static member: Return persistence information from cookies
	var ts = new DynaTreeStatus(cookieId, cookieOpts);
	ts.read();
	return ts.toDict();
};
// Make available in global scope
//getDynaTreePersistData = DynaTreeStatus._getTreePersistData; // TODO: deprecated


DynaTreeStatus.prototype = {
	// member functions
	read: function() {
//		this._log("DynaTreeStatus: read");
		// Read or init cookies.
		this.cookiesFound = false;

		var cookie = $.cookie(this.cookieId + "-active");
		this.activeKey = ( cookie === null ) ? "" : cookie;
		if( cookie !== null ){
			this.cookiesFound = true;
		}
		cookie = $.cookie(this.cookieId + "-focus");
		this.focusedKey = ( cookie === null ) ? "" : cookie;
		if( cookie !== null ){
			this.cookiesFound = true;
		}
		cookie = $.cookie(this.cookieId + "-expand");
		this.expandedKeyList = ( cookie === null ) ? [] : cookie.split(",");
		if( cookie !== null ){
			this.cookiesFound = true;
		}
		cookie = $.cookie(this.cookieId + "-select");
		this.selectedKeyList = ( cookie === null ) ? [] : cookie.split(",");
		if( cookie !== null ){
			this.cookiesFound = true;
		}
	},
	write: function() {
//		this._log("DynaTreeStatus: write");
		$.cookie(this.cookieId + "-active", ( this.activeKey === null ) ? "" : this.activeKey, this.cookieOpts);
		$.cookie(this.cookieId + "-focus", ( this.focusedKey === null ) ? "" : this.focusedKey, this.cookieOpts);
		$.cookie(this.cookieId + "-expand", ( this.expandedKeyList === null ) ? "" : this.expandedKeyList.join(","), this.cookieOpts);
		$.cookie(this.cookieId + "-select", ( this.selectedKeyList === null ) ? "" : this.selectedKeyList.join(","), this.cookieOpts);
	},
	addExpand: function(key) {
//		this._log("addExpand(%o)", key);
		if( $.inArray(key, this.expandedKeyList) < 0 ) {
			this.expandedKeyList.push(key);
			$.cookie(this.cookieId + "-expand", this.expandedKeyList.join(","), this.cookieOpts);
		}
	},
	clearExpand: function(key) {
//		this._log("clearExpand(%o)", key);
		var idx = $.inArray(key, this.expandedKeyList);
		if( idx >= 0 ) {
			this.expandedKeyList.splice(idx, 1);
			$.cookie(this.cookieId + "-expand", this.expandedKeyList.join(","), this.cookieOpts);
		}
	},
	addSelect: function(key) {
//		this._log("addSelect(%o)", key);
		if( $.inArray(key, this.selectedKeyList) < 0 ) {
			this.selectedKeyList.push(key);
			$.cookie(this.cookieId + "-select", this.selectedKeyList.join(","), this.cookieOpts);
		}
	},
	clearSelect: function(key) {
//		this._log("clearSelect(%o)", key);
		var idx = $.inArray(key, this.selectedKeyList);
		if( idx >= 0 ) {
			this.selectedKeyList.splice(idx, 1);
			$.cookie(this.cookieId + "-select", this.selectedKeyList.join(","), this.cookieOpts);
		}
	},
	isReloading: function() {
		return this.cookiesFound === true;
	},
	toDict: function() {
		return {
			cookiesFound: this.cookiesFound,
			activeKey: this.activeKey,
			focusedKey: this.focusedKey,
			expandedKeyList: this.expandedKeyList,
			selectedKeyList: this.selectedKeyList
		};
	}
};


/*******************************************************************************
 * Extension code
 */
$.ui.dynatree.registerExtension("persist", 
	/** @extends Dynatree */
	{
	// Default options for this extension.
	options: {
//		cookieIdPrefix: 
		overrideSource: false  // true: cookie takes precedence over `source` data attributes.
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Dynatree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
	treeInit: function(ctx){
		this._super(ctx);
		_assert($.cookie, "Missing required plugin: jquery.cookie.js");
		// TODO: use tree ID in cookie ID prefix by default
	},
	treeDestroy: function(ctx){
		this._super(ctx);
	}
});
}(jQuery));
