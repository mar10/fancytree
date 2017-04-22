/*!
 * jquery.fancytree.ariagrid.js
 *
 * Support keyboard navigation for trees with embedded input controls.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2017, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";


/*******************************************************************************
 * Private functions and variables
 */

// Allow these navigation keys even when input controls are focused

var	clsFancytreeActiveCell = "fancytree-active-cell",
	// TODO: define attribute- and class-names for better compression
	// Define which keys are handled by embedded control, and should *not* be 
	// passed to tree navigation handler:
	NAV_KEYS = {
		"text": ["left", "right", "home", "end"],
		"number": ["up", "down", "left", "right", "home", "end"],
		"checkbox": [],
		"link": [],
		"radiobutton": ["up", "down"],
		"select-one": ["up", "down"],
		"select-multiple": ["up", "down"]
	};


/* Calculate TD column index (considering colspans).*/
function getColIdx($tr, $td) {
	var colspan,
		td = $td.get(0),
		idx = 0;

	$tr.children().each(function () {
		if( this === td ) {
			return false;
		}
		colspan = $(this).prop("colspan");
		idx += colspan ? colspan : 1;
	});
	return idx;
}


/* Find TD at given column index (considering colspans).*/
function findTdAtColIdx($tr, colIdx) {
	var colspan,
		res = null,
		idx = 0;

	$tr.children().each(function () {
		if( idx >= colIdx ) {
			res = $(this);
			return false;
		}
		colspan = $(this).prop("colspan");
		idx += colspan ? colspan : 1;
	});
	return res;
}


/* Find adjacent cell for a given direction. Skip empty cells and consider merged cells */
function findNeighbourTd(tree, $target, keyCode){
	var $td = $target.closest("td"),
		$tr = $td.parent(),
		treeOpts = tree.options,
		colIdx = getColIdx($tr, $td),
		$tdNext = null;

	switch( keyCode ){
		case "left":
			$tdNext = treeOpts.rtl ? $td.next() : $td.prev();
			break;
		case "right":
			$tdNext = treeOpts.rtl ? $td.prev() : $td.next();
			break;
		case "up":
		case "down":
			while( true ) {
				$tr = keyCode === "up" ? $tr.prev() : $tr.next();
				if( !$tr.length ) {
					break;
				}
				// Skip hidden rows
				if( $tr.is(":hidden") ) {
					continue;
				}
				// Find adjacent cell in the same column
				$tdNext = findTdAtColIdx($tr, colIdx);
				// Skip cells that don't contain a focusable element
//				if( $tdNext && $tdNext.find(":input,a").length ) {
					break;
//				}
			}
			break;
		case "ctrl+home":
			$tdNext = findTdAtColIdx($tr.siblings().first(), colIdx);
			if( $tdNext.is(":hidden") ) {
				$tdNext = findNeighbourTd(tree, $tdNext.parent(), "down");
			}
			break;
		case "ctrl+end":
			$tdNext = findTdAtColIdx($tr.siblings().last(), colIdx);
			if( $tdNext.is(":hidden") ) {
				$tdNext = findNeighbourTd(tree, $tdNext.parent(), "up");
			}
			break;
		case "home":
			$tdNext = $tr.children("td").first();
			break;
		case "end":
			$tdNext = $tr.children("td").last();
			break;
	}
	return $tdNext;
}


/* Set active cell and activate cell-mode if needed. 
 * Pass $td=null to enter row-mode.
 */
function activateCell(tree, $td){
	var $input, $tr,
		$prevTd = tree.$activeTd || null,
		$prevTr = $prevTd ? $prevTd.closest("tr") : null;

	tree.debug("activateCell: " + ($prevTd ? $prevTd.text() : "null") +
		" -> " + ($td ? $td.text() : "null"));

	if( $td && $td.length ) {
		tree.$container.addClass("fancytree-cell-mode");
		$tr = $td.closest("tr");
		if( $prevTd ) {
			// cell-mode => cell-mode
			if( $prevTd.is($td) ) {
				return;
			}
			// if( !$prevTr.is($tr) ) {
			// 	$prevTr.removeClass("fancytree-cell-mode");
			// 	$tr.addClass("fancytree-cell-mode");
			// }
			$prevTd
				.removeAttr("tabindex")
				.removeClass(clsFancytreeActiveCell);
			// tree.$activeTd.find(":focus").blur();
		}
		$td.addClass(clsFancytreeActiveCell);
		tree.$activeTd = $td;

		$input = $td.find(":input:enabled,a");
		if( $input.length ) {
			$input.focus();
		} else {
			$td.attr("tabindex", "0").focus();
			// tree.$container.focus();
		}
		// TODO:
		// function moveAriaExpandedToFirstCell (row) {
		// 	var expandedValue = row.getAttribute('aria-expanded');
		// 	var firstCell = getNavigableCols(row)[0];
		// 	if (expandedValue) {
		// 		firstCell.setAttribute('aria-expanded', expandedValue);
		// 		row.removeAttribute('aria-expanded');
		// 	}
	} else {
		// $td == null: switch back to row-mode
		tree.$container.removeClass("fancytree-cell-mode");
		if( $prevTd ) {
			// cell-mode => row-mode
			$prevTd
				.removeAttr("tabindex")
				.removeClass(clsFancytreeActiveCell);
			// we need to blur first, because otherwies the focus frame is not reliably removed(?)
			$prevTr.find("td").blur().removeAttr("tabindex");
			$prevTr.find(":input:enabled,a").attr("tabindex", "-1");
			tree.$activeTd = null;
			// The cell lost focus, but the tree still needs to capture keys:
			tree.setFocus();
		} else {
			// row-mode => row-mode (nothing to do)
		}
	}
}

