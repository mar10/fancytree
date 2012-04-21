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

// Start of local namespace
(function($) {
/*globals alert */

"use strict";

// prevent duplicate loading
if ( $.ui.dynatree && $.ui.dynatree.version ) {
    $.ui.dynatree.warn("Dynatree: duplicate include");
    return;
}

/*******************************************************************************
 * Private functions and variables
 */

/** Return a wrapper function that exposes a this._super().*/
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
    };
}


// Boolean attributes that can be set with equivalent class names in the LI tags
var CLASS_ATTRS = ["active", "expanded", "focus", "folder", "lazy", "nolink", "selected"],
    CLASS_ATTR_MAP = {};
for(var i=0; i<CLASS_ATTRS.length; i++){ CLASS_ATTR_MAP[CLASS_ATTRS[i]] = true; }

/** Parse tree data from HTML <ul> markup */
function _loadFromHtml($ul, children) {
    // TODO: understand this:
    /*jshint validthis:true */
    var that = this,
        $children = $ul.find(">li"),
        extraClasses, i, l, iPos, tmp, classes, className;

    $children.each(function() {
        var $li = $(this),
            $liSpan = $li.find(">span:first", this),
            $liA = $liSpan.length ? null : $li.find(">a:first"),
            d = {href: null, target: null, tooltip: null };

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

        // Make sure all fields exist
        for(i=0, l=CLASS_ATTRS.length; i<l; i++){
            d[CLASS_ATTRS[i]] = undefined;
        }
        // Initialize to `true`, if class is set and collect extraClasses
        classes = this.className.split(" ");
        extraClasses = [];
        for(i=0, l=classes.length; i<l; i++){
            className = classes[i];
            if(CLASS_ATTR_MAP[className]){
                d[className] = true;
            }else{
                extraClasses.push(className);
            }
        }
        d.extraClasses = extraClasses.join(" ");

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
var NODE_ATTRS = ["active", "extraClasses", "expanded", "focus", "folder", "key", "lazy", "nolink", "selected", "title"];

var DynatreeNode = function(parent, data){
    var i, l, name, cl;

    this.parent = parent;
    this.tree = parent.tree;
    this.ul = null;
    this.li = null;  // <li id='key' dtnode=this> tag

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
    debug: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.debug.apply(this, arguments);
    },
    _getInnerHtml: function() {
        var tree = this.tree,
            opts = tree.$widget.options,
            cache = tree.cache,
            level = this.getLevel(),
            data = this.data,
            ares = [];

        // connector (expanded, expandable or simple)
        if( level < opts.minExpandLevel ) {
            if(level > 1){
                ares.push("<span class='dynatree-connector'></span>");
            }
            // .. else (i.e. for root level) skip expander/connector altogether
        } else if( this.hasChildren() !== false ) {
            ares.push("<span class='dynatree-expander'></span>");
        } else {
            ares.push("<span class='dynatree-connector'></span>");
        }
        // Checkbox mode
        if( opts.checkbox && data.hideCheckbox !== true && !data.isStatusNode ) {
            ares.push("<span class='dynatree-checkbox'></span>");
        }
        // folder or doctype icon
        if ( this.icon ) {
            ares.push("<img src='" + opts.imagePath + this.icon + "' alt='' />");
        } else if ( this.icon !== false ) {
            // icon == false means 'no icon', icon == null means 'default icon'
            ares.push("<span class='dynatree-icon'></span>");
        }
        // node title
        var nodeTitle = "";
        if ( opts.onCustomRender ){
            nodeTitle = opts.onCustomRender.call(tree, this) || "";
        }
        if(!nodeTitle){
            var tooltip = this.tooltip ? ' title="' + this.tooltip.replace(/\"/g, '&quot;') + '"' : '',
                href = this.href || "#";
            if( opts.noLink || this.nolink ) {
                // TODO: move style='' to CSS
                nodeTitle = '<span style="display:inline-block;" class="dynatree-title"' + tooltip + '>' + this.title + '</span>';
            } else {
                nodeTitle = '<a href="' + href + '" class="dynatree-title"' + tooltip + '>' + this.title + '</a>';
            }
        }
        ares.push(nodeTitle);
        return ares.join("");
    },


    _fixOrder: function() {
        /**
         * Make sure, that <li> order matches childList order.
         */
        var cl = this.childList;
        if( !cl || !this.ul ){
            return;
        }
        var childLI = this.ul.firstChild;
        for(var i=0, l=cl.length-1; i<l; i++) {
            var childNode1 = cl[i];
            var childNode2 = childLI.dtnode;
            if( childNode1 !== childNode2 ) {
                this.tree.logDebug("_fixOrder: mismatch at index " + i + ": " + childNode1 + " != " + childNode2);
                this.ul.insertBefore(childNode1.li, childNode2.li);
            } else {
                childLI = childLI.nextSibling;
            }
        }
    },

    getLevel: function() {
        /**
         * Return node depth. 0: System root node, 1: visible top-level node.
         */
        var level = 0;
        var dtn = this.parent;
        while( dtn ) {
            level++;
            dtn = dtn.parent;
        }
        return level;
    },

    /** Check if node has children (returns undefined, if not sure). */
    hasChildren: function() {
        if(this.lazy){
            if(this.children === null || this.children === undefined){
                // Not yet loaded
                return undefined;
            }else if(this.children.length === 0){
                // Loaded, but response was empty
                return false;
            }else if(this.children.length === 1 && this.children[0].isStatusNode()){
                // Currently loading or load error
                return undefined;
            }
            return true;
        }
        return !!this.children;
    },

    isFirstSibling: function() {
        var p = this.parent;
        return !p || p.children[0] === this;
    },

    isLastSibling: function() {
        var p = this.parent;
        return !p || p.children[p.children.length-1] === this;
    },

    /**
     * Create <li><span>..</span> .. </li> tags for this node.
     *
     * <li id='KEY' dtnode=NODE> // This div contains the node's span and list of child div's.
     *   <span class='title'>S S S A</span> // Span contains graphic spans and title <a> tag
     *   <ul> // only present, when node has children
     *       <li id='KEY' dtnode=NODE>child1</li>
     *       <li id='KEY' dtnode=NODE>child2</li>
     *   </ul>
     * </li>
     */
    _render: function(useEffects, includeInvisible) {
        DT.debug("_render", this);
        var parent = this.parent,
            $parentUL, $li, i, l, text;
        // Make sure parent has a <ul> to hold this <li>
        if( !parent.ul ){
            parent.ul = document.createElement("ul");
//            parent.ul.style.display = "none";
            parent.li.appendChild(parent.ul);
            // $parentUL = $("<ul>").appendTo(parent.element);
            // parent.ul = $parentUL[0];
        }
//        $parentUL = $(parent.ul);
        // If this
        // text = this.title;
        // $li = $("<li>", {
        //     //
        // }).text(text).appendTo(parent.ul);
        // this.element = $li[0];

        // // Recurse into children
        // if(this.children){
        //     for(i=0; i<this.children.length; i++){
        //         this.children[i].render(true);
        //     }
        // }

        //********

        var tree = this.tree,
            data = this.data,
            opts = tree.$widget.options,
            cn = opts.classNames,
            isLastSib = this.isLastSibling(),
            firstTime = false;

       if( !parent && !this.ul ) {
            alert("nono");
            // // Root node has only a <ul>
            // this.li = this.span = null;
            // this.ul = document.createElement("ul");
            // if( opts.minExpandLevel > 1 ){
            //     this.ul.className = cn.container + " " + cn.noConnector;
            // }else{
            //     this.ul.className = cn.container;
            // }
        } else if( parent ) {
            // Create <li><span /> </li>
            if( ! this.li ) {
                firstTime = true;
                this.li = document.createElement("li");
                this.li.dtnode = this;
                if( this.key && opts.generateIds ){
                    this.li.id = opts.idPrefix + this.key;
                }
                this.span = document.createElement("span");
                this.span.className = "dynatree-title";
                this.li.appendChild(this.span);

                if( !parent.ul ) {
                    // This is the parent's first child: create UL tag
                    // (Hidden, because it will be
                    parent.ul = document.createElement("ul");
                    parent.ul.style.display = "none";
                    parent.li.appendChild(parent.ul);
//                  if( opts.minExpandLevel > this.getLevel() ){
//                      parent.ul.className = cn.noConnector;
//                  }
                }
                // set node connector images, links and text
//              this.span.innerHTML = this._getInnerHtml();

                parent.ul.appendChild(this.li);
            }
            // set node connector images, links and text
            this.span.innerHTML = this._getInnerHtml();
            // Set classes for current status
            var cnList = [];
            cnList.push("dynatree-node");
            if( tree.activeNode === this ){
                cnList.push("dynatree-active");
            }
            if( this.expanded ){
                cnList.push("dynatree-expanded");
            }
            if( this.folder ){
                cnList.push("dynatree-folder");
            }
            if( this.hasChildren() !== false ){
                cnList.push("dynatree-has-children");
            }
            if( isLastSib ){
                cnList.push("dynatree-lastsib");
            }
            if( this.lazy && this.children === null ){
                cnList.push("dynatree-lazy");
            }
            if( this.hasSubSel ){
                cnList.push("dynatree-partsel");
            }
            if( this.selected ){
                cnList.push("dynatree-selected");
            }
            if( this.extraClasses ){
                cnList.push(this.extraClasses);
            }
            // IE6 doesn't correctly evaluate multiple class names,
            // so we create combined class names that can be used in the CSS
            cnList.push("dynatree-exp-" +
                    (this.expanded ? "e" : "c") +
                    (this.lazy && this.children === null ? "d" : "") +
                    (isLastSib ? "l" : "")
                    );
            cnList.push("dynatree-ico-" +
                    (this.expanded ? "e" : "c") +
                    (this.folder ? "f" : "")
                    );
            this.span.className = cnList.join(" ");

            // TODO: we should not set this in the <span> tag also, if we set it here:
            this.li.className = isLastSib ? "dynatree-lastsib" : "";

            // Allow tweaking, binding, after node was created for the first time
            if(firstTime && opts.onCreate){
                opts.onCreate.call(tree, this, this.span);
            }
            // Hide children, if node is collapsed
//          this.ul.style.display = ( this.bExpanded || !parent ) ? "" : "none";
            // Allow tweaking after node state was rendered
            if(opts.onRender){
                opts.onRender.call(tree, this, this.span);
            }
        }
        // Visit child nodes
        if( (this.expanded || includeInvisible === true) && this.children ) {
            for(i=0, l=this.children.length; i<l; i++) {
                this.children[i].render(false, includeInvisible);
            }
            // Make sure the tag order matches the child array
            this._fixOrder();
        }
        // Hide children, if node is collapsed
        if( this.ul ) {
            var isHidden = (this.ul.style.display === "none");
            var isExpanded = !!this.expanded;
//          logMsg("isHidden:%s", isHidden);
            if( useEffects && opts.fx && (isHidden === isExpanded) ) {
                var duration = opts.fx.duration || 200;
                $(this.ul).animate(opts.fx, duration);
            } else {
                this.ul.style.display = ( this.expanded || !parent ) ? "" : "none";
            }
        }
    },
    /** Create HTML markup for this node */
    render: function(deep) {
        if(this.parent === null){
            $.error("cannot call root.render()");
        }
        return this._render(true, true);
    },
    toString: function() {
        return "DynatreeNode<" + this.title + ">";
    }
});


/*******************************************************************************
 * Dynatree
 */

var Dynatree = function($widget){
    this.$widget = $widget;
    this.$div = $widget.element;
    this.$root = null;  // outer <ul class='dynatree-container'>

    this.fromDict({children: null});
};

$.extend(Dynatree.prototype, {
    /** Initiallize the tree */
    fromDict: function(data) {
        // Create a node without parent.
        var fakeParent = { tree: this },
            $ul;
        this.root = new DynatreeNode(fakeParent, {
            title: "root",
            key: "root_" + this.$widget._id,
            children: data.children
        });
        this.root.parent = null;
        // Remove previous markup if any
        this.$div.find(">ul.dynatree-container").remove();
        // Create root markup
        $ul = $("<ul>", {
            "class": "dynatree-container"
        }).appendTo(this.$div);
        this.root.ul = $ul[0];
        // Set tree title from node data
        this.title = data.title;
    },
    render: function() {
        var children = this.root.children,
            i;
        for(i=0; i<children.length; i++){
            children[i].render(true);
        }
    },
    toString: function() {
        return "Dynatree<" + this.$widget._id + ">";
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
        this.$source = this.source
            || this.element.data("type") === "json" ? this.element
            : this.element.find(">ul:first");
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
        this.tree.$div.find(">ul.dynatree-container").remove();
        var _ = this.$source && this.$source.removeClass("ui-helper-hidden");
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
            var node = DT.getNode(event.target);
            if( !node ){
                return true;  // Allow bubbling of other events
            }
            var data = that.tree,
                tree = that.tree,
                o = that.options,
                prevPhase = tree.phase;
            tree.phase = "userEvent";
            that.debug("event(%s): node: %s", event.type, node);
            try {
                switch(event.type) {
                case "click":
                    // return ( that._triggerNodeEvent(node, "click", event) === false ) ? false : node._onClick(event);
                    return ( that._triggerNodeEvent(node, "click", event) === false ) ? false : that._onClick(event);
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
//             } catch(e) {
// //                var _ = null; // issue 117 // TODO
//                 $.error(e);
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
            $ul.addClass("ui-dynatree-source ui-helper-hidden");
            _loadFromHtml.call(this, $ul, data.children);
          break;
        case "json":
//            $().addClass("ui-helper-hidden");
            data = $.parseJSON(this.element.text());
            break;
        default:
            $.error("Invalid data-type: " + type);
        }
        this.element.addClass("ui-widget ui-widget-content ui-corner-all");
//        this.debug(data);
        this.tree.fromDict(data);
//        this.debug("tree", this.tree);
        this.tree.render();
        return this._triggerTreeEvent("load");
    },
    /** Activate node. */
    nodeActivate: function(data, flag) {
        // Handle user click / [space] / [enter], according to clickFolderMode.
        var node = data.node,
            opts = data.tree.options,
            userEvent = !!data.orgEvent;
        // Honor `clikcFolderMode` for
    },
    /** Collapse node, if expanded (shortcut to nodeExpand(node, false)). */
    nodeCollapse: function(data) {
        return this.nodeExpand(data, false);
    },
    /** Expand node, return Deferred.promise. */
    nodeExpand: function(data, flag) {
        var node = data.node,
            opts = data.widget.options;
        flag = (flag !== false);
        node.debug("nodeExpand(" + flag + ")");
        // https://github.com/jshint/jshint/issues/455
        if((node.expanded !== false) === flag){  // TODO: !!nodeexpanded is nicer, but doens't pass jshint
            node.debug("nodeExpand(" + flag + "): nothing to do");
            return; // nothing to do
        }
        if(flag && !node.lazy && !node.hasChildren() ){
            return; // Prevent expanding of empty nodes
        }
        if( !flag && node.getLevel() < opts.minExpandLevel ) {
            return; // Prevent collapsing locked levels
        }
        if ( this._triggerNodeEvent("onQueryExpand", node, data.orgEvent) === false ){
            return; // Callback returned false
        }

        node.expanded = flag;

        // Persist expand state
        // if( opts.persist ) {
        //     if( bExpand ){
        //         this.tree.persistence.addExpand(this.data.key);
        //     }else{
        //         this.tree.persistence.clearExpand(this.data.key);
        //     }
        // }

        // Do not apply animations in init phase, or before lazy-loading
        // var allowEffects = !(this.data.isLazy && this.childList === null)
        //     && !this._isLoading
        //     && !forceSync;
        // this.render(allowEffects);
        node.render();

        // Auto-collapse mode: collapse all siblings
        // if( this.bExpanded && this.parent && opts.autoCollapse ) {
        //     var parents = this._parentList(false, true);
        //     for(var i=0, l=parents.length; i<l; i++){
        //         parents[i].collapseSiblings();
        //     }
        // }

        // If the currently active node is now hidden, deactivate it
        // if( opts.activeVisible && this.tree.activeNode && ! this.tree.activeNode.isVisible() ) {
        //     this.tree.activeNode.deactivate();
        // }

        // Expanding a lazy node: set 'loading...' and call callback
        // if( bExpand && this.data.isLazy && this.childList === null && !this._isLoading ) {
        //     this._loadContent();
        //     return;
        // }
        this._triggerNodeEvent("onExpand", node, data.orgEvent);
        // if ( opts.onExpand ){
        //     opts.onExpand.call(this.tree, bExpand, this);
        // }
    },
    nodeFocus: function(data) {
        // TODO: check, if we already have focus
//      this.tree.logDebug("dtnode.focus(): %o", this);
        this.nodeMakeVisible(data);
        try {
            $(data.node.span).find(">a").focus();
        } catch(e) { }
    },
    nodeMakeVisible: function(data) {
    },
    /**  */
    nodeToggleExpand: function(data) {
        return this.nodeExpand(data, !data.node.expanded);
    },
    /** _Default handling for mouse click events. */
    _onClick: function(event) {
//      this.tree.logDebug("dtnode.onClick(" + event.type + "): dtnode:" + this + ", button:" + event.button + ", which: " + event.which);
        var target = DT.getEventTarget(event),
            node = target.node,
            targetType = target.type;
        if( targetType === "expander" ) {
            // Clicking the expander icon always expands/collapses
//            this.nodeToggleExpand(node);
            this._callNodeHook("nodeToggleExpand", node, event);
            this.nodeFocus(true); // issue 95
        } else if( targetType === "checkbox" ) {
            // Clicking the checkbox always (de)selects
            this.nodeToggleSelect();
            this.nodeFocus(true); // issue 95
        } else {
            this._callNodeHook("nodeActivate", node, event);
//            node._userActivate();
            var aTag = node.span.getElementsByTagName("a");
            if(aTag[0]){
                // issue 154
                // TODO: check if still required on IE 9:
                // Chrome and Safari don't focus the a-tag on click,
                // but calling focus() seem to have problems on IE:
                // http://code.google.com/p/dynatree/issues/detail?id=154
                if(!$.browser.msie){
                    aTag[0].focus();
                }
            }else{
                // 'noLink' option was set
                return true;
            }
        }
        // Make sure that clicks stop, otherwise <a href='#'> jumps to the top
        event.preventDefault();
    },
    /** _trigger a widget event with additional node data. */
    _triggerNodeEvent: function(node, type, orgEvent) {
        var data = { node: node, tree: node.tree, widget: this };
        this.debug("_trigger", type, node, data);
        return this._trigger(type, orgEvent, data);
    },
    /** _trigger a hook function. */
    _callNodeHook: function(type, node, orgEvent, _args) {
        var data = { node: node, tree: node.tree, widget: this, orgEvent: orgEvent },
            fn = this[type],
            args = Array.prototype.slice.call(arguments, 3);
        args.unshift(data);
        this.debug("_hook", type, node, data, args);
        return fn.apply(this, args);
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

// $.ui.dynatree was created by the widget factory. Create a local shortcut:
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
        /*jshint expr:true */
        ($.ui.dynatree.debugLevel >= 2) && window.console && window.console.log && window.console.log.apply(window.console, arguments);
    },
    error: function(msg){
        /*jshint expr:true */
        window.console && window.console.error && window.console.error.apply(window.console, arguments);
    },
    /** Return a {node: DynatreeNode, type: TYPE} for a mouse event. */
    getEventTarget: function(event){
        var tcn = event && event.target ? event.target.className : "",
            res = {node: this.getNode(event.target), type: undefined};

        if( tcn === "dynatree-title" ){
            res.type = "title";
        }else if( tcn === "dynatree-expander" ){
            res.type = "expander";
        }else if( tcn === "dynatree-checkbox" ){
            res.type = "checkbox";
        }else if( tcn === "dynatree-icon" ){
            res.type = "icon";
        }else if( tcn === "dynatree-connector" ){
            res.type = "prefix";
        }else if( tcn.indexOf("dynatree-node") >= 0 ){
            // FIX issue #93
            // TODO: implement
            res.type = this._getTypeForOuterNodeEvent(event);
        }
        return res;
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
        /*jshint expr:true */
        (DT.debugLevel >= 1) && window.console && window.console.info && window.console.info.apply(window.console, arguments);
    },
    warn: function(msg){
        /*jshint expr:true */
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
        DT.debug.apply(this, arguments);
    },
    foo: function(msg){
        Array.prototype.unshift.call(arguments, "base.foo");
        this.debug.apply(this, arguments);
    },
    info: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.info.apply(this, arguments);
    },
    toString: function(){
        return "Dynatree<" + this._id + ">";
    },
    warn: function(msg){
        Array.prototype.unshift.call(arguments, this.toString());
        DT.warn.apply(this, arguments);
    }
});

}(jQuery));  // 


/*******************************************************************************
 * Dynatree extension: logger
 */
(function($) {
    $.extend( $.ui.dynatree.prototype, {
         test_destroy: function() {
            this.debug("hurz");
         }
     });
}(jQuery));
