jQuery(document).ready(function(){

/*globals TEST_TOOLS, QUnit */

/* jshint -W081 */  // Ignore 'W081: Too many var statements'

var TEST_DATA, TESTDATA_NODES, TESTDATA_TOPNODES, TESTDATA_VISIBLENODES,
	$ = jQuery,
	DEBUG_LEVEL = 1,
	// Use tools from test-tools.js
	tools = TEST_TOOLS;

/*******************************************************************************
 * test data
 */
TEST_DATA = [
		{title: "simple node (no explicit id, so a default key is generated)" },
		{key: "2", title: "item1 with key and tooltip", tooltip: "Look, a tool tip!" },
		{key: "3", title: "<span>item2 with <b>html</b> inside a span tag</span>" },
		{key: "4", title: "this nodes uses 'nolink', so no &lt;a> tag is generated", nolink: true},
		{key: "5", title: "using href", href: "https://wwWendt.de/" },
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
			{key: "20_2", title: "Sub-item 2.2", children: [
				{key: "20_2_1", title: "Sub-item 2.2.1"},
				{key: "20_2_2", title: "Sub-item 2.2.2"}
			]}
		]},
		{key: "30", title: "Lazy folder", folder: true, lazy: true },
		{key: "31", title: "Lazy folder (preload)", folder: true, lazy: true, preload: true },
		{key: "32", title: "Lazy folder (expand on load)", folder: true, lazy: true, expanded: true }
	];
TESTDATA_NODES = 23,
TESTDATA_TOPNODES = 11,
TESTDATA_VISIBLENODES = 13;


/*******************************************************************************
 * Initialize QUnit
 */

tools.initQUnit();

// Create an Info section (will be expanded when tests are completed)
tools.createInfoSection();

// Silence, please
$.ui.fancytree.debugLevel = DEBUG_LEVEL;


/*******************************************************************************
 * Module Init
 */
QUnit.module("Initialization");

QUnit.test("Static members", function(assert) {
	tools.setup(assert);
	assert.expect(5);

	assert.ok($.isFunction($.ui.fancytree.debug), "ui.fancytree.debug function is defined");
	assert.equal($(":ui-fancytree").length, 0, "no tree instance exists");
	// equal($.ui.fancytree._nextId, 1, "next tree instance counter is 1");

	assert.equal($.ui.fancytree.getTree(), null, "getTree() no tree instance exists");
	assert.equal($.ui.fancytree.getTree(0), null, "getTree(0) no tree instance exists");
	assert.equal($.ui.fancytree.getTree(1), null, "getTree(0) no tree instance exists");
});


QUnit.test("Create Fancytree", function(assert) {
	tools.setup(assert);
	assert.expect(16);

	var tree, widget,
		insideConstructor = true;

	$("#tree").fancytree({
		source: TEST_DATA,
		generateIds: true, // for testing
		create: function(event, data){
			assert.ok(insideConstructor, "running synchronously");
			widget = $("div#tree").data("ui-fancytree") || $("div#tree").data("fancytree");
			tree = widget.tree;
			assert.equal(tree.options.debugLevel, DEBUG_LEVEL, "Inherit global debugLevel");
		}
	});
	insideConstructor = false;

	assert.equal($(":ui-fancytree").length, 1, ":ui-fancytree widget selector works");
	assert.ok(!!widget, "widget is attached to div#tree");
	assert.ok(!!widget.tree, "widget.tree is defined");
//    equal(widget.tree._id, 1, "tree id is 1");

	assert.ok($("#tree").fancytree("getTree") === tree, "$().fancytree('getTree')");
	assert.ok($("#tree").fancytree("getActiveNode") === null, "$().fancytree('getActiveNode')");

	assert.equal($.ui.fancytree.getTree(), tree, "getTree() exists");
	assert.ok($.ui.fancytree.getTree(0) === tree, "getTree(0) exists");
	assert.ok($.ui.fancytree.getTree("#tree") === tree, "getTree('#tree') exists");

	assert.ok($.ui.fancytree.getTree("#ft-id-" + tree._id) === tree, "getTree('#ft-id-<ID>') exists");
	assert.ok($.ui.fancytree.getTree(tree._id) === tree, "getTree('<ID>') exists");

	assert.ok($.ui.fancytree.getTree(1) === null, "getTree(1) does not exist");
	assert.ok($.ui.fancytree.getTree("#foobar") === null, "getTree(#foobar) does not exist");

	assert.equal($("div#tree ul").length, 2, "collapsed children are NOT rendered");
	assert.equal($("div#tree li").length, TESTDATA_VISIBLENODES, "collapsed nodes are NOT rendered");
});


QUnit.test("Create Fancytree - fixed id", function(assert) {
	tools.setup(assert);
	assert.expect(6);

	$("#tree").fancytree({
		source: TEST_DATA,
		treeId: "foo",
	});

	var tree = $.ui.fancytree.getTree();
	assert.equal(tree._id, "foo", "tree id is 'foo'");

	assert.ok($.ui.fancytree.getTree(0) === tree, "getTree(0) exists");
	assert.ok($.ui.fancytree.getTree("#tree") === tree, "getTree('#tree') exists");
	assert.ok($.ui.fancytree.getTree("foo") === tree, "getTree('foo') exists");
	assert.ok($.ui.fancytree.getTree("#ft-id-foo") === tree, "getTree('#ft-id-foo') exists");
	assert.ok($.ui.fancytree.getTree("#foo") === null, "getTree('#foo') does not exist");
});


QUnit.test("Create Fancytree - init", function(assert) {
	tools.setup(assert);
	assert.expect(19);

	var tree, widget,
		done = assert.async(),
		insideConstructor = true;

	$("#tree").fancytree({
		source: TEST_DATA,
		generateIds: true, // for testing
		create: function(event, data){
			assert.equal(event.type, "fancytreecreate", "receive `create` callback");
			assert.ok(insideConstructor, "running synchronously");
			assert.ok(!!data, "event data is empty");
			assert.equal(this.nodeName, "DIV", "`this` is div#tree");
			assert.ok($(">ul", this).first().hasClass("fancytree-container"), "div#tree contains ul.fancytree-container");
			widget = $(this).data("ui-fancytree") || $(this).data("fancytree");
			assert.ok(!!widget, "widget is attached to div#tree");
			tree = widget.tree;
			assert.equal(tree.rootNode.children, null, "`tree.rootNode` is empty");
			assert.equal($("div#tree").hasClass("ui-widget"), false, "div#tree has no widget style yet");
		},
		init: function(event, data){
			assert.equal(event.type, "fancytreeinit", "receive `init` callback");
			assert.equal(data.status, true, "`init` status is true");
			assert.ok(insideConstructor, "running synchronously");
			assert.ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			assert.equal(data.options.source.length, TESTDATA_TOPNODES, "data.options.contains widget options");
//            equal($("div#tree").hasClass("ui-widget"), true, "div#tree has ui-widget class");
			assert.equal($(this).attr("id"), "tree", "`this` is div#tree");
			assert.equal(data.tree.rootNode.children.length, TESTDATA_TOPNODES, "tree.rootNode has all child nodes");

//            var tree = data.tree;
			assert.equal($("li#ft_2 span.fancytree-title").attr("title"), "Look, a tool tip!", "tooltip set");
			assert.equal($("li#ft_3 span.fancytree-title").html().toLowerCase(), "<span>item2 with <b>html</b> inside a span tag</span>", "raw html allowed");
//			assert.equal($("li#ft_4 a.fancytree-title").html(), null, "`nolink` suppresses <a> tag");
//			assert.equal($("li#ft_4 span.fancytree-title").length, 1, "`nolink` uses <span> tag");
			assert.equal($("li#ft_4 span.fancytree-title").length, 1, "using <span> tag");
//			assert.equal($("li#ft_5 a.fancytree-title").attr("href"), "https://wwWendt.de/", "href set");
			assert.ok($("li#ft_6 span.fancytree-node").hasClass("my-extra-class"), "custom class added");

			done();
		}
	}).on("fancytreecreate", function(event, data){
		// TODO: event is triggered, but only if we called done() before
		// but then, the equal() call is added to the following test
//        equal(event.type, "fancytreecreate", "receive `dynatreecreate` bound event");
	}).on("fancytreeinit", function(event, data){
//        equal(event.type, "fancytreeinit", "receive `init` bound event");
//        done();
	});
	insideConstructor = false;
});


