var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("stirrer basicstests", function () {
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

    describe("test context and pars", function () {

        var stirrer = require("../lib/stirrer");

        var cup = stirrer.grind({

            before: function (cupInst) {
                expect(cupInst).to.equal(cup);
            },
            after: function (cupInst) {
                expect(cupInst).to.equal(cup);
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

    describe("test call order", function () {

        var stirrer = require("../lib/stirrer");

        describe("test correct order of calls - simple", function () {

            var counter = 0;

            function advanceCounter() {
                counter += 1;
                return counter;
            }

            var cup = stirrer.grind({

                before: function (cupInst) {
                    expect(cupInst).to.equal(cup);

                    expect(advanceCounter()).to.equal(1);
                },
                after: function (cupInst) {
                    expect(cupInst).to.equal(cup);
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

                before: function (cupInst) {
                    expect(cupInst).to.equal(cup);

                    expect(advanceCounter()).to.equal(1);
                },
                after: function (cupInst) {
                    expect(cupInst).to.equal(cup);
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
                        expect(advanceCounter()).to.equal(5);
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
                        expect(advanceCounter()).to.equal(3);
                        next();
                    },
                    afters: function (next) {
                        expect(advanceCounter()).to.equal(6);
                        next();
                    }
                });

                cup.pour("test #2", function (done) {
                    expect(advanceCounter()).to.equal(4);
                    done();
                });
            });

            after("check on counter", function () {
               expect(counter).to.equal(6);
            });
        });

        describe("test correct order with skip", function () {

        });

        describe("test correct order with only", function () {

        });

        describe("test correct order with wrap", function () {

        });
    });
});
