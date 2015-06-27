var nodeUtil = require("util"),
    debug = require("debug")("mocha-stirrer:cupBlender"),
    sinon = require("sinon"),
    pourer = require("./pourer"),
    CupStirrer = require("./CupStirrer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

//todo: add config for resetting stub/spy behaviors and/or resetting counts !!!before each test!!! (as separate config object and in the stubs/spies conf)
//todo: add ability to set permanent befores/afters that arent removed on restir
//todo: add ability to configure stub/spy/mock on a method belonging to configured fake-required module

var blender = (function () {
    "use strict";

    var EMPTY = "-_empty_-",
        _requireParent = module.parent.parent; //by default use the module that required stirrer(index)

    function setRequireParent(parentModule) {
        _requireParent = parentModule;
    }

    // ******************** The CUP ********************
    function Cup(conf) {

        CupStirrer.call(this);

        var sbConf = conf.sandbox || undefined;
        var sb = sinon.sandbox.create(sbConf);

        //public members
        this.name = conf.name || Date.now();
        this.sb = sb;
        this.pars = {};
        this.spies = {};
        this.stubs = {};
        this.mocks = {};

        //private members
        this._isHooked = false;
        this._conf = conf;
        this._mocker = new Mocker(sb);

        //this._modules = {};
        this._hooks = {};
        this._mocha = {};

        this._mockAliases = {
            stubs: {},
            spies: {}
        };

        this.required = {};
        this._requireAliases = {};

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

    /**
     *
     * @param reqPath the path of the required module, same as if you were to use node's require method
     * @param options
     *
     *              - alias: an alias to make it easier to access the mock-required module later on from the cup instance
     *              - parentModule: set the parent module to be used for resolving depdending modules
     *              -- for all other options, see RequireMocker.require options documentation
     * @returns {*}
     */
    Cup.prototype.require = function (reqPath, options) {
        debug("cup require called with path = " + reqPath + " - " + this.name);

        return fakeRequire(_requireParent, this, reqPath, options);
    };

    Cup.prototype.restir = function () {
        debug("cup restir called - " + this.name);
        restir(this);
        this._restir(); //restir functionality from CupStirrer
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
            name = this._mockAliases.stubs[name]; //try the aliases if not found in stubs collection
            stub = this.stubs[name];
        }

        return stub;
    };

    Cup.prototype.getSpy = function (name) {
        var spy = this.spies[name];

        if (!spy) {
            name = this._mockAliases.spies[name]; //try the aliases if not found in spies collection
            spy = this.spies[name];
        }

        return spy;
    };

    /**
     * Will run the transform function provided (if it one was provided) during the [grind](#grindSection) on the current cup instance's pars object.
     */
    Cup.prototype.transformPars = function () {
        _transformPars(this);
    };

    /**
     * get a mock-required module using the path it was required with or the alias that was used when the module
     * was required
     * @param name
     */
    Cup.prototype.getRequired = function (name) {

        var reqModule = this.required[name],
            modulePath;

        if (!reqModule) {
            modulePath = this._requireAliases[name];
            reqModule = this.required[modulePath];
        }

        return reqModule;
    };

    // ******************** API METHODS ********************

    /**
     * creates a new Cup instance built on the configuration provided
     * @param conf
     *      see: description of conf in index.js for details
     * @returns {Cup}
     */
    function blend(conf) {

        debug("blending a new cup, conf: ", conf);
        conf = conf || {};
        conf = utils.clone(conf);

        var cup = new Cup(conf);
       
        _setHooks(cup, conf);
        pourer.attach(cup);
        cup.stir(conf); //stir in any befores/afters/pars/requires that were passed from the configuration

        return cup;
    }

    function restir(cup) {
        debug("restirring cup: " + cup.name);

        cup.sb.restore();

        cup.stubs = {};
        cup.spies = {};
        cup.mocks = {};
        cup.required = {};
        cup._requireAliases = {};

        cup._stubAliases = {};
    }

    function fakeRequire(parent, cup, requirePath, options) {

        parent = (options && options.parentModule) || parent;  //options can override the parent module for this specific operation

        var reqModule = cup._mocker.require(parent, requirePath, options);

        _enrichMocksFromMocker(cup, requirePath);

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
                cup.transformPars();
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
            options.setupContext = options.setupContext || cup; //if no context provided, use the cup instance

            if (!modulePath) {
                throw new Error("CupStirrer - must receive module path to require");
            }

            debug("about to fake require: " + modulePath + " on cup: " + cup.name);
            cup.required[modulePath] = cup.require(modulePath, options);

            if (options.alias) {//use alias if one provided
                debug("alias was provided for mock-required module: " + options.alias);
                cup._requireAliases[options.alias] = modulePath;
            }
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

	function _enrichMocksFromMocker(cup, parentPath) {
		
        _takeMocksFromMocker(cup, "stubs", cup._mocker.getStubs(), parentPath);
        _takeMocksFromMocker(cup, "spies", cup._mocker.getSpies(), parentPath);
    }

    function _takeMocksFromMocker(cup, mockType, mocks, parentPath) {
		
		debug("creating aliases for mocks of type: " + mockType);

        var cupList = cup[mockType] = cup[mockType] || {};

        Object.keys(mocks).forEach(function (key) {
            if (!cupList[key]) {

                cupList[key] = mocks[key]; //copy over ref to the mock from the mocker

                _addMockAlias(cup, mockType, key, parentPath);
            }
        });
    }

    function _addMockAlias(cup, mockType, fullPath, parentPath) {

        var aliases = cup._mockAliases[mockType];
		
        if (~(fullPath.indexOf(cup._conf.globals.separator))) { //fullPath.indexOf(cup._conf.globals.separator) > -1) {  //if path includes separator so is a local module
			debug("adding mock alias for: " + fullPath);
            var levels = utils.getLeveledFileName(fullPath, parentPath);

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
        setRequireParent: setRequireParent,

        EMPTY: EMPTY
    };
})();

//******************** EXPORT ********************
module.exports = blender;