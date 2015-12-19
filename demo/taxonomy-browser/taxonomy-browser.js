/*!
 * Fancytree Taxonomy Browser
 *
 * Copyright (c) 2015, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

/*globals console, Handlebars */

"use strict";

/*******************************************************************************
 * Private functions and variables
 */

var taxonTree, searchResultTree,
	timerMap = {},
	tmplDetails, // = 
	USER_AGENT = "Fancytree Taxonomy Browser/1.0",
	GBIF_URL = "http://api.gbif.org/v1/",
	TAXONOMY_KEY = "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",  // GBIF backbone taxonomy
	glyphOpts = {
		map: {
			doc: "glyphicon glyphicon-file",
			docOpen: "glyphicon glyphicon-file",
			checkbox: "glyphicon glyphicon-unchecked",
			checkboxSelected: "glyphicon glyphicon-check",
			checkboxUnknown: "glyphicon glyphicon-share",
			dragHelper: "glyphicon glyphicon-play",
			dropMarker: "glyphicon glyphicon-arrow-right",
			error: "glyphicon glyphicon-warning-sign",
			expanderClosed: "glyphicon glyphicon-plus-sign",
			expanderLazy: "glyphicon glyphicon-plus-sign",  // glyphicon-expand
			expanderOpen: "glyphicon glyphicon-minus-sign",  // glyphicon-collapse-down
			folder: "glyphicon glyphicon-folder-close",
			folderOpen: "glyphicon glyphicon-folder-open",
			loading: "glyphicon glyphicon-refresh"
		}
	};

// Load and compile handlebar templates

$.get( "details.tmpl.html", function( data ) {
	tmplDetails = Handlebars.compile(data);
});

/** Update UI elements according to current status
 */
function updateControls() {
	var query = $.trim($("input[name=query]").val());

	$("#btnPin")
		.attr("disabled", !taxonTree.getActiveNode());
	$("#btnUnpin")
		.attr("disabled", !taxonTree.isFilterActive())
		.toggleClass("btn-success", taxonTree.isFilterActive());
	$("#btnResetSearch")
		.attr("disabled", query.length === 0);
	$("#btnSearch")
		.attr("disabled", query.length < 2);
}

/** 
 */
function appendStatusNodeMore(response, result) {
	if( response.count != null && response.offset + response.limit < response.count ) {
		result.push({
			title: "(" + (response.count - response.offset - response.limit) + " more)",
			statusNodeType: "more"
			});
	} else if( response.endOfRecords === false ) {
		result.push({
			title: "(more)",
			statusNodeType: "more"
			});
	}
}

/**
 * Invoke callback after `ms` miliseconds.
 * Any pending action of this type is cancelled before.
 */
function _delay(tag, ms, callback) {
	/*jshint -W040:true */
	var self = this;

	tag = "" + (tag || "default");
	if( timerMap[tag] != null ) {
		clearTimeout(timerMap[tag]);
        delete timerMap[tag];
        // console.log("Cancel timer '" + tag + "'");
	}
	if( ms == null || callback == null ) {
		return;
	}
    // console.log("Start timer '" + tag + "'");
	timerMap[tag] = setTimeout(function(){
        // console.log("Execute timer '" + tag + "'");
		callback.call(self);
	}, +ms);
}

/**
 */
function _callWebservice(cmd, data) {
	return $.ajax({
		url: GBIF_URL + cmd,
		data: $.extend({
		}, data),
		cache: true,
		headers: { "Api-User-Agent": USER_AGENT },
		dataType: "jsonp"
	});
}

/**
 */
function updateItemDetails(key) {
	$("#itemDetails").addClass("busy");
	// $("#itemDetails").text("Loading TSN " + key + "...");
	$.bbq.pushState({key: key});

	_callWebservice("species/" + key, {
		// key: key
	}).done(function(result){
		console.log("updateItemDetails", result);
		result._now = new Date().toString();
		$("#itemDetails")
			.html(tmplDetails(result))
			.removeClass("busy");

		updateControls();
	});
}

/**
 */
function updateBreadcrumb(key, loadTreeNodes) {

	var $ol = $("ol.breadcrumb").addClass("busy"),
		activeNode = taxonTree.getActiveNode();

	if( activeNode && activeNode.key !== key ) {
		activeNode.setActive(false); // deactivate, in case the new key is not found
	}
	$.when(
		_callWebservice("species/" + key + "/parents"),
		_callWebservice("species/" + key)
	).done(function(parents, node){
		// Both requests resolved (result format: [ data, statusText, jqXHR ])
		var nodeList = parents[0],
			keyList = [];

		nodeList.push(node[0]);

		// Display as <OL> list (for Bootstrap breadcrumbs)
		$ol.empty().removeClass("busy");
		$.each(nodeList, function(i, o){
			var name = o.vernacularName || o.canonicalName;
			keyList.push(o.key);
			if( "" + o.key === "" + key ) {
				$ol.append(
					$("<li class='active'>").append(
						$("<span>", {
							text: name,
							title: o.rank
						})));
			} else {
				$ol.append(
					$("<li>").append(
						$("<a>", {
							href: "#key=" + o.key,
							text: name,
							title: o.rank
						})));
			}
		});
		if( loadTreeNodes ) {
			// console.log("updateBreadcrumb - loadKeyPath", keyList);
			taxonTree.loadKeyPath("/" + keyList.join("/"), function(node, status){
				// console.log("... updateBreadcrumb - loadKeyPath", status, node);
				switch( status ) {
				case "loaded":
					node.makeVisible();
					break;
				case "ok":
					node.setActive();
					break;
				}
			});
		}
	});
}

