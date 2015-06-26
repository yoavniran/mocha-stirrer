var chai = require("chai"),
	expect = chai.expect,
	sinon = require("sinon"),
	utils = require("../lib/utils");

module.exports = (function () {
	"use strict";
	
	var MOCHA_HOOK_NAMES = ["it", "before", "after", "beforeEach", "afterEach"];
	
	function getMockStartBlendConfig() {
		var conf = {
			globals: {
				mochaHooks: {},
				mochaHooksNames: MOCHA_HOOK_NAMES,
				separator: "/"
			}
		};
		
		MOCHA_HOOK_NAMES.forEach(function (name) {
			conf.globals.mochaHooks[name] = sinon.stub();
		});
		
		conf.globals.mochaHooks.before = getFunctionRunner();
		conf.globals.mochaHooks.beforeEach = getFunctionRunner();
		
		return conf;
	}
	
	function getMockBlendConfig() {
		var conf = {
			globals: {
				mochaHooks: {},
				mochaHooksNames: MOCHA_HOOK_NAMES,
				separator: "/"
			}
		};
		
		_addMockedHooks(conf.globals.mochaHooks);
		
		return conf;
	}
	
	function stubCupsMochaFunctions(cup) {
		
		cup = cup || {};
		cup._mocha = cup._mocha || {};
		
		MOCHA_HOOK_NAMES.forEach(function (name) {
			cup._mocha[name] = sinon.stub();
		});
		
		return cup;
	}
	
	function mockCupsMochaFunctions(cup) {
		
		cup = cup || {};
		cup._mocha = cup._mocha || {};
		
		_addMockedHooks(cup._mocha);
		
		return cup;
	}
	
	function getFunctionRunner(specialDone) {
		return function (name, fn) {
			if (utils.isFunc(name)) {
				fn = name;
			}
			
			var doneFn = utils.isFunc(specialDone) ? specialDone : function () {
			};
			
			fn(doneFn);
		};
	}
	
	function getFunctionRunnerExpectsError(expectedErr) {
		return function (name, fn) {
			
			if (utils.isFunc(name)) {
				fn = name;
			}
			
			expectedErr = expectedErr || Error;
			
			expect(function () {
				fn();
			}).to.throw(expectedErr);
		};
	}
	
	function getSeparator() {
		var path = require("path");
		return path.sep;
	}
	
	function _addMockedHooks(obj) {
		
		MOCHA_HOOK_NAMES.forEach(function (name) {
			obj[name] = getFunctionRunner();
		});
	}
	
	return {
		getFunctionRunner: getFunctionRunner,
		getFunctionRunnerExpectsError: getFunctionRunnerExpectsError,
		mockCupsMochaFunctions: mockCupsMochaFunctions,
		getMockBlendConfig: getMockBlendConfig,
		getMockStartBlendConfig: getMockStartBlendConfig,
		stubCupsMochaFunctions: stubCupsMochaFunctions,
		getSeparator: getSeparator
	};
})();