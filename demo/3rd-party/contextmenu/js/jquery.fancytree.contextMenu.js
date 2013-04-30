/**!
 * jquery.fancytree.contextmenu.js
 * 3rd party jQuery Context menu extension for jQuery Fancytree
 * 
 * Authors: Rodney Rehm, Addy Osmani (patches for FF)
 * Web: http://medialize.github.com/jQuery-contextMenu/
 * 
 * Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/fancytree/wiki/LicenseInfe
 */
(function($, document) {
    'use strict';
    /**
     * @param selector Selector matching the trigger objects.
     * @param menu object|function Items to be listed in contextMenu
     *  - object example:
     *    menu: {
     *        edit: { name: 'Edit', icon: 'edit' },
     *        delete: { name: 'Delete', disabled: true },
     *        sep1: '---------',
     *        quit: { name: 'Quit' }
     *    }
     *  - function example:
     *    menu: function(node) {
     *        return {
     *            edit: { name: 'Edit', icon: 'edit' },
     *            delete: { name: 'Delete', disabled: true },
     *            sep1: '---------',
     *            quit: { name: 'Quit' }
     *        }
     *    }
     * @param actions function A callback function to execute if clicked on
     *        some context menu item
     */
    var initContextMenu = function(selector, menu, actions) {
        $(document).on('mousedown.contextMenu', function(event) {
            var node = $.ui.fancytree.getNode(event);
            
            if(node) {
                var menuItems = { },
                    callback = $.Callbacks().add(actions);
                
                node.setFocus(true);
                node.setActive(true);
                
                if($.isFunction(menu)) {
                    menuItems = menu(node);
                } else if($.isPlainObject(menu)) {
                    menuItems = menu;
                }
                
                $.contextMenu({
                    selector: '.' + selector,
                    build: function($trigger, e) {
                        node = $.ui.fancytree.getNode($trigger);
                        if($.isFunction(menu)) {
                            menuItems = menu(node);
                        } else if($.isPlainObject(menu)) {
                            menuItems = menu;
                        }
                        return {
                            callback: function(action, options) {
                                callback.fire(node, action, options);
                            },
                            items: menuItems
                        }
                    }
                });
            }
        });
    }
    
    $.ui.fancytree.registerExtension('contextMenu', {
        version: '1.0',
        contextMenu: {
            menu: {},
            actions: function(node, action, options) { }
        },
        treeInit: function(ctx) {
            this._super(ctx);
            initContextMenu(ctx.options._classNames.title, ctx.options.contextMenu.menu, ctx.options.contextMenu.actions);
        }
    });
}(jQuery, document));