/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    require('etpl/tpl!./tpl/bos.tpl');
    require('etpl/tpl!./tpl/ocr.tpl');

    var _filters = require('./tpl/filters');
    var uploader = require('./uploader');
    var fileList = require('./file-list');
    var imageViewer = require('./image_viewer');
    // var dnd = require('./dnd');
    var clipboard = require('./clipboard');
    var video = require('./video');
    var crumb = require('./crumb');
    var up = require('./upload_panel');
    var pref = require('./pref');
    var face = require('./face');
    var config = require('./config');
    var router = require('./router');

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
        imageViewer.init();
        // dnd.init();
        clipboard.init();
        video.init();
        crumb.init();
        up.init();
        pref.init();
        face.init();
        router.init();

        var appcfg = config.get();
        var credentials = appcfg.bos.credentials;
        if (!credentials.ak || !credentials.sk) {
            pref.show();
        }
    };

    return exports;
});