/** 
 */
function search(query) {
	query = $.trim(query);
	console.log("searching for '" + query + "'...");
	$("#searchResultTree").addClass("busy");
	searchResultTree.reload({
		// url: GBIF_URL + "species/match",  // Fuzzy matches scientific names against the GBIF Backbone Taxonomy
		url: GBIF_URL + "species/search",  // Full text search of name usages covering the scientific and vernacular name, the species description, distribution and the entire classification across all name usages of all or some checklists
		data: {
			q: query,
			datasetKey: TAXONOMY_KEY,
			// name: query,
			// strict: "true",
			// hl: true,
			limit: 10,
			offset: 0
		},
		cache: true
		// headers: { "Api-User-Agent": USER_AGENT }
		// dataType: "jsonp"
	}).done(function(result){
		// console.log("search returned", result);
		$("#searchResultTree").removeClass("busy");
		updateControls();
	});
}


/*******************************************************************************
 * Pageload Handler
 */

$(function(){

$("#taxonTree").fancytree({
	extensions: ["filter", "glyph", "wide"],
	filter: {
		mode: "hide"
	},
	glyph: glyphOpts,
	activeVisible: true,
	source: {
		url: GBIF_URL + "species/root/" + TAXONOMY_KEY,
		data: {},
		cache: true
		// dataType: "jsonp"
	},
	init: function(event, data) {
		updateControls();
		$(window).trigger("hashchange"); // trigger on initial page load
	},
	lazyLoad: function(event, data) {
		data.result = {
			url: GBIF_URL + "species/" + data.node.key + "/children",
			data: {
				limit: 200
			},
			cache: true
			// dataType: "jsonp"
		};
	},
	postProcess: function(event, data) {
		var response = data.response;

		data.node.info("taxonTree postProcess", response);
		data.result = $.map(response.results, function(o){
			return o && {title: o.vernacularName || o.canonicalName, key: o.key, nubKey: o.nubKey, folder: true, lazy: true};
		});
		appendStatusNodeMore(response, data.result);
	},
	activate: function(event, data) {
		$("#itemDetails").addClass("busy");
		$("ol.breadcrumb").addClass("busy");
		updateControls();
		_delay("showDetails", 500, function(){
			updateItemDetails(data.node.key);
			updateBreadcrumb(data.node.key);
		});
	}
});


$("#searchResultTree").fancytree({
	extensions: ["table", "wide"],
	source: [{title: "No Results."}],
	minExpandLevel: 2,
	icon: false,
	table: {
		nodeColumnIdx: 1
	},
	postProcess: function(event, data) {
		var response = data.response;

		data.node.info("search postProcess", response);
		data.result = $.map(response.results, function(o){
			// if( !o ) { return; }
			var res = { title: o.canonicalName, key: o.key, author: o.authorship,
						matchType: o.nameType };
			res.commonNames = $.map(o.vernacularNames, function(o){
					return o.commonName ? {name: o.commonName, language: o.language} : undefined;
				});
			return res;
		});
		appendStatusNodeMore(response, data.result);
	},
	renderColumns: function(event, data) {
		var node = data.node,
			$tdList = $(node.tr).find(">td"),
			cnList = node.data.commonNames ? $.map(node.data.commonNames, function(o){
					return o.name;
				}) : [];

		$tdList.eq(0).text(node.key).addClass("hidden-sm");
		$tdList.eq(2).text(cnList.join(", ")).addClass("hidden-xs");
		$tdList.eq(3).text(node.data.matchType).addClass("hidden-sm");
		$tdList.eq(4).text(node.data.author).addClass("hidden-xs");
	},
	activate: function(event, data) {
		_delay("activateNode", 500, function(){
			updateItemDetails(data.node.key);
			updateBreadcrumb(data.node.key);
		});
	}
});


taxonTree = $("#taxonTree").fancytree("getTree");
searchResultTree = $.ui.fancytree.getTree("#searchResultTree");


// Bind a callback that executes when document.location.hash changes.
// (This code uses bbq: https://github.com/cowboy/jquery-bbq)
$(window).bind( "hashchange", function(e) {
	var key = $.bbq.getState( "key" );
	console.log("bbq key", key);
	if( key ) {
		updateBreadcrumb(key, true);
	}
}); // don't trigger now, since we need the the taxonTree root nodes to be loaded first

$("input[name=query]").keyup(function(e){
	var query = $.trim($(this).val());

	if(e && e.which === $.ui.keyCode.ESCAPE || query === ""){
		$("#btnResetSearch").click();
		return;
	}
	if(e && e.which === $.ui.keyCode.ENTER && query.length >= 2){
		$("#btnSearch").click();
		return;
	}
	_delay("search", 500, function(){
		$("#btnSearch").click();
	});
	$("#btnResetSearch").attr("disabled", query.length === 0);
	$("#btnSearch").attr("disabled", query.length < 2);
}).focus();

$("#btnResetSearch").click(function(e){
	$("#searchResultPane").collapse("hide");
	$("input[name=query]").val("");
	// TODO: use clear with v2.14
	// searchResultTree.clear();
	searchResultTree.getRootNode().removeChildren();
	updateControls();
});

$("#btnSearch").click(function(event){
	$("#searchResultPane").collapse("show");
	search(	$("input[name=query]").val() );
}).attr("disabled", true);

$("#btnPin").click(function(event){
	taxonTree.filterBranches(function(n){
		return n.isActive();
	});
	updateControls();
});

$("#btnUnpin").click(function(event){
	taxonTree.clearFilter();
	updateControls();
});

// -----------------------------------------------------------------------------
}); // end of pageload handler

}(jQuery, window, document));
