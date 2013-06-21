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