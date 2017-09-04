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
		fixRows: true,
		scrollSpeed: 50,
		classNames: {
			table: "fancytree-ext-fixed",
			wrapper: "fancytree-ext-fixed-wrapper",
			topLeft: "fancytree-fixed-wrapper-tl",
			topRight: "fancytree-fixed-wrapper-tr",
			bottomLeft: "fancytree-fixed-wrapper-bl",
			bottomRight: "fancytree-fixed-wrapper-br",
			hidden: "fancytree-fixed-hidden",
			counterpart: "fancytree-node-counterpart",
			scrollBorderBottom: "scrollBorderBottom",
			scrollBorderRight: "scrollBorderRight"
		}
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
			cn = this.options.fixed.classNames,
			$table = tree.widget.element,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			$tableWrapper = $table.parent(),
			$topLeftWrapper = $("<div>").addClass(cn.topLeft),
			$topRightWrapper = $("<div>").addClass(cn.topRight),
			$bottomLeftWrapper = $("<div>").addClass(cn.bottomLeft),
			$bottomRightWrapper = $("<div>").addClass(cn.bottomRight),
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
		$table.addClass(cn.table);
		$tableWrapper.addClass(cn.wrapper);
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
			$(this).find("th").slice(fixedColCount).addClass(cn.hidden);
		});

		$topRightTable.find("tr").each(function(idx) {
			$(this).find("th").slice(0, fixedColCount).remove();
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
		
		$bottomRightTable.on("click", "tr", function(evt) {
			var $trLeft = $(this),
				$trRight = $trLeft.data(cn.counterpart),
				node = $.ui.fancytree.getNode($trRight);
			if (!node.isActive()) {
				node.setActive(true);
			}
		});
		
		$tableWrapper.on("mouseenter", "." + cn.bottomRight + " table tr, ." + cn.bottomLeft + " table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data(cn.counterpart);
			$tr.addClass("fancytree-hover");
			$trOther.addClass("fancytree-hover");
		}).on("mouseleave", "." + cn.bottomRight + " table tr, ." + cn.bottomLeft + " table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data(cn.counterpart);
			$tr.removeClass("fancytree-hover");
			$trOther.removeClass("fancytree-hover");
		});

		$bottomLeftWrapper.on("mousewheel DOMMouseScroll", function(event) {
			var $this = $(this),
				newScroll = $this.scrollTop(),
				scrollUp = event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0;
			
			newScroll += scrollUp ? -options.scrollSpeed : options.scrollSpeed;
			$this.scrollTop(newScroll);
			$bottomRightWrapper.scrollTop(newScroll);
			event.preventDefault();
		});

		$bottomRightWrapper.scroll(function() {
			var $this = $(this),
				scrollLeft = $this.scrollLeft(),
				scrollTop = $this.scrollTop();

			$topLeftWrapper
				.toggleClass(cn.scrollBorderBottom, scrollTop > 0)
				.toggleClass(cn.scrollBorderRight, scrollLeft > 0);
			$topRightWrapper
				.toggleClass(cn.scrollBorderBottom, scrollTop > 0)
				.scrollLeft(scrollLeft);
			$bottomLeftWrapper
				.toggleClass(cn.scrollBorderRight, scrollLeft > 0)
				.scrollTop(scrollTop);
		});

		return res;
	},
	
	treeLoad: function(ctx) {
		var _this = this,
			res = this._superApply(arguments);

		res.done(function() {
			_this.ext.fixed._adjustLayout.call(_this);
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
		var node = ctx.node,
			cn = this.options.fixed.classNames;
		
		function _removeChild(elem) {
			var children = elem.children;
			if (children) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i],
						$rightTr = $(child.tr).data(cn.counterpart);
					if ($rightTr) {
						$rightTr.remove();
					}
					_removeChild(child);
				}
			}
		}
		
		_removeChild(node);
		return this._superApply(arguments);
	},
	
	nodeRemoveMarkup: function(ctx) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			cn = this.options.fixed.classNames,
			$rightNode = $leftNode.data(cn.counterpart);
		if ($rightNode) {
			$rightNode.remove();
		}
		return this._superApply(arguments);
	},
	
	nodeSetActive: function(ctx, flag, callOpts) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			cn = this.options.fixed.classNames,
			$rightNode = $leftNode.data(cn.counterpart);
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
			cn = this.options.fixed.classNames,
			$rightNode = $leftNode.data(cn.counterpart);
		if ($rightNode) {
			$rightNode.toggleClass("fancytree-focused", flag);
		}
		var res = this._superApply(arguments);
		return res;
	},
	
	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var res = this._superApply(arguments),
			node = ctx.node,
			isRootNode = !node.parent,
			cn = this.options.fixed.classNames;
		
		if (!isRootNode) {
			var $nodeTr = $(node.tr),
				$trRight = $nodeTr.data(cn.counterpart), 
				fixedColCount = this.options.fixed.fixCols,
				$clone = $nodeTr.clone();
			
			if (!$trRight) {
				var idx = $nodeTr.index(),
					$brTableBody = $("div." + cn.bottomRight + " table tbody"),
					$prevRightNode = $brTableBody.find("tr:eq(" + Math.max(idx - 1, 0) + ")");
				
				if ($prevRightNode.length) {
					$prevRightNode.after($clone);
				} else {
					$brTableBody.append($clone);
				}
				
				$clone.show();
			} else {
				$trRight.replaceWith($clone);
				$clone.find("td").removeClass(cn.hidden);
			}
			
			$nodeTr.find("td").slice(fixedColCount).addClass(cn.hidden);
			$clone.find("td").slice(0, fixedColCount).remove();
			$nodeTr.data(cn.counterpart, $clone);
			$clone.data(cn.counterpart, $nodeTr);
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
			cn = this.options.fixed.classNames,
			$rightTr = $tr.data(cn.counterpart),
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
			cn = this.options.fixed.classNames,
			$rightTr = $leftTr.data(cn.counterpart);

		if (!$rightTr) {
			return this._superApply(arguments);
		}
		$rightTr.toggleClass("fancytree-expanded", !!flag);
		if (flag && !node.isExpanded()) {
			res = this._superApply(arguments);
			res.done(function() {
				node.visit(function(child) {
					var $tr = $(child.tr),
						$clone = $tr.data(cn.counterpart);
					$clone.toggleClass(cn.hidden, !flag).find("td, th").toggleClass(cn.hidden, !flag);
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
					$clone = $tr.data(cn.counterpart);
				if ($clone) {
					$clone.toggleClass(cn.hidden, !flag).find("td, th").toggleClass(cn.hidden, !flag);
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
			$wrapper = this.$fixedWrapper,
			cn = this.options.fixed.classNames;
		
		$table.find("tr, td, th, thead").removeClass(cn.hidden).css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.empty().append($table);
		return this._superApply(arguments);
	},

	treeRegisterNode: function(ctx, add, node) {
		return this._superApply(arguments);
	},
	
	treeDestroy: function(ctx) {
		var tree = ctx.tree,
			$table = tree.widget.element,
			$wrapper = this.$fixedWrapper,
			cn = this.options.fixed.classNames;
		
		$table.find("tr, td, th, thead").removeClass(cn.hidden).css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.empty().append($table);
		return this._superApply(arguments);
	},

	_adjustColWidths: function() {
		var $wrapper = this.$fixedWrapper,
			cn = this.options.fixed.classNames,
			$tlWrapper = $wrapper.find("div." + cn.topLeft),
			$blWrapper = $wrapper.find("div." + cn.bottomLeft),
			$trWrapper = $wrapper.find("div." + cn.topRight),
			$brWrapper = $wrapper.find("div." + cn.bottomRight);
		
		function _adjust($topWrapper, $bottomWrapper) {
			var $trTop = $topWrapper.find("thead tr:not(." + cn.hidden + ")").first(),
				$trBottom = $bottomWrapper.find("tbody tr:not(." + cn.hidden + ")").first();
			
			$trTop.find("th:not(." + cn.hidden + ")").each(function(idx) {
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
		
		_adjust($tlWrapper, $blWrapper);
		_adjust($trWrapper, $brWrapper);
	},
	
	_adjustRowHeight: function($row1, $row2) {
		var cn = this.options.fixed.classNames;
		
		if (!$row2) {
			$row2 = $row1.data(cn.counterpart);
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
			cn = this.options.fixed.classNames,
			$topLeftWrapper = $wrapper.find("div." + cn.topLeft),
			$topRightWrapper = $wrapper.find("div." + cn.topRight),
			$bottomLeftWrapper = $wrapper.find("div." + cn.bottomLeft),
			$bottomRightWrapper = $wrapper.find("div." + cn.bottomRight),
			$topLeftTable = $topLeftWrapper.find("table"),
			$topRightTable = $topRightWrapper.find("table"),
			$bottomLeftTable = $bottomLeftWrapper.find("table"),
			wrapperWidth = $wrapper.width(),
			wrapperHeight = $wrapper.height(),
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
			cn = this.options.fixed.classNames,
			$topLeftTable = $wrapper.find("div." + cn.topLeft + " table"),
			$topRightTable = $wrapper.find("div." + cn.topRight + " table"),
			$bottomLeftTable = $wrapper.find("div." + cn.bottomLeft + " table"),
			$bottomRightTable = $wrapper.find("div." + cn.bottomRight + " table");
		
		$topLeftTable.find("tr").each(function(idx) {
			var $row2 = $topRightTable.find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowHeight($(this), $row2);
		});

		$bottomLeftTable.find("tbody").find("tr").each(function(idx) {
			var $row2 = $bottomRightTable.find("tbody").find("tr:eq(" + idx + ")");
			_this.ext.fixed._adjustRowHeight($(this), $row2);
		});

		_this.ext.fixed._adjustColWidths.call(this);
		_this.ext.fixed._adjustWrapperLayout.call(this);
	}


	/*,
	treeSetFocus: function(ctx, flag) {
//			alert("treeSetFocus" + ctx.tree.$container);
		ctx.tree.$container.focus();
		$.ui.fancytree.focusTree = ctx.tree;
	}*/
});
}(jQuery, window, document));
