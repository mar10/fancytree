/*************************************************************************
	(c) 2008-2012 Martin Wendt
 *************************************************************************/

/*******************************************************************************
 * jQuery.skinswitcher plugin.
 * 
 * Change CSS include when combobox selection changes.
 * Copyright (c) 2012 Martin Wendt
 * 
 * Usage:
	$("select#skinswitcher").skinswitcher({
		base: "../src/",
		choices: [{name: "XP", value: "xp", href: "skin/ui.fancytree.css"},
		          {name: "Vista", value: "vista", href: "skin-vista/ui.fancytree.css"},
		          {name: "Lion", value: "lion", href: "skin-lion/ui.fancytree.css"}
		          ],
		init: "lion"
	});
 */

(function( $ ) {
	var PLUGIN_NAME = "skinswitcher",
		defaultOptions = {
			/**RegEx that returns prefix, tag, and suffix of the CSS href.*/
			skinPattern: "^(\W/skin-)().css$",
			mode: "combo", // {String} mode 'combo' or 'radio' 
			base: "",
			choices: [] 
		},
		methods = {
			init: function(options) {
				var opts = $.extend({}, defaultOptions, options),
					hrefs = [],
					$link = null,
					initialChoice = undefined;
		    	// Find <link> tag, figure out current setting and mark for
				// later access
				$.each(opts.choices, function(){
					hrefs.push(this.href.toLowerCase());
				});
				$("head link").each(function(){
					for(var i=0; i<hrefs.length; i++){
						if(this.href.toLowerCase().indexOf(hrefs[i]) >= 0){
							$link = $(this);
							$link.addClass(PLUGIN_NAME);
							initialChoice = opts.choices[i];
						}
					}
				});
			    return this.each(function() {
			    	// Add options to dropdown list
			    	var $combo = $(this);
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
			    		$("link.skinswitcher").attr("href", opts.base + choice.href);
			    	});
			    	if(opts.init){
			    		$combo.val(opts.init).change();
			    	}else if (initialChoice){
						// select combobox value to match current <link> tag 
			    		$combo.val(initialChoice.value);
			    	}
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



function viewSourceCode()
{
	window.location = "view-source:" + window.location.href;
}


function initCodeSamples()
{
	var $source = $("#sourceCode");
	$("#codeExample").toggle(
		function(){
			$source.show("fast");
			if( !this.old ){
				this.old = $(this).html();
				$.get(this.href, function(code){
					// Remove <!-- Start_Exclude [...] End_Exclude --> blocks:
					code = code.replace(/<!-- Start_Exclude(.|\n|\r)*?End_Exclude -->/gi, "<!-- (Irrelevant source removed.) -->");
					// Reduce tabs from 8 to 2 characters
					code = code.replace(/\t/g, "  ");
					$source.text(code);
					// Format code samples
					try {
						prettyPrint();
					} catch (e) {
						alert(e);
					}
				}, "html");
			}
			$(this).html("Hide source code");
		},
		function(){
			$(this).html(this.old);
			$source.hide("fast");
		}
	);
	if(jQuery.ui){
		var info = "Fancytree " + jQuery.ui.fancytree.version
			+ ", jQuery UI " + jQuery.ui.version
			+ ", jQuery " + jQuery.fn.jquery;
/*
		info += "\n<br>";
		info += "document.compatMode: " + document.compatMode + "\n";
		for(e in jQuery.support){
			info += "<br>\n" + e + ": " + jQuery.support[e];
		}
*/
		$("p.sample-links").after("<p class='version-info'>" + info + "</p>");
	}
}


var _gaq = _gaq || [];

$(function(){
	// Log to Google Analytics, when not running locally
	if ( document.URL.toLowerCase().indexOf("wwwendt.de/") >= 0 ) {
		_gaq.push(["_setAccount", "UA-316028-1"]);
		_gaq.push(["_trackPageview"]);

		(function() {
			var ga = document.createElement("script"); ga.type = "text/javascript"; ga.async = true;
			ga.src = ("https:" == document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
			var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ga, s);
		})();
	}

	// Show some elements only, if (not) inside the Example Browser
	if (top.location == self.location){
		$(".hideOutsideFS").hide();
	}else{
		$(".hideInsideFS").hide();
	}
	initCodeSamples();

	$("select#skinswitcher").skinswitcher({
		base: "../src/",
		choices: [{name: "XP", value: "xp", href: "skin/ui.fancytree.css"},
		          {name: "Vista-Classic", value: "vista-classic", href: "skin-vista-classic/ui.fancytree.css"},
		          {name: "Vista", value: "vista", href: "skin-vista/ui.fancytree.css"},
		          {name: "Lion", value: "lion", href: "skin-lion/ui.fancytree.css"}
		          ]
//		init: "lion"
	});

});
