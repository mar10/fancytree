/*!
 * jquery.fancytree.js
 * Dynamic tree view control, with support for lazy loading of branches.
 *
 * Copyright (c) 2008-2012, Martin Wendt (http://wwWendt.de)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://code.google.com/p/fancytree/wiki/LicenseInfo
 *
 * A current version and some documentation is available at
 *    http://fancytree.googlecode.com/
 *
 * @summary     jQuery UI tree widget
 * @description Dynamic tree view control, with support for lazy loading of branches.
 * @file        jquery.fancytree.js
 * @version     2.0
 * @author      Martin Wendt
 * @license     MIT or GPL v2
 * 
 *
TODO:
- http://onwebdev.blogspot.com/2011/08/jquery-jsdoc-and-plugin-development.html
- tree.dump()

- this.options
  this.name, this.namespace
  this.widgetEventPrefix

- use this.element.css({background: greenlevels[level]});
- sortChildren
- findFirst()
- Die Hilfetexte aus der alten Doku verwenden!
- documentation generator
  https://groups.google.com/forum/?fromgroups=#!topic/jsdoc-users/85qIXAunrfU
- Example code for JSDoc
  @examples and @description
  http://code.google.com/p/jsdoc-toolkit/wiki/TagExample
- use @this to document th method contexts
- document all events that can be triggered, and mention this = container <div>
  (was Fancytree in relese 1.x)

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
if ( $.ui.fancytree && $.ui.fancytree.version ) {
	$.ui.fancytree.warn("Fancytree: duplicate include");
	return;
}


/* *****************************************************************************
 * Private functions and variables
 */
function _raiseNotImplemented(msg){
	msg = msg || "";
	$.error("Not implemented: " + msg);
}
function _assert(cond, msg){
    // TODO: see qunit.js extractStacktrace()
	msg = ": " + msg || "";
	if(!cond){
		$.error("Assertion failed" + msg);
	}
}
// RegExp that tests a function body for usage of '_super' (if browser supports that)
var dummyFunc = function(){ var xyz; },
	rexTestSuper = /xyz/.test(dummyFunc) ? /\b_super\b/ : null;

/** Return a wrapper that calls sub.fn() and exposes base.fn() as _super(). */
function _makeVirtualFunction(methodName, base, sub){
	var _super = base[methodName],
		func = sub[methodName];
	// if(rexTestSuper && !rexTestSuper.test(func)){
	//     // sub.methodName() doesn't call _super(), so no wrapper required
	//     return func;
	// }
	return function(){
		try{
			base._super = function(){
				return _super.apply(base, arguments);
			};
//			sub._base = base;
			return  func.apply(base, arguments);
		}finally{
			base._super = null;
		}
	};
}

/**
 * Subclass `base` by creating proxy functions
 */
function _subclassObject(tree, base, extension, extName){
	$.ui.fancytree.debug("_subclassObject", base, extension, extName);
	for(var attrName in extension){
		if(typeof extension[attrName] === "function"){
			if(typeof tree[attrName] === "function"){
				// override existing method
				tree[attrName] = _makeVirtualFunction(attrName, tree, extension);
			}else if(attrName.charAt(0) === "_"){
				// Create private methods in tree.EXTENSION namespace
				tree[extName][attrName] = $.proxy(extension[attrName], tree);
			}else{
				$.error("Could not override tree." + attrName + ". Use prefix '_' to create tree." + extName + "._" + attrName);
			}
		}else{
			// Create member variables in tree.EXTENSION namespace
			if(attrName !== "options"){
				tree[extName][attrName] = base[attrName];
			}
		}
	}
}


function _getResolvedPromise(context, argArray){
    if(context === undefined){
        return $.Deferred(function(){this.resolve();}).promise();
    }else{
        return $.Deferred(function(){this.resolveWith(context, argArray);}).promise();
    }
}


function _getRejectedPromise(context, argArray){
    if(context === undefined){
        return $.Deferred(function(){this.reject();}).promise();
    }else{
        return $.Deferred(function(){this.rejectWith(context, argArray);}).promise();
    }
}


function _makeResolveFunc(deferred, context){
    return function(){
        deferred.resolveWith(context);
    };
}


// TODO: use currying
function _makeNodeTitleMatcher(s){
    s = s.toLowerCase();
    return function(node){
        return node.title.toLowerCase().indexOf(s) >= 0;
    };
} 


// Boolean attributes that can be set with equivalent class names in the LI tags
var i,
    CLASS_ATTRS = ["active", "expanded", "focus", "folder", "lazy", "nolink", "selected"],
	CLASS_ATTR_MAP = {};
for(i=0; i<CLASS_ATTRS.length; i++){ CLASS_ATTR_MAP[CLASS_ATTRS[i]] = true; }

// Top-level Fancytree node attributes, that can be set by dict
var NODE_ATTRS = ["expanded", "extraClasses", /*"focus", */ "folder", "href", "key",
                  "lazy", "nolink", "selected", "target", "title", "tooltip"],
    NODE_ATTR_MAP = {};
for(i=0; i<NODE_ATTRS.length; i++){ NODE_ATTR_MAP[NODE_ATTRS[i]] = true; }


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

/* *****************************************************************************
 * FancytreeNode
 */


/**
 * Creates a new node
 * @class Represents the hierarchical data model and operations.
 * @name FancytreeNode
 * @constructor 
 * @param {FancytreeNode} parent
 * @param {NodeData} data 
 *
 * @property {Fancytree} tree
 * @property {FancytreeNode} parent Parent node
 * @property {String} key
 * @property {String} title
 * @property {object} data
 * @property {FancytreeNode[] | null | undefined} children list of child nodes
 * @property {Boolean} isStatusNode
 * @property {Boolean} expanded
 * @property {Boolean} folder
 * @property {Boolean} href
 * @property {String} extraClasses
 * @property {Boolean} lazy
 * @property {Boolean} nolink
 * @property {Boolean} selected
 * @property {String} target
 * @property {String} tooltip
 */
function FancytreeNode(parent, data){
	var i, l, name, cl;
	this.parent = parent;
	this.tree = parent.tree;
	this.ul = null;
	this.li = null;  // <li id='key' ftnode=this> tag
	this.isStatusNode = false;
	this.data = {};

	// copy attributes from data object
	for(i=0, l=NODE_ATTRS.length; i<l; i++){
		name = NODE_ATTRS[i];
		this[name] = data[name];
	}
	// copy all other attributes to this.data.xxx
    for(name in data){
        if(!NODE_ATTR_MAP[name] && !$.isFunction(data[name])){
            this.data[name] = data[name];
        }
    }

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
}

