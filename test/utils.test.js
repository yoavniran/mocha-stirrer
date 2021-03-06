var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    utils = require("../lib/utils");

describe("utils tests", function () {
    "use strict";
    chai.use(dirtyChai);
    chai.use(sinonChai);
	
	describe("test isNumber", function () {
		it("should return true for numbers", function () {
			expect(utils.isNumber(3)).to.be.true();
			expect(utils.isNumber(10000)).to.be.true();
			expect(utils.isNumber(0)).to.be.true();
			expect(utils.isNumber(-12)).to.be.true();
		});

		it("should return false for not numbers", function () {
			expect(utils.isNumber("1")).to.be.false();
			expect(utils.isNumber(null)).to.be.false();
			expect(utils.isNumber(undefined)).to.be.false();
			expect(utils.isNumber(NaN)).to.be.false();
			expect(utils.isNumber(false)).to.be.false();
			expect(utils.isNumber(true)).to.be.false();
		});
	});

    describe("test isFunc", function () {

        it("should return true for fn expression ", function () {
            var fn = function () {
            };
            expect(utils.isFunc(fn)).to.be.true();
        });

        it("should return true for fn declaration ", function () {
            function fn() {
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

        it("should be true for function with more than 0 args", function () {

            expect(utils.isAsync(function (a) {
                return a;
            })).to.be.true();

            var asyncFn = function (a, b) {
                return a+b;
            };

            expect(utils.isAsync(asyncFn)).to.be.true();

            expect(utils.isAsync(function (a, b, c) {
                return a+b+c;
            })).to.be.true();
        });

        it("should be false no-pars functions", function () {

            expect(utils.isAsync(function () {
            })).to.not.be.ok();
        });

        it("should be false an array with more than one value", function () {
            expect(utils.isAsync([1, 2])).to.not.be.ok();
        });

        it("should use the optional length par", function () {
            expect(utils.isAsync(function (a) {
                return a;
            }, 0)).to.be.ok();
            expect(utils.isAsync(function (a, b, c, d) {
                return a+b+c+d;
            }, 3)).to.be.ok();
            expect(utils.isAsync(function (a, b, c, d) {
                return a+b+c+d;
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

    describe("test merge", function () {

        it("should merge from obj1 to obj2, not affecting obj1", function () {

            var obj1 = {prop1: "test", prop2: "bla"};
            var obj2 = {prop3: "132", prop4: 123};

            var result = utils.merge(obj1, obj2);

            expect(result).to.equal(obj2);
            expect(obj1).to.have.all.keys(["prop1", "prop2"]);
            expect(obj2).to.have.all.keys(["prop1", "prop2", "prop3", "prop4"]);
        });

        it("should merge from obj1 to undefined", function () {

            var obj2 = {prop3: "132", prop4: 123};

            var result = utils.merge(obj2);

            expect(result).to.exist();
            expect(obj2).to.have.all.keys(["prop3", "prop4"]);
        });

        it("should merge only functions when passing the flag, no functions", function () {

            var obj2 = {prop3: "132", prop4: 123};

            var result = utils.merge(obj2, {}, true);

            expect(result).to.exist();
            expect(result).to.be.empty();
        });

        it("should merge only functions when passing the flag", function () {

            var obj2 = {
                prop3: "132", prop4: 123, foo: function () {
                }
            };

            var result = utils.merge(obj2, {}, true);

            expect(result).to.exist();
            expect(result).to.have.keys("foo");
            expect(result.foo).to.be.a("function");
        });

        it("should return a new object if dest is undefined", function () {

            var obj1 = {prop1: "test", prop2: "bla"};
            var result = utils.merge(obj1, undefined);

            expect((result !== obj1)).to.be.ok();
            expect(result).to.have.all.keys(["prop1", "prop2"]);
        });

        it("should not affect destination if src is undefined", function () {

            var obj1 = {prop1: "test", prop2: "bla"};

            var result = utils.merge(undefined, obj1);

            expect(result).to.be.equal(obj1);

            expect(result).to.have.all.keys(["prop1", "prop2"]);
            expect(obj1).to.have.all.keys(["prop1", "prop2"]);
        });
    });

    describe("test leveled name", function () {

        it("should create levels successfully", function () {

            var levels = utils.getLeveledFileName("./test/testObjects/foo.js", 2);

            expect(levels).to.exist();
            expect(levels).to.have.length(2);

            expect(levels[0]).to.equal("testObjects/foo");
            expect(levels[1]).to.equal("test/testObjects/foo");
        });

        it("should create levels successfully with default level 3 ", function () {

            var levels = utils.getLeveledFileName("./test/testObjects/foo.js");

            expect(levels).to.exist();
            expect(levels).to.have.length(3);

            expect(levels[0]).to.equal("testObjects/foo");
            expect(levels[1]).to.equal("test/testObjects/foo");
            expect(levels[2]).to.equal("mocha-stirrer/test/testObjects/foo");
		});

		it("should create levels successfully with parent provided", function () {
			var levels = utils.getLeveledFileName("./test/foo.js", "./bla/bar.js");

			expect(levels).to.exist();
			expect(levels).to.have.length(3);

			expect(levels[0]).to.equal("test/foo");
			expect(levels[1]).to.equal("bla/test/foo");
			expect(levels[2]).to.equal("mocha-stirrer/bla/test/foo");
		});

		it("should create levels successfully with parent and level count provided", function () {
			var levels = utils.getLeveledFileName("./test/foo.js", "./bla/bar.js", 2);
			
			expect(levels).to.exist();
			expect(levels).to.have.length(2);

			expect(levels[0]).to.equal("test/foo");
			expect(levels[1]).to.equal("bla/test/foo");
		});

		it("should create levels successfully with null parent and level count provided", function () {
			
			var levels = utils.getLeveledFileName("./test/testObjects/sub/foo.js", null, 4);
			
			expect(levels).to.exist();
			expect(levels).to.have.length(4);
			
			expect(levels[0]).to.equal("sub/foo");
			expect(levels[1]).to.equal("testObjects/sub/foo");
			expect(levels[2]).to.equal("test/testObjects/sub/foo");
			expect(levels[3]).to.equal("mocha-stirrer/test/testObjects/sub/foo");
		});
    });

    describe("test find", function () {

        it("should find a string value", function () {

            var res = utils.find({a: "foo", b: "bar"}, "bar");

            expect(res).to.exist();
            expect(res.b).to.equal("bar");
        });

        it("shouldnt find if no match", function(){

            var res = utils.find({a: "foo", b: "bar"}, "test");

            expect(res).to.not.exist();
        });


    });
});

