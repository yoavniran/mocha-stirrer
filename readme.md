[![Coverage Status](https://coveralls.io/repos/yoavniran/mocha-stirrer/badge.svg?branch=master)](https://coveralls.io/r/yoavniran/mocha-stirrer?branch=master)
[![Build Status](https://travis-ci.org/yoavniran/mocha-stirrer.svg?branch=master)](https://travis-ci.org/yoavniran/mocha-stirrer)
[![npm version](https://badge.fury.io/js/mocha-stirrer.svg)](http://badge.fury.io/js/mocha-stirrer)
[![Dependencies](https://david-dm.org/yoavniran/mocha-stirrer.svg)]((https://david-dm.org/yoavniran/mocha-stirrer.svg))
[![devDependency Status](https://david-dm.org/yoavniran/mocha-stirrer/dev-status.svg)](https://david-dm.org/yoavniran/mocha-stirrer#info=devDependencies)
[![Codacy Badge](https://www.codacy.com/project/badge/12374261d28a40a5b05054d5b78c783b)](https://www.codacy.com/app/yoavniran/mocha-stirrer)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

> **This document is still a work in progress with several sections still missing. I'm on it!**

* [Introduction](#introSection)
* [Example](#firstExampleSection)
* [API](#apiSection)
* [Require Mocker](#requireMockerSection)
* [Stirring](#stirringSection)

<a name="introSection">
# Mocha Stirrer


**_Easily mock and set up tests for Mocha and Sinon then test, then reuse_**

A useful utility for testing with mocha and sinon in a friendlier way that allows you to describe the objects and functions you wish
 to spy/stub/mock. Stirrer gives you a way to declare your setup upfront and re-use it between tests so you can write
 them once and then run every test.

A big benefit of Stirrer is that the set up of mocks is made easier and the cleanup is taken care of for you.

The aim of this tool is to allow you to write as little as set up code as possible focusing on the test cases themselves.

The **[`RequireMocker`](#requireMockerSection)** that is part of this package is a strong tool that can be used on its own
or as part of the stirrer functionality. Read more about it [below](#requireMockerSection).

> _Mocha Stirrer supports only node.js development currently and will not work in the browser_

___

<a name="firstExampleSection"/>
## Example

Below is an example showing how Stirrer can be used to set up ([grind](#grindSection)) a test and then run a test ([pour](#pourSection))
 using the fakes set up and verification defined:

Jump [here](#docsSection) for the full API documentation

```js

	var stirrer = require("../lib/stirrer");

	describe("use stirrer simple", function () {

	    var foo = require("./foo");
	    var Bar = require("./sub/bar");
	    var fs = require("fs");
	    var path = require("path");

	    var cup = stirrer.grind({
	        name: "TEST #3",
	        stubs: {
	            "barGetStats": [Bar.prototype, "getStats"]
	        },
	        spies: {
	            "pathJoin": [path, "join"]
	        },
	        mocks: {
	            "fs": fs
	        },
	        before: function (cup) {
	            cup.stubs.barGetStats.returns("stats!");
	            cup.mocks.fs.expects("readdir").once().callsArgWithAsync(1, "oh no!");
	        },
	        after: function () {
	            expect(cup.stubs.barGetStats.calledOnce).to.be.true();
	            expect(cup.spies.pathJoin.calledOnce).to.be.true();
	        }
	    });

	    cup.pour("fakes setup should work as defined", function (done) {

	        expect(Bar.prototype.getStats).to.equal(cup.stubs.barGetStats);

	        var stats = foo.barStats();
	        expect(stats).to.equal("stats!");

	        var res = foo.wat("a", "b");
	        expect(res).to.equal("a/b");

	        foo.fs(function (err) {
	            expect(err).to.equal("oh no!");
	            done();
	        });
	    });
	});

```

___

<a name="apiSection"/>
## Stirrer API

<a name="grindSection"/>
### grind([conf](#stirrerGrindConfParSection), [testFn](#stirrerGrindtestFnParSection))

> Alias: create

Creates a new **[Cup](#cupSection)**  instance.

A cup can be used between tests

<a name="stirrerGrindConfParSection"/>
_conf_ is an object that configures the cup instance. The following properties can be passed in:

* `name` - (optional) any string that will be used for naming mocha hooks

* `pars` - (optional) object map (key/val) or function that returns an object map. Makes it easy to use values between tests

* `spies` - (optional) object map or function returning an object map. Used to create [sinon spies](http://sinonjs.org/docs/#spies-api),
					each entry in the object map can be one of the following:

					1. An array with 2 the first element referencing an object, second is the property name
                    2. A function to spy
                    3. A special EMPTY string (_stirrer.EMPTY_) to receive an anonymous spy

* `stubs` - (optional) object map or function returning an object map. Used to create [sinon stubs](http://sinonjs.org/docs/#stubs-api),
                    each entry in the object map can be one of the following:

                    1. An array with 2 or 3 elements, the first element referencing an object, second is the property name
                    and the third and optional is a function. See sinon API for details
                    2. An object to be stubbed by sinon
                    3. A special EMPTY string (_stirrer.EMPTY_) to receive an empty stub

* `mocks` - (optional) object map or function returning an object map. Used to create [sinon mocks](http://sinonjs.org/docs/#mocks-api),
				each entry in the object map should be an object reference

* `delay` - (optional, default: false) When true, cup instance will be created but not set up. meaning non of the fakes
 will be defined. The [start](#cupStartSection) method must be called in order for setup to occur.
 see the [Stirring section](#stirringSection) for further details on the order of how things are set up and run.
 Note that you shouldn't use delay=true when also passing a test function as fakes wont be initialized.
 setting `setupImmediate` to true overrides this parameters so delay will be ignored

* `transform` - (optional) function receives the currently assigned parameters to the cup instance (cup.pars). If provided, transform
will be run every time the cup setup logic is executed which, unless the setupImmediate flag is set to true, will be during the before
 or beforeEach hook

* `before` - (optional) a function that will be called before ([mocha hooks](http://mochajs.org/#hooks)) tests are run within a describe/context block
receives a reference to the cup as the context (this) and a reference to the done callback as a parameter. Very similarly to Mocha, if you define a
the parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `after` - (optional) a function that will be called after ([mocha hooks](http://mochajs.org/#hooks)) tests ran within a describe/context block
receives a reference to the cup as the context (this) and a reference to the done callback as a parameter. Very similarly to Mocha, if you define a
the parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `beforeEach` - (optional) a function that will be called before ([mocha hooks](http://mochajs.org/#hooks)) each test within a describe/context block
receives a reference to the cup as the context (this) and a reference to the done callback as a parameter. Very similarly to Mocha, if you define a
the parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `afterEach` - (optional) a function that will be called after ([mocha hooks](http://mochajs.org/#hooks)) each test within a describe/context block
receives a reference to the cup as the context (this) and a reference to the done callback as a parameter. Very similarly to Mocha, if you define a
the parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `sandbox` - (optional) an object with properties to configure the internal [sinon sandbox](http://sinonjs.org/docs/#sandbox) object Stirrer creates.

* `transformForEach` - (optional, default: false) when set to true determines whether the supplied (pars) transform function
should be run as part of a beforeEach hook. When false will run as part of a before hook

* `setupImmediate` - (optional, default: false) makes the stirrer run its set up logic immediately during the execution of the grind method.
Also, the setup logic will only be executed once - this is good for a standalone cup that will not be reused between tests.
If left as false, the setup will happen during the first before or beforeEach hook prior to a test being executed.

* `dontRestir` - (optional, default: false) (see [restir](#restirSection)) will prevent the cup from being "restirred" (reset) in the
after hook. This means that when the mocha context(describe) finishes, non of the fakes will be restored so you will need to do the restoring manually.

* `requires` - (optional)
 requires is either an array or a function (returning array). Each element in the array should either be:

	1) string with the path of the module to require
	2) an object: {path: "", options: {}) - options is optional (for options details see [below](#requireMockerRequireOptions))

	This will fake require the modules according to the provided path and make them available on the 'required' property of the cup. 	 Additional requires can be passed into the `cup` using its [stir](#cupStirMethodSection) method.

* `befores` - (optional) Can either be a function or an array of functions. The signature of these functions is: fn(next). `next` is a function that must be called otherwise tests will not run.
Each of the registered methods will be executed in sequence right before a test(pour) is run.
Additional befores can be passed into the `cup` using its [stir](#cupStirMethodSection) method.
Any registered before functions are removed when the cup is [restirred](#restirSection) (reset)

* `afters` - (optional) Can either be a function or an array of functions. The signature of these functions is: fn(next). `next` is a function that must be called otherwise tests will not finish running.
Each of the registered methods will be executed in sequence right after a test(pour) is run.
Additional afters can be passed into the `cup` using its [stir](#cupStirMethodSection) method
Any registered afters functions are removed when the cup is [restirred](#restirSection) (reset)


<a name="stirrerGrindtestFnParSection"/>
_testFn_

A test function to be run immediately with the cup object. Provides a shortcut to calling _pour(...)_ on the cup object.


<a name="restirSection"/>
### restir(cup)

> Alias: reset

Clears the cup's fakes(spies/stubs/mocks) and restores them using the internal sinon sandbox object.
All registered afters/befores are removed together with all references to spies/stubs/mocks and stub aliases.

The cup's restir method is called internally automatically when the mocha context/describe ends in which the grind method was called or if delay was used,
from the ending context in which [start](#cupStartSection) was called. See the [Stirring section](#stirringSection) below for a more detailed explanation.

<a name="requireSection">
### require(cup, requirePath, options)

* `cup`- the cup instance to use as the sandbox and add the stubs to
* `requirePath` - the module to require. Use the same path as you would use for a normal require. so relative to the current module
* `options` - see the options details in the RequireMocker section, [require method details](#requireMockerRequireSection)
_The default context for the setup methods (if you use them) will be the cup instance. To change it simply pass a different setupContext_
### RequireMocker

This is the RequireMocker type discussed below. You can new it up and use it on its own. See the [section](requireMockerSection) below for details.

### EMPTY

When grinding a new cup you can specify what you wish to stub or spy. In case you want an anonymous stub/spy ala "_**sinon.stub();**_" you can use this special property as the value of the stub or spy. This way:

```js

	var stirrer = require("mocha-stirrer");

	var cup = stirrer.grind({
            stubs: {
                "emptyStub": stirrer.EMPTY //will create an anonymous stub
            },
            spies: {
                "emptySpy": stirrer.EMPTY //will create an anonymous spy
            },
            before: function () {
                cup.stubs.emptyStub.returns("foo"); //here we use our anonymous stub
            }
	});

```


___

<a name="cupSection" />
## The Cup

A cup is created by calling the [grind](#grindSection) method:

```js

	var stirrer = require("mocha-stirrer");

    var cup = stirrer.grind({});
```

<a name="cupStirMethodSection"/>
### stir(conf)

Add information to the cup that can be used by following tests. the new information is added on top of any other data
already passed using the grind method or previously calling stir.

**conf** - object that can consist of any combination of the following properties:

* `pars` -  object map (key/val) or function that returns an object map

* `befores` - array of methods or a single method to be executed before each test. Each method passed receives a '_next_' function  reference as a parameter which it must call. Failing to call _next()_ will cause timeouts as the flow will not progress

```js

    var cup = stirrer.grind(...);

    cup.stir({
		befores: function (next) { //can pass one function or an array of functions
                 //do something here
				//...
                        next(); //dont forget to call next
                    }
	});
```



* `afters` array of methods or a single method to be executed after each test. Each method receives a '_next_' function reference  as a parameter which it must call. Failing to call next() will cause timeouts as the flow will not progress.

* `requires` -   array of elements or a function returning array of elements, each element in the array should either be:

	* string with the path of the module to require or,
	* an object: {path: "", options: {}) - options is optional


<a name="pourSection"/>
### pour(name, fn)
> Alias: test

* `name` - (mandatory) name for the test
* `fn` - (optional) function to be executed as the test

the Pour method mimics Mocha's '_it_' function and supports it's different flavors:

1. [Synchronous](http://mochajs.org/#synchronous-code)
2. [Asynchronous](http://mochajs.org/#asynchronous-code)
3. [Pending](http://mochajs.org/#pending-tests)
4. [Exclusive](http://mochajs.org/#exclusive-tests)
5. [Inclusive](http://mochajs.org/#inclusive-tests)

Here's a simple example of using pour:

```js

    cup.pour("my test", function(){

        //this === cup - the cup is passed as the context for this function so you can do:
        // this.pars.myPar or this.stubs.myStub
    });

```

As mentioned, everything that you could do with Mocha's '_it_' method you can do with pour so this works:

```js

	cup.pour.only("my test", function(){
		//this will make Mocha run your test function exclusively
	});

```

If your test function runs asynchronous code then just like with Mocha, you have the done callback to signal the test is done:

```js

	cup.pour("my test", function(done){
		//this will make Mocha run your test function exclusively

		done(); //make sure to call done so Mocha doesnt timeout
	});

```

If you want to use Mocha's '_it_' on your own you can call pour like this:

```js

	cup.pour.wrap("my test", function(){
	    //now its up to you to use Mocha's it:
		//still true: this === cup

	    it("this is actually my test now", function(){
	    });
	});

```

<a name="cupStartSection"/>
### brew()

> Alias: start

If delay=true was used when grinding the cup then you will need to manually start the cup by calling this method.
This will initialize the cup. A good time to use delay and manual start is when you have the cup grinding code at the top of a module
or in a shared util class. Then you wouldn't want the cup to be started immediately but rather in the right context/describe.

```js

	//we may define a cup at the top of our test module with the delay flag, like this:

    var delayedCup = stirrer.grind({
        name: "delayed cup test",
        delay: true,   //cup will not be started immediately
        spies: {
            "pathSpy": [path, "join"]
        },
        stubs: {
            "readdirSyncStub": [fs, "readdir"]
        },
        pars: {
            readErr: "oh no!"
        },
        before: function () {
            this.stubs.readdirSyncStub.callsArgWithAsync(1, this.pars.readErr);
        },
        after: function () {
            expect(this.spies.pathSpy).to.have.been.called();
            expect(this.stubs.readdirSyncStub).to.have.been.called();
        }
    });

    //then when in the right context we can start the cup, like this:

    describe("start causes cup fakes to be initialized on demand", function () {

        delayedCup.start(); //on demand start

        delayedCup.pour("fakes should not be initialized", function (done) {

            var result = this.spies.pathSpy("a", "b");
            expect(result).to.equal("a/b");

            this.stubs.readdirSyncStub("bla", function (err) {
                expect(err).to.equal(delayedCup.pars.readErr);
                done();
            });
        });
    });

```


### restir()

> Alias: reset

see the [restir global method details](#restirSection)


<a name="cupRequireSection"/>
### require(reqPath, options)

see the [require global method details](#requireSection)


### getStub(name)

### name : String

The name of the instance. can be passed initially to the grind method.

### sb : Sinon.Sandbox

The instance of sinon sandbox used by the cup. This enables the cup restir method to restore all fakes created by the cup automatically.

### pars : Object

All of the parameters (key/val) passed to the cup either during grinding or using the stir method

### spies : Object

The spies created by the cup. Spies are created according to the map passed to the cup during the grinding

### stubs : Object

The stubs created by the cup. Stubs are created according to the map passed to the cup during the grinding

### mocks : Object

The mocks created by the cup. Mocks are created according to the map passed to the cup during the grinding

### required : Object

All of the modules (key/val) that were fake required (using the [Require Mocker]()) by passing requires either during grinding or the stir method
The key used is the same one used to identify the module by its path.

```js

			cup.stir({
               requires: ["./testObjects/foo"] //define the module to fake require
            });

            cup.pour("should be able to test with my faked module", function(){
            	var fakeFoo = cup.required["./testObjects/foo"]; //the module is now available using the required property of the cup
			});

```


<a name="requireMockerSection" />
## Require Mocker

The Mocker lets you require a module using a simple call and it will stub out all of its dependencies (as best it could).
This way you don't need to stub everything yourself but let the magic happen for you.

A typical use of the Mocker is through the [cup.require](#cupRequireSection) method. However,
it is possible to use it directly by using the _RequireMocker_ property of mocha-stirrer.

Here's an example (taken from this [test module](https://github.com/yoavniran/mocha-stirrer/blob/master/test/RequireMocker.standalone.test.js)) -

```js
 
	Mocker = require("mocha-stirrer").RequireMocker;

	var mocker = new Mocker(sinon);  //pass sinon or a sinon sandbox to the mocker

	var foo = mocker.require("./testObjects/foo", {
            dontStub: ["fs"]
        });

    expect(foo).to.exist();
    expect(foo.bar()).to.equal("foo");
    expect(foo.wat("a", "b")).to.not.exist(); //internally path should be stubbed and not set up to return anything
    expect(foo.useSub()).to.not.exist();
    expect(foo.useSubDep("world")).to.not.exist();
    expect(foo.useFuncDep()).to.not.exist();

    var Bar = require("./testObjects/sub/bar");

    expect(Bar.prototype.useDep).to.have.been.calledWith("world");

    mocker.restore(); //make sure to clean up by restoring the stubs

```

You can define a setup function that will be called with the stubbed object as an argument, then you will be able to define
behaviors on its stubs easily.

Mocker will stub all of the module's dependencies by default. You can pass a list of modules you don't wish Mocker to stub.

setup functions
	- relative path to the mock-required module or the absolute path


<a name="requireMockerRequireSection"/>
### require(parent, requirePath, options)

* `parent` - the parent module that is making the mock require - this is normally the test module
* `requirePath` - the module to require, relative to the test module (parent)
<a name="requireMockerRequireOptions"/>
* `options` - additional setup options
                   - dontStub: an array of paths that are required by the module or by its dependencies (defined by `requirePath`) to not stub
                   - setup: object map containing the require path of stubbed dependency and a matching function. the function signature is: fn(stub)
                   - setupContext: the context to pass into the setup method(s)


<a name="stirringSection"/>
## Stirring

Internally, the mocha hooks (mainly the `before` hook) are used extensively to set up the fakes and your own befores/afters/etc.
To use Mocha-Stirrer successfully you should have a good grip of the order of execution of things in Mocha in conjunction with its hooks...

> this section isnt complete yet