FancytreeNode.prototype = /**@lends FancytreeNode*/{
    // TODO: activate()
    // TODO: activateSilently()
	/**
	 * Add children. 
	 * NOTE: current children are replaced!
	 */
	addChildren: function(children){
		_assert(!!children && (!this.children || this.children.length === 0), "only init supported");
		this.children = [];
		for(var i=0, l=children.length; i<l; i++){
			this.children.push(new FancytreeNode(this, children[i]));
		}
	},
	/**
	 * 
	 * @param {NodePatch} patch
	 * @returns {$.Promise}
	 */
	applyPatch: function(patch) {
        // patch [key, null] means 'remove'
	    if(patch === null){
	        this.remove();
	        return _getResolvedPromise(this);
	    }
	    // TODO: make sure that root node is not collapsed or modified
	    // copy (most) attributes to node.ATTR or node.data.ATTR
	    var name,
	        IGNORE_MAP = { children: true, expanded: true, parent: true }; // TODO: should be global
	    for(name in patch){
	        var v = patch[name];
	        if( !IGNORE_MAP[name] && !$.isFunction(v)){
	            if(NODE_ATTR_MAP[name]){
	                this[name] = v;
	            }else{
                    this.data[name] = v;
	            }
	        }
	    }
	    // Remove and/or create children
        if(patch.hasOwnProperty("children")){
            this.removeChildren();
            if(patch.children){
                this.addChildren(patch.children);
            }
            // TODO: how can we APPEND or INSERT child nodes?
        }
        if(this.isVisible()){
            this.renderTitle();
            this.renderStatus();
        }
        // Expand collapse (final step, since this may be async)
        var promise;
        if(patch.hasOwnProperty("expanded")){
            promise = this.setExpanded(patch.expanded);
        }else{
            promise = _getResolvedPromise(this);
        }
        return promise;
    },
    /**
     * @returns {$.Promise} 
     */
	collapseSiblings: function() {
		return this.tree._callHook("nodeCollapseSiblings", this);
	},
	/** @returns {int} number of child nodes*/
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
	// TODO: deactivate()
	debug: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		DT.debug.apply(this, arguments);
	},
	/** Remove all children of a lazy node and collapse.*/
	discard: function(){
		if(this.lazy && $.isArray(this.children)){
			this.removeChildren();
			return this.setExpanded(false);
		}
		// TODO: return promise
	},
	// TODO: expand(flag)
    /**Find all nodes that contain `match` in the title.
     * 
     * @param {String | function(node)} match string to search for, of a function that 
     * returns `true` if a node is matched.
     * @returns {FancytreeNode[]} array of nodes (may be empty)
     * @see FancytreeNode#findAll
     */
    findAll: function(match) {
        match = $.isFunction(match) ? match : _makeNodeTitleMatcher(match);
        var res = [];
        this.visit(function(n){
            if(match(n)){
                res.push(n);
            }
        });
        return res;
    },
    /**Find first node that contains `match` in the title (not including self).
     * 
     * @param {String | function(node)} match string to search for, of a function that 
     * returns `true` if a node is matched.
     * @returns {FancytreeNode} matching node or null
     * @example
     * <b>fat</b> text
     */
    findFirst: function(match) {
        match = $.isFunction(match) ? match : _makeNodeTitleMatcher(match);
        var res = null;
        this.visit(function(n){
            if(match(n)){
                res = n;
                return false;
            }
        });
        return res;
    },
	// TODO: focus()
	// TODO: fromDict()
	/** @returns {FancytreeNode[] | undefined} list of child nodes (undefined for unexpanded lazy nodes).*/
	getChildren: function() {
		if(this.hasChildren() === undefined){ // TODO: only required for lazy nodes?
			return undefined; // Lazy node: unloaded, currently loading, or load error
		}
		return this.children;
	},
    /** @returns {FancytreeNode | null}*/
	getFirstChild: function() {
		return this.children ? this.children[0] : null;
	},
	/** @returns {int} 0-based child index.*/
	getIndex: function() {
//		return this.parent.children.indexOf(this);
		return $.inArray(this, this.parent.children); // indexOf doesn't work in IE7
	},
	/**@returns {String} hierarchical child index (1-based: '3.2.4').*/
	getIndexHier: function(separator) {
		separator = separator || ".";
		var res = [];
		$.each(this.getParentList(false, true), function(i, o){
			res.push(o.getIndex() + 1);
		});
		return res.join(separator);
	},
	/**
	 * @param {Boolean} [excludeSelf=false] 
	 * @returns {String} parent keys separated by options.keyPathSeparator
	 */
	getKeyPath: function(excludeSelf) {
		var path = [],
		    sep = this.tree.options.keyPathSeparator;
		this.visitParents(function(n){
			if(n.parent){
				path.unshift(n.key);
			}
		}, !excludeSelf);
		return sep + path.join(sep);
	},
	/**@returns {FancytreeNode | null} last child of this node.*/
	getLastChild: function() {
		return this.children ? this.children[this.children.length - 1] : null;
	},
	/** @returns {int} node depth. 0: System root node, 1: visible top-level node, 2: first sub-level, .... */
	getLevel: function() {
		var level = 0,
			dtn = this.parent;
		while( dtn ) {
			level++;
			dtn = dtn.parent;
		}
		return level;
	},
	/** @returns {FancytreeNode | null} */
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
	/** @returns {FancytreeNode | null} returns null for the system root node*/
	getParent: function() {
		// TODO: return null for top-level nodes?
		return this.parent;
	},
	/**
	 * @param {Boolean} [includeRoot=false] 
	 * @param {Boolean} [includeSelf=false]
	 * @returns {FancytreeNode[]} 
	 */
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
    /** @returns {FancytreeNode | null} */
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
	/** @returns {boolean | undefined} Check if node has children (returns undefined, if not sure). */
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
    /**@returns {Boolean} true, if node has keyboard focus*/
    hasFocus: function() {
        return (this.tree.focusNode === this);
    },
	/**@returns {Boolean} true, if node is active*/
	isActive: function() {
		return (this.tree.activeNode === this);
	},
    /**
     * @param {FancytreeNode} otherNode
     * @returns {Boolean} true, if node is a direct child of otherNode
     */
	isChildOf: function(otherNode) {
		return (this.parent && this.parent === otherNode);
	},
    /**
     * @param {FancytreeNode} otherNode
     * @returns {Boolean} true, if node is a sub node of otherNode
     */
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
    /** @returns {Boolean} true, if node is expanded*/
	isExpanded: function() {
		return !!this.expanded;
	},
    /** @returns {Boolean}*/
    isFirstSibling: function() {
        var p = this.parent;
        return !p || p.children[0] === this;
    },
    /** @returns {Boolean}*/
    isFolder: function() {
        return !!this.folder;
    },
    /** @returns {Boolean}*/
	isLastSibling: function() {
		var p = this.parent;
		return !p || p.children[p.children.length-1] === this;
	},
    /** @returns {Boolean} true, if node is lazy (even if data was already loaded)*/
	isLazy: function() {
		return !!this.lazy;
	},
    /** @returns {Boolean} true, if children are currently beeing loaded*/
	isLoading: function() {
		_raiseNotImplemented(); // TODO: implement
	},
    /**@returns {Boolean} true, if node is the (invisible) system root node*/
    isRoot: function() {
        return (this.tree.rootNode === this);
    },
    /** @returns {Boolean} true, if node is selected (e.g. has a checkmark set)*/
    isSelected: function() {
        return !!this.selected;
    },
    // TODO: use _isStatusNode as class attribute name
