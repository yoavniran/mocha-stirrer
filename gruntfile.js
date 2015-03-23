module.exports = function (grunt) {

    require("time-grunt")(grunt);

    grunt.loadNpmTasks("grunt-contrib-jshint");
    //grunt.loadNpmTasks("grunt-contrib-clean");
    //grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-mocha-test");
    //grunt.loadNpmTasks("grunt-blanket");
    //grunt.loadNpmTasks("grunt-coveralls");

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            files: ["./src/*.js", "./test/*.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        //clean: ["./output/**/*"],
        //
        //copy: {
        //    test: {
        //        files: [
        //            {expand: true, src: "./test/**/*.js", dest: "./output/coverage/"}
        //        ]
        //    }
        //},
        //
        //blanket: {        //output the instrumented files
        //    output: {
        //        src: "./src/",
        //        dest: "./output/coverage/src"
        //    }
        //},

        mochaTest: {
            test: {
                options: {
                    reporter: "spec",
                    captureFile: "output/results.txt" // Optionally capture the reporter output to a file
                },
                src: ["./test/stirrer.test.js"]
            }
            //coverage: {
            //    options: {
            //        reporter: "mocha-lcov-reporter",
            //        quiet: true,
            //        captureFile: "./output/coverage.lcov.txt"
            //    },
            //    src: ["./output/coverage/test/sd.tests.js"]
            //},
            //htmlcov: {
            //    options: {
            //        reporter: "html-cov",
            //        quiet: true,
            //        captureFile: "./output/coverage.html"
            //    },
            //    src: ["./output/coverage/test/sd.tests.js"]
            //},
            //"travis-cov": {
            //    options: {
            //        reporter: "travis-cov"
            //    },
            //    src: ["./output/coverage/test/sd.tests.js"]
            //}
        }

        //coveralls: {
        //    options: {
        //        // When true, grunt-coveralls will only print a warning rather than
        //        // an error, to prevent CI builds from failing unnecessarily (e.g. if
        //        // coveralls.io is down). Optional, defaults to false.
        //        force: true
        //    },
        //    sdcoverage: {
        //        src: "./output/coverage.lcov.txt"
        //    }
        //}
    });

    grunt.registerTask("test", ["mochaTest:test"]);
    //grunt.registerTask("localcov", ["clean", "blanket", "copy:test", "mochaTest:htmlcov"]);
    //grunt.registerTask("coverage", ["clean", "blanket", "copy:test", "mochaTest:coverage", "mochaTest:htmlcov", "coveralls"]);
    //grunt.registerTask("build", ["jshint", "test", "coverage", "mochaTest:travis-cov"]);

    grunt.registerTask("default", ["jshint", "test"]); //, "localcov"]);
};