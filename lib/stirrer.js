"use strict";
var sinon = require("sinon"),
    Mocker = require("./requireMocker"),
    utils = require("./utils");

//todo: implement debug
//todo: consider whats the relationship between the cup lifecycle (sandbox restore) and modules that are mock-required  ???

["before", "after", "beforeEach", "afterEach"].forEach(function (mochaFn) {
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
 *      - before (optional)
 *      - after (optional)
 *      - beforeEach (optional)
 *      - afterEach (optional)
 *      - sandbox (optional) - configuration for sinon sandbox
 *      - setupImmediate (default: false)
 *      - dontRestir (default: false)
 *      - befores (optional) - function or array of functions with signature: fn(next)
 *      - afters (optional) - function or array of functions with signature: fn(next)
 * @param testFn
 * @returns {sbConf}
 */
function grind(conf, testFn) {

    //if (!conf) {
    //    throw new TypeError("Stirrer - expecting a configuration object");
    //}
    conf = conf ||{};

    var name = conf.name || Date.now();
    var cup = _blend(conf, name); //create the sinon sandbox with added goodness of stirrer

    if (conf.setupImmediate) { //if told to, setup everything right away, if not then setup will happen in the before hook
        _setup(cup, conf);
    }

    function pour(fn) {

        if (utils.isFunc(fn)) {

            _doBefore(cup, conf, name);

            fn.call(cup, cup); //make the cup as the context and also pass it as a parameter for convenience

            _doAfter(cup, conf, name);
        }
    }

    cup.pour = cup.runTest = pour;

    pour(testFn);  //will run the supplied test function if one was supplied

    return cup;
}

function restir(cup) {

    cup._befores.splice(0);
    cup._afters.splice(0);
    cup._stirs.splice(0);

    cup.sb.restore();
}

function mockRequire(cup, requirePath, setupFn, options) {
    return cup._mocker.require(module.parent, requirePath, setupFn, options);
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
        require: function (path, setupFn, options) {
            return mockRequire(this, path, setupFn, options);
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
        _stirs: [],
        _require: conf.require
    };

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

    console.log("!!!!!! - RUNNING STIRRER BEFORE !!!! ", cup._stirs);

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

    console.log("!!!!!! - RUNNING STIRRER AFTER !!!!");

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

    }

    if (conf.stubs) {
        _doStubs(cup, conf.stubs);
    }

    if (conf.mocks) {

    }
}

function _doPars(cup, conf) {

    if (utils.isFunc(conf.transform)) {
        cup.pars = conf.transform(cup.pars);
    }
}

function _doStubs(cup, stubs) {

    cup.stubs = {};
    stubs = utils.isFunc(stubs) ? stubs() : stubs;

    Object.keys(stubs).forEach(function (key) {

        var sConf = stubs[key],
            stub, stubFn;

        if (sConf) {
            if (utils.isArray(sConf)) {
                stubFn = utils.isFunc(sConf[2]) ? sConf : undefined;
                stub = cup.sb.stub(sConf[0], sConf[1], stubFn);
            }
            else if (typeof(sConf) === "string") {
                if (sConf === EMPTY) {
                    stub = cup.sb.stub();
                }
            }
            else {
                stub = cup.sb.stub(sConf);
            }

            if (stub) {
                cup.stubs[key] = stub; //add the created stub so its available for the test methods
            }
        }
    });
}

function _noop() {
}

//******************** EXPORT ********************
module.exports = {
    grind: grind,
    create: grind, //alias (for those that dont get it)
    restir: restir,
    destroy: restir, //alias (for those that dont get it)
    require: mockRequire,
    EMPTY: EMPTY
};