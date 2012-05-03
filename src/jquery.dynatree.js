/*************************************************************************
    jquery.dynatree.js
    Dynamic tree view control, with support for lazy loading of branches.

    Copyright (c) 2008-2012, Martin Wendt (http://wwWendt.de)
    Dual licensed under the MIT or GPL Version 2 licenses.
    http://code.google.com/p/dynatree/wiki/LicenseInfo

    A current version and some documentation is available at
        http://dynatree.googlecode.com/

TODO:
- .vesion = 1.3.0
- use $.extend(true, ...)
- this.element = $this
- $("#tree").data("dynatree") = ..
- Alle trees: $(":ui-dynatree")
- Call funcs:
  $("#tree").dynatree("getRootNode")
  $("#tree").data("dynatree").getRootNode()

- A mechanism for facilitating and responding to changes to plugin options after instantiation
  $( "#something" ).multi( "option", "clear" , function ( event ) { alert( "I cleared the multiselect!" ); } );

- this.options
  this.name, this.namespace
  this.widgetEventPrefix

- use this.element.css({background: greenlevels[level]});


    $Version:$
    $Revision:$

    @depends: jquery.js
    @depends: jquery.ui.widget.js
    @depends: jquery.ui.core.js
    @depends: jquery.cookie.js
*************************************************************************/

