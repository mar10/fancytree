/*!
 * jquery.fancytree.dnd5.js
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

 
 /*
 #TODO
   - glyph
 
 */
 
;(function($, window, document, undefined) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */
var
	classDragSource = "fancytree-drag-source",
	// classDragRemove = "fancytree-drag-remove",
	classDropAccept = "fancytree-drop-accept",
	classDropAfter = "fancytree-drop-after",
	classDropBefore = "fancytree-drop-before",
	classDropOver = "fancytree-drop-over",
	classDropReject = "fancytree-drop-reject",
	classDropTarget = "fancytree-drop-target",
	nodeMimeType = "application/x-fancytree-node",
	$dropMarker = null,
	// Attach node reference to helper object
	SOURCE_NODE = null,
	DRAG_ENTER_RESPONSE = null,
	LAST_EVENT_HASH = null,
	HIT_MODE = null;

/* Convert number to string and prepend +/-; return empty string for 0.*/
function offsetString(n){
	return n === 0 ? "" : (( n > 0 ) ? ("+" + n) : ("" + n));
}

/* Return a unique string for any event.*/
function getEventHash(event){
	return event.type + "@" + event.pageX + "/" + event.pageY + "," +
			event.button + "," +
			event.altKey + event.ctrlKey + event.metaKey + event.shiftKey;
}

/* Convert a dragEnter() or dragOver() response to a canonical form.
 * Return false or plain object
 * @param {string|object|boolean} r
 * @return {object|false} 
 */
function normalizeDragEnterResponse(r) {
	var res;

	if( !r ){
		return false;
	}
	if ( $.isPlainObject(r) ) {
		res = {
			over: !!r.over,
			before: !!r.before,
			after: !!r.after
		};
	}else if ( $.isArray(r) ) {
		res = {
			over: ($.inArray("over", r) >= 0),
			before: ($.inArray("before", r) >= 0),
			after: ($.inArray("after", r) >= 0)
		};
	}else{
		res = {
			over: ((r === true) || (r === "over")),
			before: ((r === true) || (r === "before")),
			after: ((r === true) || (r === "after"))
		};
	}
	if( Object.keys(res).length === 0 ) {
		return false;
	}
	// if( Object.keys(res).length === 1 ) {
	// 	res.unique = res[0];
	// }
	return res;
}

/* Handle dragover event (fired every x ms) and return hitMode. */
function handleDragOver(event, data) {
	var markerOffsetX, nodeOfs, relPosY, //res,
		eventHash = getEventHash(event),
		hitMode = null,
		options = data.tree.options,
		dnd = options.dnd5,
		targetNode = data.node,
		sourceNode = data.otherNode,
		markerAt = "center",
		// glyph = options.glyph || null,
		$source = sourceNode ? $(sourceNode.span) : null,
		$target = $(targetNode.span),
		$targetTitle = $target.find(">span.fancytree-title");

	// targetNode.debug("dragover" + " " + sourceNode, data);
	
	// Suppress redundant events
	if( eventHash === LAST_EVENT_HASH ) {
		targetNode.debug("Suppress event " + eventHash + ", hitMode: " + HIT_MODE);
		return HIT_MODE;
	}
	LAST_EVENT_HASH = eventHash;

	if(DRAG_ENTER_RESPONSE === false){
		$.error("assert failed: dragenter returned false");
	} else if(typeof DRAG_ENTER_RESPONSE === "string") {
		$.error("assert failed: dragenter returned string");
		// Use hitMode from onEnter if provided.
		hitMode = DRAG_ENTER_RESPONSE;
	} else {
		// Calculate hitMode from relative cursor position.
		nodeOfs = $target.offset();
		relPosY = (event.pageY - nodeOfs.top) / $target.height();

		if( DRAG_ENTER_RESPONSE.after && relPosY > 0.75 ){
			hitMode = "after";
		} else if(!DRAG_ENTER_RESPONSE.over && DRAG_ENTER_RESPONSE.after && relPosY > 0.5 ){
			hitMode = "after";
		} else if(DRAG_ENTER_RESPONSE.before && relPosY <= 0.25) {
			hitMode = "before";
		} else if(!DRAG_ENTER_RESPONSE.over && DRAG_ENTER_RESPONSE.before && relPosY <= 0.5) {
			hitMode = "before";
		} else if(DRAG_ENTER_RESPONSE.over) {
			hitMode = "over";
		}
		// Prevent no-ops like 'before source node'
		// TODO: these are no-ops when moving nodes, but not in copy mode
		if( dnd.preventVoidMoves ){
			if(targetNode === sourceNode){
				targetNode.debug("    drop over source node prevented");
				hitMode = null;
			}else if(hitMode === "before" && sourceNode && targetNode === sourceNode.getNextSibling()){
				targetNode.debug("    drop after source node prevented");
				hitMode = null;
			}else if(hitMode === "after" && sourceNode && targetNode === sourceNode.getPrevSibling()){
				targetNode.debug("    drop before source node prevented");
				hitMode = null;
			}else if(hitMode === "over" && sourceNode && sourceNode.parent === targetNode && sourceNode.isLastSibling() ){
				targetNode.debug("    drop last child over own parent prevented");
				hitMode = null;
			}
		}
        // targetNode.debug("hitMode: " + hitMode + ", ");
//		ui.helper.data("hitMode", hitMode);
	}
	// Let callback modify the calculated hitMode
	data.hitMode = hitMode;
	if(hitMode && dnd.dragOver){
		// TODO: http://code.google.com/p/dynatree/source/detail?r=625
		dnd.dragOver(targetNode, data);
		hitMode = data.hitMode;
	}
	if( hitMode === "after" || hitMode === "before" || hitMode === "over" ){
		markerOffsetX = -24;
		switch(hitMode){
		case "before":
			markerAt = "top";
			markerOffsetX -= 16;
			break;
		case "after":
			markerAt = "bottom";
			markerOffsetX -= 16;
			break;
		}

		$dropMarker
			.toggleClass(classDropAfter, hitMode === "after")
			.toggleClass(classDropOver, hitMode === "over")
			.toggleClass(classDropBefore, hitMode === "before")
			.show()
			.position($.ui.fancytree.fixPositionOptions({
				my: "left" + offsetString(markerOffsetX) + " center",
				at: "left " + markerAt,
				of: $targetTitle
				}));
	} else {
		$dropMarker.hide();
	}
	if( $source ){
		$source
			.toggleClass(classDragSource, !!hitMode)
			// .toggleClass(classDragRemove, true)
			;
	}
	$(targetNode.span)
		.toggleClass(classDropTarget, hitMode === "after" || hitMode === "before" || hitMode === "over")
		.toggleClass(classDropAfter, hitMode === "after")
		.toggleClass(classDropBefore, hitMode === "before")
		.toggleClass(classDropAccept, hitMode === "over")
		.toggleClass(classDropReject, hitMode !== "over");

			// accept = (res !== false && hitMode !== null);
	// if( dnd.smartRevert ) {
	// 	draggable.options.revert = !accept;
	// }
	// this._local._setDndStatus(sourceNode, node, ui.helper, hitMode, accept);

	// res = options.dnd5.dragOver(targetNode, data);
	return hitMode;
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
		acceptForeignNodes: true, 
		acceptNonNodes: true, 
		autoExpandMS: 1000,  // Expand nodes after n milliseconds of hovering.
		preventVoidMoves: true, // Prevent dropping nodes 'before self', etc.
		preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
		// smartRevert: true,     // set draggable.revert = true if drop was rejected
		// Events (drag support)
		dragStart: null,       // Callback(sourceNode, data), return true, to enable dnd drag
		dragEnd: $.noop,       // Callback(sourceNode, data)
		initHelper: null,      // Callback(sourceNode, data)
		updateHelper: null,    // Callback(sourceNode, data)
		// Events (drop support)
		dragEnter: null,       // Callback(targetNode, data), return true, to enable dnd drop
		dragOver: $.noop,      // Callback(targetNode, data)
		dragExpand: $.noop,    // Callback(targetNode, data), return false to prevent autoExpand
		dragDrop: $.noop,      // Callback(targetNode, data)
		dragLeave: $.noop      // Callback(targetNode, data)
	},

	treeInit: function(ctx){
		var tree = ctx.tree,
			opts = ctx.options,
			dndOpts = opts.dnd5,
			getNode = $.ui.fancytree.getNode;

		if( $.inArray("dnd", opts.extensions) >= 0 ) {
			$.error("Extensions 'dnd' and 'dnd5' are mutually exclusive.");
		}
		if( dndOpts.dragStop ) {
			$.error("dragStop is not used by ext-dnd5. Use dragEnd instead.");
		}
		this._superApply(arguments);

		$dropMarker = $("#fancytree-drop-marker");
		if( !$dropMarker.length ) {
			$dropMarker = $("<div id='fancytree-drop-marker'></div>")
				.hide()
				.css({"z-index": 1000})
				.prependTo("body");
				// if( glyph ) {
					// instData.$dropMarker
						// .addClass(glyph.map.dropMarker);
				// }
		}
		// Enable drag support if dragStart() is specified:
		if( dndOpts.dragStart ) {
			// Implement `opts.createNode` event to add the 'draggable' attribute
			$.ui.fancytree.overrideMethod(ctx.options, "createNode", function(event, data) {
				// Default processing if any
				this._super.apply(this, arguments);

				data.node.span.draggable = true;
			});
			// Handle drag events
			tree.$container.on("dragstart dragend", function(e){
				var node = getNode(e),
					dataTransfer = e.originalEvent.dataTransfer,
					data = {
						node: node,
						tree: node ? node.tree : null,
						originalEvent: e,
						dataTransfer: dataTransfer,
						effect: dataTransfer.dropEffect
					};

				// (node || tree).debug(e.type, this, arguments, e);

				// e.preventDefault();

				switch( e.type ) {

				case "dragstart":
					$(node.span)
						.addClass("fancytree-drag-source")
						// .toggleClass("fancytree-drag-remove", isMove)
						;
					// Store current source node in different formats
					SOURCE_NODE = node;
					dataTransfer.setData(nodeMimeType, JSON.stringify(node.toDict()));
					dataTransfer.setData("text/html", $(node.span).html());
					dataTransfer.setData("text/plain", node.title);
					// node.debug("data", dataTransfer.getData(nodeMimeType), dataTransfer.getData("text/html"));
					dataTransfer.effectAllowed = "all";  // "copyMove"
					dataTransfer.addElement($("<span>HUHU</span>"));
					// dataTransfer.dropEffect = "move";
 					return dndOpts.dragStart(node, data) !== false;

				case "dragend":
					$(node.span).removeClass("fancytree-drag-source fancytree-drag-remove");
					SOURCE_NODE = null;
					dataTransfer.clearData();
					return dndOpts.dragEnd(node, data);
				}
			});
		}
		// Enable drop support if dragEnter() is specified:
		if( dndOpts.dragEnter ) {
			tree.$container.on("dragover dragenter dragleave drop", function(e){
				var r, res,
					allowDrop = false,
					node = getNode(e),
					dataTransfer = e.originalEvent.dataTransfer,
					nodeData = dataTransfer.getData(nodeMimeType),
					// glyph = opts.glyph || null,
					// markerOffsetX,
					// markerAt = "center",
					data = {
						node: node,
						tree: node ? node.tree : null,
						hitMode: DRAG_ENTER_RESPONSE,
						originalEvent: e,
						dataTransfer: dataTransfer,
						effect: dataTransfer.dropEffect,
						otherNode: SOURCE_NODE || null,
						otherNodeData: nodeData ? JSON.parse(nodeData) : null
					};

				// (node || tree).debug(e.type, data);

				// NOTE: preventDefault should only be called to ALLOW dropping!!
				// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations#droptargets
				// e.preventDefault();

				switch( e.type ) {

				case "dragenter":
					// The dragenter event is fired when a dragged element or
					// text selection enters a valid drop target.
					if( !node ) {
						// Sometimes we get dragenter for container element
						$.ui.fancytree.warn("Reject dragenter for container(?)", e);
						DRAG_ENTER_RESPONSE = false;
						return;
					} else if( !dndOpts.acceptNonNodes && !nodeData ) {
						node.debug("Reject dropping non-node");
						DRAG_ENTER_RESPONSE = false;
						return;
					} else if( !dndOpts.acceptForeignNodes && (!SOURCE_NODE || SOURCE_NODE.tree !== node.tree ) ) {
						node.debug("Reject dropping foreign node");
						DRAG_ENTER_RESPONSE = false;
						return;
					}
					// NOTE: this event is fired BEFORE the dragleave event
					// of the previous element!
					// https://www.w3.org/Bugs/Public/show_bug.cgi?id=19041
					// TODO: maybe handle this on the $container level?
					// But this seems to work:
					setTimeout(function(){
						// node.info("DELAYED " + e.type, e.target, DRAG_ENTER_RESPONSE);						
						// Auto-expand node (only when 'over' the node, not 'before', or 'after')
						if( dndOpts.autoExpandMS &&
							node.hasChildren() !== false && !node.expanded &&
							(!dndOpts.dragExpand || dndOpts.dragExpand(node, data) !== false)
							) {
							node.scheduleAction("expand", dndOpts.autoExpandMS);
						}
					}, 0);
					$(node.span).removeClass(classDropAccept + " " + classDropReject);

					$dropMarker
						// .prependTo(tree.$container.parent())
						.show();
					// Call dragEnter() to figure out if (and where) dropping is allowed
					if( dndOpts.preventRecursiveMoves && node.isDescendantOf(data.otherNode) ){
						res = false;
					}else{
						r = dndOpts.dragEnter(node, ctx);
						res = normalizeDragEnterResponse(r);
					}
					DRAG_ENTER_RESPONSE = res;
//					node.info(e.type, data)
					allowDrop = res && ( res.over || res.before || res.after );
					if( allowDrop ) {
						e.preventDefault();
					}
					return allowDrop;

				case "dragover":
					// The dragover event is fired when an element or text
					// selection is being dragged over a valid drop target
					// (every few hundred milliseconds).

					// node.debug("dragover" + " " + SOURCE_NODE);
					// res = dndOpts.dragOver(node, data);
					// node.info(e.type, res)
					if( !data.node ) {
						$.ui.fancytree.warn("ignore dragover", e, data);
						return;
					}
					HIT_MODE = handleDragOver(e, data);
					allowDrop = !!HIT_MODE;
					if( allowDrop ) {
						e.preventDefault();
					}
					return allowDrop;

				case "dragleave":
					// Can't reset here, because dragleave is triggered AFTER
					// next dragenter
					// DRAG_ENTER_RESPONSE = null;
					var fromElement = e.originalEvent.fromElement,
						toElement = e.originalEvent.toElement,
						fromNode = fromElement ? $.ui.fancytree.getNode(fromElement) : null,
						toNode = toElement ? $.ui.fancytree.getNode(toElement) : null;
					// if( fromNode ) alert("" + fromNode);
					// $(node.span).removeClass(classDropAccept + " " + classDropReject);
					// node.info(e.type, data);
					if( node ) {					
						node.info(e.type + ", " + getEventHash(e) + ", from " + fromNode + " to " + toNode);
						node.scheduleAction("cancel");
						// dndOpts.dragLeave(node, data);
					}
					$dropMarker.hide();
					break;

				case "drop":
					data.hitMode = HIT_MODE;
					$(node.span).removeClass(classDropAccept + " " + classDropReject);
					node.info(e.type, data);
					$dropMarker.hide();
					return dndOpts.dragDrop(node, data);
				}
			});
		}
	}
});
}(jQuery, window, document));