QUnit.test("Init node status from source", function(assert) {
	tools.setup(assert);
	assert.expect(3);

	var done = assert.async();

	// Add some status info to TEST_DATA (make a deep copy first!)
	var children = $.extend(true, [], TEST_DATA);
	// activate node #10_1_2
	children[6].children[0].children[1].active = true;
	// select node #10_1_1
	children[6].children[0].children[0].selected = true;
	$("#tree").fancytree({
		source: children,
		init: function(event, data){
			var tree = data.tree,
				node = tree.getNodeByKey("10_1_2");
			assert.ok(tree.activeNode === node, "node was activated");
			assert.ok($("#tree").fancytree("getActiveNode") === node, "$().fancytree('getActiveNode')");
			node = tree.getNodeByKey("10_1_1");
			assert.equal(node.selected, true, "node was selected");
			done();
		}
	});
});


QUnit.test("Init node with custom data", function(assert) {
	tools.setup(assert);
	assert.expect(2);

	var done = assert.async();

	// Add some status info to TEST_DATA (make a deep copy first!)
	var children = $.extend(true, [], TEST_DATA);
	// node #10_1_1
	children[6].children[0].children[0].foo = "phew";
	// node #10_1_2
	children[6].children[0].children[1].bar = false;
	$("#tree").fancytree({
		source: children,
		init: function(event, data){
			assert.equal(tools.getNode("10_1_1").data.foo, "phew", "add custom string data");
			assert.equal(tools.getNode("10_1_2").data.bar, false, "add custom bool data");
			done();
		}
	});
});


QUnit.test("Custom icons (node.icon)", function(assert) {
	tools.setup(assert);
	assert.expect(13);

	var done = assert.async();

	var children = [
			{key: "1", title: "node 1" },
			{key: "2", title: "node 2", icon: true},
			{key: "3", title: "node 3", icon: false},
			{key: "4", title: "node 4", icon: "custom-class"},
			{key: "5", title: "node 5", icon: "custom_icon.png"},
			{key: "6", title: "node 6", iconClass: "custom-class"}
		];

	$("#tree").fancytree({
		source: children,
		generateIds: true,
		init: function(event, data){
			assert.equal( tools.getNode("4").data.icon, undefined, "node.data.icon is not set");
			assert.equal( tools.getNode("4").icon, "custom-class", "node.icon is set");
			assert.equal( tools.getNode("5").icon, "custom_icon.png", "node.icon is set");

			assert.ok( $("#ft_1 span.fancytree-icon").length === 1, "icon span exists by default");
			assert.ok( $("#ft_2 span.fancytree-icon").length === 1, "icon: true shows icon");
			assert.ok( $("#ft_3 span.fancytree-icon").length === 0, "icon: false hides icon");
			// custom class
			assert.ok( $("#ft_4 span.fancytree-custom-icon").length === 1, "custom icons have span.fancytree-custom-icon");
			assert.ok( $("#ft_4 span.fancytree-custom-icon").hasClass("custom-class"), "custom icons have custom class added");
			assert.ok( $("#ft_4 .fancytree-icon").length === 0, "custom icons don't have .fancytree-icon");
			// custom image
			// Note: IE <= 7 prepends the path to the src attribute, so we must test with indexOf:
//			assert.ok( $("#ft_5 img.fancytree-icon").attr("src") === "custom_icon.png", "image icon <img> exists");
			assert.ok( $("#ft_5 img.fancytree-icon").attr("src").indexOf("custom_icon.png") >= 0, "image icon <img> exists");
			assert.ok( $("#ft_5 span.fancytree-icon").length === 0, "image icon <span> not exists");
			assert.ok( $("#ft_5 .fancytree-custom-icon").length === 0, "image icons don't have .fancytree-custom-icon");
			// auto-migration for iconClass
			assert.ok( $("#ft_6 span.fancytree-custom-icon").hasClass("custom-class"), "migration for deprecated iconClass");

			done();
		}
	});
});

QUnit.test("Custom icons (options.icon)", function(assert) {
	tools.setup(assert);
	assert.expect(16);

	var done = assert.async();

	var children = [
			{key: "1", title: "node 1" },
			{key: "2", title: "node 2" },
			{key: "3", title: "node 3" },
			{key: "4", title: "node 4" },
			{key: "5", title: "node 5" },
			{key: "6", title: "node 6", icon: false },
			{key: "7", title: "node 7", icon: false },
			{key: "8", title: "node 8", icon: true },
			{key: "9", title: "node 9", icon: true },
			{key: "10", title: "node 10", icon: "custom-class-2" },
			{key: "11", title: "node 11", icon: "custom-class-2" }
		];

	$("#tree").fancytree({
		source: children,
		generateIds: true,
		icon: function(event, data){
			switch( data.node.key ){
			case "2": return true;
			case "3": return false;
			case "4": return "custom-class";
			case "5": return "custom_icon.png";
			case "7": return true;
			case "9": return false;
			case "11": return "custom-class";
			}
		},
		init: function(event, data){
			assert.equal( tools.getNode("8").data.icon, undefined, "node.data.icon is not set");

			assert.ok( $("#ft_1 span.fancytree-icon").length === 1, "icon span exists by default ('undefined')");
			assert.ok( $("#ft_2 span.fancytree-icon").length === 1, "icon: true shows icon");
			assert.ok( $("#ft_3 span.fancytree-icon").length === 0, "icon: false hides icon");
			// custom class
			assert.ok( $("#ft_4 span.fancytree-custom-icon").length === 1, "custom icons have span.fancytree-custom-icon");
			assert.ok( $("#ft_4 span.fancytree-custom-icon").hasClass("custom-class"), "custom icons have custom class added");
			assert.ok( $("#ft_4 .fancytree-icon").length === 0, "custom icons don't have .fancytree-icon");
			// custom image
			// Note: IE <= 7 prepends the path to the src attribute, so we must test with indexOf:
//			assert.ok( $("#ft_5 img.fancytree-icon").attr("src") === "custom_icon.png", "image icon <img> exists");
			assert.ok( $("#ft_5 img.fancytree-icon").attr("src").indexOf("custom_icon.png") >= 0, "image icon <img> exists");
			assert.ok( $("#ft_5 span.fancytree-icon").length === 0, "image icon <span> not exists");
			assert.ok( $("#ft_5 .fancytree-custom-icon").length === 0, "image icons don't have .fancytree-custom-icon");
			// callback overrides node.icon
			assert.ok( $("#ft_6 span.fancytree-icon").length === 0, "icon hidden (node.icon=false, options.icon=undefined)");
			assert.ok( $("#ft_7 span.fancytree-icon").length === 1, "icon visible (node.icon=false, options.icon=true)");
			assert.ok( $("#ft_8 span.fancytree-icon").length === 1, "icon visible (node.icon=true, options.icon=undefined)");
			assert.ok( $("#ft_9 span.fancytree-icon").length === 0, "icon hidden (node.icon=true, options.icon=false)");
			assert.ok( $("#ft_10 span.fancytree-custom-icon").hasClass("custom-class-2"), "using custom-class-2 (node.icon='custom-class-2', options.icon=undefined)");
			assert.ok( $("#ft_11 span.fancytree-custom-icon").hasClass("custom-class"), "using custom-class (node.icon='custom-class-2', options.icon='custom-class')");

			done();
		}
	});
});


