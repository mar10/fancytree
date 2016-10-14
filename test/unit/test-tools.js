;(function($, window, document, undefined) {

/*globals QUnit */

var TOOLS = {},
	log = [];

window.TEST_TOOLS = TOOLS;

// TOOLS.EVENT_SEQUENCE = [];
TOOLS.EVENT_SEQUENCE = "<deprecated: use assert.EVENT_SEQUENCE instead>";
TOOLS.TOTAL_ELAP = 0;


/*******************************************************************************
 * QUnit setup
 */
TOOLS.initQUnit = function() {

	// See https://github.com/axemclion/grunt-saucelabs
	QUnit.done(function (testResults) {
	  var details, i, len,
		tests = [];

	  for(i = 0, len = log.length; i < len; i++) {
		details = log[i];
		tests.push({
		  name: details.name,
		  result: details.result,
		  expected: details.expected,
		  actual: details.actual,
		  source: details.source
		});
	  }
	  testResults.tests = tests;

	  // Expand first section when all tests are run
	  $("ol#qunit-tests > li:first > ol").show("slow");

	  // Maybe deferring this fixes sporadic erros in saucelabs tests for
	  // FF 48 on Win8?
	  setTimeout(function(){
		  /*jshint camelcase:false*/ // jscs: disable
		  window.global_test_results = testResults; // used by saucelabs
		  /*jshint camelcase:true*/ // jscs: enable
	  }, 1000);
	});

	// See https://github.com/axemclion/grunt-saucelabs
	QUnit.testStart(function(testDetails){
	  QUnit.log(function(details){
		if (!details.result) {
		  details.name = testDetails.name;


		  log.push(details);
		}
	  });
	});
	// Silence, please
	$.ui.fancytree.debugLevel = 1;
};


TOOLS.createInfoSection = function() {
	// Create the first informational section
	QUnit.module("Test Environment Information");

	QUnit.test("Version info", function(assert) {
		TOOLS.setup(assert);
		assert.expect(5);

		assert.ok(true, "Fancytree v" + $.ui.fancytree.version + ", buildType='" + $.ui.fancytree.buildType + "'");
		assert.ok(true, "jQuery UI " + jQuery.ui.version + " (uiBackCompat=" + $.uiBackCompat + ")");
		assert.ok(true, "jQuery " + jQuery.fn.jquery);
		var doctype = document.documentElement.previousSibling,
			doctypeSid = doctype.systemId,
			doctypePid = doctype.publicId;
		assert.ok(true, "DOCTYPE " + doctypePid + " " + doctypeSid);
	//    assert.ok(true, "DOCTYPE 2 " + window.document.doctype);

		assert.ok(true, "Browser: " + TOOLS.getBrowserInfo());
	//    assert.ok(true, "Cumulated test time: " + TOTAL_ELAP + " milliseconds");
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
TOOLS.appendEvent = function(assert, msg) {
	if( !assert || !assert.deepEqual ) { $.error("assert must be passed"); }
	if( typeof msg !== "string" ) { $.error("msg must be a string"); }
	if( !assert.EVENT_SEQUENCE ) { $.error("TOOLS.setup() was not called"); }
	assert.EVENT_SEQUENCE.push(msg);
};


/** Helper to reset environment for ynchronous Fancytree tests. */
TOOLS.setup = function(assert) {
	if( !assert ) { $.error("Need assert arg"); }
	if( assert.EVENT_SEQUENCE ) { $.error("Duplicate setup()"); }
	assert.EVENT_SEQUENCE = [];
	if( $("#tree").is(":ui-fancytree") ){
		$("#tree").fancytree("destroy");
	}
};


// /** Helper to reset environment for asynchronous Fancytree tests. */
// TOOLS.setupAsync = function(assert) {
// 	if( !assert ) { $.error("Need assert arg"); }
// 	if( assert.EVENT_SEQUENCE ) { $.error("Duplicate setup()"); }
// 	assert.EVENT_SEQUENCE = [];
// 	// QUnit.reset();
// 	if( $("#tree").is(":ui-fancytree") ){
// 		$("#tree").fancytree("destroy");
// 	}
// 	TOOLS.EVENT_SEQUENCE = [];
// 	stop();
// };


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
TOOLS.getTree = function(){
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

/** Generate a large hierarchy of nodes
 */
TOOLS.addGenericNodes = function(node, level1, level2, level3, callback) {
	var d, f, i, j, k, key;

	function _cb(parentNode, data, i, j, k) {
		if( !callback || callback(data, i, j, j) !== false ) {
			return parentNode.addChildren(data);
		}
	}

	for(i=0; i<level1; i++) {
		key = "" + (i+1);
		f = _cb(node, {title: "Folder_" + key, key: key, folder: true}, i, 0, 0);
		for (j=0; j<level2; j++) {
			key = "" + (i+1) + "." + (j+1);
			d = _cb(f, {title: "Node_" + key, key: key}, i, j, 0);
			for (k=0; k<level3; k++) {
				key = "" + (i+1) + "." + (j+1) + "." + (k+1);
				_cb(d, {title: "Node_" + key, key: key}, i, j, k);
			}
		}
	}
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

/**
 * Tools inspired by https://github.com/jquery/jquery-ui/blob/master/tests/unit/menu/
 */
/*
function TestHelpers() {

	var lastItem = "",
		log = [],
		$ = jQuery;

	return {
		log: function( message, clear ) {
			if ( clear ) {
				log.length = 0;
			}
			if ( message === undefined ) {
				message = lastItem;
			}
//          window.console.log(message);
			log.push( $.trim( message ) );
		},
		logOutput: function() {
			return log.join( "," );
		},
		clearLog: function() {
			log.length = 0;
		},
		entryEvent: function( menu, item, type ) {
			lastItem = item;
//          window.console.log(type + ": ", menu.children( ":eq(" + item + ")" ).find( "a:first" ).length);
			menu.children( ":eq(" + item + ")" ).find( "a:first" ).trigger( type );
		},
		click: function( menu, item ) {
			lastItem = item;
//          window.console.log("clck: ", menu.children( ":eq(" + item + ")" ).find( "a:first" ).length);
			menu.children( ":eq(" + item + ")" ).find( "a:first" ).trigger( "click" );
		},
		entry: function( menu, item ) {
			return menu.children( ":eq(" + item + ")" );
		}
	};
}
*/



TOOLS.formatNumber = function(num) {
	var parts = num.toFixed(0).toString().split(".");
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return parts.join(".");
};


TOOLS.makeBenchWrapper = function(assert, testName, count, callback) {
	return function() {
		var elap,
			start = +new Date();

//        callback.apply(this, arguments);
		callback.call();
		elap = +new Date() - start;
		if( count && elap ){
			assert.ok(true, testName + " took " + elap + " milliseconds, " + TOOLS.formatNumber(1000 * count / elap) + " items/sec");
		}else{
			assert.ok(true, testName + " took " + elap + " milliseconds");
		}
		TOOLS.TOTAL_ELAP += elap;
	};
};


/* Execute callback immediately and log timing as test result.
 * This function should be called inside a test() function.
 */
TOOLS.benchmark = function(assert, testName, count, callback) {
	TOOLS.makeBenchWrapper(assert, testName, count, callback).call();
};


/**
 * AsyncTimer
 */

function AsyncTimer(assert, name, count, start){
	this.assert = assert;
	this.done = null;
	this.name = "AsyncTimer(" + name + ")";
	this.stamp = null;
	this.count = count;
	if(start !== false){
		this.start();
	}
}
TOOLS.AsyncTimer = AsyncTimer;
AsyncTimer.prototype = {
	start: function(){
		/*jshint expr:true */
		window.console && window.console.time && window.console.time(this.name);
		// halt QUnit
		// this.done = this.assert.async();
		this.stamp = +new Date();
	},
	stop: function(){
		/*jshint expr:true */
		window.console && window.console.timeEnd && window.console.timeEnd(this.name);
		var elap = +new Date() - this.stamp;
		if( this.count && elap ){
			this.assert.ok(true, this.name + " took " + elap + " milliseconds, " + TOOLS.formatNumber(1000.0 * this.count / elap) + " items/sec");
		}else{
			this.assert.ok(true, this.name + " took " + elap + " milliseconds");
		}
		TOOLS.TOTAL_ELAP += elap;
		// Continue QUnit
		// this.done();
	},
	subtime: function(info){
		var elap = +new Date() - this.stamp;
		this.assert.ok(true, "... " + this.name + " until '" + info + "' took " + elap + " milliseconds");
	}
};

/** Create a profile wrapper.
 *
 */
/*
function profileWrapper(fn, flag, opts){
	if( flag === false ){
		return fn;
	}
	opts = $.extend({printTime: true}, opts);
	var start, elap,
		stats = {
			count: 0,
			countDeep: 0,
			maxLevel: 0,
			min:  Math.pow(2, 32) - 1,
			max: 0,
			sum: 0
		},
		name = fn.name,
		level = 0,
		//
		wrapper = function(){
			level += 1;
			stats.countDeep += 1;
			stats.maxLevel = Math.max(stats.maxLevel, level);
			if( level === 1 ){
				stats.count += 1;
				if( opts.printTime ){
					console.time(name);
				}
				start = new Date().getTime();
				fn.apply(this, arguments);
				elap = new Date().getTime() - start;

				if(opts.printTime){
					console.timeEnd(name);
				}
				stats.min = Math.min(stats.min, elap);
				stats.max = Math.max(stats.max, elap);
				stats.sum += elap;
			}else{
				// We don't collect stats for recursive calls
				fn.apply(this, arguments);
			}
			level -= 1;
		};

	wrapper.stats = function(){
		return stats;
	};
	return wrapper;
}
*/

}(jQuery, window, document));
