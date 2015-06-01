var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    sinon = require("sinon"),
    Mocker = require("../lib/index").RequireMocker;

describe("testing auto mocking for require with standalone mocker", function () {
    "use strict";

    chai.use(dirtyChai); //use lint-friendly chai assertions!
    chai.use(sinonChai);

    describe("test basics", function () {

        after(function () {
            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.STUB);
            Mocker.clearGlobalDontMock();
        });

        it("globals dont stub list should start empty", function () {
            expect(Mocker.getGlobalDontMock()).to.be.empty();
        });

        it("should successfully add and remove to global dont stub list", function () {
            Mocker.addGlobalDontMock("aaa");
            expect(Mocker.getGlobalDontMock()).to.include("aaa");

            Mocker.removeGlobalDontMock("aaa");
            expect(Mocker.getGlobalDontMock()).to.be.empty();
        });

        it("should successfully clear global dont stub list", function () {

            Mocker.addGlobalDontMock("aaa");
            Mocker.addGlobalDontMock("bbb");

            Mocker.clearGlobalDontMock();
            expect(Mocker.getGlobalDontMock()).to.be.empty();
        });

        it("should successfully add and remove to global dont stub list", function () {
            Mocker.addGlobalDontMock(["aaa", "bbb", "ccc"]);
            expect(Mocker.getGlobalDontMock()).to.include("aaa");
            expect(Mocker.getGlobalDontMock()).to.include("bbb");
            expect(Mocker.getGlobalDontMock()).to.include("ccc");

            Mocker.clearGlobalDontMock();
        });

        it("should use STUB type by default", function () {
            expect(Mocker.getGlobalMockType()).to.equal(Mocker.MOCK_TYPES.STUB);
        });

        it("should be possible to change the default mock type", function () {
            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.SPY);
            expect(Mocker.getGlobalMockType()).to.equal(Mocker.MOCK_TYPES.SPY);
            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.STUB);
            expect(Mocker.getGlobalMockType()).to.equal(Mocker.MOCK_TYPES.STUB);
        });

        it("should throw on require without parent", function () {
            var mocker = new Mocker(sinon);  //pass sinon to the mocker
            expect(function () {
                mocker.require(null, "./foo");
            }).to.throw();
        });
    });

    it("requiring the module normally should work normally", function () {

        var foo = require("./testObjects/foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
        expect(foo.useSub()).to.equal("hello world");
        expect(foo.useSubDep("world")).to.equal("hello world");
        expect(foo.useFuncDep()).to.equal("foo");
        expect(foo.useInstance()).to.equal("value");
        expect(foo.useConsts()).to.equal("i love pizza");
        expect(foo.useConstsObj()).to.equal("im 1");
        expect(foo.useStatic()).to.equal("you are: James");
    });

    describe("testing mock require - standalone", function () {    //wrapping in describe for the restir to

        var mocker = new Mocker(sinon);  //pass sinon to the mocker

        it("should mock require successfully - standalone", function () {

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"]
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.not.exist();
            expect(foo.useFuncDep()).to.not.exist();
            expect(foo.useInstance()).to.not.exist();
            expect(foo.useStatic()).to.not.exist();
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useConstsObj()).to.equal("im 1");

            var Bar = require("./testObjects/sub/bar");
            expect(Bar.prototype.useDep).to.have.been.calledWith("world");

            //var instance = require("./testObjects/sub/instance");
            //expect(instance.getValue).to.have.been.calledWith("test");

            mocker.restore();   //make sure to clean up by restoring the stubs
        });

        it("should use the module name for external modules", function () {

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"]
            });

            var stubs = mocker.getStubs();
            expect(stubs["grunt-blanket"]).to.exist();
            expect(Object.keys(stubs)).to.have.length(6);

            mocker.restore();   //make sure to clean up by restoring the stubs
        });

        it("should log to console about deprecated dontStub option", function () {

            var utils = require("../lib/utils");
            sinon.spy(utils, "deprecate");

            var foo = mocker.require("./testObjects/foo", {
                dontStub: ["fs"]
            });

            expect(utils.deprecate).to.have.been.calledWith("'dontStub' option", "RequireMocker");

            utils.deprecate.restore();
            mocker.restore();   //make sure to clean up by restoring the stubs
        });
    });

    describe("test global dont mock", function () {

        var mocker = new Mocker(sinon);  //pass sinon to the mocker

        afterEach(function () {
            Mocker.clearGlobalDontMock();
        });

        it("shouldnt mock modules in the global dont mock list", function (done) {

            Mocker.addGlobalDontMock("fs");
            Mocker.addGlobalDontMock("path");

            var foo = mocker.require("./testObjects/foo");

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b");
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.not.exist();

            foo.fs(function (err, data) {

                expect(data).to.exist();

                mocker.restore();
                done();
            });
        });

        it("shouldnt mock modules in the global dont mock list using array of names/paths", function (done) {

            Mocker.addGlobalDontMock(["fs", "path"]);

            var foo = mocker.require("./testObjects/foo");

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b");
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.not.exist();

            foo.fs(function (err, data) {

                expect(data).to.exist();

                mocker.restore();
                done();
            });
        });
    });

    describe("test ways to spy instead of stub", function () {

        var mocker = new Mocker(sinon);  //pass sinon to the mocker

        afterEach(function () {
            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.STUB);
        });

        it("should spy instead of stub when using globals mock type", function () {

            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.SPY);

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"]
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b");
            expect(foo.useSub()).to.equal("hello world");
            expect(foo.useSubDep("world")).to.equal("hello world");
            expect(foo.useFuncDep()).to.equal("foo");
            expect(foo.useInstance()).to.equal("value");
            expect(foo.useStatic()).to.equal("you are: James");
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useConstsObj()).to.equal("im 1");

            var Bar = require("./testObjects/sub/bar");
            expect(Bar.prototype.useDep).to.have.been.calledWith("world");

            var instance = require("./testObjects/sub/instance");
            expect(instance.getValue).to.have.been.calledWith("test");

            mocker.restore();
        });

        it("should spy instead of stub when passed through options", function () {

            var foo = mocker.require("./testObjects/foo", {
                mockType: Mocker.MOCK_TYPES.SPY,
                dontMock: ["fs"]
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b");
            expect(foo.useSub()).to.equal("hello world");
            expect(foo.useSubDep("world")).to.equal("hello world");
            expect(foo.useFuncDep()).to.equal("foo");
            expect(foo.useInstance()).to.equal("value");
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useStatic()).to.equal("you are: James");
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useConstsObj()).to.equal("im 1");

            var Bar = require("./testObjects/sub/bar");
            expect(Bar.prototype.useDep).to.have.been.calledWith("world");

            var instance = require("./testObjects/sub/instance");
            expect(instance.getValue).to.have.been.calledWith("test");

            mocker.restore();
        });

        it("should use the module name for external modules when spying", function () {

            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.SPY);

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"]
            });

            var spies = mocker.getSpies();
            expect(spies["grunt-blanket"]).to.exist();
            expect(Object.keys(spies)).to.have.length(6);

            mocker.restore();   //make sure to clean up by restoring the stubs
        });

        it("should fail on invalid mock type in global", function () {

            Mocker.setGlobalMockType("foo");

            expect(function () {
                mocker.require("./testObjects/foo");
            }).to.throw(TypeError);

            mocker.restore();
        });

        it("should fail on invalid mock type in options", function () {

            expect(function () {
                mocker.require("./testObjects/foo", {mockType: 3});
            }).to.throw(TypeError);

            mocker.restore();
        });
    });

    describe("test selective spying or mocking", function () {

        var mocker = new Mocker(sinon);

        afterEach(function () {
            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.STUB);
        });

        it("should stub/spy according to options with stub as global default", function () {

            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.STUB);

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"],
                mockType: {
                    "path": Mocker.MOCK_TYPES.SPY,
                    "./sub/func": Mocker.MOCK_TYPES.STUB,
                    "./sub/bar": Mocker.MOCK_TYPES.SPY
                }
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b");
            expect(foo.useSub()).to.equal("hello world");
            expect(foo.useSubDep("world")).equal("hello world");
            expect(foo.useFuncDep()).to.not.exist();
            expect(foo.useInstance()).to.not.exist();
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useStatic()).to.equal("you are: James");
            expect(foo.useConstsObj()).to.equal("im 1");

            var spies = mocker.getSpies();

            expect(Object.keys(mocker.getStubs())).to.have.length(4);
            expect(Object.keys(spies)).to.have.length(2);

            expect(spies.path.join).to.have.been.calledOnce();

            var Bar = require("./testObjects/sub/bar");
            expect(Bar.prototype.useDep).to.have.been.calledWith("world");
            expect(Bar.myStatic).to.have.been.calledWith("James");

            mocker.restore();
        });

        it("should stub/spy according to options with spy as global default", function(){

            Mocker.setGlobalMockType(Mocker.MOCK_TYPES.SPY);

            var foo = mocker.require("./testObjects/foo", {
                dontMock: ["fs"],
                mockType: {
                    "path": Mocker.MOCK_TYPES.STUB,
                    "./sub/func": Mocker.MOCK_TYPES.SPY,
                    "./sub/bar": Mocker.MOCK_TYPES.STUB
                }
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.not.exist();
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.not.exist();
            expect(foo.useFuncDep()).to.equal("foo");
            expect(foo.useInstance()).to.equal("value");
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useStatic()).to.not.exist();
            expect(foo.useConstsObj()).to.equal("im 1");

            var spies = mocker.getSpies();
                     var stubs = mocker.getStubs();

            expect(Object.keys(stubs)).to.have.length(2);
            expect(Object.keys(spies)).to.have.length(4);

            expect(stubs.path.join).to.have.been.calledOnce();

            var Bar = require("./testObjects/sub/bar");
            expect(Bar.prototype.useDep).to.have.been.calledWith("world");
            expect(Bar.myStatic).to.have.been.calledWith("James");

            mocker.restore();
        });

        it("should fail if specific module is required with invalid mock type", function(){

            expect(function() {
                mocker.require("./testObjects/foo", {
                    dontMock: ["fs"],
                    mockType: {
                        "path": Mocker.MOCK_TYPES.STUB,
                        "./sub/func": Mocker.MOCK_TYPES.SPY,
                        "./sub/bar": 3
                    }
                });
            }).to.throw(TypeError);
        });
    });

    describe("testing mock require with stub setup - standalone", function () {

        var mocker = new Mocker(sinon);  //pass sinon to the mocker

        it("should mock require and setup stub successfully - standalone", function () {

            var foo = mocker.require("./testObjects/foo", {
                setup: {
                    "./sub/bar": function (stub) {
                        //set up the stub function to return a static string
                        stub.prototype.useDep.returns("this works!");
                    },
                    "./sub/func": function (stub) {
                        stub.returns("bla bla");
                    }
                }
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.equal("this works!");
            expect(foo.useFuncDep()).to.equal("bla bla");

            var Bar = require("./testObjects/sub/bar");

            expect(Bar.prototype.useDep).to.have.been.calledWith("world");

            mocker.restore();
        });
    });

    describe("test validity of modules after mocker has been used", function () {

        it("requiring the same module normally again should now work normally still", function () {

            var foo = require("./testObjects/foo");

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
            expect(foo.useSub()).to.equal("hello world");
            expect(foo.useSubDep("world")).to.equal("hello world");
            expect(foo.useFuncDep()).to.equal("foo");
            expect(foo.useInstance()).to.equal("value");
            expect(foo.useConsts()).to.equal("i love pizza");
            expect(foo.useStatic()).to.equal("you are: James");
            expect(foo.useConstsObj()).to.equal("im 1");
        });

        it("requiring a module that was a stub in previous should now work normally - not stubbed - standalone", function () {

            var Bar = require("./testObjects/sub/bar");
            var bar = new Bar();
            expect(bar.start()).to.equal("hello world");
            expect(bar.getStats()).to.exist();
            expect(bar.useDep("world")).to.equal("hello world");
            expect(Bar.myStatic("Tom")).to.equal("you are: Tom");
        });

        it("used node modules should work normally - standalone", function (done) {

            var fs = require("fs");

            fs.readdir("./", function () {
                done();
            });

            var path = require("path");

            var resolved = path.resolve("/");
            expect(resolved).to.equal("/");
        });
    });
});