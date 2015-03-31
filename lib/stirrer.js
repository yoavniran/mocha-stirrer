var sinon = require("sinon"),
    debug = require("debug")("mocha-stirrer:stirrer"),
    Mocker = require("./RequireMocker"),
    cupBlender = require("./cupBlender"),
    utils = require("./utils");

//todo: implement clear method to remove befores/afters/pars/fakes
//todo: inject the stubs from mocker to the cup stubs
//todo: implement requires which can be part of the conf of the stir method

var stirrer = (function () {
    "use strict";

    ["it", "before", "after", "beforeEach", "afterEach"].forEach(function (mochaFn) {
        if (!utils.isFunc(global[mochaFn])) {
            throw new ReferenceError("Stirrer - expecting mocha function: " + mochaFn + " to be available");
        }
    });

    /**
     *
     * @param conf
     *      - name (optional)
     *      - pars (optional) - object or a function
     *      - stubs (optional) - object or a function
     *      - spies (optional)
     *      - mocks (optional)
     *      - delay (default: false) - Boolean
     *      - transform (optional) - function
     *      - before (optional) - function
     *      - after (optional) - function
     *      - beforeEach (optional) - function
     *      - afterEach (optional) - function
     *      - sandbox (optional) - configuration object for sinon sandbox
     *      - setupImmediate (default: false) - Boolean
     *      - transformForEach (default: false) - Boolean
     *      - dontRestir (default: false) - Boolean
     *      - requires (optional) - object or a function
     *      - befores (optional) - function or array of functions with signature: fn(next)
     *      - afters (optional) - function or array of functions with signature: fn(next)
     * @param testFn
     * @returns Cup
     */
    function grind(conf, testFn) {

        conf = conf || {};

        debug("grinding a fresh cup, name: " + conf.name);

        var cup = cupBlender.blend(conf); //create the Cup with sinon sandbox and all the goodness of stirrer

        if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
            cupBlender.setup(cup);
        }

        if (!conf.delay) {  //by default start the configuration and hooks registration
            cup.start(conf);
        }
        else {
            debug("delay is turned on, not setting hooks for cup: " + cup.name);
        }

        if (utils.isFunc(testFn)) {  //run the test function if one was supplied
            cup.pour(null, testFn);
        }

        return cup;
    }

    function restir(cup) {
        cupBlender.restir(cup);
    }

    function fakeRequire(cup, requirePath, options) {
        return cupBlender.fakeRequire(module.parent, cup, requirePath, options);
    }

    // ******************** STIRRER PUBLIC API ********************
    return {
        grind: grind,
        create: grind, //alias (for those that don't get it)
        restir: restir,
        reset: restir, //alias (for those that don't get it)
        require: fakeRequire,

        // Making the RequireMocker class available to the outside so it can be used standalone
        RequireMocker: Mocker,

        EMPTY: cupBlender.EMPTY
    };
})();

//******************** EXPORT ********************
module.exports = stirrer;