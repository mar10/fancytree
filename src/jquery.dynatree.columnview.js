
/*************************************************************************
    jquery.dynatree.columnview.js
    Table extension for jquery.dynatree.js.

    Copyright (c) 2012, Martin Wendt (http://wwWendt.de)
    Dual licensed under the MIT or GPL Version 2 licenses.
    http://code.google.com/p/dynatree/wiki/LicenseInfo

    A current version and some documentation is available at
        http://dynatree.googlecode.com/

    $Version:$
    $Revision:$

    @depends: jquery.js
    @depends: jquery.ui.widget.js
    @depends: jquery.ui.core.js
    @depends: jquery.dynatree.js
*************************************************************************/

// Start of local namespace
(function($) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
// if ( $.ui.dynatree && $.ui.dynatree.version ) {
//     $.ui.dynatree.warn("Dynatree: duplicate include");
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


$.ui.dynatree.registerExtension("columnview", {
    // Default options for this extension.
    options: {
    },
    // Overide virtual methods for this extension.
    // `this`       : is this extension object
    // `this._base` : the Dynatree instance
    // `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
    treeInit: function(ctx){
        var tree = ctx.tree,
            $table = $("table#columnview");
        tree.tr = $("table#columnview tbody tr")[0];

        this._super(ctx);
        // standard Dynatree created a root UL.
        // Move this into first table cell
        var $ul = $(tree.rootNode.ul),
            $tdFirst = $(">td", tree.tr).eq(0);
        $ul.removeClass("dynatree-container");
        $table.addClass("dynatree-container");
        $tdFirst.empty();
        $ul.detach().appendTo($tdFirst);
    },
    nodeRender: function(ctx, force, deep, collapsed, _recursive) {
        var tree = ctx.tree,
            node = ctx.node,
            opts = ctx.options;

        this._super(ctx, force, deep, collapsed, _recursive);
        // Move <ul> with children into the appropriate <td>
        if(node.ul){
            var $tdChild = $(">td", tree.tr).eq(node.getLevel()),
                $ul = $(node.ul).detach();
            $tdChild.empty().append($ul);
        }
    },
    // nodeRenderTitle: function(ctx, title) {
    //     var node = ctx.node;
    //     this._super(ctx);
    //     $("td:nth(1)", node.tr).text(node.key);
    //     $("td:nth(2)", node.tr).text(!!node.folder);
    // },
    nodeRenderStatus: function(ctx) {
        var node = ctx.node,
            tree = ctx.tree,
            $tr = $(node.tr),
            $tds = $(">td", node.tr),
            orgLI = node.li;
        this._super(ctx);
        $tds.toggleClass("ui-state-highlight", node === tree.activeNode);
        $tds.toggleClass("ui-state-default", node === tree.focusNode);
    },
    nodeSetActive: function(ctx, flag) {
        this._super(ctx, flag);
        flag = flag === undefined ? true : !!flag;
        $(ctx.node.tr).toggleClass("", flag);
    },
    /** Expand node, return Deferred.promise. */
    // nodeSetExpanded: function(ctx, flag) {
    //     var node = ctx.node,
    //         dfd = new $.Deferred();
    //     this._super(ctx, flag).done(function(){
    //         setChildRowVisibility(ctx.node, flag);
    //         dfd.resolveWith(node);
    //     });
    //     return dfd;
    // },
    nodeSetStatus: function(ctx, status, message, details) {
        if(status === "ok"){
            var node = ctx.node,
                firstChild = ( node.children ? node.children[0] : null );
            if ( firstChild && firstChild.isStatusNode ) {
                $(firstChild.tr).remove();
            }
        }
        this._super(ctx, status, message, details);
    }
});
}(jQuery));
