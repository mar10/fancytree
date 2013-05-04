jQuery(document).ready(function(){
// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*globals expect,module,ok,QUnit,start,stop,test */

var $ = jQuery;

/* *****************************************************************************
 * QUnit setup
 */
QUnit.log = function(data) {
	if(window.console && window.console.log) {
		window.console.log(data.result + " :: " + data.message);
	}
};

QUnit.done(function( details ) {
	// Expand last section when all tests are run
	$("ol#qunit-tests > li:last > ol").show("slow");
});

/* *****************************************************************************
 * Tool functions
 */
//var EVENT_SEQUENCE = [];
var TOTAL_ELAP = 0;

function AsyncTimer(name, start){
	this.name = "AsyncTimer(" + name + ")";
	this.stamp = null;
	if(start !== false){
		this.start();
	}
}
AsyncTimer.prototype = {
	start: function(){
		/*jshint expr:true */
		window.console && window.console.time && window.console.time(this.name);
		// halt QUnit
		stop();
		this.stamp = +new Date();
	},
	stop: function(){
		/*jshint expr:true */
		window.console && window.console.timeEnd && window.console.timeEnd(this.name);
		var elap = +new Date() - this.stamp;
		ok(true, this.name + " took " + elap + " milliseconds");
		TOTAL_ELAP += elap;
		// Continue QUnit
		start();
	},
	subtime: function(info){
		var elap = +new Date() - this.stamp;
		ok(true, "... " + this.name + " until '" + info + "' took " + elap + " milliseconds");
	}
};


function _resetEmptyTree(options){
	QUnit.reset();
	// destroy all trees
	$(":ui-fancytree").fancytree("destroy");

	var $tree = $("#tree");
	var opts = $.extend({
		source: [{title: "root node", key: "root"}],
		fx: false
	}, options);
	$tree.fancytree(opts);
	return $tree.fancytree("getTree");
}


/** Helper to reset environment for asynchronous Fancytree tests. */
/*
function _setupAsync(){
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	EVENT_SEQUENCE = [];
	stop();
}
*/

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


function makeBenchWrapper(testName, callback) {
	return function() {
		var start = +new Date();
//        callback.apply(this, arguments);
		callback.call();
		var elap = +new Date() - start;
		ok(true, testName + " took " + elap + " milliseconds");
		TOTAL_ELAP += elap;
	};
}

/* Execute callback immediately and log timing as test result.
 * This function should be called inside a test() function.
 */
function benchmark(testName, callback) {
	makeBenchWrapper(testName, callback).call();
}


function addNodes(node, level1, level2, level3, forceUpdate) {
	if( forceUpdate !== true ){
//		node.tree.enableUpdate(false);
	}
	var key;
	for(var i=0; i<level1; i++) {
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


//*****************************************************************************

module("Standard tree");

test("Add nodes using API to collapsed node (no rendering)", function() {
	expect(3);

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

	tree = _resetEmptyTree({aria: true});
	benchmark("1000 nodes deep (10x10x10) with ARIA", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
	});
});


test("Create and render hidden nodes, but don't make visible (i.e. don't expand)", function() {
	expect(3);

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

	tree = _resetEmptyTree({aria: true});
	benchmark("1000 nodes deep (10x10x10) and force render(deep=true) with ARIA", function() {
		var node = tree.getNodeByKey("root");
		addNodes(node, 10, 10, 10);
		tree.render(true, true);
	});
});


test("Expand 1000 nodes deep (with 10 top level nodes, triggers expand -> render and display)", function() {
	expect(2);

	var tree = _resetEmptyTree();
	var node = tree.getNodeByKey("root");

	var timer = new AsyncTimer("1000 deep (10x10x10) with expand");

	addNodes(node, 10, 10, 10);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.stop();
	});
});


test("Expand 1000 top level nodes (triggers expand -> render and display)", function() {
	expect(2);

	var tree = _resetEmptyTree();
	var node = tree.getNodeByKey("root");

	var timer = new AsyncTimer("1000 top level nodes flat with expand");

	addNodes(node, 1000, 0, 0);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.stop();
	});
});


test("Expand 1000 top level nodes with ARIA and checkboxes (triggers expand -> render and display)", function() {
	expect(2);

	var tree = _resetEmptyTree({
		aria: true,
		checkbox:true
	});
	var node = tree.getNodeByKey("root");

	var timer = new AsyncTimer("1000 top level nodes flat with expand");

	addNodes(node, 1000, 0, 0);
	timer.subtime("addNodes");

	node.setExpanded().done(function(){
		timer.stop();
	});
});


/* *****************************************************************************
 *
 */
module("Table tree");

test("tabletree (6 columns): render and expand", function() {
	expect(2);

	_resetEmptyTree();

//	var $ico1 = $("<img>", {src: "/src/skin-win8/icons.gif"});
//	var $ico2 = $("<span>", {
//		"class": "fancytree-icon"
////		css: "/src/skin-win8/icons.gif"
//		});

	var $tree = $("#tabletree").fancytree({
		extensions: ["table"],
		source: [{title: "root node", key: "root"}],
		table: {
			indentation: 20,  // indent 20px per node level
			nodeColumnIdx: 0  // render the node title into the 2nd column
		},
		rendercolumns: function(e, data) {
			var node = data.node,
				$tdList = $(node.tr).find(">td");
//			$tdList.eq(0).text(node.getIndexHier()).addClass("alignRight");
			// (index #0 is rendered by fancytree)
//			$tdList.eq(1).append($ico2);
//			$tdList.eq(2).append($("<img>", {src: "/src/skin-win8/icons.gif"}));
			$tdList.eq(1).append( $("<span>", {
				"class": "fancytree-icon"
//					css: "/src/skin-win8/icons.gif"
					}));
			$tdList.eq(2).append( $("<span>", {
				"class": "fancytree-icon"
//					css: "/src/skin-win8/icons.gif"
					}));
			$tdList.eq(3).append( $("<span>", {
				"class": "fancytree-icon"
//					css: "/src/skin-win8/icons.gif"
					}));
//            $tdList.eq(3).html("<input type='checkbox' name='like' value='" + node.key + "'>");
			$tdList.eq(4).text("2013-02-17");
			$tdList.eq(5).text("Homer Simpson");
		}
	});

	var tree = $tree.fancytree("getTree");
	var node = tree.getNodeByKey("root");

	var timer = new AsyncTimer("1000 nodes flat and expand");
//    var timer = new AsyncTimer("1000 nodes (10 x 10 x 10) and force render(deep=true)");

	addNodes(node, 1000, 0, 0);
//    addNodes(node, 10, 10, 10);
//  addNodes(node, 1, 390, 0);
	timer.subtime("addNodes");

//    tree.render(true, true);
//    timer.subtime("render");

	node.setExpanded().done(function(){
		timer.stop();
	});
});


/* *****************************************************************************
 *
 */

module("Configuration and Summary");
test("", function() {
	expect(5);
	QUnit.reset();

	ok(true, "Fancytree v" + $.ui.fancytree.version);
	ok(true, "jQuery UI " + jQuery.ui.version);
	ok(true, "jQuery " + jQuery.fn.jquery);
	ok(true, "Browser: " + _getBrowserInfo());
	ok(true, "Cumulated test time: " + TOTAL_ELAP + " milliseconds");
});
// ---
});
