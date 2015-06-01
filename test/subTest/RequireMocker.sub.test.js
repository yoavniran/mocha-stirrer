var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    stirrer = require("../../lib/index"),
    testUtils = require("../testUtils");

describe("testing auto mocking for require from a different folder", function () {
    "use strict";

    chai.use(dirtyChai); //use lint-friendly chai assertions!
    chai.use(sinonChai);

    it("should fail on module cannot be found", function () {

        var conf = testUtils.getMockBlendConfig();

        conf.requires = [{
            path: "../testObjects/foo"
        }];

        expect(function () {
            stirrer.grind(conf);
        }).to.throw();
    });

    it("should set the parent using the options", function(){

        var conf = testUtils.getMockStartBlendConfig();

        conf.requires = [{
            path: "../testObjects/foo",
            options: {
                parentModule: module,
                mockType: {
                    "./sub/bar": stirrer.RequireMocker.MOCK_TYPES.SPY
                },
                setup: {
                    "./sub/func": function (stub) {
                        stub.returns("bla bla");
                    }
                }
            }
        }];

        var cup = stirrer.grind(conf);

        var foo = cup.required["../testObjects/foo"];
        expect(foo).to.exist();

        expect(foo.useFuncDep()).to.equal("bla bla");
        expect(foo.useSub()).to.equal("hello world");
        expect(cup.getSpy("sub/bar").prototype.start).to.have.been.calledOnce();

        cup.restir();
    });

    describe("pass requires in grind conf with dontMock options from different folder", function () {

        var cup;

        before(function () {
            stirrer.setRequireParent(module);
        });

        it("fake require should exist with stubs/spies created", function () {

            var conf = testUtils.getMockStartBlendConfig();

            conf.requires = [{
                path: "../testObjects/foo",
                options: {
                    mockType: {
                        "./sub/bar": stirrer.RequireMocker.MOCK_TYPES.SPY
                    },
                    setup: {
                        "./sub/func": function (stub) {
                            stub.returns("bla bla");
                        }
                    }
                }
            }];

            cup = stirrer.grind(conf);

            var foo = cup.required["../testObjects/foo"];
            expect(foo).to.exist();

            expect(foo.useFuncDep()).to.equal("bla bla");
            expect(foo.useSub()).to.equal("hello world");
            expect(cup.getSpy("sub/bar").prototype.start).to.have.been.calledOnce();

            cup.restir();
        });
    });
});