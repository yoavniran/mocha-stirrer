var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("stirrer basics tests", function () {
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

    describe("test no pars grind and pour", function () {

        var stirrer = require("../lib/stirrer");
        var cup = stirrer.grind();

        var counter = 0;

        cup.pour("pour test should work even with grind run without parameters", function () {
            counter += 1;
        });

        after(function () {
            expect(counter).to.equal(1);
        });
    });

    describe("test unknown spy or stub string (not empty)", function () {

        var stirrer = require("../lib/stirrer");
        var counter = 0;
        var cup, cup2;
        var orgBefore = global.before;

        before(function () {
            global.before = function (name, fn) {

                if (typeof(name) === "function") {
                    fn = name;
                }

                try {
                    fn();
                }
                catch (ex) {
                    expect(ex.message).to.contain("stirrer - unknown");
                    counter += 1;
                }
            };    //overriding the mocha before just for these tests

            cup.start();
            cup2.start();
        });

        describe("test unknown spy string (not empty)", function () {

            cup = stirrer.grind({
                delay: true,
                spies: {
                    "failSpy": "something"
                }
            });

            cup.pour("unknown spy string should fail", function () {
            });
        });

        describe("test unknown stub string (not empty)", function () {
            cup2 = stirrer.grind({
                delay: true,
                stubs: {
                    "failStub": "something"
                }
            });

            cup2.pour("unknown stub string should fail", function () {
            });
        });

        after(function () {
            global.before = orgBefore;
            expect(counter).to.equal(2); //should have gotten two errors on unknown spy/stub types
        });
    });

    describe("test context and pars", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({

            before: function () {
                expect(this).to.equal(cup);
            },
            after: function () {
                expect(this).to.equal(cup);
            }
        });

        cup.pour("test that the context of the test functions is correct", function () {
            expect(this).to.equal(cup);
        });

        cup.pour("test the context and the done callback is available", function (done) {

            expect(this).to.equal(cup);
            expect(done).to.exist();

            done();
        });
    });

    describe("test pars and transform", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({
            pars: {
                myPar: 1
            },
            transform: function (pars) {
                pars.myPar += 1;
                return pars;
            }
        });

        cup.pour("test that transform works", function () {
            expect(this.pars.myPar).to.equal(2);
        });
    });

    describe("test pars and transform in multiple tests", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({
            pars: {
                myPar: 1
            },
            transform: function (pars) {
                pars.myPar += 1;
                return pars;
            }
        });

        cup.pour("test that transform works", function () {
            expect(this.pars.myPar).to.equal(2);
        });

        cup.pour("test that transform works again", function () {
            expect(this.pars.myPar).to.equal(2);
        });
    });

    describe("test pars and transform in multiple tests with transformForEach set to true", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({
            pars: {
                myPar: 1
            },
            transformForEach: true,
            transform: function (pars) {
                pars.myPar += 1;
                return pars;
            }
        });

        cup.pour("test that transform works", function () {
            expect(this.pars.myPar).to.equal(2);
        });

        cup.pour("test that transform works again", function () {
            expect(this.pars.myPar).to.equal(3);
        });
    });

    describe("test empty spy and stub", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({

            stubs: {
                "emptyStub": stirrer.EMPTY
            },
            spies: {
                "emptySpy": stirrer.EMPTY
            },
            before: function () {
                cup.stubs.emptyStub.returns("foo");
            }
        });

        cup.pour("check empty fakes", function () {

            var stubRes = this.stubs.emptyStub();

            expect(stubRes).to.equal("foo");
            expect(this.stubs.emptyStub.calledOnce).to.be.true();

            this.spies.emptySpy();
            expect(this.spies.emptySpy.calledOnce).to.be.true();
        });

    });

    describe("test transform not returning pars", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({
            pars: {
                "testPar": 1
            },
            transformForEach: true,
            transform: function (pars) {
            }
        });

        cup.pour("oh oh pars should be undefined", function () {
            expect(this.pars).to.be.undefined();
        });

        cup.pour("oh oh pars should still be undefined", function () {
            expect(this.pars).to.be.undefined();
        });
    });

    describe("test dontRestir and then manual restir", function () {

        var testDontRestirCup;

        describe("test context", function () {

            var stirrer = require("../lib/stirrer");
            var path = require("path");

            testDontRestirCup = stirrer.grind({
                name: "dont stir test",
                dontRestir: true,
                spies: {
                    "pathJoin": [path, "join"]
                },
                after: function () {
                    expect(testDontRestirCup.spies.pathJoin).to.have.been.calledOnce();
                }
            });

            testDontRestirCup.pour("run simple test", function () {
                expect(this.spies.pathJoin("a", "b")).to.equal("a/b");
            });
        });

        after("fake should still be present", function () {
            expect(testDontRestirCup.spies.pathJoin).to.exist();
            testDontRestirCup.restir();
            expect(testDontRestirCup.spies.pathJoin).to.not.exist();
        });
    });

    describe("test dontRestir and then manual restir with stirrer method", function () {

        var testDontRestirCup;
        var stirrer = require("../lib/stirrer");

        describe("test context", function () {

            var path = require("path");

            testDontRestirCup = stirrer.grind({
                name: "dont stir test",
                dontRestir: true,
                spies: {
                    "pathJoin": [path, "join"]
                },
                after: function () {
                    expect(testDontRestirCup.spies.pathJoin).to.have.been.calledOnce();
                }
            });

            testDontRestirCup.pour("run simple test", function () {
                expect(this.spies.pathJoin("a", "b")).to.equal("a/b");
            });
        });

        after("fake should still be present", function () {
            expect(testDontRestirCup.spies.pathJoin).to.exist();
            stirrer.restir(testDontRestirCup);
            expect(testDontRestirCup.spies.pathJoin).to.not.exist();
        });
    });

    describe("test call order", function () {

        var stirrer = require("../lib/stirrer");

        describe("test correct order of calls - simple", function () {

            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            var cup = stirrer.grind({

                before: function () {
                    expect(this).to.equal(cup);

                    expect(advanceCounter()).to.equal(1);
                },
                after: function () {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(3);
                }
            });

            cup.pour("this is my test", function () {
                expect(this).to.equal(cup);
                expect(advanceCounter()).to.equal(2);
            });
        });

        describe("test correct order of calls - with stir", function () {

            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            var cup = stirrer.grind({

                before: function () {
                    expect(this).to.equal(cup);

                    expect(advanceCounter()).to.equal(1);
                },
                after: function () {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(3);
                }
            });

            cup.stir({});

            cup.pour("this is my test", function () {

                expect(this).to.equal(cup);
                expect(advanceCounter()).to.equal(2);
            });
        });

        describe("test correct order of calls - with Each", function () {


        });

        describe("test correct order of calls - with async pour", function () {

            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            describe("first test context", function () {

                var cup = stirrer.grind({
                    name: "order test with async pour- TEST #1",
                    befores: function (next) {
                        expect(advanceCounter()).to.equal(1);
                        next();
                    },
                    afters: function (next) {
                        expect(advanceCounter()).to.equal(3);
                        next();
                    }
                });

                cup.pour("test #1", function (done) {
                    expect(advanceCounter()).to.equal(2);
                    done();
                });
            });

            describe("second test context", function () {

                var cup = stirrer.grind({
                    name: "order test with async pour- TEST #2",
                    befores: function (next) {
                        expect(advanceCounter()).to.equal(4);
                        next();
                    },
                    afters: function (next) {
                        expect(advanceCounter()).to.equal(6);
                        next();
                    }
                });

                cup.pour("test #2", function () {
                    expect(advanceCounter()).to.equal(5);
                });
            });

            after("check on counter", function () {
                expect(counter).to.equal(6);
            });
        });

        describe("test correct order of calls - with async hooks", function () {

            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            var cup = stirrer.grind({

                before: function (done) {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(1);
                    done();
                },
                beforeEach: function (done) {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(2);
                    done();
                },
                after: function (done) {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(5);
                    done();
                },
                afterEach: function (done) {
                    expect(this).to.equal(cup);
                    expect(advanceCounter()).to.equal(4);
                    done();
                }
            });

            cup.pour("this is my test", function (done) {
                expect(advanceCounter()).to.equal(3);

                done();
            });

            after("check that final counter is correct", function () {
                expect(counter).to.equal(5);
            });
        });

        describe("test correct order with skip", function () {

            var counter = 0;

            var cup = stirrer.grind({
                after: function () {
                    expect(counter).to.equal(1);

                    counter += 1;
                }
            });

            cup.pour.skip("skipped test", function () {
                counter += 1;
            });

            cup.pour("run test", function () {
                counter += 1;
            });

            after("check up on cup after", function () {
                expect(counter).to.equal(2);
            });
        });

        describe("test correct order with wrap", function () {

            var counter = 0;

            var cup = stirrer.grind({
                beforeEach: function () {
                    counter += 1;
                },
                afterEach: function () {
                    counter += 1;
                },
                after: function () {
                    expect(counter).to.equal(2);
                    counter += 1;
                }
            });

            cup.pour.wrap("this isnt a test, just a wrapper", function () {

            });

            cup.pour.wrap("this is a wrapper too but with a test inside", function () {

                it("this is a test inside a wrapper", function () {

                });
            });

            after("checking up that all hooks were called", function () {
                expect(counter).to.equal(3);
            });
        });

        describe("test correct order with pending", function () {

            var counter = 0;

            var cup = stirrer.grind({
                beforeEach: function () {
                    counter += 1;
                },
                afterEach: function () {
                    counter += 1;
                },
                after: function () {
                    counter += 1;
                }
            });

            cup.pour("this is a pending test using pour");

            after("checking up that all hooks were called", function () {
                expect(counter).to.equal(1);
            });

        });

        describe("test correct order with only", function () {

            var counter = 0;

            var cup = stirrer.grind({
                beforeEach: function () {
                    counter += 1;
                },
                afterEach: function () {
                    counter += 1;
                },
                after: function () {
                    counter += 1;
                }
            });

            it("pour.only should be reached", function(realDone){
                cup._it = {
                    only: function (name, fn) {
                        function done(){
                            realDone();
                        }

                        console.log("reached the only fake");
                        fn(done);
                    }
                };

                cup.pour.only("testing only with overridden it.only should work", function () {
                    counter += 1;
                });
            });

            after("returning it.only", function () {
                //global.it.only = itOnlyOrg;
                expect(counter).to.equal(4);
            });
        });

        describe("test correct order with stirring in befores in different context", function () {
            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            var cup = stirrer.grind();

            describe("first context", function () {

                cup.stir({
                    pars: {
                        "firstPar": 1
                    },
                    befores: function (next) {
                        advanceCounter();
                        next();
                    },
                    afters: [
                        function (next) {
                            advanceCounter();
                            next();
                        },
                        function (next) {
                            advanceCounter();
                            next();
                        }
                    ]
                });

                cup.pour("first test", function () {
                    expect(advanceCounter()).to.equal(2);
                    expect(this.pars.firstPar).to.equal(1);
                    expect(this.pars.secondPar).to.be.undefined();
                });
            });

            describe("second context", function () {

                cup.stir({ //can stir again and add to any existing pars/befores/afters
                    pars: {
                        "secondPar": 2
                    },
                    befores: [function (next) {
                        advanceCounter();
                        expect(this.pars.firstPar).to.equal(1);
                        expect(this.pars.secondPar).to.equal(2);
                        next();
                    },
                        function (next) {
                            advanceCounter();
                            expect(this.pars.firstPar).to.equal(1);
                            expect(this.pars.secondPar).to.equal(2);
                            next();
                        }]
                });

                cup.pour("second test", function () {
                    expect(advanceCounter()).to.equal(8);
                });
            });

            after(function () {
                expect(counter).to.equal(10);
            });
        });
    });
});