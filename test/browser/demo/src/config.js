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
 * @file demo/src/config.js
 * @author leeight
 */

define(function (require) {
    var store = require('store');

    var router = require('./router');

    var exports = {};

    // 分片上传的时候，并行的请求数目（带宽有限的情况下，太多了也没啥用）
    exports.kParallel = 2;

    // 超过了 5M 就需要分片上传（这个不是 BOS 的限制，而是我自己定义的逻辑）
    exports.kMinFileSize = 5 * 1024 * 1024;

    exports.kWorkGroupMap = {
        'group-0': '零号工作组',
        'group-1': '一号工作组',
        'group-2': '二号工作组',
        'group-3': '三号工作组',
        'group-4': '四号工作组',
        'group-5': '五号工作组',
        'group-6': '六号工作组'
    };

    // file-${type}-o
    exports.kType2Exts = {
        excel: ['xls', 'xlsx'],
        word: ['doc', 'docx'],
        powerpoint: ['ppt', 'pptx'],
        image: ['jpg', 'jpeg', 'gif', 'png', 'psd'],
        audio: ['wav', 'aac'],
        archive: ['zip', 'tgz', 'tar', 'rar', 'tar.gz', 'gz', '7z'],
        video: ['rm', 'rmvb', 'mp4', 'avi', 'flv', 'mpg', 'webm'],
        pdf: ['pdf'],
        code: ['js', 'css', 'html', 'htm', 'h', 'cpp', 'java', 'txt', 'cs', 'ts']
    };

    /**
     * @return {{bucket:string, prefix:string}}
     */
    exports.getOptions = function () {
        var match = /#\/([^\/]+)((\/[^\/]+)+)?/.exec(router.getPath());
        var bucketName = match ? match[1] : null;
        var prefix = (match ? match[2] : '') || '';

        if (prefix && prefix[0] === '/') {
            prefix = prefix.substr(1);
        }
        if (prefix && !/\/$/.test(prefix)) {
            prefix = prefix + '/';
        }

        return {bucketName: bucketName, prefix: prefix};
    };

    exports.get = function () {
        var config = {
            bos: {
                // 10.105.97.15
                endpoint: '/-/bos.bj.baidubce.com',
                credentials: {
                    ak: store.get('ak') || '',
                    sk: store.get('sk') || '',
                    host: 'bos.bj.baidubce.com'
                }
            },
            bcs: {
                endpoint: '/-/bs.baidu.com',
                credentials: {
                    ak: store.get('ak') || '',
                    sk: store.get('sk') || '',
                    host: 'bs.baidu.com'
                },
            },
            ocr: {
                endpoint: '/-/ocr.bj.baidubce.com',
                credentials: {
                    ak: store.get('ak') || '',
                    sk: store.get('sk') || '',
                    host: 'ocr.bj.baidubce.com'
                }
            },
            face: {
                endpoint: '/-/face.bj.baidubce.com',
                // endpoint: '/-/nmg02-bce-test15.nmg02.baidu.com:8750',
                credentials: {
                    ak: store.get('ak') || '',
                    sk: store.get('sk') || '',
                    host: 'face.bj.baidubce.com',
                    // host: 'nmg02-bce-test15.nmg02.baidu.com:8750'
                }
            },
            ss_url: $('#g_ss_url').val(),
            mode: $('input[type=radio]:checked').val()
        };

        return config;
    };

    return exports;
});









/* vim: set ts=4 sw=4 sts=4 tw=120: */
