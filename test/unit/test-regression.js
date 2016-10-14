/*******************************************************************************
 * Reproduced issues
 ******************************************************************************/

jQuery(document).ready(function(){

/*globals QUnit, TEST_TOOLS */

var $ = jQuery,
	// Use tools from test-tools.js
	tools = TEST_TOOLS;

/*******************************************************************************
 * Initialize QUnit
 */

tools.initQUnit();

// Create an Info section (will be expanded when tests are completed)
tools.createInfoSection();

// Silence, please
$.ui.fancytree.debugLevel = 1;


/*******************************************************************************
 * Module
 */
QUnit.module("Issues");

// TODO: this fixture doesn't really make sense, it is rather meynt as an example...
QUnit.test("issue310: Loading animation never ends using lazy read on empty folder", function(assert) {
	tools.setup(assert);
	assert.expect(1);

	var done = assert.async();

	$("#tree").fancytree({
		source: [{title: "lazy folder", key: "1", folder: true, lazy: true}],
		lazyLoad: function(event, data){
			assert.ok(true, "got `lazyLoad` event");
			data.result = [];
			done();
		}
	});
	var node = $("#tree").fancytree("getTree").getNodeByKey("1");
	 $("span.fancytree-expander", node.span).click();
});


// ---
});
