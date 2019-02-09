# ![logo](doc/logo.png?raw=true) Fancytree
[![GitHub version](https://badge.fury.io/gh/mar10%2Ffancytree.svg)](https://github.com/mar10/fancytree/releases/latest)
[![Build Status](https://travis-ci.org/mar10/fancytree.svg?branch=master)](https://travis-ci.org/mar10/fancytree)
[![Selenium Test Status](https://saucelabs.com/buildstatus/sauce-fancytree)](https://saucelabs.com/u/sauce-fancytree)
[![npm](https://img.shields.io/npm/dm/jquery.fancytree.svg)](https://www.npmjs.com/package/jquery.fancytree)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/jquery.fancytree/badge)](https://www.jsdelivr.com/package/npm/jquery.fancytree)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Fancytree (sequel of [DynaTree 1.x](https://code.google.com/p/dynatree/)) is a
JavaScript tree view / tree grid plugin with support for keyboard, inline editing,
filtering, checkboxes, drag'n'drop, and lazy loading.

[ ![sample](doc/teaser2.png?raw=true) ](https://wwWendt.de/tech/fancytree/demo "Live demo")


### Status

[![GitHub version](https://badge.fury.io/gh/mar10%2Ffancytree.svg)](https://github.com/mar10/fancytree/releases/latest)
See the [change log](https://github.com/mar10/fancytree/blob/master/CHANGELOG.md)
for details.


### Get Started

  * [Try the live demo](https://wwWendt.de/tech/fancytree/demo).
  * [Read the documentation](https://github.com/mar10/fancytree/wiki).
  * [Check the Q&A forum](https://groups.google.com/forum/#!forum/fancytree) or
    [Stackoverflow](http://stackoverflow.com/questions/tagged/fancytree) if you have questions.
  * Play with [jsFiddle](http://jsfiddle.net/mar10/KcxRd/),
    [CodePen](https://codepen.io/mar10/pen/WMWrbq),
    or [Plunker](http://plnkr.co/edit/8sdy3r?p=preview).
  * [Contribute](https://github.com/mar10/fancytree/wiki/HowtoContribute)


### ES6 Quickstart

```js
import $ from "jquery";

import 'jquery.fancytree/dist/skin-lion/ui.fancytree.less';  // CSS or LESS

import {createTree} from 'jquery.fancytree';

import 'jquery.fancytree/dist/modules/jquery.fancytree.edit';
import 'jquery.fancytree/dist/modules/jquery.fancytree.filter';

const tree = createTree('#tree', {
  extensions: ['edit', 'filter'],
  source: {...},
  ...
});
// Note: Loading and initialization may be asynchronous, so the nodes may not be accessible yet.
```

See [module loader support](https://github.com/mar10/fancytree/wiki#use-a-module-loader) and
[API docs](https://wwWendt.de/tech/fancytree/doc/jsdoc/Fancytree_Static.html#createTree).


### Credits

Thanks to all [contributors](https://github.com/mar10/fancytree/contributors).


### Browser Status Matrix

[![Selenium Test Status](https://saucelabs.com/browser-matrix/sauce-fancytree.svg)](https://saucelabs.com/u/sauce-fancytree)
