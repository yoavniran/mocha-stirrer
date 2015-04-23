var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    stirrer = require("../lib/index");

describe("testing auto mocking for require", function () {
    "use strict";

    chai.use(dirtyChai); //use lint-friendly chai assertions!
    chai.use(sinonChai);

    it("requiring the module should normally should work normally", function () {

        var foo = require("./testObjects/foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
        expect(foo.useSub()).to.equal("hello world");
        expect(foo.useSubDep("world")).to.equal("hello world");
        expect(foo.useFuncDep()).to.equal("foo");
    });

    describe("testing mock require", function () {    //wrapping in describe for the restir to clear the mock require

        var cup = stirrer.grind({
            name: "RequireMocker.test - TEST #1"
        });

        cup.pour("should mock require successfully", function (done) {

            var foo = cup.require("./testObjects/foo", {
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

            foo.fs(function () {
                done();
            });
        });
    });

    describe("testing mock require with stub setup", function () {

        var cup = stirrer.grind({
            name: "RequireMocker.test - TEST #2"
        });

        cup.pour("should mock require and setup stub successfully", function () {

            var foo = cup.require("./testObjects/foo", {
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
        });
    });

    describe("testing mock require using stirrer method with stub setup", function () {

        var cup = stirrer.grind({
            name: "RequireMocker.test - TEST #2"
        });

        cup.pour("should mock require and setup stub successfully", function () {

            var foo = stirrer.require(cup, "./testObjects/foo", {
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
        });
    });

    describe("use stirrer cup with requires (mocker)", function () {

        describe("pass requires in grind conf", function () {

            var cup = stirrer.grind({
                requires: [
                    "./testObjects/foo"  //foo will be fake required
                ],
                before: function () {
                    this.getStub("sub/bar").prototype.useDep.returns("this works!"); //foo depends on bar.js and we get to it using alias: "sub/bar"
                }
            });

            cup.pour("fake require should be  set up correctly", function () {

                var foo = this.required["./testObjects/foo"];  //we can get to foo using the required property
                expect(foo).to.exist();
                expect(foo.useSubDep("")).to.equal("this works!");  //stub returns what we told it to return
            });
        });

        describe("pass requires in grind conf with options", function () {

            var cup = stirrer.grind({
                requires: [{
                    path: "./testObjects/foo",
                    options: {
                        setup: {
                            "./sub/func": function (stub) {
                                stub.returns("bla bla");
                            }
                        }
                    }
                }]
            });

            cup.pour("fake require should be  set up correctly with setup", function () {
                var foo = cup.required["./testObjects/foo"];
                expect(foo).to.exist();
                expect(foo.useFuncDep()).to.equal("bla bla");
            });
        });

        //describe("pass requires to stir method", function(){
        //
        //    var cup = stirrer.grind();
        //
        //    cup.stir({
        //        requires: [{
        //            path: "./testObjects/foo",
        //            options: {
        //                setup: {
        //                    "./sub/func": function (stub) {
        //                        stub.returns("bla bla");
        //                    }
        //                }
        //            }
        //        }],
        //        pars: function(){
        //            return {
        //                "funcRetVal": "bla bla"
        //            };
        //        }
        //    });
        //
        //    cup.pour("fake require should be  set up correctly with setup", function () {
        //        var foo = cup.required["./testObjects/foo"];
        //        expect(foo).to.exist();
        //        expect(foo.useFuncDep()).to.equal("bla bla");
        //    });
        //});
    });

    it("requiring the same module normally again should now work normally still", function () {

        var foo = require("./testObjects/foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.equal("a/b"); //internally path should be stubbed and not set up to return anything
        expect(foo.useSub()).to.equal("hello world");
        expect(foo.useSubDep("world")).to.equal("hello world");
        expect(foo.useFuncDep()).to.equal("foo");
    });

    it("requiring a module that was a stub in previous should now work normally - not stubbed", function () {

        var Bar = require("./testObjects/sub/bar");
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