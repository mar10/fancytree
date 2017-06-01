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
	$("ol#qunit-tests > li:last > ol").show("slow");
});

/* *****************************************************************************
 * Tool functions
 */


function _resetEmptyTree(options){
	// destroy all trees
	$(":ui-fancytree").fancytree("destroy");

	var opts,
		$tree = $("#tree");

	opts = $.extend({
		source: [{title: "root node", key: "root"}],
		toggleEffect: false
	}, options);
	$tree.fancytree(opts);
	return $tree.fancytree("getTree");
}


function addNodes(node, level1, level2, level3, forceUpdate) {
	tools.addGenericNodes(node, {
		level1: level1,
		level2: level2,
		level3: level3,
		disableUpdate: !forceUpdate
	});
}


//*****************************************************************************

QUnit.module("API");

QUnit.test("Trigger events", function(assert) {
	assert.expect(3);
	tools.benchmark(assert, "10000 createNode DOM events (widget._trigger())", 10000, function() {
		var i,
			tree = _resetEmptyTree({
				createNode: function(event, data){}
				}),
			node = tree.getNodeByKey("root");
		for(i=0; i<10000; i++){
			tree._triggerNodeEvent.call(tree, "createNode", node);
		}
	});
	tools.benchmark(assert, "10000 createNode callback events (options.createNode() defined)", 10000, function() {
		var i,
			tree = _resetEmptyTree({
				createNode: function(event, data){}
				});
		for(i=0; i<10000; i++){
			if(tree.options.createNode){
				tree.options.createNode.call(tree, {}, {});
			}
		}
	});
	tools.benchmark(assert, "10000 createNode callback events (options.createNode() undefined)", 10000, function() {
		var i,
			tree = _resetEmptyTree({});

		for(i=0; i<10000; i++){
			if(tree.options.createNode){
				tree.options.createNode.call(tree, {}, {});
			}
		}
	});
});


//*****************************************************************************

QUnit.module("Standard tree");

QUnit.test("Add nodes using API to collapsed node (no rendering)", function(assert) {
	assert.expect(3);

	var tree = _resetEmptyTree();
	tools.benchmark(assert, "1000 nodes flat", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 1000, 0, 0);
	});

	tree = _resetEmptyTree();
	tools.benchmark(assert, "1000 nodes deep (10x10x10)", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
	});

	tree = _resetEmptyTree({aria: false});
	tools.benchmark(assert, "1000 nodes deep (10x10x10) without ARIA", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
	});
});


QUnit.test("Create and render hidden nodes, but don't make visible (i.e. don't expand)", function(assert) {
	assert.expect(3);

	var tree = _resetEmptyTree();
	tools.benchmark(assert, "1000 nodes flat and force render(deep=true)", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 1000, 0, 0);
		tree.render(true, true);
	});

	tree = _resetEmptyTree();
	tools.benchmark(assert, "1000 nodes deep (10x10x10) and force render(deep=true)", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
		tree.render(true, true);
	});

	tree = _resetEmptyTree({aria: false});
	tools.benchmark(assert, "1000 nodes deep (10x10x10) and force render(deep=true) without ARIA", 1000, function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
		tree.render(true, true);
	});
});


QUnit.test("Expand 1000 nodes deep (with 10 top level nodes, triggers expand -> render and display)", function(assert) {
	assert.expect(5);

	var tree = _resetEmptyTree(),
		node = tree.getNodeByKey("root"),
		done = assert.async(),
		timer = new tools.AsyncTimer(assert, "1000 deep (10x10x10) with expand", 1000);

	addNodes(node, 10, 10, 10);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.subtime("expand done");
		// force browser to re-flow?
		//jshint unused:false
		var dummy = tree.$div[0].offsetHeight;
		timer.subtime("calc offsetHeigth, (force reflow?)");
		setTimeout(function(){
			// yield, so browser can redraw
			timer.subtime("setTimeout(0) to allow reflow/redraw");
			timer.stop();
			done();
		}, 0);
	});
});


QUnit.test("Expand 1000 top level nodes (triggers expand -> render and display)", function(assert) {
	assert.expect(2);

	var tree = _resetEmptyTree(),
		node = tree.getNodeByKey("root"),
		done = assert.async(),
		timer = new tools.AsyncTimer(assert, "1000 top level nodes flat with expand", 1000);

	addNodes(node, 1000, 0, 0);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.stop();
		done();
	});
});


QUnit.test("Expand 1000 top level nodes with ARIA and checkboxes (triggers expand -> render and display)", function(assert) {
	assert.expect(2);

	var tree = _resetEmptyTree({
			aria: true,
			checkbox:true
		}),
		done = assert.async(),
		node = tree.getNodeByKey("root"),
		timer = new tools.AsyncTimer(assert, "1000 top level nodes flat with expand", 1000);

	addNodes(node, 1000, 0, 0);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.stop();
		done();
	});
});


/* *****************************************************************************
 *
 */
QUnit.module("Table tree");

function _renderTable(assert, options) {
	var node, timer, tree, $tree,
		done = assert.async(),
		opts = $.extend({
			count: 1,
			count2: 0,
			count3: 0,
			forceUpdate: false,
			expandBefore: false,
			expandAfter: false
		}, options),
		totalCount = opts.count * Math.max(1, opts.count2) * Math.max(1, opts.count3);

	assert.expect(2);

	_resetEmptyTree();

	$tree = $("#tabletree").fancytree({
		extensions: ["table"],
		source: [{title: "root node", key: "root"}],
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

	tree = $tree.fancytree("getTree");
	node = tree.getNodeByKey("root");
	timer = new tools.AsyncTimer(assert, totalCount + " nodes", totalCount);
	// timer = new tools.AsyncTimer(assert, totalCount + " nodes flat and expand", totalCount);
//    var timer = new AsyncTimer(assert, "1000 nodes (10 x 10 x 10) and force render(deep=true)");

	if( opts.expandBefore ) {
		node.addChildren({title: "dummy (to make root expandable)"});
		node.setExpanded();
	}
	addNodes(node, opts.count, opts.count2, opts.count3, opts.forceUpdate);

	timer.subtime("addNodes");

//    tree.render(true, true);
//    timer.subtime("render");

	if( opts.expandAfter ) {
		node.setExpanded().done(function(){
			timer.stop();
			done();
		});
	} else {
		timer.stop();
		done();
	}
}


QUnit.test("tabletree (6 columns): render collapsed", function(assert) {
	_renderTable(assert, {
		count: 1000,
		forceUpdate: true,
		expandBefore: false,
		expandAfter: false
	});
});


QUnit.test("tabletree (6 columns): render, then expand", function(assert) {
	_renderTable(assert, {
		count: 1000,
		forceUpdate: false,
		expandBefore: false,
		expandAfter: true
	});
});


QUnit.test("tabletree (6 columns): render while expanded", function(assert) {
	_renderTable(assert, {
		count: 100,
		forceUpdate: true,
		expandBefore: true,
		expandAfter: false
	});
});


QUnit.test("tabletree (6 columns): render while expanded with enableUpdate(false)", function(assert) {
	_renderTable(assert, {
		count: 100,
		forceUpdate: false,
		expandBefore: true,
		expandAfter: false
	});
});


/* *****************************************************************************
 */

tools.createInfoSection();
// ---
});
