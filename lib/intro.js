(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		// Should require some parts of jquery-ui as well, but currently those
		// are not exported as NAMED modules.
		// See http://gregfranko.com/blog/registering-the-jqueryui-widget-factory-as-an-amd-module/
//		define( [ "jquery", "jquery.ui.core", "jquery.ui.widget" ], factory );
		define( [ "jquery" ], factory );
	} else {
		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {