"use stirct";

module.exports = {
    isFunc: function (fn) {
        return fn && typeof(fn) === "function";
    },

    isArray: function (obj) {
        return obj && Array.isArray(obj);
    },

    /**
     *  using the same logic as Mocha
     *  mocha uses the first parameter as indication for callback to be async, in our case
     *  if there is a second parameter then function expects to get the done callback, therefore is async
     * @param fn
     * @private
     */
    isAsync: function (fn) {
        return fn.length > 1;
    },

    isObjectEmpty: function (obj) {

        var empty = true;

        if (obj) {
            if (typeof obj === "object"){
                if (typeof(obj.length) !== "number"){
                    for(var prop in obj){
                        empty = false;
                        break;
                    }
                }
                else{
                    empty = (obj.length < 1);
                }
            }
            else{
                throw new TypeError("unsupported type to check, use only Object or Array");
            }
        }

        return empty;
    },

    merge: function (src, dest) {

        dest = dest || {};

        if (src) {
            Object.keys(src).forEach(function (key) {
                dest[key] = src[key]; //copy over the functions for this instance of stirrer
            });
        }

        return dest;
    },

    runSeriesAsync: function (series, done, context) {

        (function run(series, done) {

            var current;

            function next() {
                run(series, done);
            }

            if (series && series.length > 0) {
                current = series.shift();
                current.call(context, next);
            }
            else {
                done();
            }
        })(series, done);
    },

    runSeries: function (series, context) {

        var fn;

        if (series) {
            while (series.length > 0) {
                fn = series.shift();
                fn.call(context);
            }
        }
    }
};