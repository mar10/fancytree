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
    
    var initContextMenu = function(selector, menu, actions) {
        $(document).on('mousedown.contextMenu', function(event) {
            var node = $.ui.fancytree.getNode(event);
            
            if(node) {
                node.setFocus(true);
                node.setActive(true);
                
                $.contextMenu({
                    selector: '.' + selector,
                    build: function($trigger, e) {
                        node = $.ui.fancytree.getNode($trigger);
                        
                        var menuItems = { }
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
            actions: {}
        },
        treeInit: function(ctx) {
            this._super(ctx);
            initContextMenu(ctx.options._classNames.title, ctx.options.contextMenu.menu, ctx.options.contextMenu.actions);
        }
    });
}(jQuery, document));