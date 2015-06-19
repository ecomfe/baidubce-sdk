/**
 * @file crumb.js
 * @author leeight
 */

define(function (require) {
    var config = require('./config');

    var exports = {};

    function updateCrumb() {
        var opts = config.getOptions();
        var bucketName = opts.bucketName;
        if (!bucketName) {
            $('#upload').attr('disabled', true);
            $('.crumb').html('<a href="#"><i class="fa fa-home"></i> 根目录</a>');
        }
        else {
            $('#upload').attr('disabled', false);
            var paths = [];
            paths.push({
                path: '#/' + bucketName,
                text: config.kWorkGroupMap[bucketName] || bucketName
            });

            var dirs = opts.prefix.split('/');
            var path = '#/' + bucketName;
            for (var i = 0; i < dirs.length; i ++) {
                var dir = dirs[i];
                if (dir) {
                    path += '/' + dir;
                    paths.push({
                        path: path,
                        text: dir
                    });
                }
            }

            var html = [];
            var l = paths.length;
            for (i = 0; i < l; i ++) {
                var item = paths[i];
                if ((i + 1) === l) {
                    html.push('<strong>' + item.text + '</strong>');
                }
                else {
                    html.push('<a href="' + item.path + '">' + item.text + '</a>');
                }
            }
            $('.crumb').html('<a href="#"><i class="fa fa-home"></i> 根目录</a> &raquo; ' + html.join(' &raquo; '));
        }
    };

    exports.init = function () {
        $(window).on('hashchange', updateCrumb);
        updateCrumb();
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
