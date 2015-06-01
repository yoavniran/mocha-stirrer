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

    describe("test stir of parameters", function () {

        var testCup = testUtils.mockCupsMochaFunctions({pars: {parA: "aaa"}});

        it("should add pars and leave existing ones in place", function () {

            CupStirrer.prototype.stir.call(testCup, {
                pars: {parB: "bbb"}
            });

            expect(testCup.pars.parA).to.equal("aaa");
            expect(testCup.pars.parB).to.equal("bbb");

            CupStirrer.prototype.stir.call(testCup, {
                pars: {parC: "ccc"}
            });

            expect(testCup.pars.parA).to.equal("aaa");
            expect(testCup.pars.parB).to.equal("bbb");
            expect(testCup.pars.parC).to.equal("ccc");
        });
    });

    describe("test stir of befores", function () {

        var funcA = function () {
        };
        var funcB = function () {
        };
        var funcC = function () {
        };
        var funcD = function () {
        };

        var testCup = testUtils.mockCupsMochaFunctions({
            _befores: [funcA]
        });

        it("should add pars and leave existing ones in place", function () {

            CupStirrer.prototype.stir.call(testCup, {
                befores: funcB
            });

            expect(testCup._befores).to.contain(funcA);
            expect(testCup._befores).to.contain(funcB);

            CupStirrer.prototype.stir.call(testCup, {
                befores: [funcC, funcD]
            });

            expect(testCup._befores).to.contain(funcA);
            expect(testCup._befores).to.contain(funcB);
            expect(testCup._befores).to.contain(funcC);
            expect(testCup._befores).to.contain(funcD);
        });

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

    //describe("test stir with requires", function () {
    //
    //    var testCup = getNewTestCup({});
    //    var requireRet = {foo: "yes"};
    //
    //    before(function () {
    //        testCup.require = sinon.stub();
    //        testCup.require.returns(requireRet);
    //    });
    //
    //    it("require should be called and modules stored in required property", function () {
    //
    //        var reqOptions = {test: "foo"};
    //
    //        CupStirrer.prototype.stir.call(testCup, {
    //            requires: function () {
    //                return [
    //                    "./testObjects/foo",
    //                    {path: "bar", options: reqOptions}
    //                ];
    //            }
    //        });
    //
    //        expect(testCup.require).to.have.been.calledTwice();
    //        expect(testCup.required).to.not.be.empty();
    //
    //        expect(testCup.required).to.have.been.calledWith("./testObjects/foo");
    //        expect(testCup.required).to.have.been.calledWith("bar", reqOptions);
    //
    //        expect(testCup.required["./testObjects/foo"]).to.equal(requireRet);
    //        expect(testCup.required.bar).to.equal(requireRet);
    //    });
    //});

    describe("test stir with requires failing", function () {

        var testCup = getNewTestCup({});

        testCup._mocha.before = testUtils.getFunctionRunnerExpectsError();

        it("should throw error on missing require path", function () {

            CupStirrer.prototype.stir.call(testCup, {
                requires: function () {
                    return [
                        {path: "", options: {test: "foo"}}
                    ];
                }
            });
        });
    });

    describe("test stir without immediate flag", function () {

        var testCup = testUtils.stubCupsMochaFunctions({
            _befores: [],
            _afters: [],
            //required: {},
            //require: sinon.stub()
        });

        var utils = require("../lib/utils");

        it("should not stir conf immediately", function () {
            CupStirrer.prototype.stir.call(testCup, {
                befores: function () {
                },
                afters: function () {
                },
                pars: {
                    myPar: "foo"
                }
                //requires: [
                //    "path/to/module"
                //]
            });

            expect(testCup._mocha.before).to.have.been.called();
            //expect(testCup.require).to.have.callCount(1);
        });
    });

    describe("test stir with immediate flag", function () {

        var testCup = testUtils.stubCupsMochaFunctions({
            _befores: [],
            _afters: [],
            //required: {},
            //require: sinon.stub(),
            transformPars: sinon.stub()
        });

        it("should stir conf immediately", function () {
            CupStirrer.prototype._immediateStir.call(testCup, {
                befores: function () {
                },
                afters: function () {
                },
                pars: {
                    myPar: "foo"
                }
                //requires: [
                //    "path/to/module"
                //]
            });

            expect(testCup._mocha.before).to.not.have.been.called();
            //expect(testCup.require).to.have.been.called();
            expect(testCup.transformPars).to.have.been.called();
        });
    });
});
