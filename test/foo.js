var path = require("path");
    var Bar = require("./sub/bar");

module.exports = (function () {
    "use strict";

    return {
        bar: function () {
            return "foo";
        },
        wat: function (a, b) {
            return path.join(a, b);
        },
        useSub: function () {
            var bar = new Bar();
            return bar.start();
        },
        useSubDep: function(test){
            var bar = new Bar();
            return bar.useDep(test);
        }
    };
})();

