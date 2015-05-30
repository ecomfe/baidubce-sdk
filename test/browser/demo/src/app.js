/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    var $ = require('jquery');

    var uploader = require('./uploader');

    var exports = {};

    function isSupportedFileAPI() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            return true;
        }

        return false;
    }

    exports.start = function () {
        if (!isSupportedFileAPI()) {
            $('.warning').show();
        }
        uploader.init();
    };

    return exports;
});
