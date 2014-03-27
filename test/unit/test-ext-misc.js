jQuery(document).ready(function(){

// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*jshint unused:false */
/*globals deepEqual,equal,expect,module,QUnit,start,stop,test */

var TEST_DATA, TESTDATA_NODES, TESTDATA_TOPNODES, TESTDATA_VISIBLENODES,
	$ = jQuery,
	EVENT_SEQUENCE = [];

/*******************************************************************************
 * QUnit setup
 */

QUnit.log(function(data) {
	if (window.console && window.console.log) {
//		window.console.log(data.result + " :: " + data.message);
	}
});

QUnit.done(function( details ) {
	// Expand first section when all tests are run
	$("ol#qunit-tests > li:first > ol").show("slow");
//	if(jQuery.migrateWarnings != null){
//		alert("" + jQuery.migrateWarnings || "no migrateWarnings");
//	}
});


// Silence, please
$.ui.fancytree.debugLevel = 1;


/*******************************************************************************
 * Tool functions
 */
//function simulateClick(selector) {
//	var event = document.createEvent("MouseEvents");
//	event.initEvent("click", true, true);
//	$(selector).each(function(){
//		this.dispatchEvent(event);
//	});
//}


/** Helper to reset environment for asynchronous Fancytree tests. */
function _appendEvent(res){
	EVENT_SEQUENCE.push(res);
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
	if(m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null){
		m[2]= tem[1];
	}
	m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
	return m.join(", ");
}


/** Get FancytreeNode from current tree. */
function _getNode(key){
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey(key);
	return node;
}


/** Get current Fancytree. */
function _getTree(key){
	return $("#tree").fancytree("getTree");
}


/** Get node title as rendered in the DOM. */
function _getNodeTitle(key){
	var node = _getNode(key);
	if(!node){
		return undefined;
	}
	return $(node.span).find(".fancytree-title").html();
}


/** Convert array of nodes to array to array of node keys. */
function _getNodeKeyArray(nodeArray){
	if(!$.isArray(nodeArray)){
		return nodeArray;
	}
	return $.map(nodeArray, function(n){ return n.key; });
}


/** Fake an Ajax request, return a $.Promise. */
function _fakeAjaxLoad(node, count, delay){
	delay = delay || 0;
	if($.isArray(delay)){ // random delay range [min..max]
		delay = Math.round(delay[0] + Math.random() * (delay[1] - delay[0]));
	}
	var dfd = new $.Deferred();
	setTimeout(function(){
		var i,
			children = [];
		for(i=0; i<count; i++){
			children.push({
				key: node.key + "_" + (i+1),
				title: node.title + "_" + (i+1),
				lazy: true
				});
		}
		// emulate ajax deferred: done(data, textStatus, jqXHR)
		dfd.resolveWith(this, [children, null, null]);
	}, delay);
	return dfd.promise();
}

/*******************************************************************************
 * test data
 */
TEST_DATA = [
		{title: "simple node (no explicit id, so a default key is generated)" },
		{key: "2", title: "item1 with key and tooltip", tooltip: "Look, a tool tip!" },
		{key: "3", title: "<span>item2 with <b>html</b> inside a span tag</span>" },
		{key: "4", title: "this nodes uses 'nolink', so no &lt;a> tag is generated", nolink: true},
		{key: "5", title: "using href", href: "http://www.wwWendt.de/" },
		{key: "6", title: "node with some extra classes (will be added to the generated markup)", extraClasses: "my-extra-class" },
		{key: "10", title: "Folder 1", folder: true, children: [
			{key: "10_1", title: "Sub-item 1.1", children: [
				{key: "10_1_1", title: "Sub-item 1.1.1"},
				{key: "10_1_2", title: "Sub-item 1.1.2"}
			]},
			{key: "10_2", title: "Sub-item 2.2", children: [
				{key: "10_2_1", title: "Sub-item 1.2.1"},
				{key: "10_2_2", title: "Sub-item 1.2.2"}
			]}
		]},
		{key: "20", title: "Simple node with active children (expand)", expanded: true, children: [
			{key: "20_1", title: "Sub-item 2.1", children: [
				{key: "20_1_1", title: "Sub-item 2.1.1", refKey: "rk_1"},
				{key: "20_1_2", title: "Sub-item 2.1.2"}
			]},
			{key: "20_2", title: "Sub-item 1.2", children: [
				{key: "20_2_1", title: "Sub-item 2.2.1", refKey: "rk_1"},
				{key: "20_2_2", title: "Sub-item 2.2.2"}
			]}
		]},
		{key: "30", title: "Lazy folder", folder: true, lazy: true },
		{key: "31", title: "Lazy folder (preload)", folder: true, lazy: true, preload: true },
		{key: "32", title: "Lazy folder (expand on load)", folder: true, lazy: true, expanded: true }
	];
TESTDATA_NODES = 23,
TESTDATA_TOPNODES = 11,
TESTDATA_VISIBLENODES = 13;



/*******************************************************************************
 *
 */
module("clones");

test("sync load", function() {
	_setupAsync();
	expect(12);

	$("#tree").fancytree({
		extensions: ["clones"],
		source: TEST_DATA,
		lazyLoad: function(event, data){
			// fake an async, deleayed Ajax request that generates 5 lazy nodes
			data.result = _fakeAjaxLoad(data.node, 5, 10);
		}
	});
	var node, nodeList,
		tree = _getTree();

	equal(_getNode("20_1_1").data.refKey, "rk_1", "set refKey");
	equal(_getNode("20_2_1").data.refKey, "rk_1", "set refKey 2");
	equal(_getNode("2").data.refKey, undefined, "no default refKey");

	equal(_getNode("20_1_1").isClone(), true, "isClone() 1 detected");
	equal(_getNode("20_2_1").isClone(), true, "isClone() 2 detected");
	equal(_getNode("2").isClone(), false, "isClone() non-clone detected");

	nodeList = tree.getNodesByRef("rk_1");
	equal(nodeList.length, 2, "tree.getNodesByRef()");
	deepEqual(_getNodeKeyArray(nodeList), ["20_1_1", "20_2_1"], "tree.getNodesByRef() finds all clones");

	nodeList = tree.getNodesByRef("rk_1", _getNode("10"));
	equal(nodeList, null, "tree.getNodesByRef() restrict to branch: miss");
	nodeList = tree.getNodesByRef("rk_1", _getNode("20"));
	equal(nodeList.length, 2, "tree.getNodesByRef() restrict to branch: hit");

	nodeList = _getNode("20_1_1").getCloneList();
	deepEqual(_getNodeKeyArray(nodeList), ["20_2_1"], "node.getCloneList() 1 detected");
	nodeList = _getNode("20_1_1").getCloneList(true);
	deepEqual(_getNodeKeyArray(nodeList), ["20_1_1", "20_2_1"], "node.getCloneList(true) 2 detected");

	start();
});


});
