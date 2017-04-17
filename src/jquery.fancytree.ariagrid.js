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


/*  */
function activateCell(tree, $td){
	if( $td && $td.length ) {
		$td.closest("tr").addClass("fancytree-cell-mode");
		if( tree.$activeTd ) {
			if( tree.$activeTd.is($td) ) {
				return;
			}
			tree.$activeTd.removeClass("fancytree-active-cell");
		}
		tree.$activeTd = $td.addClass("fancytree-active-cell");
	} else {
		if( tree.$activeTd ) {
			tree.$activeTd
				.removeClass("fancytree-active-cell")
				.closest("tr")
					.removeClass("fancytree-cell-mode");
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

		// Activate node if embedded input gets focus (due to a click)
		// this.$container.on("focusin", function(event){
		// 	var ctx2,
		// 		node = $.ui.fancytree.getNode(event.target);

		// 	if( node && !node.isActive() ){
		// 		// Call node.setActive(), but also pass the event
		// 		ctx2 = ctx.tree._makeHookContext(node, event);
		// 		ctx.tree._callHook("nodeSetActive", ctx2, true);
		// 	}
		// });
	},
	nodeSetActive: function(ctx, flag) {
		var $outer,
			opts = ctx.options.ariagrid,
			node = ctx.node,
			event = ctx.originalEvent || {},
			triggeredByInput = $(event.target).is(":input");

		flag = (flag !== false);

		this._superApply(arguments);

		if( flag ){
			node.debug("activate row");
			$(node.tr).find(":input").attr("tabindex", "0");
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
				.removeClass("fancytree-cell-mode")
				.find(":input")
					.attr("tabindex", "-1");
		}
	},
	nodeKeydown: function(ctx) {
		var inputType, handleKeys, $td,
			node = ctx.node,
			opts = ctx.options.ariagrid,
			event = ctx.originalEvent,
			eventString = $.ui.fancytree.eventToString(event),
			$target = $(event.target);

		if( $target.is(":input:enabled") ) {
			inputType = $target.prop("type");
		} else if( $target.is("a") ) {
			inputType = "link";
		}
		ctx.tree.debug("ext-ariagrid nodeKeydown", inputType, this.$activeTd, $.ui.fancytree.eventToString(event));

		switch( eventString ) {
		case "left":
			if( this.$activeTd ) {  // cell mode: move to neighbor
				// this.$activeTd.removeClass("active-cell");
				$td = this.$activeTd.prev();
				activateCell(this, $td);
				// if( $td.length ) {
				// 	this.$activeTd = $td.addClass("active-cell");
				// } else {  // LEFT at leftmost column: enter row-mode again
				// 	this.$activeTd = null;
				// }
				return;  // no default handling
			}
			break;
		case "right":
			if( this.$activeTd ) {  // cell mode: move to neighbor
//				this.$activeTd.removeClass("active-cell");
				$td = this.$activeTd.next();
				activateCell(this, $td);
				// if( $td.length ) {
				// 	this.$activeTd = $td.addClass("active-cell");
				// } else {  // RIGHT  at rightmost column: enter row-mode again
				// 	this.$activeTd = null;
				// }
			} else if ( !node.isExpanded() && node.hasChildren() !== false ) {
				// Row mode and current node can be expanded: 
				// Default handling will expand
				break;
			} else {
				// row mode: switch to cell mode
//				this.$activeTd = $(node.tr).find(">td:first").addClass("active-cell");
				$td = $(node.tr).find(">td:first");
				activateCell(this, $td);
			}
			return;  // no default handling
		case "up":
		case "down":
			if( this.$activeTd ) {  // cell mode: move to neighbor
				$td = findNeighbourTd(this.$activeTd, eventString === "up" ? KC.UP : KC.DOWN);
				if( !$td ) {
					return;  // Stay on the same cell
				}
				//this.$activeTd.removeClass("active-cell");
				//this.$activeTd = $td.addClass("active-cell");
				activateCell(this, $td);
				// default handling will activate the new row...
			}
			break;
		case "space":
			if( this.$activeTd ) {  // cell mode: move to neighbor
				$td = findNeighbourTd(this.$activeTd, eventString === "up" ? KC.UP : KC.DOWN);
				if( $td ) {
					this.$activeTd.removeClass("active-cell");
					this.$activeTd = $td.addClass("active-cell");
					break;  // default handling will activate the row
				}
				return;  // no default handling
			}
			break;
		}


		// if( inputType && opts.handleCursorKeys ){
		// 	handleKeys = NAV_KEYS[inputType];
		// 	if( handleKeys && $.inArray(event.which, handleKeys) >= 0 ){
		// 		$td = findNeighbourTd($target, event.which);
		// 		if( $td && $td.length ) {
		// 			// ctx.node.debug("ignore keydown in input", event.which, handleKeys);
		// 			$td.find(":input:enabled,a").focus();
		// 			// Prevent Fancytree default navigation
		// 			return false;
		// 		}
		// 	}
		// 	return true;
		// }
		// ctx.tree.debug("ext-ariagrid NOT HANDLED", event, inputType);
		return this._superApply(arguments);
	}
});
}(jQuery, window, document));
