/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * @file demo/src/client.js
 * @author leeight
 */

define(function (require) {
    var exports = {};

    var sdk = require('baidubce-sdk');

    var config = require('./config');

    exports.createOCRClient = function () {
        var appcfg = config.get();
        var client = new sdk.OCRClient(appcfg.ocr);
        client.createSignature = function (credentials, httpMethod, path, params, headers) {
            // 修复 Host 的内容
            if (credentials.host) {
                headers.Host = credentials.host;
            }
            var auth = new sdk.Auth(credentials.ak, credentials.sk);
            return auth.generateAuthorization(httpMethod, path, params, headers);
        };
        return client;
    };

    exports.createFaceClient = function () {
        var appcfg = config.get();
        var client = new sdk.FaceClient(appcfg.face);
        client.createSignature = function (credentials, httpMethod, path, params, headers) {
            // 修复 Host 的内容
            if (credentials.host) {
                headers.Host = credentials.host;
            }
            var auth = new sdk.Auth(credentials.ak, credentials.sk);
            return auth.generateAuthorization(httpMethod, path, params, headers);
        };
        return client;
    };

    exports.createInstance = function () {
        var appcfg = config.get();
        if (location.host === 'bs.baidu.com'
            || /\benv=bcs\b/.test(location.search)) {
            var client = new sdk.BcsClient(appcfg.bcs);
            return client;
        }

        var client = new sdk.BosClient(appcfg.bos);

        if (appcfg.mode === 'very-easy') {
            // 用户显示的设置了 ak 和 sk，不需要服务器计算
            if (/\bed=([\w\.]+)\b/.test(location.search)) {
                // 如果 url 参数里面存在 ?ed=1 那么说明是本地开发模式，需要在计算
                // 签名的时候使用真正的Host，而不是当前页面的域名
                client.createSignature = function (credentials, httpMethod, path, params, headers) {
                    // 修复 Host 的内容
                    headers.Host = RegExp.$1;

                    var auth = new sdk.Auth(credentials.ak, credentials.sk);
                    return auth.generateAuthorization(httpMethod, path, params, headers);
                };
            }
            return client;
        }

        // mode === 'easy'
        client.createSignature = function (_, httpMethod, path, params, headers) {
            if (/\bed=([\w\.]+)\b/.test(location.search)) {
                headers.Host = RegExp.$1;
            }

            var deferred = sdk.Q.defer();
            $.ajax({
                // url: 'http://127.0.0.1:1337/ack',
                url: appcfg.ss_url,
                jsonp: 'callback',
                dataType: 'jsonp',
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
                        // TODO(leeight) timeout
                        deferred.reject(new Error('createSignature failed, statusCode = ' + payload.statusCode));
                    }
                }
            });
            return deferred.promise;
        };

        return client;
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
