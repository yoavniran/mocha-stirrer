var path = require("path");

var utils = (function () {
    "use strict";

    var depCounter = [];

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
        length = length > 0 ? length : 0;
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

                if (!justFns || (justFns === true && isFunc(prop))) {
                    dest[key] = prop; //copy over the functions for this instance of stirrer
                }
            });
        }

        return dest;
    }

    function runSeriesAsync(series, done, context) {

        function doneWrapper() {
            if (done) {
                done();
            }
        }

        var clone = series ? series.slice(0) : []; //dont affect the original array

        (function run(fns, done) {

            var current;

            function next() {
                run(fns, done);
            }

            if (fns && fns.length > 0) {
                current = fns.shift();
                current.call(context, next);
            }
            else {
                done();
            }
        })(clone, doneWrapper);
    }

    /**
     * runs every function in the given array
     * changes the given array by removing the executed function in order to run it
     * on success, the given array should be empty
     * @param series - an array of functions
     * @param context - the context to use for the executed functions
     */
    function runSeries(series, context) {

        var clone = series ? series.slice(0) : [], //dont affect the original array
            fn;

        if (clone) {
            while (clone.length > 0) {
                fn = clone.shift();
                fn.call(context);
            }
        }
    }

    function clone(src, justFns) {
        return merge(src, undefined, justFns);
    }

    function getLeveledFileName(fileName, lCount) {

        var levels = new Array((lCount || 3));
        var resolved = path.resolve(fileName);
        var bareName = path.basename(resolved).replace(new RegExp("\\" + path.extname(resolved) + "$"), "");
        var dir = path.dirname(resolved);
        var levelName = path.join(path.basename(dir), bareName);

        levels[0] = levelName;

        for (var i = 1; i < levels.length; i += 1) {
            dir = path.dirname(dir);
            levelName = path.join(path.basename(dir), levelName);
            levels[i] = levelName;
        }

        return levels;
    }

    function find(obj, value) {
        var res;

        Object.keys(obj).forEach(function (prop) {
            if (obj[prop] === value) {
                res = {};
                res[prop] = value;
            }
        });

        return res;
    }

    function deprecate(name, source) {

        var counterName = source + "" + name;

        if (depCounter.indexOf(counterName) === -1) { //only log once about a deprecated item
            /* global console */
            console.log((source ? source + " - " : "") + name + " is deprecated and shouldn't be used anymore!");
            depCounter.push(counterName);
        }
    }

    return {
        isFunc: isFunc,
        isArray: isArray,
        isAsync: isAsync,
        isObjectEmpty: isObjectEmpty,
        merge: merge,
        runSeriesAsync: runSeriesAsync,
        runSeries: runSeries,
        clone: clone,
        getLeveledFileName: getLeveledFileName,
        find: find,
        deprecate: deprecate
    };
})();

//******************** EXPORT ********************
module.exports = utils;