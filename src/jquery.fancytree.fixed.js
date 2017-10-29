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

;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery", "./jquery.fancytree" ], factory );
	} else if ( typeof module === "object" && module.exports ) {
		// Node/CommonJS
		require("jquery.fancytree.ui-deps");
		module.exports = factory(require("jquery"));
	} else {
		// Browser globals
		factory( jQuery );
	}

}( function( $ ) {

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
			topLeft: "fancytree-ext-fixed-wrapper-tl",
			topRight: "fancytree-ext-fixed-wrapper-tr",
			bottomLeft: "fancytree-ext-fixed-wrapper-bl",
			bottomRight: "fancytree-ext-fixed-wrapper-br",
			hidden: "fancytree-ext-fixed-hidden",
			counterpart: "fancytree-ext-fixed-node-counterpart",
			scrollBorderBottom: "fancytree-ext-fixed-scroll-border-bottom",
			scrollBorderRight: "fancytree-ext-fixed-scroll-border-right",
			hover: "fancytree-ext-fixed-hover"
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
			fcn = this.options.fixed.classNames,
			$table = tree.widget.element,
			fixedColCount = options.fixCols,
			fixedRowCount = options.fixRows,
			$tableWrapper = $table.parent(),
			$topLeftWrapper = $("<div>").addClass(fcn.topLeft),
			$topRightWrapper = $("<div>").addClass(fcn.topRight),
			$bottomLeftWrapper = $("<div>").addClass(fcn.bottomLeft),
			$bottomRightWrapper = $("<div>").addClass(fcn.bottomRight),
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
		$table.addClass(fcn.table);
		$tableWrapper.addClass(fcn.wrapper);
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
			$(this).find("th").slice(fixedColCount).addClass(fcn.hidden);
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
				$trRight = $trLeft.data(fcn.counterpart),
				node = $.ui.fancytree.getNode($trRight);
			if (!node.isActive()) {
				node.setActive(true);
			}
		});

		$tableWrapper.on("mouseenter", "." + fcn.bottomRight + " table tr, ." + fcn.bottomLeft + " table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data(fcn.counterpart);
			$tr.addClass(fcn.hover);
			$trOther.addClass(fcn.hover);
		}).on("mouseleave", "." + fcn.bottomRight + " table tr, ." + fcn.bottomLeft + " table tr", function(evt) {
			var $tr = $(this),
				$trOther = $tr.data(fcn.counterpart);
			$tr.removeClass(fcn.hover);
			$trOther.removeClass(fcn.hover);
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
				.toggleClass(fcn.scrollBorderBottom, scrollTop > 0)
				.toggleClass(fcn.scrollBorderRight, scrollLeft > 0);
			$topRightWrapper
				.toggleClass(fcn.scrollBorderBottom, scrollTop > 0)
				.scrollLeft(scrollLeft);
			$bottomLeftWrapper
				.toggleClass(fcn.scrollBorderRight, scrollLeft > 0)
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
			fcn = this.options.fixed.classNames;

		function _removeChild(elem) {
			var children = elem.children;
			if (children) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i],
						$rightTr = $(child.tr).data(fcn.counterpart);
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
			fcn = this.options.fixed.classNames,
			$rightNode = $leftNode.data(fcn.counterpart);

		if ($rightNode) {
			$rightNode.remove();
		}
		return this._superApply(arguments);
	},

	nodeSetActive: function(ctx, flag, callOpts) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			fcn = this.options.fixed.classNames,
			cn = this.options._classNames,
			$rightNode = $leftNode.data(fcn.counterpart);

		if ($rightNode) {
			$rightNode.toggleClass(cn.active, flag);
			$rightNode.toggleClass(cn.focused, flag);
		}
		var res = this._superApply(arguments);
		return res;
	},

	nodeSetFocus: function(ctx, flag) {
		var node = ctx.node,
			$leftNode = $(node.tr),
			fcn = this.options.fixed.classNames,
			cn = this.options._classNames,
			$rightNode = $leftNode.data(fcn.counterpart);

		if ($rightNode) {
			$rightNode.toggleClass(cn.focused, flag);
		}
		var res = this._superApply(arguments);
		return res;
	},

	nodeRender: function(ctx, force, deep, collapsed, _recursive) {
		var res = this._superApply(arguments),
			node = ctx.node,
			isRootNode = !node.parent,
			fcn = this.options.fixed.classNames;

		if (!isRootNode) {
			var $nodeTr = $(node.tr),
				$trRight = $nodeTr.data(fcn.counterpart),
				fixedColCount = this.options.fixed.fixCols,
				$clone = $nodeTr.clone();

			if (!$trRight) {
				var idx = $nodeTr.index(),
					$brTableBody = $("div." + fcn.bottomRight + " table tbody"),
					$prevRightNode = $brTableBody.find("tr:eq(" + Math.max(idx - 1, 0) + ")");

				if ($prevRightNode.length) {
					$prevRightNode.after($clone);
				} else {
					$brTableBody.append($clone);
				}

				$clone.show();
			} else {
				$trRight.replaceWith($clone);
				$clone.find("td").removeClass(fcn.hidden);
			}

			$nodeTr.find("td").slice(fixedColCount).addClass(fcn.hidden);
			$clone.find("td").slice(0, fixedColCount).remove();
			$nodeTr.data(fcn.counterpart, $clone);
			$clone.data(fcn.counterpart, $nodeTr);
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
			fcn = this.options.fixed.classNames,
			$rightTr = $tr.data(fcn.counterpart),
			trClasses = $tr.attr("class");
		if ($rightTr) {
			var hovering = $rightTr.hasClass(fcn.hover);
			$rightTr.attr("class", trClasses);
			if (hovering) {
				$rightTr.addClass(fcn.hover);
				$tr.addClass(fcn.hover);
			}
		}

		return res;
	},

	nodeSetExpanded: function(ctx, flag, callOpts) {
		var res,
			_this = this,
			node = ctx.node,
			$leftTr = $(node.tr),
			fcn = this.options.fixed.classNames,
			cn = this.options._classNames,
			$rightTr = $leftTr.data(fcn.counterpart);

		if (!$rightTr) {
			return this._superApply(arguments);
		}
		$rightTr.toggleClass(cn.expanded, !!flag);
		if (flag && !node.isExpanded()) {
			res = this._superApply(arguments);
			res.done(function() {
				node.visit(function(child) {
					var $tr = $(child.tr),
						$clone = $tr.data(fcn.counterpart);
					$clone.toggleClass(fcn.hidden, !flag).find("td, th").toggleClass(fcn.hidden, !flag);
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
					$clone = $tr.data(fcn.counterpart);
				if ($clone) {
					$clone.toggleClass(fcn.hidden, !flag).find("td, th").toggleClass(fcn.hidden, !flag);
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
			fcn = this.options.fixed.classNames;

		$table.find("tr, td, th, thead").removeClass(fcn.hidden).css({
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
			fcn = this.options.fixed.classNames;

		$table.find("tr, td, th, thead").removeClass(fcn.hidden).css({
			"min-width": "auto",
			"height": "auto"
		});
		$wrapper.empty().append($table);
		return this._superApply(arguments);
	},

	_adjustColWidths: function() {
		var $wrapper = this.$fixedWrapper,
			fcn = this.options.fixed.classNames,
			$tlWrapper = $wrapper.find("div." + fcn.topLeft),
			$blWrapper = $wrapper.find("div." + fcn.bottomLeft),
			$trWrapper = $wrapper.find("div." + fcn.topRight),
			$brWrapper = $wrapper.find("div." + fcn.bottomRight);

		function _adjust($topWrapper, $bottomWrapper) {
			var $trTop = $topWrapper.find("thead tr:not(." + fcn.hidden + ")").first(),
				$trBottom = $bottomWrapper.find("tbody tr:not(." + fcn.hidden + ")").first();

			$trTop.find("th:not(." + fcn.hidden + ")").each(function(idx) {
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
		var fcn = this.options.fixed.classNames;

		if (!$row2) {
			$row2 = $row1.data(fcn.counterpart);
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
			fcn = this.options.fixed.classNames,
			$topLeftWrapper = $wrapper.find("div." + fcn.topLeft),
			$topRightWrapper = $wrapper.find("div." + fcn.topRight),
			$bottomLeftWrapper = $wrapper.find("div." + fcn.bottomLeft),
			$bottomRightWrapper = $wrapper.find("div." + fcn.bottomRight),
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
			fcn = this.options.fixed.classNames,
			$topLeftTable = $wrapper.find("div." + fcn.topLeft + " table"),
			$topRightTable = $wrapper.find("div." + fcn.topRight + " table"),
			$bottomLeftTable = $wrapper.find("div." + fcn.bottomLeft + " table"),
			$bottomRightTable = $wrapper.find("div." + fcn.bottomRight + " table");

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
// Value returned by `require('jquery.fancytree..')`
return $.ui.fancytree;
}));  // End of closure
