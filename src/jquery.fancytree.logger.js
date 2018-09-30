/*!
 * jquery.fancytree.logger.js
 *
 * Miscellaneous debug extensions.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2018, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "./jquery.fancytree" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("./jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */
var i,
	FT = $.ui.fancytree,
	HOOK_NAMES = "nodeClick nodeCollapseSiblings".split(" "),
	TREE_EVENT_NAMES = "blurTree create init focusTree restore".split(" "),
	NODE_EVENT_NAMES = "activate beforeActivate beforeExpand beforeSelect blur click collapse createNode dblclick deactivate expand enhanceTitle focus keydown keypress lazyLoad loadChildren loadError modifyChild postProcess renderNode renderTitle select".split(" "),
	EVENT_NAMES = TREE_EVENT_NAMES.concat(NODE_EVENT_NAMES),
	HOOK_NAME_MAP = {},
	EVENT_NAME_MAP = {};

/*
*/
for(i=0; i<HOOK_NAMES.length; i++){ HOOK_NAME_MAP[HOOK_NAMES[i]] = true; }
for(i=0; i<EVENT_NAMES.length; i++){ EVENT_NAME_MAP[EVENT_NAMES[i]] = true; }


function getBrowserInfo() {
	var n = navigator.appName,
		ua = navigator.userAgent,
		tem,
		m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);

	if(m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null){
		m[2]= tem[1];
	}
	m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
	return m.join(", ");
}


function logEvent(event, data) {
	var res,
		logName = "event." + event.type,
		opts = data.options.logger,
		obj = data.node || data.tree;

	if( !opts.traceEvents || (opts.traceEvents !== true && $.inArray(name, opts.traceEvents) < 0) ) {
		return;
	}
	if( opts.timings === true || (opts.timings && $.inArray(name, opts.timings) >= 0 ) ) {
		// if( name === "nodeRender" ) { logName += obj; }  // allow timing for recursive calls
		logName += " (" + obj + ")";
		window.console.time(logName);
		res = self._super.apply(this, arguments);
		window.console.timeEnd(logName);
	} else {
		obj.info(logName, data);
	}
}

function logHook(name, self, args, extra) {
	var res,
		logName = "hook." + name,
		ctx = args[0],
		opts = ctx.options.logger,
		obj = ctx.node || ctx.tree;

	if( !opts.traceHooks || (opts.traceHooks !== true && $.inArray(name, opts.traceHooks) < 0) ) {
		return self._superApply.call(self, args);
	}
	if( opts.timings === true || (opts.timings && $.inArray(name, opts.timings) >= 0 ) ) {
		// if( name === "nodeRender" ) { logName += obj; }  // allow timing for recursive calls
		logName += " (" + obj + ")";
		window.console.time(logName);
		res = self._superApply.call(self, args);
		window.console.timeEnd(logName);
		return res;
	} else {
		if( extra ) {
			obj.info(logName, extra, ctx);
		} else {
			obj.info(logName, ctx);
		}
		return self._superApply.call(self, args);
	}
}


/* *****************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "logger",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		logTarget: null,   // optional redirect logging to this <div> tag
		traceEvents: true, // `true`or list of hook names
		traceHooks: false,  // `true`or list of event names
		timings: false  // `true`or list of event names
	},
	// Overide virtual methods for this extension.
	// `this`       : is this Fancytree object
	// `this._super`: the virtual function that was overridden (member of prev. extension or Fancytree)
	treeInit: function(ctx) {
		if( this.options.extensions[this.options.extensions.length-1] !== "logger" ) {
			throw "Fancytree 'logger' extension must be listed as last entry.";
		}
		ctx.tree.warn("Fancytree logger extension is enabled (this may be slow).", ctx.options.logger);

		console.info("Fancytree v" + $.ui.fancytree.version + ", buildType='" + $.ui.fancytree.buildType + "'");
		console.info("jQuery UI " + jQuery.ui.version + " (uiBackCompat=" + $.uiBackCompat + ")");
		console.info("jQuery " + jQuery.fn.jquery);
		console.info("Browser: " + getBrowserInfo());

		$.each(EVENT_NAMES, function(i, name){
			// ctx.tree.overrideMethod(ctx.tree, name, logEvent);
			$.ui.fancytree.overrideMethod(ctx.options, name, logEvent);
			// $.ui.fancytree.overrideMethod(ctx.options, "createNode", function(event, data) {
			// 	// Default processing if any
			// 	this._super.apply(this, arguments);
			// 	// Add 'draggable' attribute
			// 	data.node.span.draggable = true;
			// });
		});

		return logHook("treeInit", this, arguments);
	},
	nodeClick: function(ctx) {
		return logHook("nodeClick", this, arguments, FT.eventToString(ctx.originalEvent));
	},
	nodeCollapseSiblings: function(ctx) {
		return logHook("nodeCollapseSiblings", this, arguments);
	},
	nodeDblclick: function(ctx) {
		return logHook("nodeDblclick", this, arguments);
	},
	nodeKeydown: function(ctx) {
		return logHook("nodeKeydown", this, arguments, FT.eventToString(ctx.originalEvent));
	},
	nodeLoadChildren: function(ctx, source) {
		return logHook("nodeLoadChildren", this, arguments);
	},
	nodeRemoveChildMarkup: function(ctx) {
		return logHook("nodeRemoveChildMarkup", this, arguments);
	},
	nodeRemoveMarkup: function(ctx) {
		return logHook("nodeRemoveMarkup", this, arguments);
	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		return logHook("nodeRender", this, arguments);
	},
	nodeRenderStatus: function(ctx) {
		return logHook("nodeRenderStatus", this, arguments);
	},
	nodeRenderTitle: function(ctx, title) {
		return logHook("nodeRenderTitle", this, arguments);
	},
	nodeSetActive: function(ctx, flag, callOpts) {
		return logHook("nodeSetActive", this, arguments);
	},
	nodeSetExpanded: function(ctx, flag, callOpts) {
		return logHook("nodeSetExpanded", this, arguments);
	},
	nodeSetFocus: function(ctx) {
		return logHook("nodeSetFocus", this, arguments);
	},
	nodeSetSelected: function(ctx, flag, callOpts) {
		return logHook("nodeSetSelected", this, arguments);
	},
	nodeSetStatus: function(ctx, status, message, details) {
		return logHook("nodeSetStatus", this, arguments);
	},
	nodeToggleExpanded: function(ctx) {
		return logHook("nodeToggleExpanded", this, arguments);
	},
	nodeToggleSelected: function(ctx) {
		return logHook("nodeToggleSelected", this, arguments);
	},
	treeClear: function(ctx) {
		return logHook("treeClear", this, arguments);
	},
	treeCreate: function(ctx) {
		return logHook("treeCreate", this, arguments);
	},
	treeDestroy: function(ctx) {
		return logHook("treeDestroy", this, arguments);
	},
	treeLoad: function(ctx, source) {
		return logHook("treeLoad", this, arguments);
	},
	treeSetFocus: function(ctx, flag) {
		return logHook("treeSetFocus", this, arguments);
	}
});

// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
}));  // End of closure
