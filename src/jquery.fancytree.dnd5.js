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
	classDragRemove = "fancytree-drag-remove",
	classDropAccept = "fancytree-drop-accept",
	classDropAfter = "fancytree-drop-after",
	classDropBefore = "fancytree-drop-before",
	classDropOver = "fancytree-drop-over",
	classDropReject = "fancytree-drop-reject",
	classDropTarget = "fancytree-drop-target",
	nodeMimeType = "application/x-fancytree-node",
	$dropMarker = null,
	// dragstartInfo = {},
	SOURCE_NODE = null,
	DRAG_ENTER_RESPONSE = null,
	// LAST_EVENT_HASH = null,
	// LAST_DROP_EFFECT = "none",
	// LAST_EFFECT_ALLOWED = "all",
	LAST_HIT_MODE = null;
	// PREV_NODE_ENTERED = null,
	// LAST_NODE_ENTERED = null;
	// LAST_NODE_LEFT = null;

/* Convert number to string and prepend +/-; return empty string for 0.*/
function offsetString(n){
	return n === 0 ? "" : (( n > 0 ) ? ("+" + n) : ("" + n));
}

/* Return a unique string for any event.*/
// function getEventHash(event){
// 	return event.type + "@" + event.pageX + "/" + event.pageY + "," +
// 			event.button + "," +
// 			event.altKey + event.ctrlKey + event.metaKey + event.shiftKey;
// }

