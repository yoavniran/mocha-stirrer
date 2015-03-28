var sinon = require("sinon"),
    debug = require("debug")("mocha-stirrer:stirrer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

//todo: define default for setup/teardown on before/after or beforeEach/AfterEach
//todo: implement clear method to remove befores/afters/pars/fakes

var stirrer = (function () {
    "use strict";

    ["it", "before", "after", "beforeEach", "afterEach"].forEach(function (mochaFn) {
        if (!utils.isFunc(global[mochaFn])) {
            throw new ReferenceError("Stirrer - expecting mocha function: " + mochaFn + " to be available");
        }
    });

    var EMPTY = "-_empty_-";
    var TEST_TYPES = {
        NORMAL: 1,
        ONLY: 2,
        SKIP: 3,
        WRAP: 4
    };

    /**
     *
     * @param conf
     *      - name (optional)
     *      - pars (optional) - object or a function
     *      - stubs (optional) - object or a function
     *      - spies (optional)
     *      - mocks (optional)
     *      - transform (optional) - function
     *      - before (optional)
     *      - after (optional)
     *      - beforeEach (optional)
     *      - afterEach (optional)
     *      - sandbox (optional) - configuration for sinon sandbox
     *      - setupImmediate (default: false)
     *      - transformForEach (default: false)
     *      - dontRestir (default: false)
     *      - requires (optional)
     *      - befores (optional) - function or array of functions with signature: fn(next)
     *      - afters (optional) - function or array of functions with signature: fn(next)
     * @param testFn
     * @returns Cup
     */
    function grind(conf, testFn) {

        debug("grinding a fresh cup");

        conf = conf || {};

        var cup = _blend(conf); //create the Cup with sinon sandbox and all the goodness of stirrer

        if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
            _setup(cup, conf);
        }

        _doHooks(cup, conf);

        if (utils.isFunc(testFn)) {  //run the test function if one was supplied
            cup.pour(null, testFn);
        }

        return cup;
    }

    function restir(cup) { //todo: consider adding 'full' parameter to clear pars, befores, afters
        cup.sb.restore();
    }

    function mockRequire(cup, requirePath, options) {

        var reqModule = cup._mocker.require(module.parent, requirePath, options);

        //todo: inject the stubs from mocker to the cup stubs

        _enrichCupStubsFromMocker(cup);

        return reqModule;
    }

//******************* PRIVATE METHODS *****************

    var cupBody = (function () {

        /**
         *
         * @param befores is either a function or an array of functions
         */
        function _stirBefores(befores) {

            var stirFn = function () {
                debug("stirring in the registered befores - " + this.name);
                if (utils.isFunc(befores)) {
                    befores = [befores];
                }

                befores.forEach(function (fn) {   //todo: use concat
                    this._befores.push(fn);
                }.bind(this));
            }.bind(this);

            if (befores) {
                before(stirFn);
            }
        }

        /**
         *
         * @param afters is either a function or an array of functions
         */
        function _stirAfters(afters) {

            var stirFn = function () {
                debug("stirring in the registered afters - " + this.name);
                if (utils.isFunc(afters)) {
                    afters = [afters];
                }

                afters.forEach(function (fn) { //todo: use concat
                    this._afters.push(fn);
                }.bind(this));
            }.bind(this);

            if (afters) {
                before(stirFn);
            }
        }

        function _stirPars(pars) {

            if (pars) {
                before(function () {
                    debug("stirring in the registered pars - " + this.name);
                    pars = utils.isFunc(pars) ? pars() : pars;
                    this.pars = utils.merge(pars, this.pars); //add new pars to the pars map
                }.bind(this));
            }
        }

        function _stir(conf) {
            _stirPars.call(this, conf.pars);
            _stirBefores.call(this, conf.befores);
            _stirAfters.call(this, conf.afters);
        }

        return {
            require: function (path, options) {
                debug("cup require called with path = " + path + " - " + this.name);
                return mockRequire(this, path, options);
            },

            stir: function (conf) {
                debug("cup stir called - " + this.name);
                _stir.call(this, conf);
            },

            restir: function () {
                debug("cup restir called - " + this.name);
                restir(this);
            }
        };
    })();

    function _attachPour(cup, conf) {    //todo: move pour to an external file

        function internalPour(testName, testFn, type) {

            testName = testName || "stirrer test - " + cup.name;
            type = type || TEST_TYPES.NORMAL;

            //_runAfters(cup, conf);

            function pourOwnTestFn(done) {

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
                        ownDone(); //done(); //need to call done because the passed test fn didnt mean to call it (no arg declared)
                    }
                });
            }

            if (utils.isFunc(testFn)) {
                switch (type) {
                    case TEST_TYPES.ONLY:
                        it.only(testName, pourOwnTestFn);
                        break;
                    case TEST_TYPES.SKIP:
                        it.skip(testName, pourOwnTestFn);
                        break;
                    case TEST_TYPES.NORMAL:
                        it(testName, pourOwnTestFn);
                        break;
                    case TEST_TYPES.WRAP:
                        pourOwnTestFn(_noop);//pour is used just as a wrapper, the Mocha 'it' should be called by the testing code
                        break;
                }
            }
            else {
                it(testName); //define a pending test
            }
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

        cup.pour = internalPour;
    }

    function _blend(conf) {

        var name = conf.name || Date.now();
        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        _setHooks(conf);

        var cup = {
            name: name,
            sb: sb,
            pars: {},
            _mocker: new Mocker(sb),
            _befores: [],
            _afters: []
        };

        //todo: implement requires which can be part of the conf

        utils.merge(cupBody, cup);
        _attachPour(cup, conf);
        cup.stir(conf);

        return cup;
    }

    function _setHooks(conf) {
        if (!utils.isFunc(conf.before)) {
            conf.before = _noop;
        }

        if (!utils.isFunc(conf.after)) {
            conf.after = _noop;
        }

        if (!utils.isFunc(conf.beforeEach)) {
            conf.beforeEach = _noop;
        }

        if (!utils.isFunc(conf.afterEach)) {
            conf.afterEach = _noop;
        }
    }

    function _doHooks(cup, conf) {

        _doBefore(cup, conf);
        _doBeforeEach(cup, conf);
        _doAfter(cup, conf);
        _doAfterEach(cup, conf);
    }

    function _doBefore(cup, conf) {

        var name = "stirrer before - " + cup.name;

        function runit(done) {
            _setup(cup, conf);
            conf.before(cup, done);
        }

        if (utils.isAsync(conf.before)) {
            before(name, function (done) {
                runit(done);
            });
        }
        else {
            before(name, function () {
                runit();
            });
        }
    }

    function _doBeforeEach(cup, conf) {

        var name = "stirrer beforeEach - " + cup.name;

        function runit(done) {

            if (conf.transformForEach) {
                _transformPars(cup, conf);
            }

            conf.beforeEach(cup, done);
        }

        if (utils.isAsync(conf.beforeEach)) {
            beforeEach(name, function (done) {
                runit(done);
            });
        }
        else {
            beforeEach(name, function () {
                runit();
            });
        }
    }

    function _doAfter(cup, conf) {

        var name = "stirrer after - " + cup.name;

        after(name, function (done) {

            function finishAfter() {

                if (!conf.dontRestir) {
                    cup.restir(); //make sure all fakes are restored using sinon's sandbox restore
                }

                done();
            }

            if (utils.isAsync(conf.after)) {
                conf.after(cup, finishAfter);
            }
            else {
                conf.after(cup);
                finishAfter();
            }
        });

        //if (utils.isAsync(conf.after)) {
        //    after(name, function (done) {
        //        conf.after(cup, done);
        //    });
        //}
        //else {
        //    after(name, function () {
        //        conf.after(cup);
        //    });
        //}
    }

    function _doAfterEach(cup, conf) {

        var name = "stirrer afterEach - " + cup.name;

        if (utils.isAsync(conf.afterEach)) {
            afterEach(name, function (done) {
                conf.afterEach(cup, done);
            });
        }
        else {
            afterEach(name, function () {
                conf.afterEach(cup);
            });
        }
    }

    function _runBefores(cup, callback) {

        debug("running cup befores functions count = " + cup._befores.length + " - " + cup.name);

        utils.runSeriesAsync(cup._befores, function () {
            callback();
        }, cup);
    }

    function _runAfters(cup, callback) {

        //after("stirrer test afters - " + cup.name, function (done) {

        debug("running cup afters functions count = " + cup._afters.length + " - " + cup.name);

        utils.runSeriesAsync(cup._afters, function () {

            //if (!conf.dontRestir) {
            //    cup.restir(); //make sure all fakes are restored using sinon's sandbox restore
            //}

            callback();//done();
        }, cup);
        //});
    }

    function _setup(cup, conf) {

        if (!conf.transformForEach) {
            _transformPars(cup, conf);
        }

        if (conf.spies) {
            _doSpies(cup, conf.spies);
        }

        if (conf.stubs) {
            _doStubs(cup, conf.stubs);
        }

        if (conf.mocks) {
            _doMocks(cup, conf.mocks);
        }
    }

    function _transformPars(cup, conf) {

        if (utils.isFunc(conf.transform)) {
            cup.pars = conf.transform(cup.pars);

            if (!cup.pars) {
                debug("warning - transform called but didnt return anything");
            }
        }
    }

    function _doSpies(cup, spies) {

        _doConfCollection(cup, spies, "spies", function (sConf, key) {
            var spy;

            if (utils.isArray(sConf)) {
                spy = cup.sb.spy(sConf[0], sConf[1]);
            }
            else if (typeof(sConf) === "string") {
                if (sConf === EMPTY) {
                    spy = cup.sb.spy();
                }
                else {
                    throw new Error("stirrer - unknown spy configuration named: " + key);
                }
            }
            else {
                spy = cup.sb.spy(sConf);
            }
            return spy;
        });
    }

    function _doStubs(cup, stubs) {

        _doConfCollection(cup, stubs, "stubs", function (sConf, key) {
            var stub, stubFn;

            if (utils.isArray(sConf)) {
                stubFn = utils.isFunc(sConf[2]) ? sConf : undefined;
                stub = cup.sb.stub(sConf[0], sConf[1], stubFn);
            }
            else if (typeof(sConf) === "string") {
                if (sConf === EMPTY) {
                    stub = cup.sb.stub();
                }
                else {
                    throw new Error("stirrer - unknown stub configuration named: " + key);
                }
            }
            else {
                stub = cup.sb.stub(sConf);
            }

            return stub;
        });
    }

    function _doMocks(cup, mocks) {

        _doConfCollection(cup, mocks, "mocks", function (sConf) {
            return cup.sb.mock(sConf);
        });
    }

    function _doConfCollection(cup, confColl, cupCollName, parseFn) {

        var cupColl = cup[cupCollName] = cup[cupCollName] || {};
        var coll = utils.isFunc(confColl) ? confColl() : confColl; //get result from function or use as is

        Object.keys(coll).forEach(function (key) {

            var sConf = coll[key],
                result;

            if (sConf) {
                result = parseFn(sConf, key);

                if (result) {
                    cupColl[key] = result;
                }
            }
        });
    }

    function _enrichCupStubsFromMocker(cup) {
        //todo: implement !!!!
    }

    function _noop() {
    }

    return {
        grind: grind,
        create: grind, //alias (for those that dont get it)
        restir: restir,
        reset: restir, //alias (for those that dont get it)
        require: mockRequire,

        // Making the RequireMocker class available to the outside so it can be used as standalone
        RequireMocker: Mocker,

        EMPTY: EMPTY
    };
})();

//******************** EXPORT ********************
module.exports = stirrer;