/*******************************************************************************
 *
 */
QUnit.module("API");

QUnit.test("FancytreeNode class methods", function(assert) {
	tools.setup(assert);
	assert.expect(48);

	$("#tree").fancytree({
		source: TEST_DATA
	});
	var res, ROOT_NODE_KEY, nodeAdded,
		tree = $("#tree").fancytree("getTree"),
		root = tree.rootNode,
		node = tools.getNode("10_1_2");

	// Properties
	assert.equal(node.tree, tree, "node.tree");
	assert.equal(node.parent, tools.getNode("10_1"), "node.parent");
	assert.equal(node.key, "10_1_2", "node.key");
	assert.equal(node.children, null, "node.children");
	assert.equal(node.isStatusNode(), false, "node.isStatusNode()");
//    this.ul = null;
//    this.li = null;  // <li id='key' ftnode=this> tag
//    this.data = {};


	// Methods
//  addChildren: function(children){

	// addNode
	assert.throws(function(){
		root.addNode({"title": "my title"}, "undefined mode");
	}, "Fancytree assertion failed: Invalid mode: undefined mode");

	nodeAdded = root.addNode({"title": "my title 1", "key": "add-node-1"});
	assert.equal(root.children.slice(-1)[0].key, "add-node-1", "Node added at the last position");

	nodeAdded.addNode({"title": "my title 2", "key": "add-node-2"});
	assert.equal(nodeAdded.countChildren(), 1, "Children added");
	assert.equal(nodeAdded.children[0].key, "add-node-2", "Children at first position");

	nodeAdded.addNode({"title": "my title 3", "key": "add-node-3"}, "child");
	assert.equal(nodeAdded.countChildren(), 2, "Children added");
	assert.equal(nodeAdded.children.slice(-1)[0].key, "add-node-3", "Children added at last position");

	nodeAdded.addNode({"title": "my title 4", "key": "add-node-4"}, "firstChild");
	assert.equal(nodeAdded.countChildren(), 3, "Children added");
	assert.equal(nodeAdded.children[0].key, "add-node-4", "Children add at the first position");

	nodeAdded.children[0].addNode({"title": "my title 5", "key": "add-node-5"}, "before");
	assert.equal(nodeAdded.children[0].key, "add-node-5", "Children added before element");

	nodeAdded.children[0].addNode({"title": "my title 6", "key": "add-node-6"}, "after");
	assert.equal(nodeAdded.children[1].key, "add-node-6", "Children added after element");

	nodeAdded.removeChildren();
	nodeAdded.addNode({"title": "my title 7", "key": "add-node-7"}, "firstChild");
	assert.equal(nodeAdded.countChildren(), 1, "Children added at first even if no child");
	nodeAdded.remove();

//  applyPatch: function(patch) {
//  collapseSiblings: function() {
//  copyTp: function(targetNode, mode, map) {

	assert.equal(root.countChildren(), TESTDATA_NODES, "countChildren() - root");
	assert.equal(root.countChildren(true), TESTDATA_NODES, "countChildren(true) - root");
	assert.equal(root.countChildren(false), TESTDATA_TOPNODES, "countChildren(false) - root");

//  debug: function(msg){
//  discard: function(){

	// findAll()
	assert.deepEqual(root.findAll("nomatchexpected$$"), [], "findAll() - no match");
	assert.deepEqual(tools.getNodeKeyArray(root.findAll("with key")), ["2"], "findAll() - match title");
	assert.deepEqual(tools.getNodeKeyArray(root.findAll("with KEY")), ["2"], "findAll() - match title (ignore case)");
	res = root.findAll(function(n){
		return n.isFolder();
	});
	assert.deepEqual(tools.getNodeKeyArray(res), ["10", "30", "31", "32"], "findAll() - custom match");

	// findFirst()
	assert.equal(root.findFirst("nomatchexpected$$"), null, "findFirst() - no match");
	assert.equal(root.findFirst("with key").key, "2", "findFirst() - match title");
	assert.equal(root.findFirst("with KEY").key, "2", "findFirst() - match title (ignore case)");
	res = root.findFirst(function(n){
		return n.isFolder();
	});
	assert.equal(res.key, "10", "findFirst() - custom match");

	//  getChildren: function() {
//  getFirstChild: function() {
	assert.equal(node.getIndex(), 1, "getIndex()");

	assert.equal(node.getIndexHier(), "7.1.2", "getIndexHier()");
	assert.equal(node.getIndexHier("/"), "7/1/2", "getIndexHier('/')");

	assert.equal(node.getKeyPath(), "/10/10_1/10_1_2", "getKeyPath()");
	assert.equal(node.getKeyPath(false), "/10/10_1/10_1_2", "getKeyPath(false)");
	assert.equal(node.getKeyPath(true), "/10/10_1", "getKeyPath(true)");
//  getLastChild: function() {
//  getLevel: function() {
//  getNextSibling: function() {

	assert.equal(node.getParent().key, "10_1", "getParent()");

//  getParentList: function(includeRoot, includeSelf) {
	ROOT_NODE_KEY = tree.rootNode.key;
	assert.deepEqual(tools.getNodeKeyArray(node.getParentList()),
			["10", "10_1"], "getParentList()");
	assert.deepEqual(tools.getNodeKeyArray(node.getParentList(false, false)),
			["10", "10_1"], "getParentList(false, false)");
	assert.deepEqual(tools.getNodeKeyArray(node.getParentList(true, true)),
			[ROOT_NODE_KEY, "10", "10_1", "10_1_2"], "getParentList(true, true)");
	assert.deepEqual(tools.getNodeKeyArray(node.getParentList(false, true)),
			["10", "10_1", "10_1_2"], "getParentList(false, true)");
	assert.deepEqual(tools.getNodeKeyArray(node.getParentList(true, false)),
			[ROOT_NODE_KEY, "10", "10_1"], "getParentList(true, false)");

	// Class modifiers
	assert.ok(!node.extraClasses, "No initial extraClasses");
	node.addClass("test-class-1");
	assert.equal(node.extraClasses, "test-class-1", "node.addClass()");
	node.toggleClass("test-class-2");
	assert.equal(node.extraClasses, "test-class-1 test-class-2", "node.toggleClass()");
	node.addClass("test-class-2");
	assert.equal(node.extraClasses, "test-class-1 test-class-2", "node.addClass() existing");
	node.toggleClass("test-class-2");
	assert.equal(node.extraClasses, "test-class-1", "node.toggleClass() existing");
	node.toggleClass("test-class-2");
	assert.equal(node.extraClasses, "test-class-1 test-class-2", "node.toggleClass() non-existing");
	node.removeClass("test-class-2");
	node.removeClass("test-class-3");
	assert.equal(node.extraClasses, "test-class-1", "node.removeClass()");
	assert.equal(node.hasClass("test-class-1"), true,  "node.hasClass() existing");
	assert.equal(node.hasClass("test-class-2"), false,  "node.hasClass() non-existing");

//  getPrevSibling: function() {
//  hasChildren: function() {
//  hasFocus: function() {
//  isActive: function() {
//  isChildOf: function(otherNode) {
//  isDescendantOf: function(otherNode) {
//  isFirstSibling: function() {
//  isLastSibling: function() {
//  isLazy: function() {
//  isLoaded()
//  isStatusNode()
//  isUndefined()
//  load()
////isStatusNode: function() {
//  isRoot: function() {
//  isSelected: function() {
//  isVisible: function() {
//  makeVisible
//  moveTo: function(targetNode, mode, map) {
//  reloadChildren: function() {
//  render: function(force, deep) {
//  renderTitle: function() {
//  renderStatus: function() {
//  remove: function() {
//  removeChild: function(childNode) {
//  removeChildren: function() {
//  resetLazy()
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


QUnit.test("Fancytree class methods", function(assert) {
	tools.setup(assert);
	assert.expect(17);

	$("#tree").fancytree({
		source: TEST_DATA
	});
	var c, node,
		tree = $("#tree").fancytree("getTree");

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
	assert.equal(tree.count(), TESTDATA_NODES, "count()");
	// TODO: getFirstChild()
	assert.equal(tree.getNodeByKey("10_2").key, "10_2", "getNodeByKey()");
	assert.equal(tree.getNodeByKey("foobar"), null, "getNodeByKey() not found");
	node = tools.getNode("10_2");
	assert.equal(tree.getNodeByKey("10_2_1", node).key, "10_2_1", "getNodeByKey(.., root)");
	assert.equal(tree.getNodeByKey("10_1_1", node), null, "getNodeByKey(.., root) not found");

	// tree.getSelectedNodes()
	assert.deepEqual(tools.getNodeKeyArray(tree.getSelectedNodes()), [], "getSelectedNodes() - empty");
	assert.deepEqual(tools.getNodeKeyArray(tree.getSelectedNodes(true)), [], "getSelectedNodes(true) - empty");
	tools.getNode("10_2").setSelected();
	tools.getNode("10_2_1").setSelected();
	tools.getNode("10_2_2").setSelected();
	assert.deepEqual(tools.getNodeKeyArray(tree.getSelectedNodes()),
			["10_2", "10_2_1", "10_2_2"], "getSelectedNodes()");
	assert.deepEqual(tools.getNodeKeyArray(tree.getSelectedNodes(true)),
			["10_2"], "getSelectedNodes(true)");

	assert.equal(tree.getOption("clickFolderMode"), 4, "getOption()");
	tree.setOption("someTreeOption", 42);
	assert.equal(tree.getOption("someTreeOption"), 42, "setOption()");

//  reactivate: function(source) {
//  reload: function(source) {
//    render: function(force, deep) {
	// tree.toString()
	assert.equal(tree.toString(), "Fancytree@" + tree._id, "toString()");
	// assert.equal(tree.toString(), "<Fancytree(#" + tree._id + ")>", "toString()");
	assert.equal("" + tree, tree.toString(), "toString() implicit");
	assert.equal("" + tools.getNode("10_2_2"), "FancytreeNode@10_2_2[title='Sub-item 1.2.2']");

	// tree.visit()
	c = 0;
	tree.visit(function(n){
		c += 1;
	});
	assert.equal(c, TESTDATA_NODES, "visit() - all");

	c = 0;
	tree.visit(function(n){
	  c += 1;
	  if(n.key === "10_1"){
		  return false;
	  }
	});
	assert.equal(c, 8, "visit() - interrupt");

	c = 0;
	tree.visit(function(n){
	  c += 1;
	if(n.key === "10_1"){
	return "skip";
		}
	});
	assert.equal(c, 21, "visit() - skip branch");

});


/*******************************************************************************
 *
 */
QUnit.module("Asynchronous API");

QUnit.test("trigger async expand", function(assert) {
	tools.setup(assert);
	assert.expect(4);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA
	});
//    var node = $("#tree").fancytree("getActiveNode");
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey("10");

	node.setExpanded().done(function(){
		assert.ok(true, "called done()");
		assert.equal(this.key, "10", "`this` is a FancytreeNode");
		assert.equal(this.expanded, true, "node was  expanded");
		assert.ok($(this.span).hasClass("fancytree-expanded"), "node was rendered as expanded");
		done();
	});
});