function logEvent(event){
	// var node = $.ui.fancytree.getNode(event);
	// if( event.type === "dragover" || event.type === "drag" ) {
	// 	return;
	// }
	// window.console && window.console.log(event.type +
	// 	" - " + (node ? node.title : "?") + " - " +
	// 	event.target.tagName + "." + event.target.className);
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
	var spOfs, scrollTop,
		dndOpts = tree.options.dnd5,
		sp = tree.$scrollParent[0],
		eps = dndOpts.scrollSensitivity,
		speed = dndOpts.scrollSpeed,
		scrolled = 0;

	if ( sp !== document && sp.tagName !== "HTML" ) {
		spOfs = tree.$scrollParent.offset();
		scrollTop = sp.scrollTop;
		if ( ( spOfs.top + sp.offsetHeight ) - event.pageY < eps ) {
			sp.scrollTop = scrolled = scrollTop + speed;
		} else if ( scrollTop > 0 && event.pageY - spOfs.top < eps ) {
			sp.scrollTop = scrolled = scrollTop - speed;
		}
	} else {
		scrollTop = $(document).scrollTop();
		if (scrollTop > 0 && event.pageY - scrollTop < eps) {
			scrolled = scrollTop - speed;
			$(document).scrollTop(scrolled);
		} else if ($(window).height() - (event.pageY - scrollTop) < eps) {
			scrolled = scrollTop + speed;
			$(document).scrollTop(scrolled);
		}
	}
	if( scrolled ) {
		tree.debug("autScroll => " + scrolled + "px");
	}
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
		data.tree.warn("Ignore dragover for non-node");  //, event, data);
		return LAST_HIT_MODE;
	}

	var markerOffsetX, nodeOfs, relPosY, //res,
		// eventHash = getEventHash(event),
		hitMode = null,
		tree = data.tree,
		options = tree.options,
		dndOpts = options.dnd5,
		targetNode = data.node,
		sourceNode = data.otherNode,
		markerAt = "center",
		// glyph = options.glyph || null,
		// $source = sourceNode ? $(sourceNode.span) : null,
		$target = $(targetNode.span),
		$targetTitle = $target.find(">span.fancytree-title")
		// TODO: test & fix
		// isMove = LAST_DROP_EFFECT === "move"
		// isMove = data.dataTransfer.dropEffect === "move"
		;

	// targetNode.debug("dragover" + " " + sourceNode, data);
	
	// Suppress redundant events to avoid flickering
	// if( eventHash === LAST_EVENT_HASH ) {
	// 	// targetNode.debug("Suppress event " + eventHash + ", hitMode: " + LAST_HIT_MODE);
	// 	// It seems that dropEffect must be set on *every* dragover event (at least on Safari)?
	// 	// TODO: test & fix
	// 	// data.dataTransfer.dropEffect = LAST_DROP_EFFECT;
	// 	// data.dataTransfer.effectAllowed = LAST_EFFECT_ALLOWED;
	// 	return LAST_HIT_MODE;
	// }
	// LAST_EVENT_HASH = eventHash;

	if(DRAG_ENTER_RESPONSE === false){
		tree.warn("Ignore dragover, since dragenter returned false");  //, event, data);
		// $.error("assert failed: dragenter returned false");
		return false;
	} else if(typeof DRAG_ENTER_RESPONSE === "string") {
		$.error("assert failed: dragenter returned string");
		// Use hitMode from onEnter if provided.
		// hitMode = DRAG_ENTER_RESPONSE;
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
				targetNode.debug("drop over source node prevented");
				hitMode = null;
			}else if(hitMode === "before" && sourceNode && targetNode === sourceNode.getNextSibling()){
				targetNode.debug("drop after source node prevented");
				hitMode = null;
			}else if(hitMode === "after" && sourceNode && targetNode === sourceNode.getPrevSibling()){
				targetNode.debug("drop before source node prevented");
				hitMode = null;
			}else if(hitMode === "over" && sourceNode && sourceNode.parent === targetNode && sourceNode.isLastSibling() ){
				targetNode.debug("drop last child over own parent prevented");
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
	// LAST_DROP_EFFECT = data.dataTransfer.dropEffect;
	// LAST_EFFECT_ALLOWED = data.dataTransfer.effectAllowed;
	LAST_HIT_MODE = hitMode;
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
		// console.log("hide dropmarker")
	}
	// if( $source ){
	// 	$source.toggleClass(classDragRemove, isMove);
	// }
	$(targetNode.span)
		.toggleClass(classDropTarget, hitMode === "after" || hitMode === "before" || hitMode === "over")
		.toggleClass(classDropAfter, hitMode === "after")
		.toggleClass(classDropBefore, hitMode === "before")
		.toggleClass(classDropAccept, hitMode === "over")
		.toggleClass(classDropReject, hitMode === false);

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
		scrollSpeed: 5,             // Pixel per event
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

		// Store the current scroll parent, which may be the tree
		// container, any enclosing div, or the document
		this.$scrollParent = this.$container.children(":first").scrollParent();

		$dropMarker = $("#fancytree-drop-marker");
		if( !$dropMarker.length ) {
			$dropMarker = $("<div id='fancytree-drop-marker'></div>")
				.hide()
				.css({
					"z-index": 1000,
					// Drop marker should not steal dragenter/dragover events
					"pointer-events": "none"  
				}).prependTo("body");
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
					isMove = dataTransfer.dropEffect === "move",
					$source = node ? $(node.span) : null,
					data = {
						node: node,
						tree: tree,
						options: tree.options,
						originalEvent: e,
						dataTransfer: dataTransfer,
						dropEffect: undefined,  // set by dragend
						isCancelled: undefined  // set by dragend
					};

				logEvent(e);

				switch( e.type ) {

				case "dragstart":
					// node.debug(e.type, e, data);
					// LAST_NODE_ENTERED = null;
					// LAST_NODE_LEFT = null;
					$(node.span)
						.addClass(classDragSource)
						// .toggleClass(classDragRemove, isMove)
						;
					// Store current source node in different formats
					SOURCE_NODE = node;
					dataTransfer.setData(nodeMimeType, JSON.stringify(node.toDict()));
					dataTransfer.setData("text/html", $(node.span).html());
					dataTransfer.setData("text/plain", node.title);
					// node.debug("data", dataTransfer.getData(nodeMimeType), dataTransfer.getData("text/html"));
					dataTransfer.effectAllowed = "all";  // "copyMove"
					// dataTransfer.dropEffect = "move";
					// Set the title as drag image (otherwise it would contain the expander)
					dataTransfer.setDragImage($(node.span).find(".fancytree-title")[0], -10, -10);
					// dataTransfer.setDragImage($(node.span)[0], -10, -10);

 					return dndOpts.dragStart(node, data) !== false;

				case "drag":
					// Called every few miliseconds
					$source.toggleClass(classDragRemove, isMove);
					dndOpts.dragDrag(node, data);
					break;

				case "dragend":
					// node.debug(e.type, e, data);
					$(node.span).removeClass(classDragSource + " " + classDragRemove);
					SOURCE_NODE = null;
					DRAG_ENTER_RESPONSE = null;
					data.dropEffect = dataTransfer.dropEffect;
					data.isCancelled = (dataTransfer.dropEffect === "none");
					dndOpts.dragEnd(node, data);
					dataTransfer.clearData();
					break;
				}
			});
		}
		// Enable drop support if dragEnter() is specified:
		if( dndOpts.dragEnter ) {
			// Bind drop event handlers
			tree.$container.on("dragenter dragover dragleave drop", function(e){
				var r, res,
					allowDrop = null,
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

				logEvent(e);
				// node.warn("event " + e.type + ": #" + $(e.target).attr("id") + ", " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE, e);

				switch( e.type ) {

				case "dragenter":
					// The dragenter event is fired when a dragged element or
					// text selection enters a valid drop target.

					// if( $(e.target).attr("id") === "fancytree-drop-marker" ) {
					// 	node.warn("Ignore drop marker " + e.type + ": " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE);
					// }
					// 
					if( !node ) {
						// Sometimes we get dragenter for the container element
						tree.debug("Ignore non-node " + e.type + ": " + e.target.tagName + "." + e.target.className);
						DRAG_ENTER_RESPONSE = false;
						break;
					// } else if( $(e.target).attr("id") === "fancytree-drop-marker" ) {
					// 	// 
					// 	node.warn("Ignore frop marker " + e.type + ": " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE);
					// 	// allowDrop = !!LAST_HIT_MODE;
					// 	allowDrop = res && ( res.over || res.before || res.after );
					// 	break;
					// } else if( node === LAST_NODE_ENTERED ) {
					// 	// Ignore dragenter if the cursor moved between span tags
					// 	// of the same node. But we still need to reproduce the
					// 	// last response
					// 	node.warn("Ignore inter-node " + e.type + ": " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE);
					// 	// allowDrop = !!LAST_HIT_MODE;
					// 	allowDrop = res && ( res.over || res.before || res.after );
					// 	break;
					}
					// PREV_NODE_ENTERED = LAST_NODE_ENTERED;
					// LAST_NODE_ENTERED = node;
					// if( $(node.span).hasClass(classDropOver) ) {
					// 	node.warn("Ingnore dragenter (multi)");
					// 	DRAG_ENTER_RESPONSE = false;
					// 	break;
					// }

					$(node.span)
						.addClass(classDropOver)
						.removeClass(classDropAccept + " " + classDropReject);

					if( dndOpts.preventNonNodes && !nodeData ) {
						node.debug("Reject dropping a non-node");
						DRAG_ENTER_RESPONSE = false;
						break;
					} else if( dndOpts.preventForeignNodes && (!SOURCE_NODE || SOURCE_NODE.tree !== node.tree ) ) {
						node.debug("Reject dropping a foreign node");
						DRAG_ENTER_RESPONSE = false;
						break;
					}
					// node.info(e.type + " - " + LAST_HIT_MODE);
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

					$dropMarker
						// .prependTo(tree.$container.parent())
						.show();
					// Call dragEnter() to figure out if (and where) dropping is allowed
					if( dndOpts.preventRecursiveMoves && node.isDescendantOf(data.otherNode) ){
						res = false;
					}else{
						r = dndOpts.dragEnter(node, data);
						res = normalizeDragEnterResponse(r);
					}
					DRAG_ENTER_RESPONSE = res;
					// LAST_DROP_EFFECT = data.dataTransfer.dropEffect;
					// LAST_EFFECT_ALLOWED = data.dataTransfer.effectAllowed;
//					node.info(e.type, data)
					allowDrop = res && ( res.over || res.before || res.after );
					break;

				case "dragover":
					// The dragover event is fired when an element or text
					// selection is being dragged over a valid drop target
					// (every few hundred milliseconds).
					LAST_HIT_MODE = handleDragOver(e, data);
					allowDrop = !!LAST_HIT_MODE;
					break;

				case "dragleave":
					// NOTE: dragleave is fired AFTER the dragenter event of the
					// FOLLOWING element.

					if( !node ) {
						tree.debug("Ignore non-node " + e.type + ": " + e.target.tagName + "." + e.target.className);
						break;						
					// } else if( node !== PREV_NODE_ENTERED ) {
					// 	node.warn("Ignore inter-node " + e.type + ": " + e.target.tagName + "." + e.target.className);
					// 	// allowDrop = !!LAST_HIT_MODE;
					// 	break;
					}
					// LAST_NODE_LEFT = node;
					if( !$(node.span).hasClass(classDropOver) ) {
						node.debug("Ignore dragleave (multi)"); //, e.currentTarget);
						break;						
					}
					$(node.span).removeClass(classDropOver + " " + classDropAccept + " " + classDropReject);
					node.scheduleAction("cancel");
					dndOpts.dragLeave(node, data);
					$dropMarker.hide();
					// allowDrop = !!LAST_HIT_MODE;
					break;

				case "drop":
					$(node.span).removeClass(classDropOver + " " + classDropAccept + " " + classDropReject);
					// node.info(e.type, e, data);
					$dropMarker.hide();
					data.hitMode = LAST_HIT_MODE;
					data.dropEffect = dataTransfer.dropEffect;
					data.isCancelled = data.dropEffect === "none";
					$dropMarker.hide();
					dndOpts.dragDrop(node, data);
					// Prevent browser's default drop handling
					e.preventDefault();
					break;
				}
				// Dnd API madness: we must PREVENT default handling to enable dropping
				// (node || tree).info("" + e.type + " - " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE + "(" + allowDrop + ")");
				if( allowDrop ) {
					// (node || tree).info("DROP " + e.type + " - " + e.target.tagName + "." + e.target.className + " => " + LAST_HIT_MODE + "(" + allowDrop + ")");
					e.preventDefault();
					return false;
				}
			});
		}
	}
});
}(jQuery, window, document));
