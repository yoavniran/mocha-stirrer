/* jshint strict: false */
var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    stirrer = require("../lib/index"),
    path = require("path"),
    fs = require("fs"),
    testUtils = require("./testUtils");

chai.use(dirtyChai);
chai.use(sinonChai);

var delayedCup = stirrer.grind({
    name: "delayed cup test",
    delay: true,
    spies: {
        "pathSpy": [path, "join"]
    },
    stubs: {
        "readdirSyncStub": [fs, "readdir"]
    },
    pars: {
        readErr: "oh no!"
    },
    before: function () {
        this.stubs.readdirSyncStub.callsArgWithAsync(1, this.pars.readErr);
    },
    after: function () {
        expect(this.spies.pathSpy).to.have.been.called();
        expect(this.stubs.readdirSyncStub).to.have.been.called();
    }
});

describe("stirrer delay tests", function () {
    "use strict";

    describe("test delay caused cup fakes to not be initialized", function () {

        it("fakes should not be initialized", function () {
            expect(delayedCup.stubs).to.be.undefined();
            expect(delayedCup.spies).to.be.undefined();
        });
    });

    describe("test start causes cup fakes to be initialized on demand", function () {

        delayedCup.start();

        delayedCup.pour("fakes should be initialized", function (done) {

            var result = this.spies.pathSpy("a", "b");
            expect(result).to.equal("a/b");

            this.stubs.readdirSyncStub("bla", function (err) {
                expect(err).to.equal(delayedCup.pars.readErr);
                done();
            });
        });
    });

    describe("test setupImmediate overrides delay", function () {

        before(function () {
            stirrer.grind({
                    delay: true,
                    setupImmediate: true,
                    spies: {
                        "pathSpy": [path, "join"]
                    },
                    stubs: {
                        "readdirSyncStub": [fs, "readdir"]
                    },
                    pars: {
                        readErr: "oh no!"
                    },
                    before: function () {
                        this.stubs.readdirSyncStub.callsArgWithAsync(1, this.pars.readErr);
                    },
                    after: function () {
                        expect(this.spies.pathSpy).to.have.been.called();
                        expect(this.stubs.readdirSyncStub).to.have.been.called();
                    }
                },
                function (done) {

                    var result = this.spies.pathSpy("a", "b");
                    expect(result).to.equal("a/b");

                    this.stubs.readdirSyncStub("bla", function (err) {
                        expect(err).to.equal(delayedCup.pars.readErr);
                        done();
                    });
                });
        });

    });

    describe("test delay without start should fail", function () {

        var counter = 0;

        var cup = stirrer.grind({
            name: "never started cup",
            delay: true
        });

        it("expect an error when pour test is executed", function (realDone) {

            cup._mocha = {it : testUtils.getFunctionRunner(function (err) {  //overriding the mocha it  function with a custom one for testing purposes

                expect(err).to.be.an.instanceof(Error);
                counter = 1;
                realDone();
            })};


            cup.pour("should fail because cup not started", function () {
            });
        });

        after(function () {
            expect(counter).to.equal(1);//make sure test was executed as expected
        });
    });
});