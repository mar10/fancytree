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

var	KC = $.ui.keyCode,
	// which keys are *not* handled by embedded control, but passed to tree
	// navigation handler:
	NAV_KEYS = {
		"text": [KC.UP, KC.DOWN],
		"number": [],
		"checkbox": [KC.UP, KC.DOWN, KC.LEFT, KC.RIGHT],
		"link": [KC.UP, KC.DOWN, KC.LEFT, KC.RIGHT],
		"radiobutton": [KC.UP, KC.DOWN, KC.LEFT, KC.RIGHT],
		"select-one": [KC.LEFT, KC.RIGHT],
		"select-multiple": [KC.LEFT, KC.RIGHT]
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
function findNeighbourTd($target, keyCode){
	var $tr, colIdx,
		$td = $target.closest("td"),
		$tdNext = null;

	switch( keyCode ){
		case KC.LEFT:
			$tdNext = $td.prev();
			break;
		case KC.RIGHT:
			$tdNext = $td.next();
			break;
		case KC.UP:
		case KC.DOWN:
			$tr = $td.parent();
			colIdx = getColIdx($tr, $td);
			while( true ) {
				$tr = (keyCode === KC.UP) ? $tr.prev() : $tr.next();
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
	}
	return $tdNext;
}


/* Set active cell and activate cell mode. */
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
			if( $prevTd.is($td) ) {
				return;
			}
			// if( !$prevTr.is($tr) ) {
			// 	$prevTr.removeClass("fancytree-cell-mode");
			// 	$tr.addClass("fancytree-cell-mode");
			// }
			$prevTd
				.removeAttr("tabindex")
				.removeClass("fancytree-active-cell");
			// tree.$activeTd.find(":focus").blur();
		}
		$td.addClass("fancytree-active-cell");
		tree.$activeTd = $td;

		$input = $td.find(":input:enabled,a");
		if( $input.length ) {
			$input.focus();
		} else {
			$td.attr("tabindex", "0").focus();
			// tree.$container.focus();
		}
	} else {
		// $td == null: switch back to row-mode
		tree.$container.removeClass("fancytree-cell-mode");
		if( $prevTd ) {
			$prevTd
				.removeAttr("tabindex")
				.removeClass("fancytree-active-cell");
			$prevTr.find("td").blur().removeAttr("tabindex");
			$prevTr.find(":input:enabled,a").attr("tabindex", "-1");
			tree.$activeTd = null;
		} else {
			// nothing to do
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
		autofocusInput:   false,  // Focus first embedded input if node gets activated
		handleCursorKeys: true   // Allow UP/DOWN in inputs to move to prev/next node
	},

	treeInit: function(ctx){
		// ariagrid requires the table extension to be loaded before itself
		this._requireExtension("table", true, true);
		this._superApply(arguments);

		this.$activeTd = null;

		this.$container.addClass("fancytree-ext-ariagrid");

		this.nodeColumnIdx = ctx.options.table.nodeColumnIdx;
		this.checkboxColumnIdx = ctx.options.table.checkboxColumnIdx;
		if( this.checkboxColumnIdx == null ) {
			this.checkboxColumnIdx = this.nodeColumnIdx;
		}
		
		// Activate node if embedded input gets focus (due to a click)
		this.$container.on("focusin", function(event){
			var ctx2,
				node = $.ui.fancytree.getNode(event.target);

			if( node && !node.isActive() ){
				// Call node.setActive(), but also pass the event
				ctx2 = ctx.tree._makeHookContext(node, event);
				ctx.tree._callHook("nodeSetActive", ctx2, true);
			}
		});
	},
	nodeSetActive: function(ctx, flag) {
		var node = ctx.node;
			//event = ctx.originalEvent || {},
			//triggeredByInput = $(event.target).is(":input");

		flag = (flag !== false);

		this._superApply(arguments);

		if( flag ){
			node.debug("activate row");
			// only active row is tabbable
			$(node.tr).find(":input,a").attr("tabindex", "0");
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
			node.debug("deactivate row");
			$(node.tr)
				// only one row can be in cell mode at any given time
				// .removeClass("fancytree-cell-mode")
				// only active row is tabbable
				.find(":input,a")
					.attr("tabindex", "-1");
		}
	},
	nodeKeydown: function(ctx) {
		var handleKeys, inputType, $td,
			node = ctx.node,
			//opts = ctx.options.ariagrid,
			event = ctx.originalEvent,
			eventString = $.ui.fancytree.eventToString(event),
			$target = $(event.target),
			$activeTd = this.$activeTd;

		if( $target.is(":input:enabled") ) {
			inputType = $target.prop("type");
		} else if( $target.is("a") ) {
			inputType = "link";
		}
		ctx.tree.debug("ext-ariagrid nodeKeydown",
			inputType, this.$activeTd, $.ui.fancytree.eventToString(event));

		if( inputType ){
			handleKeys = NAV_KEYS[inputType];
			if( handleKeys && $.inArray(event.which, handleKeys) < 0 ){
				return;  // Let input control handle the key
			}
		}

		switch( eventString ) {
		case "left":
			if( $activeTd ) {
				// Cell mode: move to neighbour
				$td = $activeTd.prev();
				activateCell(this, $td);
				return;
			}
			break;
		case "right":
			if( $activeTd ) {  
				// Cell mode: move to neighbour
				$td = $activeTd.next();
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
		case "up":
		case "down":
			if( $activeTd ) {
				// Cell mode: move to neighbour
				$td = findNeighbourTd($activeTd, eventString === "up" ? KC.UP : KC.DOWN);
				if( !$td ) {
					return;  // Stay on the same cell
				}
				// Default handling will now activate the new row...
				this._superApply(arguments);
				activateCell(this, $td);
				return;
			}
			break;
		case "esc":
			if( $activeTd ) {
				// Switch back from cell mode to row mode
				activateCell(this, null);
				return;
			}
			break;
		case "return":
			if( !$activeTd ) {
				// Switch from row mode to cell mode
				$td = $(node.tr).find(">td:nth(" + this.nodeColumnIdx + ")");
				activateCell(this, $td);
				return;  // no default handling
			}
			break;
		case "space":
			if( $activeTd && getColIdx($(node.tr), $activeTd) !== this.checkboxColumnIdx ) {
				return;  // no default handling
			}
			break;
		// default:
		}
		return this._superApply(arguments);
	}
});
}(jQuery, window, document));