// Start of local namespace
(function($) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
if ( $.ui.dynatree && $.ui.dynatree.version ) {
    $.ui.dynatree.warn("Dynatree: duplicate include");
    return;
}


/*******************************************************************************
 * Private functions and variables
 */
// RegExp that tests a function body for usage of '_super'
var dummyFunc = function(){ var xyz; },
    rexTestSuper = /xyz/.test(dummyFunc) ? /\b_super\b/ : null;

/** Return a wrapper that calls sub.fn() and exposes base.fn() as _super(). */
var _makeVirtualFunction = function(fn, base, sub){
    var _super = base[fn],
        func = sub[fn];
    // if(rexTestSuper && !rexTestSuper.test(func)){
    //     // sub.fn() doesn't call _super(), so no wrapper required
    //     return func;  
    // }
    return function(){
        try{
            sub._super = function(){ 
                return _super.apply(base, arguments);
            };
            sub._base = base;
            // return  func.apply(sub, arguments);
            return  func.apply(sub, arguments);
        }finally{
            sub._super = null;        
        }        
    };
};

/**
 * 
 */
function _subclassObject(base, sub){
    for(var fn in sub){
        if(typeof sub[fn] === "function"){
            if(typeof base[fn] === "function"){
                // override existing method
                base[fn] = _makeVirtualFunction(fn, base, sub);
            }else{
                base[fn] = sub[fn];
            }
        }
    }
}


// Boolean attributes that can be set with equivalent class names in the LI tags
var CLASS_ATTRS = ["active", "expanded", "focus", "folder", "lazy", "nolink", "selected"],
    CLASS_ATTR_MAP = {};
for(var i=0; i<CLASS_ATTRS.length; i++){ CLASS_ATTR_MAP[CLASS_ATTRS[i]] = true; }

/** Parse tree data from HTML <ul> markup */
function _loadFromHtml($ul, children) {
    // TODO: understand this:
    /*jshint validthis:true */
    var that = this,
        $children = $ul.find(">li"),
        extraClasses, i, l, iPos, tmp, classes, className;

    $children.each(function() {
        var $li = $(this),
            $liSpan = $li.find(">span:first", this),
            $liA = $liSpan.length ? null : $li.find(">a:first"),
            d = {href: null, target: null, tooltip: null };

        if( $liSpan.length ) {
            d.title = $liSpan.html();

        } else if( $liA && $liA.length ) {
            // If a <li><a> tag is specified, use it literally and extract href/target.
            d.title = $liA.html();
            d.href = $liA.attr("href");
            d.target = $liA.attr("target");
            d.tooltip = $liA.attr("title");

        } else {
            // If only a <li> tag is specified, use the trimmed string up to
            // the next child <ul> tag.
            d.title = $li.html();
            iPos = d.title.search(/<ul/i);
            if( iPos >= 0 ){
                d.title = d.title.substring(0, iPos);
            }
        }
        d.title = $.trim(d.title);

        // Make sure all fields exist
        for(i=0, l=CLASS_ATTRS.length; i<l; i++){
            d[CLASS_ATTRS[i]] = undefined;
        }
        // Initialize to `true`, if class is set and collect extraClasses
        classes = this.className.split(" ");
        extraClasses = [];
        for(i=0, l=classes.length; i<l; i++){
            className = classes[i];
            if(CLASS_ATTR_MAP[className]){
                d[className] = true;
            }else{
                extraClasses.push(className);
            }
        }
        d.extraClasses = extraClasses.join(" ");

        // Parse node options from ID, title and class attributes
        tmp = $li.attr("title");
        if( tmp ){
            d.tooltip = tmp; // overrides <a title='...'>
        }
        tmp = $li.attr("id");
        if( tmp ){
            d.key = tmp;
        }
        // If a data attribute is present, evaluate as a JavaScript object
        // if( $li.attr("data") ) {
        //     var dataAttr = $.trim($li.attr("data"));
        //     if( dataAttr ) {
        //         if( dataAttr.charAt(0) != "{" ){
        //             dataAttr = "{" + dataAttr + "}";
        //         }
        //         try {
        //             $.extend(data, eval("(" + dataAttr + ")"));
        //         } catch(e) {
        //             throw ("Error parsing node data: " + e + "\ndata:\n'" + dataAttr + "'");
        //         }
        //     }
        // }
//        that.debug("parse ", d);
//        var childNode = parentTreeNode.addChild(data);
        // Recursive reading of child nodes, if LI tag contains an UL tag
        $ul = $li.find(">ul:first");
        if( $ul.length ) {
            d.children = [];
            _loadFromHtml.call(that, $ul, d.children); // must use 'that', because 'this' is the each() context
        }else{
            d.children = d.lazy ? undefined : null;
        }
        children.push(d);
    });
}

/*******************************************************************************
 * DynatreeNode
 */

// Top-level Dynatree node attributes, that can be set by dict
var NODE_ATTRS = ["active", "extraClasses", "expanded", "focus", "folder", "key", "lazy", "nolink", "selected", "title"];

var DynatreeNode = function(parent, data){
    var i, l, name, cl;

    this.parent = parent;
    this.tree = parent.tree;
    this.ul = null;
    this.li = null;  // <li id='key' dtnode=this> tag

    // copy attributes from data object
    for(i=0, l=NODE_ATTRS.length; i<l; i++){
        name = NODE_ATTRS[i];
        this[name] = data[name];
    }
    // fix missing key
    if(!this.key){
        this.key = "id_" + DT._nextNodeKey++;
    }
    // Create child nodes
    cl = data.children && data.children.length;
    if(cl){
        this.children = [];
        for(i=0; i<cl; i++){
            this.children.push(new DynatreeNode(this, data.children[i]));
        }
    }else{
        this.children = null;
    }
};

$.extend(DynatreeNode.prototype, {
    // fromDict: function(data) {
    // },
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.debug.apply(this, arguments);
    },

    expand: function(flag){
        return this.tree._callHook("nodeExpand", this, flag);
    },
    /** Return node depth. 0: System root node, 1: visible top-level node.
     */
    getLevel: function() {
        var level = 0;
        var dtn = this.parent;
        while( dtn ) {
            level++;
            dtn = dtn.parent;
        }
        return level;
    },

    /** Check if node has children (returns undefined, if not sure). */
    hasChildren: function() {
        if(this.lazy){
            if(this.children === null || this.children === undefined){
                // Not yet loaded
                return undefined;
            }else if(this.children.length === 0){
                // Loaded, but response was empty
                return false;
            }else if(this.children.length === 1 && this.children[0].isStatusNode()){
                // Currently loading or load error
                return undefined;
            }
            return true;
        }
        return !!this.children;
    },

    isFirstSibling: function() {
        var p = this.parent;
        return !p || p.children[0] === this;
    },

    isLastSibling: function() {
        var p = this.parent;
        return !p || p.children[p.children.length-1] === this;
    },

    toString: function() {
        return "DynatreeNode<" + this.title + ">";
    },
    visit: function(fn, includeSelf) {
        // Call fn(node) for all child nodes. Stop iteration, if fn() returns false.
        var res = true,
            children = this.children;
        if( includeSelf === true ) {
            res = fn(this);
            if( res === false || res === "skip" ){
                return res;
            }
        }
        if(children){
            for(var i=0, l=children.length; i<l; i++){
                res = children[i].visit(fn, true);
                if( res === false ){
                    break;
                }
            }
        }
        return res;
    },

    visitParents: function(fn, includeSelf) {
        // Visit parent nodes (bottom up)
        if(includeSelf && fn(this) === false){
            return false;
        }
        var p = this.parent;
        while( p ) {
            if(fn(p) === false){
                return false;
            }
            p = p.parent;
        }
        return true;
    }
});


