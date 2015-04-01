var chai = require("chai"),
    expect = chai.expect,
    dirtyChai = require("dirty-chai"),
    sinonChai = require("sinon-chai"),
    pourer = require("../lib/pourer");

chai.use(dirtyChai);
chai.use(sinonChai);

describe("pourer tests", function () {
    "use strict";

    describe("check that pour is attached and can be used", function () {

        var counter = 0;

        var cup = {
            _isHooked: true,
            _befores: [
                function (next) {
                    expect(counter).to.equal(0);
                    counter += 1;
                    next();
                }
            ],
            _afters: [
                function (next) {
                    expect(counter).to.equal(2);
                    counter += 1;
                    next();
                }
            ],
            _it: function (name, fn) {
                function done() {
                }

                fn(done);
            }
        };

        it("pour should be executed successfully", function () {

            pourer.attach(cup);

            cup.pour("dummy test to ensure pour works", function () {
                expect(counter).to.equal(1);
                counter += 1;
            });
        });

        after(function () {
            expect(counter).to.equal(3);
        });


    });


});





