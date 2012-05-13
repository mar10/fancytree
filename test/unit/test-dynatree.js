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

/** Helper to reset environment for asynchronous Dynatree tests. */
function _setupAsync(){
    QUnit.reset();
    $("#tree").dynatree("destroy");
    stop();
}


/*******************************************************************************
 * test data
 */
var testData = [
    {title: "simple node (no explicit id, so a default key is generated)" },
    {key: "2", title: "item1 with key and tooltip", tooltip: "Look, a tool tip!" },
    {key: "3", title: "<span>item2 with <b>html</b> inside a span tag</span>" },
    {key: "4", title: "this nodes uses 'nolink', so no &lt;a> tag is generated", nolink: true},
    {key: "5", title: "using href", href: "http:/wwwwendt.de/" },
    {key: "6", title: "node with some extra classes (will be added to the generated markup)", extraClasses: "my-extra-class" },
    {key: "7", title: "Folder 1", folder: true, children: [
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
            {key: "20_1_1", title: "Sub-item 2.1.1", active: true},
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
var TESTDATA_TOPNODES = 11,
    TESTDATA_VISIBLENODES = 13;


/*******************************************************************************
 * Module Init
 */
module("Initialization");

test("Static members", function() {
    // non-async test tht runs before any Dynatrees are created
//    _setupAsync();
    QUnit.reset();
    $("#tree").dynatree("destroy");
    expect(2);

    ok(true, "Dynatree v" + $.ui.dynatree.version);
    ok($.isFunction($.ui.dynatree.debug), "ui.dynatree.debug function is defined");
    // equal($(":ui-dynatree").length, 0, "no tree instance exists");
    // equal($.ui.dynatree._nextId, 1, "next tree instance counter is 1");
});


test("Create dynatree", function() {
    _setupAsync();
    expect(26);

    var insideContructor = true;

    $("#tree").dynatree({
        children: testData,
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
            equal(tree.root.children, null, "`tree.root` is empty");
            ok( ! $("div#tree").hasClass("ui-widget"), "div#tree has no widget style yet");
        },
        init: function(e, data){
            equal(e.type, "dynatreeinit", "receive `init` callback");
            ok(insideContructor, "running synchronously");
            ok(!!data.tree.root, "`data.tree` is the tree object");
            equal(data.options.children.length, TESTDATA_TOPNODES, "data.options.contains widget options");
            ok($("div#tree").hasClass("ui-widget"), "div#tree has ui-widget class");
            ok($(this).hasClass("ui-widget"), "`this` is div#tree");
            equal(data.tree.root.children.length, TESTDATA_TOPNODES, "tree.root has all child nodes");

            var tree = data.tree;
            equal($("li#dt_2 a.dynatree-title").attr("title"), "Look, a tool tip!", "tooltip set");
            equal($("li#dt_3 a.dynatree-title").html(), "<span>item2 with <b>html</b> inside a span tag</span>", "raw html allowed");
            equal($("li#dt_4 a.dynatree-title").html(), null, "`nolink` suppresses <a> tag");
            equal($("li#dt_4 span.dynatree-title").length, 1, "`nolink` uses <span> tag");
            equal($("li#dt_5 a.dynatree-title").attr("href"), "http:/wwwwendt.de/", "href set");
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

    equal($("div#tree ul").length, 2, "collapsed choldren are NOT rendered");
    equal($("div#tree li").length, TESTDATA_VISIBLENODES, "collapsed nodes are NOT rendered");
});


/*******************************************************************************
 * 
 */
module("async");

test("trigger async expand", function() {
    _setupAsync();
    expect(4);

    $("#tree").dynatree({
        children: testData
    });
//    var node = $("#tree").dynatree("getActiveNode");
    var tree = $("#tree").dynatree("getTree"),
        node = tree.getNodeByKey("7");
    node.expand().done(function(){
        ok(true, "called done()");
        equal(this.key, "7", "`this` is a DynatreeNode");
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
        children: testData,
        generateIds: true,
        queryexpand: function(e, data){
            equal(e.type, "dynatreequeryexpand", "receive `queryexpand` callback");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok(!$(data.node.span).hasClass("dynatree-expanded"), "data.node.span has NOT class dynatree-expanded");
        },
        expand: function(e, data){
            equal(e.type, "dynatreeexpand", "receive `expand` callback");
            ok($(this).hasClass("ui-widget"), "`this` is div#tree");
            ok(!!data.tree.root, "`data.tree` is the tree object");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok($(data.node.span).hasClass("dynatree-expanded"), "data.node.span has class dynatree-expanded");
            start();
        }
    });
    $("#tree #dt_7 span.dynatree-expander").click();
});


test(".click() to activate a node", function() {
    _setupAsync();
    expect(8);

    $("#tree").dynatree({
        children: testData,
        generateIds: true, // for testing
        queryactivate: function(e, data){
            equal(e.type, "dynatreequeryactivate", "receive `queryactivate` callback");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok(!$(data.node.span).hasClass("dynatree-active"), "data.node.span has NOT class dynatree-active");
        },
        activate: function(e, data){
            equal(e.type, "dynatreeactivate", "receive `activate` callback");
            ok(!!data.tree.root, "`data.tree` is the tree object");
            ok($(this).hasClass("ui-widget"), "`this` is div#tree");
            ok($(data.node.span).hasClass("dynatree-node"), "data.node.span has class dynatree-node");
            ok($(data.node.span).hasClass("dynatree-active"), "data.node.span has class dynatree-active");
            start();
        }
    });
    $("#tree #dt_2").click();
});

// --- 
});
