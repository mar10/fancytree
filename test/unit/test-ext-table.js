jQuery(document).ready(function(){

/*globals QUnit, TEST_TOOLS */

var $ = jQuery,
	tools = TEST_TOOLS,
	treedata = [
		{ key: "1", title: "item 1" },
		{ key: "2", title: "item 2", children: [
			{ key: "2_1", title: "item 2_1" },
			{ key: "2_2", title: "item 2_2", children: [
				{ key: "2_2_1", title: "item 2_2_1" },
				{ key: "2_2_2", title: "item 2_2_2" }
			] }
		]}
	];

/*******************************************************************************
 * Initialize QUnit
 */

tools.initQUnit();

// Create an Info section (will be expanded when tests are completed)
tools.createInfoSection();

// Silence, please
$.ui.fancytree.debugLevel = 1;


/*******************************************************************************
 * Tool functions
 */

/** Get FancytreeNode from current tree. */
function _getNode(key){
	return $.ui.fancytree.getTree("#tree").getNodeByKey(key);
}


/*******************************************************************************
 *
 */
QUnit.module("Table ext");

QUnit.test("makeVisible not rendered deep node", function(assert) {
	var node,
		done = assert.async();

	tools.setup(assert);
	assert.expect(5);

	$("#tree").fancytree({
		extensions: [ "table" ],
		source: treedata
	});

	node = _getNode("2_2_2");
	assert.ok(node);
	assert.ok(!node.parent.isExpanded());
	assert.ok(!node.tr); // not rendered yet

	node.makeVisible().done(function() {
		assert.ok(node.parent.isExpanded());
		assert.ok(node.tr, node + " tr is rendered");

		done();
	});
});

QUnit.test("render deep node", function(assert) {
	tools.setup(assert);
	assert.expect(11);

	$("#tree").fancytree({
		extensions: [ "table" ],
		source: treedata
	});

	var node,
		tree = $.ui.fancytree.getTree("#tree");

	node = _getNode("2_2_2");
	assert.ok(node);
	assert.ok(!node.parent.isExpanded());
	assert.ok(!node.tr, "not rendered yet");

	tree.render();

	assert.ok(!node.parent.isExpanded());
	assert.ok(!node.tr, "not rendered yet");

	tree.render(true, true);

	tree.visit(function (node) {
		// ok(node.parent.isExpanded(), node.parent + " is expanded");
		assert.ok(node.tr, node + " tr is rendered");
	});
});

});
