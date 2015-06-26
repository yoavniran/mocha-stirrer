/* jshint ignore:start */
function InstanceType(){

}

InstanceType.prototype.getValue = function(){
  return "value";
};

module.exports = new InstanceType();
/* jshint ignore:end */