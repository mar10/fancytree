/*******************************************************************************
 * jQuery.skinswitcher plugin.
 * 
 * Add a search button inside the input control and handle ESCAPE to reset.
 * @author Martin Wendt
 */
(function( $ ) {
	var PLUGIN_NAME = "skinswitcher",
		defaultOptions = {
		
		},
		methods = {
			init: function(options) {
				var opts = $.extend({}, defaultOptions, options);
			    return this.each(function() {
			    	var $input = $(this),
			    		height = $input.height();
//			    	$input.wrap("<div class='skinswitcher'>");

			    	var $button = $("<button>", {
			    		"class": PLUGIN_NAME + " ui-icon ui-icon-triangle-1-s", 
//			    		position: "absolute",
			    		html: "&times;",
			    		margin: 0,
			    		padding: 0
			    	}).css({
			    		width: height,
			    		height: height
			    	})
			    	.insertAfter($input)
			    	.position({
			    		my: "right center",
			    		at: "right center",
			    		of: $input 
			    	})
			    	.data("peerInput", $input)
			    	.click(function(e){
			    		$(this).data("peerInput").val("");
			    	});
			    	
					$input
						.css({
							
						})
					    .data(PLUGIN_NAME, opts)
					    .data("peerButton", $button)
						.keyup(function(e){
							if(e.which === $.ui.keyCode.ESCAPE){
								$(this).val("");
							}
						}).change(function(e){
							$(this).data("peerButton").attr("disabled", ($(this).val() === ""));
						});

			    });
			},
			reset: function() {
				this.val("");
			}
		};

	$.fn[PLUGIN_NAME] = function(method) {
	    // Method calling logic
		if ( methods[method] ) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " +  method + " does not exist on jQuery." + PLUGIN_NAME);
		}    
	};
})( jQuery );


/*******************************************************************************
 * Make this module available for AMD loaders. 
 */
/**
 * Initialize this module 
 */
define(["curl/domReady", 
        "css!common/css/forms.css"
        ], function(){
	var module = {};
    module.init = function(){
    	logDebug("Running contoller forms.init()...");
        
    }; // module.init()
    return module;
});
