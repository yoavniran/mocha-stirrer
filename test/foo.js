var path = require("path");

module.exports = {

    bar: function () {
        return "foo";
    },
    wat: function (a, b) {
        return path.join(a, b);
    }

};

