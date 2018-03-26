/*!
 * jquery.fancytree.table.js
 *
 * Render tree as table (aka 'tree grid', 'table tree').
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

;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "./jquery.fancytree" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("./jquery.fancytree");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */
function _assert(cond, msg){
	msg = msg || "";
	if(!cond){
		$.error("Assertion failed " + msg);
	}
}

function insertFirstChild(referenceNode, newNode) {
	referenceNode.insertBefore(newNode, referenceNode.firstChild);
}

function insertSiblingAfter(referenceNode, newNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/* Show/hide all rows that are structural descendants of `parent`. */
function setChildRowVisibility(parent, flag) {
	parent.visit(function(node){
		var tr = node.tr;
		// currentFlag = node.hide ? false : flag; // fix for ext-filter
		if(tr){
			tr.style.display = (node.hide || !flag) ? "none" : "";
		}
		if(!node.expanded){
			return "skip";
		}
	});
}

/* Find node that is rendered in previous row. */
function findPrevRowNode(node){
	var i, last, prev,
		parent = node.parent,
		siblings = parent ? parent.children : null;

	if(siblings && siblings.length > 1 && siblings[0] !== node){
		// use the lowest descendant of the preceeding sibling
		i = $.inArray(node, siblings);
		prev = siblings[i - 1];
		_assert(prev.tr);
		// descend to lowest child (with a <tr> tag)
		while(prev.children && prev.children.length){
			last = prev.children[prev.children.length - 1];
			if(!last.tr){
				break;
			}
			prev = last;
		}
	}else{
		// if there is no preceding sibling, use the direct parent
		prev = parent;
	}
	return prev;
}

/**
 * [ext-table] Define a subset of rows/columns to display and redraw.
 *
 * @param {object | boolean} options viewport boundaries and status.
 *
 * @alias Fancytree#setViewport
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.setViewport = function(opts){
	var redraw = false,
		vp = this.viewport;

	if( typeof opts === "boolean" ) {
		redraw = vp.enabled !== opts;
		vp.enabled = opts;
	} else {
		redraw = !vp.enabled;
		vp.enabled = true;
		if ( vp.top !== +opts.top ) { vp.top = opts.top; redraw = true; }
		if ( vp.bottom !== +opts.bottom ) { vp.bottom = opts.bottom; redraw = true; }
		if ( vp.left !== +opts.left ) { vp.left = opts.left; redraw = true; }
		if ( vp.right !== +opts.right ) { vp.right = opts.right; redraw = true; }
	}
	if( redraw ) {
		this.rows = null;  // make sure it will be re-calculated
		this.redraw();
	}
};


/**
 * [ext-table] Renumber and collect all visible rows.
 *
 * @alias Fancytree#renumber
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.renumber = function(force){
	if( this.rows != null && force === false ) {
		return false;
	}
	var i = 0,
		stamp = Date.now(),
		rows = this.rows = [];

	this.visit(function(node){
		if( node.tr.style.display !== "none" ) {
			node._rowIdx = i++;
			rows.push(node);
		}
		if( node.children && !node.expanded ) {
			return "skip";
		}
	});
	this.debug("renumber() took " + (Date.now()-stamp) + "ms, " +
		rows.length + "/" + this.count() + " nodes.");
};


/**
 * [ext-table] Call fn(node) for all this and subsequent visible nodes.<br>
 * Stop iteration, if fn() returns false.<br>
 * Return false if iteration was stopped.
 *
 * @param {function} fn the callback function.
 *     Return false to stop iteration.
 * @returns {boolean}
 *
 * @alias Fancytree#visitRows
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.visitRows = function(callback){

};


$.ui.fancytree.registerExtension({
	name: "table",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		checkboxColumnIdx: null, // render the checkboxes into the this column index (default: nodeColumnIdx)
		// customStatus: false,	 // true: generate renderColumns events for status nodes
		indentation: 16,         // indent every node level by 16px
		nodeColumnIdx: 0         // render node expander, icon, and title to this column (default: #0)
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var i, columnCount, n, $row, $tbody,
			tree = ctx.tree,
			opts = ctx.options,
			tableOpts = opts.table,
			$table = tree.widget.element;

		if( tableOpts.customStatus != null ) {
			if( opts.renderStatusColumns != null) {
				$.error("The 'customStatus' option is deprecated since v2.15.0. Use 'renderStatusColumns' only instead.");
			} else {
				tree.warn("The 'customStatus' option is deprecated since v2.15.0. Use 'renderStatusColumns' instead.");
				opts.renderStatusColumns = tableOpts.customStatus;
			}
		}
		if( opts.renderStatusColumns ) {
			if( opts.renderStatusColumns === true ) {
				opts.renderStatusColumns = opts.renderColumns;
			// } else if( opts.renderStatusColumns === "wide" ) {
			// 	opts.renderStatusColumns = _renderStatusNodeWide;
			}
		}

		$table.addClass("fancytree-container fancytree-ext-table");
		$tbody = $table.find(">tbody");
		if( !$tbody.length ) {
			// TODO: not sure if we can rely on browsers to insert missing <tbody> before <tr>s:
			if( $table.find(">tr").length ) {
				$.error("Expected table > tbody > tr. If you see this please open an issue.");
			}
			$tbody = $("<tbody>").appendTo($table);
		}

		tree.tbody = $tbody[0];

		// Prepare row templates:
		// Determine column count from table header if any
		columnCount = $("thead >tr:last >th", $table).length;
		// Read TR templates from tbody if any
		$row = $tbody.children("tr:first");
		if( $row.length ) {
			n = $row.children("td").length;
			if( columnCount && n !== columnCount ) {
				tree.warn("Column count mismatch between thead (" + columnCount + ") and tbody (" + n + "): using tbody.");
				columnCount = n;
			}
			$row = $row.clone();
		} else {
			// Only thead is defined: create default row markup
			_assert(columnCount >= 1, "Need either <thead> or <tbody> with <td> elements to determine column count.");
			$row = $("<tr />");
			for(i=0; i<columnCount; i++) {
				$row.append("<td />");
			}
		}
		$row.find(">td").eq(tableOpts.nodeColumnIdx)
			.html("<span class='fancytree-node' />");
		if( opts.aria ) {
			$row.attr("role", "row");
			$row.find("td").attr("role", "gridcell");
		}
		tree.rowFragment = document.createDocumentFragment();
		tree.rowFragment.appendChild($row.get(0));

		// // If tbody contains a second row, use this as status node template
		// $row = $tbody.children("tr:eq(1)");
		// if( $row.length === 0 ) {
		// 	tree.statusRowFragment = tree.rowFragment;
		// } else {
		// 	$row = $row.clone();
		// 	tree.statusRowFragment = document.createDocumentFragment();
		// 	tree.statusRowFragment.appendChild($row.get(0));
		// }
		//
		$tbody.empty();

		// Make sure that status classes are set on the node's <tr> elements
		tree.statusClassPropName = "tr";
		tree.ariaPropName = "tr";
		this.nodeContainerAttrName = "tr";

		// #489: make sure $container is set to <table>, even if ext-dnd is listed before ext-table
		tree.$container = $table;

		tree.rows = null;  // Set by renumber()
		tree.viewport = $.extend({
			enabled: false,
			top: 0,
			bottom: 0,
			left: 0,
			right: 0
		}, tableOpts.viewport);

		this._superApply(arguments);

		// standard Fancytree created a root UL
		$(tree.rootNode.ul).remove();
		tree.rootNode.ul = null;

		// Add container to the TAB chain
		// #577: Allow to set tabindex to "0", "-1" and ""
		this.$container.attr("tabindex", opts.tabindex);
		// this.$container.attr("tabindex", opts.tabbable ? "0" : "-1");
		if(opts.aria) {
			tree.$container
				.attr("role", "treegrid")
				.attr("aria-readonly", true);
		}
	},
	treeLoad: function(ctx, source) {
		return this._superApply(arguments).done(function(){
			ctx.tree.renumber();
		});
	},
	nodeRemoveChildMarkup: function(ctx) {
		var node = ctx.node;
//		node.debug("nodeRemoveChildMarkup()");
		node.visit(function(n){
			if(n.tr){
				$(n.tr).remove();
				n.tr = null;
			}
		});
	},
	nodeRemoveMarkup: function(ctx) {
		var node = ctx.node;
//		node.debug("nodeRemoveMarkup()");
		if(node.tr){
			$(node.tr).remove();
			node.tr = null;
		}
		this.nodeRemoveChildMarkup(ctx);
	},
	/* Override standard render. */
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var children, firstTr, i, l, modified, newRow, prevNode, prevTr, subCtx,
			tree = ctx.tree,
			node = ctx.node,
			opts = ctx.options,
			isRootNode = !node.parent;

		if( tree._enableUpdate === false ) {
			// $.ui.fancytree.debug("*** nodeRender _enableUpdate: false");
			return;
		}
		if( !_recursive ){
			ctx.hasCollapsedParents = node.parent && !node.parent.expanded;
			if( tree.viewport.enabled && tree.rows == null ) {
				tree.renumber();
			}
		}
		// $.ui.fancytree.debug("*** nodeRender " + node + ", isRoot=" + isRootNode, "tr=" + node.tr, "hcp=" + ctx.hasCollapsedParents, "parent.tr=" + (node.parent && node.parent.tr));
		if( !isRootNode ){
			if( node.tr && force ) {
				this.nodeRemoveMarkup(ctx);
			}
			if( !node.tr ) {
				if( ctx.hasCollapsedParents && !deep ) {
					// #166: we assume that the parent will be (recursively) rendered
					// later anyway.
					// node.debug("nodeRender ignored due to unrendered parent");
					return;
				}
				// Create new <tr> after previous row
				// if( node.isStatusNode() ) {
				// 	newRow = tree.statusRowFragment.firstChild.cloneNode(true);
				// } else {
				newRow = tree.rowFragment.firstChild.cloneNode(true);
				// }
				prevNode = findPrevRowNode(node);
				// $.ui.fancytree.debug("*** nodeRender " + node + ": prev: " + prevNode.key);
				_assert(prevNode);
				if(collapsed === true && _recursive){
					// hide all child rows, so we can use an animation to show it later
					newRow.style.display = "none";
				}else if(deep && ctx.hasCollapsedParents){
					// also hide this row if deep === true but any parent is collapsed
					newRow.style.display = "none";
//					newRow.style.color = "red";
				}
				if(!prevNode.tr){
					_assert(!prevNode.parent, "prev. row must have a tr, or be system root");
					// tree.tbody.appendChild(newRow);
					insertFirstChild(tree.tbody, newRow);  // #675
				}else{
					insertSiblingAfter(prevNode.tr, newRow);
				}
				node.tr = newRow;
				if( node.key && opts.generateIds ){
					node.tr.id = opts.idPrefix + node.key;
				}
				node.tr.ftnode = node;
				// if(opts.aria){
				// 	$(node.tr).attr("aria-labelledby", "ftal_" + opts.idPrefix + node.key);
				// }
				node.span = $("span.fancytree-node", node.tr).get(0);
				// Set icon, link, and title (normally this is only required on initial render)
				this.nodeRenderTitle(ctx);
				// Allow tweaking, binding, after node was created for the first time
//				tree._triggerNodeEvent("createNode", ctx);
				if ( opts.createNode ){
					opts.createNode.call(tree, {type: "createNode"}, ctx);
				}
			} else {
				if( force ) {
					// Set icon, link, and title (normally this is only required on initial render)
					this.nodeRenderTitle(ctx); // triggers renderColumns()
				} else {
					// Update element classes according to node state
					this.nodeRenderStatus(ctx);
				}
			}
		}
		// Allow tweaking after node state was rendered
//		tree._triggerNodeEvent("renderNode", ctx);
		if ( opts.renderNode ){
			opts.renderNode.call(tree, {type: "renderNode"}, ctx);
		}
		// Visit child nodes
		// Add child markup
		children = node.children;
		if(children && (isRootNode || deep || node.expanded)){
			for(i=0, l=children.length; i<l; i++) {
				subCtx = $.extend({}, ctx, {node: children[i]});
				subCtx.hasCollapsedParents = subCtx.hasCollapsedParents || !node.expanded;
				this.nodeRender(subCtx, force, deep, collapsed, true);
			}
		}
		// Make sure, that <tr> order matches node.children order.
		if(children && !_recursive){ // we only have to do it once, for the root branch
			prevTr = node.tr || null;
			firstTr = tree.tbody.firstChild;
			// Iterate over all descendants
			node.visit(function(n){
				if(n.tr){
					if(!n.parent.expanded && n.tr.style.display !== "none"){
						// fix after a node was dropped over a collapsed
						n.tr.style.display = "none";
						setChildRowVisibility(n, false);
						tree.rows = null;  // Invalidate visible row cache
					}
					if(n.tr.previousSibling !== prevTr){
						node.debug("_fixOrder: mismatch at node: " + n);
						var nextTr = prevTr ? prevTr.nextSibling : firstTr;
						tree.tbody.insertBefore(n.tr, nextTr);
					}
					prevTr = n.tr;
				}
			});
		}
		// Update element classes according to node state
		// if(!isRootNode){
		// 	this.nodeRenderStatus(ctx);
		// }
	},
	nodeRenderTitle: function(ctx, title) {
		var $cb, res,
			node = ctx.node,
			opts = ctx.options,
			isStatusNode = node.isStatusNode();

		res = this._super(ctx, title);

		if( node.isRootNode() ) {
			return res;
		}
		// Move checkbox to custom column
		if(opts.checkbox && !isStatusNode && opts.table.checkboxColumnIdx != null ){
			$cb = $("span.fancytree-checkbox", node.span); //.detach();
			$(node.tr).find("td").eq(+opts.table.checkboxColumnIdx).html($cb);
		}
		// Update element classes according to node state
		this.nodeRenderStatus(ctx);

		if( isStatusNode ) {
			if( opts.renderStatusColumns ) {
				// Let user code write column content
				opts.renderStatusColumns.call(ctx.tree, {type: "renderStatusColumns"}, ctx);
			} // else: default rendering for status node: leave other cells empty
		} else if ( opts.renderColumns ) {
			opts.renderColumns.call(ctx.tree, {type: "renderColumns"}, ctx);
		}
		return res;
	},
	nodeRenderStatus: function(ctx) {
		var indent,
			node = ctx.node,
			opts = ctx.options;

		this._super(ctx);

		$(node.tr).removeClass("fancytree-node");
		// indent
		indent = (node.getLevel() - 1) * opts.table.indentation;
		if( opts.rtl ) {
			$(node.span).css({paddingRight: indent + "px"});
		} else {
			$(node.span).css({paddingLeft: indent + "px"});
		}
	 },
	/* Expand node, return Deferred.promise. */
	nodeSetExpanded: function(ctx, flag, callOpts) {
		var node = ctx.node,
			tree = ctx.tree;

		// flag defaults to true
		flag = (flag !== false);

		if((node.expanded && flag) || (!node.expanded && !flag)) {
			// Expanded state isn't changed - just call base implementation
			return this._superApply(arguments);
		}

		var dfd = new $.Deferred(),
			subOpts = $.extend({}, callOpts, {noEvents: true, noAnimation: true});

		callOpts = callOpts || {};

		function _afterExpand(ok) {
			setChildRowVisibility(node, flag);
			tree.rows = null;  // Invalidate visible row cache
			if( ok ) {
				if( flag && ctx.options.autoScroll && !callOpts.noAnimation && node.hasChildren() ) {
					// Scroll down to last child, but keep current node visible
					node.getLastChild().scrollIntoView(true, {topNode: node}).always(function(){
						if( !callOpts.noEvents ) {
							tree._triggerNodeEvent(flag ? "expand" : "collapse", ctx);
						}
						dfd.resolveWith(node);
					});
				} else {
					if( !callOpts.noEvents ) {
						tree._triggerNodeEvent(flag ? "expand" : "collapse", ctx);
					}
					dfd.resolveWith(node);
				}
			} else {
				if( !callOpts.noEvents ) {
					tree._triggerNodeEvent(flag ? "expand" : "collapse", ctx);
				}
				dfd.rejectWith(node);
			}
		}
		// Call base-expand with disabled events and animation
		this._super(ctx, flag, subOpts).done(function () {
			_afterExpand(true);
		}).fail(function () {
			_afterExpand(false);
		});
		return dfd.promise();
	},
	nodeSetStatus: function(ctx, status, message, details) {
		if(status === "ok"){
			var node = ctx.node,
				firstChild = ( node.children ? node.children[0] : null );
			if ( firstChild && firstChild.isStatusNode() ) {
				$(firstChild.tr).remove();
			}
		}
		return this._superApply(arguments);
	},
	treeClear: function(ctx) {
		this.nodeRemoveChildMarkup(this._makeHookContext(this.rootNode));
		this.rows = null;  // Invalidate visible row cache
		return this._superApply(arguments);
	},
	treeDestroy: function(ctx) {
		this.$container.find("tbody").empty();
		this.$source && this.$source.removeClass("fancytree-helper-hidden");
		this.rows = null;  // Invalidate visible row cache
		return this._superApply(arguments);
	}
	// treeRegisterNode: function(ctx, add, node) {
	// 	this.renumber();
	// 	return this._superApply(arguments);
	// }
	/*,
	treeSetFocus: function(ctx, flag) {
//	        alert("treeSetFocus" + ctx.tree.$container);
		ctx.tree.$container.focus();
		$.ui.fancytree.focusTree = ctx.tree;
	}*/
});
// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
}));  // End of closure
