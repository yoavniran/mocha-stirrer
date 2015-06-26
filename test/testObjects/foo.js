var path = require("path");
var fs = require("fs");
var func = require("./sub/func");
var Bar = require("./sub/bar");
var consts =require("./sub/consts");
var instance = require("./sub/instance");

require("grunt-blanket");  //for making sure mocker will use the module name and not its resolved path

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
        },
        useConsts: function(){
            return "i love " + consts.FOODS[1];
        },
        useConstsObj: function(){
          return "im " + consts.STATES.OPEN;
        },
        useInstance: function(){
            return instance.getValue("test");
        },
        useStatic: function(){
            return Bar.myStatic("James");
		}
		//testPath: function (){
		//	console.log("resolved with path: " + path.resolve("sub\\func"));
		//	console.log("cwd: " + process.cwd());
		//	//console.log("resolved with fs: " + fs.realpathSync("./sub/func"));
		//}
    };
})();