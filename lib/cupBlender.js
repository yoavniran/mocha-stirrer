var nodeUtil = require("util"),
    path = require("path"),
    debug = require("debug")("mocha-stirrer:cupBlender"),
    sinon = require("sinon"),
    pourer = require("./pourer"),
    CupStirrer = require("./CupStirrer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

var blender = (function () {
    "use strict";

    var EMPTY = "-_empty_-";

    // ******************** The CUP ********************
    function Cup(conf) {

        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        //public members
        this.name = conf.name || Date.now();
        this.sb = sb;
        this.pars = {};
        this.required = {};
        this.spies = {};
        this.stubs = {};
        this.mocks = {};

        //private members
        this._isHooked = false;
        this._conf = conf;
        this._mocker = new Mocker(sb);
        this._befores = [];
        this._afters = [];
        this._modules = {};
        this._hooks = {};
        this._mocha = {};
        this._stubAliases = {};
        this._transform = conf.transform;

        _registerMochaHooks(this, conf);
    }

    nodeUtil.inherits(Cup, CupStirrer);

    /**
     * If delay=true was used when grinding the cup then you will need to manually start the cup by calling this method.
     * This will initialize the cup. A good time to use delay and manual start is when you have the cup grinding code
     * at the top of a module or in a shared util class. Then you wouldn't want the cup to be started immediately but
     * rather in the right context/describe.
     * @returns {*}
     */
    Cup.prototype.brew = function () {

        var hooked = _doHooks(this);

        debug("start was called on cup - " + this.name);

        this._isHooked = hooked ? true : this._isHooked;
        return hooked;
    };

    Cup.prototype.start = Cup.prototype.brew; //start is alias for brew for those that dont get it

    Cup.prototype.require = function (reqPath, options) {
        debug("cup require called with path = " + reqPath + " - " + this.name);
        return fakeRequire(module.parent.parent, this, reqPath, options);
    };

    Cup.prototype.restir = function () {
        debug("cup restir called - " + this.name);
        restir(this);
    };

    Cup.prototype.reset = Cup.prototype.restir;   //reset is alias for restir for those that dont get it

    /**
     * Normally, you declare objects to stub using the grind method.
     * The key you use is the name that will be used to store the stub on the cup instance.
     * @param name is the way to identify the stub you wish to get.
     * @returns {*}
     */
    Cup.prototype.getStub = function (name) {
        var stub = this.stubs[name];

        if (!stub) {
            name = this._stubAliases[name]; //try the aliases for
            stub = this.stubs[name];
        }

        return stub;
    };

    /**
     * Will run the transform function provided (if it one was provided) during the [grind](#grindSection) on the current cup instance's pars object.
     */
    Cup.prototype.transformPars = function () {
        _transformPars(this);
    };

    // ******************** API METHODS ********************
    function blend(conf) {

        conf = conf || {};

        var cup = new Cup(conf);

        _setHooks(cup, conf);
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

        cup.required = {};

        cup._stubAliases = {};
    }

    function fakeRequire(parent, cup, requirePath, options) {

        var reqModule = cup._mocker.require(parent, requirePath, options);

        _enrichStubsFromMocker(cup);

        return reqModule;
    }

    function setup(cup) {
        _setup(cup);
    }

    // ******************** PRIVATE METHODS ********************

    function _registerMochaHooks(cup, conf) {

        conf.globals.mochaHooksNames.forEach(function (mochaFn) {
            cup._mocha[mochaFn] = conf.globals.mochaHooks[mochaFn];
        });
    }

    function _doHooks(cup) {

        var hasHooks = !!cup._hooks;

        if (hasHooks) {
            var conf = cup._conf;

            _doBefore(cup, conf);
            _doBeforeEach(cup, conf);
            _doAfter(cup, conf);
            _doAfterEach(cup, conf);

            delete cup._hooks; //delete hooks registry as they should only be registered once
        }

        return hasHooks;
    }

    function _doBefore(cup, conf) {

        var name = "stirrer before - " + cup.name;
        var cupBefore = cup._hooks.before;

        function runit(done) {

            if (!conf.restirForEach) {
                _setup(cup);   //setup should only happen in the test context so its called in the before hook
            }

            cupBefore.call(cup, done);
        }

        if (utils.isAsync(cupBefore)) {
            cup._mocha.before(name, function (done) {
                runit(done);
            });
        }
        else {
            cup._mocha.before(name, function () {
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
                cup.transformPars(); //_transformPars(cup, conf);
            }

            if (conf.restirForEach) {
                debug("restir for each is turned on, running setup on before each for cup: " + cup.name);
                _setup(cup);
            }

            cupBeforeEach.call(cup, done);
        }

        if (utils.isAsync(cupBeforeEach)) {
            cup._mocha.beforeEach(name, function (done) {
                runit(done);
            });
        }
        else {
            cup._mocha.beforeEach(name, function () {
                runit();
            });
        }
    }

    function _doAfter(cup, conf) {

        var name = "stirrer after - " + cup.name;
        var cupAfter = cup._hooks.after;

        cup._mocha.after(name, function (done) {

            function finishAfter() {

                if (!conf.dontRestir && !conf.restirForEach) {  //restirring should only happen after the user's after function
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

    function _doAfterEach(cup, conf) {

        var name = "stirrer afterEach - " + cup.name;
        var cupAfterEach = cup._hooks.afterEach;

        cup._mocha.afterEach(name, function (done) {

            function finishAfterEach() {

                if (!conf.dontRestir && conf.restirForEach) { //restirring should only happen after the user's after function
                    debug("restirring - restir for each is turned on for cup: " + cup.name);
                    cup.restir();  //make sure all fakes are restored using sinon's sandbox restore
                }

                done();
            }

            if (utils.isAsync(cupAfterEach)) {
                cupAfterEach.call(cup, finishAfterEach);
            }
            else {
                cupAfterEach.call(cup);
                finishAfterEach();
            }
        });
    }

    function _setup(cup) {

        var conf = cup._conf;

        if (!conf.transformForEach) {
            _transformPars(cup);
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

        if (conf.requires) {
            _doRequires(cup, conf.requires);
        }
    }

    function _transformPars(cup) {

        if (utils.isFunc(cup._transform)) {
            cup.pars = cup._transform(cup.pars);

            if (!cup.pars) {
                debug("warning - transform called but didnt return anything - cup: " + cup.name);
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
                if (utils.isFunc(sConf)) {
                    throw new TypeError("stirrer - type to stub cannot be function: " + key);
                }

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

    /**
     *
     * @param cup
     * @param requires is either an array or a function (returning array)
     *          each element in the array should either be:
     *              a) string with the path of the module to require
     *              b) an object: {path: "", options: {}) - options is optional
     * @private
     */
    function _doRequires(cup, requires) {

        requires = utils.isFunc(requires) ? requires() : requires;
        requires.forEach(_createRequire.bind(null, cup)); //do fake require for each one requested

        //function stirit() {
        //    debug("stirring in the registered requires in cup: " + cup.name);
        //
        //    requires = utils.isFunc(requires) ? requires() : requires;
        //    requires.forEach(_createRequire.bind(null, cup)); //do fake require for each one requested
        //}
        //
        //if (requires) {
        //    if (immediate) {
        //        stirit();
        //    }
        //    else {
        //        cup._mocha.before(stirit);
        //    }
        //}
    }

    function _createRequire(cup, reqInfo) {

        var modulePath, options;

        if (reqInfo) {
            if (typeof reqInfo === "string") {
                modulePath = reqInfo;
            }
            else {
                modulePath = reqInfo.path;
                options = reqInfo.options;
            }

            options = options || {};
            options.setupContext = options.setupContext || cup;

            if (!modulePath) {
                throw new Error("CupStirrer - must receive module path to require");
            }

            debug("about to fake require: " + modulePath + " on cup: " + cup.name);
            cup.required[modulePath] =  cup.require(modulePath, options);
        }
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

    function _enrichStubsFromMocker(cup) {

        cup.stubs = cup.stubs || {};

        var mockerStubs = cup._mocker.getStubs();

        Object.keys(mockerStubs).forEach(function (key) {
            if (!cup.stubs[key]) {

                cup.stubs[key] = mockerStubs[key]; //copy over ref to stub from the mocker

                _addStubAliases(cup, key);
            }
        });
    }

    function _addStubAliases(cup, fullPath) {

        var aliases = cup._stubAliases;

        if (fullPath.indexOf(path.sep) === 0) {

            var levels = utils.getLeveledFileName(fullPath);

            levels.forEach(function (name) {
                aliases[name] = fullPath;
            });
        }
    }

    function _setHooks(cup, conf) {

        debug("setting hooks on cup: " + cup.name);

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