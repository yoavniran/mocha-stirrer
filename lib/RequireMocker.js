var Module = require("module"),
    utils = require("./utils"),
    resolvePath = Module._resolveFilename,
    loadModule = Module._load;

var RequireMocker = (function () {
    "use strict";

    function RequireMocker(sinon) {

        this._sinon = sinon;
        this._isSandbox = _setupRestore(this, this._sinon);
        this._stubs = Object.create(null);      //internal stubs cache
        this._modules = [];
    }

    /**
     * Requires the module that is the test subject and mocks all of its internals
     * module can be a function, object or constructor
     * @param parent - the parent module that is making the mock require - this is normally the test module
     * @param requirePath - the module to require, relative to the test module
     * @param options - additional setup options
     *          - dontStub: an array of paths that are required by the module (test-subject) to not stub
     * @returns the stubbed module
     */
    RequireMocker.prototype.require = function (parent, requirePath, options) {

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

        //todo: - debug - console.log("resolving path for: " + requirePath + " - parent: " + parent.id);

        var orgRequire = Module.prototype.require,
            requirePathResolved = resolvePath(requirePath, parent); //resolve the path as if we required from the parent

        _overrideRequire(this, orgRequire, requirePathResolved, options);

        var reqModule = require(requirePathResolved);   //here we use the normal require to get the actual module thats being tested

        Module.prototype.require = orgRequire; //back to normal

        this._modules.push(requirePathResolved);

        return reqModule;
    };

    /**
     * when called directly, will:
     *  - restore the stubs created by calls to require
     *  - remove the stubs from node's module cache
     *  - clear the internal cache
     */
    RequireMocker.prototype.restore = function () {
        _restore(this, true);
    };

    //********************************* PRIVATE METHODS *********************************

    /**
     * overrides node's require mechanism and stubs the dependencies of the module being required
     * @param mocker  RequireMocker instance
     * @param orgRequire
     * @param modulePath
     * @param options
     *               - dontStub - array of paths to not stub and require normally
     *               - setup - object map of paths and corresponding functions that will be called
     *                         with the matched stub as the parameter
     * @private
     */
    function _overrideRequire(mocker, orgRequire, modulePath, options) {

        Module.prototype.require = function (path) { //override node's require mechanism (just for a little while)

            var reqResult;

            var resolvedPath = Module._resolveFilename(path, this);

            if (path === modulePath || this.id !== modulePath) {    //dont mock if this is the test module or if this require is not from the test module
                //todo: - debug - console.log(" $$$$$$$$$$$$$$$$$ ---- REAL !!!!!! " + path);

                if (path === modulePath) {
                    _removeFromNodeCache(resolvedPath); //need to remove the tested module from node's cache every time its mock-required
                }

                reqResult = orgRequire.call(this, path);  //do the real require for the module being tested
            }
            else {


                var stubResult = _stubRequiredModule(mocker, path, resolvedPath, options, this);

                _addToStubs(mocker._stubs, resolvedPath, stubResult);

                if (stubResult.stub) {
                    _runSetups(path, resolvedPath, stubResult.stub, options);
                    reqResult = stubResult.stub;
                }
                else {
                    reqResult = stubResult.module;
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

            //todo: - debug - console.log(" $$$$$$$$$$$$$$$$$ ---- clearing modules !!!!!! full = " + full, mocker._modules);

            mocker._modules.forEach(function (path) { //need to remove the modules that were mock-required from node's cache so they can be mock-required again
                _removeFromNodeCache(path);
            });
        }

        if (mocker._stubs) {

            //todo: - debug - console.log(" $$$$$$$$$$$$$$$$$ ---- clearing stubs !!!!!! full = " + full, Object.keys(mocker._stubs));

            Object.keys(mocker._stubs).forEach(_restoreStub.bind(mocker, full));
        }

        _clearStubs(mocker);
    }

    function _restoreStub(full, id) {

        var stub = this._stubs[id];

        if (stub) {
            if (full) {
                if (stub.prototype) {
                    _restoreProperties(stub.prototype);
                }
                else {
                    _restoreProperties(stub);
                }
            }
        }

        delete this._stubs[id];
    }

    /**
     * sinon stubbing of an object doesnt provide an easy restore
     * so unfortunately we need to restore every fn prop individually
     * @param obj
     * @private
     */
    function _restoreProperties(obj) {

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (_isRestorable(obj[prop])) {
                    obj[prop].restore();
                }
            }
        }
    }

    /**
     * copying the sinon internal method
     * @param stub
     * @returns {boolean|.restore.sinon|*|Window.sinon}
     * @private
     */
    function _isRestorable(stub) {
        return typeof stub === "function" && typeof stub.restore === "function" && stub.restore.sinon;
    }

    function _stubRequiredModule(mocker, path, resolvedPath, options, parent) {

        var reqModule = _getFromNodeCache(resolvedPath); //get from node's module cache if its there
        var stub, moduleExports;

        if (!stub) {
            if (!reqModule) {
                moduleExports = loadModule(path, parent);
            }
            else {
                moduleExports = reqModule.exports;
            }

            if (!_dontStub(path, resolvedPath, options.dontStub)) { //didnt find in the dont stub list - so stubbing!
                //todo: - debug - console.log(" $$$$$$$$$$$$$$$$$ ---- STUBBING !!!!!!! - " + resolvedPath);

                if (utils.isFunc(moduleExports)) {
                    if (moduleExports.prototype && !utils.isObjectEmpty(moduleExports.prototype)) {
                        moduleExports.prototype = mocker._sinon.stub(moduleExports.prototype);
                        stub = moduleExports;
                    }
                    else {
                        stub = mocker._sinon.stub();
                    }
                }
                else {
                    var clone = utils.clone(moduleExports, true);

                    stub = mocker._sinon.stub(clone); //in case of a singleton - we have to clone or it will stub it for everyone, even modules that node itself needs!!!
                }
            }
            else {
                reqModule = moduleExports;
            }
        }

        return {
            module: reqModule,
            stub: stub
        };
    }

    function _dontStub(path, resolvePath, list) {

        var found = false;

        if (list && list.length) {
            for (var i = 0; i < list.length; i += 1) {
                if (list[i] === path || list[i] === resolvePath) {
                    found = true;
                    break;
                }
            }
        }
        return found;
    }

    function _clearStubs(mocker) {
        delete mocker._stubs;
        mocker._stubs = Object.create(null);
    }

    function _addToStubs(stubs, resolvedPath, stubResult) {

        if (stubResult.stub) {
            //todo: - debug - console.log("$$$$$$$$$$$$$$$$$ ---- adding to stubs with id: " + resolvedPath);
            stubs[resolvedPath] = stubResult.stub;
        }
    }

    function _runSetups(path, resolvedPath, stub, options) {

        if (options && options.setup) {

            var setupFn = options.setup[path] || options.setup[resolvedPath];

            if (setupFn) {
                setupFn(stub);
            }
        }
    }

    function _getFromNodeCache(id) {
        return Module._cache[id];
    }

    function _removeFromNodeCache(id) {
        delete Module._cache[id];
    }

    return RequireMocker;
})();


module.exports = RequireMocker;