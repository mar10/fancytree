/*************************************************************************
	jquery.dynatree.themeroller.js
	Table extension for jquery.dynatree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/dynatree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://dynatree.googlecode.com/
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


/*******************************************************************************
 * Extension code
 */
$.ui.dynatree.registerExtension("persist", {
	// Default options for this extension.
	options: {
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Dynatree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
	treeInit: function(ctx){
		this._super(ctx);
	},
	treeDestroy: function(ctx){
		this._super(ctx);
	}
});
}(jQuery));
