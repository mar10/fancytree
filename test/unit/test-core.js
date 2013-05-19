jQuery(document).ready(function(){

// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*globals deepEqual,equal,expect,module,ok,QUnit,start,stop,test */

var $ = jQuery;

/*******************************************************************************
 * QUnit setup
 */

QUnit.log(function(data) {
	if (window.console && window.console.log) {
//		window.console.log(data.result + " :: " + data.message);
	}
});

QUnit.done(function( details ) {
	// Expand first section when all tests are run
	$("ol#qunit-tests > li:first > ol").show("slow");
//	if(jQuery.migrateWarnings != null){
//		alert("" + jQuery.migrateWarnings || "no migrateWarnings");
//	}
});

/*******************************************************************************
 * Tool functions
 */
//function simulateClick(selector) {
//	var e = document.createEvent("MouseEvents");
//	e.initEvent("click", true, true);
//	$(selector).each(function(){
//		this.dispatchEvent(e);
//	});
//}


var EVENT_SEQUENCE = [];

/** Helper to reset environment for asynchronous Fancytree tests. */
function _appendEvent(res){
	EVENT_SEQUENCE.push(res);
}


/** Helper to reset environment for asynchronous Fancytree tests. */
function _setupAsync(){
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	EVENT_SEQUENCE = [];
	stop();
}


function _getBrowserInfo(){
	var n = navigator.appName,
		ua = navigator.userAgent,
		tem,
		m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
	if(m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null){
		m[2]= tem[1];
	}
	m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
	return m.join(", ");
}


/** Get FancytreeNode from current tree. */
function _getNode(key){
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey(key);
	return node;
}


/** Get current Fancytree. */
function _getTree(key){
	return $("#tree").fancytree("getTree");
}


/** Get node title as rendered in the DOM. */
function _getNodeTitle(key){
	var node = _getNode(key);
	if(!node){
		return undefined;
	}
	return $(node.span).find(".fancytree-title").html();
}


/** Convert array of nodes to array to array of node keys. */
function _getNodeKeyArray(nodeArray){
	if(!$.isArray(nodeArray)){
		return nodeArray;
	}
	return $.map(nodeArray, function(n){ return n.key; });
}


/** Fake an Ajax request, return a $.Promise. */
function _fakeAjaxLoad(node, count, delay){
	delay = delay || 0;
	if($.isArray(delay)){ // random delay range [min..max]
		delay = Math.round(delay[0] + Math.random() * (delay[1] - delay[0]));
	}
	var dfd = new $.Deferred();
	setTimeout(function(){
		var children = [];
		for(var i=0; i<count; i++){
			children.push({
				key: node.key + "_" + (i+1),
				title: node.title + "_" + (i+1),
				lazy: true
				});
		}
		// emulate ajax deferred: done(data, textStatus, jqXHR)
		dfd.resolveWith(this, [children, null, null]);
	}, delay);
	return dfd.promise();
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
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	expect(5);

	ok(true, "Fancytree v" + $.ui.fancytree.version);
	ok(true, "jQuery UI " + jQuery.ui.version + " (uiBackCompat=" + $.uiBackCompat + ")");
	ok(true, "jQuery " + jQuery.fn.jquery);
	var doctype = document.documentElement.previousSibling,
		doctypeSid = doctype.systemId,
		doctypePid = doctype.publicId;
	ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
//    ok(true, "DOCTYPE 2 " + window.document.doctype);

	ok(true, "Browser: " + _getBrowserInfo());
//    ok(true, "Cumulated test time: " + TOTAL_ELAP + " milliseconds");

});


test("Static members", function() {
	// non-async test tht runs before any Fancytrees are created
//    _setupAsync();
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	expect(1);

	ok($.isFunction($.ui.fancytree.debug), "ui.fancytree.debug function is defined");
	// equal($(":ui-fancytree").length, 0, "no tree instance exists");
	// equal($.ui.fancytree._nextId, 1, "next tree instance counter is 1");
});


test("Create fancytree", function() {
	_setupAsync();
	expect(25);

	var insideContructor = true;

	$("#tree").fancytree({
		source: testData,
		generateIds: true, // for testing
		create: function(e, data){
			equal(e.type, "fancytreecreate", "receive `create` callback");
			ok(insideContructor, "running synchronously");
			ok(!!data, "event data is empty");
			equal(this.nodeName, "DIV", "`this` is div#tree");
			ok($(">ul:first", this).hasClass("fancytree-container"), "div#tree contains ul.fancytree-container");
			var widget = $(this).data("ui-fancytree") || $(this).data("fancytree");
			ok(!!widget, "widget is attached to div#tree");
			var tree = widget.tree;
			equal(tree.rootNode.children, null, "`tree.rootNode` is empty");
			equal($("div#tree").hasClass("ui-widget"), false, "div#tree has no widget style yet");
		},
		init: function(e, data){
			equal(e.type, "fancytreeinit", "receive `init` callback");
			ok(insideContructor, "running synchronously");
			ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			equal(data.options.source.length, TESTDATA_TOPNODES, "data.options.contains widget options");
//            equal($("div#tree").hasClass("ui-widget"), true, "div#tree has ui-widget class");
			equal($(this).attr("id"), "tree", "`this` is div#tree");
			equal(data.tree.rootNode.children.length, TESTDATA_TOPNODES, "tree.rootNode has all child nodes");

//            var tree = data.tree;
			equal($("li#ft_2 span.fancytree-title").attr("title"), "Look, a tool tip!", "tooltip set");
			equal($("li#ft_3 span.fancytree-title").html(), "<span>item2 with <b>html</b> inside a span tag</span>", "raw html allowed");
//			equal($("li#ft_4 a.fancytree-title").html(), null, "`nolink` suppresses <a> tag");
//			equal($("li#ft_4 span.fancytree-title").length, 1, "`nolink` uses <span> tag");
			equal($("li#ft_4 span.fancytree-title").length, 1, "using <span> tag");
//			equal($("li#ft_5 a.fancytree-title").attr("href"), "http://www.wwWendt.de/", "href set");
			ok($("li#ft_6 span.fancytree-node").hasClass("my-extra-class"), "custom class added");

			start();
		}
	}).bind("fancytreecreate", function(e, ctx){
		// TODO: event is triggered, but only if we called start() before
		// but then, the equal() call is added to the following test
//        equal(e.type, "fancytreecreate", "receive `dynatreecreate` bound event");
	}).bind("fancytreeinit", function(e, ctx){
//        equal(e.type, "fancytreeinit", "receive `init` bound event");
//        start();
	});
	insideContructor = false;

	equal($(":ui-fancytree").length, 1, ":ui-fancytree widget selector works");
	var widget = $("div#tree").data("ui-fancytree") || $("div#tree").data("fancytree");
	ok(!!widget, "widget is attached to div#tree");
	ok(!!widget.tree, "widget.tree is defined");
//    equal(widget.tree._id, 1, "tree id is 1");

	ok($("#tree").fancytree("getTree") === widget.tree, "$().fancytree('getTree')");
	ok($("#tree").fancytree("getActiveNode") === null, "$().fancytree('getActiveNode')");

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
	$("#tree").fancytree({
		source: children,
		init: function(e, data){
			var tree = data.tree,
				node = tree.getNodeByKey("10_1_2");
			ok(tree.activeNode === node, "node was activated");
			ok($("#tree").fancytree("getActiveNode") === node, "$().fancytree('getActiveNode')");
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
	$("#tree").fancytree({
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

test("FancytreeNode class", function() {
//  _setupAsync();
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	expect(28);

	$("#tree").fancytree({
		source: testData
	});
	var tree = $("#tree").fancytree("getTree"),
		root = tree.rootNode,
		node = _getNode("10_1_2"),
		res;
	// Properties
	equal(node.tree, tree, "node.tree");
	equal(node.parent, _getNode("10_1"), "node.parent");
	equal(node.key, "10_1_2", "node.key");
	equal(node.children, null, "node.children");
	equal(node.isStatusNode, false, "node.isStatusNode");
//    this.ul = null;
//    this.li = null;  // <li id='key' ftnode=this> tag
//    this.data = {};


	// Methods
//  addChildren: function(children){
//  applyPatch: function(patch) {
//  collapseSiblings: function() {

	equal(root.countChildren(), TESTDATA_NODES, "countChildren() - root");
	equal(root.countChildren(true), TESTDATA_NODES, "countChildren(true) - root");
	equal(root.countChildren(false), TESTDATA_TOPNODES, "countChildren(false) - root");

//  debug: function(msg){
//  discard: function(){

	// findAll()
	deepEqual(root.findAll("nomatchexpected$$"), [], "findAll() - no match");
	deepEqual(_getNodeKeyArray(root.findAll("with key")), ["2"], "findAll() - match title");
	deepEqual(_getNodeKeyArray(root.findAll("with KEY")), ["2"], "findAll() - match title (ignore case)");
	res = root.findAll(function(n){
		return n.isFolder();
	});
	deepEqual(_getNodeKeyArray(res), ["10", "30", "31", "32"], "findAll() - custom match");

	// findFirst()
	equal(root.findFirst("nomatchexpected$$"), null, "findFirst() - no match");
	equal(root.findFirst("with key").key, "2", "findFirst() - match title");
	equal(root.findFirst("with KEY").key, "2", "findFirst() - match title (ignore case)");
	res = root.findFirst(function(n){
		return n.isFolder();
	});
	equal(res.key, "10", "findFirst() - custom match");

	//  getChildren: function() {
//  getFirstChild: function() {
	equal(node.getIndex(), 1, "getIndex()");

	equal(node.getIndexHier(), "7.1.2", "getIndexHier()");
	equal(node.getIndexHier("/"), "7/1/2", "getIndexHier('/')");

	equal(node.getKeyPath(), "/10/10_1/10_1_2", "getKeyPath()");
	equal(node.getKeyPath(false), "/10/10_1/10_1_2", "getKeyPath(false)");
	equal(node.getKeyPath(true), "/10/10_1", "getKeyPath(true)");
//  getLastChild: function() {
//  getLevel: function() {
//  getNextSibling: function() {

	equal(node.getParent().key, "10_1", "getParent()");

//  getParentList: function(includeRoot, includeSelf) {
	var ROOT_NODE_KEY = tree.rootNode.key;
	deepEqual(_getNodeKeyArray(node.getParentList()),
			["10", "10_1"], "getParentList()");
	deepEqual(_getNodeKeyArray(node.getParentList(false, false)),
			["10", "10_1"], "getParentList(false, false)");
	deepEqual(_getNodeKeyArray(node.getParentList(true, true)),
			[ROOT_NODE_KEY, "10", "10_1", "10_1_2"], "getParentList(true, true)");
	deepEqual(_getNodeKeyArray(node.getParentList(false, true)),
			["10", "10_1", "10_1_2"], "getParentList(false, true)");
	deepEqual(_getNodeKeyArray(node.getParentList(true, false)),
			[ROOT_NODE_KEY, "10", "10_1"], "getParentList(true, false)");

//  getPrevSibling: function() {
//  hasChildren: function() {
//  hasFocus: function() {
//  isActive: function() {
//  isChildOf: function(otherNode) {
//  isDescendantOf: function(otherNode) {
//  isExpanded: function() {
//  isFolder: function() {
//  isFirstSibling: function() {
//  isLastSibling: function() {
//  isLazy: function() {
//  isLoading: function() {
////isStatusNode: function() {
//  isRoot: function() {
//  isSelected: function() {
//  isVisible: function() {
//  makeVisible
//  move: function(targetNode, mode) {
//  reloadChildren: function() {
//  render: function(force, deep) {
//  renderTitle: function() {
//  renderStatus: function() {
//  remove: function() {
//  removeChild: function(childNode) {
//  removeChildren: function() {
//  scheduleAction: function(mode, ms) {
//  scrollIntoView
//  setActive: function(flag){
//  setExpanded: function(flag){
//  setFocus: function(){
//  setSelected: function(flag){
//  setTitle: function(title){
//  sortChildren: function(title){
//  toDict
//  toggleExpanded: function(){
//  toggleSelected: function(){
//  toString: function() {
//  visit: function(fn, includeSelf) {
//  visitParents: function(fn, includeSelf) {
});


test("Fancytree class", function() {
//  _setupAsync();
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	expect(14);

	$("#tree").fancytree({
		source: testData
	});
	var tree = $("#tree").fancytree("getTree");
  // Properties
//    tree.widget = widget;
//    tree.$div = widget.element;
//    tree.options = widget.options;
//    tree._id = $.ui.fancytree._nextId++;
//    tree.activeNode = null;
//    tree.focusNode = null;
//    tree.statusClassPropName = "span";
//    tree.lastSelectedNode = null;
//    tree.rootNode = new FancytreeNode(fakeParent, {
//        title: "root",
//        key: "root_" + tree._id,
//        children: null
//    });
//    tree.rootNode.parent = null;
//
//    // Create root markup
//    $ul = $("<ul>", {
//        "class": "fancytree-container"
//    }).appendTo(this.$div);
//    tree.rootNode.ul = $ul[0];
//    tree.nodeContainerAttrName = "li";

	// Methods
	// TODO: activateByKey()
	equal(tree.count(), TESTDATA_NODES, "count()");
	// TODO: getFirstChild()
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

//  reactivate: function(source) {
//  reload: function(source) {
//    render: function(force, deep) {

	equal(tree.toString(), "<Fancytree(#" + tree._id + ")>", "toString()");
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
module("Asynchronous API");

test("trigger async expand", function() {
	_setupAsync();
	expect(4);

	$("#tree").fancytree({
		source: testData
	});
//    var node = $("#tree").fancytree("getActiveNode");
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey("10");

	node.setExpanded().done(function(){
		ok(true, "called done()");
		equal(this.key, "10", "`this` is a FancytreeNode");
		equal(this.expanded, true, "node was  expanded");
		ok($(this.span).hasClass("fancytree-expanded"), "node was rendered as expanded");
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

	$("#tree").fancytree({
		source: testData,
		generateIds: true,
		beforeExpand: function(e, data){
			equal(e.type, "fancytreebeforeexpand", "receive `beforeExpand` callback");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok(!$(data.node.span).hasClass("fancytree-expanded"), "data.node.span has NOT class fancytree-expanded");
		},
		expand: function(e, data){
			equal(e.type, "fancytreeexpand", "receive `expand` callback");
			equal($(this).attr("id"), "tree", "`this` is div#tree");
			ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok($(data.node.span).hasClass("fancytree-expanded"), "data.node.span has class fancytree-expanded");
			start();
		}
	});
	$("#tree #ft_10 span.fancytree-expander").click();
});


test(".click() to activate a node", function() {
	_setupAsync();
	expect(8);

	$("#tree").fancytree({
		source: testData,
		generateIds: true, // for testing
		beforeActivate: function(e, data){
			equal(e.type, "fancytreebeforeactivate", "receive `beforeActivate` callback");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok(!$(data.node.span).hasClass("fancytree-active"), "data.node.span has NOT class fancytree-active");
		},
		activate: function(e, data){
			equal(e.type, "fancytreeactivate", "receive `activate` callback");
			ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			equal($(this).attr("id"), "tree", "`this` is div#tree");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok($(data.node.span).hasClass("fancytree-active"), "data.node.span has class fancytree-active");
			start();
		}
	});
	$("#tree #ft_2").click();
});


test(".click() to activate a folder (clickFolderMode 3 triggers expand)", function() {
	_setupAsync();
	expect(4);
	var sequence = 1;
	$("#tree").fancytree({
		source: testData,
		clickFolderMode: 3,
		generateIds: true, // for testing
		beforeActivate: function(e, data){
			equal(sequence++, 1, "receive `beforeActivate` callback");
		},
		activate: function(e, data){
			equal(sequence++, 2, "receive `activate` callback");
		},
		beforeExpand: function(e, data){
			equal(sequence++, 3, "receive `beforeExpand` callback");
		},
		expand: function(e, data){
			equal(sequence++, 4, "receive `expand` callback");
			start();
		}
	});
	$("#tree #ft_10").click();
});


test(".click() to select a node", function() {
	_setupAsync();
	expect(8);

	$("#tree").fancytree({
		source: testData,
		checkbox: true,
		generateIds: true, // for testing
		beforeSelect: function(e, data){
			equal(e.type, "fancytreebeforeselect", "receive `beforeSelect` callback");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok(!$(data.node.span).hasClass("fancytree-selected"), "data.node.span has NOT class fancytree-selected");
		},
		select: function(e, data){
			equal(e.type, "fancytreeselect", "receive `select` callback");
			ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			equal($(this).attr("id"), "tree", "`this` is div#tree");
			ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			ok($(data.node.span).hasClass("fancytree-selected"), "data.node.span has class fancytree-selected");
			start();
		}
	});
	$("#tree #ft_2 span.fancytree-checkbox").click();
});

/*******************************************************************************
 * Lazy loading
 */
module("lazy loading");

test(".click() to expand a lazy folder (lazyload returns ajax options)", function() {
	_setupAsync();
	expect(11);
	var sequence = 1;

	$("#tree").fancytree({
		source: {url: "ajax-tree.json"},
		generateIds: true,
		init: function(e, data){
			equal(sequence++, 1, "receive `init` callback");
			equal(data.tree.count(), TESTDATA_NODES, "lazy tree has 23 nodes");
			equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has rendered 13 node elements");
			// now expand a lazy folder
			$("#tree #ft_30 span.fancytree-expander").click();
		},
		beforeExpand: function(e, data){
			equal(sequence++, 2, "receive `beforeExpand` callback");
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
module("add children & patches");

test("add children", function() {
	_setupAsync();
	expect(15);

	var childList = [
			{title: "New 1", key: "test1", tooltip: "new tip", data: {foo: "works"}},
			{title: "New 2", key: "test2", folder: true, children: [
				{title: "New 2.1", key: "test2_1"},
				{title: "New 2.2", key: "test2_2"}
			 ]},
			{title: "New 3", key: "test3", expanded: true, children: [
				{title: "New 3.1", key: "test3_1", selected: true},
				{title: "New 3.2", key: "test3_2", extraClasses: "customClass"}
			 ]}
		];

	$("#tree").fancytree({
		source: testData,
		lazyload: function(e, data){
			data.result = {url: "ajax-sub2.json"};
		},
		init: function(e, data){
			data.tree.rootNode.addChildren(childList);

			equal(_getNodeTitle("test1"), "New 1", "simple node");
			var $span = $(_getNode("test1").span);
//			equal($span.find("a.fancytree-title").attr("title"), "new tip", "set tooltip");
			equal($span.find("span.fancytree-title").attr("title"), "new tip", "set tooltip");
			equal(_getNode("test1").data.foo, "works", "set custom data");

			equal(_getNode("test2").isFolder(), true, "is folder");
			equal(_getNode("test2").isExpanded(), false, "folder was collapsed");
			equal($(_getNode("test2").span).hasClass("fancytree-expanded"), false, "folder was rendered as collapsed");
			equal(_getNode("test2_1").title, "New 2.1", "subnode created");
			equal(_getNodeTitle("test2_1"), null, "subnode NOT rendered");

			equal(_getNode("test3").expanded, true, "node was expanded");
			equal($(_getNode("test3").span).hasClass("fancytree-expanded"), true, "folder was rendered as expanded");
			equal(_getNode("test3_1").title, "New 3.1", "subnode created");
			equal(_getNodeTitle("test3_1"), "New 3.1", "subnode rendered expanded");
			equal(_getNode("test3_1").isSelected(), true, "select");
			equal($(_getNode("test3_1").span).hasClass("fancytree-selected"), true, "node was rendered as selected");
			equal($(_getNode("test3_2").span).hasClass("customClass"), true, "set custom class");

//            deepEqual(EVENT_SEQUENCE, [], "event sequence");

			start();
		}
	});
});

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

	$("#tree").fancytree({
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
//				equal($span.find("a.fancytree-title").attr("title"), "new tip", "set tooltip");
				equal($span.find("span.fancytree-title").attr("title"), "new tip", "set tooltip");
				equal(_getNode("2").data.foo, "works", "set custom data");

				ok(_getNode("3").isSelected(), "select");
				ok($(_getNode("3").span).hasClass("fancytree-selected"), "node was rendered as selected");

				ok($(_getNode("4").span).hasClass("customClass"), "set custom class");

				equal(_getNode("10_1_1").title, "Renamed 10_1_1", "rename hidden");
				equal(_getNodeTitle("10_1_1"), null, "rename hidden (not rendered)");

				equal(_getNode("10_1_2"), null, "remove nodes");

				equal(_getNode("5_1").title, "new 5_1", "add child nodes (created)");
				equal(_getNodeTitle("5_1"), null, "add child nodes (NOT rendered)");
				equal(_getNode("5_1").parent, _getNode("5"), "add child nodes (linked)");

				equal(_getNode("10").expanded, true, "folder was expanded");
				ok($(_getNode("10").span).hasClass("fancytree-expanded"), "folder was rendered as expanded");

				equal(_getNode("20").expanded, false, "folder was collapsed");
				ok(!$(_getNode("20").span).hasClass("fancytree-expanded"), "folder was rendered as collapsed");

				equal(_getNode("30").expanded, true, "lazy node was expanded");
				ok($(_getNode("30").span).hasClass("fancytree-expanded"), "node was rendered as expanded");
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

test("loadKeyPath (allready loaded)", function() {
	_setupAsync();
	expect(1);

	$("#tree").fancytree({
		source: testData
	});
	var tree = _getTree();
	// TODO: test with numeric keys:

	tree.loadKeyPath("/10/10_1/10_1_2", function(node, status){
		_appendEvent(status + " #" + (node ? node.key : "null"));
	}).done(function(data){
		_appendEvent("done.");
		deepEqual(EVENT_SEQUENCE,
				["loaded #10",
				 "loaded #10_1",
				 "ok #10_1_2",
				 "done."], "event sequence");
		start();
	});
});

test("loadKeyPath (lazy nodes)", function() {
	_setupAsync();
	expect(1);

	$("#tree").fancytree({
		source: testData,
		lazyload: function(e, data){
			// fake an async, deleayed Ajax request that generates 5 lazy nodes
			data.result = _fakeAjaxLoad(data.node, 5, 10);
		}
	});
	var tree = _getTree();
	// TODO: test with numeric keys:

	tree.loadKeyPath("/30/30_3/30_3_2", function(node, status){
		_appendEvent(status + " #" + (node ? node.key : "null"));
	}).done(function(data){
		_appendEvent("done.");
		deepEqual(EVENT_SEQUENCE,
				["loaded #30",
				 "loading #30",
				 "loaded #30_3",
				 "loading #30_3",
				 "ok #30_3_2",
				 "done."], "event sequence");
		start();
	});
});

test("loadKeyPath (multiple lazy nodes with expand)", function() {
	_setupAsync();
	expect(7);

	$("#tree").fancytree({
		source: testData,
		lazyload: function(e, data){
			data.result = _fakeAjaxLoad(data.node, 5, [0, 30]);
		}
	});
	var tree = _getTree(),
		pathList = ["/30/30_3/30_3_2",
					"/30/30_3/30_3_1",
					"/30/30_5/30_5_1",
					"/30/30_5/30_5_XXX"];

	tree.loadKeyPath(pathList, function(node, status){
		_appendEvent(status + " #" + (node.key ? node.key : node));
		if(status === "loaded" || status === "ok"){
			node.makeVisible();
		}
	}).done(function(data){
		_appendEvent("done.");
		// the event sequence depends on random delay, so we check for 'ok' only
		ok($.inArray("ok #30_3_1", EVENT_SEQUENCE) >= 0, "node was loaded");
		equal(_getNode("30_3_1").isVisible(), true, "node was expanded");
		ok($.inArray("ok #30_3_2", EVENT_SEQUENCE) >= 0, "node was loaded");
		equal(_getNode("30_3_2").isVisible(), true, "node was expanded");
		ok($.inArray("ok #30_5_1", EVENT_SEQUENCE) >= 0, "node was loaded");
		equal(_getNode("30_5_1").isVisible(), true, "node was expanded");
		ok($.inArray("error #30_5_XXX", EVENT_SEQUENCE) >= 0, "missing node was reported");
		start();
	});
});

});
