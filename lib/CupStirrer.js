var debug = require("debug")("mocha-stirrer:CupStirrer"),
    utils = require("./utils");

var CupStirrer = (function () {
    "use strict";

    function CupStirrer() {
    }

    /**
     * add information to the cup that can be used by following tests. the new information is added on top of any other data
     * already passed using the grind method or previously calling stir
     * @param conf
     */
    CupStirrer.prototype.stir = function (conf) {
        debug("cup stir called - " + this.name);
        _stir(this, conf);
    };

    // ******************** PRIVATE METHODS ********************
    function _stir(cup, conf) {

        if (conf) {
            _stirPars(cup, conf.pars);
            _stirBefores(cup, conf.befores);
            _stirAfters(cup, conf.afters);
            _stirRequires(cup, conf.requires);
        }
    }

    /**
     * @param cup instance of Cup
     * @param befores is either a function or an array of functions
     */
    function _stirBefores(cup, befores) {

        if (befores) {
            cup._mocha.before(function () {
                debug("stirring in the registered befores - " + cup.name);

                if (utils.isFunc(befores)) {
                    befores = [befores];
                }

                cup._befores = cup._befores.concat(befores);
            });
        }
    }

    /**
     * @param cup instance of Cup
     * @param afters is either a function or an array of functions
     */
    function _stirAfters(cup, afters) {

        if (afters) {
            cup._mocha.before(function () {
                debug("stirring in the registered afters - " + cup.name);

                if (utils.isFunc(afters)) {
                    afters = [afters];
                }
                cup._afters = cup._afters.concat(afters);
            });
        }
    }

    function _stirPars(cup, pars) {

        if (pars) {
            cup._mocha.before(function () {
                debug("stirring in the registered pars - " + cup.name);
                pars = utils.isFunc(pars) ? pars() : pars;
                cup.pars = utils.merge(pars, cup.pars); //add new pars to the pars map
            });
        }
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
    function _stirRequires(cup, requires) {

        if (requires) {
            cup._mocha.before(function () {
                debug("stirring in the registered requires - " + cup.name);

                requires = utils.isFunc(requires) ? requires() : requires;
                requires.forEach(_createRequire.bind(null, cup)); //do fake require for each one requested
            });
        }
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

            if (!modulePath){
                throw new Error("CupStirrer - must receive module path to require");
            }

            debug("about to fake require: " + modulePath);

            var reqModule = cup.require(modulePath, options);

            cup.required[modulePath] = reqModule;
        }
    }

    return CupStirrer;
})();

//******************** EXPORT ********************
module.exports = CupStirrer;
