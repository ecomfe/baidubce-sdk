/**
 * @file app.js
 * @author leeight
 */

define(function (require) {
    var $ = require('jquery');
    var sdk = require('baidubce-sdk');
    var async = require('async');

    var Klient = require('./client');

    var exports = {};

    function handleFileSelect(evt) {
        var files = evt.target.files;
        if (!files.length) {
            return false;
        }

        var file = files[0];
        var partSize = parseInt($('#g_part_size').val(), 10) * 1024 * 1024;
        var chunkCount = Math.ceil(file.size * 1.0 / partSize);

        $('#g_file_size').val(file.size);
        $('#g_chunk_count').val(chunkCount);
        $('#g_progress').val(0);
        $('#g_time').val('0s');
        $('#g_url').html('-');

        if (file.size <= partSize) {
            uploadSingleFile2(file);
        }
        else {
            uploadSuperFile(file);
        }
    }

    function getTasks(file, uploadId) {
        var leftSize = file.size;
        var minPartSize = 5 * 1024 * 1024;
        var offset = 0;
        var partNumber = 1;

        var tasks = [];

        while (leftSize > 0) {
            var partSize = Math.min(leftSize, minPartSize);

            tasks.push({
                file: file,
                uploadId: uploadId,
                partNumber: partNumber,
                partSize: partSize,
                start: offset,
                stop: offset + partSize - 1
            });

            leftSize -= partSize;
            offset += partSize;
            partNumber += 1;
        }

        return tasks;
    }

    function uploadPartFile(state) {
        return function (item, callback) {
            // item.file
            // item.uploadId
            // item.start
            // item.stop
            // item.partNumber
            // item.partSize
            var blob = item.file.slice(item.start, item.stop + 1);
            var client = Klient.createInstance();
            var key = item.file.name;
            var bucket = $('#g_bucket').val();

            client.uploadPartFromBlob(bucket, key, item.uploadId, item.partNumber, item.partSize, blob)
                .then(function (res) {
                    $('#g_progress').val((++state.completed) / state.totalCount);
                    callback(null, res);
                })
                .catch(function (err) {
                    callback(err);
                });
        };
    }

    function uploadSuperFile(file) {
        var startTime = new Date().getTime();

        var client = Klient.createInstance();
        var key = file.name;
        var bucket_name = $('#g_bucket').val();

        var ext = key.split(/\./g).pop();

        // Firefox在POST的时候，Content-Type 一定会有Charset的，因此
        // 这里不管3721，都加上.
        var mimeType = sdk.MimeType.guess(ext) + '; charset=UTF-8';
        var options = {
            'Content-Type': mimeType
        };

        var uploadId = null;
        client.initiateMultipartUpload(bucket_name, key, options)
            .then(function (response) {
                uploadId = response.body.uploadId;

                var deferred = sdk.Q.defer();
                var tasks = getTasks(file, uploadId);
                var state = {
                    completed: 0,
                    totalCount: tasks.length
                };
                var parallel = parseInt($('#g_parallel').val(), 10);
                async.mapLimit(tasks, parallel, uploadPartFile(state), function (err, results) {
                    if (err) {
                        deferred.reject(err);
                    }
                    else {
                        deferred.resolve(results);
                    }
                });
                return deferred.promise;
            })
            .then(function (all_response) {
                var part_list = [];
                all_response.forEach(function (response, index) {
                    part_list.push({
                        partNumber: index + 1,
                        eTag: response.http_headers.etag
                    });
                });

                return client.completeMultipartUpload(bucket_name, key, uploadId, part_list);
            })
            .then(function () {
                $('#g_progress').val(1);
                var url = client.generatePresignedUrl(bucket_name, key);
                $('#g_url').html('<a href="' + url + '" target="_blank">下载地址</a>');
            })
            .catch(function (error) {
                console.error(error);
                $('#g_progress').val(1);
            })
            .fin(function () {
                var endTime = new Date().getTime();
                $('#g_time').html(((endTime - startTime) / 1000) + 's');
            });
    }

    function uploadSingleFile2(file, opt_startByte, opt_stopByte) {
        var startTime = new Date().getTime();

        var client = Klient.createInstance();
        var key = file.name;
        var ext = key.split(/\./g).pop();
        var bucket = $('#g_bucket').val();

        var start = opt_startByte || 0;
        var stop = opt_stopByte || (file.size - 1);
        var blob = file.slice(start, stop + 1);

        var mimeType = sdk.MimeType.guess(ext);
        if (/^text\//.test(mimeType)) {
            mimeType += '; charset=UTF-8';
        }
        var options = {
            'Content-Type': mimeType
        };
        client.on('progress', function (evt) {
            if (evt.lengthComputable) {
                $('#g_progress').val(evt.loaded / evt.total);
            }
        });
        return client.putObjectFromBlob(bucket, key, blob, options)
            .then(function (res) {
                console.log(res);
                $('#g_progress').val(1);
                var url = client.generatePresignedUrl(bucket, key);
                $('#g_url').html('<a href="' + url + '" target="_blank">下载地址</a>');
            })
            .catch(function (err) {
                console.error(err);
            })
            .fin(function () {
                var endTime = new Date().getTime();
                $('#g_time').html(((endTime - startTime) / 1000) + 's');
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
        $('input[type=radio]').on('click', switchMode);
        $('legend.collapse').on('click', toggleLegend);
        $('#g_host').val(location.protocol + '//' + location.host);
    };

    return exports;
});