/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "ariagrid",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		cellFocus: "allow",
		magicEnter: true,
		// TODO: use tree option `name` or `title` instead?:
		label: "Tree Grid"  // Added as `aria-label` attribute
		// autofocusInput:   false,  // Focus first embedded input if node gets activated
		// handleCursorKeys: true   // Allow UP/DOWN in inputs to move to prev/next node
	},

	treeInit: function(ctx){
		var tree = ctx.tree,
			treeOpts = ctx.options,
			opts = treeOpts.ariagrid;

		// ariagrid requires the table extension to be loaded before itself
		this._requireExtension("table", true, true);
		if( !treeOpts.aria ) { $.error("ext-ariagrid requires `aria: true`"); }

		this._superApply(arguments);

		this.$activeTd = null;

		this.$container
			.addClass("fancytree-ext-ariagrid")
			.attr("aria-label", "" + opts.label);
		this.$container.find("thead > tr > th").attr("role", "columnheader");

		this.nodeColumnIdx = treeOpts.table.nodeColumnIdx;
		this.checkboxColumnIdx = treeOpts.table.checkboxColumnIdx;
		if( this.checkboxColumnIdx == null ) {
			this.checkboxColumnIdx = this.nodeColumnIdx;
		}

		// Activate node if embedded input gets focus (due to a click)
		this.$container.on("focusin", function(event){
			var //ctx2,
				node = $.ui.fancytree.getNode(event.target),
 				$td = $(event.target).closest("td");

			tree.debug("focusin: " + (node ? node.title : "null") +
				", target: " + ($td ? $td.text() : null) +
				", node was active: " + (node && node.isActive()) +
				", last cell: " + (tree.$activeTd ? tree.$activeTd.text() : null));
 			// TODO: 
			// if( ctx.options.cellFocus === "force" || ctx.options.cellFocus === "start" ) {
			// 	var $td = $(this.getFirstChild().tr).find(">td:first");
			// 	activateCell(this, $td);
			// }
			if( tree.$activeTd ) {
				// If in cell-mode, activate new cell
 				activateCell(tree, $td);
			}
 		// 	// activateCell(ctx.tree, $td);
			// if( node && !node.isActive() ){
			// 	// Call node.setActive(), but also pass the event
			// 	ctx2 = ctx.tree._makeHookContext(node, event);
			// 	ctx.tree._callHook("nodeSetActive", ctx2, true, {cell: $td});
			// }
		});
	},
	nodeClick: function(ctx) {
		var targetType = ctx.targetType,
			tree = ctx.tree,
			node = ctx.node,
			$td = $(event.target).closest("td");

		tree.debug("nodeClick: node: " + (node ? node.title : "null") +
			", targetType: " + targetType +
			", target: " + ($td.length ? $td.text() : null) +
			", node was active: " + (node && node.isActive()) +
			", last cell: " + (tree.$activeTd ? tree.$activeTd.text() : null));
			// TODO: 
		// if( ctx.options.cellFocus === "force" || ctx.options.cellFocus === "start" ) {
		// 	var $td = $(this.getFirstChild().tr).find(">td:first");
		// 	activateCell(this, $td);
		// }
		if( tree.$activeTd ) {
			// If in cell-mode, activate new cell
			activateCell(tree, $td);
			return false;
		}
	},
	nodeRenderStatus: function(ctx) {
		// Set classes for current status
		var res,
			node = ctx.node,
			$tr = $(node.tr);

		res = this._super(ctx);

		if( node.parent ) {
			// TODO: remove aria-labelledby (set by core)?
			// FIXME: aria-labelledby does not match ID of title span
			// TODO: consider moving this code to core (if aria: true)
			$tr
				.attr("aria-level", node.getLevel())
				.attr("aria-setsize", node.parent.children.length)
				.attr("aria-posinset", node.getIndex() + 1);

			if( $tr.is(":hidden") ) {
				$tr.attr("aria-hidden", true);
			} else {
				$tr.removeAttr("aria-hidden");
			}
		}
		return res;
	},
	nodeSetActive: function(ctx, flag, callOpts) {
		var node = ctx.node;
			//event = ctx.originalEvent || {},
			//triggeredByInput = $(event.target).is(":input");

		flag = (flag !== false);
		node.debug("nodeSetActive(" + flag + ")");

		this._superApply(arguments);

		if( flag ){
			// only active row is tabbable
			$(node.tr).find(":input,a").attr("tabindex", "0");

			if( callOpts && callOpts.cell ) {
				// TODO: `cell` may be an col-index, <td>, or `$(td)`
				activateCell(ctx.tree, callOpts.cell);
			}
			// if( ctx.options.titlesTabbable ){
			// 	if( !triggeredByInput ) {
			// 		$(node.span).find("span.fancytree-title").focus();
			// 		node.setFocus();
			// 	}
			// 	// If one node is tabbable, the container no longer needs to be
			// 	ctx.tree.$container.attr("tabindex", "-1");
			// 	// ctx.tree.$container.removeAttr("tabindex");
			// } else if( opts.autofocusInput && !triggeredByInput ){
			// 	// Set focus to input sub input (if node was clicked, but not
			// 	// when TAB was pressed )
			// 	$outer = $(node.tr || node.span);
			// 	$outer.find(":input:enabled:first").focus();
			// }
		}else{
			// only active row is tabbable
			activateCell(ctx.tree, null);
			$(node.tr).find("td").removeAttr("tabindex");
			$(node.tr).find(":input,a").attr("tabindex", "-1");
		}
	},
	nodeKeydown: function(ctx) {
		var handleKeys, inputType, $td,
			tree = ctx.tree,
			node = ctx.node,
			treeOpts = ctx.options,
			opts = treeOpts.ariagrid,
			event = ctx.originalEvent,
			eventString = $.ui.fancytree.eventToString(event),
			$target = $(event.target),
			$activeTd = this.$activeTd;

		if( $target.is(":input:enabled") ) {
			inputType = $target.prop("type");
		} else if( $target.is("a") ) {
			inputType = "link";
		}
		ctx.tree.debug("ext-ariagrid nodeKeydown(" + eventString + "), activeTd: '" + 
			(this.$activeTd && this.$activeTd.text()) + "', inputType: " + inputType);

		if( inputType && eventString !== "esc" ){
			handleKeys = NAV_KEYS[inputType];
			if( handleKeys && $.inArray(eventString, handleKeys) >= 0 ){
				return;  // Let input control handle the key
			}
		}
		// if( ctx.options.cellFocus === "force" || ctx.options.cellFocus === "start" ) {
		// 	var $td = $(this.getFirstChild().tr).find(">td:first");
		// 	activateCell(this, $td);
		// }

		switch( eventString ) {
		case "right":
			if( $activeTd ) {
				// Cell mode: move to neighbour
				$td = findNeighbourTd(tree, $activeTd, eventString);
				activateCell(this, $td);
			} else if ( !node.isExpanded() && node.hasChildren() !== false ) {
				// Row mode and current node can be expanded: 
				// default handling will expand.
				break;
			} else {
				// Row mode: switch to cell mode
				$td = $(node.tr).find(">td:first");
				activateCell(this, $td);
			}
			return;  // no default handling
		case "left":
		case "home":
		case "end":
		case "ctrl+home":
		case "ctrl+end":
		case "up":
		case "down":
			if( $activeTd ) {
				// Cell mode: move to neighbour
				$td = findNeighbourTd(tree, $activeTd, eventString);
				activateCell(this, $td);
				return;
			}
			break;
		// case "ctrl+home":
		// case "ctrl+end":
		// case "up":
		// case "down":
		// 	if( $activeTd ) {
		// 		// Cell mode: move to neighbour
		// 		$td = findNeighbourTd(tree, $activeTd, eventString);
		// 		if( !$td ) {
		// 			return;  // Stay on the same cell
		// 		}
		// 		// Default handling will now activate the new row...
		// 		this._superApply(arguments);
		// 		activateCell(this, $td);
		// 		return;
		// 	}
		// 	break;
		case "esc":
			if( $activeTd && opts.cellFocus !== "force" ) {
				// Switch back from cell mode to row mode
				activateCell(this, null);
				return;
			}
			break;
		case "return":
			if( $activeTd ) {
				// TODO: apply 'default action' for embedded cell control, e.g. 
				// - open embedded <a> link
				// - expand if on nodeColumnIdx
				// - (un)check checkbox
				// - focus <input>?
			} else {
				// Switch from row mode to cell mode
				$td = $(node.tr).find(">td:nth(" + this.nodeColumnIdx + ")");
				activateCell(this, $td);
				return;  // no default handling
			}
			break;
		case "space":
			if( $activeTd && getColIdx($(node.tr), $activeTd) !== this.checkboxColumnIdx ) {
				// make sure we don't select whole row in cell-mode, unless the
				// checkbox cell is active
				return;  // no default handling
			}
			break;
		// default:
		}
		return this._superApply(arguments);
	}
});
}(jQuery, window, document));
