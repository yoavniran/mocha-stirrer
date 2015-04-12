var chai = require("chai"),
    expect = chai.expect,
    utils = require("../lib/utils");

module.exports = (function () {
    "use strict";

    function getMockBlendConfig(){
        var conf = {
            globals: {
                mochaHooks: {
                },
                mochaHooksNames: ["it", "before", "after", "beforeEach", "afterEach"]
            }
        };

        _addMockedHooks(conf.globals.mochaHooks);

        return conf;
    }

    function mockCupsMochaFunctions(cup){

        cup = cup || {};
        cup._mocha = cup._mocha || {};

        _addMockedHooks(cup._mocha);

        return cup;
    }

    function getFunctionRunner(specialDone) {
        return function (name, fn) {
            if (utils.isFunc(name)){
                fn = name;
            }

            var doneFn = utils.isFunc(specialDone) ? specialDone : function(){};

            fn(doneFn);
        };
    }

    function getFunctionRunnerExpectsError(expectedErr) { //, runnerName){
        return function (name, fn) {

            //if (runnerName) {
            //    console.log("### entered fn runner: " + runnerName);
            //}

            if (utils.isFunc(name)){
                fn = name;
            }

            expectedErr = expectedErr || Error;

            expect(function(){fn();}).to.throw(expectedErr);
        };
    }

    function _addMockedHooks(obj){

        obj.it = getFunctionRunner(undefined, "it");
        obj.before = getFunctionRunner(undefined, "before");
        obj.after = getFunctionRunner(undefined, "after");
        obj.beforeEach = getFunctionRunner(undefined, "beforeEach");
        obj.afterEach = getFunctionRunner(undefined, "afterEach");
    }

    return {
        getFunctionRunner: getFunctionRunner,
        getFunctionRunnerExpectsError:getFunctionRunnerExpectsError,
        mockCupsMochaFunctions:mockCupsMochaFunctions,
        getMockBlendConfig: getMockBlendConfig
    };
})();