/*******************************************************************************
 * jquery.contextmenu.js plugin.
 *
 * jQuery plugin that provides a context menu (based on the jQueryUI menu widget).
 *
 * @see https://github.com/mar10/jquery-contextmenu
 *
 * Copyright (c) 2013, Martin Wendt (http://wwWendt.de). Licensed MIT.
 */

(function ($) {
//	function getMenuFromEvent(event){
//		var menu = $(event.target).closest(":ui-menu"),
//		$menu = $(menu);
//		return $menu.data("ui-menu") || $menu.data("menu");
//	}
/*
	var startTime, endTime;
	var gbMove = false;

	window.addEventListener('touchstart',function(event) {
		startTime = new Date().getTime();
		gbMove = false;
		alert('tap hold s event');
	}, false);

	window.addEventListener('touchmove',function(event) {
	  gbMove = true;
	}, false);

	window.addEventListener('touchend',function(event) {
		endTime = new Date().getTime();
		if(!gbMove && (endTime-startTime)/1000 > 2){
			alert('tap hold event');
		}
	}, false);
*/
	$.widget("ui.contextmenu", {
		version: "0.1.0",
		options: {
			delegate: "[data-menu]",  // selector
			ignoreParentSelect: true, // Don't trigger 'select' for sub-menu parents
			menu: null,      // selector or jQuery or a function returning such
			taphold: 800, // open menu after 2000 ms long touch
			// Events:
			beforeOpen: $.noop, // menu about to open; return `false` to prevent opening
			blur: $.noop,       // menu option lost focus
			close: $.noop,      // menu was closed
			create: $.noop,     // menu was initialized
			focus: $.noop,      // menu option got focus
			init: $.noop,       // ui-contextmenu was initialized
			open: $.noop,       // menu was opened
			select: $.noop      // menu option was selected; return `false` to prevent closing
		},
		_create: function () {
//			var self = this;
			this.element.delegate(this.options.delegate, "contextmenu.contextmenu", $.proxy(this._openMenu, this));
			// emulate a 'taphold' event
/*
			var tapStartHandler = function(event){
				console.log("Event ", event.type, this.tapTimer);
				tapClearHandler(event);
				this.tapTimer = setTimeout(function(){
					console.log("Timeout ", event.type, this.tapTimer, event.target);
					alert("Timeout " + event.type + this.tapTimer + " " + $(event.target).text());
					this.open.call(this, $(event.target));
					this.tapTimer = null;
				}, this.options.taphold);
				console.log("Event started ", event.type, this.tapTimer);
			};
			var tapClearHandler = function(event){
				if(this.tapTimer){
					console.log("clear " + this.tapTimer);
					clearTimeout(this.tapTimer);
					this.tapTimer = null;
				}
			};
			var tapEndHandler = function(event){
				if(this.tapTimer){
					tapClearHandler(event);
					return false;
				}
			};
			this.element
				.delegate(this.options.delegate, "touchstart.contextmenu", $.proxy(tapStartHandler, this))
				.delegate(this.options.delegate, "touchend.contextmenu", $.proxy(tapEndHandler, this))
				.delegate(this.options.delegate, "touchmove.contextmenu", $.proxy(tapClearHandler, this));
*/
//			this.element.delegate(this.options.delegate, "touchstart.contextmenu", $.proxy(function(event, ui){
//				var self = this;
//				console.log("Event ", event.type, this.tapTimer);
//				if(this.tapTimer){
//					console.log(" clear " + this.tapTimer);
//					clearTimeout(this.tapTimer);
//					this.tapTimer = null;
//				}
//				this.tapTimer = setTimeout(function(){
//					console.log("Timeout ", event.type, self.tapTimer);
//					self.open.call(self, $(event.target));
//					self.tapTimer = null;
//				}, this.options.taphold);
//				console.log("Event started ", event.type, this.tapTimer);
//			}, this));
//			this.element.delegate(this.options.delegate, "touchend.contextmenu", $.proxy(function(){
//				if(this.tapTimer){
//					console.log("Event ", event.type, "clear" + this.tapTimer);
//					clearTimeout(this.tapTimer);
//					this.tapTimer = null;
//				}
//			}, this));
			this._trigger("init");
		},
		/** Return ui-menu root element as jQuery object. */
		_getMenu: function(){
			// this.options.menu may be a string, jQuery or a function returning that.
			var $menu = this.options.menu;
			if( $.isFunction($menu) ){
				$menu = $menu();
			}
			return (typeof $menu === "string") ? $($menu) : $menu;
		},
		/** Return ui-menu widget instance (works on pre and post jQueryUI 1.9). */
		_getMenuWidget: function(){
			var $menu = this._getMenu();
			return $menu.data("ui-menu") || $menu.data("menu");
		},
		/** Open dropdown. */
		_openMenu: function(event){
			var self = this,
				$menu = this._getMenu(),
				openEvent = event,
				// if called by 'open' method, 'relatedTarget' is the requested target object
				parentTarget = openEvent.target ? openEvent.target : openEvent;
			// Prevent browser from opening the system context menu
			event.preventDefault();
			// Also pass the target that the menu was triggered on as 'relatedTarget'.
			// This is required because our _trigger() calls will create events
			// that refer to the contextmenu's context (which is the target *container*)
			event.relatedTarget = openEvent.target;

			if( this._trigger("beforeOpen", event) === false ){
				return false;
			}
			// Create - but hide - context-menu
			$menu
				.hide()
				.addClass("ui-contextmenu")
				// Create a menu instance that delegates events to our widget
				.menu({
					blur: $.proxy(this.options.blur, this),
					create: $.proxy(this.options.create, this),
					focus: $.proxy(this.options.focus, this),
					select: function(event, ui){
						// Also pass the target that the menu was triggered on:
						event.relatedTarget = openEvent.target;
						// ignore clicks, if they only open a sub-menu
						var isParent = (ui.item.has(">a[aria-haspopup='true']").length > 0);
						if( !isParent || !self.options.ignoreParentSelect){
							if( self._trigger.call(self, "select", event, ui) !== false ){
								self._closeMenu.call(self);
							}
							event.preventDefault();
						}
					}
				});
			// Register global event handlers that close the dropdown-menu
			$(document).bind("keydown.contextmenu", function(event){
				if( event.which === $.ui.keyCode.ESCAPE ){
					self._closeMenu();
				}
			}).bind("mousedown.contextmenu touchstart.contextmenu", function(event){
				// Close menu when clicked outside menu
				if( !$(event.target).closest(".ui-menu-item").length ){
					self._closeMenu();
				}
			});
			$menu
				.show() // required to fix positioning error (issue #3)
				.css({
					position: "absolute",
					left: 0,
					top: 0
				}).position({
					my: "left top",
					at: "left bottom",
					of: parentTarget,
					collision: "fit"
				}).hide()
				.slideDown("fast", function(){
					self._trigger.call(self, "open", event);
				});
		},
		/** Close dropdown. */
		_closeMenu: function(){
			var self = this,
				$menu = this._getMenu();
			if(this.tapTimer){
				clearTimeout(this.tapTimer);
				this.tapTimer = null;
			}
			$menu.fadeOut(function() {
				self._trigger("close");
			});
		},
		/**
		 * Handle $().contextmenu("option", ...) calls.
		 */
		_setOption: function(key, value){
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		/**
		 * Open context menu on a specific target (must match options.delegate)
		 */
		open: function(target){
			var e = jQuery.Event("contextmenu", {target: target.get(0)});
			return this.element.trigger(e);
		},
		/**
		 * Close context menu.
		 */
		close: function(){
			return this._closeMenu.call(this);
		}
	});
} (jQuery));
