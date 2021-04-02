(function($, window, document, undefined) {
	/*globals QUnit */

	var TOOLS = {},
		log = [],
		FIXTURE_SELECTOR = "#tree";

	window.TEST_TOOLS = TOOLS;

	// TOOLS.EVENT_SEQUENCE = [];
	TOOLS.EVENT_SEQUENCE = "<deprecated: use assert.EVENT_SEQUENCE instead>";
	TOOLS.TOTAL_ELAP = 0;

	/*******************************************************************************
	 * QUnit setup
	 */
	TOOLS.initQUnit = function() {
		// See https://github.com/axemclion/grunt-saucelabs
		QUnit.done(function(testResults) {
			var details,
				i,
				len,
				tests = [];

			for (i = 0, len = log.length; i < len; i++) {
				details = log[i];
				tests.push({
					name: details.name,
					result: details.result,
					expected: details.expected,
					actual: details.actual,
					source: details.source,
				});
			}
			testResults.tests = tests;

			window.global_test_results = testResults; // used by saucelabs
			//console.info("Set window.global_test_results =", window.global_test_results);
			// Expand first section when all tests are run
			$("ol#qunit-tests > li")
				.first()
				.find("> ol")
				.show("slow");
		});

		// See https://github.com/axemclion/grunt-saucelabs
		QUnit.testStart(function(testDetails) {
			QUnit.log(function(details) {
				if (!details.result) {
					details.name = testDetails.name;
					log.push(details);
				}
			});
		});

		// // Log something if test fails
		// QUnit.testDone( function( details ) {
		// 	if( !details.failed || !details.total || !window.console ) {
		// 		return;
		// 	}
		// 	var result = {
		// 		"Module name": details.module,
		// 		"Test name": details.name,
		// 		"Assertions": {
		// 			"Total": details.total,
		// 			"Passed": details.passed,
		// 			"Failed": details.failed
		// 		},
		// 		"Skipped": details.skipped,
		// 		"Todo": details.todo,
		// 		"Runtime": details.runtime
		// 		};
		// 	window.console.error( JSON.stringify( result, null, 2 ) );
		// });

		// Timeout async tests after 30 seconds
		QUnit.config.testTimeout = 30000;

		// Silence, please
		$.ui.fancytree.debugLevel = 1;
	};

	TOOLS.createInfoSection = function() {
		// Create the first informational section
		QUnit.module("Configuration and Summary");

		QUnit.test("Version info", function(assert) {
			TOOLS.setup(assert);
			assert.expect(5);

			assert.ok(
				true,
				"Fancytree v" +
					$.ui.fancytree.version +
					", buildType='" +
					$.ui.fancytree.buildType +
					"'"
			);
			assert.ok(
				true,
				"jQuery UI " +
					jQuery.ui.version +
					" (uiBackCompat=" +
					$.uiBackCompat +
					")"
			);
			assert.ok(true, "jQuery " + jQuery.fn.jquery);
			assert.ok(true, "Browser: " + TOOLS.getBrowserInfo());
			assert.ok(
				true,
				"Cumulated test time: " + TOOLS.TOTAL_ELAP + " milliseconds"
			);
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
		if (!assert || !assert.deepEqual) {
			$.error("assert must be passed");
		}
		if (typeof msg !== "string") {
			$.error("msg must be a string");
		}
		if (!assert.EVENT_SEQUENCE) {
			$.error("TOOLS.setup() was not called");
		}
		assert.EVENT_SEQUENCE.push(msg);
	};

	TOOLS.clearEvents = function(assert) {
		if (!assert || !assert.deepEqual) {
			$.error("assert must be passed");
		}
		if (!assert.EVENT_SEQUENCE) {
			$.error("TOOLS.setup() was not called");
		}
		assert.EVENT_SEQUENCE = [];
	};

	/** Replacement for deprecated `$.isFunction`. */
	TOOLS.isFunction = function(obj) {
		return typeof obj === "function";
	};

	/** Replacement for deprecated `$.trim`. */
	TOOLS.trim = function(text) {
		return text == null ? "" : text.trim();
	};

	/** Helper to reset environment for asynchronous Fancytree tests. */
	TOOLS.setup = function(assert) {
		if (!assert) {
			$.error("Need assert arg");
		}
		if (assert.EVENT_SEQUENCE) {
			$.error("Duplicate setup()");
		}
		assert.EVENT_SEQUENCE = [];
		if ($(FIXTURE_SELECTOR).is(":ui-fancytree")) {
			$(FIXTURE_SELECTOR).fancytree("destroy");
		}
	};

	/** Return an info string of current browser. */
	TOOLS.getBrowserInfo = function() {
		var n = navigator.appName,
			ua = navigator.userAgent,
			tem,
			m = ua.match(
				/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i
			);

		if (m && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) {
			m[2] = tem[1];
		}
		m = m ? [m[1], m[2]] : [n, navigator.appVersion, "-?"];
		return m.join(", ");
	};

	/** Get FancytreeNode from current tree. */
	TOOLS.getNode = function(key) {
		return TOOLS.getTree().getNodeByKey(key);
	};

	/** Get first node with matching title. */
	TOOLS.getNodeByTitle = function(title) {
		var tree = $.ui.fancytree.getTree("#tree");

		return tree.findFirst(function(n) {
			return n.title === title;
		});
	};

	/** Get current Fancytree. */
	TOOLS.getTree = function() {
		return $.ui.fancytree.getTree(FIXTURE_SELECTOR);
	};

	/** Get node title as rendered in the DOM. */
	TOOLS.getNodeTitle = function(key) {
		var node = TOOLS.getNode(key);
		if (!node) {
			return undefined;
		}
		return $(node.span)
			.find(".fancytree-title")
			.html();
	};

	/** Convert array of nodes to array to array of node keys. */
	TOOLS.getNodeKeyArray = function(nodeArray) {
		if (!Array.isArray(nodeArray)) {
			return nodeArray;
		}
		return $.map(nodeArray, function(n) {
			return n.key;
		});
	};

	/** Generate a large hierarchy of nodes
	 */
	TOOLS.addGenericNodes = function(node, options, callback) {
		var d,
			f,
			i,
			j,
			k,
			key,
			opts = $.extend(
				{
					level1: 1,
					level2: 0,
					level3: 0,
					disableUpdate: true,
				},
				options
			);

		function _cb(parentNode, data, i, j, k) {
			if (!callback || callback(data, i, j, k) !== false) {
				return parentNode.addChildren(data);
			}
		}

		if (opts.disableUpdate) {
			node.tree.enableUpdate(false);
		}

		for (i = 0; i < opts.level1; i++) {
			key = "" + (i + 1);
			f = _cb(
				node,
				{ title: "Folder_" + key, key: key, folder: true },
				i,
				0,
				0
			);
			for (j = 0; j < opts.level2; j++) {
				key = "" + (i + 1) + "." + (j + 1);
				d = _cb(f, { title: "Node_" + key, key: key }, i, j, 0);
				for (k = 0; k < opts.level3; k++) {
					key = "" + (i + 1) + "." + (j + 1) + "." + (k + 1);
					_cb(d, { title: "Node_" + key, key: key }, i, j, k);
				}
			}
		}
		if (opts.disableUpdate) {
			node.tree.enableUpdate(true);
		}
	};

	/** Fake an Ajax request, return a $.Promise. */
	TOOLS.fakeAjaxLoad = function(node, count, delay) {
		delay = delay || 0;
		if (Array.isArray(delay)) {
			// random delay range [min..max]
			delay = Math.round(
				delay[0] + Math.random() * (delay[1] - delay[0])
			);
		}
		var dfd = new $.Deferred();
		setTimeout(function() {
			var i,
				children = [];
			for (i = 0; i < count; i++) {
				children.push({
					key: node.key + "_" + (i + 1),
					title: node.title + "_" + (i + 1),
					lazy: true,
				});
			}
			// emulate ajax deferred: done(data, textStatus, jqXHR)
			dfd.resolveWith(this, [children, null, null]);
		}, delay);
		return dfd.promise();
	};

	/** Format a number as string with thousands-separator. */
	TOOLS.formatNumber = function(num) {
		var parts = num
			.toFixed(0)
			.toString()
			.split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	};

	TOOLS.makeBenchWrapper = function(assert, testName, count, callback) {
		return function() {
			var elap,
				start = Date.now();

			//        callback.apply(this, arguments);
			callback.call();
			elap = Date.now() - start;
			if (count && elap) {
				assert.ok(
					true,
					testName +
						" took " +
						elap +
						" milliseconds, " +
						TOOLS.formatNumber((1000 * count) / elap) +
						" items/sec"
				);
			} else {
				assert.ok(true, testName + " took " + elap + " milliseconds");
			}
			TOOLS.TOTAL_ELAP += elap;
		};
	};

	/* Execute callback immediately and log timing as test result.
	 * This function should be called inside a QUnit.test() function.
	 */
	TOOLS.benchmark = function(assert, testName, count, callback) {
		TOOLS.makeBenchWrapper(assert, testName, count, callback).call();
	};

	/* Execute callback, then  immediately and log timing as test result.
 *
 * Example:
 *
	tools.benchmarkWithReflowAsync(assert, tree, "Add 500x500 nodes", null, function(){
		// Add benchark code:
		tools.addGenericNodes(node, {level1: 500, level2: 500});
	}).done(function(){
		// Reflow and Redraw finished and have beem logged
		// ...
	});
 *
 * This function should be called inside a QUnit.test() function.
 */
	TOOLS.benchmarkWithReflowAsync = function(
		assert,
		tree,
		testName,
		count,
		callback
	) {
		var elap1,
			elap2,
			elap3,
			msg,
			dfd = new $.Deferred(),
			start = Date.now();

		callback.call();
		elap1 = Date.now() - start; // raw execution time

		// Query div size to trigger a layout reflow
		// As a call to a dummy function to prevent optimizations (cargo-cult?)
		// $.noop(window.innerHeight);
		$.noop(tree.$div[0].offsetHeight);
		elap2 = Date.now() - start; // execution time incl. reflow

		// Yield to interpreter -- Hopefully this will cause the browser to redraw,
		// so we can capture the timings:
		setTimeout(function() {
			elap3 = Date.now() - start; // execution time incl. reflow & redraw
			msg =
				testName +
				" took " +
				elap3 +
				" ms (reflow w/o redraw: " +
				elap2 +
				" ms, raw: " +
				elap1 +
				" ms)";
			if (count && elap1) {
				msg +=
					", " +
					TOOLS.formatNumber((1000 * count) / elap3) +
					" items/sec";
			}
			assert.ok(true, msg);
			TOOLS.TOTAL_ELAP += elap3;
			dfd.resolve();
		}, 0);
		return dfd.promise();
	};

	/**
	 * AsyncTimer
	 */

	function AsyncTimer(assert, name, count, start) {
		this.assert = assert;
		this.done = null;
		this.name = "AsyncTimer(" + name + ")";
		this.stamp = null;
		this.count = count;
		if (start !== false) {
			this.start();
		}
	}
	TOOLS.AsyncTimer = AsyncTimer;
	AsyncTimer.prototype = {
		toString: function() {
			return this.name;
		},
		start: function() {
			/*jshint expr:true */
			window.console &&
				window.console.time &&
				window.console.time(this.name);
			// halt QUnit
			// this.done = this.assert.async();
			this.stamp = Date.now();
			this.lastStamp = this.stamp;
		},
		stop: function() {
			/*jshint expr:true */
			window.console &&
				window.console.timeEnd &&
				window.console.timeEnd(this.name);
			var elap = Date.now() - this.stamp;
			if (this.count && elap) {
				this.assert.ok(
					true,
					this.name +
						" took " +
						elap +
						" milliseconds, " +
						TOOLS.formatNumber((1000.0 * this.count) / elap) +
						" items/sec"
				);
			} else {
				this.assert.ok(
					true,
					this.name + " took " + elap + " milliseconds"
				);
			}
			TOOLS.TOTAL_ELAP += elap;
			// Continue QUnit
			// this.done();
		},
		subtime: function(info) {
			var now = Date.now(),
				elap = now - this.lastStamp;
			this.lastStamp = now;
			this.assert.ok(
				true,
				"... " +
					this.name +
					" until '" +
					info +
					"' took " +
					elap +
					" milliseconds"
			);
		},
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
				start = Date.now();
				fn.apply(this, arguments);
				elap = Date.now() - start;

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
})(jQuery, window, document);
