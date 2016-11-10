/*!
 * jquery.fancytree.fixed.js
 *
 * Render tree as table (aka 'treegrid', 'tabletree').
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2008-2015, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date 2015-09-08T23:02
 */

;(function($, window, document, undefined) {

"use strict";

/* *****************************************************************************
 * Private functions and variables
 */



function adjustColumnLayout(colIdx, $td1, $oppositeTr) {
	var selector = "td:not(.hidden):eq(" + colIdx + "), th:not(.hidden):eq(" + colIdx + ")",
		$td2 = $oppositeTr.find(selector),
		td1Width = $td1.width(),
		td2Width = $td2.width(),
		newWidth = Math.max(td1Width, td2Width);
	$td1.css("min-width", newWidth);
	$td2.css("min-width", newWidth);
}


function adjustRowLayout(rowIdx, $row1, $oppositeTable) {
	var $row2 = $oppositeTable.find("tr:eq(" + rowIdx + ")"),
		row1Height = $row1.outerHeight(),
		row2Height = $row2.outerHeight(),
		newHeight = Math.max(row1Height, row2Height);
	$row1.css("height", newHeight+1);
	$row2.css("height", newHeight+1);
}


function adjustWrapperLayout($wrapper) {
	var $topLeftWrapper = $wrapper.find("div.fancytree-fixed-tlWrapper"),
		$topRightWrapper = $wrapper.find("div.fancytree-fixed-trWrapper"),
		$bottomLeftWrapper = $wrapper.find("div.fancytree-fixed-blWrapper"),
		$bottomRightWrapper = $wrapper.find("div.fancytree-fixed-brWrapper"),
		$topLeftTable = $topLeftWrapper.find("table"),
		$topRightTable = $topRightWrapper.find("table"),
		$bottomLeftTable = $bottomLeftWrapper.find("table"),
		$bottomRightTable = $bottomRightWrapper.find("table");
	
	var wrapperWidth = $wrapper.width(),
		wrapperHeight = $wrapper.height(),
		fixedWidth = Math.min(wrapperWidth, Math.max($topLeftTable.outerWidth(), $bottomLeftTable.outerWidth())),
		fixedHeight = Math.min(wrapperHeight, Math.max($topLeftTable.height(), $topRightTable.height()));

	$topLeftWrapper.css({
		width: fixedWidth,
		height: fixedHeight
	});
	
	$topRightWrapper.css({
		width: wrapperWidth - fixedWidth - 17,
		height: fixedHeight,
		left: fixedWidth
	});
	
	$bottomLeftWrapper.css({
		width: fixedWidth,
		height: wrapperHeight - fixedHeight - 17,
		top: fixedHeight
	});
	
	$bottomRightWrapper.css({
		width: wrapperWidth - fixedWidth,
		height: wrapperHeight - fixedHeight,
		top: fixedHeight,
		left: fixedWidth
	});
	
}


function adjustLayout($wrapper) {
	var $topLeftTable = $wrapper.find("div.fancytree-fixed-tlWrapper table"),
		$topRightTable = $wrapper.find("div.fancytree-fixed-trWrapper table"),
		$bottomLeftTable = $wrapper.find("div.fancytree-fixed-blWrapper table"),
		$bottomRightTable = $wrapper.find("div.fancytree-fixed-brWrapper table");
	
	$topLeftTable.find("tr").each(function(idx) {
		adjustRowLayout(idx, $(this), $topRightTable);
	});
	
	$bottomLeftTable.find("tr").each(function(idx) {
		adjustRowLayout(idx, $(this), $bottomRightTable);
	});
	
	$topLeftTable.find("tr:first-child").find("td, th").each(function(idx) {
		var $bottomTr = $bottomLeftTable.find("tr:first-child");
		adjustColumnLayout(idx, $(this), $bottomTr);
	});
	
	$topRightTable.find("tr:first-child").find("td, th").each(function(idx) {
		var $bottomTr = $bottomRightTable.find("tr:first-child");
		adjustColumnLayout(idx, $(this), $bottomTr);
	});
	
	adjustWrapperLayout($wrapper);
}


$.ui.fancytree.registerExtension({
	name: "fixed",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		checkboxColumnIdx: null, // render the checkboxes into the this column index (default: nodeColumnIdx)
		customStatus: false,	 // true: generate renderColumns events for status nodes
		indentation: 16,         // indent every node level by 16px
		fixCols: 1,
		fixRows: true,
		nodeColumnIdx: 0         // render node expander, icon, and title to this column (default: #0)
	},
	// Overide virtual methods for this extension.
	// `this`       : is this extension object
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		var tree = ctx.tree,
			$table = tree.widget.element;
		var _this = this;
		// 'fixed' requires the table extension to be loaded before itself
		this._requireExtension("table", true, true);
		$table.addClass("fancytree-ext-fixed");
		
		$(document).on("click", ".fancytree-fixed-blWrapper table tr", function(evt) {
			var $tr = $(this);
			var idx = $tr.index();
			var $trRight = $tr.data("fancytree-node-counterpart");
			var node = $.ui.fancytree.getNode($trRight);
			node.setActive(true);
		}).on("mouseenter", ".fancytree-fixed-blWrapper table tr, .fancytree-fixed-brWrapper table tr", function(evt) {
			var $tr = $(this);
			$tr.css({
				"background-color": "#e5f3fb"
			});
			var $trRight = $tr.data("fancytree-node-counterpart");
			$trRight.css({
				"background-color": "#e5f3fb"
			});
		}).on("mouseleave", ".fancytree-fixed-blWrapper table tr, .fancytree-fixed-brWrapper table tr", function(evt) {
			var $tr = $(this);
			$tr.css({
				"background-color": ""
			});
			var $trRight = $tr.data("fancytree-node-counterpart");
			$trRight.css({
				"background-color": ""
			});
		}).on("click", ".fancytree-fixed-blWrapper .fancytree-expander", function(evt) {
			var $trLeft = $(this).closest("tr"),
				$trRight = $trLeft.data("fancytree-node-counterpart"),
				node = $.ui.fancytree.getNode($trRight),
				rootCtx = $.extend({}, ctx, {node: node});
			
			_this.nodeSetExpanded(rootCtx, !node.expanded).done(function(){});
			
		});
		
		return this._superApply(arguments);
	},
	treeLoad: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			options = this.options.fixed,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			res = this._superApply(arguments);
		
		res.done(function() {
			var $tableWrapper = $table.parent(),
				$topLeftWrapper = $("<div>").addClass("fancytree-fixed-tlWrapper"),
				$topRightWrapper = $("<div>").addClass("fancytree-fixed-trWrapper"),
				$bottomLeftWrapper = $("<div>").addClass("fancytree-fixed-blWrapper"),
				$bottomRightWrapper = $("<div>").addClass("fancytree-fixed-brWrapper"),
				$topLeftTable = $("<table>").attr("style", $table.attr("style")).attr("class", $table.attr("class")),
				$topRightTable = $("<table>").attr("style", $table.attr("style")).attr("class", $table.attr("class")),
				$bottomLeftTable = $("<table>").attr("style", $table.attr("style")).attr("class", $table.attr("class")),
				$bottomRightTable = $table,
				$head = $table.find("thead"),
				$body = $table.find("tbody"),
				remainingRows = fixedRowCount - $head.find("tr").length;
			
			$tableWrapper.addClass("fancytree-fixed-wrapper");
			
			$tableWrapper.append($topLeftWrapper, $topRightWrapper, $bottomLeftWrapper, $bottomRightWrapper);
			
			if (typeof fixedRowCount === "boolean") {
				fixedRowCount = fixedRowCount ? $head.find("tr").length : 0;
			}
			
			if (fixedRowCount) {
				$topLeftTable.append($head.clone());
				$topRightTable.append($head.clone());
			}
			
			if (remainingRows > 0) {
				var $remainingRows = $body.find("tr:lt(" + remainingRows + ")").clone();
				$topLeftTable.append($("<tbody>").append($remainingRows));
				$topRightTable.append($("<tbody>").append($remainingRows.clone()));
			}
			
			$topLeftTable.find("tr").each(function(idx) {
				var $tr = $(this);
				$tr.find("th").slice(fixedColCount).remove();
				$tr.find("td").slice(fixedColCount).remove();
			});
			
			$topRightTable.find("tr").each(function(idx) {
				var $tr = $(this);
				$tr.find("th").slice(0, fixedColCount).remove();
				$tr.find("td").slice(0, fixedColCount).remove();
			});
			
			if (remainingRows < 0) {
				var headTrCount = $head.find("tr").length;
				$bottomLeftTable.append($head.clone());
				
				$bottomLeftTable.find("thead tr:lt(" + (headTrCount + remainingRows) + ")").addClass("hidden").find("td, th").addClass("hidden");
				$bottomRightTable.find("thead tr:lt(" + (headTrCount + remainingRows) + ")").addClass("hidden").find("td, th").addClass("hidden");
				
				$topLeftTable.find("thead tr:gt(" + (headTrCount + remainingRows-1) + ")").remove();
				$topRightTable.find("thead tr:gt(" + (headTrCount + remainingRows-1) + ")").remove();
			} else {
				$bottomRightTable.find("thead").addClass("hidden").find("tr, th").addClass("hidden");
				$bottomRightTable.find("tbody tr:lt(" + remainingRows + ")").addClass("hidden");
			}
			
			$bottomLeftTable.append($body.clone());
			
			$bottomLeftTable.find("tr").each(function(idx) {
				var $tr = $(this);
				var $trRight = $bottomRightTable.find("tbody tr:eq(" + idx + ")");
				$tr.data("fancytree-node-counterpart", $trRight);
				$trRight.data("fancytree-node-counterpart", $tr);
				$tr.find("th").slice(fixedColCount).addClass("hidden");
				$tr.find("td").slice(fixedColCount).addClass("hidden");
			});
			
			$bottomRightTable.find("tr").each(function(idx) {
				var $tr = $(this);
				$tr.find("th").slice(0, fixedColCount).addClass("hidden");
				$tr.find("td").slice(0, fixedColCount).addClass("hidden");
			});
			
			$topLeftWrapper.append($topLeftTable);
			$topRightWrapper.append($topRightTable);
			$bottomLeftWrapper.append($bottomLeftTable);
			$bottomRightWrapper.append($bottomRightTable);
			
			adjustLayout($tableWrapper);
			
			$bottomRightWrapper.scroll(function() {
				var $this = $(this),
					scrollLeft = $this.scrollLeft(),
					scrollTop = $this.scrollTop();
				
				$topLeftWrapper
					.toggleClass("scrollBorderBottom", scrollTop > 0)
					.toggleClass("scrollBorderRight", scrollLeft > 0);
				$topRightWrapper
					.toggleClass("scrollBorderBottom", scrollTop > 0)
					.scrollLeft(scrollLeft);
				$bottomLeftWrapper
					.toggleClass("scrollBorderRight", scrollLeft > 0)
					.scrollTop(scrollTop);
			});
			
		});
		return res;
	},
	/* Called by nodeRender to sync node order with tag order.*/
//    nodeFixOrder: function(ctx) {
//    },
	
	nodeLoadChildren: function(ctx, source) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			options = this.options.fixed,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			node = ctx.node,
			res = this._superApply(arguments);

		return res;
	},
	nodeRemoveChildMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeRemoveMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeSetActive: function(ctx, flag) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			options = this.options.fixed;
		var $wrapper = $table.parent().parent();
		var $bottomLeftTable = $wrapper.find(".fancytree-fixed-blWrapper table");
		var node = ctx.node;
		var $rightNode = $(node.tr);
		var idx = node.getIndex();
