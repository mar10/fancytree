/*************************************************************************
	jquery.dynatree.js
	Dynamic tree view control, with support for lazy loading of branches.

	Copyright (c) 2008-2012, Martin Wendt (http://wwWendt.de)
	Dual licensed under the MIT or GPL Version 2 licenses.
	http://code.google.com/p/dynatree/wiki/LicenseInfo

	A current version and some documentation is available at
		http://dynatree.googlecode.com/

TODO: 
- .vesion = 1.3.0
- use $.extend(true, ...)
- this.element = $this
- $("#tree").data("dynatree") = ..
- Alle trees: $(":ui-dynatree")
- Call funcs: 
  $("#tree").dynatree("getRootNode")
  $("#tree").data("dynatree").getRootNode()

- A mechanism for dispatching callbacks the plugin user can subscribe to: this._trigger( "clear" )
  The user can subscribe via an option:
    $( "#something" ).multi({ clear: function( event ) {} }); 
  Or using .bind()
    $( "#something" ).bind( "multiclear", function( event ) {} );

- A mechanism for facilitating and responding to changes to plugin options after instantiation
  $( "#something" ).multi( "option", "clear" , function ( event ) { alert( "I cleared the multiselect!" ); } );

- use this.element.delegate("click", ...)
  use this.$div.click($.proxy(this, "handleClick"));
  .delegate( "li.multi-option-item", "click", $.proxy( this._itemClick, this ) );

- this.options
  this.name, this.namespace
  this.widgetEventPrefix

- use this.element.css({background: greenlevels[level]});

- var callback = this.options.change;
  if ($.isFunction(callback)) callback(level);


	$Version:$
	$Revision:$

	@depends: jquery.js
	@depends: jquery.ui.widget.js
	@depends: jquery.ui.core.js
	@depends: jquery.cookie.js
*************************************************************************/

/*jslint laxbreak: true, browser: true, indent: 0, white: false, onevar: false */

"use strict";

