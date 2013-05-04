/*******************************************************************************
 * Reproduced issues
 ******************************************************************************/

jQuery(document).ready(function(){

// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*globals expect,module,ok,QUnit,start,stop,test */

var $ = jQuery;

/*******************************************************************************
 * QUnit setup
 */
QUnit.log = function(data) {
	if (window.console && window.console.log) {
		window.console.log(data.result + " :: " + data.message);
	}
};

/** Helper to reset environment for asynchronous Fancytree tests. */
function _setupAsync(){
	QUnit.reset();
	$("#tree").fancytree("destroy");
	stop();
}



/*******************************************************************************
 * test data
 */
//var testData = [
//	{title: "simple node (no explicit id, so a default key is generated)" },
//	{key: "2", title: "item1 with key and tooltip", tooltip: "Look, a tool tip!" },
//	{key: "3", title: "<span>item2 with <b>html</b> inside a span tag</span>" },
//	{key: "4", title: "this nodes uses 'nolink', so no &lt;a> tag is generated", nolink: true},
//	{key: "5", title: "using href", href: "http:/wwwwendt.de/" },
//	{key: "6", title: "node with some extra classes (will be added to the generated markup)", extraClasses: "my-extra-class" },
//	{key: "7", title: "Folder 1", folder: true, children: [
//		{key: "10_1", title: "Sub-item 1.1", children: [
//			{key: "10_1_1", title: "Sub-item 1.1.1"},
//			{key: "10_1_2", title: "Sub-item 1.1.2"}
//		]},
//		{key: "10_2", title: "Sub-item 1.2", children: [
//			{key: "10_2_1", title: "Sub-item 1.2.1"},
//			{key: "10_2_2", title: "Sub-item 1.2.2"}
//		]}
//	]},
//	{key: "20", title: "Simple node with active children (expand)", expanded: true, children: [
//		{key: "20_1", title: "Sub-item 2.1", children: [
//			{key: "20_1_1", title: "Sub-item 2.1.1", active: true},
//			{key: "20_1_2", title: "Sub-item 2.1.2"}
//		]},
//		{key: "10_2", title: "Sub-item 1.2", children: [
//			{key: "20_2_1", title: "Sub-item 2.2.1"},
//			{key: "20_2_2", title: "Sub-item 2.2.2"}
//		]}
//	]},
//	{key: "30", title: "Lazy folder", folder: true, lazy: true },
//	{key: "31", title: "Lazy folder (preload)", folder: true, lazy: true, preload: true },
//	{key: "32", title: "Lazy folder (expand on load)", folder: true, lazy: true, expanded: true }
//];
//var TESTDATA_TOPNODES = 11,
//	TESTDATA_VISIBLENODES = 13;


/*******************************************************************************
 * Module Init
 */
module("Initialization");

test("Version info", function() {
	QUnit.reset();
	$("#tree").fancytree("destroy");
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


/*******************************************************************************
 * Module Init
 */
module("Issues");

test("issue310: Loading animation never ends using lazy read on empty folder", function() {
	_setupAsync();
	expect(1);

	$("#tree").fancytree({
		source: [{title: "lazy folder", key: "1", folder: true, lazy: true}],
		lazyload: function(e, data){
			ok(true, "got `lazyload` event");
			start();
		}
	});
	var node = $("#tree").fancytree("getTree").getNodeByKey("1");
	 $("span.fancytree-expander", node).click();
});

test("Issue 309: appendAjax race condition", function() {
	_setupAsync();
	expect(1);

	$("#tree").fancytree({
		source: [{title: "lazy folder", key: "1", folder: true, lazy: true}],
		lazyload: function(e, data){
			ok(true, "got `lazyload` event");
			start();
		}
	});
	var node = $("#tree").fancytree("getTree").getNodeByKey("1");
	 $("span.fancytree-expander", node).click();
});

// ---
});
