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

    function getFunctionRunnerExpectsError(expectedErr){
        return function (name, fn) {
            if (utils.isFunc(name)){
                fn = name;
            }

            expectedErr = expectedErr || Error;

            expect(function(){fn();}).to.throw(expectedErr);

            //try {
            //    fn();
            //}
            //catch(err){
            //
            //
            //}
        };
    }

    function _addMockedHooks(obj){

        obj.it = getFunctionRunner();
        obj.before = getFunctionRunner();
        obj.after = getFunctionRunner();
        obj.beforeEach = getFunctionRunner();
        obj.afterEach = getFunctionRunner();
    }

    return {
        getFunctionRunner: getFunctionRunner,
        getFunctionRunnerExpectsError:getFunctionRunnerExpectsError,
        mockCupsMochaFunctions:mockCupsMochaFunctions,
        getMockBlendConfig: getMockBlendConfig
    };
})();