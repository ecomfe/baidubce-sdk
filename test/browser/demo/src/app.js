/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    var $ = require('jquery');

    var _filters = require('./tpl/filters');
    var uploader = require('./uploader');
    var fileList = require('./file-list');
    var dnd = require('./dnd');

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
        _filters.init();
        uploader.init();
        fileList.init();
        dnd.init();
    };

    return exports;
});
