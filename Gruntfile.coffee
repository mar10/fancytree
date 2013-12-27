###
Build scripts for Fancytree 
###

# jshint directives for the generated JS:

###jshint node: true, unused: false ###

"use strict"

module.exports = (grunt) ->

  grunt.initConfig

    pkg: 
        grunt.file.readJSON("package.json")

    # Project metadata, used by the <banner> directive.
    meta:
      banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
              "<%= grunt.template.today('yyyy-mm-dd HH:mm') %>\n" +
              "<%= pkg.homepage ? '  * ' + pkg.homepage + '\\n' : '' %>" +
              "  * Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
              " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n"
    bumpup:
        options:
            dateformat: "YYYY-MM-DD HH:mm"
            normalize: true
            updateProps: 
                pkg: "package.json"
        files: ["package.json", "bower.json", "fancytree.jquery.json"]

    checkrepo:
      beforeBump:
          tag:
              eq: "<%= pkg.version %>" # Check if highest repo tag == pkg.version
  #        tagged: false # Require last commit (HEAD) to be tagged
          clean: true # // Require repo to be clean (no unstaged changes)
      beforeRelease:
          tag:
              lt: "<%= pkg.version %>" # Check if highest repo tag is lower than pkg.version
#          tagged: false # Require last commit (HEAD) to be tagged
          clean: true # // Require repo to be clean (no unstaged changes)

    # compare_size:
    #     files:
    #         "jquery.ui-contextmenu.min.js"
    #         "jquery.ui-contextmenu.js"
    #     options:
    #         compress:
    #             gz: function (fileContents)
    #                 return require("gzip-js").zip(fileContents, {}).length;

    clean:
        build:
            noWrite: true
            src: [ "build" ]

    compress:
        build:
            options:
                archive: "dist/<%= pkg.name %>-<%= pkg.version %>.zip"
            files: [
                {expand: true, cwd: "build/", src: ["**/*"], dest: ""}
                ]

    concat:
        core:
            options:
                stripBanners: true
            src: ["<banner:meta.banner>"
                  "src/<%= pkg.name %>.js"
                  ]
            dest: "build/<%= pkg.name %>.js"
        all:
            options:
                stripBanners: true
            src: [
                "<%= meta.banner %>"
                "src/jquery.fancytree.js"
                "src/jquery.fancytree.columnview.js"
                "src/jquery.fancytree.dnd.js"
                "src/jquery.fancytree.filter.js"
                "src/jquery.fancytree.menu.js"
                "src/jquery.fancytree.persist.js"
                "src/jquery.fancytree.table.js"
                "src/jquery.fancytree.themeroller.js"
                ]
            dest: "build/<%= pkg.name %>-all.js"

    connect:
        forever:
            options:
                port: 8080
                base: "./"
                keepalive: true
        dev: # pass on, so subsequent tastks (like watch) can start
            options:
                port: 8080
                base: "./"
                keepalive: false
        sauce:
            options:
                hostname: "localhost"
                port: 9999
                base: ""
                keepalive: false

    copy:
        build:
            files: [{
                    expand: true # required for cwd
                    cwd: "src/"
                    src: ["skin-**/*.{css,gif,png}", "*.txt"]
                    dest: "build/"
                }, {
                    src: ["*.txt", "*.md"]
                    dest: "build/"
                }]

    csslint:
  #      options:
  #              csslintrc: ".csslintrc"
        strict:
            options:
                import: 2
            src: ["src/**/*.css"]

    cssmin:
        build:
            report: true
            minify:
                expand: true
                cwd: "src/skin-win8/"
                src: ["*.css", "!*.min.css"]
                dest: "build/"
                ext: ".min.css"

    docco:
        docs:
            src: ["src/jquery.fancytree.childcounter.js"]
            options:
                output: "doc/annotated-src"

    exec:
        tabfix:
            # Cleanup whitespace according to http://contribute.jquery.org/style-guide/js/
            # (requires https://github.com/mar10/tabfix)
#              cmd: "tabfix -t --line=UNIX -r -m*.js,*.css,*.html,*.json -inode_modules src demo test"
            cmd: "tabfix -t -r -m*.js,*.css,*.html,*.json -inode_modules src demo test"
        upload:
            # FTP upload the demo files (requires https://github.com/mar10/pyftpsync)
            cmd: "pyftpsync --progress upload . ftp://www.wwwendt.de/tech/fancytree --delete-unmatched --omit build,node_modules,.*,_*  -x"

    htmllint:
        all: ["demo/**/*.html", "doc/**/*.html", "test/**/*.html"]

    jsdoc:
        build:
            src: ["src/*.js", "doc/README.md"]
            # http://usejsdoc.org/about-configuring-jsdoc.html#example
            options:
                destination: "doc/jsdoc_grunt"
#                template: "bin/jsdoc3-moogle",
                verbose: true

    jshint:
        options:
            # Linting according to http://contribute.jquery.org/style-guide/js/
            jshintrc: ".jshintrc"
        beforeConcat: [
            "Gruntfile.js"
            "src/*.js"
            "3rd-party/**/jquery.fancytree.*.js"
            "test/unit/*.js"
            ]
        afterConcat: [
            "<%= concat.core.dest %>"
            "<%= concat.all.dest %>"
            ]

    less:
        development:
            options:
#               paths: ["src/"]
#               report: "min"
                compress: false
                yuicompress: false
