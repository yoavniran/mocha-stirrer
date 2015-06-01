function InstanceType(){
}

InstanceType.prototype.getValue = function(par){
  return "value";
};

module.exports = new InstanceType();