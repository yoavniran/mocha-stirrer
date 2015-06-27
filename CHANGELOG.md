### 0.2.1
* fixed issue with stub/spy aliases (available on Cup instance) not consistent between
Windows and Linux/MacOS systems

### 0.2.0
* configuration of requires on cup allows to define an alias that can be used later to retrieve the mock-required module from the cup
* The parent module can now be set either globally or in the grind options
* RequireMocker
    - allows to set mock type globally (stub or spy)
    - allows setting mock type selectively per dependency
    - allows setting the mock type for all of the dependencies 
    - stores a dependency using its name (not path) if its an external module , such as one thats available from NPM
    - Will not affect dependency properties that arent functions
    - Will also mock static methods and not just the prototype's if there are any
    - dontStub is renamed to dontMock in the require options. dontStub is still accepted but is deprecated

moved the restir code that belongs to the stirrer into CupStirrer.js
cloning the config object the cup receives for grind
changed any use of "path" parameter in RequireMocker

### 0.1.10
* fixing bug that fake require isnt repeated when using restirForEach -
moving fake requiring from stirrer to blender so requiring happens in the same flow as stubbing/spying/mocking.

### 0.1.9

* fixed issue - pars werent transformed when using stir'n pour™
* added transformsPars function to cup API

### 0.1.8

* fixed bug - restirForEach doing restir before the conf's afterEach function is executed causing verification cannot be accomplished
* improved debug info

### 0.1.7 - 14/04/2015

* quick release to remove 'idea' folder from being published to npm

### 0.1.6 - 13/04/2015

* added restirForEach grind flag - to reset after each test
* added clear error for stub conf of type function that is invalid
* updated docs with restirForEach
* added the ability to stir and pour in one go = stir'n pour™

### 0.1.5 - 10/04/2015

* added requires to the grind and stir methods
* anytime fake require is used on a cup, the stubs will be added to the stubs map of the cup
* added getStub() method to the cup which allows using aliases to stubs if they were created during a fake require and their id is an absolute path.
* beefed up readme file with much more documentation
* made cup.start() alias to cup.brew()
* cup is now of type Cup
* better breakdown of code into separate modules
* even more tests - coverage at 100%