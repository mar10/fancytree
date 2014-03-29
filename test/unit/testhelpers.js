;(function($, window, document, undefined) {

// jQUnit defines:
// asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

/*globals expect,module,ok,QUnit,stop,test */

var TOOLS = {};

window.TEST_TOOLS = TOOLS;

TOOLS.EVENT_SEQUENCE = [];

/*******************************************************************************
 * QUnit setup
 */
TOOLS.initQUnit = function() {

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
};


TOOLS.createInfoSection = function() {
	// Create the first informational section
	module("Test Environment Information");

	test("Version info", function() {
		QUnit.reset();
		if( $("#tree").is(":ui-fancytree") ){
			$("#tree").fancytree("destroy");
		}
		expect(5);

		ok(true, "Fancytree v" + $.ui.fancytree.version + ", buildType='" + $.ui.fancytree.buildType + "'");
		ok(true, "jQuery UI " + jQuery.ui.version + " (uiBackCompat=" + $.uiBackCompat + ")");
		ok(true, "jQuery " + jQuery.fn.jquery);
		var doctype = document.documentElement.previousSibling,
			doctypeSid = doctype.systemId,
			doctypePid = doctype.publicId;
		ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
	//    ok(true, "DOCTYPE 2 " + window.document.doctype);

		ok(true, "Browser: " + TOOLS.getBrowserInfo());
	//    ok(true, "Cumulated test time: " + TOTAL_ELAP + " milliseconds");
	});
};

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
TOOLS.appendEvent = function(res) {
	TOOLS.EVENT_SEQUENCE.push(res);
};


/** Helper to reset environment for asynchronous Fancytree tests. */
TOOLS.setupAsync = function() {
	QUnit.reset();
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
	TOOLS.EVENT_SEQUENCE = [];
	stop();
};


/** Return an info string of current browser. */
TOOLS.getBrowserInfo = function() {
	var n = navigator.appName,
		ua = navigator.userAgent,
		tem,
		m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
	if(m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null){
		m[2]= tem[1];
	}
	m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
	return m.join(", ");
};


/** Get FancytreeNode from current tree. */
TOOLS.getNode = function(key){
	var tree = $("#tree").fancytree("getTree"),
		node = tree.getNodeByKey(key);
	return node;
};


/** Get current Fancytree. */
TOOLS.getTree = function(key){
	return $("#tree").fancytree("getTree");
};


/** Get node title as rendered in the DOM. */
TOOLS.getNodeTitle = function(key){
	var node = TOOLS.getNode(key);
	if(!node){
		return undefined;
	}
	return $(node.span).find(".fancytree-title").html();
};


/** Convert array of nodes to array to array of node keys. */
TOOLS.getNodeKeyArray = function(nodeArray){
	if(!$.isArray(nodeArray)){
		return nodeArray;
	}
	return $.map(nodeArray, function(n){ return n.key; });
};


/** Fake an Ajax request, return a $.Promise. */
TOOLS.fakeAjaxLoad = function(node, count, delay){
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
};

}(jQuery, window, document));
