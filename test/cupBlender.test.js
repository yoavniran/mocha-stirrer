var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    cupBlender = require("../lib/cupBlender"),
    utils = require("../lib/utils"),
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

    describe("test mock require using requires in stir", function () {

        var cup = cupBlender.blend(testUtils.getMockBlendConfig());

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

    describe("test restir for each", function () {

        function getRestirForEachConf(name) {

            var conf = testUtils.getMockBlendConfig();

            utils.merge({
                name: name,
                restirForEach: true,
                stubs: {
                    myStub: require("../lib").EMPTY
                }
            }, conf);

            conf.globals.mochaHooks.after = global.after;//use the real after to rule out that restir happens on faked after

            return conf;
        }

        var conf = getRestirForEachConf("cupBlender-restir-each-test");
        var cup = cupBlender.blend(conf);
        var started = cup.start();

        it("should restir after each", function () {
            expect(started).to.be.true();
            expect(cup.stubs.myStub).to.not.exist();
        });

        var conf2 = getRestirForEachConf("cupBlender-restir-each-test2");
        conf2.dontRestir = true;
        var cup2 = cupBlender.blend(conf2);
        var started2 = cup2.start();

        it("should not restir after each because of dontRestir", function () {
            expect(started2).to.be.true();
            expect(cup2.stubs.myStub).to.exist();
        });
    });

    describe("test invalid stub types", function () {

        describe("test invalid stub type - function", function () {

            var conf = testUtils.getMockBlendConfig();
            conf.stubs = {
                failStub: function () {
                }
            };

            conf.globals.mochaHooks.before = testUtils.getFunctionRunnerExpectsError(TypeError);

            it("should fail with type error because stub conf is function", function () {
                var cup = cupBlender.blend(conf);
                cup.start();
            });
        });

        describe("test invalid stub type - unknown string", function(){
            var conf = testUtils.getMockBlendConfig();
            conf.stubs = {
                failStub: "aaa"
            };

            conf.globals.mochaHooks.before = testUtils.getFunctionRunnerExpectsError();

            it("should fail with type error because stub conf is function", function () {
                var cup = cupBlender.blend(conf);
                cup.start();
            });

        });
    });
})
;

