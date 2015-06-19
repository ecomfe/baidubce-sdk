/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    var async = require('async');

    var Klient = require('./client');
    var helper = require('./helper');
    var config = require('./config');
    var fileList = require('./file-list');
    var up = require('./upload_panel');
    var log = require('./log');

    var exports = {};

    function handleFileSelect(evt) {
        var files = evt.target.files;
        if (!files.length) {
            return false;
        }

        up.show();
        var items = up.addFiles(files);
        async.eachLimit(items, 1, upload, function (err) {
            if (err) {
                log.exception(err);
            }
        });
    }

    function addDirectory() {
        var name = prompt('请输入文件夹的名字：');
        if (!name) {
            return;
        }

        var client = Klient.createInstance();

        var opts = config.getOptions();
        var bucketName = opts.bucketName;
        if (!bucketName) {
            client.createBucket(name)
                .then(function (response) {
                    log.ok('文件夹『' + name + '』创建成功');
                    fileList.refresh();
                })
                .catch(function (error) {
                    log.exception(error);
                });
            return;
        }
        var key = opts.prefix + name + '/';
        var file = new Blob([]);

        helper.upload(bucketName, key, file, null, client)
            .then(function () {
                log.ok('文件夹『' + name + '』创建成功');
            })
            .catch(function (error) {
                log.exception(error);
            })
            .fin(function () {
                fileList.refresh();
            });
    }

    function upload(item, callback) {
        var uuid = item.uuid;
        var file = item.file;
        var chunkCount = Math.ceil(file.size * 1.0 / config.kMinFileSize);

        $('#g_file_size').val(file.size);
        $('#g_chunk_count').val(chunkCount);

        var client = Klient.createInstance();
        var key = file.name;
        var opts = config.getOptions();
        var bucketName = opts.bucketName;
        key = opts.prefix + key;

        client.on('bosprogress', function (evt) {
            if (evt.lengthComputable) {
                up.progress(uuid, evt.loaded / evt.total);
            }
        });
        helper.upload(bucketName, key, file, null, client)
            .then(function () {
                up.progress(uuid, 1);
                // var url = client.generatePresignedUrl(bucketName, key);
            })
            .catch(function (error) {
                up.progress(uuid, 1);
                callback(error);
                log.exception(error);
            })
            .fin(function () {
                fileList.refresh();
                callback(null);
            });
    }

    function switchMode() {
        var mode = getCurrentMode();

        $('tr').each(function () {
            if (this.className !== '') {
                $(this).hide();
            }
        });
        $('tr.' + mode).show();
    }

    function getCurrentMode() {
        var mode = $('input[type=radio]:checked').val();
        return mode;
    }

    function toggleLegend() {
        if ($(this).hasClass('collapse')) {
            $(this).parent().find('table').show();
            $(this).html('高级参数配置[-]');
            $(this).attr('class', 'expand');
        }
        else {
            $(this).parent().find('table').hide();
            $(this).html('高级参数配置[+]');
            $(this).attr('class', 'collapse');
        }
    }

    exports.init = function () {
        $('#file').on('change', handleFileSelect);
        $('#upload').on('click', function (e) {
            $('#file').click();
        });
        $('#addDirectory').on('click', function (e) {
            addDirectory();
        });
        $('input[type=radio]').on('click', switchMode);
        $('legend.collapse').on('click', toggleLegend);
        $('#g_host').val(
            location.protocol === 'file:'
            ? 'http://10.105.97.15'
            : location.protocol + '//' + location.host);
    };

    return exports;
});
