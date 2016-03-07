$(document).ready(function () {
    hljs.initHighlightingOnLoad();

    var sdk = window.baidubceSdk;
    var tokenUrl = 'http://180.76.166.159:1337/ack';
    var bosConfig = {
        //credentials: {
        //    ak: '9fe103ae98de4798aabb34a433a3058b',
        //    sk: 'b084ab23d1ef44c997d10d2723dd8014'
        //},
        endpoint: 'http://bos.bj.baidubce.com'
    };
    var PART_SIZE = 5 * 1024 * 1024; // 分块大小
    var THREADS = 2; // 同时上传的分块数量
    var bucket = 'bce-javascript-sdk-demo-test';
    var $fileList = $('#fileList');

    $('#upload').on('change', function (evt) {
        return (function (evt) {
            var file = evt.target.files[0];
            var client = new sdk.BosClient(_.extend({
                credentials: {
                    ak: '',
                    sk: ''
                }
            }, bosConfig));
            var key = file.name;
            var blob = file;
            var id = +new Date();
            var $row = $('<tr id="' + id + '">' +
                '<td class="file-name">' + key + '</td>' +
                '<td>' + fileSize(blob.size) + '</td>' +
                '<td class="file-detail">' +
                '<div class="progress"><div class="progress-bar progress-bar-success" style="width: 0;"></div></div>' +
                '</td>' +
                '</tr>');
            $row.appendTo($fileList);
            var ext = key.split(/\./g).pop();
            var mimeType = sdk.MimeType.guess(ext);
            mimeType += '; charset=UTF-8';
            var url = client.generateUrl(bucket, key);
            var options = {
                'Content-Type': mimeType
            };

            client.createSignature = function (_, httpMethod, path, params, headers) {
                if (/\bed=([\w\.]+)\b/.test(location.search)) {
                    headers.Host = RegExp.$1;
                }

                var deferred = sdk.Q.defer();
                $.ajax({
                    url: tokenUrl,
                    dataType: 'json',
                    data: {
                        httpMethod: httpMethod,
                        path: path,
                        delay: ~~(Math.random() * 10) + 1,
                        params: JSON.stringify(params || {}),
                        headers: JSON.stringify(headers || {})
                    },
                    success: function (payload) {
                        if (payload.statusCode === 200 && payload.signature) {
                            deferred.resolve(payload.signature, payload.xbceDate);
                        }
                        else {
                            deferred.reject(new Error('createSignature failed, statusCode = ' + payload.statusCode));
                        }
                    }
                });
                return deferred.promise;
            };
            var promise;
            if (blob.size < PART_SIZE) {
                // 小于5M的文件直接上传
                promise = client.putObjectFromBlob(bucket, key, blob, options);
                client.on('progress', function (evt) {
                    client.emit('overallProgress', evt);
                });
            }
            else {
                // 大于5M的文件分块上传
                var uploadId;
                promise = client.initiateMultipartUpload(bucket, key, options)
                    .then(function (response) {
                        uploadId = response.body.uploadId;

                        var deferred = sdk.Q.defer();
                        var tasks = getTasks(blob, uploadId, bucket, key);
                        var state = {
                            lengthComputable: true,
                            loaded: 0,
                            total: tasks.length
                        };
                        async.mapLimit(tasks, THREADS, uploadPartFile(state, client), function (err, results) {
                            if (err) {
                                deferred.reject(err);
                            }
                            else {
                                deferred.resolve(results);
                            }
                        });
                        return deferred.promise;
                    })
                    .then(function (allResponse) {
                        var partList = [];
                        allResponse.forEach(function (response, index) {
                            partList.push({
                                partNumber: index + 1,
                                eTag: response.http_headers.etag
                            });
                        });
                        return client.completeMultipartUpload(bucket, key, uploadId, partList);
                    });
            }
            client.on('overallProgress', function (evt) {
                if (evt.lengthComputable) {
                    var width = (evt.loaded / evt.total) * 100;
                    $row.find('.progress-bar').css('width', width + '%')
                        .text(width.toFixed(2) + '%');
                }
            });
            promise.then(function (res) {
                    toastr.success('上传成功');
                    $row.find('.file-detail').html('下载地址: <a href="' + url + '" target="_blank">' + url + '</a>');
                    if (/image/.test(mimeType)) {
                        $row.find('.file-name').html('<figure>' +
                            '<figcaption>' + key + '</figcaption>' +
                            '<img class="img-thumbnail" src="' + url + '"/>' +
                            '<a href="javascript:void 0;" class="btn btn-link showEdit" data-key="' + key + '">处理图片</a>' +
                            '</figure>');
                    }
                })
                .catch(function (err) {
                    toastr.error('上传失败');
                    console.error(err);
                });

            $row.on('click', '.showEdit', function (e) {
                window.client = client;
                $('#edit').modal();
                var key = $(e.target).attr('data-key');
                updateImage(client.generateUrl(bucket, key));
                $('#process').attr('data-key', key);
            });
        })(evt);
    });

    var $textWatermarkPosition = $('#textWatermarkPosition');
    var $pictureWatermarkPosition = $('#pictureWatermarkPosition');
    var $width = $('#width');
    var $height = $('#height');
    var $angle = $('#angle');
    $('#process').click(function () {
        var pipeline = [];
        if (+$textWatermarkPosition.val() > 0) {
            pipeline.push({
                watermark: 2,
                gravity: $textWatermarkPosition.val(),
                text: '55m+5bqm5byA5pS+5LqR'
            });
        }
        if (+$pictureWatermarkPosition.val() > 0) {
            pipeline.push({
                watermark: 1,
                gravity: $pictureWatermarkPosition.val(),
                key: 'bG9nbzJ4LnBuZw=='
            });
        }
        if ($width.val() || $height.val() || $angle.val()) {
            if ($width.val() && $height.val()) {
                pipeline.push({
                    scale: 1,
                    width: $width.val(),
                    height: $height.val(),
                    angle: $angle.val() || 0
                });
            }
            else if ($width.val()) {
                pipeline.push({
                    width: $width.val(),
                    angle: $angle.val() || 0
                });
            }
            else if ($height.val()) {
                pipeline.push({
                    height: $height.val(),
                    angle: $angle.val() || 0
                });
            }
            else {
                pipeline.push({
                    angle: $angle.val() || 0
                });
            }
        }
        updateImage(client.generateUrl(bucket, $('#process').attr('data-key'), pipeline));
    });

    function updateImage(src) {
        $('.image-link').prop('href', src);
        var $img = $('.preview').prop('src', './loading.gif');
        var img = new Image();
        img.src = src;
        img.onload = function () {
            $img.prop('src', src);
        };
    }

    function fileSize(num) {
        num = +num;
        var unit = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB'];
        var index = 0;
        while (num > 1024) {
            num = num / 1024;
            index++;
        }
        return num.toFixed(1) + unit[index];
    }

    function getTasks(file, uploadId, bucketName, key) {
        var leftSize = file.size;
        var offset = 0;
        var partNumber = 1;

        var tasks = [];

        while (leftSize > 0) {
            var partSize = Math.min(leftSize, PART_SIZE);
            tasks.push({
                file: file,
                uploadId: uploadId,
                bucketName: bucketName,
                key: key,
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

    function uploadPartFile(state, client) {
        return function (task, callback) {
            var blob = task.file.slice(task.start, task.stop + 1);
            client.uploadPartFromBlob(task.bucketName, task.key, task.uploadId, task.partNumber, task.partSize, blob)
                .then(function (res) {
                    ++state.loaded;
                    client.emit('overallProgress', state);
                    callback(null, res);
                })
                .catch(function (err) {
                    callback(err);
                });
        };
    }

});
