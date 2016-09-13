jQuery(document).ready(function(){

/*globals QUnit, TEST_TOOLS */

var $ = jQuery,
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

//Silence, please
$.ui.fancytree.debugLevel = 1;

// Create an Info section (will be expanded when tests are completed)
tools.createInfoSection();


/* *****************************************************************************
 * Tool functions
 */

function _resetEmptyTree(options){
	// destroy all trees
	$(":ui-fancytree").fancytree("destroy");

	var $tree = $("#tree"),
		opts = $.extend({
		source: [{title: "root node", key: "root"}],
		fx: false
	}, options);
	$tree.fancytree(opts);
	return $tree.fancytree("getTree");
}


function addNodes(node, level1, level2, level3, forceUpdate) {
//	if( forceUpdate !== true ){
//		node.tree.enableUpdate(false);
//	}
	var d, f, i, j, k, key;

	for(i=0; i<level1; i++) {
		key = "" + (i+1);
		f = node.addChildren({title: "Folder_" + key,
							   key: key,
							   folder: true
							   });
		for (j=0; j<level2; j++) {
			key = "" + (i+1) + "." + (j+1);
			d = f.addChildren({title: "Node_" + key,
							  key: key
							  });
			for (k=0; k<level3; k++) {
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

QUnit.module("Standard tree");

QUnit.test("Repeat 1000 times: create-render-remove 1000 nodes", function(assert) {
	assert.expect(1);
	var id,
		COUNT = 1000, //1000,   // loops
		DELAY = 100,  // wait 500 ms
		i = 0,
		done = assert.async();

	id = setInterval(function(){

		var tree = _resetEmptyTree(),
			node = tree.getNodeByKey("root");
//        var timer = new AsyncTimer("render 1000 nodes");

//        addNodes(node, 10, 10, 10);
		addNodes(node, 1000, 0, 0);
	//  timer.subtime("addNodes");

		node.setExpanded().done(function(){
//            timer.stop();
		});

		i++;
		if( i >= COUNT){
			clearInterval(id);
			assert.ok(true, "DONE");
			done();
		}
	}, DELAY);
});

// ---
});
