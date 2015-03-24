var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    utils = require("../lib/utils");

describe("utils tests", function () {
    "use strict";
    chai.use(dirtyChai);
    chai.use(sinonChai);

    describe("test isFunc", function () {

        it("should return true for fn expression ", function () {
            var fn = function () {
            };
            expect(utils.isFunc(fn)).to.be.true();
        });

        it("should return true for fn declaration ", function () {
            function fn(a) {
            }

            expect(utils.isFunc(fn)).to.be.true();
        });

        it("should return true for anonymous fn ", function () {
            expect(utils.isFunc(function () {
            })).to.be.true();
        });

        it("should return true for fn as object property", function () {
            var obj = {
                run: function () {
                }
            };

            expect(utils.isFunc(obj.run)).to.be.true();
        });

        it("should return true for constructor", function () {
            expect(utils.isFunc(Array)).to.be.true();
        });

        it("should be falsy for undefined", function () {
            var a;
            expect(utils.isFunc(a)).to.not.be.ok();
        });

        it("should be falsy for null", function () {
            var a = null;
            expect(utils.isFunc(a)).to.not.be.ok();
        });

        it("should be falsy for an object", function () {
            var a = [];
            expect(utils.isFunc(a)).to.not.be.ok();
        });
    });

    describe("test isArray", function () {

        it("should be true for literal", function () {
            var arr = [];
            expect(utils.isArray([1, 2, 3])).to.be.true();
            expect(utils.isArray(arr)).to.be.true();
        });

        it("should be true for newed object", function () {
            var arr = new Array();   // jshint ignore:line
            expect(utils.isArray(arr)).to.be.true();
        });

        it("should be false for  object", function () {
            var arr = new Object();   // jshint ignore:line
            expect(utils.isArray(arr)).to.not.be.ok();
        });

        it("should be false for arguments", function () {
            expect(utils.isArray(arguments)).to.not.be.ok();
        });
    });

    describe("test isAsync", function () {

        it("should be true for function with more than 1 args", function () {

            var asyncFn = function (a, b) {
            };

            expect(utils.isAsync(asyncFn)).to.be.true();

            expect(utils.isAsync(function (a, b, c) {
            })).to.be.true();
        });

        it("should be false for any other function", function () {

            expect(utils.isAsync(function (a) {
            })).to.not.be.ok();
            expect(utils.isAsync(function () {
            })).to.not.be.ok();
        });

        it("should be false an array with more than one value", function () {
            expect(utils.isAsync([1, 2])).to.not.be.ok();
        });
    });

    describe("test runSeriesAsync", function () {

        it("should run all functions in series and reach the callback", function (done) {

            var counter = 0;
            var context = {foo: "bar"};

            var series = [
                function (next) {
                    counter += 1;
                    expect(this).to.equal(context);
                    next();
                },
                function (next) {
                    counter += 1;
                    expect(this).to.equal(context);
                    next();
                },
                function (next) {
                    counter += 1;
                    expect(this).to.equal(context);
                    next();
                }
            ];

            utils.runSeriesAsync(series, function () {
                expect(counter).to.equal(3);
                done();
            }, context);
        });

        it ("should run callback with empty series", function(done){

           utils.runSeriesAsync([], function(){
              done();
           });
        });

    });
});

