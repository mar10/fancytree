(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		define( [
			"jquery",
			"jquery-ui/ui/widgets/mouse",
			"jquery-ui/ui/widgets/draggable",
			"jquery-ui/ui/widgets/droppable",
			"jquery-ui/ui/effects/effect-blind",
			"jquery-ui/ui/data",
			"jquery-ui/ui/effect",
			"jquery-ui/ui/focusable",
			"jquery-ui/ui/keycode",
			"jquery-ui/ui/position",
			"jquery-ui/ui/scroll-parent",
			"jquery-ui/ui/tabbable",
			"jquery-ui/ui/unique-id",
			"jquery-ui/ui/widget"
		], factory );
	} else {
		factory( jQuery );
	}
}(function( $ ) {