QUnit.test("makeVisible not rendered deep node", function(assert) {
	tools.setup(assert);
	assert.expect(5);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA
	});

	var node = tools.getNode("10_2_2");
	assert.ok(node);
	assert.ok(!node.parent.isExpanded());
	assert.ok(!node.li); // not rendered yet

	node.makeVisible().done(function () {
		assert.ok(node.parent.isExpanded());
		assert.ok(node.li); // rendered

		done();
	});
});


/*******************************************************************************
 * Simulated click events
 */
QUnit.module("events");

QUnit.test(".click() to expand a folder", function(assert) {
	tools.setup(assert);
	assert.expect(8);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		generateIds: true,
		beforeExpand: function(event, data){
			assert.equal(event.type, "fancytreebeforeexpand", "receive `beforeExpand` callback");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok(!$(data.node.span).hasClass("fancytree-expanded"), "data.node.span has NOT class fancytree-expanded");
		},
		expand: function(event, data){
			assert.equal(event.type, "fancytreeexpand", "receive `expand` callback");
			assert.equal($(this).attr("id"), "tree", "`this` is div#tree");
			assert.ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok($(data.node.span).hasClass("fancytree-expanded"), "data.node.span has class fancytree-expanded");
			done();
		}
	});
	$("#tree #ft_10 span.fancytree-expander").click();
});


QUnit.test(".click() to activate a node", function(assert) {
	tools.setup(assert);
	assert.expect(8);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		generateIds: true, // for testing
		beforeActivate: function(event, data){
			assert.equal(event.type, "fancytreebeforeactivate", "receive `beforeActivate` callback");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok(!$(data.node.span).hasClass("fancytree-active"), "data.node.span has NOT class fancytree-active");
		},
		activate: function(event, data){
			assert.equal(event.type, "fancytreeactivate", "receive `activate` callback");
			assert.ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			assert.equal($(this).attr("id"), "tree", "`this` is div#tree");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok($(data.node.span).hasClass("fancytree-active"), "data.node.span has class fancytree-active");
			done();
		}
	});
	$("#tree #ft_2 span.fancytree-title").click();
});


QUnit.test(".click() to activate a folder (clickFolderMode 3 triggers expand)", function(assert) {
	tools.setup(assert);
	assert.expect(4);

	var done = assert.async(),
		sequence = 1;

	$("#tree").fancytree({
		source: TEST_DATA,
		clickFolderMode: 3,
		generateIds: true, // for testing
		beforeActivate: function(event, data){
			assert.equal(sequence++, 1, "receive `beforeActivate` callback");
		},
		activate: function(event, data){
			assert.equal(sequence++, 2, "receive `activate` callback");
		},
		beforeExpand: function(event, data){
			assert.equal(sequence++, 3, "receive `beforeExpand` callback");
		},
		expand: function(event, data){
			assert.equal(sequence++, 4, "receive `expand` callback");
			done();
		}
	});
	$("#tree #ft_10 span.fancytree-title").click();
});


QUnit.test(".click() to select a node", function(assert) {
	tools.setup(assert);
	assert.expect(8);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		checkbox: true,
		generateIds: true, // for testing
		beforeSelect: function(event, data){
			assert.equal(event.type, "fancytreebeforeselect", "receive `beforeSelect` callback");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok(!$(data.node.span).hasClass("fancytree-selected"), "data.node.span has NOT class fancytree-selected");
		},
		select: function(event, data){
			assert.equal(event.type, "fancytreeselect", "receive `select` callback");
			assert.ok(!!data.tree.rootNode, "`data.tree` is the tree object");
			assert.equal($(this).attr("id"), "tree", "`this` is div#tree");
			assert.ok($(data.node.span).hasClass("fancytree-node"), "data.node.span has class fancytree-node");
			assert.ok($(data.node.span).hasClass("fancytree-selected"), "data.node.span has class fancytree-selected");
			done();
		}
	});
	$("#tree #ft_2 span.fancytree-checkbox").click();
});


