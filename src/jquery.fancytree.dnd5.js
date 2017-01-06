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
	// dragstartInfo = {},
	// Attach node reference to helper object
	$scrollParent = null,
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

/* Implement auto scrolling when drag cursor is in top/bottom area of scroll parent. */
function autoScroll(tree) {
	var spOfs,
		dndOpts = tree.options.dnd5,
		sp = $scrollParent[0],
		eps = dndOpts.scrollSensitivity,
		speed = dndOpts.scrollSpeed,
		scrolled = 0;

	if ( sp !== document && sp.tagName !== "HTML" ) {
		spOfs = $scrollParent.offset();
		if ( ( spOfs.top + sp.offsetHeight ) - event.pageY < eps ) {
			sp.scrollTop = scrolled = sp.scrollTop + speed;
		} else if ( event.pageY - spOfs.top < eps ) {
			sp.scrollTop = scrolled = sp.scrollTop - speed;
		}
	} else {
		if (event.pageY - $(document).scrollTop() < eps) {
			scrolled = $(document).scrollTop() - speed;
			$(document).scrollTop(scrolled);
		} else if ($(window).height() - (event.pageY - $(document).scrollTop()) < eps) {
			scrolled = $(document).scrollTop() + speed;
			$(document).scrollTop(scrolled);
		}
	}
	scrolled && tree.debug("autScroll => " + scrolled + "px");
	return scrolled;
}

