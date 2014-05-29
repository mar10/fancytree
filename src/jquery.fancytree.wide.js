/*!
 *
 * jquery.fancytree.wide.js
 * Support for 100% wide selection bars.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2014, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";

/*******************************************************************************
 * Private functions and variables
 */
// function _assert(cond, msg){
// 	// TODO: see qunit.js extractStacktrace()
// 	if(!cond){
// 		msg = msg ? ": " + msg : "";
// 		$.error("Assertion failed" + msg);
// 	}
// }

/**
 * [ext-wide] Recalculate the width of the selection bar after the tree container
 * was resized.<br>
 * Must be called explicitly on window resize, since there is no resize event
 * for DIV tags.
 *
 * @alias Fancytree#wideUpdate
 * @requires jquery.fancytree.wide.js
 */
$.ui.fancytree._FancytreeClass.prototype.wideUpdate = function(){
	var inst = this.ext.wide,
		prevCw = inst.contWidth,
		prevLo = inst.lineOfs;
	// http://blog.jquery.com/2012/08/16/jquery-1-8-box-sizing-width-csswidth-and-outerwidth/
	inst.contWidth = parseFloat(this.$container.css("width"), 10);
	// Each title is precceeded by 2 or 3 icons (16px + 3 margin)
	//     + 1px title border and 3px title padding
	inst.lineOfs = (this.options.checkbox ? 3 : 2) * 19;
	if( prevCw !== inst.contWidth || prevLo !== inst.lineOfs ) {
		this.visit(function(node){
			node.tree._callHook("nodeRenderTitle", node);
		});
	}
};

/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "wide",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		cheap: false,
		margin: {left: 3, right: 3}
	},

	treeCreate: function(ctx){
		this.$container.addClass("fancytree-ext-wide");
		this._super(ctx);
		// http://blog.jquery.com/2012/08/16/jquery-1-8-box-sizing-width-csswidth-and-outerwidth/
		this._local.contWidth = parseFloat(ctx.tree.$container.css("width"), 10);
		// Every nested UL is indented by 16px
		// Each title is precceeded by 2 or 3 icons (16px + 3 margin)
		//     + 1px title border and 3px title padding
		this._local.lineOfs = (ctx.options.checkbox ? 3 : 2) * 19;
		this._local.levelOfs = 16;
		this._local.titlePadding = 3;
	},
	// treeInit: function(ctx){
	// 	this._super(ctx);
	// },
	nodeRenderTitle: function(ctx) {
		var ofs, res, margin,
			instOpts = ctx.options.wide,
			inst = this._local,
			cw = inst.contWidth,
			node = ctx.node;

		res = this._super(ctx);

		if( !instOpts.cheap ) {
			margin = instOpts.margin;
			ofs = (node.getLevel() - 1) * inst.levelOfs + inst.lineOfs;
			$(node.span).find(".fancytree-title").css({
				width: cw - margin.left - margin.right - ofs,
				marginLeft:  -ofs + margin.left,
				paddingLeft: +ofs - margin.left + inst.titlePadding,
				paddingRight: inst.titlePadding
			});
		}
		return res;
	}
});
}(jQuery, window, document));
