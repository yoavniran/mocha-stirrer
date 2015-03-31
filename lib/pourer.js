var debug = require("debug")("mocha-stirrer:pourer"),
    utils = require("./utils");

var pourer = (function () {
    "use strict";

    var TEST_TYPES = {
        NORMAL: 1,
        ONLY: 2,
        SKIP: 3,
        WRAP: 4
    };

    function attachPour(cup) {

        function internalPour(testName, testFn, type) {
            _pour(cup, testName, testFn, type);
        }

        internalPour.only = function (testName, testFn) {
            internalPour(testName, testFn, TEST_TYPES.ONLY);
        };

        internalPour.skip = function (testName, testFn) {
            internalPour(testName, testFn, TEST_TYPES.SKIP);
        };

        internalPour.wrap = function (testName, testFn) {
            internalPour(testName, testFn, TEST_TYPES.WRAP);
        };

        debug("attaching pour to cup: " + cup.name);

        cup.pour = cup.test = internalPour;
    }

    function _pour(cup, testName, testFn, type) {

        testName = testName || "stirrer test - " + cup.name;
        type = type || TEST_TYPES.NORMAL;

        debug("pour: running test = " + testName + " of type: " + type);

        function pourOwnTestFn(done) {

            if(!cup._isHooked){
                debug("cup isnt started (hooked) !!! - " + cup.name);
                return done(new Error("stirrer - cup isn't initialized correctly. if you used delay parameter, make sure you called start() on the cup instance"));
            }

            var isAsync = type !== TEST_TYPES.SKIP &&
                type !== TEST_TYPES.WRAP &&
                utils.isAsync(testFn, 0);

            _runBefores(cup, function () {

                var ownDone = function (err) {//need to wrap the done before giving it to the test fn
                    _runAfters(cup, function () {   //run any afters before signaling we're done with the test
                        done(err);
                    });
                };

                if (isAsync) {
                    testFn.call(cup, ownDone); //make the cup as the context
                }
                else {
                    testFn.call(cup);  //make the cup as the context
                    ownDone(); //need to call done because the passed test fn didnt mean to call it (no arg declared)
                }
            });
        }

        _runTestByType(cup, testFn, testName, type, pourOwnTestFn);
    }

    function _runBefores(cup, callback) {

        debug("running cup befores functions count = " + cup._befores.length + " - " + cup.name);

        utils.runSeriesAsync(cup._befores, function () {
            callback();
        }, cup);
    }

    function _runAfters(cup, callback) {

        debug("running cup afters functions count = " + cup._afters.length + " - " + cup.name);

        utils.runSeriesAsync(cup._afters, function () {
            callback();
        }, cup);
    }

    function _runTestByType(cup, testFn, testName, type, pourOwnTestFn){

        if (utils.isFunc(testFn)) {
            switch (type) {
                case TEST_TYPES.ONLY:
                    cup._it.only(testName, pourOwnTestFn);
                    break;
                case TEST_TYPES.SKIP:
                    cup._it.skip(testName, pourOwnTestFn);
                    break;
                case TEST_TYPES.NORMAL:
                    cup._it(testName, pourOwnTestFn);
                    break;
                case TEST_TYPES.WRAP:
                    pourOwnTestFn(_noop);//pour is used just as a wrapper, the Mocha 'it' should be called by the testing code
                    break;
            }
        }
        else {
            cup._it(testName); //define a pending test
        }
    }

    function _noop() {
    }

    return {
        attach: attachPour
    };
})();

//******************** EXPORT ********************
module.exports = pourer;