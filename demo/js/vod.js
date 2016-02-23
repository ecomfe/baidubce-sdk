$(document).ready(function () {
    hljs.initHighlightingOnLoad();

    var sdk = window.baidubceSdk;
    var bosConfig = {
        credentials: {
            ak: '3e50573ecad74f1e8032b1c8a1c43265',
            sk: '3c81cdfbf6d34a6d8c5ec520ca77beba'
        },
        endpoint: 'http://bos.bj.baidubce.com'
    };
    var vodConfig = {
        credentials: {
            ak: '3e50573ecad74f1e8032b1c8a1c43265',
            sk: '3c81cdfbf6d34a6d8c5ec520ca77beba'
        },
        endpoint: 'http://vod.baidubce.com'
    };

    var $fileList = $('#fileList');
    var vodClient = new sdk.VodClient(vodConfig, bosConfig);

    function updateList() {
        vodClient.listMediaResource().then(function (data) {
            var html = "";
            if (data && data.body && data.body.medias) {
                for (var i = 0; i < data.body.medias.length; i++) {
                    var media = data.body.medias[i];
                    html += '<tr data-id="' + media.mediaId + '">' +
                        '<td>' + media.attributes.title + '</td>' +
                        '<td>' + media.attributes.description + '</td>' +
                        '<td>' +
                        '<a href="javascript:void 0;" class="btn link-btn delete">删除</a>' +
                        '<a href="javascript:void 0;" class="btn link-btn url">获取视频地址</a>' +
                        '<a href="javascript:void 0;" class="btn link-btn code">获取播放代码</a>' +
                        '</td></tr>'
                }
            }
            $fileList.html(html);
        }).catch(function (err) {
            toastr.error('请求失败');
        });
    }

    updateList();
    $('#upload').on('change', function (evt) {
        var file = evt.target.files[0];
        vodClient.createMediaResource(file.name, '测试文件', file).then(function () {
            toastr.success('上传成功');
            updateList();
        }).catch(function (err) {
            toastr.error('上传失败');
        });
    });

    $fileList.on('click', '.delete', function (e) {
        var mediaId = $(e.target).closest('tr').attr('data-id');
        vodClient.deleteMediaResource(mediaId).then(function () {
            toastr.success('删除成功');
            updateList();
        }).catch(function (err) {
            toastr.error('删除失败');
        });
    });
    $fileList.on('click', '.url', function (e) {
        var mediaId = $(e.target).closest('tr').attr('data-id');
        vodClient.getPlayableUrl(mediaId).then(function (data) {
            if (data.body.result.cover) {
                $('#cover').html('<img src="' + data.body.result.cover + '" />');
            }
            else {
                $('#cover').text('无封面');
            }
            $('#file').text(data.body.result.file);
            $('#url').modal();
        }).catch(function (err) {
            toastr.error('请求失败');
        });
    });

    $fileList.on('click', '.code', function (e) {
        var mediaId = $(e.target).closest('tr').attr('data-id');
        vodClient.getPlayerCode(mediaId, 800, 600, true).then(function (data) {
            var html = '';
            for (var i = 0; i < data.body.codes.length; i++) {
                var code = data.body.codes[i];
                if (code.codeType !== 'url') {
                    code.codeType += '(base64 encoded)';
                }
                html += '<div class="panel panel-info">' +
                    '<div class="panel-heading">' + code.codeType + '</div>' +
                    '<div class="panel-body"><pre>' + code.sourceCode + '</pre></div>' +
                    '</div>'
            }
            $('#codeList').html(html);
            $('#code').modal();
        }).catch(function (err) {
            toastr.error('请求失败');
        });
    });

});
