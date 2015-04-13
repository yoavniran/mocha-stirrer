/* jshint strict: false */

require("../lib");  //sets the base for coverage - require all the codes

require("./utils.test");


require("./cupStirrer.test");
require("./pourer.test");
require("./cupBlender.test");


require("./stirrer.basics.test");
require("./stirrer.delay.test");
require("./stirrer.test");


require("./RequireMocker.test");
require("./RequireMocker.standalone.test");