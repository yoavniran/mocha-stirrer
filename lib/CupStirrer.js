var debug = require("debug")("mocha-stirrer:CupStirrer"),
    utils = require("./utils");

var CupStirrer = (function () {

    function CupStirrer() {
    }

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

        var stirFn = function () {
            debug("stirring in the registered befores - " + cup.name);

            if (utils.isFunc(befores)) {
                befores = [befores];
            }

            cup._befores = cup._befores.concat(befores);
        }.bind(cup);

        if (befores) {
            cup._before(stirFn);
        }
    }

    /**
     * @param cup instance of Cup
     * @param afters is either a function or an array of functions
     */
    function _stirAfters(cup, afters) {

        var stirFn = function () {
            debug("stirring in the registered afters - " + cup.name);

            if (utils.isFunc(afters)) {
                afters = [afters];
            }
            cup._afters = cup._afters.concat(afters);
        }.bind(cup);

        if (afters) {
            cup._before(stirFn);
        }
    }

    function _stirPars(cup, pars) {

        if (pars) {
            cup._before(function () {
                debug("stirring in the registered pars - " + cup.name);
                pars = utils.isFunc(pars) ? pars() : pars;
                cup.pars = utils.merge(pars, this.pars); //add new pars to the pars map
            }.bind(cup));
        }
    }

    function _stirRequires(cup, requires) {

    }

    return CupStirrer;
})();

//******************** EXPORT ********************
module.exports = CupStirrer;
