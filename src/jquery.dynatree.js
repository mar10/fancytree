/*************************************************************************
    jquery.dynatree.js
    Dynamic tree view control, with support for lazy loading of branches.

    Copyright (c) 2008-2012, Martin Wendt (http://wwWendt.de)
    Dual licensed under the MIT or GPL Version 2 licenses.
    http://code.google.com/p/dynatree/wiki/LicenseInfo

    A current version and some documentation is available at
        http://dynatree.googlecode.com/

TODO:
- Call funcs:
  $("#tree").dynatree("getRootNode")
  $("#tree").data("dynatree").getRootNode()

- A mechanism for facilitating and responding to changes to plugin options after instantiation
  $( "#something" ).multi( "option", "clear" , function ( event ) { alert( "I cleared the multiselect!" ); } );

- source may be a function too

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
 * Subclass `base` by creating proxy function
 */
function _subclassObject(base, extension, extName){
    for(var fn in extension){
        if(typeof extension[fn] === "function"){
            if(typeof base[fn] === "function"){
                // override existing method
                base[fn] = _makeVirtualFunction(fn, base, extension);
            }else if(fn[0] === "_"){
                // Create private methods in tree.EXTENSION namespace
                if(!base[extName]){
                    base[extName] = {};
                }
                base[extName][fn] = $.proxy(extension[fn], extension);
            }else{
                $.error("Could not override tree." + fn + ". Use prefix '_' to create tree." + extName + "._" + fn);
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
var NODE_ATTRS = ["expanded", "extraClasses", /*"focus", */ "folder", "href", "key", 
                  "lazy", "nolink", "selected", "target", "title", "tooltip"];
/**
 * Tree node
 * @class
 * @name DynatreeNode
 */
var DynatreeNode = function(parent, data){
    var i, l, name, cl;

    this.parent = parent;
    this.tree = parent.tree;
    this.ul = null;
    this.li = null;  // <li id='key' dtnode=this> tag
    this.isStatusNode = false;

    // copy attributes from data object
    for(i=0, l=NODE_ATTRS.length; i<l; i++){
        name = NODE_ATTRS[i];
        this[name] = data[name];
    }
    // TODO: copy all other attributes to this.data.xxx

    // Fix missing key
    if(!this.key){
        this.key = "_" + DT._nextNodeKey++;
    }
    // Fix tree.activeNode
    // TODO: not elegant: we use data.active as marker to set tree.activeNode
    // when loading from a dictionary.
    if(data.active){
        _assert(this.tree.activeNode === null, "only one active node allowed");
        this.tree.activeNode = this;
    }
    // TODO: handle data.focus = true
    // Create child nodes
    this.children = null;
    cl = data.children;
    if(cl && cl.length){
        this.addChildren(cl);
    }
};

$.extend(DynatreeNode.prototype, 
	/** @lends DynatreeNode.prototype */
	{
    addChildren: function(children){
        _assert(!!children && (!this.children || this.children.length === 0), "only init supported");
        this.children = [];
        for(var i=0, l=children.length; i<l; i++){
            this.children.push(new DynatreeNode(this, children[i]));
        }
    },
	collapseSiblings: function() {
        return this.tree._callHook("nodeCollapseSiblings", this);
	},
    countChildren: function() {
        var cl = this.children, i, l, n;
        if( !cl ){
            return 0;
        }
        n = cl.length;
        for(i=0, l=n; i<l; i++){
            n += cl[i].countChildren();
        }
        return n;
    },
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.debug.apply(this, arguments);
    },
    getChildren: function() {
		if(this.hasChildren() === undefined){ // TODO; only required for lazy nodes? 
			return undefined; // Lazy node: unloaded, currently loading, or load error
		}
		return this.children;
    },
    getFirstChild: function() {
        return this.children ? this.children[0] : null;
    },
	getKeyPath: function(excludeSelf) {
		_raiseNotImplemented(); // TODO: implement
		/*
		var path = [];
		this.visitParents(function(node){
			if(node.parent){
				path.unshift(node.data.key);
			}
		}, !excludeSelf);
		return "/" + path.join(this.tree.options.keyPathSeparator);
		*/
	},
    getLastChild: function() {
        return this.children ? this.children[this.children.length - 1] : null;
    },
    /** Return node depth. 0: System root node, 1: visible top-level node. */
    getLevel: function() {
        var level = 0,
            dtn = this.parent;
        while( dtn ) {
            level++;
            dtn = dtn.parent;
        }
        return level;
    },
    getNextSibling: function() {
        // TODO: use indexOf, if available: (not in IE6)
        if( this.parent ){
            var ac = this.parent.children;
            for(var i=0, l=ac.length-1; i<l; i++){ // up to length-2, so next(last) = null
                if( ac[i] === this ){
                    return ac[i+1];
                }
            }
        }
        return null;
    },
    getParent: function() {
        // TODO: return null for top-level nodes?
        return this.parent;
    },
    getParentList: function(includeRoot, includeSelf) {
        var l = [],
            dtn = includeSelf ? this : this.parent;
        while( dtn ) {
            if( includeRoot || dtn.parent ){
                l.unshift(dtn);
            }
            dtn = dtn.parent;
        }
        return l;
    },
    getPrevSibling: function() {
        if( this.parent ){
            var ac = this.parent.children;
            for(var i=1, l=ac.length; i<l; i++){ // start with 1, so prev(first) = null
                if( ac[i] === this ){
                    return ac[i-1];
                }
            }
        }
        return null;
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
            }else if(this.children.length === 1 && this.children[0].isStatusNode ){
                // Currently loading or load error
                return undefined;
            }
            return true;
        }
        return !!this.children;
    },
    isActive: function() {
		return (this.tree.activeNode === this);
    },
	isChildOf: function(otherNode) {
		return (this.parent && this.parent === otherNode);
	},
	isDescendantOf: function(otherNode) {
		if(!otherNode || otherNode.tree !== this.tree){
			return false;
		}
		var p = this.parent;
		while( p ) {
			if( p === otherNode ){
				return true;
			}
			p = p.parent;
		}
		return false;
	},
	isExpanded: function() {
		return !!this.expanded;
	},
    isFirstSibling: function() {
        var p = this.parent;
        return !p || p.children[0] === this;
    },
	isFocused: function() {
		return (this.tree.focusNode === this);
	},
    isLastSibling: function() {
        var p = this.parent;
        return !p || p.children[p.children.length-1] === this;
    },
	isLazy: function() {
		return !!this.lazy;
	},
	isLoading: function() {
		_raiseNotImplemented(); // TODO: implement
	},
    // TODO: use _isStatusNode as class attribute name
//	isStatusNode: function() {
//		return (this.data.isStatusNode === true);
//	},
	/** Return true, if all parents are expanded. */
	isVisible: function() {
		var parents = this.getParentList(true, false);
		for(var i=0, l=parents.length; i<l; i++){
			if( ! parents[i].expanded ){ return false; }
		}
		return true;
	},
	/** Move this node to targetNode.
	 *  @param mode {String}
	 *      'child': append this node as last child of targetNode.
	 *                This is the default. To be compatble with the D'n'd
	 *                hitMode, we also accept 'over'.
	 *  mode 'before': add this node as sibling before targetNode.
	 *  mode 'after': add this node as sibling after targetNode.
	 */
	move: function(targetNode, mode) {
		var pos;
		if(this === targetNode){
			return;
		}
		if( !this.parent  ){
			throw "Cannot move system root";
		}
		if(mode === undefined || mode === "over"){
			mode = "child";
		}
		var prevParent = this.parent;
		var targetParent = (mode === "child") ? targetNode : targetNode.parent;
		if( targetParent.isDescendantOf(this) ){
			throw "Cannot move a node to it's own descendant";
		}
		// Unlink this node from current parent
		if( this.parent.children.length === 1 ) {
			this.parent.children = this.parent.lazy ? [] : null;
			this.parent.expanded = false;
		} else {
			pos = $.inArray(this, this.parent.children);
			if( pos < 0 ){
				throw "Internal error";
			}
			this.parent.children.splice(pos, 1);
		}
		// Remove from source DOM parent
		if(this.parent.ul){
			this.parent.ul.removeChild(this.li);
		}

		// Insert this node to target parent's child list
		this.parent = targetParent;
		if( targetParent.hasChildren() ) {
			switch(mode) {
			case "child":
				// Append to existing target children
				targetParent.children.push(this);
				break;
			case "before":
				// Insert this node before target node
				pos = $.inArray(targetNode, targetParent.children);
				if( pos < 0 ){
					throw "Internal error";
				}
				targetParent.children.splice(pos, 0, this);
				break;
			case "after":
				// Insert this node after target node
				pos = $.inArray(targetNode, targetParent.children);
				if( pos < 0 ){
					throw "Internal error";
				}
				targetParent.children.splice(pos+1, 0, this);
				break;
			default:
				throw "Invalid mode " + mode;
			}
		} else {
			targetParent.children = [ this ];
		}
		// Parent has no <ul> tag yet:
		if( !targetParent.ul ) {
			// This is the parent's first child: create UL tag
			// (Hidden, because it will be
			targetParent.ul = document.createElement("ul");
			targetParent.ul.style.display = "none";
			targetParent.li.appendChild(targetParent.ul);
		}
		// Issue 319: Add to target DOM parent (only if node was already rendered(expanded))
		if(this.li){
			targetParent.ul.appendChild(this.li);
		}

		if( this.tree !== targetNode.tree ) {
			// Fix node.tree for all source nodes
			this.visit(function(node){
				node.tree = targetNode.tree;
			}, null, true);
			throw "Not yet implemented.";
		}
		// TODO: fix selection state
		// TODO: fix active state
		if( !prevParent.isDescendantOf(targetParent)) {
			prevParent.render();
		}
		if( !targetParent.isDescendantOf(prevParent) && targetParent !== prevParent) {
			targetParent.render();
		}
/*
		var tree = this.tree;
		var opts = tree.options;
		var pers = tree.persistence;


		// Always expand, if it's below minExpandLevel
//		tree.logDebug ("%s._addChildNode(%o), l=%o", this, dtnode, dtnode.getLevel());
		if ( opts.minExpandLevel >= dtnode.getLevel() ) {
//			tree.logDebug ("Force expand for %o", dtnode);
			this.bExpanded = true;
		}

		// In multi-hier mode, update the parents selection state
		// issue #82: only if not initializing, because the children may not exist yet
//		if( !dtnode.data.isStatusNode && opts.selectMode==3 && !isInitializing )
//			dtnode._fixSelectionState();

		// In multi-hier mode, update the parents selection state
		if( dtnode.bSelected && opts.selectMode==3 ) {
			var p = this;
			while( p ) {
				if( !p.hasSubSel )
					p._setSubSel(true);
				p = p.parent;
			}
		}
		// render this node and the new child
		if ( tree.bEnableUpdate )
			this.render();

		return dtnode;

*/
	},
	reloadChildren: function(callback) {
		_raiseNotImplemented(); // TODO: implement
	},
	render: function() {
		if(!this.parent){
			return this.tree.render(); //(force, deep)
		}
        return this.tree._callHook("nodeRender", this);
	},
	remove: function() {
		_raiseNotImplemented(); // TODO: implement
	},
	removeChild: function(tn) {
		_raiseNotImplemented(); // TODO: implement
	},
	removeChildren: function(isRecursiveCall, retainPersistence) {
		_raiseNotImplemented(); // TODO: implement
	},
    /** Schedule activity for delayed execution (cancel any pending request).
     *  scheduleAction('cancel') will cancel the request.
     */
    scheduleAction: function(mode, ms) {
        if( this.tree.timer ) {
            clearTimeout(this.tree.timer);
            this.tree.debug("clearTimeout(%o)", this.tree.timer);
        }
        this.tree.timer = null;
        var self = this; // required for closures
        switch (mode) {
        case "cancel":
            // Simply made sure that timer was cleared
            break;
        case "expand":
            this.tree.timer = setTimeout(function(){
                self.tree.debug("setTimeout: trigger expand");
                self.setExpanded(true);
            }, ms);
            break;
        case "activate":
            this.tree.timer = setTimeout(function(){
                self.tree.debug("setTimeout: trigger activate");
                self.setActive(true);
            }, ms);
            break;
        default:
            throw "Invalid mode " + mode;
        }
        this.tree.debug("setTimeout(%s, %s): %s", mode, ms, this.tree.timer);
    },
    setActive: function(flag){
        return this.tree._callHook("nodeSetActive", this, flag);
    },
    setExpanded: function(flag){
        return this.tree._callHook("nodeSetExpanded", this, flag);
    },
    setFocus: function(){
        return this.tree._callHook("nodeSetFocus", this);
    },
    setSelected: function(flag){
        return this.tree._callHook("nodeSetSelected", this, flag);
    },
    setTitle: function(flag){
		_raiseNotImplemented(); // TODO: implement
    },
    toggleExpanded: function(){
        return this.tree._callHook("nodeToggleExpanded", this);
    },
    toggleSelected: function(){
        return this.tree._callHook("nodeToggleSelected", this);
    },
    toString: function() {
        return "DynatreeNode<" + this.key + ", '" + this.title + "'>";
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


/* *****************************************************************************
 * Dynatree
 */
/**
 * @class 
 * @name Dynatree
 */
var Dynatree = function($widget){
    // TODO: rename $widget to widget (it's not a jQuery object)
    this.$widget = $widget;
    this.$div = $widget.element;
    this.options = $widget.options;
    this._id = $.ui.dynatree._nextId++;
    this.activeNode = null;
    this.focusNode = null;
    this.statusClassPropName = "span";

    // Remove previous markup if any
    this.$div.find(">ul.dynatree-container").remove();

    // Create a node without parent.
    var fakeParent = { tree: this },
        $ul;
    this.rootNode = new DynatreeNode(fakeParent, {
        title: "root",
        key: "root_" + this._id,
        children: null
    });
    this.rootNode.parent = null;

    // Create root markup
    $ul = $("<ul>", {
        "class": "dynatree-container"
    }).appendTo(this.$div);
    this.rootNode.ul = $ul[0];
    this.nodeContainerAttrName = "li";
};

$.extend(Dynatree.prototype, 
	/** @lends Dynatree.prototype */ 
	{
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
        return this.rootNode.countChildren();
    },
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.debug.apply(this, arguments);
    },
    ///** Initiallize the tree */
    // fromDict: function(data) {
    //     // Create a node without parent.
    //     var fakeParent = { tree: this },
    //         $ul, 
    //         children = $.isArray(data) ? data : data.children;
    //     if(children !== null && !$.isArray(children)){
    //         $.error("fromDict data must be null, an array, or have a .children property");
    //     }
    //     this.rootNode = new DynatreeNode(fakeParent, {
    //         title: "root",
    //         key: "root_" + this.$widget._id,
    //         children: children
    //     });
    //     this.rootNode.parent = null;
    //     // Remove previous markup if any
    //     this.$div.find(">ul.dynatree-container").remove();
    //     // Create root markup
    //     $ul = $("<ul>", {
    //         "class": "dynatree-container"
    //     }).appendTo(this.$div);
    //     this.rootNode.ul = $ul[0];
    //     // Set tree title from node data
    //     this.title = data.title;
    // },
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
        searchRoot = searchRoot || this.rootNode;
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
            this._callHook("nodeToggleExpanded", ctx);
//            this._callHook("nodeSetFocus", ctx, true); // issue 95
        } else if( targetType === "checkbox" ) {
            // Clicking the checkbox always (de)selects
            this._callHook("nodeToggleSelected", ctx);
            this._callHook("nodeSetFocus", ctx, true); // issue 95
        } else {
            // Honor `clickFolderMode` for
            var expand = false, 
                activate = true;
            if( node.folder ) {
                switch( ctx.options.clickFolderMode ) {
                case 2: // expand only
                    expand = true;
                    activate = false;
                    break;
                case 3: // expand and activate
                    activate = expand = true;
                    break;
                }
            }
            if( activate ) {
                this.nodeSetFocus(ctx);
                this._callHook("nodeSetActive", ctx, true);
            }
            if( expand ) {
                if(!activate){
//                    this._callHook("nodeSetFocus", ctx);
                }
                this._callHook("nodeSetExpanded", ctx, true);
            }
        }
        // Make sure that clicks stop, otherwise <a href='#'> jumps to the top
        event.preventDefault();
    },
    nodeCollapseSiblings: function(ctx) {
        var node = ctx.node;
        if( node.parent ){
            var ac = node.parent.children;
            for (var i=0, l=ac.length; i<l; i++) {
                if ( ac[i] !== node && ac[i].expanded ){
                    this._callHook("nodeSetExpanded", ac[i], false);
                }
            }
        }
    },
    // /** Collapse node, if expanded (shortcut to nodeSetExpanded(ctx, false)). */
    // nodeCollapse: function(ctx) {
    //     return this.nodeSetExpanded(ctx, false);
    // },
    nodeDblclick: function(ctx) {
    },
    /** Default handling for mouse keydown events. */
    nodeKeydown: function(ctx) {
        var event = ctx.orgEvent,
            node = ctx.node,
            tree = ctx.tree,
            opts = ctx.options,
            handled = true,
            KC = $.ui.keyCode,
            sib;
//      this.tree.logDebug("dtnode.onKeydown(" + event.type + "): dtnode:" + this + ", charCode:" + event.charCode + ", keyCode: " + event.keyCode + ", which: " + event.which);
//      alert("keyDown" + event.which);

        switch( event.which ) {
            // charCodes:
            case KC.NUMPAD_ADD: //107: // '+'
            case 187: // '+' @ Chrome, Safari
                tree.nodeSetExpanded(ctx, true);
                break;
            case KC.NUMPAD_SUBTRACT: // '-'
            case 189: // '-' @ Chrome, Safari
                tree.nodeSetExpanded(ctx, false);
                break;
            case KC.SPACE:
                if(opts.checkbox){
                    tree.nodeToggleSelected(ctx);
                }else{
                    tree.nodeSetActive(ctx, true);
                }
                break;
            case KC.ENTER:
                tree.nodeSetActive(ctx, true);
                break;
            case KC.BACKSPACE:
                if( node.parent ){
                    node.parent.setFocus();
                }
                break;
            case KC.LEFT:
                if( node.expanded ) {
                    tree.nodeSetExpanded(ctx, false);
                    tree.nodeSetFocus(ctx);
                } else if( node.parent && node.parent.parent ) {
                    node.parent.setFocus();
                }
                break;
            case KC.RIGHT:
                if( !node.expanded && (node.children || node.lazy) ) {
                    tree.nodeSetExpanded(ctx, true);
                    tree.nodeSetFocus(ctx);
                } else if( node.children ) {
                    node.children[0].setFocus();
                }
                break;
            case KC.UP:
                sib = node.getPrevSibling();
                while( sib && sib.expanded && sib.children ){
                    sib = sib.children[sib.children.length - 1];
                }
                if( !sib && node.parent && node.parent.parent ){
                    sib = node.parent;
                }
                if( sib ){
                    sib.setFocus();
                }
                break;
            case KC.DOWN:
                if( node.expanded && node.children ) {
                    sib = node.children[0];
                } else {
                    var parents = node.getParentList(false, true);
                    for(var i=parents.length-1; i>=0; i--) {
                        sib = parents[i].getNextSibling();
                        if( sib ){ break; }
                    }
                }
                if( sib ){
                    sib.setFocus();
                }
                break;
            default:
                handled = false;
        }
        if(handled){
            event.preventDefault();
        }
    },

    // /** Default handling for mouse keypress events. */
    // nodeKeypress: function(ctx) {
    //     var event = ctx.orgEvent;
    // },

    // /** Trigger lazyload event (async). */
    // nodeLazyLoad: function(ctx) {
    //     var node = ctx.node;
    //     if(this._triggerNodeEvent())
    // },
    /** Load children (async). 
     *  source may be 
     *    - an array of children
     *    - a node object
     *    - an Ajax options object
     *    - an Ajax.promise
     */
    nodeLoadChildren: function(ctx, source) {
        var children,
            tree = ctx.tree,
            node = ctx.node,
            dfd;

        if($.isFunction(source)){
            source = source();
//            alert("source() = " + source);
        }
        if(source.url || $.isFunction(source.done)){
            tree.nodeSetStatus(ctx, "loading");
            if(source.url){
                // `source` is an Ajax options object
                var ajax = $.extend({}, ctx.options.ajax, source);
                dfd = $.ajax(ajax);
            }else{
                // `source` is a promise, as returned by a $.ajax call
                dfd = source;
            }
            dfd.done(function(data, textStatus, jqXHR){
                tree.nodeSetStatus(ctx, "ok");
                children = data;
                if(typeof children === "string"){ $.error("Ajax request returned a string (did you get the JSON dataType wrong?)."); }
            }).fail(function(jqXHR, textStatus, errorThrown){
                tree.nodeSetStatus(ctx, "error", textStatus, jqXHR.status + ": " + errorThrown);
                alert("error: " + textStatus + " (" + jqXHR.status + ": " + (errorThrown.message || errorThrown) + ")");
            });
        }else{
            // `source` is an array of child objects
            dfd = $.Deferred();
            children = source;
            dfd.resolve();
        }
        dfd.done(function(){
            _assert($.isArray(children), "expected array of children");
            node.addChildren(children);
            if(!!node.parent){
                // if nodeLoadChildren was called for rootNode, the caller must
                // use tree.render() instead
                tree.nodeRender(ctx);
                tree._triggerNodeEvent("load", node);
            }
        }).fail(function(){
            tree.nodeRender(ctx);
        });
        return dfd;
    },
    /** Expand all parents and scroll into visible area as neccessary (async). */
    // isVisible: function() {
    //     // Return true, if all parents are expanded.
    //     var parents = ctx.node.getParentList(false, false);
    //     for(var i=0, l=parents.length; i<l; i++){
    //         if( ! parents[i].expanded ){ return false; }
    //     }
    //     return true;
    // },
    nodeMakeVisible: function(ctx) {
        // TODO: scroll as neccessary: http://stackoverflow.com/questions/8938352/dynatree-how-to-scroll-to-active-node
        var parents = ctx.node.getParentList(false, false);
        for(var i=0, l=parents.length; i<l; i++){
            parents[i].setExpanded(true);
        }
    },
    /** Handle focusin/focusout events.*/
    nodeOnFocusInOut: function(ctx) {
        if(ctx.orgEvent.type === "focusin"){
            this.nodeSetFocus(ctx);
            // if(ctx.tree.focusNode){
            //     $(ctx.tree.focusNode.li).removeClass("dynatree-focused");
            // }
            // ctx.tree.focusNode = ctx.node;
            // $(ctx.node.li).addClass("dynatree-focused");
        }else{
            _assert(ctx.orgEvent.type === "focusout");
            // ctx.tree.focusNode = null;
            // $(ctx.node.li).removeClass("dynatree-focused");
        }
        // $(ctx.node.li).toggleClass("dynatree-focused", ctx.orgEvent.type === "focus");
    },
    /**
     * Create <li><span>..</span> .. </li> tags for this node.
     *
     * This method takes care that all HTML markup is created that is required
     * to display this node in it's current state.
     * 
     * Call this method to create new nodes, or after the strucuture
     * was changed (e.g. after moving this node or adding removing children)
     * nodeRenderTitle() and nodeRenderStatus() are implied.
     *
     * <li id='KEY' dtnode=NODE> // This div contains the node's span and list of child div's.
     *   <span class='dynatree-node'>S S S A</span> // Span contains graphic spans and title <a> tag
     *   <ul> // only present, when node has children
     *       <li id='KEY' dtnode=NODE>child1</li>
     *       <li id='KEY' dtnode=NODE>child2</li>
     *   </ul>
     * </li>
     *
     * @param: ctx
     * @param: force re-render, even if html markup was already created
     * @param: deep also render all descendants, even if parent is collapsed
     * @param: collapsed force root node to be collapsed, so we can apply animated expand later
     * @param: _recursive internal use, must be false
     */
    nodeRender: function(ctx, force, deep, collapsed, _recursive) {
        var node = ctx.node,
            tree = ctx.tree,
            opts = ctx.options,
            firstTime = false,
            parent = node.parent,
            i, l;
//            dfd = !!_recursive ? null : new $.Deferred();
        DT.debug("nodeRender(" + !!force + ", " + !!deep + ")", node.toString());
        _assert(parent, "Cannot call nodeRender(root)");
        _assert(parent.ul, "parent UL must exist");

        if(node.li && force){
            $(node.li).remove();
            node.li = null;
            node.ul = null;
        }

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
            // Note: we don't add the LI to the DOM know, but only after we 
            // added all sub elements (hoping that this performs better since
            // the browser only have to render once)
            // TODO: benchmarks to prove this
//            parent.ul.appendChild(node.li);

            // Set icon, link, and title
            this.nodeRenderTitle(ctx);
        }

        // // Set icon, link, and title
        // this.nodeRenderTitle(ctx);

        // Allow tweaking, binding, after node was created for the first time
        if(firstTime && opts.onCreate){
            // TODO: _trigger
            opts.onCreate.call(tree, this, this.span);
        }
        // Hide children, if node is collapsed
//        this.ul.style.display = ( this.bExpanded || !parent ) ? "" : "none";
        // Allow tweaking after node state was rendered
        if(opts.onRender){
            // TODO: _trigger
            opts.onRender.call(tree, this, this.span);
        }
        // Visit child nodes
        var cl = node.children;
        if( (node.expanded || deep === true) && cl ) {
            // Create a UL to hold the children
            if( !node.ul ){
                node.ul = document.createElement("ul");
                if(collapsed === true && !_recursive){
                    // hide top UL, so we can use an animation to show it later
                    node.ul.style.display = "none";
                }
                node.li.appendChild(node.ul);
            }
            // Add child markup
            for(i=0, l=cl.length; i<l; i++) {
                var subCtx = $.extend({}, ctx, {node: cl[i]}); 
                this.nodeRender(subCtx, force, deep, false, true);
            }
            // Make sure, that <li> order matches node.children order.
            var childLI = node.ul.firstChild;
            for(i=0, l=cl.length-1; i<l; i++) {
                var childNode1 = cl[i],
                    childNode2 = childLI.dtnode;
                if( childNode1 !== childNode2 ) {
                    node.debug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
                    node.ul.insertBefore(childNode1.li, childNode2.li);
                } else {
                    childLI = childLI.nextSibling;
                }
            }
        }
        // Update element classes according to node state
        this.nodeRenderStatus(ctx);

        // Finally add the whole structure to the DOM, so the browser can render
        if(firstTime){
            parent.ul.appendChild(node.li);
        }
//        return dfd ? dfd.promise() : null;
    },
    /** Create HTML for the node's <span> (expander, connector, checkbox, and title). */
    nodeRenderTitle: function(ctx, title) {
        // set node connector images, links and text
        var node = ctx.node,
            tree = ctx.tree,
            opts = ctx.options,
            level = node.getLevel(),
            ares = [];
        if(title !== undefined){
            node.title = title;
        }
        // connector (expanded, expandable or simple)
        // TODO: optiimize this if clause
        if( level < opts.minExpandLevel ) {
            if(level > 1){
                ares.push("<span class='dynatree-expander'></span>");
            }
            // .. else (i.e. for root level) skip expander/connector alltogether
        } else {
            ares.push("<span class='dynatree-expander'></span>");
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
            nodeTitle = opts.onCustomRender.call(tree, node) || "";
        }
        if(!nodeTitle){
            var tooltip = node.tooltip ? ' title="' + node.tooltip.replace(/\"/g, '&quot;') + '"' : '',
                href = node.href || "#";
            if( opts.nolink || node.nolink ) {
                // TODO: move style='' to CSS
                nodeTitle = '<span class="dynatree-title"' + tooltip + '>' + node.title + '</span>';
            } else {
                nodeTitle = '<a href="' + href + '" class="dynatree-title"' + tooltip + '>' + node.title + '</a>';
            }
        }
        ares.push(nodeTitle);
        // Note: this will trigger focusout, if node had the focus
        node.span.innerHTML = ares.join("");
    },
    /** Update element classes according to node state. */
    nodeRenderStatus: function(ctx) {
        // Set classes for current status
        var node = ctx.node,
            tree = ctx.tree,
            nodeContainer = node[tree.nodeContainerAttrName],
            hasChildren = node.hasChildren(),
            isLastSib = node.isLastSibling(),
            cn = ctx.options._classNames,
            cnList = [];

        // Build a list of class names that we will add to the node <span>
        cnList.push(cn.node);
        if( tree.activeNode === node ){
            cnList.push(cn.active);
        }
        if( tree.focusNode === node ){
            cnList.push(cn.focused);
        }
        if( node.expanded ){
            cnList.push(cn.expanded);
        }
        if( node.folder ){
            cnList.push(cn.folder);
        }
        if( hasChildren !== false ){
            cnList.push(cn.hasChildren);
        }
        // TODO: required?
        if( isLastSib ){
            cnList.push(cn.lastsib);
        }
        if( node.lazy && node.children === null ){
            cnList.push(cn.lazy);
        }
        if( node.partsel ){
            cnList.push(cn.partsel);
        }
        if( node.selected ){
            cnList.push(cn.selected);
        }
        if( node.extraClasses ){
            cnList.push(node.extraClasses);
        }
        // IE6 doesn't correctly evaluate multiple class names,
        // so we create combined class names that can be used in the CSS
        if( hasChildren === false ){
	        cnList.push(cn.combinedExpanderPrefix + "n" +
	                (isLastSib ? "l" : "")
	                );
        }else{
	        cnList.push(cn.combinedExpanderPrefix +
	                (node.expanded ? "e" : "c") +
	                (node.lazy && node.children === null ? "d" : "") +
	                (isLastSib ? "l" : "")
	                );
        }
        cnList.push(cn.combinedIconPrefix +
                (node.expanded ? "e" : "c") +
                (node.folder ? "f" : "")
                );
//        node.span.className = cnList.join(" ");
        node[tree.statusClassPropName].className = cnList.join(" ");

        // TODO: we should not set this in the <span> tag also, if we set it here:
        // Maybe most (all) of the classes should be set in LI instead of SPAN?
        if(node.li){
            node.li.className = isLastSib ? cn.lastsib : "";
        }
    },    
    /** Activate node. 
     * flag defaults to true.
     * If flag is true, the node is activated (must be a synchronous operation)
     * If flag is false, the node is deactivated (must be a synchronous operation)
     */
    nodeSetActive: function(ctx, flag) {
        // Handle user click / [space] / [enter], according to clickFolderMode.
        var node = ctx.node,
            tree = ctx.tree,
            opts = ctx.options,
            userEvent = !!ctx.orgEvent,
            isActive = (node === tree.activeNode);
        // flag defaults to true
        flag = (flag !== false);
        this.debug("nodeSetActive", !!flag);

        if(isActive === flag){ 
            // Nothing to do
            return $.Deferred(function(){this.resolveWith(node);}).promise(); 
        }else if(flag && this._triggerNodeEvent("queryactivate", node, ctx.orgEvent) === false ){
            // Callback returned false
            return $.Deferred(function(){this.rejectWith(node, ["rejected"]);}).promise();
        }
        if(flag){
            if(tree.activeNode){
                _assert(tree.activeNode !== node, "node was active (inconsistency)");
                var subCtx = $.extend({}, ctx, {node: tree.activeNode});
                tree.nodeSetActive(subCtx, false);
                _assert(tree.activeNode === null, "deactivate was out of sync?");
            }
            if(opts.activeVisible){
                tree.nodeMakeVisible(ctx);
            }
            tree.activeNode = node;
            tree.nodeRenderStatus(ctx);
            tree.nodeSetFocus(ctx);
            tree._triggerNodeEvent("activate", node);
        }else{
            _assert(tree.activeNode === node, "node was not active (inconsistency)");
            tree.activeNode = null;
            this.nodeRenderStatus(ctx);
            ctx.tree._triggerNodeEvent("deactivate", node);
        }
    },
    /** Expand or collapse node, return Deferred.promise. */
    nodeSetExpanded: function(ctx, flag) {
        var node = ctx.node,
            tree = ctx.tree,
            opts = ctx.options;
        // flag defaults to true
        flag = (flag !== false);

        node.debug("nodeSetExpanded(" + flag + ")");
        // TODO: !!node.expanded is nicer, but doesn't pass jshint
        // https://github.com/jshint/jshint/issues/455
//        if( !!node.expanded === !!flag){  
        if((node.expanded && flag) || (!node.expanded && !flag)){ 
            // Nothing to do
            node.debug("nodeSetExpanded(" + flag + "): nothing to do");
            return $.Deferred(function(){this.resolveWith(node);}).promise(); 
        }else if(flag && !node.lazy && !node.hasChildren() ){
            // Prevent expanding of empty nodes
            return $.Deferred(function(){this.rejectWith(node, ["empty"]);}).promise();
        }else if( !flag && node.getLevel() < opts.minExpandLevel ) {
            // Prevent collapsing locked levels
            return $.Deferred(function(){this.rejectWith(node, ["locked"]);}).promise();
        }else if ( this._triggerNodeEvent("queryexpand", node, ctx.orgEvent) === false ){
            // Callback returned false
            return $.Deferred(function(){this.rejectWith(node, ["rejected"]);}).promise();
        }
        // 
        var dfd = new $.Deferred();

        // Auto-collapse mode: collapse all siblings
        if( flag && !node.expanded && opts.autoCollapse ) {
            opts.autoCollapse = false;
            var parents = node.getParentList(false, true);
            for(var i=0, l=parents.length; i<l; i++){
                this._callHook("nodeCollapseSiblings", parents[i]);
            }
            // TODO: use try/finally
            opts.autoCollapse = true;
        }
        // Trigger onExpand after expanding
        dfd.done(function(){
            ctx.tree._triggerNodeEvent(flag ? "expand" : "collapse", ctx);
        });

        // vvv Code below is executed after loading finished:
        var _afterLoad = function(){
            node.expanded = flag;
            // Persist expand state
            // if( opts.persist ) {
            //     if( bExpand ){
            //         this.tree.persistence.addExpand(this.data.key);
            //     }else{
            //         this.tree.persistence.clearExpand(this.data.key);
            //     }
            // }

            // Create required markup, but make sure the top UL is hidden, so we
            // can animate later
            tree._callHook("nodeRender", ctx, false, false, true);


            // If the currently active node is now hidden, deactivate it
            // if( opts.activeVisible && this.tree.activeNode && ! this.tree.activeNode.isVisible() ) {
            //     this.tree.activeNode.deactivate();
            // }

            // Expanding a lazy node: set 'loading...' and call callback
            // if( bExpand && this.data.isLazy && this.childList === null && !this._isLoading ) {
            //     this._loadContent();
            //     return;
            // }
            // Hide children, if node is collapsed
            if( node.ul ) {
                var isVisible  = (node.ul.style.display !== "none"),
                    isExpanded = !!node.expanded;
    //            _assert(isVisible !== isExpanded);
                if( isVisible === isExpanded ) {
                    tree.warn("nodeSetExpanded: UL.style.display already set");
                    dfd.resolveWith(node);
                } else if( opts.fx ) {
                    var duration = opts.fx.duration || 200,
                        easing = opts.fx.easing;
                    $(node.ul).animate(opts.fx, duration, easing, function(){
                        dfd.resolveWith(node);
                    });
                } else {
                    node.ul.style.display = ( node.expanded || !parent ) ? "" : "none";
                    dfd.resolveWith(node);
                }
            }else{
                dfd.resolveWith(node);
            }
        };
        // ^^^ Code above is executed after loading finshed.

        // Load lazy nodes, if any. Then continue with _afterLoad()
        if(flag && node.lazy && node.hasChildren() === undefined){
            var source = tree._triggerNodeEvent("lazyload", node, ctx.orgEvent);
            _assert(typeof source !== "boolean", "lazyload event must return source in data.result");
            this._callHook("nodeLoadChildren", ctx, source).done(function(){
                if(dfd.notifyWith){ // requires jQuery 1.6+
                    dfd.notifyWith(node, ["loaded"]);
                }
                _afterLoad.call(tree);
            }).fail(function(errMsg){
                dfd.rejectWith(node, ["load failed (" + errMsg + ")"]);
            });
        }else{
            _afterLoad();
        }
        return dfd.promise();
    },
    nodeSetFocus: function(ctx) {
        var tree = ctx.tree,
            node = ctx.node;

        if(tree.focusNode){
            if(tree.focusNode === node){
                return; // prevent recursion, when span.focus would be called again
            }
            var ctx2 = $.extend({}, ctx, {node: tree.focusNode});
            tree.focusNode = null;
            this._triggerNodeEvent("blur", ctx2);
            this._callHook("nodeRenderStatus", ctx2);
        }
        this.nodeMakeVisible(ctx);
        tree.focusNode = node;
        try {
            // issue 154
            // TODO: check if still required on IE 9:
            // Chrome and Safari don't focus the a-tag on click,
            // but calling focus() seem to have problems on IE:
            // http://code.google.com/p/dynatree/issues/detail?id=154
            $(node.span).find(">a").focus();
        } catch(e) { }
        this._triggerNodeEvent("focus", ctx);
        this._callHook("nodeRenderStatus", ctx);
    },
    /** (De)Select node, return new status (sync). */
    nodeSetSelected: function(ctx, flag) {
        var node = ctx.node,
            tree = ctx.tree,
            opts = ctx.widget.options;
        // flag defaults to true
        flag = (flag !== false);

        node.debug("nodeSetSelected(" + flag + ")");
        // TODO: !!node.expanded is nicer, but doesn't pass jshint
        // https://github.com/jshint/jshint/issues/455
//        if( !!node.expanded === !!flag){  
        if((node.selected && flag) || (!node.selected && !flag)){ 
            return !!node.selected; 
        }else if ( this._triggerNodeEvent("queryselect", node, ctx.orgEvent) === false ){
            return !!node.selected; 
        }
        // 
        node.selected = flag;
        this.nodeRenderStatus(ctx);
        tree._triggerNodeEvent("select", ctx);

        // Persist expand state
        // if( opts.persist ) {
        //     if( bExpand ){
        //         this.tree.persistence.addExpand(this.data.key);
        //     }else{
        //         this.tree.persistence.clearExpand(this.data.key);
        //     }
        // }

    },
    /** Show node status (ok, loading, error) using styles and a dummy child node. */
    nodeSetStatus: function(ctx, status, message, details) {
        var node = ctx.node,
            tree = ctx.tree;
        var _clearStatusNode = function() {
            var firstChild = ( node.children ? node.children[0] : null );
            if ( firstChild && firstChild.isStatusNode ) {
                try{
                    // I've seen exceptions here with loadKeyPath...
                    if(node.ul){
                        node.ul.removeChild(firstChild.li);
                        firstChild.li = null; // avoid leaks (issue 215)
                    }
                }catch(e){}
                if( node.children.length === 1 ){
                    node.children = [];
                }else{
                    node.children.shift();
                }
            }
            return;
        };
        var _setStatusNode = function(data) {
            var firstChild = ( node.children ? node.children[0] : null );
            if ( firstChild && firstChild.isStatusNode ) {
                $.extend(firstChild, data);
                tree._callHook("nodeRender", firstChild);
            } else {
                data.key = "_statusNode";
                node.addChildren([data]);
                node.children[0].isStatusNode = true;
                tree.render();
            }
            return node.children[0];
        };
        switch(status){
        case "ok":
          _clearStatusNode();
          $(node.span).removeClass("dynatree-loading");
          break;
        case "loading":
            $(node.span).addClass("dynatree-loading");
            if(!node.parent){
                _setStatusNode({
                    title: tree.options.strings.loading + 
                        (message ? " (" + message + ") " : ""),
                    tooltip: details,
                    extraClasses: "dynatree-statusnode-wait"
                });
            }
            break;
        case "error":
            $(node.span).addClass("dynatree-error");
            _setStatusNode({
                title: tree.options.strings.loadError + " (" + message + ")",
                tooltip: details,
                extraClasses: "dynatree-statusnode-error"
            });
            break;
        default:
            $.error("invalid status " + status);
        }
    },
    /**  */
    nodeToggleExpanded: function(ctx) {
        return this.nodeSetExpanded(ctx, !ctx.node.expanded);
    },
    nodeToggleSelected: function(ctx) {
        return this.nodeSetSelected(ctx, !ctx.node.selected);
    },
    /** Remove all nodes. */
    treeClear: function(ctx) {
        var tree = ctx.tree;
        tree.activeNode = null;
        tree.focusNode = null;
        tree.$div.find(">ul.dynatree-container").empty();
        // TODO: call destructors and remove reference loops
        tree.rootNode.children = null;
    },
    /** Widget was created (called only once, even it re-initialized). */
    treeCreate: function(ctx) {
    },
    /** Widget was destroyed. */
    treeDestroy: function(ctx) {
    },
    /** Widget was (re-)initialized. */
    treeInit: function(ctx) {
        this.treeLoad(ctx);
    },
    /** Parse Dynatree from source, as configured in the options.*/
    treeLoad: function(ctx, source) {
        var tree = ctx.tree,
            $container = ctx.widget.element,
            dfd,
            // calling context for root node
            rootCtx = $.extend({}, ctx, {node: this.rootNode});

        source = source || this.options.source;

        if(!source){
            var type = $container.data("type") || "html",
                $ul;
            switch(type){
            case "html":
                $ul = $container.find(">ul:first");
                $ul.addClass("ui-dynatree-source ui-helper-hidden");
                source = [];
                _loadFromHtml.call(this, $ul, source);
                break;
            case "json":
    //            $().addClass("ui-helper-hidden");
                source = $.parseJSON($container.text());
                if(source.children){
                    if(source.title){tree.title = source.title;}
                    source = source.children;
                }
                break;
            default:
                $.error("Invalid data-type: " + type);
            }
        }else if(typeof source === "string"){
            // TODO: source is an element ID
            _raiseNotImplemented();
        }

        // $container.addClass("ui-widget ui-widget-content ui-corner-all");

        dfd = this.nodeLoadChildren(rootCtx, source).done(function(){
            tree.render();
            tree._triggerTreeEvent("postinit", true);
        }).fail(function(){
            tree.render();
            tree._triggerTreeEvent("postinit", false);
        });
        return dfd;
    },
    /** Reload tree from source and return a promise. */
    reload: function(source) {
        this._callHook("treeClear", this);
        return this._callHook("treeLoad", this, source);
    },
    render: function(force, deep) {
        var children = this.rootNode.children,
            i, l;
        if(children){
            for(i=0; i<children.length; i++){
                // children[i].render(true);
                this._callHook("nodeRender", children[i], force, deep);
            }
            // TODO: duplicate code -> refactor to _fixOrder()
            // Make sure, that <li> order matches node.children order.
            var node = this.rootNode,
            	childLI = node.ul.firstChild;
            for(i=0, l=children.length-1; i<l; i++) {
                var childNode1 = children[i],
                    childNode2 = childLI.dtnode;
                if( childNode1 !== childNode2 ) {
                    node.debug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
                    node.ul.insertBefore(childNode1.li, childNode2.li);
                } else {
                    childLI = childLI.nextSibling;
                }
            }
        }
    },
    toString: function(){
        return "Dynatree<" + this._id + ">";
    },
    /** _trigger a widget event with additional node ctx. */
    _triggerNodeEvent: function(type, node, orgEvent) {
        var ctx = this._makeHookContext(node, orgEvent);
        this.debug("_trigger(" + type + "): '" + ctx.node.title + "'", ctx);
        var res = this.$widget._trigger(type, orgEvent, ctx);
        if(res !== false && ctx.result !== undefined){
            return ctx.result;
        }
        return res;
    },
    /** _trigger a widget event with additional tree data. */
    _triggerTreeEvent: function(type, orgEvent) {
        var ctx = this._makeHookContext(this, orgEvent);
        this.debug("_trigger(" + type + ")", ctx);
        var res = this.$widget._trigger(type, orgEvent, ctx);
        if(res !== false && ctx.result !== undefined){
            return ctx.result;
        }
        return res;
    },
    visit: function(fn) {
        return this.rootNode.visit(fn, false);
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
        ajax: {
            type: "GET",
            cache: false, // false: Append random '_' argument to the request url to prevent caching.
//          timeout: 0, // >0: Make sure we get an ajax error if error is unreachable
            dataType: "json" // Expect json format and pass json object to callbacks.
        },  // 
        activeVisible: true, // Make sure, active nodes are visible (expanded).
        autoCollapse: false,
        checkbox: false,
        clickFolderMode: 3,
        extensions: [],
        fx: { height: "toggle", duration: 200 },
        hooks: {},
        idPrefix: "dt_",
        strings: {
            loading: "Loading&#8230;",
            loadError: "Load error!"
        },
        _classNames: {
            container: "dynatree-container",
            node: "dynatree-node",
            folder: "dynatree-folder",
            empty: "dynatree-empty",
            vline: "dynatree-vline",
            expander: "dynatree-expander",
//            connector: "dynatree-connector",
            checkbox: "dynatree-checkbox",
            icon: "dynatree-icon",
            title: "dynatree-title",
            noConnector: "dynatree-no-connector",
            statusnodeError: "dynatree-statusnode-error",
            statusnodeWait: "dynatree-statusnode-wait",
            hidden: "dynatree-hidden",
            combinedExpanderPrefix: "dynatree-exp-",
            combinedIconPrefix: "dynatree-ico-",
            loading: "dynatree-loading",
            hasChildren: "dynatree-has-children",
            active: "dynatree-active",
            selected: "dynatree-selected",
            expanded: "dynatree-expanded",
            lazy: "dynatree-lazy",
            focused: "dynatree-focused",
            partsel: "dynatree-partsel",
            lastsib: "dynatree-lastsib"
        },
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
            // Add extension options as tree.options.EXTENSION
            this.tree.options[extName] = $.extend({}, extension.options, this.tree.options[extName]);
            // Subclass Dynatree methods using proxies.
            _subclassObject(this.tree, extension, extName);
            // current extension becomes base for the next extension
            base = extension;
        }
        //
        this.tree._callHook("treeCreate", this.tree);
        // Note: 'dynatreecreate' event is fired by widget base class
//        this.tree._triggerTreeEvent("create");
    },

    // Called on every $().dynatree()
    _init: function() {
        this.tree._callHook("treeInit", this.tree);
        this.tree._triggerTreeEvent("init");
    },

    // Use the _setOption method to respond to changes to options
    _setOption: function(key, value) {
        var callDefault = true,
            rerender = false;
        switch( key ) {
        case "checkbox":
        case "minExpandLevel":
        case "nolink":
            rerender = true;
            break;
        }
        this.tree.debug("set option " + key + "=" + value + " <" + typeof(value) + ">");
        if(callDefault){
            // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
            $.Widget.prototype._setOption.apply(this, arguments);
            // TODO: In jQuery UI 1.9 and above, you use the _super method instead
//          this._super( "_setOption", key, value );
        }
        if(rerender){
            this.tree.render(true, false);  // force, not-deep
        }
    },

    // Use the destroy method to clean up any modifications your widget has made to the DOM
    destroy: function() {
        this._unbind();
        this.tree._callHook("treeDestroy", this.tree);
        // this.element.removeClass("ui-widget ui-widget-content ui-corner-all");
        this.tree.$div.find(">ul.dynatree-container").remove();
        var _ = this.$source && this.$source.removeClass("ui-helper-hidden");
        // In jQuery UI 1.8, you must invoke the destroy method from the base widget
        $.Widget.prototype.destroy.call( this );
        // TODO: delete tree and nodes to make garbage collect easier?
        // TODO: In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
    },

    // -------------------------------------------------------------------------

    /** Add mouse and kyboard handlers to the container */
    _bind: function() {
        var that = this,
            opts = this.options,
            eventNames = $.map(["click", "dblclick", /*"keypress", "keydown",*/
                "focusin", "focusout"/*, "focus", "blur", "mousein", "mouseout" */],
                function(name){
                    return name + "." + that.widgetName + "-" + that.tree._id;
                }).join(" ");

        this._unbind();
        $(document).bind("keydown.dynatree-" + this.tree._id, function(event){
            if(opts.disabled || opts.keyboard === false){
                return true;                
            }
            var node = DT.getNode(event.target);
            if( node && node.tree === that.tree ){
                var ctx = that.tree._makeHookContext(node, event);
                return ( that.tree._triggerNodeEvent("keydown", node, event) === false ) ? false : that.tree._callHook("nodeKeydown", ctx);
            }
        });
        this.element.bind(eventNames, function(event){
            if(opts.disabled){
                return true;                
            }
            var node = DT.getNode(event.target);
            if( !node ){
                return true;  // Allow bubbling of other events
            }
            var tree = that.tree,
//                o = that.options,
                ctx = tree._makeHookContext(node, event),
                prevPhase = tree.phase;
            that.tree.debug("event(" + event.type + "): node: ", node);
            try {
                tree.phase = "userEvent";
                switch(event.type) {
                case "click":
                    // return ( that._triggerNodeEvent(node, "click", event) === false ) ? false : node._onClick(event);
                    return ( tree._triggerNodeEvent("click", node, event) === false ) ? false : tree._callHook("nodeClick", ctx);
                case "dblclick":
                    return ( tree._triggerNodeEvent("dblclick", node, event) === false ) ? false : tree._callHook("nodeDblclick", ctx);
                case "keydown":
                    return ( tree._triggerNodeEvent("keydown", node, event) === false ) ? false : tree._callHook("nodeKeydown", ctx);
                case "keypress":
                    return ( tree._triggerNodeEvent("keypress", node, event) === false ) ? false : tree._callHook("nodeKeypress", ctx);
                case "focusin":
                case "focusout":
                    return tree._callHook("nodeOnFocusInOut", ctx);
                }
//             } catch(e) {
// //                var _ = null; // issue 117 // TODO
//                 $.error(e);
            } finally {
                tree.phase = prevPhase;
            }
        });
    },
    /** Return active node or null. */
    getActiveNode: function() {
        return this.tree.activeNode;
    },
    /** Return matching node or null. */
    getNodeByKey: function(key) {
        return this.tree.getNodeByKey(key);
    },
    /** Return Dynatree instance. */
    getTree: function() {
        return this.tree;
    },
    /** Remove all event handlers for our namespace */
    _unbind: function() {
        this.element.unbind("." + this.widgetName + "-" + this.tree._id);
    }
});

