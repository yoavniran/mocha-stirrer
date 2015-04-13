var chai = require("chai"),
    expect = chai.expect,
    sinon = require("sinon"),
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    pourer = require("../lib/pourer"),
    testUtils = require("./testUtils");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("pourer tests", function () {
    "use strict";

    describe("check that pour is attached and can be used", function () {

        var counter = 0;

        var cup = {
            _isHooked: true,
            _befores: [
                function (next) {
                    expect(counter).to.equal(0);
                    counter += 1;
                    next();
                }
            ],
            _afters: [
                function (next) {
                    expect(counter).to.equal(2);
                    counter += 1;
                    next();
                }
            ],
            _mocha: {it: testUtils.getFunctionRunner()}
        };

        it("pour should be executed successfully", function () {

            pourer.attach(cup);

            cup.pour("dummy test to ensure pour works", function () {
                expect(counter).to.equal(1);
                counter += 1;
            });
        });

        after(function () {
            expect(counter).to.equal(3);
        });
    });

    describe("test stir'n pour™ ", function () {


        var counter = 0;

        var cup = testUtils.mockCupsMochaFunctions({
            _isHooked: true,
            pars: {
                "foo": "bar"
            },
            _befores: [
                function (next) {
                    expect(counter).to.equal(0);
                    counter += 1;
                    next();
                }
            ],
            _afters: [
                function (next) {
                    expect(counter).to.equal(2);
                    counter += 1;
                    next();
                }
            ],
            require: sinon.stub(),
            stir:  sinon.stub(),
            _stirImmediate: sinon.stub(),
            required: {}
        });


        it("stir'n pour™ should be executed successfully", function () {

            pourer.attach(cup);

            cup.pour("dummy test to ensure pour works", function () {

                expect(counter).to.equal(1);
                counter += 1;

                expect(this.pars.foo).to.equal("bar");
                expect(cup._stirImmediate).to.have.been.called();

            }, {
                befores: function (next) {
                    expect(counter).to.equal(1);
                    counter += 1;
                    next();
                },
                afters: function (next) {
                    expect(counter).to.equal(4);
                    counter += 1;
                    next();
                },
                pars: {
                    "testPar": 123
                },
                required: ["path/to/module"]
            });
        });

        after(function () {
            expect(counter).to.equal(3);
        });
    });

});





