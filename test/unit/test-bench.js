$(function(){

/*******************************************************************************
 * QUnit setup
 */
QUnit.log = function(data) {
	if (window.console && window.console.log) {
		window.console.log(data.result + " :: " + data.message);
	}
};

/*******************************************************************************
 * Tool functions
 */
var TOTAL_ELAP = 0;

function _resetEmptyTree(){
	QUnit.reset();
	var $tree = $("#tree");
	if( $tree.is(":ui-fancytree") ){
		$tree.fancytree("destroy");
	}
	$tree.fancytree({
		source: [{title: "root node", key: "root"}]
	});
	return $tree.fancytree("getTree");

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
	if(m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null)
		m[2]= tem[1];
	m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
	return m.join(", ");
}


function makeBenchWrapper(testName, callback) {
	return function() {
		var start = +new Date();
//        callback.apply(this, arguments);
		callback.call();
		var elap = +new Date() - start;
		ok(true, testName + " took " + elap + " milliseconds");
		TOTAL_ELAP += elap;
	}
}


function benchmark(testName, callback) {
	// Execute callback immediately and log timing as test result.
	// This function should be called inside a test() function.
	makeBenchWrapper(testName, callback).call();
}


function timedTest(testName, callback) {
	// Same as test(testName, callback), but adds a timing assertion.
	test(testName, makeBenchWrapper(testName, callback));
}


function simulateClick(selector) {
	var e = document.createEvent("MouseEvents");
	e.initEvent("click", true, true);
	$(selector).each(function(){
		this.dispatchEvent(e);
	});
};


function addNodes(node, level1, level2, level3, forceUpdate) {
	if( forceUpdate !== true ){
//		node.tree.enableUpdate(false);
	}
	var key;
	for (var i=0; i<level1; i++) {
		key = "" + (i+1);
		var f = node.addChildren({title: "Folder_" + key,
							   key: key,
							   folder: true
							   });
		for (var j=0; j<level2; j++) {
			key = "" + (i+1) + "." + (j+1);
			var d = f.addChildren({title: "Node_" + key,
							  key: key
							  });
			for (var k=0; k<level3; k++) {
				key = "" + (i+1) + "." + (j+1) + "." + (k+1);
				d.addChildren({title: "Node_" + key,
						  key: key
						  });
			}
		}
	}
//	node.tree.enableUpdate(true);
}

/*******************************************************************************
 * Module Init
 */
/*
module("Test configuration");

test("Version info", function() {
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	expect(4);

	ok(true, "Fancytree v" + $.ui.fancytree.version);
	ok(true, "jQuery UI " + jQuery.ui.version);
	ok(true, "jQuery " + jQuery.fn.jquery);
	var doctype = document.documentElement.previousSibling,
		doctypeSid = doctype.systemId,
		doctypePid = doctype.publicId;
	ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
//    ok(true, "DOCTYPE 2 " + window.document.doctype);
});
*/
/*
module("API");

test("Create dynatree", function() {
	expect(20);
	QUnit.reset();
	stop();
	ok($.isFunction($.ui.dynatree.debug), "ui.dynatree.debug function is defined");
	equal($.ui.dynatree._nextId, 1, "tree instance counter is 1");
	$("#tree").dynatree({
		children: [
			{key: "_1", title: "Lazy Add 100 nodes (flat, force update)...", folder: true, lazy: true, mode: "add100_flat_u" },
			{key: "_2", title: "Lazy Add 100 nodes (flat)...", folder: true, lazy: true, mode: "add100_flat" },
			{key: "_3", title: "Lazy Add 1.000 nodes (flat)...", folder: true, lazy: true, mode: "add1000_flat" },
			{key: "_4", title: "Lazy Add 1.000 nodes (deep)...", folder: true, lazy: true, mode: "add1000_deep" },
			{key: "_5", title: "Lazy Add 10.000 nodes (deep)...", folder: true, lazy: true, mode: "add10000_deep" },
			{key: "_6", title: "Lazy Add JSON file...", folder: true, lazy: true, mode: "addJsonFile" },
			{key: "_7", title: "Add 1.000 nodes (flat)", folder: true },
			{key: "_8", title: "Add 1.000 nodes (deep)", folder: true }
		],
		onSelect: function(node) {
			alert("You selected " + node.data.title);
		},
		onLazyRead: function(node) {
			var tree = node.tree;
			var start = +new Date;
			logMsg("Benchmarking mode='" + node.data.mode + "'...");
			switch( node.data.mode ) {
				case "add100_flat_u":
					addNodes(node, 100, 0, 0, true)
					break;
				case "add100_flat":
					addNodes(node, 100, 0, 0)
					break;
				case "add1000_flat":
					addNodes(node, 1000, 0, 0)
					break;
				case "add1000_deep":
					addNodes(node, 10, 10, 10)
					break;
				case "add10000_deep":
					addNodes(node, 10, 100, 10)
					break;
				case "addJsonFile":
					node.appendAjax({
						url: "sample-data2.json"
					});
					break;
				default:
					throw "Invalid Mode "+ node.data.mode;
			}
			logMsg("Benchmarking mode='" + node.data.mode + "' done: " + (+new Date - start) + " milliseconds");
			// Return true, to show we're finished
			return true;
		},
		create: function(e, data){
			equal(e.type, "dynatreecreate", "receive `create` callback");
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
			ok(!!data.tree.root, "`data.tree` is the tree object");
			equal(data.options.children.length, 8, "data.options.contains widget options");
			ok($("div#tree").hasClass("ui-widget"), "div#tree has ui-widget class");
			ok($(this).hasClass("ui-widget"), "`this` is div#tree");
			equal(data.tree.root.children.length, 8, "tree.root has 8 child nodes");
			start();
		}
	});

	equal($(":ui-dynatree").length, 1, ":ui-dynatree widget selector works");
	var widget = $("div#tree").data("dynatree");
	ok(!!widget, "widget is attached to div#tree");
	ok(!!widget.tree, "widget.tree is defined");
	equal(widget.tree._id, 1, "tree id is 1");
	equal($.ui.dynatree._nextId, 2, "next tree instance counter is 2");
});
*/
/*******************************************************************************
 * Module Load
 */
module("Load");

test("Add nodes to folder using API witout expanding", function() {
	expect(2);

	var tree = _resetEmptyTree();

	benchmark("1000 nodes flat", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 1000, 0, 0);
	});

	tree = _resetEmptyTree();
	benchmark("1000 nodes deep (10x10x10)", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
	});
});

