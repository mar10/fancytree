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

/**
 * [ext-table] Define a subset of rows/columns to display and redraw.
 *
 * @param {object | boolean} options viewport boundaries and status.
 *
 * @alias Fancytree#setViewport
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.setViewport = function(opts){
	var bottom, count, start, 
		self = this,
		idx = 0,
		stamp = Date.now(),
		redraw = false,
		vp = this.viewport;
	
	if( typeof opts === "boolean" ) {
		redraw = vp.enabled !== opts;
		vp.enabled = opts;
	} else {
		redraw = !vp.enabled;
		vp.enabled = true;
		start = opts.start == null ? vp.start : +opts.start;
		count = opts.count == null ? vp.count : +opts.count;
		if ( vp.start !== +start ) { vp.start = start; redraw = true; }
		if ( vp.count !== +count ) { vp.count = count; redraw = true; }
		if ( vp.left !== +opts.left ) { vp.left = opts.left; redraw = true; }
		if ( vp.right !== +opts.right ) { vp.right = opts.right; redraw = true; }
	}
	if( redraw ) {
		// this.redraw(true, true);
		// Redraw the whole tree, erasing all node markup before and after
		// the viewport
		bottom = start + count; 
		this.visitRows(function(node){
			if( idx < start || idx > bottom ) {
				if( node.tr ) {
					// TODO: vanilla:
					$(node.tr).remove();
					// node.tr.parentNode.removeChild(node.tr)
					node.tr = null;
				}
			} else {
				node.render();
			}
			idx++;
		});
		this.debug("redraw() took " + (Date.now()-stamp) + "ms, " +
			opts.count + "/" + this.count() + " nodes.");
	}
	this.debug("setViewport(" + vp.start + ", +" + count + ") - took " + 
			(Date.now()-stamp) + "ms");
};


/**
 * [ext-table] Invalidate renumber status, i.e. trigger renumber next time.
 *
 * @alias Fancytree#renumberReset
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.renumberReset = function(){
	this.debug("renumberReset()");
	this.visibleRows = null;
};


/**
 * [ext-table] Renumber and collect all visible rows.
 *
 * @param {bool} [force=false] 
 * @param {FancytreeNode | int} [start=0]
 * @returns {$.Promise} The deferred will be resolved as soon as the (ajax)
 * @alias Fancytree#renumberVisible
 * @requires jquery.fancytree.table.js
 */