QUnit.test("'modifyChild' event", function(assert) {
	tools.setup(assert);
	assert.expect(3);

	$("#tree").fancytree({
		source: TEST_DATA,
		modifyChild: function(event, data) {
			var msg = (data.node.isRoot() ? "root" : data.node.key) + "." +
				event.type + "(" + data.operation + ", " +
				(data.childNode ? data.childNode.key : null) + ")";

			if( data.operation === "custom1" ) {
				assert.equal(data.foo, "bar", "pass custom args");
			}
			tools.appendEvent(assert, msg);
		}
	});
	var tree = tools.getTree();

	tree.getNodeByKey("2").setTitle("New title");
	tree.getNodeByKey("2").addChildren({title: "New child", key: "2.1"});
	tree.getNodeByKey("3").remove();
	// move beneath same parent: modify('move')
	tree.getNodeByKey("4").moveTo(tree.getNodeByKey("2"), "before");
	// move to another parent: remove+add
	tree.getNodeByKey("4").moveTo(tree.getNodeByKey("2.1"), "after");
	// sortChildren: sort
	tree.getNodeByKey("2").sortChildren();
	// custom trigger
	tree.getNodeByKey("10").triggerModifyChild("data", tree.getNodeByKey("10_1"));
	assert.throws(function(){
		tree.getNodeByKey("10").triggerModifyChild("data", tree.getNodeByKey("2"));
	}, "raise error if childNode is invalid");
	tree.getNodeByKey("5").triggerModify("custom1", {foo: "bar"});

	assert.deepEqual(assert.EVENT_SEQUENCE,
			["root.modifyChild(rename, 2)",
			 "2.modifyChild(add, 2.1)",
			 "root.modifyChild(remove, 3)",
			 "root.modifyChild(move, 4)",
			 "root.modifyChild(remove, 4)",
			 "2.modifyChild(add, 4)",
			 "2.modifyChild(sort, null)",
			 "10.modifyChild(data, 10_1)",
			 "root.modifyChild(custom1, 5)"
			 ], "event sequence");
});

/*******************************************************************************
 * generateFormElements
 */
QUnit.module("generateFormElements()");

QUnit.test("multi select", function(assert) {
	tools.setup(assert);
	assert.expect(22);

	var $result, tree;

	$("#tree").fancytree({
		source: TEST_DATA,
		generateIds: true
	});
	tree = $.ui.fancytree.getTree();

	$result = $("#fancytree_result_" + tree._id);
	assert.equal($result.length, 0, "result <div> not yet created");

	tree.generateFormElements();
	$result = $("#fancytree_result_" + tree._id);
	assert.equal($result.length, 1, "result <div> created");
	assert.equal($result.is(":visible"), false, "result is hidden");
	assert.equal($result.find("input").length, 0, "initial result is empty");

	tools.getNode("10_1").setActive();

	tools.getNode("10").setSelected();
	tools.getNode("10_1").setSelected();
	tools.getNode("10_1_1").setSelected();
	tools.getNode("10_1_2").setSelected();

	tree.generateFormElements();

	assert.equal($result.find("input[type=radio]").length, 1,
		"one radio input element created for active node");
	assert.equal($result.find("input[type=radio]").attr("name"), "ft_" + tree._id + "_active",
		"radio input name is 'ft_TREEID_active'");
	assert.equal($result.find("input[type=radio]").attr("value"), "10_1",
		"radio input value is set to node key");
	assert.equal($result.find("input[type=radio]").attr("checked"), "checked",
		"radio input is checked");

	assert.equal($result.find("input[type=checkbox]").length, 4,
		"multiple checkbox input elements created for selected nodes");
	assert.equal($result.find("input[name=ft_" + tree._id + "\\[\\]]").length, 4,
		"checkboxes name is 'ft_TREEID[]'");
	assert.equal($result.find("input[type=checkbox][value=10_1]").length, 1,
		"checkboxes value is set to node keys");
	assert.equal($result.find("input[type=checkbox]:checked").length, 4,
		"checkboxes are checked");

	tree.generateFormElements(false, true);

	assert.equal($result.find("input[type=radio]").length, 1,
		"only active node created");
	assert.equal($result.find("input[type=checkbox]").length, 0,
		"disable generation of selected nodes");

	tree.generateFormElements(true, false);

	assert.equal($result.find("input[type=radio]").length, 0,
		"disable generation of active node");
	assert.equal($result.find("input[type=checkbox]").length, 4,
		"only selected nodes created");

	tree.generateFormElements("cust_sel", "cust_act");

	assert.equal($result.find("input[name=cust_act]").length, 1,
		"custom name for active node");
	assert.equal($result.find("input[name=cust_sel]").length, 4,
		"custom name for selected nodes");

	tree.generateFormElements(true, true, {stopOnParents: true});

	assert.equal($result.find("input[type=checkbox]").length, 4,
		"stopOnParents ignored for selectMode 2");

	tree.generateFormElements(true, true, {
		filter: function(node) {
			return true;
		}
	});
	assert.equal($result.find("input[type=checkbox]").length, TESTDATA_NODES,
		"filter => true: generate all nodes");

	tree.generateFormElements(true, true, {
		filter: function(node) {
			return node.isSelected();
		}
	});
	assert.equal($result.find("input[type=checkbox]").length, 4,
		"filter => isSelected(): generate selected nodes");

	tree.generateFormElements(true, true, {
		filter: function(node) {
			return node.isActive();
		}
	});
	assert.equal($result.find("input[type=checkbox]").length, 1,
		"filter => isActive(): generate selected nodes");
});


QUnit.test("selectMode: 3", function(assert) {
	tools.setup(assert);
	assert.expect(4);

	var $result, tree;

	$("#tree").fancytree({
		source: TEST_DATA,
		selectMode: 3,
		generateIds: true
	});
	tree = $.ui.fancytree.getTree();

	tools.getNode("10_1").setActive();

	tools.getNode("10").setSelected();
	tools.getNode("10_1").setSelected();
	tools.getNode("10_1_1").setSelected();
	tools.getNode("10_1_2").setSelected();

	tree.generateFormElements();
	$result = $("#fancytree_result_" + tree._id);

	assert.equal($result.find("input[type=radio]").length, 1,
		"generation of active node");
	assert.equal($result.find("input[type=checkbox]").length, 1,
		"stopOnParents: only top node created");

	tree.generateFormElements(true, true, {stopOnParents: false});

	assert.equal($result.find("input[type=radio]").length, 1,
		"generation of active node");
	assert.equal($result.find("input[type=checkbox]").length, 7,
		"stopOnParents: false: all nodes created");
});


/*******************************************************************************
 * Lazy loading
 */
QUnit.module("lazy loading");

QUnit.test("Using ajax options for `source`; .click() expands a lazy folder", function(assert) {
	tools.setup(assert);
	assert.expect(23);

	var done = assert.async(),
		sequence = 1,
		isClicked = false;

	$("#tree").fancytree({
		source: {url: "ajax-tree.json"},
		generateIds: true,
		init: function(event, data){
			assert.equal(sequence++, 3, "receive `init` callback");
			assert.equal(data.tree.count(), TESTDATA_NODES, "lazy tree has 23 nodes");
			assert.equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has rendered 13 node elements");
			assert.equal(data.tree.getRootNode().isLoading(), false, "rootNode.isLoading() return false in init");
			assert.equal(data.tree.isLoading(), false, "tree.isLoading() return false in init");

			// now expand a lazy folder
			isClicked = true;
			$("#tree #ft_30 span.fancytree-expander").click();
		},
		beforeExpand: function(event, data){
			assert.equal(sequence++, 4, "receive `beforeExpand` callback");
		},
		lazyLoad: function(event, data){
			assert.equal(sequence++, 5, "receive `lazyLoad` callback");
			assert.equal(data.node.isLoading(), false, "node.isLoading()");

			data.result = {url: "ajax-sub2.json"};
		},
		postProcess: function(event, data){
			if( !isClicked ) {
				assert.equal(sequence++, 1, "receive `postProcess` callback for root");
				assert.equal(data.node.isLoading(), true, "node.isLoading() return true in initial postProcess");
				assert.equal(data.tree.isLoading(), true, "tree.isLoading() return true in initial postProcess");
				assert.equal(data.node.children.length, 1, "Dummy status node exists");
				assert.equal(data.node.children[0].statusNodeType, "loading", "node.statusNodeType === 'loading'");
			} else {
				assert.equal(sequence++, 6, "receive `postProcess` callback for node");
				assert.equal(data.node.isLoading(), true, "node.isLoading() return true in node postProcess");
				assert.equal(data.tree.isLoading(), true, "tree.isLoading() return true in node postProcess");
			}
		},
		loadChildren: function(event, data){
			if( !isClicked ) {
				assert.equal(sequence++, 2, "receive `loadChildren` callback on init tree");
			} else {
				assert.equal(sequence++, 7, "receive `loadChildren` callback on load node");
				assert.equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
				assert.equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has not yet rendered new node elements");
			}
		},
		expand: function(event, data){
			assert.equal(sequence++, 8, "receive `expand` callback");
			assert.equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
			assert.equal($("#tree li").length, TESTDATA_VISIBLENODES + 2, "lazy tree has rendered 15 node elements");
			done();
		}
	});
});

