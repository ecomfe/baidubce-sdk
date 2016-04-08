/**
 * @file sdk.js
 * @author leeight
 */

define(function (require) {
    var sdk = require('baidubce-sdk');
    var u = require('underscore');

    var helper = require('./helper');

    var kQueryString = getQueryString();

    var exports = {};

    var events = {
        READY: 'ready',
        FILE_CHANGE: 'fileChange',
        UPLOAD_SUCCESS: 'uploadSuccess',
        UPLOAD_FAILURE: 'uploadFailure',

        UPLOAD: 'upload'
    };

    function fire(type, data) {
        if (window === top) {
            return;
        }

        parent.postMessage({
            type: type,
            data: data
        }, '*');
    }


    /**
     * 处理父页面发送过来的信息.
     */
    function handlePostMessage (evt) {
        var originalEvent = evt.originalEvent;
        var payload = originalEvent.data;

        var type = payload.type;
        var data = payload.data;

        if (type === events.UPLOAD) {
            var client = getClient();
            var blob = $('#file').get(0).files[0];
            $('#file').attr('disabled', true);
            helper.upload(data.bucketName, data.objectName, blob, {}, client)
                .then(function (response) {
                    fire(events.UPLOAD_SUCCESS, response);
                })
                .catch(function (error) {
                    fire(events.UPLOAD_FAILURE, error);
                })
                .fin(function () {
                    $('#file').attr('disabled', false);
                });
        }
    }

    function getClient() {
        var client = new sdk.BosClient(getConfig());

        // 用户显示的设置了 ak 和 sk，不需要服务器计算
        if (kQueryString['ed']) {
            // 如果 url 参数里面存在 ?ed=1 那么说明是本地开发模式，需要在计算
            // 签名的时候使用真正的Host，而不是当前页面的域名
            client.createSignature = function (credentials, httpMethod, path, params, headers) {
                // 修复 Host 的内容
                headers.Host = kQueryString['ed'];

                var auth = new sdk.Auth(credentials.ak, credentials.sk);
                return auth.generateAuthorization(httpMethod, path, params, headers);
            };
        }

        return client;
    }

    function getConfig() {
        return JSON.parse(decodeURIComponent(kQueryString['config']));
    }

    function getQueryString() {
        return u.object(location.search.substr(1).split('&').map(function (item) {
            var chunks = item.split('=', 2);
            return [chunks[0], chunks[1]];
        }));
    }

    function handleFileChange (evt) {
        fire(events.FILE_CHANGE, evt.target.files);
    }

    exports.start = function () {
        $(window).on('message', handlePostMessage);
        $('#file').on('change', handleFileChange);

        fire(events.READY);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
