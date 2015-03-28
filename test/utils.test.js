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

        it("should use the optional length par", function () {
            expect(utils.isAsync(function (a) {
            }, 0)).to.be.ok();
            expect(utils.isAsync(function (a, b, c, d) {
            }, 3)).to.be.ok();
            expect(utils.isAsync(function (a, b, c, d) {
            }, 4)).to.not.be.ok();
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
                expect(series).to.have.length(3);
                done();
            }, context);
        });

        it("should run callback with empty series", function (done) {

            utils.runSeriesAsync([], function () {
                done();
            });
        });

    });

    describe("test runSeries", function () {

        it("should run all functions in series with the supplied context", function () {

            var counter = 0;
            var context = {foo: "bla"};

            utils.runSeries([
                function () {
                    counter += 1;
                    expect(this).to.equal(context);
                },
                function () {
                    counter += 1;
                    expect(this).to.equal(context);
                },
                function () {
                    counter += 1;
                    expect(this).to.equal(context);
                }
            ], context);

            expect(counter).to.equal(3);
        });

        it("should not break when passing empty array", function () {
            utils.runSeries([]);
        });

        it("should not break when passing undefined series", function () {
            utils.runSeries();
        });
    });

    describe("test isObjectEmpty", function () {

        it("should return false for object with properties", function () {

            var obj = {
                test: "foo"
            };

            expect(utils.isObjectEmpty(obj)).to.be.false();

            var obj2 = {
                test: function () {
                }
            };

            expect(utils.isObjectEmpty(obj2)).to.be.false();
        });

        it("should return false for newed object (also with inheritance)", function () {

            var A = function () {
            };
            A.prototype.test = function () {
            };

            var a = new A();

            expect(utils.isObjectEmpty(a)).to.be.false();

            var B = function () {
                A.call(this);
            };

            B.prototype = A.prototype;
            B.prototype.constructor = B;

            var b = new B();

            expect(utils.isObjectEmpty(b)).to.be.false();

            var C = function () {
                this.prop = false;
            };

            var c = new C();

            expect(utils.isObjectEmpty(c)).to.be.false();

        });

        it("should return true for empty object", function () {
            expect(utils.isObjectEmpty({})).to.be.true();
        });

        it("should return true for newed empty object", function () {

            var A = function () {
            };
            var a = new A();

            expect(utils.isObjectEmpty(a)).to.be.true();
        });

        it("should return true for newed empty object (also with inheritance)", function () {

            var obj = new Object();  // jshint ignore:line

            expect(utils.isObjectEmpty(obj)).to.be.true();

            var A = function () {
            };
            var a = new A();

            expect(utils.isObjectEmpty(a)).to.be.true();

            var B = function () {
                A.call(this);
            };

            B.prototype = A.prototype;
            B.prototype.constructor = B;

            var b = new B();

            expect(utils.isObjectEmpty(b)).to.be.true();
        });

        it("should return false for array with elements", function () {

            var arr = [1, 2, 3];
            expect(utils.isObjectEmpty(arr)).to.be.false();

            var arr2 = [1];
            expect(utils.isObjectEmpty(arr2)).to.be.false();

            var arr3 = new Array(); // jshint ignore:line
            arr3[1] = "yes";
            expect(utils.isObjectEmpty(arr3)).to.be.false();
        });

        it("should return false for array with elements", function () {

            var arr = [];
            expect(utils.isObjectEmpty(arr)).to.be.true();

            var arr2 = new Array(); // jshint ignore:line
            expect(utils.isObjectEmpty(arr2)).to.be.true();
        });

        it("should return true for falsy parameter", function () {
            expect(utils.isObjectEmpty(false)).to.be.true();
            expect(utils.isObjectEmpty(undefined)).to.be.true();
            expect(utils.isObjectEmpty(null)).to.be.true();
        });

        it("should throw for not object/array types", function () {

            expect(function () {
                utils.isObjectEmpty(1);
            }).to.throw();
            expect(function () {
                utils.isObjectEmpty("Aasd");
            }).to.throw();
        });
    });
});