$.ui.fancytree._FancytreeClass.prototype.renumberVisible = function(force, start){
	if( (!this.options.viewport.enabled || this.visibleRows != null) && force !== true ) {
		this.debug("renumberVisible() ignored.");
		return false;
	}
	var i = 0,
		stamp = Date.now(),
		rows = this.visibleRows = [];

	this.visit(function(node){
		var hidden = node.tr && node.tr.style.display === "none";

		if( !hidden ) {
			node._rowIdx = i++;
			rows.push(node);
		}
		if ( node.children && !node.expanded ) {
			return "skip";
		}
	});
	this.debug("renumberVisible(" + force + ") took " + (Date.now()-stamp) + "ms, " +
		rows.length + "/" + this.count() + " nodes.");
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
			}
		}

		$table.addClass("fancytree-container fancytree-ext-table");
		$tbody = $table.find(">tbody");
		if( !$tbody.length ) {
			// TODO: not sure if we can rely on browsers to insert missing <tbody> before <tr>s:
			if( $table.find(">tr").length ) {
				$.error("Expected table > tbody > tr. If you see this, please open an issue.");
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

		$tbody.empty();

		// Make sure that status classes are set on the node's <tr> elements
		tree.statusClassPropName = "tr";
		tree.ariaPropName = "tr";
		this.nodeContainerAttrName = "tr";

		// #489: make sure $container is set to <table>, even if ext-dnd is listed before ext-table
		tree.$container = $table;

		tree.visibleRows = null;  // Set by renumberVisible()
		tree.viewport = $.extend({
			enabled: false,
			start: 0,
			count: 10,
			left: 0,
			right: 0
		}, opts.viewport);

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
	// treeLoad: function(ctx, source) {
	// 	$.ui.fancytree.debug("*** treeLoad 1");
	// 	return this._superApply(arguments).done(function(){
	// 		$.ui.fancytree.debug("*** treeLoad 2");
	// 		// ctx.tree.renumberReset();
	// 	});
	// },
	nodeLoadChildren: function (ctx, source) {
		$.ui.fancytree.debug("*** nodeLoadChildren 1");
		return this._superApply(arguments).done(function () {
			$.ui.fancytree.debug("*** nodeLoadChildren 2");
			ctx.tree.renumberReset();
		});
	},
	nodeRemoveChildMarkup: function(ctx) {
		var node = ctx.node;
		node.visit(function(n){
			if(n.tr){
				$(n.tr).remove();
				n.tr = null;
			}
		});
	},
	nodeRemoveMarkup: function(ctx) {
		var node = ctx.node;
		if(node.tr){
			$(node.tr).remove();
			node.tr = null;
		}
		this.nodeRemoveChildMarkup(ctx);
	},
	/* Override standard render. */
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var children, firstTr, i, l, newRow, outsideViewport, prevNode, prevTr, 
			prevTr, subCtx,
			tree = ctx.tree,
			node = ctx.node,
			opts = ctx.options,
			viewport = tree.viewport.enabled ? tree.viewport : null,
			start = (viewport && viewport.start > 0) ? +viewport.start : 0,
			bottom = viewport ? start + viewport.count - 1 : 0,
			isRootNode = !node.parent;

		if( tree._enableUpdate === false ) {
			// $.ui.fancytree.debug("*** nodeRender _enableUpdate: false");
			return;
		}
		// $.ui.fancytree.debug("*** nodeRender " + node + ", isRoot=" + isRootNode, "tr=" + node.tr, "hcp=" + ctx.hasCollapsedParents, "parent.tr=" + (node.parent && node.parent.tr));
		if( !_recursive ){
			$.ui.fancytree.debug("*** nodeRender root");
			ctx.hasCollapsedParents = node.parent && !node.parent.expanded;
			// Make sure visible row indices are correct
			if( viewport ) {
				tree.renumberVisible();
			}
		}

		if( !isRootNode ){
			outsideViewport = ( viewport && (node._rowIdx < start || tree.tbody.rows.length > viewport.count) );
			// outsideViewport = ( viewport && (node._rowIdx < start || node._rowIdx > bottom) );
			node.debug("nodeRender idx=	" + node._rowIdx + ", viewport=" + viewport + ",outside=" + outsideViewport, tree.tbody.rows.length);
			if( node.tr && (force || outsideViewport || node._rowIdx ) ) {
				node.debug("nodeRender removeMarkup");
				this.nodeRemoveMarkup(ctx);
			}
			if ( !node.tr && !outsideViewport ) {
				// if( ctx.hasCollapsedParents && !deep ) {
				// 	// #166: we assume that the parent will be (recursively) rendered
				// 	// later anyway.
				// 	// node.debug("nodeRender ignored due to unrendered parent");
				// 	return;
				// }
				// Create new <tr> after previous row
				// if( node.isStatusNode() ) {
				// 	newRow = tree.statusRowFragment.firstChild.cloneNode(true);
				// } else {
				newRow = tree.rowFragment.firstChild.cloneNode(true);
				// }
				// prevNode = findPrevRowNode(node);
				$.ui.fancytree.debug("*** nodeRender " + node);
				// _assert(prevNode);
				// if(collapsed === true && _recursive){
				// 	// hide all child rows, so we can use an animation to show it later
				// 	newRow.style.display = "none";
				// }else if(deep && ctx.hasCollapsedParents){
				// 	// also hide this row if deep === true but any parent is collapsed
				// 	newRow.style.display = "none";
				// }
				prevTr = null;
				if( node._rowIdx > 0 ) {
					prevNode = tree.visibleRows[node._rowIdx - 1];
					prevTr = prevNode && prevNode.tr;
				}
				if( prevTr ) {
					insertSiblingAfter(prevTr, newRow);
				} else {
					insertFirstChild(tree.tbody, newRow);
					// _assert(node._rowIdx > 0);
					// node.debug("nodeRender: idx=" + node._rowIdx + ", prevNode=", prevNode);
					// _assert(prevNode.tr);
				}
				node.tr = newRow;
				if( node.key && opts.generateIds ){
					node.tr.id = opts.idPrefix + node.key;
				}
				node.tr.ftnode = node;
				// TODO: vanilla
				node.span = $("span.fancytree-node", node.tr).get(0);
				// Set icon, link, and title (normally this is only required on initial render)
				this.nodeRenderTitle(ctx);
				// Allow tweaking, binding, after node was created for the first time
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
		if ( opts.renderNode ){
			opts.renderNode.call(tree, {type: "renderNode"}, ctx);
		}
		// Visit child nodes
		// Add child markup
		children = node.children;
		if(children && (isRootNode || deep || node.expanded)){
			for(i=0, l=children.length; i<l; i++) {
				if (viewport && tree.tbody.rows.length > viewport.count) {
					children[i].debug("BREAK")
					return false;
				}
				subCtx = $.extend({}, ctx, {node: children[i]});
				subCtx.hasCollapsedParents = subCtx.hasCollapsedParents || !node.expanded;
				this.nodeRender(subCtx, force, deep, collapsed, true);
			}
		}
		// // Make sure, that <tr> order matches node.children order.
		// if(children && !_recursive){ // we only have to do it once, for the root branch
		// 	prevTr = node.tr || null;
		// 	firstTr = tree.tbody.firstChild;
		// 	// Iterate over all descendants
		// 	node.visit(function(n){
		// 		if(n.tr){
		// 			if(!n.parent.expanded && n.tr.style.display !== "none"){
		// 				// fix after a node was dropped over a collapsed
		// 				n.tr.style.display = "none";
		// 				setChildRowVisibility(n, false);
		// 				tree.renumberReset();  // Invalidate visible row cache
		// 			}
		// 			if(n.tr.previousSibling !== prevTr){
		// 				node.debug("_fixOrder: mismatch at node: " + n);
		// 				var nextTr = prevTr ? prevTr.nextSibling : firstTr;
		// 				tree.tbody.insertBefore(n.tr, nextTr);
		// 			}
		// 			prevTr = n.tr;
		// 		}
		// 	});
		// }
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
		tree.renumberReset();  // Invalidate visible row cache
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
		this.renumberReset();  // Invalidate visible row cache
		return this._superApply(arguments);
	},
	treeDestroy: function(ctx) {
		this.$container.find("tbody").empty();
		this.$source && this.$source.removeClass("fancytree-helper-hidden");
		this.renumberReset();  // Invalidate visible row cache
		return this._superApply(arguments);
	}
	// treeRegisterNode: function(ctx, add, node) {
	// 	this.renumberVisible();
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
