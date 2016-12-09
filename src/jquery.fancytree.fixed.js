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


$.ui.fancytree.registerExtension({
	name: "fixed",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		checkboxColumnIdx: null, // render the checkboxes into the this column index (default: nodeColumnIdx)
		customStatus: false,	 // true: generate renderColumns events for status nodes
		indentation: 16,		 // indent every node level by 16px
		fixCols: 1,
		fixRows: true,
		nodeColumnIdx: 0		 // render node expander, icon, and title to this column (default: #0)
	},
	// Overide virtual methods for this extension.
	// `this`	   : is this extension object
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._requireExtension("table", true, true);
		// 'fixed' requires the table extension to be loaded before itself
		
		var _this = this,
			res = this._superApply(arguments),
			tree = ctx.tree,
			options = this.options.fixed,
			$table = tree.widget.element,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			$tableWrapper = $table.parent(),
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
			$colgroup = $table.find("colgroup"),
			headRowCount = $head.find("tr").length,
			remainingHeadRows = headRowCount - fixedRowCount;
		
		$table.addClass("fancytree-ext-fixed");
		$tableWrapper.addClass("fancytree-fixed-wrapper");
		$bottomLeftTable.append($("<tbody>"));
		
		if ($colgroup.length) {
			$colgroup.remove();
		}
		
		if (typeof fixedRowCount === "boolean") {
			fixedRowCount = fixedRowCount ? headRowCount : 0;
		} else {
			fixedRowCount = Math.max(0, Math.min(fixedRowCount, headRowCount));
		}
		
		if (fixedRowCount) {
			$topLeftTable.append($head.clone());
			$topRightTable.append($head.clone());
			$head.hide();
		}
		
//		if (remainingHeadRows > 0) {
//			var $remainingHeadRows = $body.find("tr:lt(" + remainingHeadRows + ")").clone();
//			$topLeftTable.append($("<tbody>").append($remainingHeadRows));
//			$topRightTable.append($("<tbody>").append($remainingHeadRows.clone()));
//		}
		
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
		
//		if (remainingHeadRows < 0) {
//			var headTrCount = $head.find("tr").length;
//			$bottomLeftTable.append($head.clone());
//			
//			$bottomLeftTable.find("thead tr:lt(" + (headTrCount + remainingHeadRows) + ")").addClass("hidden").find("td, th").addClass("hidden");
//			$bottomRightTable.find("thead tr:lt(" + (headTrCount + remainingHeadRows) + ")").addClass("hidden").find("td, th").addClass("hidden");
//			
//			$topLeftTable.find("thead tr:gt(" + (headTrCount + remainingHeadRows-1) + ")").remove();
//			$topRightTable.find("thead tr:gt(" + (headTrCount + remainingHeadRows-1) + ")").remove();
//		} else {
//			$bottomRightTable.find("thead").addClass("hidden").find("tr, th").addClass("hidden");
//			$bottomRightTable.find("tbody tr:lt(" + remainingHeadRows + ")").addClass("hidden");
//		}
		
		
		this.$fixedWrapper = $tableWrapper;
		
		$tableWrapper.append(
			$topLeftWrapper.append(
				$topLeftTable
			),
			$topRightWrapper.append(
				$topRightTable
			),
			$bottomLeftWrapper.append(
				$bottomLeftTable
			),
			$bottomRightWrapper.append(
				$bottomRightTable
			)
		);
		
		$.ui.fancytree.overrideMethod(ctx.options, "createNode", function(event, data) {
			this._super.apply(this, arguments);
			var node = data.node,
				$nodeTr = $(node.tr),
				idx = $nodeTr.index(),
				$blTableBody = $("div.fancytree-fixed-blWrapper table tbody"),
				$prevLeftNode = $blTableBody.find("tr:eq(" + Math.max(idx - 1, 0) + ")"),
				$clone = $nodeTr.clone();
			
			if ($prevLeftNode.length) {
				$prevLeftNode.after($clone);
			} else {
				$blTableBody.append($clone);
			}
			
			$nodeTr.data("fancytree-node-counterpart", $clone);
			$clone.data("fancytree-node-counterpart", $nodeTr);
			$clone.find("th").slice(fixedColCount).remove();
			$clone.find("td").slice(fixedColCount).remove();
			$clone.show();
			$nodeTr.find("th").slice(0, fixedColCount).addClass("hidden");
			$nodeTr.find("td").slice(0, fixedColCount).addClass("hidden");
		});
		
		$tableWrapper.on("click", ".fancytree-fixed-blWrapper table tr", function(evt) {
			var $trLeft = $(this),
				$trRight = $trLeft.data("fancytree-node-counterpart"),
				node = $.ui.fancytree.getNode($trRight);
			node.setActive(true);

		}).on("mouseenter", ".fancytree-fixed-blWrapper table tr, .fancytree-fixed-brWrapper table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data("fancytree-node-counterpart");
			$tr.addClass("fancytree-hover");
			$trOther.addClass("fancytree-hover");
			
		}).on("mouseleave", ".fancytree-fixed-blWrapper table tr, .fancytree-fixed-brWrapper table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data("fancytree-node-counterpart");
			$tr.removeClass("fancytree-hover");
			$trOther.removeClass("fancytree-hover");
			
		}).on("click", ".fancytree-fixed-blWrapper .fancytree-expander", function(evt) {
			var $trLeft = $(this).closest("tr"),
				$trRight = $trLeft.data("fancytree-node-counterpart"),
				node = $.ui.fancytree.getNode($trRight),
				rootCtx = $.extend({}, ctx, {node: node});
			_this.nodeSetExpanded(rootCtx, !node.expanded).done(function(){});
			
		}).on("click", ".fancytree-fixed-blWrapper .fancytree-checkbox", function(evt) {
			var $trLeft = $(this).closest("tr"),
				$trRight = $trLeft.data("fancytree-node-counterpart"),
				node = $.ui.fancytree.getNode($trRight),
				rootCtx = $.extend({}, ctx, {node: node});
			node.setSelected(!node.selected);
		});
		
		$bottomLeftWrapper.bind("mousewheel DOMMouseScroll", function(event) {
			var $this = $(this),
				newScroll = $this.scrollTop();
			
			if (event.originalEvent.wheelDelta) {
				newScroll -= event.originalEvent.wheelDelta / 2;
			} else if (event.originalEvent.detail) {
				newScroll += event.originalEvent.detail * 14;
			}
			$this.scrollTop(newScroll);
			$bottomRightWrapper.scrollTop(newScroll);
		});
		
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
		
		return res;
	},
	treeLoad: function(ctx) {
		var _this = this,
			res = this._superApply(arguments);
		
		res.done(function() {
			_this.ext.fixed._adjustLayout();
		});
		return res;
	},
	/* Called by nodeRender to sync node order with tag order.*/