//  isStatusNode: function() {
//      return (this.data.isStatusNode === true);
//  },
	/** Return true, if all parents are expanded. */
	isVisible: function() {
		var parents = this.getParentList(false, false);
		for(var i=0, l=parents.length; i<l; i++){
			if( ! parents[i].expanded ){ return false; }
		}
		return true;
	},
	// TODO: makeVisible()
	/** Move this node to targetNode.
	 *  @param {String} mode
	 *      'child': append this node as last child of targetNode.
	 *                This is the default. To be compatble with the D'n'd
	 *                hitMode, we also accept 'over'.
	 *  mode 'before': add this node as sibling before targetNode.
	 *  mode 'after': add this node as sibling after targetNode.
	 */
	move: function(targetNode, mode) {
		if(mode === undefined || mode === "over"){
			mode = "child";
		}
		var pos,
			prevParent = this.parent,
			targetParent = (mode === "child") ? targetNode : targetNode.parent;

		if(this === targetNode){
			return;
		}else if( !this.parent  ){
			throw "Cannot move system root";
		}else if( targetParent.isDescendantOf(this) ){
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
//		if(this.parent.ul){
//			this.parent.ul.removeChild(this.li);
//		}

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
//		if( !targetParent.ul ) {
//			// This is the parent's first child: create UL tag
//			// (Hidden, because it will be
//			targetParent.ul = document.createElement("ul");
//			targetParent.ul.style.display = "none";
//			targetParent.li.appendChild(targetParent.ul);
//		}
//		// Issue 319: Add to target DOM parent (only if node was already rendered(expanded))
//		if(this.li){
//			targetParent.ul.appendChild(this.li);
//		}
		// Handle cross-tree moves
		if( this.tree !== targetNode.tree ) {
			// Fix node.tree for all source nodes
			throw "Cross-tree move is not yet implemented.";
//			this.visit(function(n){
//				n.tree = targetNode.tree;
//			}, null, true);
		}
		// Update HTML markup
		if( !prevParent.isDescendantOf(targetParent)) {
			prevParent.render();
		}
		if( !targetParent.isDescendantOf(prevParent) && targetParent !== prevParent) {
			targetParent.render();
		}
		// TODO: fix selection state
		// TODO: fix active state

/*
		var tree = this.tree;
		var opts = tree.options;
		var pers = tree.persistence;


		// Always expand, if it's below minExpandLevel
//		tree.logDebug ("%s._addChildNode(%o), l=%o", this, ftnode, ftnode.getLevel());
		if ( opts.minExpandLevel >= ftnode.getLevel() ) {
//			tree.logDebug ("Force expand for %o", ftnode);
			this.bExpanded = true;
		}

		// In multi-hier mode, update the parents selection state
		// issue #82: only if not initializing, because the children may not exist yet
//		if( !ftnode.data.isStatusNode && opts.selectMode==3 && !isInitializing )
//			ftnode._fixSelectionState();

		// In multi-hier mode, update the parents selection state
		if( ftnode.bSelected && opts.selectMode==3 ) {
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

		return ftnode;

*/
	},
	// TODO: reload(force)
	/**
	 * Discard and reload all children of a lazy node
	 * @returns {$.Promise}
	 */
	reloadChildren: function() {
		_raiseNotImplemented(); // TODO: implement
	},
	/**
	 * @see Fancytree#nodeRender 
	 */
	render: function(force, deep) {
		return this.tree._callHook("nodeRender", this, force, deep);
	},
    /**
     * @see Fancytree#nodeRenderTitle
     */
	renderTitle: function() {
		return this.tree._callHook("nodeRenderTitle", this);
	},
    /**
     * @see Fancytree#nodeRenderStatus
     */
	renderStatus: function() {
		return this.tree._callHook("nodeRenderStatus", this);
	},
	/** Remove this node (not allowed for root).*/
	remove: function() {
        return this.parent.removeChild(this);
	},
	/**Remove childNode from list of direct children.*/
	removeChild: function(childNode) {
        return this.tree._callHook("nodeRemoveChild", this, childNode);
	},
    /**Remove all child nodes (and descendents).*/
	removeChildren: function() {
        return this.tree._callHook("nodeRemoveChildren", this);
	},
	// TODO: resetLazy()
	/** Schedule activity for delayed execution (cancel any pending request).
	 *  scheduleAction('cancel') will cancel the request.
	 */
	scheduleAction: function(mode, ms) {
		if( this.tree.timer ) {
			clearTimeout(this.tree.timer);
//            this.tree.debug("clearTimeout(%o)", this.tree.timer);
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
//        this.tree.debug("setTimeout(%s, %s): %s", mode, ms, this.tree.timer);
	},
	// TODO: select(flag)
	setActive: function(flag){
		return this.tree._callHook("nodeSetActive", this, flag);
	},
	setExpanded: function(flag){
		return this.tree._callHook("nodeSetExpanded", this, flag);
	},
	setFocus: function(){
		return this.tree._callHook("nodeSetFocus", this);
	},
	// TODO: setLazyNodeStatus
	setSelected: function(flag){
		return this.tree._callHook("nodeSetSelected", this, flag);
	},
	setTitle: function(title){
		this.title = title;
		this.renderTitle();
	},
    /**Sort child list by title.
     * @param {function} [cmd] custom compare function.
     * @param {Boolean} [deep] pass true to sort all descendant nodes
     */
    sortChildren: function(cmp, deep) {
        // TODO: not tested
        _raiseNotImplemented();
        var cl = this.children;
        if( !cl ){
            return;
        }
        cmp = cmp || function(a, b) {
            var x = a.title.toLowerCase(),
                y = b.title.toLowerCase();
            return x === y ? 0 : x > y ? 1 : -1;
            };
        cl.sort(cmp);
        if( deep ){
            for(var i=0, l=cl.length; i<l; i++){
                if( cl[i].children ){
                    cl[i].sortChildren(cmp, "$norender$");
                }
            }
        }
        if( deep !== "$norender$" ){
            this.render();
        }
    },
    // TODO: toDict: function(recursive, callback)
	toggleExpanded: function(){
		return this.tree._callHook("nodeToggleExpanded", this);
	},
	toggleSelected: function(){
		return this.tree._callHook("nodeToggleSelected", this);
	},
	toString: function() {
		return "FancytreeNode<" + this.key + ", '" + this.title + "'>";
	},
	/** Call fn(node) for all child nodes. Stop iteration, if fn() returns false.
	 * Skip current branch, if fn() returns 'skip'.
	 * @param {function} fn the callback function.
	 *     Return false to stop iteration, return "skip" to skip this node and children only.
	 * @param {Boolean} [includeSelf=false]
	 * @returns {Boolean} false, if the iterator was stopped.
	 */
	visit: function(fn, includeSelf) {
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
	/**
	 * 
	 * @param fn
	 * @param includeSelf
	 * @returns {Boolean}
	 */
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
};


/* *****************************************************************************
 * Fancytree
 */
/**
 * Construct a new tree.
 * @class The controller behind a fancytree.
 * @name Fancytree
 * @constructor 
 * @param {Widget} widget
 * 
 * @property {FancytreeOptions} options
 * @property {FancytreeNode} rootNode
 * @property {FancytreeNode} activeNode
 * @property {FancytreeNode} focusNode 
 * @property {jQueryObject} $div
 * @property {jQueryObject} $widget
 * @property {String} _id
 * @property {String} statusClassPropName
 * @property {String} nodeContainerAttrName
 * @property {FancytreeNode} lastSelectedNode
 */
function Fancytree($widget){
	// TODO: rename $widget to widget (it's not a jQuery object)
	this.$widget = $widget;
	this.$div = $widget.element;
	this.options = $widget.options;
	this._id = $.ui.fancytree._nextId++;
	this.activeNode = null;
	this.focusNode = null;
	this.statusClassPropName = "span";
	this.lastSelectedNode = null;

	// Remove previous markup if any
	this.$div.find(">ul.fancytree-container").remove();

	// Create a node without parent.
	var fakeParent = { tree: this },
		$ul;
	this.rootNode = new FancytreeNode(fakeParent, {
		title: "root",
		key: "root_" + this._id,
		children: null
	});
	this.rootNode.parent = null;

	// Create root markup
	$ul = $("<ul>", {
		"class": "fancytree-container"
	}).appendTo(this.$div);
	this.rootNode.ul = $ul[0];
	this.nodeContainerAttrName = "li";
}


Fancytree.prototype = /**@lends Fancytree*/{
	/** Return a context object that can be re-used for _callHook().
     * @param {Fancytree | FancytreeNode | HookContext} obj
     * @param {Event} orgEvent
     * @returns {HookContext} 
	 */
	_makeHookContext: function(obj, orgEvent) {
		if(obj.node !== undefined){
			// obj is already a context object
			if(orgEvent){
				$.error("invalid args");
			}
			return obj;
		}else if(obj.tree){
			// obj is a FancytreeNode
			var tree = obj.tree;
			return { node: obj, tree: tree, widget: tree.$widget, options: tree.$widget.options, orgEvent: orgEvent };
		}else if(obj.$widget){
			// obj is a Fancytree
			return { node: null, tree: obj, widget: obj.$widget, options: obj.$widget.options, orgEvent: orgEvent };
		}
		$.error("invalid args");
	},
	/** Trigger a hook function: funcName(ctx, [...]).
	 * 
     * @param {HookContext} ctx 
     * @param {any} [arguments] 
	 * @returns TODO:
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
/* TODO: implement
	activateKey: function(key) {
        var ftnode = (key === null) ? null : this.getNodeByKey(key);
        if( !ftnode ) {
            if( this.activeNode ){
                this.activeNode.deactivate();
            }
            this.activeNode = null;
            return null;
        }
        ftnode.focus();
        ftnode.activate();
        return ftnode;
    },
    */
	/**
	 * 
	 * @param {Array} patchList array of [key, NodePatch] arrays
     * @returns {$.Promise} resolved, when all patches have been applied
     * @see NodePatch
	 */
    applyPatch: function(patchList) {
        var patchCount = patchList.length, 
            p2, key, patch, node,
            deferredList = [];
        for(var i=0; i<patchCount; i++){
            p2 = patchList[i];
            _assert(p2.length === 2, "patchList must be an array of length-2-arrays");
            key = p2[0];
            patch = p2[1];
            node = (key === null) ? this.rootNode : this.getNodeByKey(key);
            if(node){
                var dfd = new $.Deferred();
                deferredList.push(dfd);
                node.applyPatch(patch).always(_makeResolveFunc(dfd, node));
            }else{
                this.warn("could not find node with key '" + key + "'");
            }
        }
        // Return a promise that is resovled, when ALL patches were applied
        return $.when.apply($, deferredList).promise();
    },
    /* TODO: implement in dnd extension
    cancelDrag: function() {
        var dd = $.ui.ddmanager.current;
        if(dd){
            dd.cancel();
        }
    },
   */
    count: function() {
        return this.rootNode.countChildren();
    },
    // TODO: disable()
	debug: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		DT.debug.apply(this, arguments);
	},
    // TODO: enable()
    // TODO: enableUpdate()
	// TODO: fromDict
	// TODO: getActiveNode()
	getNodeByKey: function(key, searchRoot) {
		// Search the DOM by element ID (assuming this is faster than traversing all nodes).
		// $("#...") has problems, if the key contains '.', so we use getElementById()
		if(!searchRoot){
			var el = document.getElementById(this.options.idPrefix + key);
			if( el ){
				return el.ftnode ? el.ftnode : null;
			}
		}
		// Not found in the DOM, but still may be in an unrendered part of tree
		// TODO: optimize with specialized loop
		// TODO: consider keyMap?
		var match = null;
		searchRoot = searchRoot || this.rootNode;
		searchRoot.visit(function(node){
//            window.console.log("getNodeByKey(" + key + "): ", node.key);
			if(node.key === key) {
				match = node;
				return false;
			}
		}, true);
		return match;
	},
	// TODO: getRoot()
	/**
	 * Return a list of selected nodes.
	 * @param {Boolean} [stopOnParents=false] only return the topmost selected 
	 *     node (useful with selectMode 3)  
	 * @returns {FancytreeNode[]}
	 */
	getSelectedNodes: function(stopOnParents) {
		var nodeList = [];
		this.rootNode.visit(function(node){
			if( node.selected ) {
				nodeList.push(node);
				if( stopOnParents === true ){
					return "skip"; // stop processing this branch
				}
			}
		});
		return nodeList;
	},
	info: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		DT.info.apply(this, arguments);
	},
/*	
    TODO: isInitializing: function() {
        return ( this.phase=="init" || this.phase=="postInit" );
    },
    TODO: isReloading: function() {
        return ( this.phase=="init" || this.phase=="postInit" ) && this.options.persist && this.persistence.cookiesFound;
    },
    TODO: isUserEvent: function() {
        return ( this.phase=="userEvent" );
    },
*/
	/**
     * @param {String} keyPath
     * @param {function} keyPath
	 */
	/*
    _loadKeyPath: function(keyPath, callback) {
        var tree = this.tree;
        tree.logDebug("%s._loadKeyPath(%s)", this, keyPath);
        if(keyPath === ""){
            throw "Key path must not be empty";
        }
        var segList = keyPath.split(tree.options.keyPathSeparator);
        if(segList[0] === ""){
            throw "Key path must be relative (don't start with '/')";
        }
        var seg = segList.shift();

        for(var i=0, l=this.childList.length; i < l; i++){
            var child = this.childList[i];
            if( child.data.key === seg ){
                if(segList.length === 0) {
                    // Found the end node
                    callback.call(tree, child, "ok");

                }else if(child.data.isLazy && (child.childList === null || child.childList === undefined)){
                    tree.logDebug("%s._loadKeyPath(%s) -> reloading %s...", this, keyPath, child);
                    var self = this;
                    child.reloadChildren(function(node, isOk){
                        // After loading, look for direct child with that key
                        if(isOk){
                            tree.logDebug("%s._loadKeyPath(%s) -> reloaded %s.", node, keyPath, node);
                            callback.call(tree, child, "loaded");
                            node._loadKeyPath(segList.join(tree.options.keyPathSeparator), callback);
                        }else{
                            tree.logWarning("%s._loadKeyPath(%s) -> reloadChildren() failed.", self, keyPath);
                            callback.call(tree, child, "error");
                        }
                    }); // Note: this line gives a JSLint warning (Don't make functions within a loop)
                    // we can ignore it, since it will only be exectuted once, the the loop is ended
                    // See also http://stackoverflow.com/questions/3037598/how-to-get-around-the-jslint-error-dont-make-functions-within-a-loop
                } else {
                    callback.call(tree, child, "loaded");
                    // Look for direct child with that key
                    child._loadKeyPath(segList.join(tree.options.keyPathSeparator), callback);
                }
                return;
            }
        }
        // Could not find key
        tree.logWarning("Node not found: " + seg);
        return;
    },

	 */
    loadKeyPath: function(keyPath, callback) {
        var segList = keyPath.split(this.options.keyPathSeparator);
        // Remove leading '/'
        if(segList[0] === ""){
            segList.shift();
        }
        // Remove leading system root key
        if(segList[0] === this.tnRoot.data.key){
            this.logDebug("Removed leading root key.");
            segList.shift();
        }
        keyPath = segList.join(this.options.keyPathSeparator);
        return this.tnRoot._loadKeyPath(keyPath, callback);
    },
	/** _Default handling for mouse click events. */
	nodeClick: function(ctx) {
//      this.tree.logDebug("ftnode.onClick(" + event.type + "): ftnode:" + this + ", button:" + event.button + ", which: " + event.which);
		var event = ctx.orgEvent,
		    targetType = DT.getEventTargetType(event),
			node = ctx.node;
		// TODO: use switch
		// TODO: make sure clicks on embedded <input> doesn't steal focus (see table sample)
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
		// TODO: return promise?
	},
	nodeCollapseSiblings: function(ctx) {
        // TODO: return promise?
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
	nodeDblclick: function(ctx) {
	},
	/** Default handling for mouse keydown events. */
	nodeKeydown: function(ctx) {
        // TODO: return promise?
		var event = ctx.orgEvent,
			node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options,
			handled = true,
			KC = $.ui.keyCode,
			sib = null;
//      this.tree.logDebug("ftnode.onKeydown(" + event.type + "): ftnode:" + this + ", charCode:" + event.charCode + ", keyCode: " + event.keyCode + ", which: " + event.which);
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
	 *    
	 * @param {object} ctx
	 * @param {object[]|object|string|$.Promise|function} source
	 * @returns {$.Promise} The deferred will be resolved as soon as the (ajax) 
	 *     data was rendered.
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
				if(ajax.debugLazyDelay){
					// simulate a slow server
					var delay = ajax.debugLazyDelay;
					if($.isArray(delay)){ // random delay range [min..max]
						delay = delay[0] + Math.random() * (delay[1] - delay[0]);
					}
					node.debug("nodeLoadChildren waiting debug delay " + Math.round(delay) + "ms");
					dfd = $.Deferred();
					var self = this;
					setTimeout(function(){
						ajax.debugLazyDelay = false;
						self.nodeLoadChildren(ctx, ajax).complete(function(){
							dfd.resolve.apply(this, arguments);
						});
					}, delay);
					return dfd;
				}else{
					dfd = $.ajax(ajax);
				}
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
				// trigger fancytreeloadchildren (except for tree-reload)
				tree._triggerNodeEvent("loadchildren", node);
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
	/** Expand all keys that */
	nodeLoadKeyPath: function(ctx, keyPathList) {
		// TODO: implement and improve
		// http://code.google.com/p/fancytree/issues/detail?id=222
	},
	nodeMakeVisible: function(ctx) {
		// TODO: scroll as neccessary: http://stackoverflow.com/questions/8938352/fancytree-how-to-scroll-to-active-node
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
			//     $(ctx.tree.focusNode.li).removeClass("fancytree-focused");
			// }
			// ctx.tree.focusNode = ctx.node;
			// $(ctx.node.li).addClass("fancytree-focused");
		}else{
			_assert(ctx.orgEvent.type === "focusout");
			// ctx.tree.focusNode = null;
			// $(ctx.node.li).removeClass("fancytree-focused");
		}
		// $(ctx.node.li).toggleClass("fancytree-focused", ctx.orgEvent.type === "focus");
	},
	/**
	 * Remove a single direct child of ctx.node.
	 * @param ctx
	 * @param {FancytreeNode} childNode dircect child of ctx.node
	 */
    nodeRemoveChild: function(ctx, childNode) {
        var node = ctx.node,
            children = node.children;
        DT.debug("nodeRemoveChild()", node.toString(), childNode.toString());

        if( children.length === 1 ) {
            _assert(childNode === children[0]);
            return this.nodeRemoveChildren(ctx);
        }
        if( this.activeNode && (childNode === this.activeNode || this.activeNode.isDescendentOf(childNode))){
            this.activeNode.deactivate(); // TODO: don't fire events
        }
        if( this.focusNode && (childNode === this.focusNode || this.focusNode.isDescendentOf(childNode))){
            this.focusNode = null;
        }
        // TODO: persist must take care to clear select and expand cookies
        var subCtx = $.extend({}, ctx, {node: childNode});
        this.nodeRemoveMarkup(subCtx);
        this.nodeRemoveChildren(subCtx);
        var idx = $.inArray(childNode, children);
        _assert(idx >= 0);
        // Unlink to support GC
        childNode.visit(function(n){
            n.parent = null;
        }, true);
        // remove from child list
        children.splice(idx, 1);
    },
    /**Remove HTML markup for all descendents of ctx.node.
     * @param {HookContext} ctx
     */
    nodeRemoveChildMarkup: function(ctx) {
        var node = ctx.node;
        DT.debug("nodeRemoveChildMarkup()", node.toString());
        // TODO: Unlink attr.ftnode to support GC
        if(node.ul){
            $(node.ul).remove();
            node.visit(function(n){
                n.li = n.ul = null;
            });
            node.ul = null;
        }
    },
    /**Remove all descendants of ctx.node.
    * @param {HookContext} ctx
    */
    nodeRemoveChildren: function(ctx) {
        var node = ctx.node,
            children = node.children;
        DT.debug("nodeRemoveChildren()", node.toString());
        if(!children){
            return;
        }
        if( this.activeNode && this.activeNode.isDescendentOf(node)){
            this.activeNode.deactivate(); // TODO: don't fire events
        }
        if( this.focusNode && this.focusNode.isDescendentOf(node)){
            this.focusNode = null;
        }
        // TODO: persist must take care to clear select and expand cookies
        this.nodeRemoveChildMarkup(ctx);
        // Unlink children to support GC
        // TODO: also delete this.children (not possible using visit())
        node.visit(function(n){
            n.parent = null;
        });
        // Set to 'undefined' which is interpreted as 'not yet loaded' for lazy nodes
        node.children = undefined;
        // TODO: ? this._isLoading = false;
        this.nodeRenderStatus(ctx);
    },
    /**Remove HTML markup for ctx.node and all its descendents.
     * @param {HookContext} ctx
     */
	nodeRemoveMarkup: function(ctx) {
		var node = ctx.node;
		DT.debug("nodeRemoveMarkup()", node.toString());
        // TODO: Unlink attr.ftnode to support GC
		if(node.li){
			$(node.li).remove();
			node.li = null;
		}
		this.nodeRemoveChildMarkup(ctx);
	},
	/**
	 * Create `<li><span>..</span> .. </li>` tags for this node.
	 *
	 * This method takes care that all HTML markup is created that is required
	 * to display this node in it's current state.
	 *
	 * Call this method to create new nodes, or after the strucuture
	 * was changed (e.g. after moving this node or adding/removing children)
	 * nodeRenderTitle() and nodeRenderStatus() are implied.
	 *
	 * Note: if a node was created/removed, nodeRender() must be called for the
	 *       parent!
	 * <code>
	 * <li id='KEY' ftnode=NODE>
	 *     <span class='fancytree-node fancytree-expanded fancytree-has-children fancytree-lastsib fancytree-exp-el fancytree-ico-e'>
	 *         <span class="fancytree-expander"></span>
	 *         <span class="fancytree-checkbox"></span> // only present in checkbox mode
	 *         <span class="fancytree-icon"></span>
	 *         <a href="#" class="fancytree-title"> Node 1 </a>
	 *     </span>
	 *     <ul> // only present if node has children
	 *         <li id='KEY' ftnode=NODE> child1 ... </li>
	 *         <li id='KEY' ftnode=NODE> child2 ... </li>
	 *     </ul>
	 * </li>
	 * </code>
	 *
	 * @param: {HookContext} ctx
	 * @param: force re-render, even if html markup was already created
	 * @param: deep also render all descendants, even if parent is collapsed
	 * @param: collapsed force root node to be collapsed, so we can apply animated expand later
	 * @param: _recursive internal use only (don't pass it)
	 */
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		/* This method must take care of all cases where the current data mode
		 * (i.e. node hierarchy) does not match the current markup.
		 *
		 * - node was not yet rendered:
		 *   create markup
		 * - node was rendered
		 *   exit fast
		 * - children have been added
		 * - childern have been removed
		 *
		 *
		 */
		var node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options,
			firstTime = false,
			parent = node.parent,
			isRootNode = !parent,
			children = node.children,
			i, l;
		DT.debug("nodeRender(" + !!force + ", " + !!deep + ")", node.toString());

		_assert(isRootNode || parent.ul, "parent UL must exist");

		// Render the node
		if( !isRootNode ){
			// Discard markup on force-mode, or if if it is not linked to parent <ul>
			if(node.li && (force || (node.li.parentNode !== node.parent.ul) ) ){
				if(node.li.parentNode !== node.parent.ul){
					alert("unlink " + node + " (must be child of " + node.parent + ")");
				}
				this.nodeRemoveMarkup(ctx);
			}
			// Create <li><span /> </li>
			if( !node.li ) {
				firstTime = true;
				node.li = document.createElement("li");
				node.li.ftnode = node;
				if( node.key && opts.generateIds ){
					node.li.id = opts.idPrefix + node.key;
				}
				node.span = document.createElement("span");
				node.span.className = "fancytree-node";
				node.li.appendChild(node.span);
				// Note: we don't add the LI to the DOM know, but only after we
				// added all sub elements (hoping that this performs better since
				// the browser only have to render once)
				// TODO: benchmarks to prove this
//                parent.ul.appendChild(node.li);

				// Create inner HTML for the <span> (expander, checkbox, icon, and title)
				this.nodeRenderTitle(ctx);

				// Allow tweaking and binding, after node was created for the first time
				if(opts.onCreate){
					// TODO: _trigger
					opts.onCreate.call(tree, node, node.span);
				}
			}
			// Allow tweaking after node state was rendered
			if(opts.onRender){
				// TODO: _trigger
				opts.onRender.call(tree, node, node.span);
			}
		}

		// Visit child nodes
		if( children ){
			if( isRootNode || node.expanded || deep === true ) {
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
				for(i=0, l=children.length; i<l; i++) {
					var subCtx = $.extend({}, ctx, {node: children[i]});
					this.nodeRender(subCtx, force, deep, false, true);
				}
				// Make sure, that <li> order matches node.children order.
//                this.nodeFixOrder(ctx);
				var childLI = node.ul.firstChild;
				for(i=0, l=children.length-1; i<l; i++) {
					var childNode1 = children[i],
						childNode2 = childLI.ftnode;
					if( childNode1 !== childNode2 ) {
						node.debug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
						node.ul.insertBefore(childNode1.li, childNode2.li);
					} else {
						childLI = childLI.nextSibling;
					}
				}
				// TODO: need to check, if node.ul has <li>s, that are not in node.children[] ?
			}
		}else{
			// No children: remove markup if any
			if( node.ul ){
				alert("remove child markup for " + node);
				this.nodeRemoveChildMarkup(ctx);
			}
		}
		if( !isRootNode ){
			// Update element classes according to node state
			this.nodeRenderStatus(ctx);
			// Finally add the whole structure to the DOM, so the browser can render
			if(firstTime){
				parent.ul.appendChild(node.li);
			}
		}
		return;
	},
	/** Create HTML for the node's outer <span> (expander, checkbox, icon, and title).
     * @param {HookContext} ctx
     */
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
		if(!node.span){
		    // Silently bail out if node was not rendered yet, assuming 
		    // node.render() will be called as the node becomes visible
		    return;
		}
		// connector (expanded, expandable or simple)
		// TODO: optiimize this if clause
		if( level < opts.minExpandLevel ) {
			if(level > 1){
				ares.push("<span class='fancytree-expander'></span>");
			}
			// .. else (i.e. for root level) skip expander/connector alltogether
		} else {
			ares.push("<span class='fancytree-expander'></span>");
		}
		// Checkbox mode
		if( opts.checkbox && node.hideCheckbox !== true && !node.isStatusNode ) {
			ares.push("<span class='fancytree-checkbox'></span>");
		}
		// folder or doctype icon
		if ( node.icon ) {
			ares.push("<img src='" + opts.imagePath + node.icon + "' alt='' />");
		} else if ( node.icon !== false ) {
			// icon == false means 'no icon', icon == null means 'default icon'
			ares.push("<span class='fancytree-icon'></span>");
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
				nodeTitle = '<span class="fancytree-title"' + tooltip + '>' + node.title + '</span>';
			} else {
				nodeTitle = '<a href="' + href + '" class="fancytree-title"' + tooltip + '>' + node.title + '</a>';
			}
		}
		ares.push(nodeTitle);
		// Note: this will trigger focusout, if node had the focus
		node.span.innerHTML = ares.join("");
	},
	/** Update element classes according to node state.
     * @param {HookContext} ctx
     */
	nodeRenderStatus: function(ctx) {
		// Set classes for current status
		var node = ctx.node,
			tree = ctx.tree,
//			nodeContainer = node[tree.nodeContainerAttrName],
			hasChildren = node.hasChildren(),
			isLastSib = node.isLastSibling(),
			cn = ctx.options._classNames,
			cnList = [];

		if( !node[tree.statusClassPropName]){
			// if this function is called for an unrendered node, ignore it (will be updated on nect render anyway)
			return;
		}
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
     * @param {HookContext} ctx
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
//			return $.Deferred(function(){this.resolveWith(node);}).promise();
            return _getResolvedPromise(node);
		}else if(flag && this._triggerNodeEvent("queryactivate", node, ctx.orgEvent) === false ){
			// Callback returned false
//			return $.Deferred(function(){this.rejectWith(node, ["rejected"]);}).promise();
            return _getRejectedPromise(node, ["rejected"]);
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
	/** Expand or collapse node, return Deferred.promise.
	 * 
     * @param {HookContext} ctx
	 * @returns {$.Promise} The deferred will be resolved as soon as the (lazy) 
	 *     data was retrieved, rendered, and the expand animation finshed.
	 */
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
            return _getResolvedPromise(node);
		}else if(flag && !node.lazy && !node.hasChildren() ){
			// Prevent expanding of empty nodes
            return _getRejectedPromise(node, ["empty"]);
		}else if( !flag && node.getLevel() < opts.minExpandLevel ) {
			// Prevent collapsing locked levels
            return _getRejectedPromise(node, ["locked"]);
		}else if ( this._triggerNodeEvent("queryexpand", node, ctx.orgEvent) === false ){
			// Callback returned false
            return _getRejectedPromise(node, ["rejected"]);
		}
		//
		var dfd = new $.Deferred();

		// Auto-collapse mode: collapse all siblings
		if( flag && !node.expanded && opts.autoCollapse ) {
			var parents = node.getParentList(false, true),
			    prevAC = opts.autoCollapse;
			try{
	            opts.autoCollapse = false;
	            for(var i=0, l=parents.length; i<l; i++){
	                // TODO: should return promise?
	                this._callHook("nodeCollapseSiblings", parents[i]);
	            }
			}finally{
	            opts.autoCollapse = prevAC;
			}
		}
		// Trigger expand/collapse after expanding
		dfd.done(function(){
			ctx.tree._triggerNodeEvent(flag ? "expand" : "collapse", ctx);
		});

		// vvv Code below is executed after loading finished:
		var _afterLoad = function(){
			node.expanded = flag;
			// Create required markup, but make sure the top UL is hidden, so we
			// can animate later
			tree._callHook("nodeRender", ctx, false, false, true);

			// If the currently active node is now hidden, deactivate it
			// if( opts.activeVisible && this.activeNode && ! this.activeNode.isVisible() ) {
			//     this.activeNode.deactivate();
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
					node.warn("nodeSetExpanded: UL.style.display already set");
					dfd.resolveWith(node);
				} else if( opts.fx ) {
					var duration = opts.fx.duration || 200,
						easing = opts.fx.easing;
                    node.debug("nodeSetExpanded: animate start...");
					$(node.ul).animate(opts.fx, duration, easing, function(){
	                    node.debug("nodeSetExpanded: animate done");
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
            node.debug("nodeSetExpanded: load start...");
			this._callHook("nodeLoadChildren", ctx, source).done(function(){
                node.debug("nodeSetExpanded: load done");
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
        node.debug("nodeSetExpanded: returns");
		return dfd.promise();
	},
	/**
     * @param {HookContext} ctx
	 */
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
			// http://code.google.com/p/fancytree/issues/detail?id=154
			$(node.span).find(">a").focus();
		} catch(e) { }
		this._triggerNodeEvent("focus", ctx);
		this._callHook("nodeRenderStatus", ctx);
	},
	/*
	_setSubSel: function(hasSubSel) {
		if( hasSubSel ) {
			this.hasSubSel = true;
			$(this.span).addClass(this.tree.options.classNames.partsel);
		} else {
			this.hasSubSel = false;
			$(this.span).removeClass(this.tree.options.classNames.partsel);
		}
	},
	*/
	/*
	 * Fix selection and partsel status, of parent nodes, according to current status of
	 * end nodes.
	 */
	/*
	_updatePartSelectionState: function() {
//		alert("_updatePartSelectionState " + this);
//		this.tree.logDebug("_updatePartSelectionState() - %o", this);
		var sel;
		// Return `true` or `false` for end nodes and remove part-sel flag
		if( ! this.hasChildren() ){
			sel = (this.bSelected && !this.data.unselectable && !this.data.isStatusNode);
			this._setSubSel(false);
			return sel;
		}
		// Return `true`, `false`, or `undefined` for parent nodes
		var i, l,
			cl = this.childList,
			allSelected = true,
			allDeselected = true;
		for(i=0, l=cl.length; i<l;  i++) {
			var n = cl[i],
				s = n._updatePartSelectionState();
			if( s !== false){
				allDeselected = false;
			}
			if( s !== true){
				allSelected = false;
			}
		}
		if( allSelected ){
			sel = true;
		} else if ( allDeselected ){
			sel = false;
		} else {
			sel = undefined;
		}
		this._setSubSel(sel === undefined);
		this.bSelected = (sel === true);
		return sel;
	},
*/
	/**
	 * Fix selection status, after this node was (de)selected in multi-hier mode.
	 * This includes (de)selecting all children.
	 */
	_fixSelectionState: function(node) {
//		alert("_fixSelectionState " + this);
//		this.tree.logDebug("_fixSelectionState(%s) - %o", this.bSelected, this);
		function _setPartSel(node, flag) {
			if( (flag && !node.partsel) || (!flag && node.partsel)) {
				node.partsel = !!flag;
				node.renderStatus();
			}
		}
		var p, i, l;
		if( node.selected ) {
			// Select all children
			node.visit(function(n){
				_setPartSel(n.parent, true);
				if(!n.unselectable && !n.selected){
					n.selected = true;
					n.renderStatus();
				}
			});
			// Select parents, if all children are selected
			p = node.parent;
			while( p ) {
				var allChildsSelected = true;
				for(i=0, l=p.children.length; i<l;  i++) {
					var n = p.children[i];
					if( !n.selected && !n.isStatusNode && !n.unselectable) {
						allChildsSelected = false;
						break;
					}
				}
				p.partsel = true;
				p.selected = allChildsSelected;
				p.renderStatus();
				p = p.parent;
			}
		} else {
			// Deselect all children
			_setPartSel(node, false);
			node.visit(function(n){
				_setPartSel(n, false);
				if(n.selected){
					n.selected = false;
					n.renderStatus();
				}
			});
			// Deselect parents, and recalc hasSubSel
			p = node.parent;
			while( p ) {
				var someChildsSelected = false;
				for(i=0, l=p.children.length; i<l;  i++) {
					if( p.children[i].selected || p.children[i].partsel ) {
						someChildsSelected = true;
						break;
					}
				}
				p.selected = false;
				p.partsel = someChildsSelected;
				p.renderStatus();
				p = p.parent;
			}
		}
	},
	/** (De)Select node, return new status (sync).
	 * 
     * @param {HookContext} ctx
	 * @param flag
	 */
	nodeSetSelected: function(ctx, flag) {
		var node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options;
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
		if(flag && opts.selectMode === 1){
			// single selection mode
			if(tree.lastSelectedNode){
				tree.lastSelectedNode.setSelected(false);
			}
		}else if(opts.selectMode === 3){
			// multi.hier selection mode
			node.selected = flag;
			this._fixSelectionState(node);
		}
		node.selected = flag;
		this.nodeRenderStatus(ctx);
		tree.lastSelectedNode = flag ? node : null;
		tree._triggerNodeEvent("select", ctx);
	},
	/** Show node status (ok, loading, error) using styles and a dummy child node.
	 * 
     * @param {HookContext} ctx
	 * @param status
	 * @param message
	 * @param details
	 */
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
		  $(node.span).removeClass("fancytree-loading");
		  break;
		case "loading":
			$(node.span).addClass("fancytree-loading");
			if(!node.parent){
				_setStatusNode({
					title: tree.options.strings.loading +
						(message ? " (" + message + ") " : ""),
					tooltip: details,
					extraClasses: "fancytree-statusnode-wait"
				});
			}
			break;
		case "error":
			$(node.span).addClass("fancytree-error");
			_setStatusNode({
				title: tree.options.strings.loadError + " (" + message + ")",
				tooltip: details,
				extraClasses: "fancytree-statusnode-error"
			});
			break;
		default:
			$.error("invalid status " + status);
		}
	},
	/**
	 * 
     * @param {HookContext} ctx
     */
	nodeToggleExpanded: function(ctx) {
		return this.nodeSetExpanded(ctx, !ctx.node.expanded);
	},
	/**
     * @param {HookContext} ctx
     */
	nodeToggleSelected: function(ctx) {
		return this.nodeSetSelected(ctx, !ctx.node.selected);
	},
	/** Remove all nodes. 
     * @param {HookContext} ctx
     */
	treeClear: function(ctx) {
		var tree = ctx.tree;
		tree.activeNode = null;
		tree.focusNode = null;
		tree.$div.find(">ul.fancytree-container").empty();
		// TODO: call destructors and remove reference loops
		tree.rootNode.children = null;
	},
	/** Widget was created (called only once, even it re-initialized).
     * @param {HookContext} ctx
     */
	treeCreate: function(ctx) {
	},
	/** Widget was destroyed.
     * @param {HookContext} ctx
     */
	treeDestroy: function(ctx) {
	},
	/** Widget was (re-)initialized.
     * @param {HookContext} ctx
     */
	treeInit: function(ctx) {
		this.treeLoad(ctx);
	},
	/** Parse Fancytree from source, as configured in the options.
     * @param {HookContext} ctx
	 * @param {object} [source] new source 
	 */
	treeLoad: function(ctx, source) {
		var tree = ctx.tree,
			$container = ctx.widget.element,
			dfd,
			// calling context for root node
			rootCtx = $.extend({}, ctx, {node: this.rootNode});

		if(tree.rootNode.children){
			this.treeClear(ctx);
		}
		source = source || this.options.source;

		if(!source){
			var type = $container.data("type") || "html",
				$ul;
			switch(type){
			case "html":
				$ul = $container.find(">ul:first");
				$ul.addClass("ui-fancytree-source ui-helper-hidden");
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
		// Trigger fancytreeinit after nodes have been loaded
		dfd = this.nodeLoadChildren(rootCtx, source).done(function(){
			tree.render();
			tree._triggerTreeEvent("init", true);
		}).fail(function(){
			tree.render();
			tree._triggerTreeEvent("init", false);
		});
		return dfd;
	},
    // TODO: reactivate()
    // TODO: redraw()
	/** Reload tree from source and return a promise.
	 * @param source
	 * @returns {$.Promise}
	 */
	reload: function(source) {
		this._callHook("treeClear", this);
		return this._callHook("treeLoad", this, source);
	},
	/**Render tree (i.e. all top-level nodes).
     * @param {Boolean} [force=false] 
     * @param {Boolean} [deep=false] 
	 */
	render: function(force, deep) {
		return this.rootNode.render(force, deep);
	},
	// TODO: selectKey: function(key, select)
	// TODO: serializeArray: function(stopOnParents)
	// TODO: toDict()  with optional callback?
    /**Implicitly called for string conversions.
     * @returns {String} 
     */
    toString: function(){
        return "Fancytree<" + this._id + ">";
    },
	/** _trigger a widget event with additional node ctx.
	 * @see HookContext
	 */
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
	/**
	 * 
	 * @param {function} fn
	 */
	visit: function(fn) {
		return this.rootNode.visit(fn, false);
	},
	warn: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		DT.warn.apply(this, arguments);
	}
};


