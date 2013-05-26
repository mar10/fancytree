/*!
 * jquery.fancytree.js
 * Dynamic tree view control, with support for lazy loading of branches.
 *
 * Copyright (c) 2008-2013, Martin Wendt (http://wwWendt.de)
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
	$Version:$
	$Revision:$

	@depends: jquery.js
	@depends: jquery.ui.widget.js
	@depends: jquery.ui.core.js
	@depends: jquery.cookie.js
*************************************************************************/

// Start of local namespace
;(function($, window, document, undefined) {
// relax some jslint checks:
/*globals alert */

"use strict";

// prevent duplicate loading
if ( $.ui.fancytree && $.ui.fancytree.version ) {
	$.ui.fancytree.warn("Fancytree: ignored duplicate include");
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
//var dummyFunc = function(){ var xyz; },
//	rexTestSuper = /xyz/.test(dummyFunc) ? /\b_super\b/ : null;

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
	CLASS_ATTRS = "active expanded focus folder lazy selected".split(" "),
	CLASS_ATTR_MAP = {};
for(i=0; i<CLASS_ATTRS.length; i++){ CLASS_ATTR_MAP[CLASS_ATTRS[i]] = true; }

// Top-level Fancytree node attributes, that can be set by dict
var NODE_ATTRS = "expanded extraClasses folder hideCheckbox key lazy selected title tooltip".split(" "),
	NODE_ATTR_MAP = {};
for(i=0; i<NODE_ATTRS.length; i++){ NODE_ATTR_MAP[NODE_ATTRS[i]] = true; }

// Attribute names that should NOT be added to node.data
var NONE_NODE_DATA_MAP = {"active": true, "children": true, "data": true, "focus": true};

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
 * @property {object} data Contains all custom data that was passed on node creation
 * @property {FancytreeNode[] | null | undefined} children list of child nodes
 * @property {Boolean} isStatusNode
 * @property {Boolean} expanded
 * @property {Boolean} folder
 * @property {Boolean} href
 * @property {String} extraClasses
 * @property {Boolean} lazy
 * @property {Boolean} nolink OBSOLETE
 * @property {Boolean} selected
 * @property {String} target
 * @property {String} tooltip
 */
function FancytreeNode(parent, obj){
	var i, l, name, cl;
	this.parent = parent;
	this.tree = parent.tree;
	this.ul = null;
	this.li = null;  // <li id='key' ftnode=this> tag
	this.isStatusNode = false;
	this.data = {};

	// TODO: merge this code with node.toDict()
	// copy attributes from obj object
	for(i=0, l=NODE_ATTRS.length; i<l; i++){
		name = NODE_ATTRS[i];
		this[name] = obj[name];
	}
	// node.data += obj.data
	if(obj.data){
		$.extend(this.data, obj.data);
	}
	// copy all other attributes to this.data.NAME
	for(name in obj){
		if(!NODE_ATTR_MAP[name] && !$.isFunction(obj[name]) && !NONE_NODE_DATA_MAP[name]){
			// node.data.NAME = obj.NAME
			this.data[name] = obj[name];
		}
	}

	// Fix missing key
	if( this.key == null ){ // test for null OR undefined
		this.key = "_" + (FT._nextNodeKey++);
	}
	// Fix tree.activeNode
	// TODO: not elegant: we use obj.active as marker to set tree.activeNode
	// when loading from a dictionary.
	if(obj.active){
		_assert(this.tree.activeNode === null, "only one active node allowed");
		this.tree.activeNode = this;
	}
	// TODO: handle obj.focus = true
	// Create child nodes
	this.children = null;
	cl = obj.children;
	if(cl && cl.length){
		this._setChildren(cl);
	}
}


FancytreeNode.prototype = /**@lends FancytreeNode*/{
	/* Return the direct child FancytreeNode with a given key, index. */
	_findDirectChild: function(ptr){
		var cl = this.children;
		if(cl){
			if(typeof ptr === "string"){
				for(var i=0, l=cl.length; i<l; i++){
					if(cl[i].key === ptr){
						return cl[i];
					}
				}
			}else if(typeof ptr === "number"){
				return this.children[ptr];
			}else if(ptr.parent === this){
				return ptr;
			}
		}
		return null;
	},
	// TODO: activate()
	// TODO: activateSilently()
	/* Internal helper called in recursive addChildren sequence.*/
	_setChildren: function(children){
		_assert(children && (!this.children || this.children.length === 0), "only init supported");
		this.children = [];
		for(var i=0, l=children.length; i<l; i++){
			this.children.push(new FancytreeNode(this, children[i]));
		}
	},
	/**
	 * Append (or insert) a list of child nodes.
	 *
	 * @param {NodeData[]} children array of child node definitions (also single child accepted)
	 * @param {FancytreeNode | String | Integer} [insertBefore] child node (or key or index of such).
	 *     If omitted, the new children are appended.
	 * @returns {FancytreeNode} first child added
	 *
	 * @see applyPatch to modify existing child nodes.
	 * @see FanctreeNode.applyPatch to modify existing child nodes.
	 * @see FanctreeNode#applyPatch to modify existing child nodes.
	 * @see applyPatch
	 * @see FanctreeNode.applyPatch
	 * @see FanctreeNode#applyPatch
	 */
	addChildren: function(children, insertBefore){
		var firstNode = null;
		if($.isPlainObject(children) ){
			children = [children];
		}
		if(!this.children){
			this.children = [];
		}
		if(insertBefore === undefined){
//            this._setChildren(children);
			for(var i=0, l=children.length; i<l; i++){
				if(i === 0){
					firstNode = new FancytreeNode(this, children[i]);
					this.children.push(firstNode);
				}else{
					this.children.push(new FancytreeNode(this, children[i]));
				}
			}
		}else{
			// TODO: not implemented
			_assert(!insertBefore, "not implemented");
			insertBefore = this._findDirectChild(insertBefore);
		}
		if(!this.parent || this.parent.ul){
			// render if the parent was rendered (or this is a root node)
			this.render();
		}
		return firstNode;
	},
	/**
	 *
	 * @param {NodePatch} patch
	 * @returns {$.Promise}
	 * @see {@link applyPatch} to modify existing child nodes.
	 * @see FancytreeNode#addChildren
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
			if(patch.children){ // only if not null and not empty list
				// TODO: addChildren instead?
				this._setChildren(patch.children);
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
	/** Count direct and indirect children.
	 *
	 * @param {Boolean} [deep=true] pass 'false' to only count direct children
	 * @returns {int} number of child nodes
	 */
	countChildren: function(deep) {
		var cl = this.children, i, l, n;
		if( !cl ){
			return 0;
		}
		n = cl.length;
		if(deep !== false){
			for(i=0, l=n; i<l; i++){
				n += cl[i].countChildren();
			}
		}
		return n;
	},
	// TODO: deactivate()
	debug: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		FT.debug.apply(this, arguments);
	},
	/** Remove all children of a lazy node and collapse.*/
	discard: function(){
		if(this.lazy && $.isArray(this.children)){
			this.removeChildren();
			return this.setExpanded(false);
		}
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
	/**
	 * Update node data. If dict contains 'children', then also replace
	 * the hole sub tree.
	 * @param {NodeData} dict
	 *
	 * @see FancytreeNode#addChildren
	 * @see FancytreeNode#applyPatch
	 */
	fromDict: function(dict) {
		// copy all other attributes to this.data.xxx
		for(var name in dict){
			if(NODE_ATTR_MAP[name]){
				// node.NAME = dict.NAME
				this[name] = dict[name];
			}else if(name === "data"){
				// node.data += dict.data
				$.extend(this.data, dict.data);
			}else if(!$.isFunction(dict[name]) && !NONE_NODE_DATA_MAP[name]){
				// node.data.NAME = dict.NAME
				this.data[name] = dict[name];
			}
		}
		if(dict.children){
			// recursively set children and render
			this.removeChildren();
			this.addChildren(dict.children);
		}else{
			this.renderTitle();
		}
/*
		var children = dict.children;
		if(children === undefined){
			this.data = $.extend(this.data, dict);
			this.render();
			return;
		}
		dict = $.extend({}, dict);
		dict.children = undefined;
		this.data = $.extend(this.data, dict);
		this.removeChildren();
		this.addChild(children);
*/
	},
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
		return (this.tree.hasFocus() && this.tree.focusNode === this);
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
	/** Expand all parents and optionally scroll into visible area as neccessary (async).
	 *
	 */
	makeVisible: function() {
		// TODO: implement scolling (http://www.w3.org/TR/wai-aria-practices/#visualfocus)
		// TODO: return $.promise
		var parents = this.getParentList(false, false);
		for(var i=0, l=parents.length; i<l; i++){
			parents[i].setExpanded(true);
		}
	},
	/** Move this node to targetNode.
	 *  @param {String} mode
	 *      'child': append this node as last child of targetNode.
	 *               This is the default. To be compatble with the D'n'd
	 *               hitMode, we also accept 'over'.
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
	/**
	 * Discard and reload all children of a lazy node.
	 * @param {Boolean} [discard=false]
	 * @returns $.Promise
	 */
	lazyLoad: function(discard) {
		if(discard){
			this.discard();
		}else{
			_assert(!$.isArray(this.children));
		}
		var source = this.tree._triggerNodeEvent("lazyload", this);
		_assert(typeof source !== "boolean", "lazyload event must return source in data.result");
		return this.tree._callHook("nodeLoadChildren", this, source);
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
	/**
	 *
	 * @param {Boolean | PlainObject} [effects=false] animation options.
	 * @param {FancytreeNode} [topNode=null] this node will remain visible in
	 *     any case, even if `this` is outside the scroll pane.
	 * @returns $.Promise
	 */
	scrollIntoView: function(effects, topNode) {
		effects = (effects === true) ? {duration: 200, queue: false} : effects;
		var dfd = new $.Deferred(),
			nodeY = $(this.span).position().top,
			nodeHeight = $(this.span).height(),
			$container = this.tree.$container,
			scrollTop = $container[0].scrollTop,
			horzScrollHeight = Math.max(0, ($container.innerHeight() - $container[0].clientHeight)),
//			containerHeight = $container.height(),
			containerHeight = $container.height() - horzScrollHeight,
			newScrollTop = null;

//		console.log("horzScrollHeight: " + horzScrollHeight);
//		console.log("$container[0].scrollTop: " + $container[0].scrollTop);
//		console.log("$container[0].scrollHeight: " + $container[0].scrollHeight);
//		console.log("$container[0].clientHeight: " + $container[0].clientHeight);
//		console.log("$container.innerHeight(): " + $container.innerHeight());
//		console.log("$container.height(): " + $container.height());

		if(nodeY < 0){
			newScrollTop = scrollTop + nodeY;
		}else if((nodeY + nodeHeight) > containerHeight){
			newScrollTop = scrollTop + nodeY - containerHeight + nodeHeight;
			// If a topNode was passed, make sure that it is never scrolled
			// outside the upper border
			if(topNode){
				var topNodeY = topNode ? $(topNode.span).position().top : 0;
				if((nodeY - topNodeY) > containerHeight){
					newScrollTop = scrollTop + nodeY;
				}
			}
		}
		if(newScrollTop !== null){
			if(effects){
				// TODO: resolve dfd after animation
//				var that = this;
				$container.animate({scrollTop: newScrollTop}, effects);
			}else{
				$container[0].scrollTop = newScrollTop;
				dfd.resolveWith(this);
			}
		}else{
			dfd.resolveWith(this);
		}
		return dfd.promise();
/* from jQuery.menu:
		var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
		if ( this._hasScroll() ) {
			borderTop = parseFloat( $.css( this.activeMenu[0], "borderTopWidth" ) ) || 0;
			paddingTop = parseFloat( $.css( this.activeMenu[0], "paddingTop" ) ) || 0;
			offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
			scroll = this.activeMenu.scrollTop();
			elementHeight = this.activeMenu.height();
			itemHeight = item.height();

			if ( offset < 0 ) {
				this.activeMenu.scrollTop( scroll + offset );
			} else if ( offset + itemHeight > elementHeight ) {
				this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
			}
		}
		*/
	},

	/**Activate this node.
	 * @param {Boolean} [flag=true] pass false to deactivate
	 */
	setActive: function(flag){
		return this.tree._callHook("nodeSetActive", this, flag);
	},
	/**Expand this node.
	 * @param {Boolean} [flag=true] pass false to collapse
	 */
	setExpanded: function(flag){
		return this.tree._callHook("nodeSetExpanded", this, flag);
	},
	/**Set keyboard focus to this node.
	 * @param {Boolean} [flag=true] pass false to blur
	 * @see Fancytree#setFocus
	 */
	setFocus: function(flag){
		return this.tree._callHook("nodeSetFocus", this, flag);
	},
	// TODO: setLazyNodeStatus
	/**Select this node.
	 * @param {Boolean} [flag=true] pass false to deselect
	 */
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
	/** Convert node (or whole branch) into a dictionary.
	 *
	 * The result is compatible with node.addChildren().
	 *
	 * @param {Boolean} recursive
	 * @param {function} callback callback(dict) is called for every dict (), in order to allow modifications
	 * @returns {NodePatch}
	 */
	toDict: function(recursive, callback) {
		var dict = {},
			self = this;
		$.each(NODE_ATTRS, function(i, a){
//			if(self[a] !== undefined && self[a] !== null){
			if(self[a] || self[a] === false){
				dict[a] = self[a];
			}
		});
		if(!$.isEmptyObject(this.data)){
			dict.data = $.extend({}, this.data);
			if($.isEmptyObject(dict.data)){
				delete dict.data;
			}
		}
		if( callback ){
			callback(dict);
		}
		if( recursive ) {
			if(this.hasChildren()){
				dict.children = [];
				for(var i=0, l=this.children.length; i<l; i++ ){
					dict.children.push(this.children[i].toDict(true, callback));
				}
			}else{
//                dict.children = null;
			}
		}
		return dict;
	},
	toggleExpanded: function(){
		return this.tree._callHook("nodeToggleExpanded", this);
	},
	toggleSelected: function(){
		return this.tree._callHook("nodeToggleSelected", this);
	},
	toString: function() {
		return "<FancytreeNode(#" + this.key + ", '" + this.title + "')>";
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
	},
	warn: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		FT.warn.apply(this, arguments);
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
 * @property {object} widget
 * @property {String} _id
 * @property {String} statusClassPropName
 * @property {String} ariaPropName
 * @property {String} nodeContainerAttrName
 * @property {FancytreeNode} lastSelectedNode
 */
function Fancytree(widget){
	// TODO: rename widget to widget (it's not a jQuery object)
	this.widget = widget;
	this.$div = widget.element;
	this.options = widget.options;
	this._id = $.ui.fancytree._nextId++;
	this._ns = ".fancytree-" + this._id; // append for namespaced events
	this.activeNode = null;
	this.focusNode = null;
	this.lastSelectedNode = null;
	this.systemFocusElement = null,

	this.statusClassPropName = "span";
	this.ariaPropName = "li";
	this.nodeContainerAttrName = "li";

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
		"class": "ui-fancytree fancytree-container"
	}).appendTo(this.$div);
	this.$container = $ul;
	this.rootNode.ul = $ul[0];

	// Add container to the TAB chain
	// See http://www.w3.org/TR/wai-aria-practices/#focus_activedescendant
	if(this.options.tabbable){
		this.$container.attr("tabindex", "0");
	}
	if(this.options.aria){
		this.$container.attr("role", "tree")
			.attr("aria-multiselectable", true);
	}
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
			if(orgEvent && obj.orgEvent !== orgEvent){
				$.error("invalid args");
			}
			return obj;
		}else if(obj.tree){
			// obj is a FancytreeNode
			var tree = obj.tree;
			return { node: obj, tree: tree, widget: tree.widget, options: tree.widget.options, orgEvent: orgEvent };
		}else if(obj.widget){
			// obj is a Fancytree
			return { node: null, tree: obj, widget: obj.widget, options: obj.widget.options, orgEvent: orgEvent };
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
//		this.debug("_hook", funcName, ctx.node && ctx.node.toString() || ctx.tree.toString(), args);
		return fn.apply(this, args);
	},
	/** Activate node with a given key.
	 *
	 * A prevously activated node will be deactivated.
	 * Pass key = false, to deactivate the current node only.
	 * @param {String} key
	 * @returns {FancytreeNode} activated node (null, if not found)
	 */
	activateKey: function(key) {
		var node = this.getNodeByKey(key);
		if(node){
			node.setActive();
		}else if(this.activeNode){
			this.activeNode.setActive(false);
		}
		return node;
	},
	/**
	 *
	 * @param {Array} patchList array of [key, NodePatch] arrays
	 * @returns {$.Promise} resolved, when all patches have been applied
	 * @see TreePatch
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
		FT.debug.apply(this, arguments);
	},
	// TODO: enable()
	// TODO: enableUpdate()
	// TODO: fromDict
	/**
	 * Generate INPUT elements that can be submitted with html forms.
	 *
	 * In selectMode 3 only the topmost selected nodes are considered.
	 *
	 * @param {Boolean | String} [selected=true]
	 * @param {Boolean | String} [active=true]
	 */
	generateFormElements: function(selected, active) {
		// TODO: test case
		var selectedName = (selected !== false) ? "ft_" + this._id : selected,
			activeName = (active !== false) ? "ft_" + this._id + "_active" : active,
			id = "fancytree_result_" + this._id,
			$result = this.$container.find("div#" + id);

		if($result.length){
			$result.empty();
		}else{
			$result = $("<div>", {
				id: id
			}).hide().appendTo(this.$container);
		}
		if(selectedName){
			var nodeList = this.getSelectedNodes( this.options.selectMode === 3 );
			$.each(nodeList, function(idx, node){
				$result.append($("<input>", {
					type: "checkbox",
					name: selectedName,
					value: node.key,
					checked: true
				}));
			});
		}
		if(activeName && this.activeNode){
			$result.append($("<input>", {
				type: "radio",
				name: activeName,
				value: this.activeNode.key,
				checked: true
			}));
		}
	},
	/**
	 * Return node that is active.
	 * @returns {FancytreeNode}
	 */
	getActiveNode: function() {
		return this.activeNode;
	},
	/** @returns {FancytreeNode | null}*/
	getFirstChild: function() {
		return this.rootNode.getFirstChild();
	},
	/**
	 * Return node that has keyboard focus.
	 * @param {Boolean} [ifTreeHasFocus=false]
	 * @returns {FancytreeNode}
	 */
	getFocusNode: function(ifTreeHasFocus) {
		// TODO: implement ifTreeHasFocus
		return this.focusNode;
	},
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
	/**
	 * @returns {Boolean} true if the tree control has keyboard focus
	 */
	hasFocus: function(){
		return FT.focusTree === this;
	},
	info: function(msg){
		Array.prototype.unshift.call(arguments, this.toString());
		FT.info.apply(this, arguments);
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
	 * Expand all parents of one or more nodes.
	 * Calls
	 * @param {String | String[]} keyPath one or more key paths (e.g. '/3/2_1/7')
	 * @param {function} callback callbeck(mode) is called for every visited node
	 * @returns $.Promise
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
	loadKeyPath: function(keyPathList, callback, _rootNode) {
		var root = _rootNode || this.rootNode,
			sep = this.options.keyPathSeparator,
			self = this,
			path, key, node, segList;
		if(!$.isArray(keyPathList)){
			keyPathList = [keyPathList];
		}
		// Pass 1: handle all path segments for nodes that are already loaded
		// Collect distinct top-most lazy nodes in a map
		var loadMap = {};

		for(var i=0; i<keyPathList.length; i++){
			path = keyPathList[i];
			// strip leading slash
			if(path.charAt(0) === sep){
				path = path.substr(1);
			}
			// traverse and strip keys, until we hit a lazy, unloaded node
			segList = path.split(sep);
			while(segList.length){
				key = segList.shift();
//                node = _findDirectChild(root, key);
				node = root._findDirectChild(key);
				if(!node){
					this.warn("loadKeyPath: key not found: " + key + " (parent: " + root + ")");
					callback.call(this, key, "error");
					break;
				}else if(segList.length === 0){
					callback.call(this, node, "ok");
					break;
				}else if(!node.lazy || (node.hasChildren() !== undefined )){
					callback.call(this, node, "loaded");
					root = node;
				}else{
					callback.call(this, node, "loaded");
//                    segList.unshift(key);
					if(loadMap[key]){
						loadMap[key].push(segList.join(sep));
					}else{
						loadMap[key] = [segList.join(sep)];
					}
					break;
				}
			}
		}
//        alert("loadKeyPath: loadMap=" + JSON.stringify(loadMap));
		// Now load all lazy nodes and continue itearation for remaining paths
		var deferredList = [];
		// Avoid jshint warning 'Don't make functions within a loop.':
		function __lazyload(key, node, dfd){
			callback.call(self, node, "loading");
			node.lazyLoad().done(function(){
			  self.loadKeyPath.call(self, loadMap[key], callback, node).always(_makeResolveFunc(dfd, self));
		  }).fail(function(errMsg){
			  self.warn("loadKeyPath: error loading: " + key + " (parent: " + root + ")");
			  callback.call(self, node, "error");
			  dfd.reject();
		  });
		}
		for(key in loadMap){
			node = root._findDirectChild(key);
//            alert("loadKeyPath: lazy node(" + key + ") = " + node);
			var dfd = new $.Deferred();
			deferredList.push(dfd);
			__lazyload(key, node, dfd);
		}
		// Return a promise that is resovled, when ALL paths were loaded
		return $.when.apply($, deferredList).promise();
	},
	/** _Default handling for mouse click events. */
	nodeClick: function(ctx) {
//      this.tree.logDebug("ftnode.onClick(" + event.type + "): ftnode:" + this + ", button:" + event.button + ", which: " + event.which);
		var event = ctx.orgEvent,
//            targetType = FT.getEventTargetType(event),
			targetType = ctx.targetType,
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
					activate = true;
					expand = true; //!node.isExpanded();
					break;
				// else 1 or 4: just activate
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
//				this._callHook("nodeSetExpanded", ctx, true);
				this._callHook("nodeToggleExpanded", ctx);
			}
		}
		// Make sure that clicks stop, otherwise <a href='#'> jumps to the top
		if(event.target.localName === "a" && event.target.className === "fancytree-title"){
			event.preventDefault();
		}
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
		// TODO: return promise?
		if( ctx.targetType === "title" && ctx.options.clickFolderMode === 4) {
//			this.nodeSetFocus(ctx);
//			this._callHook("nodeSetActive", ctx, true);
			this._callHook("nodeToggleExpanded", ctx);
		}
		// TODO: prevent text selection on dblclicks
		if( ctx.targetType === "title" ) {
			ctx.orgEvent.preventDefault();
		}
	},
	/** Default handling for mouse keydown events. 
	 * 
	 * NOTE: this may be called with node == null if tree (but no node) has focus.
	 */
	nodeKeydown: function(ctx) {
		// TODO: return promise?
		var event = ctx.orgEvent,
			node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options,
			handled = true,
			KC = $.ui.keyCode,
			sib = null;

//		node.debug("ftnode.nodeKeydown(" + event.type + "): ftnode:" + this + ", charCode:" + event.charCode + ", keyCode: " + event.keyCode + ", which: " + event.which);

		// Set focus to first node, if no other node has the focus yet
		if( !node ){
			this.rootNode.getFirstChild().setFocus();
			node = ctx.node = this.focusNode;
			node.debug("Keydown force focus on first node");
		}
		// Navigate to node
		function _goto(n){
			if( n ){
				n.makeVisible();
				return (event.ctrlKey || !opts.autoActivate ) ? n.setFocus() : n.setActive();
			}
		}

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
				_goto(node.parent);
				break;
			case KC.LEFT:
				if( node.expanded ) {
					tree.nodeSetExpanded(ctx, false);
//					tree.nodeSetFocus(ctx);
					_goto(node);
				} else if( node.parent && node.parent.parent ) {
//					node.parent.setFocus();
					_goto(node.parent);
				}
				break;
			case KC.RIGHT:
				if( !node.expanded && (node.children || node.lazy) ) {
					tree.nodeSetExpanded(ctx, true);
//					tree.nodeSetFocus(ctx);
					_goto(node);
				} else if( node.children ) {
//					node.children[0].setFocus();
					_goto(node.children[0]);
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
				_goto(sib);
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
				_goto(sib);
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
		}
//        alert("nodeLoadChildren() source = " + JSON.stringify(source));
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
			node._setChildren(children);
			if(node.parent){
				// if nodeLoadChildren was called for rootNode, the caller must
				// use tree.render() instead
				if(node.isVisible()){
					tree.nodeRender(ctx);
				}
				// trigger fancytreeloadchildren (except for tree-reload)
				tree._triggerNodeEvent("loadchildren", node);
			}
		}).fail(function(){
			tree.nodeRender(ctx);
		});
		return dfd;
	},
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
	/** Expand all parents.*/
	nodeMakeVisible: function(ctx) {
		// TODO: also scroll as neccessary: http://stackoverflow.com/questions/8938352/fancytree-how-to-scroll-to-active-node
		// Do we need an extra parameter?
		var parents = ctx.node.getParentList(false, false);
		for(var i=0, l=parents.length; i<l; i++){
			parents[i].setExpanded(true);
		}
	},
