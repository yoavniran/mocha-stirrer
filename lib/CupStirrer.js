var debug = require("debug")("mocha-stirrer:CupStirrer"),
    utils = require("./utils");

var CupStirrer = (function () {
    "use strict";

    function CupStirrer() {

        this._befores = [];
        this._afters = [];
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

    /**
     * cleans the internal objects managed by this class
     * shouldnt be called on its own, only as part of the full restir flow
     */
    CupStirrer.prototype._restir = function () {

        debug("restirring befores/afters/requires");

        this._befores.splice(0);
        this._afters.splice(0);
    };

    CupStirrer.prototype._immediateStir = function (conf) {
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
            _runStirFunction(cup, stirit, immediate);
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
            _runStirFunction(cup, stirit, immediate);
        }
    }

    function _stirPars(cup, pars, immediate) {

        function stirit() {
            debug("stirring in the registered pars in cup: " + cup.name);
            pars = utils.isFunc(pars) ? pars() : pars;
            cup.pars = utils.merge(pars, cup.pars); //add new pars to the pars map. in case of immediate flag

            if (immediate) {
                cup.transformPars();
            }
        }

        if (pars) {
            _runStirFunction(cup, stirit, immediate);
        }
    }

    function _runStirFunction(cup, fn, immediate){
        if (immediate) {
            fn();
        }
        else {
            cup._mocha.before(fn);
        }
    }

    return CupStirrer;
})();

//******************** EXPORT ********************
module.exports = CupStirrer;