/* ******************************************************************************
 * jQuery UI widget boilerplate
 * @  name ui_fancytree  
 * @  class The jQuery.ui.fancytree widget
 */
/* * @namespace ui */
/* * @namespace ui.fancytree */
/** @namespace $.ui.fancytree */
$.widget("ui.fancytree", 
	/** @lends $.ui.fancytree.prototype */
	{
	/**These options will be used as defaults 
	 * @type {FancytreeOptions} 
	 */
	options: 
	{
	    // TODO: required anymore?
		disabled: false,
		ajax: {
			type: "GET",
			cache: false, // false: Append random '_' argument to the request url to prevent caching.
//          timeout: 0, // >0: Make sure we get an ajax error if error is unreachable
			dataType: "json" // Expect json format and pass json object to callbacks.
		},  //
		/** @type {Boolean}  Make sure, active nodes are visible (expanded). */
		activeVisible: true, // Make sure, active nodes are visible (expanded).
		autoCollapse: false,
		checkbox: false,
		/**defines click behavior*/
		clickFolderMode: 3,
		extensions: [],
		fx: { height: "toggle", duration: 200 },
//		hooks: {},
		idPrefix: "dt_",
		keyPathSeparator: "/",
		strings: {
			loading: "Loading&#8230;",
			loadError: "Load error!"
		},
		_classNames: {
			container: "fancytree-container",
			node: "fancytree-node",
			folder: "fancytree-folder",
			empty: "fancytree-empty",
			vline: "fancytree-vline",
			expander: "fancytree-expander",
//            connector: "fancytree-connector",
			checkbox: "fancytree-checkbox",
			icon: "fancytree-icon",
			title: "fancytree-title",
			noConnector: "fancytree-no-connector",
			statusnodeError: "fancytree-statusnode-error",
			statusnodeWait: "fancytree-statusnode-wait",
			hidden: "fancytree-hidden",
			combinedExpanderPrefix: "fancytree-exp-",
			combinedIconPrefix: "fancytree-ico-",
			loading: "fancytree-loading",
			hasChildren: "fancytree-has-children",
			active: "fancytree-active",
			selected: "fancytree-selected",
			expanded: "fancytree-expanded",
			lazy: "fancytree-lazy",
			focused: "fancytree-focused",
			partsel: "fancytree-partsel",
			lastsib: "fancytree-lastsib"
		},
		// events
		lazyload: null
	},
	/* Set up the widget, Called on first $().fancytree() */
	_create: function() {
		this.tree = new Fancytree(this);
		this._bind();
		this.$source = this.source
			|| this.element.data("type") === "json" ? this.element
			: this.element.find(">ul:first");
		// Subclass Fancytree instance with all enabled extensions
		var extensions = this.options.extensions,
			base = this.tree;
		for(var i=0; i<extensions.length; i++){
			var extName = extensions[i],
				extension = $.ui.fancytree._extensions[extName];
			if(!extension){
				$.error("Could not apply extension '" + extName + "' (it is not registered, did you forget to include it?)");
			}
			// Add extension options as tree.options.EXTENSION
//			_assert(!this.tree.options[extName], "Extension name must not exist as option name: " + extName);
			this.tree.options[extName] = $.extend(true, {}, extension.options, this.tree.options[extName]);
			// Add a namespace tree.EXTENSION, to hold instance data
			_assert(!this.tree[extName], "Extension name must not exist as Fancytree attribute: " + extName);
//			this.tree[extName] = extension;
			this.tree[extName] = {};
			// Subclass Fancytree methods using proxies.
			_subclassObject(this.tree, base, extension, extName);
			// current extension becomes base for the next extension
			base = extension;
		}
		//
		this.tree._callHook("treeCreate", this.tree);
		// Note: 'fancytreecreate' event is fired by widget base class
//        this.tree._triggerTreeEvent("create");
	},

	/* Called on every $().fancytree() */
	_init: function() {
		this.tree._callHook("treeInit", this.tree);
		// Note: 'fancytreeinit' event is fired by 
//		this.tree._triggerTreeEvent("init");
	},

	/* Use the _setOption method to respond to changes to options */
	_setOption: function(key, value) {
		var callDefault = true,
			rerender = false;
		switch( key ) {
		case "checkbox":
		case "minExpandLevel":
		case "nolink":
			this.tree._callHook("treeCreate", this.tree);
			rerender = true;
			break;
		case "source":
			callDefault = false;
			this.tree._callHook("treeLoad", this.tree, value);
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

	/** Use the destroy method to clean up any modifications your widget has made to the DOM */
	destroy: function() {
		this._unbind();
		this.tree._callHook("treeDestroy", this.tree);
		// this.element.removeClass("ui-widget ui-widget-content ui-corner-all");
		this.tree.$div.find(">ul.fancytree-container").remove();
		var _ = this.$source && this.$source.removeClass("ui-helper-hidden");
		// In jQuery UI 1.8, you must invoke the destroy method from the base widget
		$.Widget.prototype.destroy.call( this );
		// TODO: delete tree and nodes to make garbage collect easier?
		// TODO: In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
	},

	// -------------------------------------------------------------------------

	/* Add mouse and kyboard handlers to the container */
	_bind: function() {
		var that = this,
			opts = this.options,
			eventNames = $.map(["click", "dblclick", /*"keypress", "keydown",*/
				"focusin", "focusout"/*, "focus", "blur", "mousein", "mouseout" */],
				function(name){
					return name + "." + that.widgetName + "-" + that.tree._id;
				}).join(" ");

		this._unbind();
		$(document).bind("keydown.fancytree-" + this.tree._id, function(event){
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
	/** @returns {FancytreeNode} the active node or null */
	getActiveNode: function() {
		return this.tree.activeNode;
	},
	/**
	 * @param {String} key 
	 * @returns {FancytreeNode} the matching node or null 
	 */
	getNodeByKey: function(key) {
		return this.tree.getNodeByKey(key);
	},
	/** @returns {FancytreeNode} the invisible system root node */
	getRootNode: function() {
		return this.tree.rootNode;
	},
	/** @returns {Fancytree} the current tree instance */
	getTree: function() {
		return this.tree;
	},
	/* Remove all event handlers for our namespace */
	_unbind: function() {
		this.element.unbind("." + this.widgetName + "-" + this.tree._id);
	}
});

// $.ui.fancytree was created by the widget factory. Create a local shortcut:
var DT = $.ui.fancytree;

/* *****************************************************************************
 * Static members in the jQuery.ui.fancytree namespace
 */

function consoleApply(method, args){
	var fn = window.console ? window.console[method] : null;
	if(fn && fn.apply){
		fn.apply(window.console, args);
	}
}

/**
 * @  name $.ui.fancytree
 */
$.extend($.ui.fancytree, 
    /** @lends ui.fancytree */ 
    {
    /** @type {String} */
	version: "2.0.0pre",
    /** @type {int} */
	debugLevel: 2,

	_nextId: 1,
	_nextNodeKey: 1,
	_extensions: {},
	/** Expose class object as $.ui.fancytree._FancytreeClass */
	_FancytreeClass: Fancytree, 
    /** Expose class object as $.ui.fancytree._FancytreeNodeClass */
	_FancytreeNodeClass: FancytreeNode,

	debug: function(msg){
		/*jshint expr:true */
		($.ui.fancytree.debugLevel >= 2) && consoleApply("log", arguments);
//        ($.ui.fancytree.debugLevel >= 2) && window.console && window.console.log && window.console.log.apply(window.console, arguments);
	},
	error: function(msg){
		/*jshint expr:true */
		window.console && window.console.error && window.console.error.apply(window.console, arguments);
	},
	/** Return a {node: FancytreeNode, type: TYPE} object for a mouse event.
	 * 
	 * @param {Event} event Mouse event, e.g. click, ...
	 * @returns {String} 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
	 */
    getEventTargetType: function(event){
        return this.getEventTarget(event).type;
    },
    /** Return a {node: FancytreeNode, type: TYPE} object for a mouse event.
     * 
     * @param {Event} event Mouse event, e.g. click, ...
     * @returns {object} Return a {node: FancytreeNode, type: TYPE} object
     *     TYPE: 'title' | 'prefix' | 'expander' | 'checkbox' | 'icon' | undefined
     */
    getEventTarget: function(event){
		var tcn = event && event.target ? event.target.className : "",
			res = {node: this.getNode(event.target), type: undefined};
		// TODO: use map for fast lookup
		// FIXME: cannot work, when tcn also contains UI themeroller classes
		if( tcn === "fancytree-title" ){
			res.type = "title";
		}else if( tcn === "fancytree-expander" ){
			res.type = (res.node.hasChildren() === false ? "prefix" : "expander");
		}else if( tcn === "fancytree-checkbox" ){
			res.type = "checkbox";
		}else if( tcn === "fancytree-icon" ){
			res.type = "icon";
		}else if( tcn.indexOf("fancytree-node") >= 0 ){
			// TODO: issue #93 (http://code.google.com/p/fancytree/issues/detail?id=93)
//			res.type = this._getTypeForOuterNodeEvent(event);
            res.type = "title";
		}
		return res;
	},
	/** Return a FancytreeNode instance from element.
	 * 
	 * @param {Element | jQueryObject} el
	 * @returns {FancytreeNode} matching node or null
	 */
	getNode: function(el){
		if(el instanceof FancytreeNode){
			return el; // el already was a FancytreeNode
		}
		if(el.selector !== undefined){
			el = el[0]; // el was a jQuery object: use the DOM element
		}
		// $el.parents("[ftnode]") does not work (jQuery 1.6.1), maybe because
		// ftnode is a property, not an attribute. This is faster anyway:
		while( el ) {
			if(el.ftnode) {
				return el.ftnode;
			}
			el = el.parentNode;
		}
		return null;
	},
	info: function(msg){
		/*jshint expr:true */
		(DT.debugLevel >= 1) && window.console && window.console.info && window.console.info.apply(window.console, arguments);
	},
	/** Add Fancytree extension definition to the list of globally available extensions.
	 * 
	 * @param name
	 * @param definition
	 */
	registerExtension: function(name, definition){
		$.ui.fancytree._extensions[name] = definition;
	},
	warn: function(msg){
		/*jshint expr:true */
		window.console && window.console.warn && window.console.warn.apply(window.console, arguments);
	}
});

/* *****************************************************************************
 * Register AMD
 */
// http://stackoverflow.com/questions/10918063/how-to-make-a-jquery-plugin-loadable-with-requirejs

// if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
//     define( "jquery", [], function () { return jQuery; } );
// }

// TODO: maybe like so:?
/*
if( typeof define === "function" && define.amd ) {
	define( ["jquery"], function () {
		return jQuery.ui.fancytree;
	});
}
*/
}(jQuery));  //


/* *****************************************************************************
 * Fancytree extension: profiler
 */
(function($) {
	$.ui.fancytree.registerExtension("profiler", {
		// Default options for this extension
		options: {
			prefix: ""
		},
		// Overide virtual methods for this extension
		nodeRender: function(ctx, force, deep, collapsed){
			// ctx.tree.debug("**** PROFILER nodeRender");
			var s = this.options.prefix + "render '" + ctx.node + "'";
			/*jshint expr:true */
			window.console && window.console.time && window.console.time(s);
			this._super(ctx, force, deep, collapsed);
			window.console && window.console.timeEnd && window.console.timeEnd(s);
		}
	 });
}(jQuery));


/*******************************************************************************
 * Fancytree extension: aria
 */
(function($) {
	$.ui.fancytree.registerExtension("aria", {
		// Default options for this extension.
		options: {
		},
		// Overide virtual methods for this extension.
		// `this`       : is this extension object
		// `this._base` : the Fancytree instance
		// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
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
