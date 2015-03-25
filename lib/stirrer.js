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
     *      - dontRestir (default: false)
     *      - requires (optional)
     *      - befores (optional) - function or array of functions with signature: fn(next)
     *      - afters (optional) - function or array of functions with signature: fn(next)
     * @param testFn
     * @returns Cup
     */
    function grind(conf, testFn) {

        conf = conf || {};

        var name = conf.name || Date.now();
        var cup = _blend(conf, name); //create the sinon sandbox with added goodness of stirrer

        if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
            _setup(cup, conf);
        }

        function pour(testName, fn) {

            if (utils.isFunc(fn)) {

                _doBefore(cup, conf, name);

                testName = testName || "stirrer test - " + name;

                if (fn.length > 0) {
                    it(testName, function(done){
                        fn.call(cup, done); //make the cup as the context
                    });
                }
                else {
                    it(testName, function(){
                       fn.call(cup);
                    });
                }

                _doAfter(cup, conf, name);
            }
        }

        cup.pour = cup.runTest = pour;

        pour(null, testFn);  //will run the test function if one was supplied

        return cup;
    }

    function restir(cup) {

        cup._befores.splice(0);
        cup._afters.splice(0);
        cup._stirs.splice(0);

        cup.sb.restore();
    }

    function mockRequire(cup, requirePath, options) {

        var reqModule = cup._mocker.require(module.parent, requirePath, options);

        //todo: inject the stubs from mocker to the cup stubs

        _enrichCupStubsFromMocker(cup);

        return reqModule;
    }

//******************* PRIVATE METHODS *****************

//todo: make the pars passed to stir "test-specific" so they are cleaned automatically after each test
    var body = (function () {

        /**
         *
         * @param befores is either a function or an array of functions
         */
        function _stirBefores(befores, withEach) {

            var stirFn = function () {
                if (utils.isFunc(befores)) {
                    befores = [befores];
                }

                befores.forEach(function (fn) {
                    this._befores.push(fn);
                }.bind(this));
            }.bind(this);

            if (befores) {
                if (withEach) {
                    beforeEach(stirFn);
                }
                else {
                    before(stirFn);
                }
            }
        }

        /**
         *
         * @param afters is either a function or an array of functions
         */
        function _stirAfters(afters, withEach) {

            var stirFn = function () {

                if (utils.isFunc(afters)) {
                    afters = [afters];
                }

                afters.forEach(function (fn) {
                    this._afters.push(fn);
                }.bind(this));
            }.bind(this);

            if (afters) {
                if (withEach) {
                    afterEach(stirFn);
                }
                else {
                    after(stirFn);
                }
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
            _stirPars(conf.pars, each);
            _stirBefores(conf.befores, each);
            _stirAfters(conf.afters, each);
        }

        return {
            require: function (path, options) {
                return mockRequire(this, path, options);
            },

            stir: function (conf) {
                _stir(conf, false);
            },

            stirEach: function (conf) {
                _stir(conf, true);
            },

            restir: function () {
                restir(this);
            }
        };
    })();

    function _blend(conf, name) {

        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        if (!utils.isFunc(conf.before)) {
            conf.before = _noop;
        }

        if (!utils.isFunc(conf.after)) {
            conf.after = _noop;
        }

        var cup = {
            name: name,
            sb: sb,
            pars: {},
            _mocker: new Mocker(sb),
            _befores: [],
            _afters: [],
            _stirs: []
        };

        //todo: implement requires which can be part of the conf

        utils.merge(body, cup);
        cup.stir(conf);

        return cup;
    }

    function _doBefore(cup, conf, name) {

        name = "stirrer before - " + name;

        if (utils.isAsync(conf.before)) {

            before(name, function (done) {
                _runBefores(cup, conf, done);
            });
        }
        else {
            before(name, function () {
                _runBefores(cup, conf);
            });
        }
    }

    function _runBefores(cup, conf, done) {

        //todo: - debug - console.log("!!!!!! - RUNNING STIRRER BEFORE !!!! ", cup._stirs);

        if (!conf.setupImmediate) {
            _setup(cup, conf);
        }

        utils.runSeriesAsync(cup._befores, function () {
            conf.before(cup, done);
        }, cup);
    }

    function _doAfter(cup, conf, name) {

        name = "stirrer after - " + name;

        if (utils.isAsync(conf.after)) {
            after(name, function (done) {
                _runAfters(cup, conf, done);
            });
        }
        else {
            after(name, function () {
                _runAfters(cup, conf);
            });
        }
    }

    function _runAfters(cup, conf, done) {

        //todo: - debug - console.log("!!!!!! - RUNNING STIRRER AFTER !!!!");

        utils.runSeriesAsync(cup._afters, function () {

            conf.after(cup, done);

            if (!conf.dontRestir) {
                cup.restir(); //make sure everything is restored using sinon's sandbox restore
            }
        }, cup);
    }

    function _setup(cup, conf) {

        _doPars(cup, conf);

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

    function _doPars(cup, conf) {

        if (utils.isFunc(conf.transform)) {
            cup.pars = conf.transform(cup.pars);
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