#               optimization: 10
            files: [
                {expand: true, cwd: "src/", src: "**/ui.fancytree.less", dest: "src/", ext: ".fancytree.css"}
            ]

    qunit:
        build: [ "test/unit/test-core-build.html" ]
        develop: [ "test/unit/test-core.html" ]

    replace: # grunt-text-replace
# //            bump : {
# //                src : ["src/jquery.fancytree.js"],
# //                overwrite : true,
# //                replacements : [ {
# //                    from : /version:\s*\"[0-9\.\-]+\"/,
# //                    to : "version: \"<%= pkg.version %>\""
# //                },{
# //                    from : /@version\s*[0-9\.\-]+/,
# //                    to : "@version <%= pkg.version %>"
# //                },{
# //                    from : /@date\s*[0-9T\.\-\:]+/,
# //                    to : "@date <%= grunt.template.today('yyyy-mm-dd\"T\"HH:MM') %>"
# //                } ]
# //            },
        build:
            src: ["build/*.js"]
            overwrite : true
            replacements: [ {
                # from : /version:\s*\"[0-9\.\-]+\"/g
                from : /version:\s*\"development\"/g
                to : "version: \"<%= pkg.version %>\""
            },{
                from : /@version\s*DEVELOPMENT/g
                to : "@version <%= pkg.version %>"
            },{
                from : /@date\s*DEVELOPMENT/g
                to : "@date <%= grunt.template.today('yyyy-mm-dd\"T\"HH:MM') %>"
            },{
                from : /buildType:\s*\"[a-zA-Z]+\"/g
                to : "buildType: \"release\""
            },{
                from : /debugLevel:\s*[0-9]/g
                to : "debugLevel: 1"
            } ]

    "saucelabs-qunit":
      all:
        options:
          urls: ["http://localhost:9999/test/unit/test-core.html"]
          
          # username: process.env.SAUCE_USERNAME,
          # key: process.env.SAUCE_ACCESS_KEY,
          tunnelTimeout: 5
          build: process.env.TRAVIS_JOB_ID
          concurrency: 3
          browsers: [
            { browserName: "chrome", platform: "Windows 7" }
            { browserName: "firefox", platform: "Windows 7" }
            { browserName: "firefox", platform: "Windows XP" }
            { browserName: "firefox", platform: "Linux" }
            { browserName: "internet explorer", version: "6", platform: "Windows XP" }
            { browserName: "internet explorer", version: "7", platform: "Windows XP" }
            { browserName: "internet explorer", version: "8", platform: "Windows XP" }
            { browserName: "internet explorer", version: "9", platform: "Windows 7" }
            { browserName: "internet explorer", version: "10", platform: "Windows 8" }
            { browserName: "internet explorer", version: "11", platform: "Windows 8.1" }
            { browserName: "safari", platform: "OS X 10.8" }
          ]
          testname: "jquery.ui-contextmenu qunit tests"

    tagrelease:
        file: "package.json"
        commit:  true
        message: "Tagging the %version% release."
        prefix:  "v"
        annotate: true

    uglify:
        build:
            options:
                banner: "<%= meta.banner %>"
                report: "min"
#                , expand: true
#                , cwd: "build/"
                sourceMap: 
                    (path) -> path.replace(/.js/, ".js.map")
                sourceMappingURL: 
                    (path) -> path.replace(/^build\//, "") + ".map"
#                  , sourceMapIn: function(path) { return path.replace(/^build\//, "")}
#                  , sourceMapRoot: "/" //function(path) { return path.replace(/^build\//, "")}
                sourceMapPrefix: 1 # strip 'build/' from paths

            files:
                "build/<%= pkg.name %>.min.js": ["<%= concat.core.dest %>"],
                "build/<%= pkg.name %>-all.min.js": ["<%= concat.all.dest %>"]

    watch:
        less:
            files: "src/**/*.less"
            tasks: ["less:development"]
        jshint:
            files: "src/*.js"
            tasks: ["jshint:beforeConcat"]

  # ----------------------------------------------------------------------------

  # Load "grunt*" dependencies

  for key of grunt.file.readJSON("package.json").devDependencies
      grunt.loadNpmTasks key  if key isnt "grunt" and key.indexOf("grunt") is 0

  # Register tasks

  grunt.registerTask "server", ["connect:forever"]
  grunt.registerTask "dev", ["connect:dev", "watch"]
  grunt.registerTask "test", [
      "jshint:beforeConcat",
      # "csslint",
      "qunit:develop"
  ]
  # grunt.registerTask("makejsdoc", ["jsdoc"]
  grunt.registerTask "sauce", ["connect:sauce", "saucelabs-qunit"]
  grunt.registerTask "travis", ["test", "sauce"]
  grunt.registerTask "default", ["test"]
  grunt.registerTask "build", [
      "exec:tabfix"
      "test"
      "clean:build"
      "copy:build"
      "concat"
      # "cssmin:build"
      "replace:build"
      "jshint:afterConcat"
      "uglify"
      "qunit:build"
      "compress:build"
      # "compare_size"
      # "clean:build"
      ]
  grunt.registerTask "release", [
      "checkrepo:beforeRelease"
      "build"
      "tagrelease"
      "bumpup:prerelease"
      ]
  grunt.registerTask "upload", [
      "build"
      "exec:upload"
      ]
