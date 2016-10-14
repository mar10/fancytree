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
 * QUnit setup
 */

QUnit.log(function(data) {
	if (window.console && window.console.log) {
//		window.console.log(data.result + " :: " + data.message);
	}
});


/*******************************************************************************
 * Tool functions
 */

/** Get FancytreeNode from current tree. */
function _getNode(key){
	return $("#tree").fancytree("getTree").getNodeByKey(key);
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
		tree = $("#tree").fancytree("getTree");

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
