/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    var _filters = require('./tpl/filters');
    var uploader = require('./uploader');
    var fileList = require('./file-list');
    var dnd = require('./dnd');
    var clipboard = require('./clipboard');
    var video = require('./video');
    var crumb = require('./crumb');
    var up = require('./upload_panel');

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
        clipboard.init();
        video.init();
        crumb.init();
        up.init();
    };

    return exports;
});
