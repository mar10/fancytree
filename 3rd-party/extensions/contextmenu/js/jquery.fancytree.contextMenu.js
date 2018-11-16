/**!
 * jquery.fancytree.contextmenu.js
 *
 * Integrate the 'jQuery contextMenu' plugin as Fancytree extension:
 * https://github.com/swisnl/jQuery-contextMenu
 *
 * Copyright (c) 2008-2018, Martin Wendt (http://wwWendt.de)
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 */
(function($, document) {
	"use strict";

	var initContextMenu = function(tree, selector, menu, actions, events) {
		tree.$container.on("mousedown.contextMenu", function(event) {
			var node = $.ui.fancytree.getNode(event);

			if(node) {
				$.contextMenu("destroy", "." + selector);

				node.setFocus(true);
				node.setActive(true);

				$.contextMenu({
					selector: "." + selector,
					events: {
						show: function(options) {
							options.prevKeyboard = tree.options.keyboard;
							tree.options.keyboard = false;
							if($.isFunction(events.show))
								events.show(node, options);
						},
						hide: function(options) {
							tree.options.keyboard = options.prevKeyboard;
							node.setFocus(true);
							if($.isFunction(events.hide))
								events.hide(node, options);
						}
					},
					build: function($trigger, e) {
						node = $.ui.fancytree.getNode($trigger);

						var menuItems = { };
						if($.isFunction(menu)) {
							menuItems = menu(node);
						} else if($.isPlainObject(menu)) {
							menuItems = menu;
						}

						return {
							callback: function(action, options) {
								if($.isFunction(actions)) {
									actions(node, action, options);
								} else if($.isPlainObject(actions)) {
									if(actions.hasOwnProperty(action) && $.isFunction(actions[action])) {
										actions[action](node, options);
									}
								}
							},
							items: menuItems
						};
					}
				});
			}
		});
	};

	$.ui.fancytree.registerExtension({
		name: "contextMenu",
		version: "@VERSION",
		contextMenu: {
			selector: "fancytree-title",
			menu: {},
			actions: {},
			events: {}
		},
		treeInit: function(ctx) {
			this._superApply(arguments);
			initContextMenu(ctx.tree,
					ctx.options.contextMenu.selector || "fancytree-title",
					ctx.options.contextMenu.menu,
					ctx.options.contextMenu.actions,
					ctx.options.contextMenu.events || {});
		}
	});
}(jQuery, document));
