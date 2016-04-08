define(function (require) {
    var sdk = require('baidubce-sdk');
    var $ = require('jquery');

    var log = require('./log');

    var MAX_FILE_SIZE = 5 * 1024 * 1204;

    var exports = {};

    exports.start = function () {
        $('#file').on('change', function (e) {
            var file = e.target.files[0];
            if (file.size > MAX_FILE_SIZE) {
                alert('文件大小不能超过5M.');
                return;
            }

            var bucket = $('#bucket').val().trim();
            var ak = $('#ak').val().trim();
            var sk = $('#sk').val().trim();

            if (!bucket || !ak || !sk) {
                alert('请输入 bucket, ak, sk');
                return;
            }

            var client = new sdk.BosClient({
                endpoint: 'http://bos.bj.baidubce.com',
                credentials: {
                    ak: ak,
                    sk: sk
                }
            });
            client.putObjectFromBlob(bucket, file.name, file)
                .then(function (response) {
                    log.debug(response);
                    var url = client.generatePresignedUrl(bucket, file.name);
                    $('#url').html('<a href="' + url + '" target="_blank">下载</a>');
                })
                .catch(function (error) {
                    log.error(error);
                });
        });

        fetch(require.toUrl('./basic.js'))
            .then(function (res) {
                return res.text();
            })
            .then(function (code) {
                $('#code').text(code);
            });
    };

    return exports;
});
