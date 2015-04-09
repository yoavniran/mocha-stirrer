### 0.1.5

* added requires to the grind and stir methods
* anytime fake require is used on a cup, the stubs will be added to the stubs map of the cup
* added getStub() method to the cup which allows using aliases to stubs if they were created during a fake require and their id is an absolute path.
* beefed up readme file with much more documentation
* made cup.start() alias to cup.brew()
* cup is now of type Cup
* better breakdown of code into separate modules
* even more tests - coverage at 100%