//	/** Handle focusin/focusout events.*/
//	nodeOnFocusInOut: function(ctx) {
//		if(ctx.orgEvent.type === "focusin"){
//			this.nodeSetFocus(ctx);
//			// if(ctx.tree.focusNode){
//			//     $(ctx.tree.focusNode.li).removeClass("fancytree-focused");
//			// }
//			// ctx.tree.focusNode = ctx.node;
//			// $(ctx.node.li).addClass("fancytree-focused");
//		}else{
//			_assert(ctx.orgEvent.type === "focusout");
//			// ctx.tree.focusNode = null;
//			// $(ctx.node.li).removeClass("fancytree-focused");
//		}
//		// $(ctx.node.li).toggleClass("fancytree-focused", ctx.orgEvent.type === "focus");
//	},
	/**
	 * Remove a single direct child of ctx.node.
	 * @param ctx
	 * @param {FancytreeNode} childNode dircect child of ctx.node
	 */
	nodeRemoveChild: function(ctx, childNode) {
		var node = ctx.node,
			children = node.children;
		FT.debug("nodeRemoveChild()", node.toString(), childNode.toString());

		if( children.length === 1 ) {
			_assert(childNode === children[0]);
			return this.nodeRemoveChildren(ctx);
		}
		if( this.activeNode && (childNode === this.activeNode || this.activeNode.isDescendantOf(childNode))){
			this.activeNode.setActive(false); // TODO: don't fire events
		}
		if( this.focusNode && (childNode === this.focusNode || this.focusNode.isDescendantOf(childNode))){
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
		FT.debug("nodeRemoveChildMarkup()", node.toString());
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
		FT.debug("nodeRemoveChildren()", node.toString());
		if(!children){
			return;
		}
		if( this.activeNode && this.activeNode.isDescendantOf(node)){
			this.activeNode.setActive(false); // TODO: don't fire events
		}
		if( this.focusNode && this.focusNode.isDescendantOf(node)){
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
		FT.debug("nodeRemoveMarkup()", node.toString());
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
	 * @param: {Boolean} [force=false] re-render, even if html markup was already created
	 * @param: {Boolean} [deep=false] also render all descendants, even if parent is collapsed
	 * @param: {Boolean} [collapsed=false] force root node to be collapsed, so we can apply animated expand later
	 */
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		/* This method must take care of all cases where the current data mode
		 * (i.e. node hierarchy) does not match the current markup.
		 *
		 * - node was not yet rendered:
		 *   create markup
		 * - node was rendered: exit fast
		 * - children have been added
		 * - childern have been removed
		 */
		var node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options,
			aria = opts.aria,
			firstTime = false,
			parent = node.parent,
			isRootNode = !parent,
			children = node.children,
			i, l;
//		FT.debug("nodeRender(" + !!force + ", " + !!deep + ")", node.toString());

		_assert(isRootNode || parent.ul, "parent UL must exist");

		// Render the node
		if( !isRootNode ){
			// Discard markup on force-mode, or if it is not linked to parent <ul>
			if(node.li && (force || (node.li.parentNode !== node.parent.ul) ) ){
				if(node.li.parentNode !== node.parent.ul){
					alert("unlink " + node + " (must be child of " + node.parent + ")");
				}
//	            this.debug("nodeRemoveMarkup...");
				this.nodeRemoveMarkup(ctx);
			}
			// Create <li><span /> </li>
//			node.debug("render...");
			if( !node.li ) {
//	            node.debug("render... really");
				firstTime = true;
				node.li = document.createElement("li");
				node.li.ftnode = node;
				if(aria){
					// TODO: why doesn't this work:
//					node.li.role = "treeitem";
//                    $(node.li).attr("role", "treeitem")
//                    .attr("aria-labelledby", "ftal_" + node.key);
				}
				if( node.key && opts.generateIds ){
					node.li.id = opts.idPrefix + node.key;
				}
				node.span = document.createElement("span");
				node.span.className = "fancytree-node";
				if(aria){
					$(node.span).attr("aria-labelledby", "ftal_" + node.key);
				}
				node.li.appendChild(node.span);
				// Note: we don't add the LI to the DOM know, but only after we
				// added all sub elements (hoping that this performs better since
				// the browser only have to render once)
				// TODO: benchmarks to prove this
//                parent.ul.appendChild(node.li);

				// Create inner HTML for the <span> (expander, checkbox, icon, and title)
				this.nodeRenderTitle(ctx);

				// Allow tweaking and binding, after node was created for the first time
				tree._triggerNodeEvent("createnode", ctx);
			}else{
//				this.nodeRenderTitle(ctx);
			}
			// Allow tweaking after node state was rendered
			tree._triggerNodeEvent("rendernode", ctx);
		}

		// Visit child nodes
		if( children ){
			if( isRootNode || node.expanded || deep === true ) {
				// Create a UL to hold the children
				if( !node.ul ){
					node.ul = document.createElement("ul");
					if((collapsed === true && !_recursive) || !node.expanded){
						// hide top UL, so we can use an animation to show it later
						node.ul.style.display = "none";
					}
					if(aria){
						$(node.ul).attr("role", "group");
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
			aria = opts.aria,
			level = node.getLevel(),
			ares = [],
			role;
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
				if(aria){
					ares.push("<span role='button' class='fancytree-expander'></span>");
				}else{
					ares.push("<span class='fancytree-expander'></span>");
				}
			}
			// .. else (i.e. for root level) skip expander/connector alltogether
		} else {
			if(aria){
				ares.push("<span role='button' class='fancytree-expander'></span>");
			}else{
				ares.push("<span class='fancytree-expander'></span>");
			}
		}
		// Checkbox mode
		if( opts.checkbox && node.hideCheckbox !== true && !node.isStatusNode ) {
			if(aria){
				ares.push("<span role='checkbox' class='fancytree-checkbox'></span>");
			}else{
				ares.push("<span class='fancytree-checkbox'></span>");
			}
		}
		// folder or doctype icon
		var icon = node.data.icon;
		role = aria ? " role='img'" : "";
		if ( icon ) {
			var imageSrc = (icon.charAt(0) === "/") ? icon : (opts.imagePath + icon);
			ares.push("<img src='" + imageSrc + "' alt='' />");
		} else if ( node.data.iconclass ) {
			// TODO: review and test and document
			ares.push("<span " + role + " class='fancytree-custom-icon" + " " + node.data.iconclass +  "'></span>");
		} else if ( icon !== false && opts.icons !== false ) {
			// icon == false means 'no icon', icon == null means 'default icon'
			ares.push("<span " + role + " class='fancytree-icon'></span>");
		}
		// node title
		var nodeTitle = "";
		if ( opts.onCustomRender ){
			nodeTitle = opts.onCustomRender.call(tree, node) || "";
		}
		if(!nodeTitle){
			// TODO: escape tooltip string
			var tooltip = node.tooltip ? " title='" + node.tooltip.replace(/\"/g, "&quot;") + "'" : "",
				id = aria ? " id='ftal_" + node.key + "'" : "";
			role = aria ? " role='treeitem'" : "";
//				href = node.data.href || "#";
//			if( opts.nolink || node.nolink ) {
//            nodeTitle = "<span role='treeitem' tabindex='-1' class='fancytree-title'" + id + tooltip + ">" + node.title + "</span>";
			nodeTitle = "<span " + role + " class='fancytree-title'" + id + tooltip + ">" + node.title + "</span>";
//			} else {
//				nodeTitle = "<a href='" + href + "' tabindex='-1' class='fancytree-title'" + tooltip + ">" + node.title + "</a>";
//			}
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
			opts = ctx.options,
//			nodeContainer = node[tree.nodeContainerAttrName],
			hasChildren = node.hasChildren(),
			isLastSib = node.isLastSibling(),
			aria = opts.aria,
//            $ariaElem = aria ? $(node[tree.ariaPropName]) : null,
			$ariaElem = $(node.span).find(".fancytree-title"),
			cn = opts._classNames,
			cnList = [],
			statusElem = node[tree.statusClassPropName];

		if( !statusElem ){
			// if this function is called for an unrendered node, ignore it (will be updated on nect render anyway)
			return;
		}
		// Build a list of class names that we will add to the node <span>
		cnList.push(cn.node);
		if( tree.activeNode === node ){
			cnList.push(cn.active);
//			$(">span.fancytree-title", statusElem).attr("tabindex", "0");
//			tree.$container.removeAttr("tabindex");
		}else{
//			$(">span.fancytree-title", statusElem).removeAttr("tabindex");
//			tree.$container.attr("tabindex", "0");
		}
		if( tree.focusNode === node ){
			cnList.push(cn.focused);
			if(aria){
//              $(">span.fancytree-title", statusElem).attr("tabindex", "0");
//                $(">span.fancytree-title", statusElem).attr("tabindex", "-1");
				// TODO: is this the right element for this attribute?
				$ariaElem
					.attr("aria-activedescendant", true);
//					.attr("tabindex", "-1");
			}
		}else if(aria){
//			$(">span.fancytree-title", statusElem).attr("tabindex", "-1");
			$ariaElem
				.removeAttr("aria-activedescendant");
//				.removeAttr("tabindex");
		}
		if( node.expanded ){
			cnList.push(cn.expanded);
			if(aria){
				$ariaElem.attr("aria-expanded", true);
			}
		}else if(aria){
			$ariaElem.removeAttr("aria-expanded");
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
			if(aria){
				$ariaElem.attr("aria-selected", true);
			}
		}else if(aria){
			$ariaElem.attr("aria-selected", false);
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
	 * @param {Boolean} [flag=true]
	 */
	nodeSetActive: function(ctx, flag) {
		// Handle user click / [space] / [enter], according to clickFolderMode.
		var node = ctx.node,
			tree = ctx.tree,
			opts = ctx.options,
//			userEvent = !!ctx.orgEvent,
			isActive = (node === tree.activeNode);
		// flag defaults to true
		flag = (flag !== false);
		node.debug("nodeSetActive", flag);

		if(isActive === flag){
			// Nothing to do
			return _getResolvedPromise(node);
		}else if(flag && this._triggerNodeEvent("beforeActivate", node, ctx.orgEvent) === false ){
			// Callback returned false
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
	 * @param {Boolean} [flag=true]
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
		}else if ( this._triggerNodeEvent("beforeExpand", node, ctx.orgEvent) === false ){
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
			if(opts.autoScroll){
				// Scroll down to last child, but keep current node visible
				node.getLastChild().scrollIntoView(true, node);
			}
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
			node.debug("nodeSetExpanded: load start...");
			node.lazyLoad().done(function(){
				node.debug("nodeSetExpanded: load done");
				if(dfd.notifyWith){ // requires jQuery 1.6+
					dfd.notifyWith(node, ["loaded"]);
				}
				_afterLoad.call(tree);
			}).fail(function(errMsg){
				dfd.rejectWith(node, ["load failed (" + errMsg + ")"]);
			});
/*
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
*/
		}else{
			_afterLoad();
		}
		node.debug("nodeSetExpanded: returns");
		return dfd.promise();
	},
	/**
	 * @param {HookContext} ctx
	 * @param {Boolean} [flag=true]
	 */
	nodeSetFocus: function(ctx, flag) {
		ctx.node.debug("nodeSetFocus(" + flag + ")");
		var tree = ctx.tree,
			node = ctx.node;
		flag = (flag !== false);

		// Blur previous node if any
		if(tree.focusNode){
			if(tree.focusNode === node && flag){
				node.debug("nodeSetFocus(" + flag + "): nothing to do");
				return;
			}
			var ctx2 = $.extend({}, ctx, {node: tree.focusNode});
			tree.focusNode = null;
			this._triggerNodeEvent("blur", ctx2);
			this._callHook("nodeRenderStatus", ctx2);
		}
		// Set focus to container and node
		if(flag){
			if(FT.focusTree !== tree){
				node.debug("nodeSetFocus: forcing container focus");
				// Note: we pass _calledByNodeSetFocus=true
				this._callHook("treeSetFocus", ctx, true, true);
			}
			this.nodeMakeVisible(ctx);
			tree.focusNode = node;
//			node.debug("FOCUS...");
//			$(node.span).find(".fancytree-title").focus();
			this._triggerNodeEvent("focus", ctx);
//          if(ctx.options.autoActivate){
//              tree.nodeSetActive(ctx, true);
//          }
			if(ctx.options.autoScroll){
				node.scrollIntoView();
			}
			this._callHook("nodeRenderStatus", ctx);
		}
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
		}else if ( this._triggerNodeEvent("beforeSelect", node, ctx.orgEvent) === false ){
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
				node._setChildren([data]);
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
				source = $.ui.fancytree.parseHtml($ul);
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
	/* Handle focus and blur events for the container (also fired for child elements). */
	treeOnFocusInOut: function(event) {
		var flag = (event.type === "focusin"),
			node = $.ui.fancytree.getNode(event);

		try{
			this.debug("treeOnFocusInOut(" + flag + "), node=", node);
			_assert(!this._inFocusHandler, "Focus handler recursion");
			this.systemFocusElement = flag ? event.target : null;
			this._inFocusHandler = true;
			if(node){
				// For example clicking into an <input> that is part of a node
				this._callHook("nodeSetFocus", node, flag);
			}else{
				this._callHook("treeSetFocus", this, flag);
			}
		}finally{
			this._inFocusHandler = false;
		}
	},
	/* */
	treeSetFocus: function(ctx, flag, _calledByNodeSetFocus) {
		flag = (flag !== false);

		this.debug("treeSetFocus(" + flag + "), _calledByNodeSetFocus: " + _calledByNodeSetFocus);
		this.debug("    focusNode: " + this.focusNode);
		this.debug("    activeNode: " + this.activeNode);
		// Blur previous tree if any
		if(FT.focusTree){
			if(this !== FT.focusTree || !flag ){
				// prev. node looses focus, if prev. tree blurs
				if(FT.focusTree.focusNode){
					FT.focusTree.focusNode.setFocus(false);
				}
				FT.focusTree.$container.removeClass("fancytree-focused");
				this._triggerTreeEvent("blurtree");
				FT.focusTree = null;
			}
		}
		//
		if( flag && FT.focusTree !== this ){
			FT.focusTree = this;
			this.$container.addClass("fancytree-focused");
			// Make sure container gets `:focus` when we clicked inside
			if( !this.systemFocusElement ){
				this.debug("Set `:focus` to container");
				this.$container.focus();
			}
			// Set focus to a node
			if( ! this.focusNode && !_calledByNodeSetFocus){
				if( this.activeNode ){
					this.activeNode.setFocus();
				}else if( this.rootNode.hasChildren()){
					this.warn("NOT setting focus to first child");
//					this.rootNode.getFirstChild().setFocus();
				}
			}
			this._triggerTreeEvent("focustree");
		}else{
			FT.focusTree = null;
		}

	},
	/** Re-fire beforeactivate and activate events. */
	reactivate: function(setFocus) {
		var node = this.activeNode;
		if( node ) {
			this.activeNode = null; // Force re-activating
			node.setActive();
			if( setFocus ){
				node.setFocus();
			}
		}
	},
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
	/**
	 * @param {Boolean} [flag=true]
	 */
	setFocus: function(flag) {
//        _assert(false, "Not implemented");
		return this._callHook("treeSetFocus", this, flag);
	},
	/**
	 * @see FancytreeNode#toDict
	 */
	toDict: function(recursive, callback){
		return this.rootNode.toDict(recursive, callback);
	},
	/**Implicitly called for string conversions.
	 * @returns {String}
	 */
	toString: function(){
		return "<Fancytree(#" + this._id + ")>";
	},
	/** _trigger a widget event with additional node ctx.
	 * @see HookContext
	 */
	_triggerNodeEvent: function(type, node, orgEvent) {
		var ctx = this._makeHookContext(node, orgEvent);
//		this.debug("_trigger(" + type + "): '" + ctx.node.title + "'", ctx);
		var res = this.widget._trigger(type, orgEvent, ctx);
		if(res !== false && ctx.result !== undefined){
			return ctx.result;
		}
		return res;
	},
	/** _trigger a widget event with additional tree data. */
	_triggerTreeEvent: function(type, orgEvent) {
		var ctx = this._makeHookContext(this, orgEvent);
//		this.debug("_trigger(" + type + ")", ctx);
		var res = this.widget._trigger(type, orgEvent, ctx);
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
		FT.warn.apply(this, arguments);
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
		/** @type {Boolean}  Make sure, active nodes are visible (expanded). */
		activeVisible: true,
		ajax: {
			type: "GET",
			cache: false, // false: Append random '_' argument to the request url to prevent caching.
//          timeout: 0, // >0: Make sure we get an ajax error if error is unreachable
			dataType: "json" // Expect json format and pass json object to callbacks.
		},  //
		aria: false, // TODO: default to true
		autoActivate: true,
		autoCollapse: false,
//      autoFocus: false,
		autoScroll: false,
		checkbox: false,
		/**defines click behavior*/
		clickFolderMode: 4,
		// TODO: required anymore?
		disabled: false,
		extensions: [],
		fx: { height: "toggle", duration: 200 },
//		hooks: {},
		generateIds: false,
		icons: true,
		idPrefix: "ft_",
		keyboard: true,
		keyPathSeparator: "/",
		minExpandLevel: 1,
		selectMode: 2,
		strings: {
			loading: "Loading&#8230;",
			loadError: "Load error!"
		},
		tabbable: true,
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
			focused: "fancytree-focused ui-state-focus",
			partsel: "fancytree-partsel",
			lastsib: "fancytree-lastsib"
		},
		// events
		lazyload: null
	},
	/* Set up the widget, Called on first $().fancytree() */
	_create: function() {
		this.tree = new Fancytree(this);

		this.$source = this.source || this.element.data("type") === "json" ? this.element
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
		// TODO: currently we call bind after treeInit, because treeInit
		// might change tree.$container.
		// It would be better, to move ebent binding into hooks altogether
		this._bind();
	},

	/* Use the _setOption method to respond to changes to options */
	_setOption: function(key, value) {
		var callDefault = true,
			rerender = false;
		switch( key ) {
		case "aria":
		case "checkbox":
		case "icons":
		case "minExpandLevel":
		case "tabbable":
//		case "nolink":
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
		this.$source && this.$source.removeClass("ui-helper-hidden");
		// In jQuery UI 1.8, you must invoke the destroy method from the base widget
		$.Widget.prototype.destroy.call(this);
		// TODO: delete tree and nodes to make garbage collect easier?
		// TODO: In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
	},

	// -------------------------------------------------------------------------

	/* Remove all event handlers for our namespace */
	_unbind: function() {
		var ns = this.tree._ns;
		this.element.unbind(ns);
		this.tree.$container.unbind(ns);
		$(document).unbind(ns);
	},
	/* Add mouse and kyboard handlers to the container */
	_bind: function() {
		var that = this,
			opts = this.options,
			tree = this.tree,
			ns = tree._ns,
			selstartEvent = ( $.support.selectstart ? "selectstart" : "mousedown" );

		// Remove all previuous handlers for this tree
		this._unbind();

		//alert("keydown" + ns + "foc=" + tree.hasFocus() + tree.$container);
		tree.debug("bind events; container: ", tree.$container);
		tree.$container.bind("focusin" + ns + " focusout" + ns, function(event){
			tree.debug("Tree container got event " + event.type);
			tree.treeOnFocusInOut.call(tree, event);
		}).delegate("span.fancytree-title", selstartEvent + ns, function(event){
			// prevent mouse-drags to select text ranges
			tree.debug("<span> got event " + event.type);
			event.preventDefault();
		});
		// keydown must be bound to document, because $container might not
		// receive these events
		$(document).bind("keydown" + ns, function(event){
			// TODO: also bind keyup and keypress
			tree.debug("doc got event " + event.type + ", hasFocus:" + tree.hasFocus());
			if(opts.disabled || opts.keyboard === false || !tree.hasFocus()){
				return true;
			}
			var node = tree.focusNode,
				// node may be null
				ctx = tree._makeHookContext(node || tree, event),
				prevPhase = tree.phase;
			try {
				tree.phase = "userEvent";
				if(node){
					return ( tree._triggerNodeEvent("keydown", node, event) === false ) ? false : tree._callHook("nodeKeydown", ctx);
				}else{
					return ( tree._triggerTreeEvent("keydown", event) === false ) ? false : tree._callHook("nodeKeydown", ctx);
				}
			} finally {
				tree.phase = prevPhase;
			}
		});
		this.element.bind("click" + ns + " dblclick" + ns, function(event){
			if(opts.disabled){
				return true;
			}
			var et = FT.getEventTarget(event),
				node = et.node;
			if( !node ){
				return true;  // Allow bubbling of other events
			}
			var tree = that.tree,
//                o = that.options,
				ctx = tree._makeHookContext(node, event),
				prevPhase = tree.phase;
//			that.tree.debug("event(" + event.type + "): node: ", node);
			try {
				tree.phase = "userEvent";
				switch(event.type) {
				case "click":
					ctx.targetType = et.type;
					return ( tree._triggerNodeEvent("click", ctx, event) === false ) ? false : tree._callHook("nodeClick", ctx);
				case "dblclick":
					ctx.targetType = et.type;
					return ( tree._triggerNodeEvent("dblclick", ctx, event) === false ) ? false : tree._callHook("nodeDblclick", ctx);
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
	}
});

// $.ui.fancytree was created by the widget factory. Create a local shortcut:
var FT = $.ui.fancytree;

/* *****************************************************************************
 * Static members in the jQuery.ui.fancytree namespace
 */

function consoleApply(method, args){
	var fn = window.console ? window.console[method] : null;
	if(fn){
		if(fn.apply){
			fn.apply(window.console, args);
		}else{
			// IE?
			var s = "";
			for( var i=0; i<args.length; i++){
				s += args[i];
			}
			fn(s);
		}
	}
}

/**
 * Static functiions in the `$.ui.fancytree` namespace.
 * @  name $.ui.fancytree
 * @example:
 * alert(""version: " + $.ui.fancytree.version);
 * var node = $.ui.fancytree.()
 */
$.extend($.ui.fancytree,
	/** @lends $.ui.fancytree */
	{
	/** @type {String} */
	version: "2.0.0pre",
	/** @type {int} */
	debugLevel: 2,

	_nextId: 1,
	_nextNodeKey: 1,
	_extensions: {},
	focusTree: null,

	/** Expose class object as $.ui.fancytree._FancytreeClass */
	_FancytreeClass: Fancytree,
	/** Expose class object as $.ui.fancytree._FancytreeNodeClass */
	_FancytreeNodeClass: FancytreeNode,

	debug: function(msg){
		/*jshint expr:true */
		($.ui.fancytree.debugLevel >= 2) && consoleApply("log", arguments);
	},
	error: function(msg){
		consoleApply("error", arguments);
	},
	/** Return a {node: FancytreeNode, type: TYPE} object for a mouse event.
	 *
	 * @static
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
		//        Use $(res.node).hasClass() instead
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
	 * @param {Element | jQueryObject | Event} el
	 * @returns {FancytreeNode} matching node or null
	 */
	getNode: function(el){
		if(el instanceof FancytreeNode){
			return el; // el already was a FancytreeNode
		}else if(el.selector !== undefined){
			el = el[0]; // el was a jQuery object: use the DOM element
		}else if(el.originalEvent !== undefined){
			el = el.target; // el was an Event
		}
		while( el ) {
			if(el.ftnode) {
				return el.ftnode;
			}
			el = el.parentNode;
		}
		return null;
	},
	/* Return a Fancytree instance from element.
	* TODO: this function could help to get around the data('fancytree') / data('ui-fancytree') problem
	* @param {Element | jQueryObject | Event} el
	* @returns {Fancytree} matching tree or null
	* /
	getTree: function(el){
		if(el instanceof Fancytree){
			return el; // el already was a Fancytree
		}else if(el.selector !== undefined){
			el = el[0]; // el was a jQuery object: use the DOM element
		}else if(el.originalEvent !== undefined){
			el = el.target; // el was an Event
		}
		...
		return null;
	},
	*/
	info: function(msg){
		/*jshint expr:true */
		($.ui.fancytree.debugLevel >= 1) && consoleApply("info", arguments);
	},
	/**
	 * Parse tree data from HTML <ul> markup
	 *
	 * @param {jQueryObject} $ul
	 * @returns {NodeData[]}
	 */
	parseHtml: function($ul) {
		// TODO: understand this:
		/*jshint validthis:true */
		var $children = $ul.find(">li"),
			extraClasses, i, l, iPos, tmp, classes, className,
			children = [];
//			that = this;

		$children.each(function() {
			var $li = $(this),
				$liSpan = $li.find(">span:first", this),
				$liA = $liSpan.length ? null : $li.find(">a:first"),
				d = { tooltip: null, data: {} };

			if( $liSpan.length ) {
				d.title = $liSpan.html();

			} else if( $liA && $liA.length ) {
				// If a <li><a> tag is specified, use it literally and extract href/target.
				d.title = $liA.html();
				d.data.href = $liA.attr("href");
				d.data.target = $liA.attr("target");
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
			// Add <li data-NAME='...'> as node.data.NAME
			// See http://api.jquery.com/data/#data-html5
			var allData = $li.data();
//            alert("d: " + JSON.stringify(allData));
			if(allData && !$.isEmptyObject(allData)) {
				// Special handling for <li data-json='...'>
				var jsonData = allData.json;
				delete allData.json;
				$.extend(d.data, allData);
				// If a 'data-json' attribute is present, evaluate and add to node.data
				if(jsonData) {
//	              alert("$li.data()" + JSON.stringify(jsonData));
					// <li data-json='...'> is already returned as object
					// see http://api.jquery.com/data/#data-html5
					$.extend(d.data, jsonData);
				}
			}
//	        that.debug("parse ", d);
//	        var childNode = parentTreeNode.addChild(data);
			// Recursive reading of child nodes, if LI tag contains an UL tag
			$ul = $li.find(">ul:first");
			if( $ul.length ) {
				d.children = $.ui.fancytree.parseHtml($ul);
			}else{
				d.children = d.lazy ? undefined : null;
			}
			children.push(d);
//            FT.debug("parse ", d, children);
		});
		return children;
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
		consoleApply("warn", arguments);
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
// https://raw.github.com/malsup/blockui/master/jquery.blockUI.js
/*
if( typeof define === "function" && define.amd ) {
	define( ["jquery"], function () {
		return jQuery.ui.fancytree;
	});
}
*/
}(jQuery, window, document));
