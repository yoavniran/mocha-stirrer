var debug = require("debug")("mocha-stirrer:cupBlender"),
    sinon = require("sinon"),
    pourer = require("./pourer"),
    Mocker = require("./RequireMocker"),
    utils = require("./utils");

var blender = (function () {
    "use strict";

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

        return {
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
            }
        };
    })();

    function blend(conf) {

        var name = conf.name || Date.now();
        var sbConf = conf.sandbox || void 0;
        var sb = sinon.sandbox.create(sbConf);

        if (!conf.delay) {
            _setHooks(conf);
        }

        var cup = {
            name: name,
            sb: sb,
            pars: {},
            _mocker: new Mocker(sb),
            _befores: [],
            _afters: []
        };

        utils.merge(cupBody, cup);
        pourer.attach(cup);
        cup.stir(conf);

        return cup;
    }

    function restir(cup) {
        cup.sb.restore();
    }

    function fakeRequire(parent, cup, requirePath, options) {

        var reqModule = cup._mocker.require(parent, requirePath, options);

        _enrichCupStubsFromMocker(cup);

        return reqModule;
    }

    function _enrichCupStubsFromMocker(cup) {
        //todo: implement !!!!
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

    function _noop() {
    }

    return {
        blend: blend,
        restir: restir,
        fakeRequire: fakeRequire
    };
})();

//******************** EXPORT ********************
module.exports = blender;