/*******************************************************************************
 * Dynatree
 */

var Dynatree = function($widget){
    this.$widget = $widget;
    this.$div = $widget.element;
    this.options = $widget.options;
    this.root = null;
//    this.$root = null;  // outer <ul class='dynatree-container'>
    this._id = $.ui.dynatree._nextId++;

    this.fromDict({children: null});
};

$.extend(Dynatree.prototype, {
    /** Return a context object that can be re-used for _callHook(). */
    _makeHookContext: function(obj, orgEvent) {
        if(obj.node !== undefined){
            // obj is already a context object
            if(orgEvent){
                $.error("invalid args");
            }
            return obj;
        }else if(obj.tree){
            // obj is a DynatreeNode
            var tree = obj.tree;
            return { node: obj, tree: tree, widget: tree.$widget, options: tree.$widget.options, orgEvent: orgEvent };
        }else if(obj.$widget){
            // obj is a Dynatree
            return { node: null, tree: obj, widget: obj.$widget, options: obj.$widget.options, orgEvent: orgEvent };
        }
        $.error("invalid args");
    },
    /** Trigger a hook function: funcName(ctx, [...]). 
     * with ctx = {
     *     node: ...
     *     tree: ...
     *     options: ...
     *     orgEvent: ...
     *     widget: ...
     * }
     * 
     */
    _callHook: function(funcName, contextObject, _extraArgs) {
        var ctx = this._makeHookContext(contextObject),
            fn = this[funcName],
            args = Array.prototype.slice.call(arguments, 2);
        if(!$.isFunction(fn)){
            $.error("_callHook('" + funcName + "') is not a function");
        }
        args.unshift(ctx);
        this.debug("_hook", funcName, ctx.node && ctx.node.toString() || ctx.tree.toString(), args);
        return fn.apply(this, args);
    },
    count: function() {
        return this.root.countChildren();
    },
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.debug.apply(this, arguments);
    },
    foo: function(msg){
        Array.prototype.unshift.call(arguments, "base.foo");
        this.debug.apply(this, arguments);
    },
    /** Initiallize the tree */
    fromDict: function(data) {
        // Create a node without parent.
        var fakeParent = { tree: this },
            $ul;
        this.root = new DynatreeNode(fakeParent, {
            title: "root",
            key: "root_" + this.$widget._id,
            children: data.children
        });
        this.root.parent = null;
        // Remove previous markup if any
        this.$div.find(">ul.dynatree-container").remove();
        // Create root markup
        $ul = $("<ul>", {
            "class": "dynatree-container"
        }).appendTo(this.$div);
        this.root.ul = $ul[0];
        // Set tree title from node data
        this.title = data.title;
    },
    getNodeByKey: function(key, searchRoot) {
        // Search the DOM by element ID (assuming this is faster than traversing all nodes).
        // $("#...") has problems, if the key contains '.', so we use getElementById()
        if(!searchRoot){
            var el = document.getElementById(this.options.idPrefix + key);
            if( el ){
                return el.dtnode ? el.dtnode : null;
            }
        }
        // Not found in the DOM, but still may be in an unrendered part of tree
        var match = null;
        searchRoot = searchRoot || this.root;
        searchRoot.visit(function(node){
//          window.console.log("%s", node);
            if(node.key === key) {
                match = node;
                return false;
            }
        }, true);
        return match;
    },

    info: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.info.apply(this, arguments);
    },
    /** Activate node. */
    nodeActivate: function(ctx, flag) {
        // Handle user click / [space] / [enter], according to clickFolderMode.
        var node = ctx.node,
            opts = ctx.tree.options,
            userEvent = !!ctx.orgEvent;
        // Honor `clikcFolderMode` for
        this.debug("nodeActivate", !!flag);
    },
    /** Collapse node, if expanded (shortcut to nodeExpand(ctx, false)). */
    nodeCollapse: function(ctx) {
        return this.nodeExpand(ctx, false);
    },
    nodeDblclick: function(ctx) {
    },
    /** Expand node, return Deferred.promise. */
    nodeExpand: function(ctx, flag) {
        var node = ctx.node,
            opts = ctx.widget.options;
        flag = (flag !== false);

// TODO: dfd.progress verwenden: ('rendered', 'done')

        node.debug("nodeExpand(" + flag + ")");
        // TODO: !!node.expanded is nicer, but doens't pass jshint
        // https://github.com/jshint/jshint/issues/455
//        if( !!node.expanded === !!flag){  
        if((node.expanded && flag) || (!node.expanded && !flag)){ 
            // Nothing to do
            node.debug("nodeExpand(" + flag + "): nothing to do");
            return $.Deferred(function(){this.resolve();}); 
        }
        if(flag && !node.lazy && !node.hasChildren() ){
            // Prevent expanding of empty nodes
            return $.Deferred(function(){this.reject();});
        }
        if( !flag && node.getLevel() < opts.minExpandLevel ) {
            // Prevent collapsing locked levels
            return $.Deferred(function(){this.reject();});
        }
        if ( this._triggerNodeEvent("onQueryExpand", node, ctx.orgEvent) === false ){
            // Callback returned false
            return $.Deferred(function(){this.reject();});
        }

        node.expanded = flag;

        // Persist expand state
        // if( opts.persist ) {
        //     if( bExpand ){
        //         this.tree.persistence.addExpand(this.data.key);
        //     }else{
        //         this.tree.persistence.clearExpand(this.data.key);
        //     }
        // }

        // Do not apply animations in init phase, or before lazy-loading
        // var allowEffects = !(this.data.isLazy && this.childList === null)
        //     && !this._isLoading
        //     && !forceSync;
        // this.render(allowEffects);
        var dfd = this._callHook("nodeRender", ctx);

        // Auto-collapse mode: collapse all siblings
        // if( this.bExpanded && this.parent && opts.autoCollapse ) {
        //     var parents = this._parentList(false, true);
        //     for(var i=0, l=parents.length; i<l; i++){
        //         parents[i].collapseSiblings();
        //     }
        // }

        // If the currently active node is now hidden, deactivate it
        // if( opts.activeVisible && this.tree.activeNode && ! this.tree.activeNode.isVisible() ) {
        //     this.tree.activeNode.deactivate();
        // }

        // Expanding a lazy node: set 'loading...' and call callback
        // if( bExpand && this.data.isLazy && this.childList === null && !this._isLoading ) {
        //     this._loadContent();
        //     return;
        // }
        this._triggerNodeEvent("onExpand", ctx);
        // if ( opts.onExpand ){
        //     opts.onExpand.call(this.tree, bExpand, this);
        // }
        return dfd;
    },
    nodeFocus: function(ctx) {
        // TODO: check, if we already have focus
//      this.tree.logDebug("dtnode.focus(): %o", this);
        this.nodeMakeVisible(ctx);
        try {
            $(ctx.node.span).find(">a").focus();
        } catch(e) { }
    },
    /** Default handling for mouse keydown events. */
    nodeKeydown: function(ctx) {
        var event = ctx.orgEvent;
    },
    /** Default handling for mouse keypress events. */
    nodeKeypress: function(ctx) {
        var event = ctx.orgEvent;
    },
    nodeMakeVisible: function(ctx) {
    },
    /** Helper for default renderer. */
    _fixOrder: function(node) {
        /**
         * Make sure, that <li> order matches node.children order.
         */
        var cl = node.children;
        if( !cl || !node.ul ){
            return;
        }
        var childLI = node.ul.firstChild;
        for(var i=0, l=cl.length-1; i<l; i++) {
            var childNode1 = cl[i];
            var childNode2 = childLI.dtnode;
            if( childNode1 !== childNode2 ) {
                node.debug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
                node.ul.insertBefore(childNode1.li, childNode2.li);
            } else {
                childLI = childLI.nextSibling;
            }
        }
    },

    /**
     * Create <li><span>..</span> .. </li> tags for this node.
     *
     * <li id='KEY' dtnode=NODE> // This div contains the node's span and list of child div's.
     *   <span class='dynatree-node'>S S S A</span> // Span contains graphic spans and title <a> tag
     *   <ul> // only present, when node has children
     *       <li id='KEY' dtnode=NODE>child1</li>
     *       <li id='KEY' dtnode=NODE>child2</li>
     *   </ul>
     * </li>
     */
    nodeRender: function(ctx, force, deep, hideChildren, _recursive) {
        var node = ctx.node,
            parent = node.parent,
            $parentUL, $li, i, l, text;
//        DT.debug("nodeRender", node.toString());
        if(!ctx.node.parent){
            $.error("Cannot call nodeRender(root)");
        }
        // Make sure parent has a <ul> to hold this <li>
        if( !parent.ul ){
            alert("OBSOLETE?"); // TODO: remove
            parent.ul = document.createElement("ul");
            if(hideChildren === true){
                // hide UL, so we can use an animation to show it later
                parent.ul.style.display = "none";
            }
            parent.li.appendChild(parent.ul);
        }

        var tree = ctx.tree,
            opts = ctx.options,
//            cn = opts.classNames,
            firstTime = false;

        // if(node.li && force){
        //     $(node.li).remove();
        //     node.li = null;
        // }

        // Create <li><span /> </li>
        if( ! node.li ) {
            firstTime = true;
            node.li = document.createElement("li");
            node.li.dtnode = node;
            if( node.key && opts.generateIds ){
                node.li.id = opts.idPrefix + node.key;
            }
            node.span = document.createElement("span");
            node.span.className = "dynatree-title";
            node.li.appendChild(node.span);

            // set node connector images, links and text
//              this.span.innerHTML = this._getInnerHtml();

            parent.ul.appendChild(node.li);
        }
        // set node connector images, links and text
        var level = node.getLevel(),
            ares = [];

        // connector (expanded, expandable or simple)
        if( level < opts.minExpandLevel ) {
            if(level > 1){
                ares.push("<span class='dynatree-connector'></span>");
            }
            // .. else (i.e. for root level) skip expander/connector altogether
        } else if( node.hasChildren() !== false ) {
            ares.push("<span class='dynatree-expander'></span>");
        } else {
            ares.push("<span class='dynatree-connector'></span>");
        }
        // Checkbox mode
        if( opts.checkbox && node.hideCheckbox !== true && !node.isStatusNode ) {
            ares.push("<span class='dynatree-checkbox'></span>");
        }
        // folder or doctype icon
        if ( node.icon ) {
            ares.push("<img src='" + opts.imagePath + node.icon + "' alt='' />");
        } else if ( this.icon !== false ) {
            // icon == false means 'no icon', icon == null means 'default icon'
            ares.push("<span class='dynatree-icon'></span>");
        }
        // node title
        var nodeTitle = "";
        if ( opts.onCustomRender ){
            nodeTitle = opts.onCustomRender.call(tree, this) || "";
        }
        if(!nodeTitle){
            var tooltip = node.tooltip ? ' title="' + node.tooltip.replace(/\"/g, '&quot;') + '"' : '',
                href = node.href || "#";
            if( opts.noLink || this.nolink ) {
                // TODO: move style='' to CSS
                nodeTitle = '<span style="display:inline-block;" class="dynatree-title"' + tooltip + '>' + node.title + '</span>';
            } else {
                nodeTitle = '<a href="' + href + '" class="dynatree-title"' + tooltip + '>' + node.title + '</a>';
            }
        }
        ares.push(nodeTitle);

        node.span.innerHTML = ares.join("");

        // Update element classes according to node state
        this.nodeUpdate(ctx);

        // Allow tweaking, binding, after node was created for the first time
        if(firstTime && opts.onCreate){
            opts.onCreate.call(tree, this, this.span);
        }
        // Hide children, if node is collapsed
//          this.ul.style.display = ( this.bExpanded || !parent ) ? "" : "none";
        // Allow tweaking after node state was rendered
        if(opts.onRender){
            opts.onRender.call(tree, this, this.span);
        }
        // Visit child nodes
        if( (node.expanded || deep === true) && node.children ) {
            // Create a UL to hold the children
            if( !node.ul ){
                node.ul = document.createElement("ul");
                if(hideChildren === true && !_recursive){
                    // hide top UL, so we can use an animation to show it later
                    node.ul.style.display = "none";
                }
                node.li.appendChild(node.ul);
            }
            // Add child markup
            for(i=0, l=node.children.length; i<l; i++) {
                var subCtx = $.extend({}, ctx, {node: node.children[i]}); 
                this.nodeRender(subCtx, force, deep, false, true);
            }
            // Make sure the tag order matches the child array
            this._fixOrder(node);
        }
        // Hide children, if node is collapsed
        if( node.ul ) {
            var isHidden = (node.ul.style.display === "none");
            var isExpanded = !!node.expanded;
//          logMsg("isHidden:%s", isHidden);
            if( !_recursive && opts.fx && (isHidden === isExpanded) ) {
                var duration = opts.fx.duration || 200;
                $(node.ul).animate(opts.fx, duration);
            } else {
                node.ul.style.display = ( node.expanded || !parent ) ? "" : "none";
            }
        }
    },
    /** Update element classes according to node state. */
    nodeUpdate: function(ctx) {
        // Set classes for current status
        var node = ctx.node,
            tree = ctx.tree,
            isLastSib = node.isLastSibling(),
            cnList = [];
        cnList.push("dynatree-node");
        if( tree.activeNode === node ){
            cnList.push("dynatree-active");
        }
        if( node.expanded ){
            cnList.push("dynatree-expanded");
        }
        if( node.folder ){
            cnList.push("dynatree-folder");
        }
        if( node.hasChildren() !== false ){
            cnList.push("dynatree-has-children");
        }
        if( isLastSib ){
            cnList.push("dynatree-lastsib");
        }
        if( node.lazy && node.children === null ){
            cnList.push("dynatree-lazy");
        }
        if( node.hasSubSel ){
            cnList.push("dynatree-partsel");
        }
        if( node.selected ){
            cnList.push("dynatree-selected");
        }
        if( node.extraClasses ){
            cnList.push(node.extraClasses);
        }
        // IE6 doesn't correctly evaluate multiple class names,
        // so we create combined class names that can be used in the CSS
        cnList.push("dynatree-exp-" +
                (node.expanded ? "e" : "c") +
                (node.lazy && node.children === null ? "d" : "") +
                (isLastSib ? "l" : "")
                );
        cnList.push("dynatree-ico-" +
                (node.expanded ? "e" : "c") +
                (node.folder ? "f" : "")
                );
        node.span.className = cnList.join(" ");

        // TODO: we should not set this in the <span> tag also, if we set it here:
        node.li.className = isLastSib ? "dynatree-lastsib" : "";
    },    
    /**  */
    nodeToggleExpand: function(ctx) {
        return this.nodeExpand(ctx, !ctx.node.expanded);
    },
    /** _Default handling for mouse click events. */
    nodeClick: function(ctx) {
//      this.tree.logDebug("dtnode.onClick(" + event.type + "): dtnode:" + this + ", button:" + event.button + ", which: " + event.which);
        var event = ctx.orgEvent,
            target = DT.getEventTarget(event),
            node = ctx.node, //target.node,
            targetType = target.type;
        // TODO: use switch
        if( targetType === "expander" ) {
            // Clicking the expander icon always expands/collapses
            this._callHook("nodeToggleExpand", ctx);
            this._callHook("nodeFocus", ctx, true); // issue 95
        } else if( targetType === "checkbox" ) {
            // Clicking the checkbox always (de)selects
            this._callHook("nodeToggleSelect", ctx);
            this._callHook("nodeFocus", ctx, true); // issue 95
        } else {
            this._callHook("nodeActivate", ctx, true);
//            node._userActivate();
            var aTag = node.span.getElementsByTagName("a");
            if(aTag[0]){
                // issue 154
                // TODO: check if still required on IE 9:
                // Chrome and Safari don't focus the a-tag on click,
                // but calling focus() seem to have problems on IE:
                // http://code.google.com/p/dynatree/issues/detail?id=154
                if(!$.browser.msie){
                    aTag[0].focus();
                }
            }else{
                // 'noLink' option was set
                return true;
            }
        }
        // Make sure that clicks stop, otherwise <a href='#'> jumps to the top
        event.preventDefault();
    },
    /** Widget was created. */
    treeCreate: function(ctx) {
    },
    /** Widget was (re-)initialized. */
    treeInit: function(ctx) {
        this.treeLoad(ctx);
    },
    /** Parse Dynatree from HTML <ul> markup */
    treeLoad: function(ctx) {
        var data = { children: [] },
            $container = ctx.widget.element,
            type = $container.data("type") || "html",
            $ul;

        // TODO: support json

        switch(type){
        case "html":
            $ul = $container.find(">ul:first");
            $ul.addClass("ui-dynatree-source ui-helper-hidden");
            _loadFromHtml.call(this, $ul, data.children);
            break;
        case "json":
//            $().addClass("ui-helper-hidden");
            data = $.parseJSON($container.text());
            break;
        default:
            $.error("Invalid data-type: " + type);
        }
        $container.addClass("ui-widget ui-widget-content ui-corner-all");
//        this.debug(data);
        this.fromDict(data);
//        this.debug("tree", this.tree);
        this.render();
        // TODO: return Deferred
        return this._triggerTreeEvent("load");
    },
    render: function() {
        var children = this.root.children,
            i;
        for(i=0; i<children.length; i++){
            // children[i].render(true);
            this._callHook("nodeRender", children[i], true);
        }
    },
    toString: function(){
        return "Dynatree<" + this._id + ">";
    },
    /** _trigger a widget event with additional node ctx. */
    _triggerNodeEvent: function(node, type, orgEvent) {
        var ctx = { node: node, tree: node.tree, widget: this };
        this.debug("_trigger", type, node, ctx);
        return this.$widget._trigger(type, orgEvent, ctx);
    },
    /** _trigger a widget event with additional tree data. */
    _triggerTreeEvent: function(type, orgEvent) {
        var ctx = { tree: this.tree, widget: this };
        this.debug("_trigger", type, ctx);
        return this.$widget._trigger(type, orgEvent, ctx);
    },
    visit: function(fn) {
        return this.root.visit(fn, false);
    },

    warn: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.warn.apply(this, arguments);
    }
});


