// UMD wrapper for the Fancytree core module
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "jquery.fancytree.ui-deps" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("jquery.fancytree.ui-deps")
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {
