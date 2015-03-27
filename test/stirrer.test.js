var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai");
//sinon = require("sinon");

chai.use(dirtyChai);
chai.use(sinonChai);

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

    describe("test grind with errors", function () {

        var stirrer = require("../lib/stirrer");

        it("should fail on string stub that isn't stirrer.EMPTY", function () {

            expect(function () {
                var cup = stirrer.grind({
                    name: "TEST #1",
                    setupImmediate: true,      //set to true so stubs are setup immediately and not async to get the error
                    stubs: {
                        "test": "lll"
                    }
                });
            }).to.throw();
        });

        it("should fail on string spy that isn't stirrer.EMPTY", function () {

            expect(function () {
                var cup = stirrer.grind({
                    name: "TEST #2",
                    setupImmediate: true,      //set to true so stubs are setup immediately and not async to get the error
                    spies: {
                        "test": "lll"
                    }
                });
            }).to.throw();
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
                name: "TEST #3",
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

            cup.pour("fakes setup should work as defined", function (done) {

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
        });

        describe("use stirrer cup with pars and transform", function () {

            var foo = require("./foo");
            var Bar = require("./sub/bar");
            var func = require("./sub/func");
            var fs = require("fs");
            var path = require("path");

            var cup = stirrer.grind({
                name: "TEST #4",
                pars: {
                    getStatsResult: "stats!",
                    readdirData: "data"
                },
                transform: function (pars) {

                    if (pars.errorOnReadDir) {
                        pars.readdirErr = "oh no";
                    }
                    else {
                        pars.readdirErr = null;
                    }

                    return pars;
                },
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
                    cup.stubs.barGetStats.returns(cup.pars.getStatsResult);
                    cup.mocks.fs.expects("readdir").twice().callsArgWithAsync(1, cup.pars.readdirErr, cup.pars.readdirData);
                },
                after: function () {
                    expect(cup.stubs.barGetStats.calledTwice).to.be.true();
                    expect(cup.spies.pathJoin.calledTwice).to.be.true();
                }
            });

            cup.pour("fakes setup should work as defined", function (done) {

                var stats = foo.barStats();
                expect(stats).to.equal(cup.pars.getStatsResult);

                var res = foo.wat("a", "b");
                expect(res).to.equal("a/b");

                foo.fs(function (err) {
                    expect(err).to.equal(cup.pars.readdirErr);
                    done();
                });
            });

            cup.stir({
                pars: {
                    errorOnReadDir: true
                }
            });

            cup.pour("fakes setup should work - transform changed due to different par", function (done) {

                expect(Bar.prototype.getStats).to.equal(cup.stubs.barGetStats);

                var stats = foo.barStats();
                expect(stats).to.equal(cup.pars.getStatsResult);

                var res = foo.wat("a", "b");
                expect(res).to.equal("a/b");

                foo.fs(function (err, data) {
                    expect(err).to.be.null();
                    expect(data).to.equal(cup.pars.readdirData);
                    done();
                });
            });
        });

        describe("use stirrer cup with befores and afters config", function () {

            var foo = require("./foo");
            var Bar = require("./sub/bar");
            var func = require("./sub/func");
            var fs = require("fs");
            var path = require("path");

            var cup = stirrer.grind({
                name: "TEST #5",
                pars: {
                    getStatsResult: "stats!"
                },
                stubs: {
                    "barGetStats": [Bar.prototype, "getStats"]
                }
            });

            //befores and afters can be added (stirred) at a later point

            cup.stir({
                befores: function (next) {
                    this.stubs.barGetStats.returns(this.pars.getStatsResult);
                    next(); //MUST CALL NEXT HERE - otherwise we'll get a timeout
                },
                afters: function (next) {
                    expect(cup.stubs.barGetStats.calledOnce).to.be.true();
                    next(); //MUST CALL NEXT HERE - otherwise we'll get a timeout
                }
            });

            describe("adding befores/afters after the cup was created", function () {

                cup.pour("fakes setup should work as defined", function (){
                    expect(foo.barStats()).to.equal(cup.pars.getStatsResult);
                });
            });

        });

        describe("use stirrer cup with test function", function () {


        });

        describe("use stirrer cup with before/after each", function () {

        });

        describe("use stirrer cup with requires (mocker)", function () {


        });

        describe("use stirrer cup with immediate setup", function () {


        });

        describe("use stirrer dontRestir flag", function () {

        });

        describe("use stirrer method aliases", function () {


        });
    });
})
;