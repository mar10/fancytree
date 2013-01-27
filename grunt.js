/*jshint node:true */

module.exports = function(grunt) {
    "use strict";
    
//	grunt.loadNpmTasks("grunt-contrib-compress");

    // Project configuration.
    grunt.initConfig({
        pkg: "<json:package.json>",
        // Project metadata, used by the <banner> directive.
        meta: {
            banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
                    "<%= grunt.template.today('yyyy-mm-dd') %>\n" +
                    "<%= pkg.homepage ? '* ' + pkg.homepage + '\n' : '' %>" +
                    "* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
                    " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */"
        },
        concat: {
            core: {
                src: ["<banner:meta.banner>", 
                      "<file_strip_banner:src/<%= pkg.name %>.js>"
                      ],
                dest: "dist/<%= pkg.name %>-<%= pkg.version %>.js"
            },
            all: {
                src: ["<banner:meta.banner>", 
                      "<file_strip_banner:src/<%= pkg.name %>.js>",
                      "src/jquery.fancytree.columnview.js",
                      "src/jquery.fancytree.dnd.js",
                      "src/jquery.fancytree.filter.js",
                      "src/jquery.fancytree.menu.js",
                      "src/jquery.fancytree.persist.js",
                      "src/jquery.fancytree.table.js",
                      "src/jquery.fancytree.themeroller.js",
                      "src/jquery.fancytree.tracecalls.js"
                      ],
                dest: "dist/<%= pkg.name %>-<%= pkg.version %>-all.js"
            }
        },
        min: {
            core: {
                src: ["<banner:meta.banner>", "<config:concat.core.dest>"],
                dest: "dist/<%= pkg.name %>.min.js"
            },
            all: {
                src: ["<banner:meta.banner>", "<config:concat.all.dest>"],
                dest: "dist/<%= pkg.name %>-all.min.js"
            }
        },
//        compress: {
//            zip: {
//               files: {
//                 "dist/<%= pkg.name %>-all.min.js.gz": "dist/<%= pkg.name %>-all.min.js"
//               }
//            }
//        },
        qunit: {
            files: ["test/unit/**/*.html"]
        },
        lint: {
//            beforeconcat: ["grunt.js", "src/**/*.js", "tests/**/*.js"],
            beforeconcat: ["src/*.js", 
//                           "demo/sample.js",
                           "grunt.js",
                           "test/unit/test-core.js",
                           "test/unit/test-extensions.js"
                           ],
//            beforeconcat: ["grunt.js"],
//            beforeconcat: ["grunt.js", "src/jquery.fancytree.js", "tests/**/*.js"],
            afterconcat: ["<config:concat.core.dest>",
                          "<config:concat.all.dest>"
                          ]
        },
        // watch: {
        //   files: "<config:lint.files>",
        //   tasks: "lint qunit"
        // },        

        jshint: {
            options: {
                // Enforcing Options:
                bitwise: true,
                curly: true,
//              forin: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
//              noempty: true,
                nonew: true,
//              plusplus: true,
                regexp: true,
//              strict: true,
                sub: true,
                undef: true,
                // Relaxing Options:
                eqnull: false,
                laxbreak: true,
//                laxcomma: true,
                smarttabs: true,
//                globalstrict: true,
                // Environments:
//              node: true,  // TODO: only for grunt.js and fancytree-server.json
                browser: true
            },
            globals: {
                jQuery: true
            }
        },
        uglify: {
        }
    });
    // Default task.
    grunt.registerTask("default", "lint:beforeconcat concat lint:afterconcat min");
};
