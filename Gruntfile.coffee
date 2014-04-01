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
        # banner: "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
        banner: "/*! <%= pkg.title || pkg.name %> - @VERSION - " +
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
#          tagged: false # Require last commit (HEAD) to be tagged
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
            src: [ "build" ]
        dist:
            src: [ "dist" ]

    compress:
        dist:
            options:
                archive: "archive/<%= pkg.name %>-<%= pkg.version %>.zip"
            files: [
                {expand: true, cwd: "dist/", src: ["**/*"], dest: ""}
                ]

    concat:
        core:
            options:
                stripBanners: true
            src: ["<banner:meta.banner>"
                  # "lib/intro.js"
                  "src/<%= pkg.name %>.js"
                  # "lib/outro.js"
                  ]
            dest: "build/<%= pkg.name %>.js"
        all:
            options:
                stripBanners: true
            src: [
                "<%= meta.banner %>"
                # "lib/intro.js"
                "src/jquery.fancytree.js"
                "src/jquery.fancytree.childcounter.js"
#                "src/jquery.fancytree.clones.js"
#                "src/jquery.fancytree.columnview.js"
                "src/jquery.fancytree.dnd.js"
                "src/jquery.fancytree.edit.js"
                "src/jquery.fancytree.filter.js"
                "src/jquery.fancytree.glyph.js"
                "src/jquery.fancytree.gridnav.js"
#                "src/jquery.fancytree.menu.js"
                "src/jquery.fancytree.persist.js"
                "src/jquery.fancytree.table.js"
                "src/jquery.fancytree.themeroller.js"
                # "lib/outro.js"
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
        build: # copy production files to build folder
            files: [{
                expand: true # required for cwd
                cwd: "src/"
                src: ["skin-**/*.{css,gif,png}", "*.txt"]
                dest: "build/"
            }, {
                # src: ["*.txt", "*.md"]
                src: ["MIT-LICENSE.txt"]
                dest: "build/"
            }]
        dist: # copy build folder to dist
            files: [{expand: true, cwd: "build/", src: ["**"], dest: "dist/"}]

  #   csslint:
  # #      options:
  # #              csslintrc: ".csslintrc"
  #       strict:
  #           options:
  #               import: 2
  #           src: ["src/**/*.css"]

    cssmin:
        options:
          report: "min"
        build:
            expand: true
            cwd: "build/"
            src: ["**/*.fancytree.css", "!*.min.css"]
            dest: "build/"
            ext: ".fancytree.min.css"

    docco:
        docs:
#            expand: true
#            cwd: "src/"
            src: ["src/jquery.fancytree.childcounter.js"]
#            dest: "doc/annotated-src/"
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
#            cmd: "pyftpsync --progress upload . ftp://www.wwwendt.de/tech/fancytree --omit build,node_modules,.*,_*  -x"

    htmllint:
        all: ["demo/**/*.html", "doc/**/*.html", "test/**/*.html"]

    jsdoc:
        build:
            src: ["src/*.js", "doc/README.md", "doc/jsdoctest.js"]
            options:
                destination: "doc/jsdoc_new"
#                template: "bin/jsdoc3-moogle",
#                template: "node_modules/ink-docstrap/template",
                template: "../docstrap/template",
                configure: "doc/jsdoc.conf.json"
                verbose: true

    jshint:
        options:
            # Linting according to http://contribute.jquery.org/style-guide/js/
            jshintrc: ".jshintrc"
        beforeConcat: [
            # "Gruntfile.js"
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
        build: [ 
            "test/unit/test-core-build.html" 
        ]
        develop: [ 
            "test/unit/test-core.html"
            "test/unit/test-ext-table.html"
            "test/unit/test-ext-misc.html"
        ]

    replace: # grunt-text-replace
        production:
            src: ["build/*.js"]
            overwrite : true
            replacements: [ {
                from : /@DATE/g
                to : "<%= grunt.template.today('yyyy-mm-dd\"T\"HH:MM') %>"
            },{
                from : /buildType:\s*\"[a-zA-Z]+\"/g
                to : "buildType: \"production\""
            },{
                from : /debugLevel:\s*[0-9]/g
                to : "debugLevel: 1"
            } ]
        release:
            src: ["dist/*.js"]
            overwrite : true
            replacements: [ {
                from : /@VERSION/g
                to : "<%= pkg.version %>"
            } ]

    "saucelabs-qunit":
        all:
            options:
                urls: ["http://localhost:9999/test/unit/test-core.html"]
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
                testname: "fancytree qunit tests"

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
#                  expand: true
#                  cwd: "build/"
                sourceMap: 
                    (path) -> path.replace(/.js/, ".js.map")
                sourceMappingURL: 
                    (path) -> path.replace(/^build\//, "") + ".map"
#                    sourceMapIn: function(path) { return path.replace(/^build\//, "")}
#                    sourceMapRoot: "/" //function(path) { return path.replace(/^build\//, "")}
                sourceMapPrefix: 1 # strip 'build/' from paths

            files:
                "build/<%= pkg.name %>.min.js": ["<%= concat.core.dest %>"],
                "build/<%= pkg.name %>-all.min.js": ["<%= concat.all.dest %>"]

    watch:
        less:
            files: "src/**/*.less"
            tasks: ["less:development"]
        jshint:
            options:
                atBegin: true
            files: ["src/*.js", "test/unit/*.js"]
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

  grunt.registerTask "sauce", ["connect:sauce", "saucelabs-qunit"]
  if parseInt(process.env.TRAVIS_PULL_REQUEST, 10) > 0
      # saucelab keys do not work on forks
      # http://support.saucelabs.com/entries/25614798
      grunt.registerTask "travis", ["test"]
  else
      grunt.registerTask "travis", ["test", "sauce"]
  
  grunt.registerTask "default", ["test"]
  grunt.registerTask "build", [
      "exec:tabfix"
      "test"
      "jsdoc:build"
      "docco:docs"
      "clean:build"
      "copy:build"
      "concat"
      "cssmin:build"
      "replace:production"
      "jshint:afterConcat"
      "uglify"
      "qunit:build"
      # "compare_size"
      ]
  
  grunt.registerTask "make_release", [
      "checkrepo:beforeRelease"
      "build"
      "clean:dist"
      "copy:dist"
      "clean:build"
      "replace:release"
      "compress:dist"
      "tagrelease"
      "bumpup:prerelease"
      ]

  grunt.registerTask "upload", [
      "build"
      "exec:upload"
      ]
