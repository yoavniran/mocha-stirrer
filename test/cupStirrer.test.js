var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    CupStirrer = require("../lib/CupStirrer"),
    stirrer = require("../lib/stirrer");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("cupStirrer tests", function () {
    "use strict";

    var cStirrer = new CupStirrer();

    function getNewTestCup(pars) {

        return {
            name: "test cup",
            _befores: [pars.beforeInitElm],
            _afters: [pars.afterInitElm],
            pars: {
                "test": pars.parInitElmValue
            },
            _before: function (name, fn) {
                if (typeof name === "function") {
                    fn = name;
                }

                fn();
            }
        };
    }

    var cup = stirrer.grind({
        pars: {
            beforeInitElm: "before",
            afterInitElm: "after",
            parInitElmValue: "foo",
            stirredBeforeFn: function () {
            },
            stirredAfterFn: function () {
            },
            stirredParName: "anotherPar"
        },
        transform: function (pars) {
            pars.testCup = getNewTestCup(pars);
            return pars;
        },

        transformForEach: true,

        afterEach: function () {
            var testCup = this.pars.testCup;
            expect(testCup._befores).to.contain(this.pars.beforeInitElm);
            expect(testCup._afters).to.contain(this.pars.afterInitElm);
            expect(testCup.pars).to.include.keys(["test"]);
        }
    });

    describe("test stir with before/after as single function", function () {

        cup.pour("stir should add everything in config", function () {

            cStirrer.stir.call(cup.pars.testCup, {   //cant put this in the cup's before because stirrer.stir creates a before of its own
                befores: cup.pars.stirredBeforeFn,
                afters: cup.pars.stirredAfterFn,
                pars: {
                    "anotherPar": "bla"
                }
            });

            var testCup = this.pars.testCup;

            expect(testCup._befores).to.contain(this.pars.stirredBeforeFn);
            expect(testCup._afters).to.contain(this.pars.stirredAfterFn);
            expect(testCup.pars).to.include.keys(this.pars.stirredParName);
        });

        cup.pour("stir should cope with undefined as conf", function () {
            cStirrer.stir.call(cup.pars.testCup);
        });
    });
});