//		$bottomLeftTable.find("tr.fancytree-active").removeClass("fancytree-active");
		var $leftNode = $rightNode.data("fancytree-node-counterpart");
		$leftNode.toggleClass("fancytree-active", flag);
		return this._superApply(arguments);
	},
//	createNode: function() {
//		var res = this._superApply(arguments);
//		return res
//	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var res = this._superApply(arguments);
		return res
	},
	nodeRenderTitle: function(ctx, title) {
		return this._superApply(arguments);
	},
	nodeRenderStatus: function(ctx) {
		console.log("NODE RENDER STATUS");
		return this._superApply(arguments);
	},
	nodeSetExpanded: function(ctx, flag, opts) {
		var node = ctx.node,
			tree = ctx.tree,
			fixCols = this.options.fixed.fixCols,
			$leftTable = tree.$container.parent().parent().find(".fancytree-fixed-blWrapper table"),
			$leftTr = $(node.tr).data("fancytree-node-counterpart"),
			res = this._superApply(arguments);
		
		res.done(function() {
			node.visit(function(child) {
				var $tr = $(child.tr),
					visible = $tr.is(":visible"),
					$clone = $tr.data("fancytree-node-counterpart");
				
				if (!$clone) {
					$clone = $tr.clone();
					$tr.data("fancytree-node-counterpart", $clone);
					$clone.data("fancytree-node-counterpart", $tr);
					$clone.find("td:gt(" + (fixCols - 1) + ")").remove();
					$leftTr.after($clone);
				}
				$clone.toggleClass("hidden", !flag).find("td, th").toggleClass("hidden", !flag);
				var $tds = $tr.find("td:lt(" + fixCols + ")");
				$tds.hide();
				if (!child.expanded) {
					return false;
				}
			});
//			adjustLayout($(".fancytree-fixed-wrapper"));
		});
		return res;
	},
	nodeSetStatus: function(ctx, status, message, details) {
		console.log("NODE SET STATUS");
		return this._superApply(arguments);
	},
	treeClear: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = $table.parent().parent();
		$table.find("tr, td, th, thead").removeClass("hidden").css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.append($table);
		$wrapper.find(".fancytree-fixed-tlWrapper").remove();
		$wrapper.find(".fancytree-fixed-trWrapper").remove();
		$wrapper.find(".fancytree-fixed-blWrapper").remove();
		$wrapper.find(".fancytree-fixed-brWrapper").remove();
		return this._superApply(arguments);
	},
	
	treeRegisterNode: function(ctx, add, node) {
	},
	
	treeDestroy: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = $table.parent().parent();
		$table.find("tr, td, th, thead").removeClass("hidden").css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.append($table);
		$wrapper.find(".fancytree-fixed-tlWrapper").remove();
		$wrapper.find(".fancytree-fixed-trWrapper").remove();
		$wrapper.find(".fancytree-fixed-blWrapper").remove();
		$wrapper.find(".fancytree-fixed-brWrapper").remove();
		
		return this._superApply(arguments);
	}
	/*,
	treeSetFocus: function(ctx, flag) {
//	        alert("treeSetFocus" + ctx.tree.$container);
		ctx.tree.$container.focus();
		$.ui.fancytree.focusTree = ctx.tree;
	}*/
});
}(jQuery, window, document));