/* Handle dragover event (fired every x ms) and return hitMode. */
function handleDragOver(event, data) {
	// Implement auto-scrolling
	if ( data.options.dnd5.scroll ) {
		autoScroll(data.tree);
	}
	// Bail out with previous response if we get an invalid dragover
	if( !data.node ) {
		$.ui.fancytree.warn("Ignore dragover for non-node");  //, event, data);
		return HIT_MODE;
	}

	var markerOffsetX, nodeOfs, relPosY, //res,
		eventHash = getEventHash(event),
		hitMode = null,
		tree = data.tree,
		options = tree.options,
		dndOpts = options.dnd5,
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
		// targetNode.debug("Suppress event " + eventHash + ", hitMode: " + HIT_MODE);
		return HIT_MODE;
	}
	LAST_EVENT_HASH = eventHash;

	if(DRAG_ENTER_RESPONSE === false){
		tree.error("assert failed: dragenter returned false", event, data);
		// $.error("assert failed: dragenter returned false");
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
		if( dndOpts.preventVoidMoves ){
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
	}
	// Let callback modify the calculated hitMode
	data.hitMode = hitMode;
	if(hitMode && dndOpts.dragOver){
		// TODO: http://code.google.com/p/dynatree/source/detail?r=625
		dndOpts.dragOver(targetNode, data);
		hitMode = data.hitMode;
	}
	// 
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
		autoExpandMS: 1500,  // Expand nodes after n milliseconds of hovering.
		preventForeignNodes: false,  // Prevent dropping nodes from different Fancytrees
		preventNonNodes: false,      // Prevent dropping items other than Fancytree nodes
		preventRecursiveMoves: true, // Prevent dropping nodes on own descendants
		preventVoidMoves: true,      // Prevent dropping nodes 'before self', etc.
		scroll: true,                // Enable auto-scrolling while dragging
		scrollSensitivity: 20,       // Active top/bottom margin in pixel
		scrollSpeed: 20,             // Pixel per event
		// Events (drag support)
		dragStart: null,       // Callback(sourceNode, data), return true, to enable dnd drag
		dragDrag: $.noop,      // Callback(sourceNode, data)
		dragEnd: $.noop,       // Callback(sourceNode, data)
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

		this.$container.addClass("fancytree-ext-dnd5");

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
			// Bind drag event handlers
			tree.$container.on("dragstart drag dragend", function(e){
				var node = getNode(e),
					dataTransfer = e.originalEvent.dataTransfer,
					data = {
						node: node,
						tree: tree,
						options: tree.options,
						originalEvent: e,
						dataTransfer: dataTransfer,
						dropEffect: undefined,  // set by dragend
						isCancelled: undefined  // set by dragend
					};

				switch( e.type ) {

				case "dragstart":
					node.debug(e.type, e, data);
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
					// Set the title as drag image (otherwise it would contain the expander)
					dataTransfer.setDragImage($(node.span).find(".fancytree-title")[0], -10, -10);
					// dataTransfer.dropEffect = "move";

 					return dndOpts.dragStart(node, data) !== false;

				case "drag":
					// Called every few miliseconds
					dndOpts.dragDrag(node, data);
					break;

				case "dragend":
					node.debug(e.type, e, data);
					$(node.span).removeClass("fancytree-drag-source fancytree-drag-remove");
					SOURCE_NODE = null;
					DRAG_ENTER_RESPONSE = null;
					dataTransfer.clearData();
					data.dropEffect = dataTransfer.dropEffect;
					data.isCancelled = (dataTransfer.dropEffect === "none");
					dndOpts.dragEnd(node, data);
					break;
				}
			});
		}
		// Enable drop support if dragEnter() is specified:
		if( dndOpts.dragEnter ) {
			// Bind drop event handlers
			tree.$container.on("dragenter dragover dragleave drop", function(e){
				var r, res,
					allowDrop = false,
					node = getNode(e),
					dataTransfer = e.originalEvent.dataTransfer,
					nodeData = dataTransfer.getData(nodeMimeType),
					// glyph = opts.glyph || null,
					data = {
						node: node,
						tree: tree,
						options: tree.options,
						hitMode: DRAG_ENTER_RESPONSE,
						originalEvent: e,
						dataTransfer: dataTransfer,
						otherNode: SOURCE_NODE || null,
						otherNodeData: nodeData ? JSON.parse(nodeData) : null,
						dropEffect: undefined,  // set by drop event
						isCancelled: undefined  // set by drop event
					};

				switch( e.type ) {

				case "dragenter":
					// Store the current scroll parent, which may be the tree
					// container, the document, or any enclosing div
					$scrollParent = tree.$container.children(":first").scrollParent();
					// The dragenter event is fired when a dragged element or
					// text selection enters a valid drop target.
					if( !node ) {
						// Sometimes we get dragenter for container element
						$.ui.fancytree.warn("Reject dragenter for container(?)", e);
						DRAG_ENTER_RESPONSE = false;
						return;
					}
					if( $(node.span).hasClass(classDropOver) ) {
						node.warn("Ingnore dragenter (multi)");
						DRAG_ENTER_RESPONSE = false;
						return;
					}
					node.info(e.type, e, data);

					$(node.span)
						.addClass(classDropOver)
						.removeClass(classDropAccept + " " + classDropReject);

					if( dndOpts.preventNonNodes && !nodeData ) {
						node.debug("Reject dropping a non-node");
						DRAG_ENTER_RESPONSE = false;
						return;
					} else if( dndOpts.preventForeignNodes && (!SOURCE_NODE || SOURCE_NODE.tree !== node.tree ) ) {
						node.debug("Reject dropping a foreign node");
						DRAG_ENTER_RESPONSE = false;
						return;
					}
					// NOTE: dragenter is fired BEFORE the dragleave event
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

					// $dropMarker
					// 	// .prependTo(tree.$container.parent())
					// 	.show();
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
					// Dnd API madness: we must PREVENT default handling to enable dropping
					if( allowDrop ) {
						e.preventDefault();
					}
					return !allowDrop;

				case "dragover":
					// The dragover event is fired when an element or text
					// selection is being dragged over a valid drop target
					// (every few hundred milliseconds).
					HIT_MODE = handleDragOver(e, data);
					// Dnd API madness: we must PREVENT default handling to enable dropping
					allowDrop = !!HIT_MODE;
					if( allowDrop ) {
						e.preventDefault();
					}
					return !allowDrop;

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
					if( !node ) {
						tree.warn("ignore dragleave (no node)", e);
						break;						
					}
					if( !$(node.span).hasClass(classDropOver) ) {
						node.debug("ignore dragleave (multi)"); //, e.currentTarget);
						break;						
					}
					$(node.span).removeClass(classDropOver + " " + classDropAccept + " " + classDropReject);
					// if ( $(e.currentTarget).hasClass("fancytree-container") ) {
					// 	node.warn("ignore dragleave"); //, e.currentTarget);
					// 	break;
					// }
					node.info(e.type, e, data);
					node.info(e.type + ", " + getEventHash(e) + ", from " + fromNode + " to " + toNode +
						", " + $(e.currentTarget).hasClass("fancytree-node"), e.currentTarget);
					node.scheduleAction("cancel");
					// dndOpts.dragLeave(node, data);
					$dropMarker.hide();
					break;

				case "drop":
					$(node.span).removeClass(classDropAccept + " " + classDropReject);
					node.info(e.type, e, data);
					$dropMarker.hide();
					data.hitMode = HIT_MODE;
					data.dropEffect = dataTransfer.dropEffect;
					data.isCancelled = data.dropEffect === "none";
					node.debug(e.type, this, arguments, e);
					dndOpts.dragDrop(node, data);
					e.preventDefault();  // Prevent browser's default drop handling
					break;
				}
			});
		}
	}
});
}(jQuery, window, document));
