var debug = require("debug")("mocha-stirrer:stirrer"),
    Mocker = require("./RequireMocker"),
    cupBlender = require("./cupBlender"),
    utils = require("./utils");

var stirrer = (function () {
    "use strict";

    var stirrer_globals = {
        mochaHooks: {},
        mochaHooksNames: ["it", "before", "after", "beforeEach", "afterEach"]
    };

    stirrer_globals.mochaHooksNames.forEach(function (mochaFn) {
        if (!utils.isFunc(global[mochaFn])) {
            throw new ReferenceError("Stirrer - expecting mocha function: " + mochaFn + " to be available");
        }

        stirrer_globals.mochaHooks[mochaFn] = global[mochaFn]; //copy over mocha hooks
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
     *      - restirForEach (default: false) - Boolean
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
        conf.globals = conf.globals || stirrer_globals;

        debug("grinding a fresh cup, name: " + conf.name);

        var cup = cupBlender.blend(conf); //create the Cup with sinon sandbox and all the goodness of stirrer

        if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
            cupBlender.setup(cup);
        }

        if (!conf.delay) {  //by default start the configuration and hooks registration
            cup.brew(conf);
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

    /**
     *
     * @param cup
     * @param requirePath
     * @param options
     * @returns {*}
     */
    function fakeRequire(cup, requirePath, options) {
        return cupBlender.fakeRequire(module.parent, cup, requirePath, options);
    }

    /**
     * sets the parent module that will be used as the parent of the fake require. this is needed for module path resolution
     * the default parent module is the first module that required the stirrer (index)
     * this method is needed in case there are test modules in different folders that use the fake require capability of RequireMocker
     * @param parentModule the module to use for fake require
     */
    function setRequireParent(parentModule){
        cupBlender.setRequireParent(parentModule);
    }

    // ******************** STIRRER PUBLIC API ********************
    return {
        grind: grind,
        create: grind, //alias (for those that don't get it)
        restir: restir,
        reset: restir, //alias (for those that don't get it)
        require: fakeRequire,
        setRequireParent: setRequireParent,

        // Making the RequireMocker class available to the outside so it can be used standalone
        RequireMocker: Mocker,

        EMPTY: cupBlender.EMPTY
    };
})();

//******************** EXPORT ********************
module.exports = stirrer;