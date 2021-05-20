# Fancytree Style Guide

Fancytree follows the [jQuery](http://contribute.jquery.org/style-guide/) style
guide, with the following exceptions and additions:

## For JavaScript:

Please compare these rules with the [jQuery JavaScript Style Guide](http://contribute.jquery.org/style-guide/js/).

### Spacing:

- Comments do not need to preceded by a blank line.
- Contrary to the jQuery "Good Examples," parentheses and braces should generally not be spaced:

```
// jQuery "Good Examples":

if ( condition ) {
    doSomething();
} else if ( otherCondition ) {
    somethingElse();
} else {
    otherThing();
}
 
array = [ "*" ];
 
array = [ a, b ];
 
foo( arg );
 
foo( options, object[ property ] );

// Fancytree style:

if (condition) {
	doSomething();
} else if (otherCondition) {
	somethingElse();
} else {
	otherThing();
}
 
array = ["*"];
 
array = [a, b];
 
foo(arg);
 
foo(options, object[property]);
```

- However, single-line object expressions *are* spaced:

```
MOUSE_BUTTONS = { 0: "", 1: "left", 2: "middle", 3: "right", },
```

- In anonymous functions, no space is used between the word "function" and the parameter list:

```
function(e) {
	return parseInt(e, 10);
}
```

### Full File Closures:

- With a UMD wrapper, the body does get indented.

### Comments:

- Comments do not need to always be preceded by a blank line.
- Though *code* uses double quotes, quotes used inside comments are backticks:

```
REX_TOOLTIP = /[<>"'/]/g, // Don't escape `&` in tooltips.
RECURSIVE_REQUEST_ERROR = "$recursive_request",
```
- Note that some block comments are used to generate documentation. In such comments, use single quotes where the quotes should appear in the documentation, and use backticks to set off code:

```
 * @property {FancytreeNode[] | null | undefined} children Array of child nodes.<br>
 *     For lazy nodes, null or undefined means 'not yet loaded'. Use an empty array
 *     to define a node that has no children.
 * @property {string} extraClasses Additional CSS classes, added to the node's `<span>`.<br>
 *     Note: use `node.add/remove/toggleClass()` to modify.
````

### Naming Conventions:

- Variable and function names do not need to be full words; they may be abbreviations.
  
### Switch Statements:

- When using `switch` statements, indent `case` statements.
- When a `case` block ends with a `return` statement, `break` should be omitted.

### Punctuation:

- Use trailing commas:

```
// Bad:
NONE_NODE_DATA_MAP = {
	active: true,
	children: true,
	data: true,
	focus: true
};

// Good:
NONE_NODE_DATA_MAP = {
	active: true,
	children: true,
	data: true,
	focus: true,
};
```