/*******************************************************************************
 * jQuery UI widget boilerplate
 */

$.widget("ui.dynatree", {
    // These options will be used as defaults
    options: {
        disabled: false,
        source: null,
        extensions: [],
        fx: { height: "toggle", duration: 200 },
        hooks: {},
        // events
        lazyload: null
    },
    // Set up the widget, Called on first $().dynatree()
    _create: function() {
        this.tree = new Dynatree(this);
        this._bind();
        this.$source = this.source
            || this.element.data("type") === "json" ? this.element
            : this.element.find(">ul:first");
        // Subclass Dynatree instance with all enabled extensions
        var extensions = this.options.extensions,
            base = this.tree;
        for(var i=0; i<extensions.length; i++){
            var extName = extensions[i],
                extension = $.ui.dynatree._extensions[extName];
//            extension = $.extend({}, extension);
            // this.tree.debug("subclass", base, extension);
            // _subclassObject(base, extension);
            _subclassObject(this.tree, extension);
            this.tree.options[extName] = $.extend({}, extension.options, this.tree.options[extName]);
            base = extension;
        }
        //
        this.tree._callHook("treeCreate", this.tree);
        this.tree._triggerTreeEvent("create");
    },

    // Called on every $().dynatree()
    _init: function() {
        this.tree._callHook("treeInit", this.tree);
        this.tree._triggerTreeEvent("init");
    },

    // Use the _setOption method to respond to changes to options
    _setOption: function(key, value) {
        var callDefault = true;
        switch( key ) {
            case "disabled":
            // handle enable/disable
            break;
            case "keyboard":
            //
            break;
        }
        if(callDefault){
            // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
            $.Widget.prototype._setOption.apply(this, arguments);
            // TODO: In jQuery UI 1.9 and above, you use the _super method instead
//          this._super( "_setOption", key, value );
        }
    },

    // Use the destroy method to clean up any modifications your widget has made to the DOM
    destroy: function() {
        this._unbind();
        this.element.removeClass("ui-widget ui-widget-content ui-corner-all");
        this.tree.$div.find(">ul.dynatree-container").remove();
        var _ = this.$source && this.$source.removeClass("ui-helper-hidden");
        // In jQuery UI 1.8, you must invoke the destroy method from the base widget
        $.Widget.prototype.destroy.call( this );
        // TODO: In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
    },

    // -------------------------------------------------------------------------

    /** Add mouse and kyboard handlers to the container */
    _bind: function() {
        var that = this,
            eventNames = $.map(["click", "dblclick", "keypress", "keydown",
                "focusin", "focusout", "focus", "blur", "mousein", "mouseout"],
                function(name){
                    return name + "." + that.widgetName + "-" + that._id;
            }).join(" ");

        this._unbind();
        this.element.bind(eventNames, function(event){
            var node = DT.getNode(event.target);
            if( !node ){
                return true;  // Allow bubbling of other events
            }
            var data = that.tree,
                tree = that.tree,
                o = that.options,
                ctx = tree._makeHookContext(node, event),
                prevPhase = tree.phase;
            that.tree.debug("event(%s): node: %s", event.type, node);
            try {
                tree.phase = "userEvent";
                switch(event.type) {
                case "click":
                    // return ( that._triggerNodeEvent(node, "click", event) === false ) ? false : node._onClick(event);
                    return ( tree._triggerNodeEvent(node, "click", event) === false ) ? false : tree._callHook("nodeClick", ctx);
                case "dblclick":
                    return ( tree._triggerNodeEvent(node, "dblclick", event) === false ) ? false : tree._callHook("nodeDblclick", ctx);
                case "keydown":
                    return ( tree._triggerNodeEvent(node, "keydown", event) === false ) ? false : tree._callHook("nodeKeydown", ctx);
                case "keypress":
                    return ( tree._triggerNodeEvent(node, "keypress", event) === false ) ? false : tree._callHook("nodeKeypress", ctx);
                // case "focusin":
                // case "focusout":
                //     return tree._onFocus(event);
                }
//             } catch(e) {
// //                var _ = null; // issue 117 // TODO
//                 $.error(e);
            } finally {
                tree.phase = prevPhase;
            }
        });
    },
    /** Return Dynatree instance. */
    getTree: function() {
        return this.tree;
    },
    /** Remove all event handlers for our namespace */
    _unbind: function() {
        this.element.unbind("." + this.widgetName + "-" + this._id);
    }
});

