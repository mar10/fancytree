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
            // Events:
            init: $.noop,
            render: $.noop,
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
            this._trigger("init");
        },
        /**
         * Handle option changes in the configurator panel (checkboxes, comboboxes, ...)
         * @param event
         */
        _onOptionChange: function(event){
            var $ctrl = $(event.target),
                name = $ctrl.attr("name"),
                value = $ctrl.val();
//                def = this.options.optionList[name];

            if($ctrl.is(":checkbox")){
                value = $ctrl.is(":checked");
            }else if(!isNaN(parseInt(value, 10))){
                v = parseInt(value, 10);
            }
            this.element[this.options.pluginName]("option", name, value);
//            alert("change: " + name + ": " + value + ", ");
            this.renderCode();
            this._trigger("change", name, value);
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
            var plugin = $(this.element).data("ui-" + this.options.pluginName) || $(this.element).data(this.options.pluginName),
                opts = this.options,
                actualOpts = plugin.options,
                availOptList = opts.optionList,
                $opts = $(this.options.optionTarget).empty(),
                $ul = $("<ul>").appendTo($opts),
                $li = null; 
            $.each(availOptList, function(i, o){
                if( typeof o.value === "boolean"){
                    $li = $("<li>").append(
                        $("<input>", {
                            id: o.name,
                            name: o.name,
                            type: "checkbox",
                            checked: !!actualOpts[o.name]  //o.value
                        })
                    ).append(
                        $("<label>", {"for": o.name, text: " " + o.hint})
                    );
                }else if( typeof o.value === "number" || typeof o.value === "string"){
                    $li = $("<li>").append(
                            $("<label>", {"for": o.name, text: " " + o.name})
                        ).append(
                            $("<input>", {
                                id: o.name,
                                name: o.name,
                                type: "text",
                                value: actualOpts[o.name] //o.value
                            })
                        );
                }else if( $.isArray(o.value) ){
                    $li = $("<li>")
                        .append(
                            $("<label>", {"for": o.name, text: " " + o.name})
                        ).append(
                            $("<select>", {
                                id: o.name,
                                name: o.name,
                                size: 1
                            })
                        );
                    var $sel = $li.find("select");
                    $.each(o.value, function(){
                        $sel.append($("<option>", {
                            value: this.value,
                            text: this.name,
                            selected: (actualOpts[o.name] == this.value)  //this.selected
                        }));
                    });
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
                header = opts.header || '$("#selector").' + opts.pluginName + "({", 
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
            this._trigger("render");
        }
    });
} (jQuery));