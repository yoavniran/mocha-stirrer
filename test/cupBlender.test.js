var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    cupBlender = require("../lib/cupBlender"),
    testUtils = require("./testUtils");

describe("cupBlender tests", function () {
    "use strict";

    chai.use(dirtyChai);
    chai.use(sinonChai);

    describe("test blend", function () {
        var conf = testUtils.getMockBlendConfig();
        conf.name = "my cup";
        var cup = cupBlender.blend(conf);

        expect(cup).to.exist();
        expect(cup.name).to.equal("my cup");
    });

    describe("test mock require and stubs enriching", function () {

        var cup = cupBlender.blend(testUtils.getMockBlendConfig());

        it("should fake require module and enrich cup with stubs", function () {

            var fakeFoo = cupBlender.fakeRequire(module, cup, "./testObjects/foo");

            expect(fakeFoo).to.exist();
            expect(fakeFoo).to.respondTo("bar");

            expect(cup.stubs).to.exist();
            expect(cup.stubs).to.include.keys(["path", "fs"]);

            expect(cup.getStub("sub/func")).to.exist();
            expect(cup.getStub("testObjects/sub/func")).to.exist();
            expect(cup.getStub("sub/func")).to.equal(cup.getStub("testObjects/sub/func"));

            expect(cup.getStub("sub/bar")).to.exist();
        });

        after(function () {
            cup.restir();
        });
    });

    describe("test mock require using requires in stir", function(){

        var cup= cupBlender.blend(testUtils.getMockBlendConfig());

        it("should fake require module and enrich cup with stubs by stirring in requires ", function () {

            cup.stir({
               requires: ["./testObjects/foo"]
            });

            var fakeFoo = cup.required["./testObjects/foo"];

            expect(fakeFoo).to.exist();
            expect(fakeFoo).to.respondTo("bar");

            expect(cup.stubs).to.exist();
            expect(cup.stubs).to.include.keys(["path", "fs"]);

            expect(cup.getStub("sub/func")).to.exist();
            expect(cup.getStub("testObjects/sub/func")).to.exist();
            expect(cup.getStub("sub/func")).to.equal(cup.getStub("testObjects/sub/func"));

            expect(cup.getStub("sub/bar")).to.exist();
        });

        after(function () {
            cup.restir();
        });

    });
});

