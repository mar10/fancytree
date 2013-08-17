# Fancytree extensions

[Fancytree] comes with a number of extensions.

## Using Fancytree extensions

1. Include extension module (after jQuery, jQueryUI, and the core fancytree libraries).  
   Optionally include associated style sheets. 
2. Enable the extension in the tree's `extensions` option.
3. Optionally define options and event handlers for that extension

This example uses two extensions ('table' and 'themeroller'):

```html
<!DOCTYPE>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">
    <title>Fancytree - Example</title>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" type="text/javascript"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js" type="text/javascript"></script>
    <link href="../src/skin-themeroller/ui.fancytree.css" rel="stylesheet" type="text/css">

    <script src="../src/jquery.fancytree.js" type="text/javascript"></script>
    <script src="../src/jquery.fancytree.table.js" type="text/javascript"></script>
    <script src="../src/jquery.fancytree.themeroller.js" type="text/javascript"></script>

    <script type="text/javascript">
    $(function(){
        $("#treetable").fancytree({
            // Define additional extensions:
            extensions: ["table", "themeroller"],
            // This is a core option
            source: {
                url: "/getTreeData"
            },
            // Define table-extension options:
            table: {
                indentation: 24,
                nodeColumnIdx: 1
            },
            // A core event:
            activate: function(e, data) {
            },
            // This event is part of the table extension:
            renderColumns: function(e, data) {
                var node = data.node,
                    $tdList = $(node.tr).find(">td");
                $tdList.eq(1).text(node.key);
            }
        });
    });
    </script>
</head>
<body class="example">
    <div id="tree"></div>
</body>
</html>
```

## Writing Fancytree extensions

```js
$("#tree").fancytree({
    source: {url: "myAjaxProvider"}
});
```


[Fancytree]: https://github.com/mar10/fancytree
