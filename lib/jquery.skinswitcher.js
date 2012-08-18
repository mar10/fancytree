/*******************************************************************************
 * jQuery.skinswitcher plugin.
 * 
 * Change CSS include when combobox selection changes.
 * @author Martin Wendt
 */

/*
		$("#skinCombo")
		.val(0) // set state to prevent caching
		.change(function(){
			var href = "../src/"
				+ $(this).val()
				+ "/ui.dynatree.css"
				+ "?reload=" + new Date().getTime();
			$("#skinSheet").attr("href", href);
		});

		Skin:
		<select id="skinCombo" size="1">
			<option value="skin">Standard ('/skin/')</option>
			<option value="skin-vista">Vista ('/skin-vista/')</option>
			<option value="skin-lion">Lion ('/skin-lion/')</option>
		</select>
 */
(function( $ ) {
	var PLUGIN_NAME = "skinswitcher",
		defaultOptions = {
			/**RegEx that returns prefix, tag, and suffix of the CSS href.*/
			skinPattern: "^(\W/skin-)().css$",
			mode: "combo", // {String} mode 'combo' or 'radio' 
			base: "../src/",
			choices: [{name: "XP", value: "xp", href: "skin/ui.dynatree.css"},
			          {name: "Vista", value: "vista", href: "skin-vista/ui.dynatree.css"},
			          {name: "Lion", value: "lion", href: "skin-lion/ui.dynatree.css"}
			          ]
		},
		methods = {
			init: function(options) {
				var opts = $.extend({}, defaultOptions, options),
					hrefs = [],
					$link = null,
					initialChoice = undefined;
		    	// Find <link> tag, and figure out current setting
				$.each(opts.choices, function(){
					hrefs.push(this.href.toLowerCase());
				});
//				alert(hrefs);
				$("head link").each(function(){
					for(var i=0; i<hrefs.length; i++){
						if(this.href.toLowerCase().indexOf(hrefs[i]) >= 0){
							$link = this;
							initialChoice = opts.choices[i];
							alert(this.href + ", " + i);
						}
					}
//					hrefs.append(this.href);
				});
			    return this.each(function() {
			    	// Add options to dropdown list
			    	var $combo = $(this);
//			    	$input.wrap("<div class='skinswitcher'>");
			    	$combo.empty();
			    	$.each(opts.choices, function(i, choice){
			    		var $opt = $("<option>", {
			    				text: choice.name,
			    				value: choice.value
			    			}).data("choice", choice);
			    		$combo.append($opt);
			    	});
			    	// Switch include
			    	$combo.change(function(){
			    		var choice = $(":selected", this).data("choice");
			    		alert(choice.href);
			    	});
//			    	var $button = $("<button>", {
//			    		"class": PLUGIN_NAME + " ui-icon ui-icon-triangle-1-s", 
////			    		position: "absolute",
//			    		html: "&times;",
//			    		margin: 0,
//			    		padding: 0
//			    	}).css({
//			    		width: height,
//			    		height: height
//			    	})
//			    	.insertAfter($input)
//			    	.position({
//			    		my: "right center",
//			    		at: "right center",
//			    		of: $input 
//			    	})
//			    	.data("peerInput", $input)
//			    	.click(function(e){
//			    		$(this).data("peerInput").val("");
//			    	});
//			    	
//					$input
//						.css({
//							
//						})
//					    .data(PLUGIN_NAME, opts)
//					    .data("peerButton", $button)
//						.keyup(function(e){
//							if(e.which === $.ui.keyCode.ESCAPE){
//								$(this).val("");
//							}
//						}).change(function(e){
//							$(this).data("peerButton").attr("disabled", ($(this).val() === ""));
//						});

			    });
			},
			change: function(href) {
				this.val("");
			},
			reset: function() {
				this.val("");
			}
		};

	$.fn[PLUGIN_NAME] = function(method) {
	    // Method calling logic
		if ( methods[method] ) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if ( typeof method === "object" || ! method ) {
			return methods.init.apply(this, arguments);
		} else {
			$.error("Method " +  method + " does not exist on jQuery." + PLUGIN_NAME);
		}    
	};
})( jQuery );
