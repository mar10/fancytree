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

(function(factory) {
	if (typeof define === "function" && define.amd) {
		// AMD. Register as an anonymous module.
		define(["jquery", "./jquery.fancytree"], factory);
	} else if (typeof module === "object" && module.exports) {
		// Node/CommonJS
		require("./jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory(jQuery);
	}
})(function($) {
	"use strict";

	/******************************************************************************
	 * Private functions and variables
	 */
	var i,
		FT = $.ui.fancytree,
		HOOK_NAMES = "nodeClick nodeCollapseSiblings".split(" "),
		EVENT_NAMES = "activate beforeActivate".split(" "),
		HOOK_NAME_MAP = {},
		EVENT_NAME_MAP = {};

	for (i = 0; i < HOOK_NAMES.length; i++) {
		HOOK_NAME_MAP[HOOK_NAMES[i]] = true;
	}
	for (i = 0; i < EVENT_NAMES.length; i++) {
		EVENT_NAME_MAP[EVENT_NAMES[i]] = true;
	}

	/******************************************************************************
	 * Extension code
	 */
	$.ui.fancytree.registerExtension({
		name: "logger",
		version: "@VERSION",
		// Default options for this extension.
		options: {
			logTarget: null, // optional redirect logging to this <div> tag
			traceEvents: false, // `true`or list of hook names
			traceHooks: false, // `true`or list of event names
			timings: false, // `true`or list of event names
		},
		_logHook: function(name, ctx, extra) {
			var obj = ctx.node || ctx.tree;
			obj.info("hook." + name, extra, ctx);
		},
		// Overide virtual methods for this extension.
		// `this`       : is this Fancytree object
		// `this._super`: the virtual function that was overridden (member of prev. extension or Fancytree)
		treeInit: function(ctx) {
			this._local._logHook("treeInit", ctx);
			var tree = ctx.tree;

			// Bind init-handler to apply cookie state
			tree.$div.on("fancytreeinit", function(event) {
				tree.debug("COOKIE " + document.cookie);
			});
			// Init the tree
			return this._superApply(arguments);
		},
		nodeClick: function(ctx) {
			this._local._logHook(
				"nodeClick",
				ctx,
				FT.eventToString(ctx.originalEvent)
			);
			return this._superApply(arguments);
		},
		// nodeCollapseSiblings: function(ctx) {
		// },
		// nodeDblclick: function(ctx) {
		// },
		nodeKeydown: function(ctx) {
			this._local._logHook(
				"nodeKeydown",
				ctx,
				FT.eventToString(ctx.originalEvent)
			);
			return this._superApply(arguments);
		},
		// nodeLoadChildren: function(ctx, source) {
		// },
		// nodeRemoveChildMarkup: function(ctx) {
		// },
		// nodeRemoveMarkup: function(ctx) {
		// },
		nodeRender: function(ctx, force, deep, collapsed, _recursive) {
			// ctx.tree.debug("**** PROFILER nodeRender");
			var res,
				s = "render '" + ctx.node + "'";
			/*jshint expr:true */
			window.console && window.console.time && window.console.time(s);
			res = this._superApply(arguments);
			window.console &&
				window.console.timeEnd &&
				window.console.timeEnd(s);
			return res;
		},
		// 	nodeRenderStatus: function(ctx) {
		// 	},
		// 	nodeRenderTitle: function(ctx, title) {
		// 	},
		// 	nodeSetActive: function(ctx, flag, callOpts) {
		// 	},
		// 	nodeSetExpanded: function(ctx, flag, callOpts) {
		// 	},
		// 	nodeSetFocus: function(ctx) {
		// 	},
		// 	nodeSetSelected: function(ctx, flag, callOpts) {
		// 	},
		// 	nodeSetStatus: function(ctx, status, message, details) {
		// 	},
		// 	nodeToggleExpanded: function(ctx) {
		// 	},
		// 	nodeToggleSelected: function(ctx) {
		// 	},
		// 	treeClear: function(ctx) {
		// 	},
		// 	treeCreate: function(ctx) {
		// 	},
		// 	treeDestroy: function(ctx) {
		// 	},
		// //	treeInit: function(ctx) {
		// //	},
		// 	treeLoad: function(ctx, source) {
		// 	},
		// 	treeSetFocus: function(ctx, flag) {
		// 	}
	});

	// Value returned by `require('jquery.fancytree..')`
	return $.ui.fancytree;
}); // End of closure
