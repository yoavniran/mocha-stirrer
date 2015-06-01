var chai = require("chai"),
    expect = chai.expect,
    sinon = require("sinon"),
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("stirrer tests", function () {
    "use strict";

    describe("test grind with errors", function () {

        var stirrer = require("../lib/index");

        it("should fail on string stub that isn't stirrer.EMPTY", function () {

            expect(function () {
                stirrer.grind({
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
                stirrer.grind({
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

        var stirrer = require("../lib/index");

        describe("use stirrer simple", function () {

            var foo = require("./testObjects/foo");
            var Bar = require("./testObjects/sub/bar");
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
                before: function () {
                    cup.stubs.barGetStats.returns("stats!");
                    cup.mocks.fs.expects("readdir").once().callsArgWithAsync(1, "oh no!");
                },
                after: function () {
                    expect(this.stubs.barGetStats.calledOnce).to.be.true();
                    expect(this.spies.pathJoin.calledOnce).to.be.true();
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

            var foo = require("./testObjects/foo");
            var Bar = require("./testObjects/sub/bar");
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
                before: function () {
                    this.stubs.barGetStats.returns(cup.pars.getStatsResult);
                },
                beforeEach: function () {
                    this.mocks.fs.expects("readdir").once().callsArgWithAsync(1, cup.pars.readdirErr, cup.pars.readdirData);
                },
                after: function () {
                    expect(this.stubs.barGetStats.calledTwice).to.be.true();
                    expect(this.spies.pathJoin.calledTwice).to.be.true();
                },
                afterEach: function () {
                    expect(this).to.equal(cup);
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

            var foo = require("./testObjects/foo");
            var Bar = require("./testObjects/sub/bar");

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
                cup.pour("fakes setup should work as defined", function () {
                    expect(foo.barStats()).to.equal(cup.pars.getStatsResult);
                });
            });
        });

        describe("use stirrer cup with test function", function () {

            var stirrer = require("../lib/index");
            var foo = require("./testObjects/foo");
            var Bar = require("./testObjects/sub/bar");

            var counter = 0;

            var cup = stirrer.grind({
                    stubs: {
                        "barGetStats": [Bar.prototype, "getStats"]
                    },
                    before: function () {
                        cup.stubs.barGetStats.returns("stats!");
                    },
                    after: function () {
                        expect(this.stubs.barGetStats.calledOnce).to.be.true();
                    }
                },
                function (done) {

                    expect(Bar.prototype.getStats).to.equal(cup.stubs.barGetStats);

                    var stats = foo.barStats();
                    expect(stats).to.equal("stats!");

                    done();
                    counter += 1;
                });

            after("checking up test was executed", function () {
                expect(counter).to.equal(1);
            });
        });

        describe("use stirrer cup with stubbed object and spied object", function () {

            var foo = require("./testObjects/foo");
            var Bar = require("./testObjects/sub/bar");
            var path = require("path");

            var cup = stirrer.grind({
                name: "TEST #6",
                stubs: {
                    "bar": Bar.prototype
                },
                spies: {
                    "pathJoin": path.join
                },
                before: function () {
                    cup.stubs.bar.getStats.returns("stats!");
                },
                after: function () {
                    expect(cup.stubs.bar.getStats).to.have.been.calledOnce();
                    expect(cup.spies.pathJoin).to.have.been.calledOnce();
                }
            });

            cup.pour("test faked objects", function () {

                var stats = foo.barStats();
                expect(stats).to.equal("stats!");

                var joined = this.spies.pathJoin("1", "2");
                expect(joined).to.equal("1/2");
            });
        });

        describe("use stirrer method aliases", function () {

            describe("use test alias for pour", function () {

                var counter = 0;

                var cup = stirrer.grind({
                    after: function () {
                        expect(counter).to.equal(2);
                    }
                });

                cup.test("using test alias should work the same as pour", function () {
                    counter += 1;
                });

                cup.test.wrap("using test alias with wrap should work the same", function () {
                    it("internal test inside test alias with wrap", function () {
                        counter += 1;
                    });
                });
            });

            describe("use create alias for grind", function () {

                var path = require("path");

                var cup = stirrer.create({
                    spies: {
                        "pathJoin": path.join
                    },
                    after: function () {
                        expect(cup.spies.pathJoin).to.have.been.calledOnce();
                    }
                });

                cup.pour("test create alias", function () {
                    var joined = this.spies.pathJoin("1", "2");
                    expect(joined).to.equal("1/2");
                });
            });

            describe("use reset alias for restir on cup", function () {

                var path = require("path");

                var cup = stirrer.create({
                    spies: {
                        "pathJoin": path.join
                    },
                    after: function () {
                        expect(cup.spies.pathJoin).to.have.been.calledOnce();

                        cup.reset();
                        expect(cup.spies.pathJoin).to.be.undefined();
                    }
                });

                cup.pour("test create alias", function () {
                    var joined = this.spies.pathJoin("1", "2");
                    expect(joined).to.equal("1/2");
                });
            });

            describe("use reset alias for restir on stirrer", function () {

                var path = require("path");

                var cup = stirrer.create({
                    spies: {
                        "pathJoin": path.join
                    },
                    after: function () {
                        expect(cup.spies.pathJoin).to.have.been.calledOnce();

                        stirrer.reset(cup);
                        expect(cup.spies.pathJoin).to.be.undefined();
                    }
                });

                cup.pour("test create alias", function () {
                    var joined = this.spies.pathJoin("1", "2");
                    expect(joined).to.equal("1/2");
                });
            });
        });

        describe("use stirrer with stir'n pour™ ", function () {

            var counter = sinon.stub();

            var testBfr1 = function (next) {
                counter();  //2 //5
                next();
            };

            var testBfr2 = function (next) {
                expect(counter.callCount).to.equal(5);
                counter(); //6
                next();
            };

            var cup = stirrer.grind({
                name: "stir'n pour™ cup",
                transform: function (pars) {

                    if (pars.testPar) {
                        pars.testPar += 1;
                    }

                    return pars;
                },
                pars: {
                    "foo": "bar"
                },
                before: function () {
                    expect(counter).to.not.have.been.called();
                    counter(); //1
                },
                after: function () {
                    counter();   //10
                },
                befores: [
                    testBfr1
                ],
                afters: [
                    function (next) {
                        counter(); //4  //8
                        next();
                    }
                ]
            });

            cup.pour("first test without stir'n pour™ ", function () {
                expect(counter.callCount).to.equal(2);
                counter(); //3

                expect(this.pars.foo).to.equal("bar");
            });

            cup.pour("second test with stir'n pour™ ", function () {

                expect(this._befores[0]).to.equal(testBfr1);
                expect(this._befores[1]).to.equal(testBfr2);

                expect(counter.callCount).to.equal(6);
                counter();  //7

                expect(this.pars.foo).to.equal("bar");
                expect(this.pars.testPar).to.equal(124);
            }, {
                pars: {
                    testPar: 123
                },
                befores: testBfr2,
                afters: function (next) {
                    expect(counter.callCount).to.equal(8);
                    counter(); //9
                    next();
                }
            });

            after(function () {
                expect(counter.callCount).to.equal(10);
            });
        });

        describe("use stirrer with restirForEach", function () {

            var cup = stirrer.grind({
                name: "restirForEach cup",
                restirForEach: true,
                requires: ["./testObjects/foo"],
                stubs: {
                    myStub: stirrer.EMPTY
                },

                beforeEach: function () {
                    this.stubs.myStub.returns("hello");
                    this.getStub("sub/func").returns("bla");
                },
                afterEach: function () {
                    expect(this.stubs.myStub).to.have.been.called();
                },
                after: function () {
                    expect(this.stubs.myStub).to.not.exist();
                }
            });

            cup.pour("test #1 with restirForEach", function () {
                var result = this.stubs.myStub();
                expect(result).to.equal("hello");

                expect(this.required["./testObjects/foo"]).to.exist();

                var funcStub = this.getStub("sub/func");
                funcStub.returns("bla");

                expect(funcStub()).to.equal("bla");
            });

            cup.pour("test #2 with restirForEach", function () {
                var result = this.stubs.myStub();
                expect(result).to.equal("hello");

                expect(this.required["./testObjects/foo"]).to.exist();

                var funcStub = this.getStub("sub/func");
                funcStub.returns("bla");

                expect(funcStub()).to.equal("bla");
            });
        });
    });
});