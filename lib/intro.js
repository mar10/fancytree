(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( [ "jquery" ], factory );
	} else {
		factory( jQuery );
	}
}(function( $ ) {