QUnit.test("Call `postProcess` for non-ajax `source`", function(assert) {
	tools.setup(assert);
	assert.expect(3);

	var done = assert.async();

	$("#tree").fancytree({
		source: [{title: "node 1", key: "id1"}, {title: "node 2", key: "id2"}],
		generateIds: true,
		postProcess: function(event, data){
			assert.equal(data.response.length, 2, "receive `postProcess` callback");
			data.result = [{title: "node 3", key: "id3"}];
		},
		init: function(event, data){
			assert.ok(data.tree.getNodeByKey("id1") === null, "");
			assert.ok(data.tree.getNodeByKey("id3") !== null, "");
			done();
		}
	});
});

QUnit.test("Using $.ajax promise for `source`; .click() expands a lazy folder", function(assert) {
	tools.setup(assert);
	assert.expect(12);

	var done = assert.async(),
		sequence = 1,
		isClicked = false;

	$("#tree").fancytree({
		source: $.ajax({
			url: "ajax-tree.json",
			dataType: "json"
		}),
		generateIds: true,
		init: function(event, data){
			assert.equal(sequence++, 2, "receive `init` callback");
			assert.equal(data.tree.count(), TESTDATA_NODES, "lazy tree has 23 nodes");
			assert.equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has rendered 13 node elements");
			// now expand a lazy folder
			isClicked = true;
			$("#tree #ft_30 span.fancytree-expander").click();
		},
		beforeExpand: function(event, data){
			assert.equal(sequence++, 3, "receive `beforeExpand` callback");
		},
		lazyLoad: function(event, data){
			assert.equal(sequence++, 4, "receive `lazyLoad` callback");
			data.result = $.getJSON("ajax-sub2.json");
		},
		loadChildren: function(event, data){
			if( !isClicked ) {
				assert.equal(sequence++, 1, "receive `loadChildren` callback on init tree");
			} else {
				assert.equal(sequence++, 5, "receive `loadChildren` callback on load node");
				assert.equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
				assert.equal($("#tree li").length, TESTDATA_VISIBLENODES, "lazy tree has not yet rendered new node elements");
			}
		},
		expand: function(event, data){
			assert.equal(sequence++, 6, "receive `expand` callback");
			assert.equal(data.tree.count(), TESTDATA_NODES + 2, "lazy tree has 25 nodes");
			assert.equal($("#tree li").length, TESTDATA_VISIBLENODES + 2, "lazy tree has rendered 15 node elements");
			done();
		}
	});
});

/******************************************************************************/

QUnit.module("Selection mode 3");

QUnit.test("load behavior", function(assert) {
	tools.setup(assert);
	assert.expect(30);

	var tree;

	$("#tree").fancytree({
		selectMode: 3,
		checkbox: true,
		source: [
			{title: "n1", children: [
				{title: "n1.1", selected: true},
				{title: "n1.2", selected: false},
				{title: "n1.3", selected: null}
			]},
			{title: "n2 (all selected)", children: [
				{title: "n2.1", selected: true, unselectable: true, unselectableStatus: true},
				{title: "n2.2", selected: true, unselectable: true, unselectableStatus: false},
				{title: "n2.3", selected: true, unselectable: true, unselectableStatus: null}
			]},
			{title: "n3", children: [
				{title: "n3.1", children: [
					{title: "n3.1.1 (unselectable)", unselectable: true},
					{title: "n3.1.2 (unselectable)", unselectable: true},
					{title: "n3.1.3"}
				]},
				{title: "n3.2", children: [
					{title: "n3.2.1 (unselectableStatus: true)", unselectable: true, unselectableStatus: true},
					{title: "n3.2.2 (unselectableStatus: false)", unselectable: true, unselectableStatus: false},
					{title: "n3.2.3"}
				]},
				{title: "n3.3", children: [
					{title: "n3.3.1 (unselectableStatus: true, unselectableIgnore)", unselectable: true, unselectableStatus: true,  unselectableIgnore: true},
					{title: "n3.3.2 (unselectableStatus: false, unselectableIgnore)", unselectable: true, unselectableStatus: false, unselectableIgnore: true},
					{title: "n3.3.3"}
				]}
			]},
			{title: "n4 (radiogroup)", radiogroup: true, unselectable: true, children: [
				{title: "n4.1 (selected)", selected: true},
				{title: "n4.2"},
				{title: "n4.3"}
			]}
		],
		init: function(event, data) {
			// Set key from first part of title
			data.tree.visit(function(n) {
				n.key = n.title.split(" ")[0];
			});
		},
		generateIds: true
	});
	tree = $.ui.fancytree.getTree();

	tools.getNode("n1").setSelected();

	assert.equal(tools.getNode("n1.1").selected, true,
		"propagate down `select` (simple child) 1/3");
	assert.equal(tools.getNode("n1.2").selected, true,
		"propagate down `select` (simple child) 2/3");
	assert.equal(tools.getNode("n1.3").selected, true,
		"propagate down `select` (simple child) 3/3");

	tools.getNode("n1").setSelected(false);

	assert.equal(tools.getNode("n1.1").selected, false,
		"propagate down `deselect` (simple child)");

	tools.getNode("n2").setSelected();

	assert.equal(tools.getNode("n2.1").selected, true,
		"propagate down `select` (unselectable status: true)");
	assert.equal(tools.getNode("n2.2").selected, false,
		"propagate down `select` (unselectable status: false)");
	assert.equal(tools.getNode("n2.3").selected, true,
		"propagate down `select` (unselectable status: undefined)");

	tools.getNode("n2").setSelected(false);

	assert.equal(tools.getNode("n2.1").selected, true,
		"propagate down `deselect` (unselectable status: true)");
	assert.equal(tools.getNode("n2.2").selected, false,
		"propagate down `deselect` (unselectable status: false)");
	assert.equal(tools.getNode("n2.3").selected, false,
		"propagate down `deselect` (unselectable status: undefined)");

	// Check upward propagation

	tools.getNode("n3").setSelected(true);

	assert.equal(tools.getNode("n3.1").isSelected(), true,
		"propagate down `select` (unselectable): parent selected");
	assert.equal(tools.getNode("n3.1.1").isSelected(), true,
		"propagate down `select` (unselectable): selected by api");

	assert.equal(tools.getNode("n3.2").isPartsel(), true,
		"propagate down `select` (unselectable status: true&false): parent partsel");

	assert.equal(tools.getNode("n3.3").isSelected(), true,
		"propagate down `select` (unselectable status: true&false, ignore): parent selected");
	assert.equal(tools.getNode("n3.3.2").isSelected(), false,
		"propagate down `select` (unselectable status: false): not selected");

	tools.getNode("n3").setSelected(false);

	assert.equal(tools.getNode("n3.1").isPartsel(), false,
		"propagate down `deselect` (unselectable): parent not partsel");
	assert.equal(tools.getNode("n3.1.1").isSelected(), false,
		"propagate down `deselect` (unselectable): deselected by api");

	assert.equal(tools.getNode("n3.2").isPartsel(), true,
		"propagate down `deselect` (unselectable status: true&false): parent partsel");
	assert.equal(tools.getNode("n3.2.1").isSelected(), true,
		"propagate down `deselect` (unselectable status: true): not deselected");

	assert.equal(tools.getNode("n3.3").isPartsel(), false,
		"propagate down `deselect` (unselectable status: true&false, ignore): parent not partsel");
	assert.equal(tools.getNode("n3.3").isSelected(), false,
		"propagate down `deselect` (unselectable status: true&false, ignore): parent not selected");
	assert.equal(tools.getNode("n3.3.1").isSelected(), true,
		"propagate down `deselect` (unselectable status: true): not deselected");

	tools.getNode("n3.2.3").setSelected(true);

	assert.equal(tools.getNode("n3.2").isPartsel(), true,
		"propagate up `select`: parent partsel, because of deselected sibling");

	tools.getNode("n3.2.3").setSelected(false);

	assert.equal(tools.getNode("n3.2").isPartsel(), true,
		"propagate up `deselect`: parent partsel, because of selected sibling");

	tools.getNode("n3.3.3").setSelected(true);

	assert.equal(tools.getNode("n3.3").isSelected(), true,
		"propagate up `select`: parent selected, because of ignored siblings");

	tools.getNode("n3.3.3").setSelected(false);

	assert.equal(tools.getNode("n3.3").isSelected(), false,
		"propagate up `deselect`: parent deselected, because of ignored siblings");

	// radiogroup

	tools.getNode("n4.1").setSelected();

	assert.equal(tools.getNode("n4.1").isSelected(), true,
		"radiogroup `select`: select first");
	assert.ok(!tools.getNode("n4.2").isSelected() && !tools.getNode("n4.3").isSelected(),
		"radiogroup `select`: deselect siblings");

	tools.getNode("n4.3").setSelected();

	assert.equal(tools.getNode("n4.3").isSelected(), true,
		"radiogroup `select`: select last");
	assert.ok(!tools.getNode("n4.1").isSelected() && !tools.getNode("n4.2").isSelected(),
		"radiogroup `select`: deselect siblings");

	tree.visit(function(n){
		n.setExpanded();
	});
});


