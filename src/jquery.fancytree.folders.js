/*!
 * jquery.fancytree.folders.js
 *
 * Automaticly converts nodes to folders if they have children.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2017, Jakub Jagielka (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "./jquery.fancytree" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

"use strict";

// /**
//  * [ext-folders] Catch the adding/removing the children and set folder flag for 
//  * the node if it contains children after operation.<br>
//  * This feature removes the need of setting 'folder' flag in source data.<br>
//  *
//  * @requires jquery.fancytree.folders.js
//  */


/*******************************************************************************
 * Extension code
 */


$.ui.fancytree.registerExtension({
	name: "folders",
	version: "@VERSION",

	// 'treeRegisterNode' is called after adding or deleting a node, always.
	// We catch all additions here and modify parent if needed.
	// Because it's after deleting, parent is already null, so this cannot be used
	// to catch deletions. We need to hook the 'nodeRemoveChild' instead.
	treeRegisterNode: function(ctx, add, node) {
		var parent = node.parent;

		this._superApply(arguments);

		if(add && !parent.hasChildren()) {
			parent.folder = true;
			if(parent.isVisible())
				parent.render();
		}
	},
	
	nodeRemoveChild: function(ctx, childNode) {
		var node = ctx.node;

		this._superApply(arguments);

		if (!node.hasChildren()) {
			node.folder = false;
			if(node.isVisible())
				node.render();
		}
	}
});


// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
})); // End of closure
