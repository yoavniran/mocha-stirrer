[![Coverage Status](https://coveralls.io/repos/yoavniran/mocha-stirrer/badge.svg?branch=master)](https://coveralls.io/r/yoavniran/mocha-stirrer?branch=master)
[![Build Status](https://travis-ci.org/yoavniran/mocha-stirrer.svg?branch=master)](https://travis-ci.org/yoavniran/mocha-stirrer)
[![Dependencies](https://david-dm.org/yoavniran/mocha-stirrer.svg)]((https://david-dm.org/yoavniran/mocha-stirrer.svg))
[![devDependency Status](https://david-dm.org/yoavniran/mocha-stirrer/dev-status.svg)](https://david-dm.org/yoavniran/mocha-stirrer#info=devDependencies)
[![Codacy Badge](https://www.codacy.com/project/badge/12374261d28a40a5b05054d5b78c783b)](https://www.codacy.com/app/yoavniran/mocha-stirrer)
[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

# Mocha Stirrer

**_Easily mock and set up tests for Mocha and Sinon_**

A useful utility for using sinon in a friendlier way that allows you to describe the objects and functions you wish
 to spy/stub/mock. Stirrer gives you a way to declare your setup upfront and re-use it between tests so you can write
 them once and then run every test.

A big benefit of Stirrer is that the set up of mocks is made easier and the cleanup is taken care of for you.

The aim of this utility is to allow you to write as little as set up code as possible focusing on the test cases themselves.

The **[`RequireMocker`](#requireMockerSection)** that is part of this package is a strong tool that can be used on its own
or as part of the stirrer functionality. Read more about it [below](#requireMockerSection).

> _Mocha Stirrer supports only node.js development currently and will not work in the browser_

___

## Example

Below is a full example showing how Stirrer can be used to set up ([grind](#grindSection)) a test and then run a test ([pour](#pourSection)))
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

<a name="docsSection"/>
## Stirrer API

<a name="grindSection"/>
### grind(conf, testFn)

> Alias: create

Creates a **[Cup](#cupSection)**  instance.

_conf_ is an object that configures the cup instance. The following properties can be passed in:

* `name` - (optional) any string that will be used for naming mocha hooks
* `pars` - (optional) object map or function that returns an object map. Used to pass parameters in that are stored and can be used between tests
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

* `transform` - (optional) function receives the currently assigned parameters to the cup instance (cup.pars). If provided, transform
will be run every time the cup setup logic is executed which, unless the setupImmediate flag is set to true, will be during the before
 or beforeEach hook

* `before` - (optional) a function that will be called before ([mocha hooks](http://mochajs.org/#hooks)) tests are run within a describe/context block
receives a reference to the cup (first argument) and a reference to the done callback. Very similarly to Mocha, if you define a
second parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `after` - (optional)  a function that will be called after ([mocha hooks](http://mochajs.org/#hooks)) tests ran within a describe/context block
receives a reference to the cup (first argument) and a reference to the done callback. Very similarly to Mocha, if you define a
second parameter Stirrer will assume you need it and you will have to call _done();_ in your method or your test will fail
with a timeout error

* `beforeEach` - (optional)

* `sandbox` - (optional) an object with properties to configure the internal [sinon sandbox](http://sinonjs.org/docs/#sandbox) object Stirrer creates.

* `transformForEach` - (optional, default: false) when set to true determines whether the supplied (pars) transform function
should be run as part of a beforeEach hook. When false will run as part of a before hook

* `setupImmediate` - (optional, default: false) makes the stirrer run its set up logic immediately during the execution of the grind method.
Also, the setup logic will only be executed once - this is good for a standalone cup that will not be reused between tests.
If left as false, the setup will happen during the first before or beforeEach hook prior to a test being executed.

* `dontRestir` - (optional, default: false) (see [restir](#restirSection)) will prevent the cup from being "restirred" (reset) in the
after or afterEach hook

* `requires` - (optional)

* `befores` - (optional)

* `afters` - (optional)

_testFn_

A test function to be run immediately with the cup object. Provides a shortcut to calling _pour(...)_ on the cup object.


<a name="restirSection"/>
### restir(cup)

> Alias: reset

### require(cup)

### Mocker

### EMPTY

___

<a name="cupSection" />
## The Cup

```js

	var stirrer = require("mocha-stirrer");

    var cup = stirrer.grind({});
```

### stir(conf)


	`pars` -

	`befores` - array of methods or a single method to be executed before each test. whether a series of before methods is passed
	in an array or if its a single method, each method receives a '_next_' function reference as a parameter which it must call.
	Failing to call next() will cause timeouts as the flow will not progress


	`afters` - array of methods or a single method to be executed after each test. whether a series of before methods is passed
             	in an array or if its a single method, each method receives a '_next_' function reference as a parameter which it must call.
             	Failing to call next() will cause timeouts as the flow will not progress


<a name="pourSection"/>
###pour
> Alias: test

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

		done(); //make sure tal call done so Mocha doesnt timeout
	});

```

If you want to use Mocha's '_it_' you can call pour like this:

```js

	cup.pour.wrap("my test", function(){
	    //now its up to you to use Mocha's it:
		//still true: this === cup

	    it("this is actually my test now", function(){
	    });
	});

```



### restir()

### require(path, setupFn, options)

### name : String

### sb : Sinon.Sandbox

### pars : Object

Calling grind on stirrer creates an instance of _cup_. You can reuse a cup instance between tests easily using the _pour_ method.


```js

	var cup = stirrer.grind({});

	describe("my test", function(){

		cup.pour(function(){

			it("should do something", function(){


			});
		});
	});

```



<a name="requireMockerSection" />
## Require Mocker

The Mocker lets you require a module using a simple call and it will stub out all of its dependencies (as best it could).
This way you don't need to stub everything yourself but let the magic happen for you.

You can define a setup function that will be called with the stubbed object as an argument, then you will be able to define
behaviors on its stubs easily.

Mocker will stub all of the module's dependencies by default. You can pass a list of modules you don't wish Mocker to stub.

###

```js

  var a = {};
```


more soon...