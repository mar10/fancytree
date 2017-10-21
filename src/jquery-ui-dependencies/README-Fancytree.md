# Customized jQuery UI library for Fancytree

This folder contains a jQuery UI build with all widgets minimally required
by Fancytree:

  - widget.js
  - position.js
  - keycode.js
  - scroll-parent.js
  - unique-id.js
  - effect.js
  - effects/effect-blind.js

During the build step, the file `jquery-ui.js` is added as part of jquery.fancytree-all-deps.js,
then  minified and a source map generated.


## Modifications

`jquery.fancytree-all-deps.min.js` supports AMD and CommonJS module syntax, so
the code is wrapped by a module intro and outro pattern.<br>
The jQuery UI library (as downloaded from https://jqueryui.com/download/) does
the same, but any module can only export one object:<br>
we want `require("jquery.fancytree")` to return the Fancytree widget.

Therefore we modify the original `jquery-ui.js` download an replace the original
UMD headers with a plain closure:

```js
/*
(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {
*/
(function( $ ) {

	...

// }));
})(jQuery);
```


**Note:** We do not need to modify `jquery-ui.min.js`, since it is not currently
used in the build process.


## Updating this Dependencies

1. Download new versions from http://jqueryui.com .
2. Apply modifcations as described above.
3. run `grunt build` to test.
