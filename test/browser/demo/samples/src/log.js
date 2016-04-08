define(function (require) {
    var $ = require('jquery');

    var exports = {};

    exports.error = function (object) {
        $('#log').html(JSON.stringify(object, null, 2)).attr('class', 'error');
    };

    exports.debug = function (object) {
        $('#log').html(JSON.stringify(object, null, 2)).attr('class', 'debug');
    };

    return exports;
});
