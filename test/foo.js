var path = require("path");
var fs = require("fs");
var func = require("./sub/func");
var Bar = require("./sub/bar");

module.exports = (function () {
    "use strict";

    return {
        bar: function () {
            return "foo";
        },
        fs: function (callback) {
            fs.readdir(".", function (err, data) {
                callback(err, data);
            });
        },
        wat: function (a, b) {
            return path.join(a, b);
        },
        barStats: function () {
            var bar = new Bar();
            return bar.getStats();
        },
        useSub: function () {
            var bar = new Bar();
            return bar.start();
        },
        useSubDep: function (test) {
            var bar = new Bar();
            return bar.useDep(test);
        },
        useFuncDep: function () {
            return func();
        }
    };
})();

