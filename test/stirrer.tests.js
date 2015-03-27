/* jshint strict: false */

require("./utils.test");
require("./stirrer.basics.test");
require("./stirrer.test");
require("./RequireMocker.test");
require("./RequireMocker.standalone.test");

//function customDone(done) {
//    after("after from done", function () {
//        console.log("this is after");
//        //afterDone();
//    });
//    done();
//}
//
//describe("root", function(){
//
//    describe("context 1", function () {
//
//        before("before context 1", function(){
//            console.log("before context 1");
//        });
//        //after(function () {
//        //    console.log("this is after");
//        //});
//
//        //it("pending test");
//
//        it("test", function () {
//            console.log("this is the test");
//
//            //customDone(done);
//
//            after("after context 1", function(){
//                console.log("after context 1");
//            });
//
//            //done();
//        });
//
//        //after("after context 1", function(){
//        //    console.log("after context 1");
//        //});
//
//        //it("test 2", function () {
//        //    console.log("this is test 2");
//        //});
//        //
//        //it.only("test 3");
//    });
//
//    describe("context 2", function(){
//
//        before("before context 2", function(){
//            console.log("before context 2");
//        });
//
//        it("test 2", function(){
//            console.log("this is test #2");
//        });
//
//        after("after context 2", function(){
//            console.log("after context 2");
//        });
//
//    });
//});