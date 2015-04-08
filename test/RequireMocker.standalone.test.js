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

    var mocker = new Mocker(sinon);  //pass sinon to the mocker

    it("requiring the module should normally should work normally", function(){

        var foo = require("./testObjects/foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
        expect(foo.useSub()).to.equal("hello world");
        expect(foo.useSubDep("world")).to.equal("hello world");
        expect(foo.useFuncDep()).to.equal("foo");
    });

    describe("testing mock require - standalone", function () {    //wrapping in describe for the restir to

        it("should mock require successfully - standalone", function () {

            var foo = mocker.require("./testObjects/foo", {
                dontStub: ["fs"]
            });

            expect(foo).to.exist();
            expect(foo.bar()).to.equal("foo");
            expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
            expect(foo.useSub()).to.not.exist();
            expect(foo.useSubDep("world")).to.not.exist();
            expect(foo.useFuncDep()).to.not.exist();

            var Bar = require("./testObjects/sub/bar");

            expect(Bar.prototype.useDep).to.have.been.calledWith("world");

            mocker.restore();   //make sure to clean up by restoring the stubs
        });
    });

    describe("testing mock require with stub setup - standalone", function () {

        it("should mock require and setup stub successfully - standalone", function () {

            var foo = mocker.require("./testObjects/foo", {
                setup: {
                    "./sub/bar": function (stub) {
                        //set up the stub function to return a static string
                        stub.prototype.useDep.returns("this works!");
                    },
                    "./sub/func": function(stub){
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

    it("requiring the same module normally again should now work normally still", function(){

        var foo = require("./testObjects/foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
        expect(foo.useSub()).to.equal("hello world");
        expect(foo.useSubDep("world")).to.equal("hello world");
        expect(foo.useFuncDep()).to.equal("foo");
    });

    it("requiring a module that was a stub in previous should now work normally - not stubbed - standalone", function () {

        var Bar = require("./testObjects/sub/bar");
        var bar = new Bar();
        expect(bar.start()).to.equal("hello world");
        expect(bar.getStats()).to.exist();
        expect(bar.useDep("world")).to.equal("hello world");
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

    it("should throw on require without parent", function(){
        expect(function(){mocker.require(null, "./foo");}).to.throw();
    });
});