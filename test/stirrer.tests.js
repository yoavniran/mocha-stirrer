//require("./utils.test");
require("./stirrer.basics.test");
//require("./stirrer.test");
//require("./RequireMocker.test");
//require("./RequireMocker.standalone.test");

function customDone(done) {
    after("after from done", function () {
        console.log("this is after");
    });
    done();
}

describe("bla", function () {

    //after(function () {
    //    console.log("this is after");
    //});

    //it("pending test");

    it("test", function (done) {
        console.log("this is the test");

        customDone(done);
    });

    //it("test 2", function () {
    //    console.log("this is test 2");
    //});
    //
    //it.only("test 3");
});