// Start of local namespace
(function($) {
// prevent duplicate loading
if ( $.ui.dynatree && $.ui.dynatree.version ) {
    $.ui.dynatree.warn("Dynatree: duplicate include");
    return;
}

/*******************************************************************************
 * Private functions and variables
 */

/** Return a wrapper fun*/
function _makeProxy(fn, _super){
    return function(){
        var tmp = _super, that = this, res;
        try{
            that._super = _super;
            res = fn.apply(that, arguments);
        }finally{
            that._super = tmp;
        }
        return res;
    }
}


// Boolean attributes that can be set with equivalent class names in the LI tags
var CLASS_ATTRS = ["active", "expand", "focus", "folder", "lazy", "nolink", "select"];

/** Parse tree data from HTML <ul> markup */
function _loadFromHtml($ul, children) {
    var that = this,
        $children = $ul.find(">li"),
        iPos, tmp;

    $children.each(function() {
        var $li = $(this),
            $liSpan = $li.find(">span:first", this),
            $liA = $liSpan.length ? null : $li.find(">a:first"),
            d = {href: null, target: null, tooltip: null};

        if( $liSpan.length ) {
            d.title = $liSpan.html();

        } else if( $liA && $liA.length ) {
            // If a <li><a> tag is specified, use it literally and extract href/target.
            d.title = $liA.html();
            d.href = $liA.attr("href");
            d.target = $liA.attr("target");
            d.tooltip = $liA.attr("title");

        } else {
            // If only a <li> tag is specified, use the trimmed string up to
            // the next child <ul> tag.
            d.title = $li.html();
            iPos = d.title.search(/<ul/i);
            if( iPos >= 0 ){
                d.title = d.title.substring(0, iPos);
            }
        }
        d.title = $.trim(d.title);

        /* better: 
            for name in classes:
                if n in attrs:
                    d[name] = true
                else:
                    extraClasses.append(name)
         */
//        tmp = $li.attr("class").split(" ");
        $.each(CLASS_ATTRS, function(i, name){
           d[name] = $li.hasClass(name);
        });
        // Parse node options from ID, title and class attributes
        tmp = $li.attr("title");
        if( tmp ){
            d.tooltip = tmp; // overrides <a title='...'>
        }
        tmp = $li.attr("id");
        if( tmp ){
            d.key = tmp;
        }
        // If a data attribute is present, evaluate as a JavaScript object
        // if( $li.attr("data") ) {
        //     var dataAttr = $.trim($li.attr("data"));
        //     if( dataAttr ) {
        //         if( dataAttr.charAt(0) != "{" ){
        //             dataAttr = "{" + dataAttr + "}";
        //         }
        //         try {
        //             $.extend(data, eval("(" + dataAttr + ")"));
        //         } catch(e) {
        //             throw ("Error parsing node data: " + e + "\ndata:\n'" + dataAttr + "'");
        //         }
        //     }
        // }
//        that.debug("parse ", d);
//        var childNode = parentTreeNode.addChild(data);
        // Recursive reading of child nodes, if LI tag contains an UL tag
        $ul = $li.find(">ul:first");
        if( $ul.length ) {
            d.children = [];
            _loadFromHtml.call(that, $ul, d.children); // must use 'that', because 'this' is the each() context
        }else{
            d.children = d.lazy ? undefined : null;
        }
        children.push(d);
    });
}

/*******************************************************************************
 * DynatreeNode
 */

// Top-level Dynatree node attributes, that can be set by dict
var NODE_ATTRS = ["active", "extraClasses", "expand", "focus", "folder", "key", "lazy", "nolink", "select", "title"];

var DynatreeNode = function(parent, data){
    var i, l, name, cl;
    this.parent = parent;
    this.tree = parent.tree;
    this.element = null;

    // copy attributes from data object
    for(i=0, l=NODE_ATTRS.length; i<l; i++){
        name = NODE_ATTRS[i];
        this[name] = data[name];
    }
    // fix missing key
    if(!this.key){
        this.key = "id_" + DT._nextNodeKey++;
    }
    // Create child nodes
    cl = data.children && data.children.length;
    if(cl){
        this.children = [];
        for(i=0; i<cl; i++){
            this.children.push(new DynatreeNode(this, data.children[i]));
        }
    }else{
        this.children = null;
    }
};

$.extend(DynatreeNode.prototype, {
    // fromDict: function(data) {
    // },
    toString: function() {
        return "DynatreeNode<" + this.title + ">"
    }
});


/*******************************************************************************
 * Dynatree
 */

var Dynatree = function($widget){
    this.$widget = $widget;
    this.fromDict({children: null});
    // var fakeParent = { tree: this };
    // this.root = new DynatreeNode(fakeParent, {title: "root", key: "root_" + $widget._id});
    // this.root.parent = null;
};

$.extend(Dynatree.prototype, {
    /**  */
    fromDict: function(data) {
        // Create a node without parent.
        var fakeParent = { tree: this };
        this.root = new DynatreeNode(fakeParent, {
            title: "root", 
            key: "root_" + this.$widget._id,
            children: data.children
        });
        this.root.parent = null;
        // Set tree title from node data
        this.title = data.title;
    },
    toString: function() {
        return "Dynatree<" + this.$widget._id + ">"
//        return this.$widget.toString();
    }
});


/*******************************************************************************
 * jQuery UI widget boilerplate
 */

$.widget("ui.dynatree", {
    // These options will be used as defaults
    options: { 
        disabled: false,
        source: null,
        extensions: [],
        // callbacks
        lazyload: null
    },
    // Set up the widget, Called on first $().dynatree()
    _create: function() {
        this._id = $.ui.dynatree._nextId++;
        this.tree = new Dynatree(this);
        this._bind();
        this.source = this.source 
            || this.element.data("type") == "json" ? this.element 
            : this.element.find(">ul:first");
//        this.debug("created", this, this.element);
        this._triggerTreeEvent("create");
    },

    // TODO: sill correct? Called on every $().dynatree() 
    _init: function() {
        this.load();
        this._triggerTreeEvent("init");
    },

    // Use the _setOption method to respond to changes to options
    _setOption: function(key, value) {
        var callDefault = true;
        switch( key ) {
            case "disabled":
            // handle enable/disable
            break;
            case "keyboard":
            // 
            break;
        }
        if(callDefault){
            // In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget
            $.Widget.prototype._setOption.apply( this, arguments );
            // TODO: In jQuery UI 1.9 and above, you use the _super method instead
//          this._super( "_setOption", key, value );
        }
    },

    // Use the destroy method to clean up any modifications your widget has made to the DOM
    destroy: function() {
        this._unbind();
        this.element.removeClass("ui-widget ui-widget-content ui-corner-all");
        this.$source && this.$source.removeClass("ui-helper-hidden");
        // In jQuery UI 1.8, you must invoke the destroy method from the base widget
        $.Widget.prototype.destroy.call( this );
        // TODO: In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
    },

    // -------------------------------------------------------------------------
    
    /** Add mouse and kyboard handlers to the container */
    _bind: function() {
        var that = this,
            eventNames = $.map(["click", "dblclick", "keypress", "keydown", 
                "focusin", "focusout", "focus", "blur", "mousein", "mouseout"], 
                function(name){
                return name + "." + that.widgetName + "-" + that._id;
            }).join(" ");

        this._unbind();
        this.element.bind(eventNames, function(event){
            var node = $.ui.dynatree.getNode(event.target);
            if( !node ){
//                return true;  // Allow bubbling of other events
            }
            var data = tree = that.tree;
            var o = that.options;
            that.debug("event(%s): node: %s", event.type, node);
            var prevPhase = tree.phase;
            tree.phase = "userEvent";
            try {
                switch(event.type) {
                case "click":
                    return ( that._triggerNodeEvent(node, "click", event) === false ) ? false : node._onClick(event);
                case "dblclick":
                    return ( that._triggerNodeEvent(node, "dblclick", event) === false ) ? false : node._onDblClick(event);
                case "keydown":
                    return ( that._triggerNodeEvent(node, "keydown", event) === false ) ? false : node._onKeydown(event);
                case "keypress":
                    return ( that._triggerNodeEvent(node, "keypress", event) === false ) ? false : node._onKeypress(event);
                case "focusin":
                case "focusout":
                    return node._onFocus(event);
                }
            } catch(e) {
//                var _ = null; // issue 117 // TODO
                $.error(e);
            } finally {
                tree.phase = prevPhase;
            }
        });
    },
    /** Return Dynatree instance. */
    getTree: function() {
        return this.tree;
    },
    /** Parse Dynatree from HTML <ul> markup */
    load: function() {
        var data = { children: [] },
            type = this.element.data("type") || "html",
            $ul;
        switch(type){
        case "html":
            $ul = this.element.find(">ul:first");
            _loadFromHtml.call(this, $ul, data.children);
//          $ul.addClass("ui-helper-hidden");
          break;
        case "json":
            data = $.parseJSON(this.element.text());
            break;
        default:
            $.error("Invalid data-type: " + type);
        }
        this.element.addClass("ui-widget ui-widget-content ui-corner-all");
//        this.debug(data);
        this.tree.fromDict(data);
//        this.debug("tree", this.tree);
        return this._triggerTreeEvent("load");
    },
    /** _trigger a widget event with additional node data. */
    _triggerNodeEvent: function(node, type, orgEvent) {
        var data = { node: node, tree: node.tree, widget: this };
        this.debug("_trigger", type, node, data);
        return this._trigger(type, orgEvent, data);
    },
    /** _trigger a widget event with additional tree data. */
    _triggerTreeEvent: function(type, orgEvent) {
        var data = { tree: this.tree, widget: this };
        this.debug("_trigger", type, data);
        return this._trigger(type, orgEvent, data);
    },
    /** Remove all event handlers for our namespace */
    _unbind: function() {
        this.element.unbind("." + this.widgetName + "-" + this._id);
    }
});

// $.ui.dynatree was created by widget factory. Create a local shortcut:
var DT = $.ui.dynatree;

/*******************************************************************************
 * Static members in the jQuery.ui.dynatree namespace
 */

$.extend($.ui.dynatree, {
    version: "2.0.0pre",
    debugLevel: 2,
    _nextId: 1,
    _nextNodeKey: 1,
    _extensions: {},

    debug: function(msg){
        ($.ui.dynatree.debugLevel >= 2) && window.console && window.console.log && window.console.log.apply(window.console, arguments);        
    },
    error: function(msg){
        window.console && window.console.error && window.console.error.apply(window.console, arguments);
    },
    /** Return a DynatreeNode instance from element. */
    getNode: function(el){
        if(el instanceof DynatreeNode){
            return el; // el already was a DynatreeNode
        }
        if(el.selector !== undefined){
            el = el[0]; // el was a jQuery object: use the DOM element
        }
        // $el.parents("[dtnode]") does not work (jQuery 1.6.1), maybe because
        // dtnode is a property, not an attribute. This is faster anyway:
        while( el ) {
            if(el.dtnode) {
                return el.dtnode;
            }
            el = el.parentNode;
        }
        return null;
    },
    info: function(msg){
        ($.ui.dynatree.debugLevel >= 1) && window.console && window.console.info && window.console.info.apply(window.console, arguments);
    },
    warn: function(msg){
        window.console && window.console.warn && window.console.warn.apply(window.console, arguments);
    }
});


/*******************************************************************************
 * Dynatree class instance members
 */

$.extend($.ui.dynatree.prototype, {
    _id: null,
    tree: null,
    /**
     * Override dynatree methods and properties
     */
    addExtension: function(ext, global){
        var proto = !!global ? $.ui.dynatree.prototype : this;
        for(var name in ext){
            if($.isFunction(ext[name]) && proto[name]){
                // overriding base method: create a proxy that supports `this._super()`
                proto[name] = _makeProxy(ext[name], proto[name]);
            }else{
                proto[name] = ext[name];
            }
        }
    },
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        $.ui.dynatree.debug.apply(this, arguments);
    },
    foo: function(msg){
        Array.prototype.unshift.call(arguments, "base.foo");
        this.debug.apply(this, arguments);
    },
    info: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        $.ui.dynatree.info.apply(this, arguments);
    },
    toString: function(){
        return "Dynatree<" + this._id + ">"
    },
    warn: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        $.ui.dynatree.warn.apply(this, arguments);
    }
});

})(jQuery);


/*******************************************************************************
 * Dynatree extension: logger
 */
(function($) {
	$.extend( $.ui.dynatree.prototype, {
         test_destroy: function() {
            this.debug("hurz");
         }
     });
})(jQuery);
