jQuery(document).ready(function(){

/*globals TEST_TOOLS, QUnit */

var $ = jQuery,
	// Use tools from test-tools.js
	tools = TEST_TOOLS;

/* *****************************************************************************
 * QUnit setup
 */
QUnit.log(function(data) {
	if(window.console && window.console.log) {
		window.console.log(data.result + " :: " + data.message);
	}
});

QUnit.done(function( details ) {
	// Expand last section when all tests are run
	$("ol#qunit-tests > li").last().find(">ol").show("slow");
});



/* *****************************************************************************
 * Helpers
 */

function makeTree() {
	var $tree = $("#tabletree").fancytree({
			extensions: ["table"],
			source: [],
			table: {
				indentation: 20,  // indent 20px per node level
				nodeColumnIdx: 1  // render the node title into the 2nd column
			},
			renderColumns: function(event, data) {
				var node = data.node,
					$tdList = $(node.tr).find(">td");
				$tdList.eq(0).text(node.getIndexHier()).addClass("alignRight");
	//			(index #1 is rendered by fancytree)
				$tdList.eq(2).append( $("<span>", {
					text: "foo"
					}));
				$tdList.eq(3).append( $("<span>", {
					"class": "fancytree-icon"
					}));
				$tdList.eq(4).text("Homer Simpson");
				$tdList.eq(5).html("<input type='text' name='cb1' value='" + node.key + "'>");
			}
		});

	return $tree.fancytree("getTree");
}


/* *****************************************************************************
 *
 */
QUnit.module("Issue 706 (add top node to very large tree)");

QUnit.test("tabletree (6 columns): Add 1 node to 250,000 nodes (500 top level)", function(assert) {
	assert.expect(4);

	var tree = makeTree(),
		node = tree.getRootNode(),
		done = assert.async(),
		timer = new tools.AsyncTimer(assert, "500 top level nodes with 500 children each", 250000);

	tools.benchmarkWithReflowAsync(assert, tree, "Add 500x500 nodes", null, function(){
		tools.addGenericNodes(node, {level1: 500, level2: 500 });
	}).done(function(){
		tools.benchmarkWithReflowAsync(assert, tree, "Expand 20 top folders", null, function(){
			for( var i=0; i<20; i++ ) {
				// Render markup (even if collasped) for 20 top-level nodes:
				// node.children[i].render(true, true);
				// Expand 20 top-level nodes
				node.children[i].setExpanded(true);
			}
		}).done(function(){
			tools.benchmarkWithReflowAsync(assert, tree, "Add one more top node", null, function() {
				// Add one single top-level node (as second node)
				node.addChildren({title: "New1", children: [{title: "New 1.1"}]},
					node.children[1]);
			}).done(function(){
				timer.stop();
				done();
			});
		});
	});
});


/* *****************************************************************************
 *
 */

tools.createInfoSection();
// ---
});
