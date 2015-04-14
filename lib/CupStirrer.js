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

    CupStirrer.prototype._stirImmediate = function(conf){
        debug("cup immediate stir called - " + this.name);
        _stir(this, conf, true);
    };

    // ******************** PRIVATE METHODS ********************
    function _stir(cup, conf, immediate) {

        if (conf) {

            immediate = !!immediate;

            debug("stirring cup: " + cup.name + " - immediate = " + immediate);

            _stirPars(cup, conf.pars, immediate);
            _stirBefores(cup, conf.befores, immediate);
            _stirAfters(cup, conf.afters, immediate);
            _stirRequires(cup, conf.requires, immediate);
        }
    }

    /**
     * @param cup instance of Cup
     * @param befores is either a function or an array of functions
     * @param immediate stir right away
     */
    function _stirBefores(cup, befores, immediate) {

        function stirit() {
            debug("stirring in the registered befores in cup: " + cup.name);

            if (utils.isFunc(befores)) {
                befores = [befores];
            }

            cup._befores = cup._befores.concat(befores);
        }

        if (befores) {
            if (immediate) {
                stirit();
            }
            else {
                cup._mocha.before(stirit);
            }
        }
    }

    /**
     * @param cup instance of Cup
     * @param afters is either a function or an array of functions
     * @param immediate stir right away
     */
    function _stirAfters(cup, afters, immediate) {

        function stirit() {
            debug("stirring in the registered afters in cup: " + cup.name);

            if (utils.isFunc(afters)) {
                afters = [afters];
            }
            cup._afters = cup._afters.concat(afters);
        }

        if (afters) {
            if (immediate) {
                stirit();
            }
            else {
                cup._mocha.before(stirit);
            }
        }
    }

    function _stirPars(cup, pars, immediate) {

        function stirit() {
            debug("stirring in the registered pars in cup: " + cup.name);
            pars = utils.isFunc(pars) ? pars() : pars;
            cup.pars = utils.merge(pars, cup.pars); //add new pars to the pars map. in case of immediate flag

            if (immediate){
                cup.transformPars();
            }
        }

        if (pars) {
            if (immediate) {
                stirit();
            }
            else {
                cup._mocha.before(stirit);
            }
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
    function _stirRequires(cup, requires, immediate) {

        function stirit() {
            debug("stirring in the registered requires in cup: " + cup.name);

            requires = utils.isFunc(requires) ? requires() : requires;
            requires.forEach(_createRequire.bind(null, cup)); //do fake require for each one requested
        }

        if (requires) {
            if (immediate) {
                stirit();
            }
            else {
                cup._mocha.before(stirit);
            }
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

            if (!modulePath) {
                throw new Error("CupStirrer - must receive module path to require");
            }

            debug("about to fake require: " + modulePath + " on cup: " + cup.name);

            var reqModule = cup.require(modulePath, options);

            cup.required[modulePath] = reqModule;
        }
    }

    return CupStirrer;
})();

//******************** EXPORT ********************
module.exports = CupStirrer;
