var debug = require("debug")("mocha-stirrer:cupBlender"),
    sinon = require("sinon"),
    nodeUtil = require("util"),
    pourer = require("./pourer"),
    CupStirrer = require("./CupStirrer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

var blender = (function () {
    "use strict";

    var EMPTY = "-_empty_-";

    function Cup(conf) {

        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        this.name = conf.name || Date.now();
        this.sb = sb;
        this.pars = {};
        this._isHooked = false;
        this._conf = conf;
        this._mocker = new Mocker(sb);
        this._befores = [];
        this._afters = [];
        this._hooks = {};
        this._it = global.it; //use mocha's it test function, currently only here for helping a few unittest cases
        this._before = global.before; //currently only here for helping a few unittest cases
        this._after = global.after; //currently only here for helping a few unittest cases
    }

    nodeUtil.inherits(Cup, CupStirrer);

    // ******************** API METHODS ********************
    function blend(conf) {

        var cup = new Cup(conf);

        _setHooks(cup, conf);
        utils.merge(_cupBody, cup);
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
    }

    ///**
    // * clears everything (besides the name) from the cup, including the parameters that it stored
    // * @param cup
    // */
    //function clear(cup){
    //    restir(cup);
    //
    //    cup.pars = {};
    //}

    function fakeRequire(parent, cup, requirePath, options) {

        var reqModule = cup._mocker.require(parent, requirePath, options);

        _enrichCupStubsFromMocker(cup);

        return reqModule;
    }

    function setup(cup) {
        _setup(cup);
    }

    // ******************** PRIVATE METHODS ********************

    var _cupBody = (function () {

        function _start() {

            var hooked = _doHooks(this);
            this._isHooked = hooked ? true : this._isHooked;
            return hooked;
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

            restir: function () {
                debug("cup restir called - " + this.name);
                restir(this);
            },

            reset: function () { //alias for restir
                this.restir();
            }
        };
    })();

    function _doHooks(cup) {

        var hasHooks = !!cup._hooks;

        if (hasHooks) {
            var conf = cup._conf;

            _doBefore(cup);
            _doBeforeEach(cup, conf);
            _doAfter(cup, conf);
            _doAfterEach(cup);

            delete cup._hooks; //delete hooks registry as they should only be registered once
        }

        return hasHooks;
    }

    function _doBefore(cup) {

        var name = "stirrer before - " + cup.name;
        var cupBefore = cup._hooks.before;

        function runit(done) {
            _setup(cup);   //setup should only happen in the test context so its called in the before hook
            cupBefore.call(cup, done);
        }

        if (utils.isAsync(cupBefore)) {
            cup._before(name, function (done) {
                runit(done);
            });
        }
        else {
            cup._before(name, function () {
                runit();
            });
        }
    }

    function _doBeforeEach(cup, conf) {

        var name = "stirrer beforeEach - " + cup.name;
        var cupBeforeEach = cup._hooks.beforeEach;

        function runit(done) {

            if (conf.transformForEach) {  //config asked for transforming pars before each test
                debug("transform for each is turned on for cup: " + cup.name);
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

        cup._after(name, function (done) {

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