// $.ui.dynatree was created by the widget factory. Create a local shortcut:
var DT = $.ui.dynatree;

/*******************************************************************************
 * Static members in the jQuery.ui.dynatree namespace
 */

$.extend($.ui.dynatree, {
    version: "2.0.0pre",
    debugLevel: 2,
    _nextId: 1,
    _nextNodeKey: 1,
    _extensions: {},

    debug: function(msg){
        /*jshint expr:true */
        ($.ui.dynatree.debugLevel >= 2) && window.console && window.console.log && window.console.log.apply(window.console, arguments);
    },
    error: function(msg){
        /*jshint expr:true */
        window.console && window.console.error && window.console.error.apply(window.console, arguments);
    },
    /** Return a {node: DynatreeNode, type: TYPE} for a mouse event. */
    getEventTarget: function(event){
        var tcn = event && event.target ? event.target.className : "",
            res = {node: this.getNode(event.target), type: undefined};
        // TODO: use map for fast lookup
        if( tcn === "dynatree-title" ){
            res.type = "title";
        }else if( tcn === "dynatree-expander" ){
            res.type = "expander";
        }else if( tcn === "dynatree-checkbox" ){
            res.type = "checkbox";
        }else if( tcn === "dynatree-icon" ){
            res.type = "icon";
        }else if( tcn === "dynatree-connector" ){
            res.type = "prefix";
        }else if( tcn.indexOf("dynatree-node") >= 0 ){
            // FIX issue #93
            // TODO: implement
            res.type = this._getTypeForOuterNodeEvent(event);
        }
        return res;
    },
    /** Return a DynatreeNode instance from element. */
    getNode: function(el){
        if(el instanceof DynatreeNode){
            return el; // el already was a DynatreeNode
        }
        if(el.selector !== undefined){
            el = el[0]; // el was a jQuery object: use the DOM element
        }
        // $el.parents("[dtnode]") does not work (jQuery 1.6.1), maybe because
        // dtnode is a property, not an attribute. This is faster anyway:
        while( el ) {
            if(el.dtnode) {
                return el.dtnode;
            }
            el = el.parentNode;
        }
        return null;
    },
    info: function(msg){
        /*jshint expr:true */
        (DT.debugLevel >= 1) && window.console && window.console.info && window.console.info.apply(window.console, arguments);
    },
    /** */
    registerExtension: function(name, definition){
        $.ui.dynatree._extensions[name] = definition;
    },
    warn: function(msg){
        /*jshint expr:true */
        window.console && window.console.warn && window.console.warn.apply(window.console, arguments);
    }
});


}(jQuery));  // 


