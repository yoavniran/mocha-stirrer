var debug = require("debug")("mocha-stirrer:pourer"),
    utils = require("./utils");

var pourer = (function () {
    "use strict";

    //todo: consider allowing having one befores/afters that dont need to call "next()"

    var TEST_TYPES = {
        NORMAL: 1,
        ONLY: 2,
        SKIP: 3,
        WRAP: 4
    };

    function attachPour(cup) {

        /**
         * wraps Mocha's it method and executes it with the added flows for befores/afters
         * add in stirData for stir'n pour™
         *
         * @param testName the test name
         * @param testFn  the test function to execute
         * @param stirData if passed you get stir'n pour™ - add conf data just before test is executed
         */
        function internalPour(testName, testFn, stirData) {
            _pour(cup, testName, testFn, stirData, TEST_TYPES.NORMAL);
        }

        internalPour.only = function (testName, testFn, stirData) {
            _pour(cup, testName, testFn, stirData, TEST_TYPES.ONLY);
        };

        internalPour.skip = function (testName, testFn, stirData) {
            _pour(cup, testName, testFn, stirData, TEST_TYPES.SKIP);
        };

        internalPour.wrap = function (testName, testFn, stirData) {
            _pour(cup, testName, testFn, stirData, TEST_TYPES.WRAP);
        };

        debug("attaching pour to cup: " + cup.name);

        cup.pour = cup.test = internalPour;  //test is alias for those that dont get it
    }

    function _pour(cup, testName, testFn, stirData, type) {

        testName = testName || "stirrer test - " + cup.name;
        type = type || TEST_TYPES.NORMAL;

        debug("about to run test = " + testName + " of type: " + type + " - cup: " + cup.name);

        _runTestByType(cup, testFn, testName, type, _pourOwnTestFn.bind(null, cup, testFn, stirData, type));
    }

    function _pourOwnTestFn(cup, testFn, stirData, type, done) {

        if (!cup._isHooked) {
            debug("cup isnt started (hooked) !!! - on cup: " + cup.name);
            return done(new Error("stirrer - cup isn't initialized correctly. if you used delay parameter, make sure you called start() on the cup instance"));
        }

        var isAsync = type !== TEST_TYPES.SKIP &&
            type !== TEST_TYPES.WRAP &&
            utils.isAsync(testFn, 0);

        if (stirData) {
            debug("received stir data so stirring it immediately on cup: " + cup.name);
            cup._immediateStir(stirData);//do immediate stirring
        }

        _runTestFlow(cup, isAsync, testFn, done);
    }

    function _runTestFlow(cup, isAsync, testFn, done){

        _runBefores(cup, function () {

            var ownDone = function (err) {//need to wrap the done before giving it to the test fn
                _runAfters(cup, function () {   //run any afters before signaling we're done with the test
                    done(err);
                });
            };

            debug("running test function");
            if (isAsync) {
                testFn.call(cup, ownDone); //make the cup as the context
            }
            else {
                testFn.call(cup);  //make the cup as the context
                ownDone(); //need to call done because the passed test fn didnt mean to call it (no arg declared)
            }
        });
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

    function _runTestByType(cup, testFn, testName, type, pourOwnTestFn) {

        if (utils.isFunc(testFn)) {
            switch (type) {
                case TEST_TYPES.ONLY:
                    cup._mocha.it.only(testName, pourOwnTestFn);
                    break;
                case TEST_TYPES.SKIP:
                    cup._mocha.it.skip(testName, pourOwnTestFn);
                    break;
                case TEST_TYPES.WRAP:
                    pourOwnTestFn(_noop);//pour is used just as a wrapper, the Mocha 'it' should be called by the testing code
                    break;
                default:
                    cup._mocha.it(testName, pourOwnTestFn);
                    break;
            }
        }
        else {
            cup._mocha.it(testName); //define a pending test
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