test(".click() top level nodes (triggers lazy loading)", function() {
	expect(2);

	var tree = _resetEmptyTree();
	benchmark("1000 nodes flat and force render(deep=true)", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 1000, 0, 0);
		tree.render(true, true);
	});

	tree = _resetEmptyTree();
	benchmark("1000 nodes deep (10x10x10) and force render(deep=true)", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
		tree.render(true, true);
	});
});
/*
timedTest(".click() add10000_deep", function() {
	$("#dynatree-id-_5").click();
});

test("Load 100 nodes (flat)", function() {
	var parent  = $("#tree").dynatree("getTree").getNodeByKey("_1");
//    addNodes(parent, 100, 0, 0)
	ok( true, "all pass" );
});
*/
/*******************************************************************************
 * Module Cleanup
 */
/*
module("Cleanup");

test("Remove children", function() {
	var root = $("#tree").dynatree("getRoot");
	for(var i = 0; i<root.childList.length; i++)
		root.childList[i].removeChildren();
//  ok( true, "all pass" );
});
*/
/*******************************************************************************
 * Module
 */

module("Configuration and Summary");
test("", function() {
	expect(5);
	QUnit.reset();

	ok(true, "Fancytree v" + $.ui.fancytree.version);
	ok(true, "jQuery UI " + jQuery.ui.version);
	ok(true, "jQuery " + jQuery.fn.jquery);
	var doctype = document.documentElement.previousSibling,
		doctypeSid = doctype.systemId,
		doctypePid = doctype.publicId;
//    ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
	ok(true, "Browser: " + _getBrowserInfo());
	ok(true, "Cumulated test time: " + TOTAL_ELAP + " milliseconds");
	setTimeout(function(){
		$("li#qunit-test-output3 ol").show("slow");
	}, 1000)
});
// ---
});
