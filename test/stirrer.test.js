var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    sinon = require("sinon");

describe("stirrer tests", function () {
    "use strict";

    describe("test no mocha hooks - error", function () {

        it("stirrer should throw if a mocha hook method is not available - before", function () {

            var Module = require("module");
            var stirrerPath = require.resolve("../lib/stirrer");
            delete Module._cache[stirrerPath]; //need to make sure stirrer is re-required

            var beforeOrg = global.before; //get rid of the mocha before method
            global.before = null;

            expect(function () {
                require("../lib/stirrer");
            }).to.throw();

            global.before = beforeOrg;
        });

        it("stirrer should throw if a mocha hook method is not available - after", function () {

            var Module = require("module");
            var stirrerPath = require.resolve("../lib/stirrer");
            delete Module._cache[stirrerPath]; //need to make sure stirrer is re-required

            var afterOrg = global.after; //get rid of the mocha before method
            global.after = null;

            expect(function () {
                require("../lib/stirrer");
            }).to.throw();

            global.after = afterOrg;
        });

        it("stirrer should throw if a mocha hook method is not available - beforeEach", function () {

            var Module = require("module");
            var stirrerPath = require.resolve("../lib/stirrer");
            delete Module._cache[stirrerPath]; //need to make sure stirrer is re-required

            var beforeEachOrg = global.beforeEach; //get rid of the mocha before method
            global.beforeEach = null;

            expect(function () {
                require("../lib/stirrer");
            }).to.throw();

            global.beforeEach = beforeEachOrg;
        });

        it("stirrer should throw if a mocha hook method is not available - afterEach", function () {

            var Module = require("module");
            var stirrerPath = require.resolve("../lib/stirrer");
            delete Module._cache[stirrerPath]; //need to make sure stirrer is re-required

            var afterEachOrg = global.afterEach; //get rid of the mocha before method
            global.afterEach = null;

            expect(function () {
                require("../lib/stirrer");
            }).to.throw();

            global.afterEach = afterEachOrg;
        });

        it("stirrer should throw if a mocha test method is not available - it", function () {

            var Module = require("module");
            var stirrerPath = require.resolve("../lib/stirrer");
            delete Module._cache[stirrerPath]; //need to make sure stirrer is re-required

            var itOrg = global.it; //get rid of the mocha before method
            global.it = null;

            expect(function () {
                require("../lib/stirrer");
            }).to.throw();

            global.it = itOrg;
        });
    });

    describe("use stirrer cup", function () {

        var stirrer = require("../lib/stirrer");

        describe("use stirrer simple", function () {

            var foo = require("./foo");
            var Bar = require("./sub/bar");
            var func = require("./sub/func");
            var fs = require("fs");
            var path = require("path");

            var cup = stirrer.grind({
                stubs: {
                    "barGetStats": [Bar.prototype, "getStats"]
                },
                spies: {
                    "pathJoin": [path, "join"]
                },
                mocks: {
                    "fs": fs
                },
                before: function (cup) {
                    cup.stubs.barGetStats.returns("stats!");
                    cup.mocks.fs.expects("readdir").once().callsArgWithAsync(1, "oh no!");
                },
                after: function () {
                    expect(cup.stubs.barGetStats.calledOnce).to.be.true();
                    expect(cup.spies.pathJoin.calledOnce).to.be.true();
                }
            });

            cup.pour("stubs setup should work as defined", function (done) {

                expect(Bar.prototype.getStats).to.equal(cup.stubs.barGetStats);

                var stats = foo.barStats();
                expect(stats).to.equal("stats!");

                var res = foo.wat("a", "b");
                expect(res).to.equal("a/b");

                foo.fs(function (err) {
                    expect(err).to.equal("oh no!");
                    done();
                });
            });


            describe("use stirrer cup with pars", function () {

            });

            describe("use stirrer cup with test function", function () {

            });
        });

        describe("use stirrer cup with pars transform", function () {

        });

        describe("use stirrer cup with before/after each", function () {

        });

        describe("use stirrer cup with mocker", function () {

        });

        describe("use stirrer cup with immediate setup", function () {


        });

        describe("use stirrer dontRestir flag", function () {

        });

        describe("use stirrer method aliases", function () {

        });
    });
});