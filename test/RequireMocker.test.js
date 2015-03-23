var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    stirrer = require("../lib/stirrer");

describe("testing auto mocking for require", function () {
    "use strict";

    chai.use(dirtyChai); //use lint-friendly chai assertions!
    chai.use(sinonChai);

    var cup = stirrer.grind();

    describe("testing mock require", function () {    //wrapping in describe for the restir to

        cup.pour(function () {

            it("should mock require successfully", function () {

                var foo = cup.require("./foo", {
                    dontStub: ["fs"]
                });

                expect(foo).to.exist();
                expect(foo.bar()).to.equal("foo");
                expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
                expect(foo.useSub()).to.not.exist();
                expect(foo.useSubDep("world")).to.not.exist();

                var Bar = require("./sub/bar");

                expect(Bar.prototype.useDep).to.have.been.calledWith("world");
            });
        });
    });

    describe("testing mock require with stub setup", function(){

        cup.pour(function () {

            it("should mock require and setup stub successfully", function () {

                var foo = cup.require("./foo", {
                    setup: {
                        "./sub/bar": function (stub) {
                            //set up the stub function to return a static string
                            stub.prototype.useDep.returns("this works!");
                        }
                    }
                });

                expect(foo).to.exist();
                expect(foo.bar()).to.equal("foo");
                expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
                expect(foo.useSub()).to.not.exist();
                expect(foo.useSubDep("world")).to.equal("this works!");

                var Bar = require("./sub/bar");

                expect(Bar.prototype.useDep).to.have.been.calledWith("world");
            });
        });
    });

    it("requiring a module that was a stub in previous should now work normally - not stubbed", function () {

        var Bar = require("./sub/bar");
        var bar = new Bar();
        expect(bar.start()).to.equal("hello world");
        expect(bar.getStats()).to.exist();
        expect(bar.useDep("world")).to.equal("hello world");
    });

    it("used node modules should work normally", function (done) {

        var fs = require("fs");

        fs.readdir("./", function () {
            done();
        });

        var path = require("path");

        var resolved = path.resolve("/");
        expect(resolved).to.equal("/");
    });
});

