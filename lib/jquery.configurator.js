/*******************************************************************************
 * jQuery.configurator plugin.
 * 
 * Change CSS include when combobox selection changes.
 * Copyright (c) 2013 Martin Wendt
 * 
 * Usage:
	$("select#skinswitcher").skinswitcher({
		base: "../src/",
		choices: [{name: "XP", value: "xp", href: "skin/ui.dynatree.css"},
		          {name: "Vista", value: "vista", href: "skin-vista/ui.dynatree.css"},
		          {name: "Lion", value: "lion", href: "skin-lion/ui.dynatree.css"}
		          ],
		init: "lion"
	});
 */

(function ($) {
    $.widget("ui.configurator", {
        options: {
            pluginName: null,
            optionTarget: null,
            sourceTarget: null,
            optionList: [
                {name: "enabled", value: false, 
                 description: "Enables/disables the plugin"}
            ],
            hideDefaults: false,
            showComments: true,
            beforeChange: $.noop,
            change: $.noop
        },
        _create: function () {
            this.element.addClass("ui-configurator-target");
            $(this.options.optionTarget)
                .addClass("ui-configurator-options")
                .empty()
                .delegate("input", "change", $.proxy(this._onOptionChange, this));
            $(this.options.sourceTarget)
                .addClass("ui-configurator-source")
                .empty();
//            this.options.popup.addClass("ui-popup").hide();
//            this.element.on('click', this.options.delegate, $.proxy(this.triggerEvent, this));
            this._renderOptions();
            this.renderCode();
        },
        /**
         * Handle option changes in the configurator panel (checkboxes, comboboxes, ...)
         * @param event
         */
        _onOptionChange: function(event){
            var $ctrl = $(event.target),
                name = $ctrl.attr("name"),
                value = $ctrl.is(":checked"),
                def = this.options.optionList[name];
            this.element[this.options.pluginName]("option", name, value);
//            alert("change: " + name + ": " + value + ", ");
            this.renderCode();
        },
        /**
         * Handle $().configurator("option", ...) calls. 
         */
        _setOption: function(key, value){
            $.Widget.prototype._setOption.apply(this, arguments);
            this.renderCode();
        },
        /**
         * Render checkboxes and other controls into configurator panel.
         */
        _renderOptions: function(){
            var $opts = $(this.options.optionTarget).empty(),
                $ul = $("<ul>").appendTo($opts),
                $li; 
            $.each(this.options.optionList, function(i, o){
//                <li><label><input name="activeVisible" type="checkbox" checked="checked"> activeVisible</label>
//                <li>clickFolderMode
//                <select name="clickFolderMode" size="1">
//                    <option value="1">activate (1)</option>
//                    <option value="2">expand (2)</option>
//                    <option value="3">activate and expand with single click (3)</option>
//                    <option value="4" selected="selected">activate with single click, expand with dblclick (4)</option>
//                </select>
                if( typeof o.value === "boolean"){
                    $li = $("<li>").append(
                        $("<input>", {
                            id: o.name,
                            name: o.name,
                            type: "checkbox",
                            checked: !!o.value
                        })
                    ).append(
                        $("<label>", {"for": o.name, text: " " + o.hint})
                    );
                }
                $ul.append($li);
            });
        },
        /**
         * Render source code into source panel.
         */
        renderCode: function(){
            var plugin = $(this.element).data("ui-" + this.options.pluginName) || $(this.element).data(this.options.pluginName),
                opts = this.options,
                actualOpts = plugin.options,
                availOptList = opts.optionList,
                lines = [],
                header = opts.header || '$("#selector).' + opts.pluginName + "({", 
                footer = "});", 
                i;
            // Make a filtered copy of the option list (so we get the last ',' right)
            if(this.options.hideDefaults){
                availOptList = [];
                for(i=0; i<this.options.optionList.length; i++){
                    var o = this.options.optionList[i],
                        n = o.name;
                    if( actualOpts[n] !== o.value && actualOpts[n] !== undefined){
                        availOptList.push(o);
                    }
                }
            }
            // 
            lines.push(header);
            for(i=0; i<availOptList.length; i++){
                var o = availOptList[i],
                    actualVal = actualOpts[o.name],
                    line = "    " + o.name + ": ";
                if(typeof actualVal === "string"){
                    line += '"' + actualVal + '"';
                }else{
                    line += "" + actualVal;
                }
                if( i < (availOptList.length - 1) ){
                    line += ",";
                }
                if( opts.showComments ){
                    line += " // " + o.hint;
                }
                lines.push(line);
            }
            lines.push(footer);
            $(opts.sourceTarget).addClass("ui-configurator-source").text(lines.join("\n"));
        }
    });
} (jQuery));