jQuery(document).ready(function(){

/*globals TEST_TOOLS, QUnit */

var TEST_DATA, TESTDATA_NODES, TESTDATA_TOPNODES, TESTDATA_VISIBLENODES,
	$ = jQuery,
	// Use tools from test-tools.js
	tools = TEST_TOOLS;


function countVisible(root) {
	var count = 0;
	root.visit(function(n){
		if( $(n.span).is(":visible") ) {
			count++;
		}
	});
	return count;
}

function countMatched(root) {
	var count = 0;
	root.visit(function(n){
		if( n.isMatched() ) {
			count++;
		}
	});
	return count;
}

function countHighlightedChars(filter, tree) {
	var nodesCount = tree.filterNodes(filter);
	var nodes = [];
	tree.getRootNode().visit(function (n) {
		if (n.isMatched()) {
			nodes.push(n);
		}
	});
	const count = nodes.reduce(function (count, n) {
		 return count += $(n.span).find('.fancytree-title mark').length
	}, 0);
	return count;
}

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
		{key: "30", title: "Lazy folder", folder: true, lazy: true }
	];
TESTDATA_NODES = 21,
TESTDATA_TOPNODES = 9,
TESTDATA_VISIBLENODES = 11;


/*******************************************************************************
 * Initialize QUnit
 */

tools.initQUnit();

// Create an Info section (will be expanded when tests are completed)
tools.createInfoSection();

// Silence, please
$.ui.fancytree.debugLevel = 1;


/*******************************************************************************
 * Module Init
 */
QUnit.module("Filter");

QUnit.test("Default options (mode='dimm')", function(assert) {
	var done = assert.async();

	assert.expect(24);
	tools.setup(assert);

	$("#tree").fancytree({
		extensions: ["filter"],
		filter: {
		},
		source: TEST_DATA,
		generateIds: true, // for testing
		init: function(event, data){
			var tree = data.tree;

			// Class methods:
			assert.ok($.isFunction(tree.isFilterActive), "Has tree.isFilterActive()");
			assert.ok($.isFunction(tree.clearFilter), "Has tree.clearFilter()");
			assert.ok($.isFunction(tree.filterNodes), "Has tree.filterNodes()");
			assert.ok($.isFunction(tree.filterBranches), "Has tree.filterBranches()");
			assert.ok($.isFunction(tree.rootNode.isMatched), "Has node.isMatched()");
			// Default options:
			assert.equal(data.options.filter.autoApply, true, "opts.autoApply ===  true");
			assert.equal(data.options.filter.counter, true, "opts.counter ===  true");
			assert.equal(data.options.filter.fuzzy, false, "opts.fuzzy ===  false");
			assert.equal(data.options.filter.hideExpandedCounter, true, "opts.hideExpandedCounter ===  true");
			assert.equal(data.options.filter.highlight, true, "opts.highlight ===  true");
			assert.equal(data.options.filter.mode, "dimm", "opts.mode ===  'dimm'");
			//
			assert.equal(tree.count(), TESTDATA_NODES, "All visible by default");
			assert.equal(countVisible(tree), TESTDATA_VISIBLENODES, "Has some visible nodes");
			assert.equal(countMatched(tree), TESTDATA_NODES, "All matched by default");
			assert.equal(tree.isFilterActive(), false, "No filter active");
			//
			assert.equal(tree.filterNodes("Sub-item 1.1"), 3, "'Sub-item 1.1' matched 3 nodes");
			assert.equal(tree.isFilterActive(), true, "filter is active");
			assert.equal(countMatched(tree), 3, "3 nodes matched");
			assert.equal(countVisible(tree), TESTDATA_VISIBLENODES, "All nodes still visible");
			//
			assert.equal(tree.filterNodes("Sub-item 1.1.1"), 1, "'Sub-item 1.1.1' matched 1 nodes");
			assert.equal(tree.isFilterActive(), true, "filter is active");
			//
			tree.clearFilter();
			assert.equal(tree.isFilterActive(), false, "No filter is active");
			assert.equal(countMatched(tree), TESTDATA_NODES, "all nodes matched after clearFilter");
			assert.equal(countVisible(tree), TESTDATA_VISIBLENODES, "All nodes visible");
			//
			done();
		}
	});
});

QUnit.test("Default options, mode='hide'", function(assert) {
	var done = assert.async();

	assert.expect(8);
	tools.setup(assert);

	$("#tree").fancytree({
		extensions: ["filter"],
		filter: {
			mode: "hide"
		},
		source: TEST_DATA,
		generateIds: true, // for testing
		init: function(event, data){
			var tree = data.tree;

			//
			assert.equal(tree.filterNodes("Sub-item 1.1"), 3, "'Sub-item 1.1' matched 3 nodes");
			assert.equal(tree.isFilterActive(), true, "filter is active");
			assert.equal(countMatched(tree), 3, "3 nodes matched");
			assert.equal(countVisible(tree), 1, "1 (parent) node visible");
			//
			tree.clearFilter();
			assert.equal(tree.isFilterActive(), false, "No filter is active");
			assert.equal(countMatched(tree), TESTDATA_NODES, "all nodes matched after clearFilter");
			assert.equal(countVisible(tree), TESTDATA_VISIBLENODES, "All nodes visible");
			//
			assert.equal(tree.filterNodes("Sub-item 1.1", {leavesOnly: true}),
				  2, "'Sub-item 1.1' / leavesOnly matched 2 nodes");

			done();
		}
	});
});

QUnit.test("Default options, fuzzy=true", function(assert) {
	// Creating a separate source so that other test cases won't get affected.
	var SOURCE = [
		{title: "simple node (no explicit id, so a default key is generated)" },
		{key: "4", title: "this nodes title has [.?*+^$[\\]\\\\(){}|-]"},
		{key: "6", title: "node with some extra classes (will be added to the generated markup)" },
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
		{key: "30", title: "Lazy folder", folder: true, lazy: true }
	];
	var done = assert.async();

	assert.expect(12);
	tools.setup(assert);

	$("#tree").fancytree({
		extensions: ["filter"],
		filter: {
			fuzzy: true,
			autoExpand: true,
		},
		source: SOURCE,
		generateIds: true, // for testing
		init: function(event, data){
			var tree = data.tree;

			assert.equal(tree.filterNodes("("), 4, "'(' Highlighted 1 char");
			assert.equal(tree.filterNodes(")"), 4, "')' Highlighted 1 char");
			assert.equal(tree.filterNodes("[.?*+^$[\\]\\\\(){}|-]"), 1, "'[.?*+^$[\\]\\\\(){}|-]' Fuzzy Matched 1 node");
			assert.equal(tree.filterNodes("Sub-m2"), 10, "'Sub-m2' Fuzzy matched 10 nodes");
			assert.equal(tree.filterNodes("Sub-m2"), 10, "'Sub-m2' Fuzzy matched 10 nodes");
			assert.equal(tree.filterNodes("Sub-item 1."), 8, "'Sub-m2' Fuzzy matched 8 nodes");
			// test how many chars are highlighted
			assert.equal(countHighlightedChars("(", tree), 4, "'(' Fuzzy Matched 4 chars");
			assert.equal(countHighlightedChars(")", tree), 4, "')' Fuzzy Matched 4 chars");
			assert.equal(countHighlightedChars("[.?*+^$[\\]\\\\(){}|-]", tree), "[.?*+^$[\\]\\\\(){}|-]".length, "'[.?*+^$[\\]\\\\(){}|-]' Fuzzy Matched " + "[.?*+^$[\\]\\\\(){}|-]".length + " chars");
			assert.equal(countHighlightedChars("Sub-m2", tree), 10 * "Sub-m2".length, "'Sub-m2' Fuzzy matched " + 10 * "Sub-m2".length + " chars");
			assert.equal(countHighlightedChars("Sub-m2", tree), 10 * "Sub-m2".length, "'Sub-m2' Fuzzy matched " + 10 * "Sub-m2".length + " chars");
			assert.equal(countHighlightedChars("Sub-item 1.", tree), 8 * "Sub-item 1.".length, "'Sub-m2' Fuzzy matched " + 6 * "Sub-item 1.".length + " nodes");

			done();
		}
	});
});

QUnit.test("Default Options, escapeTitle=true, fuzzy=true", function(assert) {
	// Creating a separate source so that other test cases won't get affected.
	var SOURCE = [
		{title: "simple node (no explicit id, so a default key is generated)" },
		{title: "<script>Escaped One?</script>" },
		{title: "<script>Escaped Two?</script>" },
		{title: "<script>Escaped Three?</script>" },
		{key: "4", title: "this nodes title has [.?*+^$[\\]\\\\(){}|-]"},
		{key: "6", title: "node with some extra classes (will be added to the generated markup)" },
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
		{key: "30", title: "Lazy folder", folder: true, lazy: true }
	];
	var done = assert.async();

	assert.expect(16);
	tools.setup(assert);

	$("#tree").fancytree({
		extensions: ["filter"],
		escapeTitles: true,
		filter: {
			fuzzy: true,
			autoExpand: true,
		},
		source: SOURCE,
		generateIds: true, // for testing
		init: function(event, data){
			var tree = data.tree;

			assert.equal(tree.filterNodes("("), 4, "'(' Highlighted 1 char");
			assert.equal(tree.filterNodes(")"), 4, "')' Highlighted 1 char");
			assert.equal(tree.filterNodes("[.?*+^$[\\]\\\\(){}|-]"), 1, "'[.?*+^$[\\]\\\\(){}|-]' Fuzzy Matched 1 node");
			assert.equal(tree.filterNodes("Sub-m2"), 10, "'Sub-m2' Fuzzy matched 10 nodes");
			assert.equal(tree.filterNodes("Sub-m2"), 10, "'Sub-m2' Fuzzy matched 10 nodes");
			assert.equal(tree.filterNodes("Sub-item 1."), 8, "'Sub-m2' Fuzzy matched 8 nodes");
			assert.equal(tree.filterNodes("Esed"), 5, "'Esed' Fuzzy matched 5 nodes");
			assert.equal(tree.filterNodes(">Esed"), 3, "'Esed' Fuzzy matched 3 nodes");

			// test how many chars are highlighted
			assert.equal(countHighlightedChars("(", tree), 4, "'(' Fuzzy Matched 4 chars");
			assert.equal(countHighlightedChars(")", tree), 4, "')' Fuzzy Matched 4 chars");
			assert.equal(countHighlightedChars("[.?*+^$[\\]\\\\(){}|-]", tree), "[.?*+^$[\\]\\\\(){}|-]".length, "'[.?*+^$[\\]\\\\(){}|-]' Fuzzy Matched " + "[.?*+^$[\\]\\\\(){}|-]".length + " chars");
			assert.equal(countHighlightedChars("Sub-m2", tree), 10 * "Sub-m2".length, "'Sub-m2' Fuzzy matched " + 10 * "Sub-m2".length + " chars");
			assert.equal(countHighlightedChars("Sub-m2", tree), 10 * "Sub-m2".length, "'Sub-m2' Fuzzy matched " + 10 * "Sub-m2".length + " chars");
			assert.equal(countHighlightedChars("Sub-item 1.", tree), 8 * "Sub-item 1.".length, "'Sub-item 1.' Fuzzy matched " + 8 * "Sub-item 1.".length + " chars");
			assert.equal(countHighlightedChars("Esed", tree), 5 * "Esed".length, "'Esed' Fuzzy matched " + 5 * "Esed".length + " chars");
			assert.equal(countHighlightedChars(">Esed", tree), 3 * ">Esed".length, "'Esed' Fuzzy matched " + 3 * ">Esed".length + " chars");

			done();
		}
	});
});

});
