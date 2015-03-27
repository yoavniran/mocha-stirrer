var sinon = require("sinon"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

//todo: implement debug
//todo: define default for setup/teardown on before/after or beforeEach/AfterEach

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

        conf = conf || {};

        var cup = _blend(conf); //create the Cup with sinon sandbox all the goodness of stirrer

        if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
            _setup(cup, conf);
        }

        _doHooks(cup, conf);

        if (utils.isFunc(testFn)) {  //run the test function if one was supplied
            cup.pour(null, testFn);
        }

        return cup;
    }

    function restir(cup) {
        //
        //cup._befores.splice(0);
        //cup._afters.splice(0);
        //cup._stirs.splice(0);

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
        function _stirBefores(befores) {//, withEach) {

            var stirFn = function () {
                //todo: debug - console.log("!!!!!!!!!! stir befores fn entered");
                if (utils.isFunc(befores)) {
                    befores = [befores];
                }

                befores.forEach(function (fn) {
                    this._befores.push(fn);
                }.bind(this));
            }.bind(this);

            if (befores) {
                //if (withEach) {
                //    beforeEach(stirFn);
                //}
                //else {
                //todo: debug - console.log("!!!!!!!!!!  stirring in befores");
                before(stirFn);
                //}
            }
        }

        /**
         *
         * @param afters is either a function or an array of functions
         */
        function _stirAfters(afters) { //, withEach) {

            var stirFn = function () {

                if (utils.isFunc(afters)) {
                    afters = [afters];
                }

                afters.forEach(function (fn) {
                    this._afters.push(fn);
                }.bind(this));
            }.bind(this);

            if (afters) {
                //if (withEach) {
                //    afterEach(stirFn);
                //}
                //else {
                after(stirFn);
                //}
            }
        }

        function _stirPars(pars, withEach) {

            if (pars) {
                before(function () {
                    pars = utils.isFunc(pars) ? pars() : pars;
                    this.pars = utils.merge(pars, this.pars);
                }.bind(this));
            }
        }

        function _stir(conf, each) {
            //todo: debug - console.log("!!!!!!!!!! stir called !!!!");
            _stirPars.call(this, conf.pars, each);
            _stirBefores.call(this, conf.befores, each);
            _stirAfters.call(this, conf.afters, each);
        }

        return {
            require: function (path, options) {
                return mockRequire(this, path, options);
            },

            stir: function (conf) {
                _stir.call(this, conf); //, false);
            },

            restir: function () {
                restir(this);
            }
        };
    })();

    function _attachPour(cup, conf) {    //todo: move pour to an external file

        function internalPour(testName, testFn, type) {

            testName = testName || "stirrer test - " + cup.name;
            type = type || TEST_TYPES.NORMAL;

            _runBefores(cup, conf);

            function pourOwnTestFn(done) {

                var isAsync = type !== TEST_TYPES.SKIP &&
                    type !== TEST_TYPES.WRAP &&
                    utils.isAsync(testFn, 0);

                if (isAsync) {

                    var ownDone = function (err) {//need to wrap the done before giving it to the test fn
                        _runAfters(cup, conf); //only run the afters when the test is signaled as done
                        done(err);
                    };

                    testFn.call(cup, ownDone); //make the cup as the context
                }
                else {
                    testFn.call(cup);  //make the cup as the context
                    _runAfters(cup, conf);
                    done(); //need to call done because the passed test fn didnt mean to call it (no arg declared)
                }
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
            _afters: [],
            //_stirs: []
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

    function _runBefores(cup, conf) {

        ////todo: - debug - console.log("!!!!!! - RUNNING CUP BEFORES !!!! ", cup._stirs);

        before("stirrer test befores - " + cup.name, function (done) {
            utils.runSeriesAsync(cup._befores, function () {
                done();
            }, cup);
        });
    }

    function _doAfter(cup, conf) {

        var name = "stirrer after - " + cup.name;

        if (utils.isAsync(conf.after)) {
            after(name, function (done) {
                conf.after(cup, done);
            });
        }
        else {
            after(name, function () {
                conf.after(cup);
            });
        }
    }

    function _runAfters(cup, conf) {

        //todo: - debug - console.log("!!!!!! - RUNNING STIRRER AFTER !!!!");

        after("stirrer test afters - " + cup.name, function (done) {

            utils.runSeriesAsync(cup._afters, function () {

                if (!conf.dontRestir) {
                    cup.restir(); //make sure all fakes are restored using sinon's sandbox restore
                }

                done();
            }, cup);
        });
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

            //if (!cup.pars){
            //todo: - debug - warn about transform not returning pars
            //}
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