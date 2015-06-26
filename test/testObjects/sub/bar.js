var fs = require("fs");
var dep = require("../dep");

var Bar = (function(){
    "use strict";

    function Bar() {
        this.name = "bar";
    }

    Bar.prototype.start = function () {
        return "hello world";
    };

    Bar.prototype.getStats = function() {
        return fs.statSync(".");
    };

    Bar.prototype.useDep = function(test){
        return dep(test);
    };


    Bar.myStatic = function(name){
        return "you are: " + name;
    };

    return Bar;
})();


module.exports = Bar;