/*******************************************************************************
 *
 */
QUnit.module("add children & patches");

QUnit.test("add children", function(assert) {
	tools.setup(assert);
	assert.expect(15);

	var done = assert.async(),
		childList = [
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
		source: TEST_DATA,
		lazyLoad: function(event, data){
			data.result = {url: "ajax-sub2.json"};
		},
		init: function(event, data){
			data.tree.rootNode.addChildren(childList);

			assert.equal(tools.getNodeTitle("test1"), "New 1", "simple node");
			var $span = $(tools.getNode("test1").span);
//			assert.equal($span.find("a.fancytree-title").attr("title"), "new tip", "set tooltip");
			assert.equal($span.find("span.fancytree-title").attr("title"), "new tip", "set tooltip");
			assert.equal(tools.getNode("test1").data.foo, "works", "set custom data");

			assert.equal(tools.getNode("test2").isFolder(), true, "is folder");
			assert.equal(tools.getNode("test2").isExpanded(), false, "folder was collapsed");
			assert.equal($(tools.getNode("test2").span).hasClass("fancytree-expanded"), false, "folder was rendered as collapsed");
			assert.equal(tools.getNode("test2_1").title, "New 2.1", "subnode created");
			assert.equal(tools.getNodeTitle("test2_1"), null, "subnode NOT rendered");

			assert.equal(tools.getNode("test3").expanded, true, "node was expanded");
			assert.equal($(tools.getNode("test3").span).hasClass("fancytree-expanded"), true, "folder was rendered as expanded");
			assert.equal(tools.getNode("test3_1").title, "New 3.1", "subnode created");
			assert.equal(tools.getNodeTitle("test3_1"), "New 3.1", "subnode rendered expanded");
			assert.equal(tools.getNode("test3_1").isSelected(), true, "select");
			assert.equal($(tools.getNode("test3_1").span).hasClass("fancytree-selected"), true, "node was rendered as selected");
			assert.equal($(tools.getNode("test3_2").span).hasClass("customClass"), true, "set custom class");

//            deepEqual(tools.EVENT_SEQUENCE, [], "event sequence");

			done();
		}
	});
});

QUnit.test("apply patch", function(assert) {
	tools.setup(assert);
	assert.expect(19);

	var done = assert.async(),
		patchList = [
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
		source: TEST_DATA,
		lazyLoad: function(event, data){
			data.result = {url: "ajax-sub2.json"};
		},
		init: function(event, data){
			data.tree.applyPatch(patchList).done(function(){
				// tools.appendEvent(assert, "done");
				assert.ok(true, "called done()");

				var $span = $(tools.getNode("2").span);
				assert.equal(tools.getNodeTitle("2"), "node 2: new", "rename nodes");
//				assert.equal($span.find("a.fancytree-title").attr("title"), "new tip", "set tooltip");
				assert.equal($span.find("span.fancytree-title").attr("title"), "new tip", "set tooltip");
				assert.equal(tools.getNode("2").data.foo, "works", "set custom data");

				assert.ok(tools.getNode("3").isSelected(), "select");
				assert.ok($(tools.getNode("3").span).hasClass("fancytree-selected"), "node was rendered as selected");

				assert.ok($(tools.getNode("4").span).hasClass("customClass"), "set custom class");

				assert.equal(tools.getNode("10_1_1").title, "Renamed 10_1_1", "rename hidden");
				assert.equal(tools.getNodeTitle("10_1_1"), null, "rename hidden (not rendered)");

				assert.equal(tools.getNode("10_1_2"), null, "remove nodes");

				assert.equal(tools.getNode("5_1").title, "new 5_1", "add child nodes (created)");
				assert.equal(tools.getNodeTitle("5_1"), null, "add child nodes (NOT rendered)");
				assert.equal(tools.getNode("5_1").parent, tools.getNode("5"), "add child nodes (linked)");

				assert.equal(tools.getNode("10").expanded, true, "folder was expanded");
				assert.ok($(tools.getNode("10").span).hasClass("fancytree-expanded"), "folder was rendered as expanded");

				assert.equal(tools.getNode("20").expanded, false, "folder was collapsed");
				assert.ok(!$(tools.getNode("20").span).hasClass("fancytree-expanded"), "folder was rendered as collapsed");

				assert.equal(tools.getNode("30").expanded, true, "lazy node was expanded");
				assert.ok($(tools.getNode("30").span).hasClass("fancytree-expanded"), "node was rendered as expanded");
//                deepEqual(tools.EVENT_SEQUENCE, [], "event sequence");

				// TODO: patch.appendChildren, replaceChildren, insertChildren, ...
//                assert.ok(tools.getNode("40"), "add top-level nodes (created)");
//                equal(tools.getNodeTitle("40"), "new top-level 40", "add top-level nodes (rendered)");
				done();
			});
		}
	});
});

/*******************************************************************************
 *
 */
QUnit.module("keypath");

QUnit.test("loadKeyPath (already loaded)", function(assert) {
	tools.setup(assert);
	assert.expect(1);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA
	});
	var tree = tools.getTree();
	// TODO: test with numeric keys:

	tree.loadKeyPath("/10/10_1/10_1_2", function(node, status){
		tools.appendEvent(assert, status + " #" + (node ? node.key : "null"));
	}).done(function(data){
		tools.appendEvent(assert, "done.");
		assert.deepEqual(assert.EVENT_SEQUENCE,
				["loaded #10",
				 "loaded #10_1",
				 "ok #10_1_2",
				 "done."], "event sequence");
		done();
	});
});

