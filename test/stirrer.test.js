var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    stirrer = require("../index");

describe("testing auto mocking for require", function () {
    "use strict";

    chai.use(dirtyChai); //use lint-friendly chai assertions!

    var cup = stirrer.grind({require: require});

    it("should mock require successfully", function () {
        var foo = cup.require("./foo");

        expect(foo).to.exist();
        expect(foo.bar()).to.equal("foo");
        expect(foo.wat("a", "b")).to.not.exist();
    });

});