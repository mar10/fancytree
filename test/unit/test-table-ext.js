jQuery(document).ready(function(){

// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*globals deepEqual,equal,expect,module,ok,QUnit,start,stop,test */

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

/** Helper to reset environment for asynchronous Fancytree tests. */
function _setupAsync(){
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	EVENT_SEQUENCE = [];
	stop();
}

/** Get FancytreeNode from current tree. */
function _getNode(key){
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey(key);
	return node;
}


/*******************************************************************************
 *
 */
module("Table ext");

test("makeVisible not rendered deep node", function () {
	_setupAsync();
	expect(5);

	var treedata = [
			{ key: "1", title: "item 1" },
			{ key: "2", title: "item 2", children: [
				{ key: "2_1", title: "item 2_1" },
				{ key: "2_2", title: "item 2_2", children: [
					{ key: "2_2_1", title: "item 2_2_1" },
					{ key: "2_2_2", title: "item 2_2_2" }

				] }
			]}
		],
		node;

	$("#tree").fancytree({
		extensions: [ "table" ],
		source: treedata
	});

	node = _getNode("2_2_2");
	ok(node);
	ok(!node.parent.isExpanded());
	ok(!node.tr); // not rendered yet

	node.makeVisible().done(function () {
		ok(node.parent.isExpanded());
		ok(node.tr); // rendered

		start();
	});
});

});
