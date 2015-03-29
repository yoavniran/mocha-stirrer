/* jshint strict: false */
var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    stirrer = require("../lib/stirrer"),
    path = require("path"),
    fs = require("fs");

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

        delayedCup.pour("fakes should not be initialized", function (done) {

            var result = this.spies.pathSpy("a", "b");
            expect(result).to.equal("a/b");

            this.stubs.readdirSyncStub("bla", function (err) {
                expect(err).to.equal(delayedCup.pars.readErr);
                done();
            });
        });
    });

    describe("test setupImmediate overrides delay", function () {

        before(function(){
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

});