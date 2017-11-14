/*!
 * jquery.fancytree.select.js
 *
 * Configurable support for hierarchical selection.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2017, Martin Wendt (http://wwWendt.de)
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
		require("./jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

"use strict";


/*******************************************************************************
 * Private functions and variables
 */

// var escapeHtml = $.ui.fancytree.escapeHtml;


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "select",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		checkboxIcon: true   // bool | "radio" | function
	},
	treeInit: function(ctx){
		// gridnav requires the table extension to be loaded before itself
		// this._requireExtension("table", true, true);
		this._superApply(arguments);

		this.$container.addClass("fancytree-ext-select");
	},
	nodeLoadChildren: function(ctx, source) {
		return this._superApply(arguments).done(function() {
			// TODO
		});
	},
	nodeSetSelected: function(ctx, flag, callOpts) {
		return this._superApply(arguments);
	}
});
// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
}));  // End of closure
