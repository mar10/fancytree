/*******************************************************************************
 * Reproduced issues
 ******************************************************************************/

jQuery(document).ready(function(){

/*globals QUnit, TEST_TOOLS */

/* jshint -W081 */  // Ignore 'W081: Too many var statements'

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
	var node = $.ui.fancytree.getTree("#tree").getNodeByKey("1");
	 $("span.fancytree-expander", node.span).trigger("click");
});

QUnit.test("issue010: hideCheckbox", function(assert) {
	tools.setup(assert);
	assert.expect(2);

	var done = assert.async();

	$("#tree").fancytree({
		source: [{title: "node 1", key: "1"}],
		checkbox: true,
		init: function(event, data){
			var node = data.tree.getNodeByKey("1");
			assert.equal($(node.span).find("span.fancytree-checkbox").length, 1, "checkbox visible");
			node.checkbox = false;
			node.render(true);
			assert.equal($(node.span).find("span.fancytree-checkbox").length, 0, "checkbox removed");
			// assert.equal($(node.span).find("span.fancytree-checkbox:visible").length, 0, "checkbox hidden");
			done();
		}
	});
});


// ---
});
