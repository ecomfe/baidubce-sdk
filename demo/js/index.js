$(document).ready(function () {
    var sdk = window.baidubceSdk;
    var tokenUrl = 'http://180.76.166.159/:1337/ack';
    var bosConfig = {
        //credentials: {
        //    ak: '9fe103ae98de4798aabb34a433a3058b',
        //    sk: 'b084ab23d1ef44c997d10d2723dd8014'
        //},
        endpoint: 'http://bos.bj.baidubce.com'
    };
    var client = new sdk.BosClient(_.extend({credentials: {ak: '', sk: ''}}, bosConfig));
    var bucket = 'bce-javascript-sdk-demo-test';
    var $fileList = $('#fileList');

    $('#upload').on('change', function (evt) {
        var file = evt.target.files[0];

        var key = file.name;
        var blob = file;
        var id = +new Date();
        var $row = $('<tr id="' + id + '">' +
            '<td class="file-name">' + key + '</td>' +
            '<td>' + blob.size + '</td>' +
            '<td class="file-detail">' +
            '<div class="progress"><div class="progress-bar progress-bar-success" style="width: 0;"></div></div>' +
            '</td>' +
            '</tr>');
        $row.appendTo($fileList);
        var ext = key.split(/\./g).pop();
        var mimeType = sdk.MimeType.guess(ext);
        if (/^text\//.test(mimeType)) {
            mimeType += '; charset=UTF-8';
        }
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
                        console.log('done')
                        deferred.resolve(payload.signature, payload.xbceDate);
                    }
                    else {
                        // TODO(leeight) timeout
                        deferred.reject(new Error('createSignature failed, statusCode = ' + payload.statusCode));
                    }
                }
            });
            return deferred.promise;
        };
        var promise = client.putObjectFromBlob(bucket, key, blob, options);
        client.on('progress', function (evt) {
            if (evt.lengthComputable) {
                var width = (evt.loaded / evt.total) * 100;
                $row.find('.progress-bar').css('width', width + '%')
                    .text(width + '%');
            }
        });
        promise.then(function (res) {
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
                console.error(err);
            });

    });

    var $textWatermark = $('#textWatermark');
    var $textWatermarkPosition = $('#textWatermarkPosition');
    var $pictureWatermarkPosition = $('#pictureWatermarkPosition');
    var $width = $('#width');
    var $height = $('#height');
    var $angle = $('#angle');
    $('#process').click(function () {
        var pipeline = [];
        if ($textWatermark.val() && +$textWatermarkPosition.val() > 0) {
            pipeline.push({
                watermark: 2,
                gravity: $textWatermarkPosition.val(),
                text: $textWatermark.val()
            });
        }
        if (+$pictureWatermarkPosition.val() > 0) {
            pipeline.push({
                watermark: 1,
                gravity: $pictureWatermarkPosition.val(),
                key: '%E5%BC%80%E6%94%BE%E4%BA%91logo%281%29.png'
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
        }
    }

    $fileList.on('click', '.showEdit', function (e) {
        $('#edit').modal();
        var key = $(e.target).attr('data-key');
        updateImage(client.generateUrl(bucket, key));
        $('#process').attr('data-key', key);
    });
});
