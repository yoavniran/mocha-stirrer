var Module = require("module"),
    path = require("path"),
    debug = require("debug")("mocha-stirrer:RequireMocker"),
    utils = require("./utils"),
    resolvePath = Module._resolveFilename,
    loadModule = Module._load;

//todo: done - setting for spy all instead of stubbing that is the default
//todo: done - setting for selective spying similar to the dontMock option
//todo: done - change 'path' into something else so path module can be used
//todo: done - store stub using its name, not its path if its a dependency (external module) and not a node core module
//todo: done - dont touch a dependency that is just a key/val obj like a consts module
//todo: done - allow maintaining a static/global list of dontMock modules
//todo: done - stub prototype methods but also static methods

//todo: consider using own sinon sandbox if one isnt provided for all restoring functionality

var RequireMocker = (function () {
    "use strict";

    var MOCK_TYPES = Object.freeze({
        STUB: 1,
        SPY: 2
    });

    var _globals = Object.seal({
        mockType: MOCK_TYPES.STUB, //default is to stub
        dontMock: []
    });

    function RequireMocker(sinon) {

        this._sinon = sinon;
        this._isSandbox = _setupRestore(this, this._sinon);
        this._modules = [];

        _initMockCache(this);
    }

    //********************************* PUBLIC INSTANCE METHODS *********************************

    /**
     * Requires the module that is the test subject and mocks all of its internals
     * module can be a function, object or constructor
     * @param parent - the parent module that is making the mock require - this is normally the test module
     * @param requirePath - the module to require, relative to the test module
     * @param options - additional setup options
     *          - dontMock: an array of paths that are required by the module (test-subject) to not stub
     *          - mockType: either:
     *              * an object map of key = path to a required module and value is one of the values in  RequireMocker.MOCK_TYPES (STUB or SPY)
     *                  ex: {"./sub/myModule": RequireMocker.MOCK_TYPES.STUB,
     *                      "../anotherModule":RequireMocker.MOCK_TYPES.SPY}
     *              * one of the values in RequireMocker.MOCK_TYPES (STUB or SPY)
     *
     *          - setup: object map containing the require path of stubbed dependency and a matching function. the function signature is: fn(stub)
     *          - setupContext: the context to pass into the setup method(s)
     * @returns the stubbed module
     */
    RequireMocker.prototype.require = function (parent, requirePath, options) {

        debug("mock require called. using globals: ", _globals);

        if (typeof(parent) === "string") { //didnt get parent, probably used as standalone, shift args to the left

            options = requirePath;
            requirePath = parent;

            if (module.parent) {
                parent = module.parent.parent;
            }
        }

        if (!parent) {
            throw new ReferenceError("must have a reference to the parent module = the test module");
        }

        options = options || {};

        return _require(this, parent, requirePath, options);
    };

    /**
     * when called directly, will:
     *  - restore the stubs created by calls to require
     *  - remove the stubbed modules from node's module cache
     *  - clear the internal cache
     */
    RequireMocker.prototype.restore = function () {
        _restore(this, true);
    };

    RequireMocker.prototype.getStubs = function () {
        return this._mockCache.stubs;
    };

    RequireMocker.prototype.getSpies = function () {
        return this._mockCache.spies;
    };

    RequireMocker.prototype.getResolvedPath = function (reqPath, parent) {
        return resolvePath(reqPath, parent);
    };

    //********************************* PUBLIC STATIC METHODS *********************************

    RequireMocker.getGlobalDontMock = function () {
        return _globals.dontMock.slice();
    };

    RequireMocker.addGlobalDontMock = function (name) {

        if (utils.isArray(name)) {
            _globals.dontMock = _globals.dontMock.concat(name);
        }
        else {
            _globals.dontMock.push(name);
        }
    };

    RequireMocker.removeGlobalDontMock = function (name) {
        var index = _globals.dontMock.indexOf(name);
        if (index > -1) {
            _globals.dontMock.splice(index, 1);
        }
    };

    RequireMocker.clearGlobalDontMock = function () {
        _globals.dontMock.splice(0);
    };

    RequireMocker.getGlobalMockType = function () {
        return _globals.mockType;
    };

    RequireMocker.setGlobalMockType = function (mockType) {
        _globals.mockType = mockType; //naively accept anything throw on usage
    };

    //********************************* PRIVATE METHODS *********************************

    function _require(mocker, parent, requirePath, options) {

        var reqModule;

        debug("resolving path for: " + requirePath + " - parent: " + parent.id);

        var orgRequire = Module.prototype.require;
        var requirePathResolved = mocker.getResolvedPath(requirePath, parent); //resolve the path as if we required from the parent

        try {

            _overrideRequire(mocker, orgRequire, requirePathResolved, options);

            reqModule = require(requirePathResolved); //here we use the normal require to get the actual module thats being tested
            mocker._modules.push(requirePathResolved);
        }
        finally {
            Module.prototype.require = orgRequire; //back to normal
        }

        return reqModule;
    }

    /**
     * overrides node's require mechanism and stubs the dependencies of the module being required
     * @param mocker  RequireMocker instance
     * @param orgRequire
     * @param modulePath
     * @param options
     *               - dontMock - array of paths to not stub and require normally
     *               - setup - object map of paths and corresponding functions that will be called
     *                         with the matched stub as the parameter
     * @private
     */
    function _overrideRequire(mocker, orgRequire, modulePath, options) {

        Module.prototype.require = function (reqPath) { //override node's require mechanism (just for a little while)

            var reqResult;

            var resolvedPath = Module._resolveFilename(reqPath, this);

            if (reqPath === modulePath || this.id !== modulePath) {    //dont mock if this is the test module or if this require is not from the test module
                debug("requiring module as is - not stubbing: " + reqPath);

                if (reqPath === modulePath) {
                    _removeFromNodeCache(resolvedPath); //need to remove the tested module from node's cache every time its mock-required
                }

                reqResult = orgRequire.call(this, reqPath);  //do the real require for the module being tested
            }
            else {
                var mockResult = _mockRequiredModule(mocker, reqPath, resolvedPath, options, this);

                if (mockResult.mock) {

                    _addToMockedCache(mocker._mockCache, resolvedPath, reqPath, mockResult);
                    _runSetups(reqPath, resolvedPath, mockResult.mock, options);

                    reqResult = mockResult.mock;
                }
                else {
                    reqResult = mockResult.module;
                }
            }

            return reqResult;
        };
    }

    /**
     * if the sinon object received is a sinon sandbox then we supplement it with the internal restore
     * @param mocker
     * @param sinon
     * @returns true if sandbox was detected
     * @private
     */
    function _setupRestore(mocker, sinon) {

        var isSandbox = !!sinon.reset && !!sinon.verify; //ugly check to detect if this is a sinon.sandbox

        if (isSandbox) { //sandbox restore will take care of the stubs, need to remove from node's cache and internal cache

            var orgRestore = sinon.restore;

            sinon.restore = function () {
                _restore(mocker, false);
                orgRestore.apply(sinon, arguments);
            };
        }

        return isSandbox;
    }

    function _restore(mocker, full) {

        if (mocker._modules) {
            mocker._modules.forEach(function (mPath) { //need to remove the modules that were mock-required from node's cache so they can be mock-required again
                _removeFromNodeCache(mPath);
            });
        }

        if (mocker._mockCache) {
            debug("restoring mocks, full = " + full);

            Object.keys(mocker._mockCache.stubs).forEach(_restoreMock.bind(null, mocker._mockCache.stubs, full));
            Object.keys(mocker._mockCache.spies).forEach(_restoreMock.bind(null, mocker._mockCache.spies, full));
        }

        _initMockCache(mocker);
    }

    function _restoreMock(mocksColl, full, id) {

        if (full) {
            var mock = mocksColl[id];

            if (mock) {
                debug("restoring mock: " + id);

                if (mock.prototype) {
                    _restoreProperties(mock.prototype);
                }

                _restoreProperties(mock);
            }
        }

        delete mocksColl[id];
    }

    /**
     * sinon stubbing of an object doesnt provide an easy restore
     * so unfortunately we need to restore every fn prop individually
     * @param obj
     * @private
     */
    function _restoreProperties(obj) {

        Object.keys(obj).forEach(function (prop) {
            if (_isRestorable(obj[prop])) {
                obj[prop].restore();
            }
        });
    }

    /**
     * copying the sinon internal method for determining whether an object can be restored
     * @param stub
     * @returns {boolean|.restore.sinon|*|Window.sinon}
     * @private
     */
    function _isRestorable(stub) {
        return typeof stub === "function" && typeof stub.restore === "function" && stub.restore.sinon;
    }

    function _mockRequiredModule(mocker, reqPath, resolvedPath, options, parent) {

        var reqModule = _getFromNodeCache(resolvedPath); //get from node's module cache if its there
        var mockType = _getMockTypeForModule(reqPath, resolvedPath, options);
        var mock, moduleExports;

        if (!reqModule) {
            moduleExports = loadModule(reqPath, parent);
        }
        else {
            moduleExports = reqModule.exports;
        }

        if (!_isInDontMockList(reqPath, resolvedPath, options)) {
            mock = _mockModuleExports(mocker, mockType, moduleExports, resolvedPath);
        }
        else {
            debug("found module to not mock: reqPath = " + reqPath + ", resolvedPath = " + resolvedPath);

            reqModule = moduleExports;
        }

        return {
            module: reqModule,
            mock: mock,
            mockType: mockType
        };
    }

    function _getMockTypeForModule(reqPath, resolvedPath, options) {

        var mockType = _globals.mockType;  //fallback is on the globals mock type

        if (options.mockType) {
            if (typeof options.mockType === "number") {   //in case options uses mock type for all required modules in this require
                mockType = options.mockType;
            }
            else {
                mockType = options.mockType[reqPath] || options.mockType[resolvedPath] || mockType; //in case options defines a mock type for a specific module
            }
        }

        if (!utils.find(MOCK_TYPES, mockType)) {
            throw new TypeError("RequireMocker - Unknown mock type was used: " + mockType);
        }

        return mockType;
    }

    function _mockModuleExports(mocker, mockType, moduleExports, resolvedPath) {

        var mocked;

        debug("stubbing mock-required module: " + resolvedPath);

        if (utils.isFunc(moduleExports)) {
            if (_hasPrototype(moduleExports)) {

                _mockPrototypeMethods(mocker, mockType, moduleExports);

                mocked = _mockOwnMethods(mocker, mockType, moduleExports);  //run over own (static) methods and stub them as well
            }
            else {
                mocked = _getMockedSimpleFunction(mocker, mockType, moduleExports);
            }
        }
        else {
            var clone = _copyObject(moduleExports); //in case of a singleton - we have to clone or it will stub it for everyone, even modules that node itself needs!!!

            mocked = _mockOwnMethods(mocker, mockType, clone);
        }

        return mocked;
    }

    function _mockPrototypeMethods(mocker, mockType, obj) {
        _mockOwnMethods(mocker, mockType, obj.prototype);
    }

    function _mockOwnMethods(mocker, mockType, obj) {

        var mocked;

        if (mockType === MOCK_TYPES.STUB) {
            if (utils.isFunc(obj)) {
                mocked = _getMockedStaticMethods(mocker, mockType, obj, obj);
            }
            else {
                mocked = mocker._sinon.stub(obj);
            }
        }
        else if (mockType === MOCK_TYPES.SPY) {
            mocked = _getMockedStaticMethods(mocker, mockType, obj, (utils.isFunc(obj) ? obj : undefined));
        }

        return mocked;
    }

    function _getMockedStaticMethods(mocker, mockType, obj, target) {

        var mocked = target || {};

        Object.keys(obj).forEach(function (prop) {
            if (utils.isFunc(obj[prop])) {
                if (mockType === MOCK_TYPES.STUB) {
                    mocked[prop] = mocker._sinon.stub(obj, prop);
                }
                else if (mockType === MOCK_TYPES.SPY) {
                    mocked[prop] = mocker._sinon.spy(obj, prop);
                }
            }
            else {
                mocked[prop] = obj[prop];
            }
        });

        return mocked;
    }

    function _getMockedSimpleFunction(mocker, mockType, fn) {
        var mocked;

        if (mockType === MOCK_TYPES.STUB) {
            mocked = mocker._sinon.stub();
        }
        else if (mockType === MOCK_TYPES.SPY) {
            mocked = mocker._sinon.spy(fn);
        }

        return mocked;
    }

    function _isInDontMockList(reqPath, resolvedPath, options) {

        var found = false;

        var list;

        if (options.dontStub) { //todo: remove in next version
            utils.deprecate("'dontStub' option", "RequireMocker");
            list = options.dontStub;
        }

        list = options.dontMock || list;

        list = utils.isArray(list) ? list.concat(_globals.dontMock) : _globals.dontMock; //merge list with globals

        for (var i = 0; i < list.length; i += 1) {
            if (list[i] === reqPath || list[i] === resolvedPath) {
                found = true;
                break;
            }
        }

        return found;
    }

    function _initMockCache(mocker) {

        if (!mocker._mockCache) {
            mocker._mockCache = {};
        }

        mocker._mockCache.stubs = Object.create(null);
        mocker._mockCache.spies = Object.create(null);
    }

    function _addToMockedCache(mockCache, resolvedPath, reqPath, mockResult) {

        if (mockResult.mock) { //in case we have a mocked object

            var cache;

            switch (mockResult.mockType) {

                case MOCK_TYPES.STUB:
                    cache = mockCache.stubs;
                    break;
                case MOCK_TYPES.SPY:
                    cache = mockCache.spies;
                    break;
            }

            var usePath = (reqPath.indexOf(path.sep) > 0) ? resolvedPath : reqPath; //in case this is an external (ex: npm) module (not node and not local) then use its name rather than its resolved path

            cache[usePath] = mockResult.mock;
        }
    }

    /*
     get everything off of the object, including inherited (prototype) props
     */
    function _copyObject(obj) {
        var copy = {};

        for (var prop in obj) {
            copy[prop] = obj[prop];
        }

        return copy;
    }

    function _runSetups(reqPath, resolvedPath, mock, options) {

        if (options && options.setup) {

            var setupFn = options.setup[reqPath] || options.setup[resolvedPath];

            if (setupFn) {
                debug("running setup function for: " + resolvedPath);
                setupFn.call(options.setupContext, mock, reqPath);
            }
        }
    }

    function _getFromNodeCache(id) {
        return Module._cache[id];
    }

    function _removeFromNodeCache(id) {
        delete Module._cache[id];
    }

    function _hasPrototype(fn) {
        return fn && fn.prototype && !utils.isObjectEmpty(fn.prototype);
    }

    //****************************************************************************************

    RequireMocker.MOCK_TYPES = MOCK_TYPES;

    return RequireMocker;
})();

//******************** EXPORT ********************
module.exports = RequireMocker;