//	nodeFixOrder: function(ctx) {
//	},
	
	nodeLoadChildren: function(ctx, source) {
		return this._superApply(arguments);
	},
	nodeRemoveChildMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeRemoveMarkup: function(ctx) {
		return this._superApply(arguments);
	},
	nodeSetActive: function(ctx, flag) {
		var node = ctx.node,
			$rightNode = $(node.tr),
			$leftNode = $rightNode.data("fancytree-node-counterpart");
		$leftNode.toggleClass("fancytree-active", flag);
		var res = this._superApply(arguments);
		return res;
	},
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var res = this._superApply(arguments),
			node = ctx.node,
			$rightTr = $(node.tr),
			$leftTr = $(node.tr).data("fancytree-node-counterpart");
		if ($leftTr) {
			$leftTr.attr("class", $rightTr.attr("class"));
		}
		return res;
	},
	nodeRenderTitle: function(ctx, title) {
		return this._superApply(arguments);
	},
	nodeRenderStatus: function(ctx) {
		var res = this._superApply(arguments),
			node = ctx.node,
			$rightTr = $(node.tr).data("fancytree-node-counterpart");
		if ($rightTr) {
			$rightTr.toggleClass("fancytree-selected", node.selected);
			$rightTr.toggleClass("fancytree-partsel", node.partsel);
		}
		
		return res;
	},
	nodeSetExpanded: function(ctx, flag, opts) {
		var _this = this,
			node = ctx.node,
			fixCols = this.options.fixed.fixCols,
			$leftTr = $(node.tr).data("fancytree-node-counterpart"),
			res = this._superApply(arguments);
		$leftTr.toggleClass("fancytree-expanded", flag);
		res.done(function() {
			node.visit(function(child) {
				var $tr = $(child.tr),
					$clone = $tr.data("fancytree-node-counterpart");
				$clone.toggleClass("hidden", !flag).find("td, th").toggleClass("hidden", !flag);
				_this.ext.fixed._adjustRowLayout($tr, $clone);
				if (!child.expanded) {
					return "skip";
				}
			});
			
			$leftTr.find("td:not(.hidden), th:not(.hidden)").each(function(idx) {
				_this.ext.fixed._adjustColumnLayout($(this), null);
			});
			_this.ext.fixed._adjustWrapperLayout();
		});
		return res;
	},
	nodeSetStatus: function(ctx, status, message, details) {
		console.log("set status", arguments);
		return this._superApply(arguments);
	},
	treeClear: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = this.$fixedWrapper;
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
			$wrapper = this.$fixedWrapper;
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
	
	_adjustColumnLayout: function($td1, $td2) {
		if (!$td2) {
			var $table = $td1.closest("table"),
				$tr2 = null,
				colIdx = $td1.index(),
				$tableWrapper = $table.parent(),
				$wrapper = this.$fixedWrapper,
				$tlWrapper = $wrapper.find("div.fancytree-fixed-tlWrapper"),
				$trWrapper = $wrapper.find("div.fancytree-fixed-trWrapper"),
				$blWrapper = $wrapper.find("div.fancytree-fixed-blWrapper"),
				$brWrapper = $wrapper.find("div.fancytree-fixed-brWrapper");
			if ($tableWrapper.is($tlWrapper)) {
				$tr2 = $blWrapper.find("tr:not(.hidden)").first();
			} else if ($tableWrapper.is($trWrapper)) {
				$tr2 = $brWrapper.find("tr:not(.hidden)").first();
			} else if ($tableWrapper.is($blWrapper)) {
				$tr2 = $tlWrapper.find("tr:not(.hidden)").first();
			} else if ($tableWrapper.is($brWrapper)) {
				$tr2 = $trWrapper.find("tr:not(.hidden)").first();
			}
			
			$td2 = $tr2.find("td:not(.hidden):eq(" + colIdx + "), th:not(.hidden):eq(" + colIdx + ")");
		}
		$td1.css("min-width", "auto");
		$td2.css("min-width", "auto");
		var td1Width = $td1.width(),
			td2Width = $td2.width(),
			td1OuterWidth = $td1.outerWidth(),
			td2OuterWidth = $td2.outerWidth(),
			newWidth = Math.max(td1OuterWidth, td2OuterWidth);
		
		$td1.css("min-width", newWidth - (td1OuterWidth - td1Width));
		$td2.css("min-width", newWidth - (td2OuterWidth - td2Width));
	},

	_adjustRowLayout: function($row1, $row2) {
		if (!$row2) {
			$row2 = $row1.data("fancytree-node-counterpart");
		}
		$row1.css("height", "auto");
		$row2.css("height", "auto");
		var row1Height = $row1.outerHeight(),
			row2Height = $row2.outerHeight(),
			newHeight = Math.max(row1Height, row2Height);
		$row1.css("height", newHeight+1);
		$row2.css("height", newHeight+1);
	},

	_adjustWrapperLayout: function() {
		var $wrapper = this.$fixedWrapper,
			$topLeftWrapper = $wrapper.find("div.fancytree-fixed-tlWrapper"),
			$topRightWrapper = $wrapper.find("div.fancytree-fixed-trWrapper"),
			$bottomLeftWrapper = $wrapper.find("div.fancytree-fixed-blWrapper"),
			$bottomRightWrapper = $wrapper.find("div.fancytree-fixed-brWrapper"),
			$topLeftTable = $topLeftWrapper.find("table"),
			$topRightTable = $topRightWrapper.find("table"),
			$bottomLeftTable = $bottomLeftWrapper.find("table"),
			$bottomRightTable = $bottomRightWrapper.find("table"),
			wrapperWidth = $wrapper.width(),
			wrapperHeight = $wrapper.height(),
//			fixedWidth = Math.min(wrapperWidth, Math.max($topLeftTable.outerWidth(), $bottomLeftTable.outerWidth())),
			fixedWidth = Math.min(wrapperWidth, Math.max($topLeftTable.outerWidth(), $bottomLeftTable.get(0).scrollWidth)),
			fixedHeight = Math.min(wrapperHeight, Math.max($topLeftTable.height(), $topRightTable.height())),
			vScrollbar = $bottomRightWrapper.get(0).scrollHeight > (wrapperHeight - fixedHeight),
			hScrollbar = $bottomRightWrapper.get(0).scrollWidth > (wrapperWidth - fixedWidth);
		
		$topLeftWrapper.css({
			width: fixedWidth,
			height: fixedHeight
		});
		$topRightWrapper.css({
			width: wrapperWidth - fixedWidth - (vScrollbar ? 17 : 0),
			height: fixedHeight,
			left: fixedWidth
		});
		$bottomLeftWrapper.css({
			width: fixedWidth,
			height: vScrollbar ? wrapperHeight - fixedHeight - (hScrollbar ? 17 : 0) : "auto",
			top: fixedHeight
		});
		$bottomRightWrapper.css({
			width: wrapperWidth - fixedWidth,
			height: vScrollbar ? wrapperHeight - fixedHeight : "auto",
			top: fixedHeight,
			left: fixedWidth
		});
	},

	_adjustLayout: function() {
		var _this = this,
			$wrapper = this.$fixedWrapper,
			$topLeftTable = $wrapper.find("div.fancytree-fixed-tlWrapper table"),
			$topRightTable = $wrapper.find("div.fancytree-fixed-trWrapper table"),
			$bottomLeftTable = $wrapper.find("div.fancytree-fixed-blWrapper table"),
			$bottomRightTable = $wrapper.find("div.fancytree-fixed-brWrapper table");
		
		$topLeftTable.find("tr").each(function(idx) {
			var $row2 = $topRightTable.find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowLayout($(this), $row2);
		});
		
		$bottomLeftTable.find("tr").each(function(idx) {
			var $row2 = $bottomRightTable.find("tbody").find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowLayout($(this), $row2);
		});
		
		$topLeftTable.find("tr:first-child").find("td, th").each(function(idx) {
			var $bottomTr = $bottomLeftTable.find("tr:first-child"),
				$td2 = $bottomTr.find("td:not(.hidden):eq(" + idx + "), th:not(.hidden):eq(" + idx + ")");
			_this.ext.fixed._adjustColumnLayout($(this), $td2);
		});
		
		$topRightTable.find("tr:first-child").find("td, th").each(function(idx) {
			var $bottomTr = $bottomRightTable.find("tbody tr:first-child:not(.hidden)"),
				$td2 = $bottomTr.find("td:not(.hidden):eq(" + idx + "), th:not(.hidden):eq(" + idx + ")");
			_this.ext.fixed._adjustColumnLayout($(this), $td2);
		});
		
		_this.ext.fixed._adjustWrapperLayout();
	}
	
	
	/*,
	treeSetFocus: function(ctx, flag) {
//			alert("treeSetFocus" + ctx.tree.$container);
		ctx.tree.$container.focus();
		$.ui.fancytree.focusTree = ctx.tree;
	}*/
});
}(jQuery, window, document));