// $.ui.dynatree was created by the widget factory. Create a local shortcut:
var DT = $.ui.dynatree;

/*******************************************************************************
 * Static members in the jQuery.ui.dynatree namespace
 */

function consoleApply(method, args){
	var fn = window.console ? window.console[method] : null;
	if(fn && fn.apply){
        fn.apply(window.console, args);
	}
}


$.extend($.ui.dynatree, {
    version: "2.0.0pre",
    debugLevel: 2,

    _nextId: 1,
    _nextNodeKey: 1,
    _extensions: {},

    debug: function(msg){
        /*jshint expr:true */
        ($.ui.dynatree.debugLevel >= 2) && consoleApply("log", arguments);
//        ($.ui.dynatree.debugLevel >= 2) && window.console && window.console.log && window.console.log.apply(window.console, arguments);
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
        // FIXME: cannot work, when tcn also contains UI themeroller classes
        if( tcn === "dynatree-title" ){
            res.type = "title";
        }else if( tcn === "dynatree-expander" ){
//            res.type = "expander";
            res.type = res.node.hasChildren() == false ? "prefix" : "expander";
        }else if( tcn === "dynatree-checkbox" ){
            res.type = "checkbox";
        }else if( tcn === "dynatree-icon" ){
            res.type = "icon";
//        }else if( tcn === "dynatree-connector" ){
//            res.type = "prefix";
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

/*******************************************************************************
 * Register AMD
 */
// if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
//     define( "jquery", [], function () { return jQuery; } );
// }


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
        nodeRender: function(ctx, force, deep, collapsed){
            // ctx.tree.debug("**** PROFILER nodeRender");
            var s = this.options.prefix + "render '" + ctx.node + "'";
            window.console.time(s);
            this._super(ctx, force, deep, collapsed);
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
        // `this._super`: the virtual function that was overriden (member of prev. extension or Dynatree)
        treeInit: function(ctx){
            // TODO: bind to option change to set aria-disabled
            // ctx.widget$( "#something" ).multi( "option", "disabled", function(event){ 
            //     alert( "I cleared the multiselect!" ); 
            // });
            this._super(ctx);
            $(ctx.tree.rootNode.ul).addClass("role-tree");
        },
        nodeRenderStatus: function(ctx){
            this._super(ctx);
            $(ctx.node.li).addClass("role-treeitem");
            // TODO: aria-expanded: "true", aria-selected: "true"
        }
     });
}(jQuery));
