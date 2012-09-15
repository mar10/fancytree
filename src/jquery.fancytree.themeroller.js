/*************************************************************************
	jquery.fancytree.themeroller.js
	Table extension for jquery.fancytree.js.

	Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/fancytree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://fancytree.googlecode.com/
*************************************************************************/

// Start of local namespace
(function($) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
// if ( $.ui.fancytree && $.ui.fancytree.version ) {
//     $.ui.fancytree.warn("Fancytree: duplicate include");
//     return;
// }


/*******************************************************************************
 * Private functions and variables
 */
function _raiseNotImplemented(msg){
	msg = msg || "";
	$.error("Not implemented: " + msg);
}

function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension("themeroller", {
	// Default options for this extension.
	options: {
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		var $el = ctx.widget.element;

		$el.addClass("ui-widget ui-widget-content ui-corner-all");
		if($el[0].nodeName === "TABLE"){
			$el.addClass("ui-widget ui-corner-all");
			$el.find(">thead tr").addClass("ui-widget-header");
			$el.find(">tbody").addClass("ui-widget-conent");
		}else{
			$el.addClass("ui-widget ui-widget-content ui-corner-all");
		}
		// add themeroller classe names
		$.extend(ctx.options._classNames, {
			// container: "fancytree-container",
			// node: "fancytree-node",
			// folder: "fancytree-folder",
			// empty: "fancytree-empty",
			// vline: "fancytree-vline",
			// expander: "fancytree-expander",
			// checkbox: "fancytree-checkbox",
			// icon: "fancytree-icon",
			title: "fancytree-title",
			// noConnector: "fancytree-no-connector",
			statusnodeError: "fancytree-statusnode-error",
			// statusnodeWait: "fancytree-statusnode-wait",
			// hidden: "fancytree-hidden",
			// combinedExpanderPrefix: "fancytree-exp-",
			// combinedIconPrefix: "fancytree-ico-",
			// loading: "fancytree-loading",
			// hasChildren: "fancytree-has-children",
			active: "fancytree-active ui-state-highlight",
			selected: "fancytree-selected ui-state-default",
			// expanded: "fancytree-expanded",
			// lazy: "fancytree-lazy",
			focused: "fancytree-focused ui-state-focus"
			// partsel: "fancytree-partsel",
			// lastsib: "fancytree-lastsib"
		});
	},
	treeDestroy: function(ctx){
		this._super(ctx);
		ctx.widget.element.removeClass("ui-widget ui-widget-content ui-corner-all");
	}
	// nodeOnFocusInOut: function(ctx) {
	//     if(ctx.orgEvent.type === "focusin"){
	//         if(ctx.tree.focusNode){
	//             $(ctx.tree.focusNode.li).removeClass("ui-state-focus");
	//         }
	//         $(ctx.node.li).addClass("ui-state-focus").removeClass("fancytree-focused");
	//     }else{
	//         $(ctx.node.li).removeClass("ui-state-focus");
	//     }
	//     // $(ctx.node.li).toggleClass("ui-state-focus", ctx.orgEvent.type === "focusin");
	// },
	// nodeRenderStatus: function(ctx){
	//     var tree = ctx.tree,
	//         node = ctx.node,
	//         cnList = [];

	//     this._super(ctx);

	//     /*
	//     TODO:
	//     .ui-state-highlight: Class to be applied to highlighted or selected elements. Applies "highlight" container styles to an element and its child text, links, and icons.
	//     .ui-state-error: Class to be applied to error messaging container elements. Applies "error" container styles to an element and its child text, links, and icons.
	//     .ui-state-error-text: An additional class that applies just the error text color without background. Can be used on form labels for instance. Also applies error icon color to child icons.

	//     .ui-state-default: Class to be applied to clickable button-like elements. Applies "clickable default" container styles to an element and its child text, links, and icons.
	//     .ui-state-hover: Class to be applied on mouseover to clickable button-like elements. Applies "clickable hover" container styles to an element and its child text, links, and icons.
	//     .ui-state-focus: Class to be applied on keyboard focus to clickable button-like elements. Applies "clickable hover" container styles to an element and its child text, links, and icons.
	//     .ui-state-active: Class to be applied on mousedown to clickable button-like elements. Applies "clickable active" container styles to an element and its child text, links, and icons.
	//     */
	//     // cnList.push("fancytree-node");
	//     if(node === tree.activeNode){
	//         cnList.push("ui-state-highlight");
	//     }
	//     if(node === tree.focusNode){
	//         cnList.push("ui-state-focus");
	//     }
	//     if(node.selected){
	//         cnList.push("ui-state-default");
	//     }
	// // $tds.toggleClass("ui-state-highlight", node === tree.activeNode);
	// // $tds.toggleClass("ui-state-default", node === tree.focusNode);
	//     // if( node.expanded ){
	//     //     cnList.push("fancytree-expanded");
	//     // }
	//     // if( node.folder ){
	//     //     cnList.push("fancytree-folder");
	//     // }
	//     // if( node.hasChildren() !== false ){
	//     //     cnList.push("fancytree-has-children");
	//     // }
	//     // if( node.selected ){
	//     //     cnList.push("fancytree-selected");
	//     // }
	//     var $el = ctx.widget.element;
	//     if($el[0].nodeName === "TABLE"){
	//         $(node.tr).addClass(cnList.join(" "));
	//     }else{
	//         $(node.span).addClass(cnList.join(" "));
	//     }

	//     // TODO: support table extension
	//     // $tds.toggleClass("ui-state-highlight", node === tree.activeNode);
	//     // $tds.toggleClass("ui-state-default", node === tree.focusNode);
	// }
});
}(jQuery));
