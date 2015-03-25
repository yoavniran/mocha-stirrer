module.exports = (function () {
    "use strict";

    function isFunc(fn) {
        return fn && typeof(fn) === "function";
    }

    function isArray(obj) {
        return obj && Array.isArray(obj);
    }

    /**
     *  using the same logic as Mocha
     *  mocha uses the first parameter as indication for callback to be async, in our case
     *  if there is a second parameter then function expects to get the done callback, therefore is async
     * @param fn
     * @private
     */
    function isAsync(fn, length) {
        length = length > -1 ? length : 1;
        return isFunc(fn) && fn.length > length;
    }

    /**
     * supports checks on objects and arrays (nothing else)
     * will return true on any falsy argument
     * @param obj object or array
     * @returns {boolean}
     */
    function isObjectEmpty(obj) {

        var empty = true;

        if (obj) {
            if (typeof obj === "object") {
                if (typeof(obj.length) !== "number") {
                    for (var prop in obj) {
                        empty = false;
                        break;
                    }
                }
                else {
                    empty = (obj.length < 1);
                }
            }
            else {
                throw new TypeError("unsupported type to check, use only Object or Array");
            }
        }

        return empty;
    }

    function merge(src, dest, justFns) {

        dest = dest || {};

        if (src) {
            Object.keys(src).forEach(function (key) {
                var prop = src[key];

                if (!justFns || justFns === true && isFunc(prop)) {
                    dest[key] = prop; //copy over the functions for this instance of stirrer
                }
            });
        }

        return dest;
    }

    function runSeriesAsync(series, done, context) {

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
    }

    /**
     * runs every function in the given array
     * changes the given array by removing the executed function in order to run it
     * on success, the given array should be empty
     * @param series - an array of functions
     * @param context - the context to use for the executed functions
     */
    function runSeries(series, context) {

        var fn;

        if (series) {
            while (series.length > 0) {
                fn = series.shift();
                fn.call(context);
            }
        }
    }

    function clone(src, justFns) {
        return merge(src, undefined, justFns);
    }

    return {
        isFunc: isFunc,
        isArray: isArray,
        isAsync: isAsync,
        isObjectEmpty: isObjectEmpty,
        merge: merge,
        runSeriesAsync: runSeriesAsync,
        runSeries: runSeries,
        clone: clone
    };
})();

