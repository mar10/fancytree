/*************************************************************************
    jquery.dynatree.table.js
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

function insertSiblingAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function setChildRowVisibility(node, flag) {
    var tr = node.tr,
        lastNode = node.getNextSibling();
    // If lastNode is null, check for parent.nextsibling !!
    while(!lastNode && node.parent.parent){
        node = node.parent;
        lastNode = node.getNextSibling();
    }
    tr = tr.nextSibling;
    while(tr && tr.dtnode !== lastNode){
        tr.style.display = flag ? "" : "none";
        tr = tr.nextSibling;
    } 
}

/** Find node that is rendered in previous row. */
function findPrevRowNode(node){
    var parent = node.parent,
        siblings = parent ? parent.children : null,
        prev, i;
    // 
    if(siblings && siblings.length > 1 && siblings[0] !== node){
        // use the lowest descendant of the preceeding sibling
        // TODO: doesn't work for IE 6
        i = siblings.indexOf(node);
        prev = siblings[i - 1];
        _assert(prev.tr);
        // descend to lowest child (with a <tr> tag)
        while(prev.children){
            var last = prev.children[prev.children.length - 1];
            if(!last.tr){
                break;
            }
            prev = last;
        }
    }else{
        // if there is no preceding sibling, use the direct parent
        prev = parent;
    //                _assert(prev.tr);
    }
    return prev;
}


$.ui.dynatree.registerExtension("table", {
    // Default options for this extension.
    options: {
        indentation: 16
    },
    // Overide virtual methods for this extension.
    // `this`       : is this extension object
    // `this._base` : the Dynatree instance
    // `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
    treeInit: function(ctx){
        var tree = ctx.tree,
            $table = tree.$widget.element,
            tr;
        $table.addClass("dynatree-container dynatree-ext-table");
        tree.tbody = $("table#treetable tbody")[0];
//        table.addClass("dynatree-container");
        tree.columnCount = $("thead >tr >th", $table).length;
        $(tree.tbody).empty();

        tree.rowFragment = document.createDocumentFragment();
        var $row = $("<tr><td><span class='dynatree-title'></span></td></tr>");
        for(var i=0; i<tree.columnCount - 1; i++) {
            $row.append("<td>");
        }
        tree.rowFragment.appendChild($row.get(0));

        this._super(ctx);
        // standard Dynatree created a root UL
        $(tree.rootNode.ul).remove();
        tree.rootNode.ul = null;
        // Make sure that status classes are set on the node's <tr> elements
        tree.statusClassPropName = "tr";
    },
    nodeRender: function(ctx, force, deep, collapsed, _recursive) {
        var tree = ctx.tree,
            node = ctx.node,
            opts = ctx.options,
            firstTime = false;
        if(!node.tr){
            // Create new <tr> after previous row
            var parentNode = node.parent,
                newRow = tree.rowFragment.firstChild.cloneNode(true),
                prevNode = findPrevRowNode(node);
            firstTime = true;
            $.ui.dynatree.debug("*** nodeRender " + node + ": prev: " + prevNode.key);
            _assert(prevNode);
            if(collapsed === true && _recursive){
                // hide all child rows, so we can use an animation to show it later
                newRow.style.display = "none";
            }
            if(!prevNode.tr){
                _assert(!prevNode.parent, "prev. row must have a tr, or is system root");
                tree.tbody.appendChild(newRow);
            }else{
                insertSiblingAfter(prevNode.tr, newRow);
            }
            node.tr = newRow;
            if( node.key && opts.generateIds ){
                node.tr.id = opts.idPrefix + node.key;
            }
            node.tr.dtnode = node;
            node.span = $("span.dynatree-title", node.tr).get(0);
            var indent = (node.getLevel() - 1) * opts.table.indentation;
            if(indent){
                $(node.span).css({marginLeft: indent + "px"});
            }

            // Set icon, link, and title (normally this is only required on initial render)
            this._base.nodeRenderTitle(ctx);
        }

        // // Allow tweaking, binding, after node was created for the first time
        // if(firstTime && opts.onCreate){
        //     opts.onCreate.call(tree, this, this.span);
        // }
        // // Allow tweaking after node state was rendered
        // if(opts.onRender){
        //     // TODO: _trigger
        //     opts.onRender.call(tree, this, this.span);
        // }
        // Visit child nodes
        // Add child markup
        var cl = node.children, i, l;
        if(cl && (deep || node.expanded)){
            for(i=0, l=cl.length; i<l; i++) {
                var subCtx = $.extend({}, ctx, {node: cl[i]}); 
                this.nodeRender(subCtx, force, deep, collapsed, true);
            }
        }
        // Make sure, that <li> order matches node.children order.
        // var childLI = node.ul.firstChild;
        // for(i=0, l=cl.length-1; i<l; i++) {
        //     var childNode1 = cl[i],
        //         childNode2 = childLI.dtnode;
        //     if( childNode1 !== childNode2 ) {
        //         node.debug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
        //         node.ul.insertBefore(childNode1.li, childNode2.li);
        //     } else {
        //         childLI = childLI.nextSibling;
        //     }
        // }
    // Update element classes according to node state
        this._base.nodeRenderStatus(ctx);

        // Finally add the whole structure to the DOM, so the browser can render
        // if(firstTime){
        //     parent.ul.appendChild(node.li);
        // }
            // TODO: just for debugging
    //            this._super(ctx);
    },
    nodeRenderTitle: function(ctx, title) {
        var node = ctx.node;
        this._super(ctx);
        // let user code write column content
        ctx.tree._triggerNodeEvent("rendercolumns", node);
    },
    // nodeRenderStatus: function(ctx) {
    //     var node = ctx.node,
    //         tree = ctx.tree,
    //         $tr = $(node.tr),
    //         $tds = $(">td", node.tr),
    //         orgLI = node.li;
    //     // Let base class do it's thing, but apply classes to <tr> instead of <li>
    //     node.li = node.tr;
    //     this._super(ctx);
    //     node.li = orgLI;
    //     if(node === tree.activeNode){
    //         $tr.addClass("dynatree-active");
    //     }
    //     // if(node === tree.focusNode){
    //     //     $tr.addClass("dynatree-active");
    //     // }
    // },
    // nodeSetActive: function(ctx, flag) {
    //     this._super(ctx, flag);
    //     flag = flag === undefined ? true : !!flag;
    //     $(ctx.node.tr).toggleClass("", flag);
    // },
    /** Expand node, return Deferred.promise. */
    nodeSetExpanded: function(ctx, flag) {
        var node = ctx.node,
            dfd = new $.Deferred();
        this._super(ctx, flag).done(function(){
            setChildRowVisibility(ctx.node, flag);
            dfd.resolveWith(node);
        });
        return dfd;
    },
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