QUnit.test("loadKeyPath (lazy nodes)", function(assert) {
	tools.setup(assert);
	assert.expect(1);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		lazyLoad: function(event, data){
			// fake an async, delayed Ajax request that generates 5 lazy nodes
			data.result = tools.fakeAjaxLoad(data.node, 5, 10);
		}
	});
	var tree = tools.getTree();
	// TODO: test with numeric keys:

	tree.loadKeyPath("/30/30_3/30_3_2", function(node, status){
		tools.appendEvent(assert, status + " #" + (node ? node.key : "null"));
	}).done(function(data){
		tools.appendEvent(assert, "done.");
		assert.deepEqual(assert.EVENT_SEQUENCE,
				["loaded #30",
				 "loading #30",
				 "loaded #30_3",
				 "loading #30_3",
				 "ok #30_3_2",
				 "done."], "event sequence");
		done();
	});
});

QUnit.test("loadKeyPath (Progress event)", function(assert) {
	tools.setup(assert);
	assert.expect(1);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		lazyLoad: function(event, data){
			// fake an async, delayed Ajax request that generates 5 lazy nodes
			data.result = tools.fakeAjaxLoad(data.node, 5, 10);
		}
	});
	var tree = tools.getTree();

	tree.loadKeyPath("/30/30_3/30_3_2").progress(function(data){
		tools.appendEvent(assert, data.status + " #" + (data.node ? data.node.key : "null"));
	}).done(function(data){
		tools.appendEvent(assert, "done.");
		assert.deepEqual(assert.EVENT_SEQUENCE,
				["loaded #30",
				 "loading #30",
				 "loaded #30_3",
				 "loading #30_3",
				 "ok #30_3_2",
				 "done."], "event sequence");
		done();
	});
});

QUnit.test("loadKeyPath (multiple lazy nodes with expand)", function(assert) {
	tools.setup(assert);
	assert.expect(7);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		lazyLoad: function(event, data){
			data.result = tools.fakeAjaxLoad(data.node, 5, [0, 30]);
		}
	});
	var tree = tools.getTree(),
		pathList = ["/30/30_3/30_3_2",
					"/30/30_3/30_3_1",
					"/30/30_5/30_5_1",
					"/30/30_5/30_5_XXX"];

	tree.loadKeyPath(pathList, function(node, status){
		tools.appendEvent(assert, status + " #" + (node.key ? node.key : node));
		if(status === "loaded" || status === "ok"){
			node.makeVisible();
		}
	}).done(function(data){
		tools.appendEvent(assert, "done.");
		// the event sequence depends on random delay, so we check for 'ok' only
		assert.ok($.inArray("ok #30_3_1", assert.EVENT_SEQUENCE) >= 0, "node was loaded");
		assert.equal(tools.getNode("30_3_1").isVisible(), true, "node was expanded");
		assert.ok($.inArray("ok #30_3_2", assert.EVENT_SEQUENCE) >= 0, "node was loaded");
		assert.equal(tools.getNode("30_3_2").isVisible(), true, "node was expanded");
		assert.ok($.inArray("ok #30_5_1", assert.EVENT_SEQUENCE) >= 0, "node was loaded");
		assert.equal(tools.getNode("30_5_1").isVisible(), true, "node was expanded");
		assert.ok($.inArray("error #30_5_XXX", assert.EVENT_SEQUENCE) >= 0, "missing node was reported");
		done();
	});
});


QUnit.test("loadKeyPath (lazy, custom matcher)", function(assert) {
	tools.setup(assert);
	assert.expect(1);

	var done = assert.async();

	$("#tree").fancytree({
		source: TEST_DATA,
		lazyLoad: function(event, data){
			// fake an async, delayed Ajax request that generates 5 lazy nodes
			data.result = tools.fakeAjaxLoad(data.node, 5, 10);
		}
	});
	var tree = tools.getTree();
	// TODO: test with numeric keys:

	tree.loadKeyPath("/Lazy folder/Lazy folder_3/Lazy folder_3_2", {
		matchKey: function(node, key){
			return node.title === key;
		},
		callback: function(node, status){
			tools.appendEvent(assert, status + " #" + (node ? node.key : "null"));
		}
	}).done(function(data){
		tools.appendEvent(assert, "done.");
		assert.deepEqual(assert.EVENT_SEQUENCE,
				["loaded #30",
				 "loading #30",
				 "loaded #30_3",
				 "loading #30_3",
				 "ok #30_3_2",
				 "done."], "event sequence");
		done();
	});
});


QUnit.test("loadKeyPath (multiple lazy nodes with expand; issue #576)", function(assert) {
	tools.setup(assert);
	assert.expect(6);

	var done = assert.async();
/*
https://github.com/mar10/fancytree/issues/576
/30/
	30_1/
		30_1_2/
			30_1_2_3/
				30_1_2_3_4   #1
	30_2/
		30_2_2/
			30_2_2_2/
				30_2_2_2_2    #2
			30_2_2_3/
				30_2_2_3_1	#3
	30_3/
		30_3_3/
			30_3_3_4/
				30_3_3_1	#4
*/
	$("#tree").fancytree({
		selectMode: 2,
		checkbox: true,
		source: [
			{key: "10", title: "Node 10", folder: true, lazy: true },
			{key: "20", title: "Node 20", folder: true, lazy: true },
			{key: "30", title: "Node 30", folder: true, lazy: true }
		],
		lazyLoad: function(event, data){
			data.result = tools.fakeAjaxLoad(data.node, 5, [0, 30]);
		}
	});
	var tree = tools.getTree(),
		pathList = ["/30/30_1/30_1_2/30_1_2_3/30_1_2_3_4",
					"/30/30_2/30_2_2/30_2_2_2/30_2_2_2_2"];

	tree.loadKeyPath(pathList, function(node, status){
		if(/*status === "loaded" ||*/ status === "ok"){
			tools.appendEvent(assert, status + " #" + (node.key ? node.key : node));
			node.makeVisible();
			node.setSelected();
		}
	}).done(function(data){
		tools.appendEvent(assert, "done 1.");

		assert.ok($.inArray("ok #30_1_2_3_4", assert.EVENT_SEQUENCE) >= 0, "node 1 was loaded");
		assert.ok($.inArray("ok #30_2_2_2_2", assert.EVENT_SEQUENCE) >= 0, "node 2 was loaded");
		// assert.deepEqual(assert.EVENT_SEQUENCE,
		// 		["ok #30_1_2_3_4",
		// 		 "ok #30_2_2_2_2",
		// 		 "done 1."], "event sequence");

		pathList = ["/30/30_2/30_2_2/30_2_2_3/30_2_2_3_1",
					"/30/30_3/30_3_3/30_3_3_4/30_3_3_4_1"];

		tree.loadKeyPath(pathList, function(node, status){
			if(/*status === "loaded" || */status === "ok"){
				tools.appendEvent(assert, status + " #" + (node.key ? node.key : node));
				node.makeVisible();
				node.setSelected();
			}
		}).done(function(data){
			tools.appendEvent(assert, "done 2.");
			assert.ok($.inArray("ok #30_1_2_3_4", assert.EVENT_SEQUENCE) >= 0, "node 1 was loaded");
			assert.ok($.inArray("ok #30_2_2_2_2", assert.EVENT_SEQUENCE) >= 0, "node 2 was loaded");
			assert.ok($.inArray("ok #30_2_2_3_1", assert.EVENT_SEQUENCE) >= 0, "node 3 was loaded");
			assert.ok($.inArray("ok #30_3_3_4_1", assert.EVENT_SEQUENCE) >= 0, "node 4 was loaded");
			// assert.deepEqual(assert.EVENT_SEQUENCE,
			// 		["ok #30_1_2_3_4",
			// 		 "ok #30_2_2_2_2",
			// 		 "done 1.",
			// 		 "ok #30_2_2_3_1",
			// 		 "ok #30_3_3_4_1",
			// 		 "done 2."], "event sequence");
			done();
		});
	});
});


});
