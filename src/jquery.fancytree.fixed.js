/*!
 * jquery.fancytree.fixed.js
 *
 * Add fixed colums and headers to ext.table.
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

/* *****************************************************************************
 * Private functions and variables
 */

$.ui.fancytree.registerExtension({
	name: "fixed",
	version: "0.0.1",
	// Default options for this extension.
	options: {
		fixCol: 1,
		fixColWidths: null,
		fixRows: true
	},
	// Overide virtual methods for this extension.
	// `this`	   : is this extension object
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._requireExtension("table", true, true);
		// 'fixed' requires the table extension to be loaded before itself

		var res = this._superApply(arguments),
			tree = ctx.tree,
			options = this.options.fixed,
			$table = tree.widget.element,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			$tableWrapper = $table.parent().addClass("fancytree-ext-fixed-wrapper"),
			$topLeftWrapper = $("<div>").addClass("fancytree-fixed-wrapper-tl"),
			$topRightWrapper = $("<div>").addClass("fancytree-fixed-wrapper-tr"),
			$bottomLeftWrapper = $("<div>").addClass("fancytree-fixed-wrapper-bl"),
			$bottomRightWrapper = $("<div>").addClass("fancytree-fixed-wrapper-br"),
			tableStyle = $table.attr("style"),
			tableClass = $table.attr("class"),
			$topLeftTable = $("<table>").attr("style", tableStyle).attr("class", tableClass),
			$topRightTable = $("<table>").attr("style", tableStyle).attr("class", tableClass),
			$bottomLeftTable = $table,
			$bottomRightTable = $("<table>").attr("style", tableStyle).attr("class", tableClass),
			$head = $table.find("thead"),
			$colgroup = $table.find("colgroup"),
			headRowCount = $head.find("tr").length;
		this.$fixedWrapper = $tableWrapper;
		$table.addClass("fancytree-ext-fixed");
		$tableWrapper.addClass("fancytree-fixed-wrapper");
		$bottomRightTable.append($("<tbody>"));

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

		$topLeftTable.find("tr").each(function(idx) {
			var $tr = $(this);
			$tr.find("th").slice(fixedColCount).addClass("fancytree-fixed-hidden");
//			$tr.find("td").slice(fixedColCount).addClass("fancytree-fixed-hidden");
		});

		$topRightTable.find("tr").each(function(idx) {
			var $tr = $(this);
			$tr.find("th").slice(0, fixedColCount).remove();
//			$tr.find("td").slice(0, fixedColCount).remove();
		});

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

		$tableWrapper.on("click", ".fancytree-fixed-wrapper-br table tr", function(evt) {
			var $trLeft = $(this),
				$trRight = $trLeft.data("fancytree-node-counterpart"),
				node = $.ui.fancytree.getNode($trRight);
			if (!node.isActive()) {
				node.setActive(true);
			}

		}).on("mouseenter", ".fancytree-fixed-wrapper-br table tr, .fancytree-fixed-wrapper-bl table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data("fancytree-node-counterpart");
			$tr.addClass("fancytree-hover");
			$trOther.addClass("fancytree-hover");

		}).on("mouseleave", ".fancytree-fixed-wrapper-br table tr, .fancytree-fixed-wrapper-bl table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data("fancytree-node-counterpart");
			$tr.removeClass("fancytree-hover");
			$trOther.removeClass("fancytree-hover");
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
		
		function _removeChild(node) {
			var children = node.children;
			if (children) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i],
						$rightTr = $(child.tr).data("fancytree-node-counterpart");
					if ($rightTr) {
						$rightTr.remove();
					}
					_removeChild(child);
				}
			}
		}
		
		var node = ctx.node;
		_removeChild(node);
		return this._superApply(arguments);
	},
	
	nodeRemoveMarkup: function(ctx) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			$rightNode = $leftNode.data("fancytree-node-counterpart");
		if ($rightNode) {
			$rightNode.remove();
		}
		return this._superApply(arguments);
	},
	
	nodeSetActive: function(ctx, flag, callOpts) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			$rightNode = $leftNode.data("fancytree-node-counterpart");
		if ($rightNode) {
			$rightNode.toggleClass("fancytree-active", flag);
			$rightNode.toggleClass("fancytree-focused", flag);
		}
		var res = this._superApply(arguments);
		return res;
	},
	
	nodeSetFocus: function(ctx, flag) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			$rightNode = $leftNode.data("fancytree-node-counterpart");
		if ($rightNode) {
			$rightNode.toggleClass("fancytree-focused", flag);
		}
		var res = this._superApply(arguments);
		return res;
	},
	
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var res = this._superApply(arguments),
			node = ctx.node,
			isRootNode = !node.parent;
		
		if (!isRootNode) {
			var $nodeTr = $(node.tr);
			
			if (!$nodeTr.data("fancytree-node-counterpart")) {
				var idx = $nodeTr.index(),
					fixedColCount = this.options.fixed.fixCols,
					$brTableBody = $("div.fancytree-fixed-wrapper-br table tbody"),
					$prevRightNode = $brTableBody.find("tr:eq(" + Math.max(idx - 1, 0) + ")"),
					$clone = $nodeTr.clone();
				
				node.span = $clone.find("span.fancytree-node").get(0);
				$nodeTr.data("fancytree-node-counterpart", $clone);
				$clone.data("fancytree-node-counterpart", $nodeTr);
				$nodeTr.find("th").slice(fixedColCount).addClass("fancytree-fixed-hidden");
				$nodeTr.find("td").slice(fixedColCount).addClass("fancytree-fixed-hidden");
				$clone.find("th").slice(0, fixedColCount).remove();
				$clone.find("td").slice(0, fixedColCount).remove();
				
				if ($prevRightNode.length) {
					$prevRightNode.after($clone);
				} else {
					$brTableBody.append($clone);
				}
				
				$clone.show();
			}
			
		}
		
		
		return res;
	},
	
	nodeRenderTitle: function(ctx, title) {
		return this._superApply(arguments);
	},
	
	nodeRenderStatus: function(ctx) {
		var res = this._superApply(arguments),
			node = ctx.node,
			$tr = $(node.tr),
			$rightTr = $tr.data("fancytree-node-counterpart"),
			trClasses = $tr.attr("class");
		if ($rightTr) {
			var hovering = $rightTr.hasClass("fancytree-hover");
			$rightTr.attr("class", trClasses);
			if (hovering) {
				$rightTr.addClass("fancytree-hover");
				$tr.addClass("fancytree-hover");
			}
		}

		return res;
	},
	
	nodeSetExpanded: function(ctx, flag, callOpts) {
		var res,
			_this = this,
			node = ctx.node,
			$leftTr = $(node.tr),
			$rightTr = $leftTr.data("fancytree-node-counterpart");

		if (!$rightTr) {
			return this._superApply(arguments);
		}
		$rightTr.toggleClass("fancytree-expanded", !!flag);
		if (flag && !node.isExpanded()) {
			res = this._superApply(arguments);
			res.done(function() {
				node.visit(function(child) {
					var $tr = $(child.tr),
						$clone = $tr.data("fancytree-node-counterpart");
					$clone.toggleClass("fancytree-fixed-hidden", !flag).find("td, th").toggleClass("fancytree-fixed-hidden", !flag);
					_this.ext.fixed._adjustRowHeight($tr, $clone);
					if (!child.expanded) {
						return "skip";
					}
				});

				_this.ext.fixed._adjustColWidths();
				_this.ext.fixed._adjustWrapperLayout();
			});
		} else if (!flag && node.isExpanded()) {
			node.visit(function(child) {
				var $tr = $(child.tr),
					$clone = $tr.data("fancytree-node-counterpart");
				if ($clone) {
					$clone.toggleClass("fancytree-fixed-hidden", !flag).find("td, th").toggleClass("fancytree-fixed-hidden", !flag);
					_this.ext.fixed._adjustRowHeight($tr, $clone);
					if (!child.expanded) {
						return "skip";
					}
				}
			});

			_this.ext.fixed._adjustColWidths();
			_this.ext.fixed._adjustWrapperLayout();
			res = this._superApply(arguments);
		}
		return res;
	},
	
	nodeSetStatus: function(ctx, status, message, details) {
		return this._superApply(arguments);
	},
	
	treeClear: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = this.$fixedWrapper;
		$table.find("tr, td, th, thead").removeClass("fancytree-fixed-hidden").css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.append($table);
		$wrapper.find(".fancytree-fixed-wrapper-tl").remove();
		$wrapper.find(".fancytree-fixed-wrapper-tr").remove();
		$wrapper.find(".fancytree-fixed-wrapper-bl").remove();
		$wrapper.find(".fancytree-fixed-wrapper-br").remove();
		return this._superApply(arguments);
	},

	treeRegisterNode: function(ctx, add, node) {
		return this._superApply(arguments);
	},
	
	treeDestroy: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = this.$fixedWrapper;
		$table.find("tr, td, th, thead").removeClass("fancytree-fixed-hidden").css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.append($table);
		$wrapper.find(".fancytree-fixed-wrapper-tl").remove();
		$wrapper.find(".fancytree-fixed-wrapper-tr").remove();
		$wrapper.find(".fancytree-fixed-wrapper-bl").remove();
		$wrapper.find(".fancytree-fixed-wrapper-br").remove();

		return this._superApply(arguments);
	},

	_adjustColWidths: function() {
		
		function _adjust($topWrapper, $bottomWrapper) {
			var $trTop = $topWrapper.find("thead tr:not(.fancytree-fixed-hidden)").first(),
				$trBottom = $bottomWrapper.find("tbody tr:not(.fancytree-fixed-hidden)").first();
			
			$trTop.find("th:not(.fancytree-fixed-hidden)").each(function(idx) {
				var $thTop = $(this),
					$tdBottom = $trBottom.find("td:eq(" + idx + ")");
				
				$thTop.css("min-width", "auto");
				$tdBottom.css("min-width", "auto");
				
				var thTopWidth = $thTop.width(),
					thTopOuterWidth = $thTop.outerWidth(),
					tdBottomWidth = $tdBottom.width(),
					tdBottomOuterWidth = $tdBottom.outerWidth(),
					newWidth = Math.max(thTopOuterWidth, tdBottomOuterWidth);

				$thTop.css("min-width", newWidth - (thTopOuterWidth - thTopWidth));
				$tdBottom.css("min-width", newWidth - (tdBottomOuterWidth - tdBottomWidth));
			});
		}
		
		var $wrapper = this.$fixedWrapper,
			$tlWrapper = $wrapper.find("div.fancytree-fixed-wrapper-tl"),
			$blWrapper = $wrapper.find("div.fancytree-fixed-wrapper-bl"),
			$trWrapper = $wrapper.find("div.fancytree-fixed-wrapper-tr"),
			$brWrapper = $wrapper.find("div.fancytree-fixed-wrapper-br");
		
		_adjust($tlWrapper, $blWrapper);
		_adjust($trWrapper, $brWrapper);
	},
	
	_adjustRowHeight: function($row1, $row2) {
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
			$topLeftWrapper = $wrapper.find("div.fancytree-fixed-wrapper-tl"),
			$topRightWrapper = $wrapper.find("div.fancytree-fixed-wrapper-tr"),
			$bottomLeftWrapper = $wrapper.find("div.fancytree-fixed-wrapper-bl"),
			$bottomRightWrapper = $wrapper.find("div.fancytree-fixed-wrapper-br"),
			$topLeftTable = $topLeftWrapper.find("table"),
			$topRightTable = $topRightWrapper.find("table"),
			$bottomLeftTable = $bottomLeftWrapper.find("table"),
//			$bottomRightTable = $bottomRightWrapper.find("table"),
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
			$topLeftTable = $wrapper.find("div.fancytree-fixed-wrapper-tl table"),
			$topRightTable = $wrapper.find("div.fancytree-fixed-wrapper-tr table"),
			$bottomLeftTable = $wrapper.find("div.fancytree-fixed-wrapper-bl table"),
			$bottomRightTable = $wrapper.find("div.fancytree-fixed-wrapper-br table");

		$topLeftTable.find("tr").each(function(idx) {
			var $row2 = $topRightTable.find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowHeight($(this), $row2);
		});

		$bottomLeftTable.find("tbody").find("tr").each(function(idx) {
			var $row2 = $bottomRightTable.find("tbody").find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowHeight($(this), $row2);
		});

		_this.ext.fixed._adjustColWidths();
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
