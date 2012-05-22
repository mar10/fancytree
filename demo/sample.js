/*************************************************************************
	(c) 2008-2012 Martin Wendt
 *************************************************************************/

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
		var info = "Dynatree " + jQuery.ui.dynatree.version
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
});
