var debug = require("debug")("mocha-stirrer:cupBlender"),
    sinon = require("sinon"),
    pourer = require("./pourer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

var blender = (function () {
    "use strict";

    var EMPTY = "-_empty_-";

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

                this._befores = this._befores.concat(befores);
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
                this._afters = this._afters.concat(afters);
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

        function _start() {
            return _doHooks(this);
        }

        return {
            start: function () {
                debug("start was called on cup - " + this.name);
                return _start.call(this);
            },

            require: function (path, options) {
                debug("cup require called with path = " + path + " - " + this.name);
                return fakeRequire(module.parent.parent, this, path, options);
            },

            stir: function (conf) {
                debug("cup stir called - " + this.name);
                _stir.call(this, conf);
            },

            restir: function () {
                debug("cup restir called - " + this.name);
                restir(this);
            },

            reset: function () { //alias for restir
                this.restir();
            }
        };
    })();

    function blend(conf) {

        var name = conf.name || Date.now();
        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        var cup = {
            name: name,
            sb: sb,
            pars: {},
            _conf: conf,
            _mocker: new Mocker(sb),
            _befores: [],
            _afters: [],
            _hooks: {}
        };

        _setHooks(cup, conf);
        utils.merge(cupBody, cup);
        pourer.attach(cup);
        cup.stir(conf); //stir in any befores/afters/pars that were passed from the configuration

        return cup;
    }

    function restir(cup) {
        debug("restirring cup: " + cup.name);

        cup.sb.restore();

        cup._befores.splice(0);
        cup._afters.splice(0);

        cup.stubs = {};
        cup.spies = {};
        cup.mocks = {};
        cup.pars = {};
    }

    function fakeRequire(parent, cup, requirePath, options) {

        var reqModule = cup._mocker.require(parent, requirePath, options);

        _enrichCupStubsFromMocker(cup);

        return reqModule;
    }

    function setup(cup) {
        _setup(cup);
    }

    // ******************** PRIVATE METHODS ********************
    function _doHooks(cup) {

        var hasHooks = !!cup._hooks;

        if (hasHooks) {
            var conf = cup._conf;

            _doBefore(cup, conf);
            _doBeforeEach(cup, conf);
            _doAfter(cup, conf);
            _doAfterEach(cup);

            delete cup._hooks; //delete hooks registry as they should only be registered once
        }

        return hasHooks;
    }

    function _doBefore(cup, conf) {

        var name = "stirrer before - " + cup.name;
        var cupBefore = cup._hooks.before;

        function runit(done) {
            _setup(cup);   //setup should only happen in the test context so its called in the before hook
            cupBefore.call(cup, done);
        }

        if (utils.isAsync(cupBefore)) {
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
        var cupBeforeEach = cup._hooks.beforeEach;

        function runit(done) {

            if (conf.transformForEach) {  //config asked for transforming pars before each test
                _transformPars(cup, conf);
            }

            cupBeforeEach.call(cup, done);
        }

        if (utils.isAsync(cupBeforeEach)) {
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
        var cupAfter = cup._hooks.after;

        after(name, function (done) {

            function finishAfter() {

                if (!conf.dontRestir) {
                    debug("about to restir cup: " + cup.name);
                    cup.restir(); //make sure all fakes are restored using sinon's sandbox restore
                }

                done();
            }

            if (utils.isAsync(cupAfter)) {
                cupAfter.call(cup, finishAfter);
            }
            else {
                cupAfter.call(cup);
                finishAfter();
            }
        });
    }

    function _doAfterEach(cup) {

        var name = "stirrer afterEach - " + cup.name;
        var cupAfterEach = cup._hooks.afterEach;

        if (utils.isAsync(cupAfterEach)) {
            afterEach(name, function (done) {
                cupAfterEach.call(cup, done);
            });
        }
        else {
            afterEach(name, function () {
                cupAfterEach.call(cup);
            });
        }
    }

    function _setup(cup) {

        var conf = cup._conf;

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

    function _setHooks(cup, conf) {

        debug("settings hooks on cup: " + cup.name);

        cup._hooks.before = utils.isFunc(conf.before) ? conf.before : _noop;
        cup._hooks.after = utils.isFunc(conf.after) ? conf.after : _noop;
        cup._hooks.beforeEach = utils.isFunc(conf.beforeEach) ? conf.beforeEach : _noop;
        cup._hooks.afterEach = utils.isFunc(conf.afterEach) ? conf.afterEach : _noop;
    }

    function _noop() {
    }

    return {
        blend: blend,
        restir: restir,
        setup: setup,
        fakeRequire: fakeRequire,

        EMPTY: EMPTY
    };
})();

//******************** EXPORT ********************
module.exports = blender;