jQuery(document).ready(function(){
/*globals asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,
    notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test */
var $ = jQuery;

/*******************************************************************************
 * QUnit setup
 */
QUnit.log = function(data) {  
  if (window.console && window.console.log) {  
      window.console.log(data.result +' :: '+ data.message);  
  }  
};

/*******************************************************************************
 * Tool functions
 */
function simulateClick(selector) {
    var e = document.createEvent("MouseEvents");
    e.initEvent("click", true, true);
    $(selector).each(function(){
        this.dispatchEvent(e);
    });
}


var EVENT_SEQUENCE = [];

/** Helper to reset environment for asynchronous Dynatree tests. */
function _appendEvent(res){
    EVENT_SEQUENCE.push(res);
}


/** Helper to reset environment for asynchronous Dynatree tests. */
function _setupAsync(){
    QUnit.reset();
    $("#tree").dynatree("destroy");
    EVENT_SEQUENCE = [];
    stop();
}


/** Get DynatreeNode from current tree. */
function _getNode(key){
    var tree = $("#tree").dynatree("getTree"),
        node = tree.getNodeByKey(key);
    return node;
}

/** Get DynatreeNode from current tree. */
function _getTree(key){
    return $("#tree").dynatree("getTree");
}

/** Get node title as rendered in the DOM. */
function _getNodeTitle(key){
    var node = _getNode(key);
    if(!node){
        return undefined;
    }
    return $(node.span).find(".dynatree-title").html();
}

/** Convert array of nodes to array to array of node keys. */
function _getNodeKeyArray(nodeArray){
    if(!$.isArray(nodeArray)){
        return nodeArray;
    }
    return $.map(nodeArray, function(n){ return n.key; });
}

/*******************************************************************************
 * test data
 */
var testData = [
    {title: "simple node (no explicit id, so a default key is generated)" },
    {key: "2", title: "item1 with key and tooltip", tooltip: "Look, a tool tip!" },
    {key: "3", title: "<span>item2 with <b>html</b> inside a span tag</span>" },
    {key: "4", title: "this nodes uses 'nolink', so no &lt;a> tag is generated", nolink: true},
    {key: "5", title: "using href", href: "http://www.wwWendt.de/" },
    {key: "6", title: "node with some extra classes (will be added to the generated markup)", extraClasses: "my-extra-class" },
    {key: "10", title: "Folder 1", folder: true, children: [
        {key: "10_1", title: "Sub-item 1.1", children: [
            {key: "10_1_1", title: "Sub-item 1.1.1"},
            {key: "10_1_2", title: "Sub-item 1.1.2"}
        ]},
        {key: "10_2", title: "Sub-item 1.2", children: [
            {key: "10_2_1", title: "Sub-item 1.2.1"},
            {key: "10_2_2", title: "Sub-item 1.2.2"}
        ]}
    ]},
    {key: "20", title: "Simple node with active children (expand)", expanded: true, children: [
        {key: "20_1", title: "Sub-item 2.1", children: [
            {key: "20_1_1", title: "Sub-item 2.1.1"},
            {key: "20_1_2", title: "Sub-item 2.1.2"}
        ]},
        {key: "10_2", title: "Sub-item 1.2", children: [
            {key: "20_2_1", title: "Sub-item 2.2.1"},
            {key: "20_2_2", title: "Sub-item 2.2.2"}
        ]}
    ]},
    {key: "30", title: "Lazy folder", folder: true, lazy: true },
    {key: "31", title: "Lazy folder (preload)", folder: true, lazy: true, preload: true },
    {key: "32", title: "Lazy folder (expand on load)", folder: true, lazy: true, expanded: true }
];
var TESTDATA_NODES = 23,
    TESTDATA_TOPNODES = 11,
    TESTDATA_VISIBLENODES = 13;


/*******************************************************************************
 * Module Init
 */
module("Initialization");

test("Version info", function() {
    QUnit.reset();
    $("#tree").dynatree("destroy");
    expect(4);

    ok(true, "Dynatree v" + $.ui.dynatree.version);
    ok(true, "jQuery UI " + jQuery.ui.version);
    ok(true, "jQuery " + jQuery.fn.jquery);
    var doctype = document.documentElement.previousSibling,
        doctypeSid = doctype.systemId,
        doctypePid = doctype.publicId;
    ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
//    ok(true, "DOCTYPE 2 " + window.document.doctype);
});


test("Static members", function() {
    // non-async test tht runs before any Dynatrees are created
//    _setupAsync();
    QUnit.reset();
    $("#tree").dynatree("destroy");
    expect(1);

    ok($.isFunction($.ui.dynatree.debug), "ui.dynatree.debug function is defined");
    // equal($(":ui-dynatree").length, 0, "no tree instance exists");
    // equal($.ui.dynatree._nextId, 1, "next tree instance counter is 1");
});


test("Create dynatree", function() {
    _setupAsync();
    expect(27);

    var insideContructor = true;

    $("#tree").dynatree({
        source: testData,
        generateIds: true, // for testing
        create: function(e, data){
            equal(e.type, "dynatreecreate", "receive `create` callback");
            ok(insideContructor, "running synchronously");
            ok(!!data, "event data is empty");
            equal(this.nodeName, "DIV", "`this` is div#tree");
            ok($(">ul:first", this).hasClass("dynatree-container"), "div#tree contains ul.dynatree-container");
            var widget = $(this).data("dynatree");
            ok(!!widget, "widget is attached to div#tree");
            var tree = widget.tree;
            equal(tree.rootNode.children, null, "`tree.rootNode` is empty");
            equal($("div#tree").hasClass("ui-widget"), false, "div#tree has no widget style yet");
        },
        init: function(e, data){
            equal(e.type, "dynatreeinit", "receive `init` callback");
            ok(insideContructor, "running synchronously");
            ok(!!data.tree.rootNode, "`data.tree` is the tree object");
            equal(data.options.source.length, TESTDATA_TOPNODES, "data.options.contains widget options");
//            equal($("div#tree").hasClass("ui-widget"), true, "div#tree has ui-widget class");
            equal($(this).attr("id"), "tree", "`this` is div#tree");
            equal(data.tree.rootNode.children.length, TESTDATA_TOPNODES, "tree.rootNode has all child nodes");

//            var tree = data.tree;
            equal($("li#dt_2 a.dynatree-title").attr("title"), "Look, a tool tip!", "tooltip set");
            equal($("li#dt_3 a.dynatree-title").html(), "<span>item2 with <b>html</b> inside a span tag</span>", "raw html allowed");
            equal($("li#dt_4 a.dynatree-title").html(), null, "`nolink` suppresses <a> tag");
            equal($("li#dt_4 span.dynatree-title").length, 1, "`nolink` uses <span> tag");
            equal($("li#dt_5 a.dynatree-title").attr("href"), "http://www.wwWendt.de/", "href set");
            ok($("li#dt_6 span.dynatree-node").hasClass("my-extra-class"), "custom class added");

            start();
        }
    }).bind("dynatreecreate", function(e, ctx){
        // TODO: event is triggered, but only if we called start() before
        // but then, the equal() call is added to the following test
//        equal(e.type, "dynatreecreate", "receive `dynatreecreate` bound event");
    }).bind("dynatreeinit", function(e, ctx){
//        equal(e.type, "dynatreeinit", "receive `init` bound event");
//        start();
    });
    insideContructor = false;
    
    equal($(":ui-dynatree").length, 1, ":ui-dynatree widget selector works");
    var widget = $("div#tree").data("dynatree");
    ok(!!widget, "widget is attached to div#tree");
    ok(!!widget.tree, "widget.tree is defined");
//    equal(widget.tree._id, 1, "tree id is 1");

    ok($("#tree").dynatree("getTree") === widget.tree, "$().dynatree('getTree')");
    ok($("#tree").dynatree("getActiveNode") === null, "$().dynatree('getActiveNode')");

    equal($("div#tree ul").length, 2, "collapsed choldren are NOT rendered");
    equal($("div#tree li").length, TESTDATA_VISIBLENODES, "collapsed nodes are NOT rendered");
});


test("Init node status from source", function() {
    _setupAsync();
    expect(3);
    // Add some status info to testData (make a deep copy first!)
    var children = $.extend(true, [], testData);
    // activate node #10_1_2
    children[6].children[0].children[1].active = true;
    // select node #10_1_1
    children[6].children[0].children[0].selected = true;
    $("#tree").dynatree({
        source: children,
        init: function(e, data){
            var tree = data.tree,
                node = tree.getNodeByKey("10_1_2");
            ok(tree.activeNode === node, "node was activated");
            ok($("#tree").dynatree("getActiveNode") === node, "$().dynatree('getActiveNode')");
            node = tree.getNodeByKey("10_1_1");
            equal(node.selected, true, "node was selected");
            start();
        }
    });
});


test("Init node with custom data", function() {
    _setupAsync();
    expect(2);
    // Add some status info to testData (make a deep copy first!)
    var children = $.extend(true, [], testData);
    // node #10_1_1
    children[6].children[0].children[0].foo = "phew";
    // node #10_1_2
    children[6].children[0].children[1].bar = false;
    $("#tree").dynatree({
        source: children,
        init: function(e, data){
            equal(_getNode("10_1_1").data.foo, "phew", "add custom string data");
            equal(_getNode("10_1_2").data.bar, false, "add custom bool data");
            start();
        }
    });
});


/*******************************************************************************
 * 
 */
module("API");

test("DynatreeNode class", function() {
//  _setupAsync();
    QUnit.reset();
    $("#tree").dynatree("destroy");
    expect(10);

    $("#tree").dynatree({
        source: testData
    });
    var tree = $("#tree").dynatree("getTree"),
        node = _getNode("10_1_2");
    // Properties
    equal(node.tree, tree, "node.tree");
    equal(node.parent, _getNode("10_1"), "node.parent");
    equal(node.key, "10_1_2", "node.key");
    equal(node.children, null, "node.children");
    equal(node.isStatusNode, false, "node.isStatusNode");
//    this.ul = null;
//    this.li = null;  // <li id='key' dtnode=this> tag
//    this.data = {};

    
    // Methods
//  addChildren: function(children){
//  applyPatch: function(patch) {
//  collapseSiblings: function() {
//  countChildren: function() {
//  debug: function(msg){
//  discard: function(){
//  getChildren: function() {
//  getFirstChild: function() {
    equal(node.getIndex(), 1, "getIndex()");
    equal(node.getIndexHier(), "7.1.2", "getIndexHier()");
    equal(node.getIndexHier("/"), "7/1/2", "getIndexHier('/')");
    equal(node.getKeyPath(), "/10/10_1/10_1_2", "getKeyPath()");
    equal(node.getKeyPath(true), "/10/10_1", "getKeyPath(true)");
//  getLastChild: function() {
//  getLevel: function() {
//  getNextSibling: function() {
//  getParent: function() {
//  getParentList: function(includeRoot, includeSelf) {
//  getPrevSibling: function() {
//  hasChildren: function() {
//  hasFocus: function() {
//  isActive: function() {
//  isChildOf: function(otherNode) {
//  isDescendantOf: function(otherNode) {
//  isExpanded: function() {
//  isFirstSibling: function() {
//  isLastSibling: function() {
//  isLazy: function() {
//  isLoading: function() {
////isStatusNode: function() {
//  isRoot: function() {
//  isSelected: function() {
//  isVisible: function() {
//  move: function(targetNode, mode) {
//  reloadChildren: function() {
//  render: function(force, deep) {
//  renderTitle: function() {
//  renderStatus: function() {
//  remove: function() {
//  removeChild: function(childNode) {
//  removeChildren: function() {
//  scheduleAction: function(mode, ms) {
//  setActive: function(flag){
//  setExpanded: function(flag){
//  setFocus: function(){
//  setSelected: function(flag){
//  setTitle: function(title){
//  toggleExpanded: function(){
//  toggleSelected: function(){
//  toString: function() {
//  visit: function(fn, includeSelf) {
//  visitParents: function(fn, includeSelf) {
});


test("Dynatree class", function() {
//  _setupAsync();
    QUnit.reset();
    $("#tree").dynatree("destroy");
    expect(14);

    $("#tree").dynatree({
        source: testData
    });
    var tree = $("#tree").dynatree("getTree");
  // Properties
//    tree.$widget = $widget;
//    tree.$div = $widget.element;
//    tree.options = $widget.options;
//    tree._id = $.ui.dynatree._nextId++;
//    tree.activeNode = null;
//    tree.focusNode = null;
//    tree.statusClassPropName = "span";
//    tree.lastSelectedNode = null;
//    tree.rootNode = new DynatreeNode(fakeParent, {
//        title: "root",
//        key: "root_" + tree._id,
//        children: null
//    });
//    tree.rootNode.parent = null;
//
//    // Create root markup
//    $ul = $("<ul>", {
//        "class": "dynatree-container"
//    }).appendTo(this.$div);
//    tree.rootNode.ul = $ul[0];
//    tree.nodeContainerAttrName = "li";

    // Methods
    equal(tree.count(), TESTDATA_NODES, "count()");
    equal(tree.getNodeByKey("10_2").key, "10_2", "getNodeByKey()");
    equal(tree.getNodeByKey("foobar"), null, "getNodeByKey() not found");
    var node = _getNode("10_2");
    equal(tree.getNodeByKey("10_2_1", node).key, "10_2_1", "getNodeByKey(.., root)");
    equal(tree.getNodeByKey("10_1_1", node), null, "getNodeByKey(.., root) not found");

    deepEqual(_getNodeKeyArray(tree.getSelectedNodes()), [], "getSelectedNodes() - empty");
    deepEqual(_getNodeKeyArray(tree.getSelectedNodes(true)), [], "getSelectedNodes(true) - empty");
    _getNode("10_2").setSelected();
    _getNode("10_2_1").setSelected();
    _getNode("10_2_2").setSelected();
    deepEqual(_getNodeKeyArray(tree.getSelectedNodes()), 
            ["10_2", "10_2_1", "10_2_2"], "getSelectedNodes()");
    deepEqual(_getNodeKeyArray(tree.getSelectedNodes(true)), 
            ["10_2"], "getSelectedNodes(true)");

//    reload: function(source) {
//    render: function(force, deep) {

    equal(tree.toString(), "Dynatree<" + tree._id + ">", "toString()");
    equal("" + tree, tree.toString(), "toString() implicit");

    var c = 0;
    tree.visit(function(n){
        c += 1;
    });
    equal(c, TESTDATA_NODES, "visit() - all");

    c = 0;
    tree.visit(function(n){
      c += 1;
      if(n.key === "10_1"){
          return false;
      }
    });
    equal(c, 8, "visit() - interrupt");
  
    c = 0;
    tree.visit(function(n){
      c += 1;
    if(n.key === "10_1"){
    return "skip";
        }
    });
    equal(c, 21, "visit() - skip branch");  
});


/*******************************************************************************
 * 
 */
module("Asyncronous API");

test("trigger async expand", function() {
    _setupAsync();
    expect(4);

    $("#tree").dynatree({
        source: testData
    });
//    var node = $("#tree").dynatree("getActiveNode");
    var tree = $("#tree").dynatree("getTree"),
        node = tree.getNodeByKey("10");

    node.setExpanded().done(function(){
        ok(true, "called done()");
        equal(this.key, "10", "`this` is a DynatreeNode");
        equal(this.expanded, true, "node was  expanded");
        ok($(this.span).hasClass("dynatree-expanded"), "node was rendered as expanded");
        start();
    });
});


/*******************************************************************************
 * Simulated click events
 */
module("events");

test(".click() to expand a folder", function() {
    _setupAsync();
    expect(8);

    $("#tree").dynatree({
        source: testData,
        generateIds: true,
        queryexpand: function(e, data){
            equal(e.type, "dynatreequeryexpand", "receive `queryexpand` callback");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok(!$(data.node.span).hasClass("dynatree-expanded"), "data.node.span has NOT class dynatree-expanded");
        },
        expand: function(e, data){
            equal(e.type, "dynatreeexpand", "receive `expand` callback");
            equal($(this).attr("id"), "tree", "`this` is div#tree");
            ok(!!data.tree.rootNode, "`data.tree` is the tree object");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok($(data.node.span).hasClass("dynatree-expanded"), "data.node.span has class dynatree-expanded");
            start();
        }
    });
    $("#tree #dt_10 span.dynatree-expander").click();
});


test(".click() to activate a node", function() {
    _setupAsync();
    expect(8);

    $("#tree").dynatree({
        source: testData,
        generateIds: true, // for testing
        queryactivate: function(e, data){
            equal(e.type, "dynatreequeryactivate", "receive `queryactivate` callback");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok(!$(data.node.span).hasClass("dynatree-active"), "data.node.span has NOT class dynatree-active");
        },
        activate: function(e, data){
            equal(e.type, "dynatreeactivate", "receive `activate` callback");
            ok(!!data.tree.rootNode, "`data.tree` is the tree object");
            equal($(this).attr("id"), "tree", "`this` is div#tree");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok($(data.node.span).hasClass("dynatree-active"), "data.node.span has class dynatree-active");
            start();
        }
    });
    $("#tree #dt_2").click();
});


test(".click() to activate a folder (clickFolderMode 3 triggers expand)", function() {
    _setupAsync();
    expect(4);
    var sequence = 1;
    $("#tree").dynatree({
        source: testData,
        clickFolderMode: 3,
        generateIds: true, // for testing
        queryactivate: function(e, data){
            equal(sequence++, 1, "receive `queryactivate` callback");
        },
        activate: function(e, data){
            equal(sequence++, 2, "receive `activate` callback");
        },
        queryexpand: function(e, data){
            equal(sequence++, 3, "receive `queryexpand` callback");
        },
        expand: function(e, data){
            equal(sequence++, 4, "receive `expand` callback");
            start();
        }
    });
    $("#tree #dt_10").click();
});


test(".click() to select a node", function() {
    _setupAsync();
    expect(8);

    $("#tree").dynatree({
        source: testData,
        checkbox: true,
        generateIds: true, // for testing
        queryselect: function(e, data){
            equal(e.type, "dynatreequeryselect", "receive `queryselect` callback");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok(!$(data.node.span).hasClass("dynatree-selected"), "data.node.span has NOT class dynatree-selected");
        },
        select: function(e, data){
            equal(e.type, "dynatreeselect", "receive `select` callback");
            ok(!!data.tree.rootNode, "`data.tree` is the tree object");
            equal($(this).attr("id"), "tree", "`this` is div#tree");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok($(data.node.span).hasClass("dynatree-selected"), "data.node.span has class dynatree-selected");
            start();
        }
    });
    $("#tree #dt_2 span.dynatree-checkbox").click();
});

/*******************************************************************************
 * Lazy loading
 */
module("lazy loading");

test(".click() to expand a lazy folder (lazyload returns ajax options)", function() {
    _setupAsync();
    expect(11);
    var sequence = 1;

    $("#tree").dynatree({
        source: {url: "ajax-tree.json"},
        generateIds: true,
        init: function(e, data){
            equal(sequence++, 1, "receive `init` callback");
            equal(data.tree.count(), TESTDATA_NODES, "lazy tree has 23 nodes");
            equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has rendered 13 node elements");
            // now expand a lazy folder
            $("#tree #dt_30 span.dynatree-expander").click();
        },
        queryexpand: function(e, data){
            equal(sequence++, 2, "receive `queryexpand` callback");
        },
        lazyload: function(e, data){
            equal(sequence++, 3, "receive `lazyload` callback");
            data.result = {url: "ajax-sub2.json"};
        },
        loadchildren: function(e, data){
            equal(sequence++, 4, "receive `loadchildren` callback");
            equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
            equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has not yet rendered new node elements");
        },
        expand: function(e, data){
            equal(sequence++, 5, "receive `expand` callback");
            equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
            equal($("#tree li").length, TESTDATA_VISIBLENODES + 2, "lazy tree has rendered 15 node elements");
            start();
        }
    });
});


/*******************************************************************************
 * 
 */
module("patches");

test("apply patch", function() {
    _setupAsync();
    expect(19);

    var patchList = [
             ["2", {title: "node 2: new", tooltip: "new tip", foo: "works"}],
             ["3", {selected: true}],
             ["4", {extraClasses: "customClass"}],
             ["10_1_1", {title: "Renamed 10_1_1"}],
             ["10_1_2", null ],
             ["5", {children: [{key: "5_1", title: "new 5_1"}]}],
             ["6", {children: [{key: "6_1", title: "new 6_1", expanded: true,
                                children: [{key: "6_1_1", title: "new 6_1_1"}]
                               }]}],
             ["10", {expanded: true} ],
             ["20", {expanded: false} ],
             ["30", {expanded: true} ]
//             [null, {appendChildren: [{key: "40", title: "new top-level 40"}]}]
        ];

    $("#tree").dynatree({
        source: testData,
        lazyload: function(e, data){
            data.result = {url: "ajax-sub2.json"};
        },
        init: function(e, data){
            data.tree.applyPatch(patchList).done(function(){
                _appendEvent("done");
                ok(true, "called done()");
                
                var $span = $(_getNode("2").span); 
                equal(_getNodeTitle("2"), "node 2: new", "rename nodes");
                equal($span.find("a.dynatree-title").attr("title"), "new tip", "set tooltip");
                equal(_getNode("2").data.foo, "works", "set custom data");

                ok(_getNode("3").isSelected(), "select");
                ok($(_getNode("3").span).hasClass("dynatree-selected"), "node was rendered as selected");

                ok($(_getNode("4").span).hasClass("customClass"), "set custom class");

                equal(_getNode("10_1_1").title, "Renamed 10_1_1", "rename hidden");
                equal(_getNodeTitle("10_1_1"), null, "rename hidden (not rendered)");
                
                equal(_getNode("10_1_2"), null, "remove nodes");
                
                equal(_getNode("5_1").title, "new 5_1", "add child nodes (created)");
                equal(_getNodeTitle("5_1"), null, "add child nodes (NOT rendered)");
                equal(_getNode("5_1").parent, _getNode("5"), "add child nodes (linked)");

                equal(_getNode("10").expanded, true, "folder was expanded");
                ok($(_getNode("10").span).hasClass("dynatree-expanded"), "folder was rendered as expanded");
                
                equal(_getNode("20").expanded, false, "folder was collapsed");
                ok(!$(_getNode("20").span).hasClass("dynatree-expanded"), "folder was rendered as collapsed");
                
                equal(_getNode("30").expanded, true, "lazy node was expanded");
                ok($(_getNode("30").span).hasClass("dynatree-expanded"), "node was rendered as expanded");
//                deepEqual(EVENT_SEQUENCE, [], "event sequence");

                // TODO: patch.appendChildren, replaceChildren, insertChildren, ...
//                ok(_getNode("40"), "add top-level nodes (created)");
//                equal(_getNodeTitle("40"), "new top-level 40", "add top-level nodes (rendered)");
                start();
            });
        }
    });
});

/*******************************************************************************
 * 
 */
module("keypath");

test("loadKeyPath", function() {
    _setupAsync();
    expect(1);

    $("#tree").dynatree({
        source: testData,
        lazyload: function(e, data){
            data.result = {url: "ajax-sub2.json"};
        }
    });
    var tree = _getTree();
    tree.loadKeyPath("/10/10_1/10_1_2").progress(function(data){
        _appendEvent("progress: " + data);
    }).done(function(data){
        _appendEvent("done: " + data);
        deepEqual(EVENT_SEQUENCE, [], "event sequence");
        start();
    });
});

// --- 
// expand first info section
// setTimeout(function(){
//     alert($("li#qunit-test-output0").length);
// QUnit.triggerEvent($("li#qunit-test-output0")[0], "click");
//     $("li#qunit-test-output0").click();
// }, 1000)

});
