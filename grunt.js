/*jslint node:true */

module.exports = function(grunt) {
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
            dist: {
                src: ["<banner:meta.banner>", "<file_strip_banner:src/<%= pkg.name %>.js>"],
//                src: ["src/jquery.dynatree.js"],
                dest: "dist/<%= pkg.name %>-<%= pkg.version %>.js"
            }
        },
        min: {
            dist: {
                src: ["<banner:meta.banner>", "<config:concat.dist.dest>"],
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },
        qunit: {
            files: ["tests/unit/**/*.html"]
        },
        lint: {
//            beforeconcat: ["grunt.js", "src/**/*.js", "tests/**/*.js"],
            beforeconcat: ["src/jquery.dynatree.js", "src/jquery.dynatree.table.js", "src/jquery.dynatree.columnview.js", "test/unit/test-dynatree.js"],
//            beforeconcat: ["grunt.js"],
//            beforeconcat: ["grunt.js", "src/jquery.dynatree.js", "tests/**/*.js"],
            afterconcat: ["<config:concat.dist.dest>"]
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
                smarttabs: false,
//                globalstrict: true,
                // Environments:
//              node: true,  // TODO: only for grunt.js and dynatree-server.json
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
    grunt.registerTask("default", "lint:beforeconcat qunit concat lint:afterconcat min");
};
