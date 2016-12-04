/*!
 * jquery.fancytree.dnd.js
 *
 * Drag-and-drop support (native HTML5).
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2016, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */
var classDropAccept = "fancytree-drop-accept",
	classDropAfter = "fancytree-drop-after",
	classDropBefore = "fancytree-drop-before",
	classDropOver = "fancytree-drop-over",
	classDropReject = "fancytree-drop-reject",
	classDropTarget = "fancytree-drop-target";

/* Convert number to string and prepend +/-; return empty string for 0.*/
function offsetString(n){
	return n === 0 ? "" : (( n > 0 ) ? ("+" + n) : ("" + n));
}


/* *****************************************************************************
 *
 */

$.ui.fancytree.registerExtension({
	name: "dnd5",
	version: "@VERSION",
	// Default options for this extension.
	options: {
		// Make tree nodes accept draggables
		autoExpandMS: 1000,  // Expand nodes after n milliseconds of hovering.
		preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
		preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
		// smartRevert: true,   // set draggable.revert = true if drop was rejected
		// Events (drag support)
		dragStart: null,     // Callback(sourceNode, data), return true, to enable dnd
		dragStop: null,      // Callback(sourceNode, data)
		initHelper: null,    // Callback(sourceNode, data)
		updateHelper: null,  // Callback(sourceNode, data)
		// Events (drop support)
		dragEnter: null,     // Callback(targetNode, data)
		dragOver: null,      // Callback(targetNode, data)
		dragExpand: null,    // Callback(targetNode, data), return false to prevent autoExpand
		dragDrop: null,      // Callback(targetNode, data)
		dragLeave: null      // Callback(targetNode, data)
	},

	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			dndOpts = opts.dnd5,
			getNode = $.ui.fancytree.getNode;

		if( $.inArray("dnd", ctx.options.extensions) >= 0 ) {
			$.error("Extensions 'dnd' and 'dnd5' are mutually exclusive.");
		}
		this._superApply(arguments);

		// Implement `opts.createNode` event to add the 'draggable' attribute
		$.ui.fancytree.overrideMethod(ctx.options, "createNode", function(event, data) {
			// Default processing if any
			this._super.apply(this, arguments);
			// Add 'draggable' attribute
			data.node.span.draggable = true;
		});

		tree.$container
			.on("dragstart dragend dragover", function(e){
				var node = getNode(e),
					data = {};

				// tree.debug(e.type, this, arguments);

				switch( e.type ) {
				case "dragstart":
					return dndOpts.dragStart(node, data);
				case "dragover":
					return dndOpts.dragOver(node, data);
				case "dragend":
					return dndOpts.dragEnd(node, data);
				}
			});
	}
	// nodeCreate: function(ctx){
	// 	ctx
	// }
});
}(jQuery, window, document));
