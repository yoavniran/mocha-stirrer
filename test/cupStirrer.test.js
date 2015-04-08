var chai = require("chai"),
    expect = chai.expect,
    sinon = require("sinon"),
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    CupStirrer = require("../lib/CupStirrer"),
    stirrer = require("../lib/index"),
    testUtils = require("./testUtils");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("cupStirrer tests", function () {
    "use strict";

    function getNewTestCup(pars) {

        return testUtils.mockCupsMochaFunctions({
            name: "test cup",
            _befores: [pars.beforeInitElm],
            _afters: [pars.afterInitElm],
            pars: {
                "test": pars.parInitElmValue
            },
            required: {}
        });
    }

    it("stir should cope with empty conf object", function () {

        var testCup = getNewTestCup({});

        CupStirrer.prototype.stir.call(testCup, {});
    });

    var cStirrer = new CupStirrer();

    var cup = stirrer.grind({  //this is cool! using mocha-stirrer to test itself :)
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

    describe("test stir with requires", function () {

        var testCup = getNewTestCup({});
        var requireRet = {foo: "yes"};

        before(function () {
            testCup.require = sinon.stub();
            testCup.require.returns(requireRet)
        });

        it("require should be called and modules stored in required property", function () {

            var reqOptions = {test: "foo"};

            CupStirrer.prototype.stir.call(testCup, {
                requires: function () {
                    return [
                        "./testObjects/foo",
                        {path: "bar", options: reqOptions}
                    ];
                }
            });

            expect(testCup.require).to.have.been.calledTwice();
            expect(testCup.required).to.not.be.empty();

            expect(testCup.required).to.have.been.calledWith("./testObjects/foo");
            expect(testCup.required).to.have.been.calledWith("bar", reqOptions);

            expect(testCup.required["./testObjects/foo"]).to.equal(requireRet);
            expect(testCup.required["bar"]).to.equal(requireRet);
        });
    });

    describe("test stir with requires failing", function(){

        var testCup = getNewTestCup({});

        testCup._mocha.before = testUtils.getFunctionRunnerExpectsError();

        CupStirrer.prototype.stir.call(testCup, {
            requires: function () {
                return [
                    {path: "", options: {test: "foo"}}
                ];
            }
        });

    });
});