/*******************************************************************************
 * Dynatree extension: profiler
 */
(function($) {
    $.ui.dynatree.registerExtension("profiler", {
        // Default options for this extension
        options: {
            prefix: ""
        },
        // Overide virtual methods for this extension
        nodeRender: function(ctx){
            // ctx.tree.debug("**** PROFILER nodeRender");
            var s = this.options.prefix + "render '" + ctx.node + "'";
            window.console.time(s);
            this._super(ctx);
            window.console.timeEnd(s);
        }
     });
}(jQuery));


/*******************************************************************************
 * Dynatree extension: aria
 */
(function($) {
    $.ui.dynatree.registerExtension("aria", {
        // Default options for this extension.
        options: {
        },
        // Overide virtual methods for this extension.
        // `this`       : is this extension object
        // `this._base` : the Dynatree instance
        // `this._super`: the virtual function that was overriden
        treeInit: function(ctx){
            // TODO: bind to option change to set aria-disabled
            // ctx.widget$( "#something" ).multi( "option", "disabled", function(event){ 
            //     alert( "I cleared the multiselect!" ); 
            // });
            this._super(ctx);
            $(ctx.tree.root.ul).addClass("role-tree");
        },
        nodeUpdate: function(ctx){
            this._super(ctx);
            $(ctx.node.li).addClass("role-treeitem");
        }
     });
}(jQuery));
