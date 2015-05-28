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
 */

define(function (require) {
    var sdk = require('baidubce-sdk.bundle');
    var config = {
        credentials: {
            ak: '46bd9968a6194b4bbdf0341f2286ccce',
            sk: 'ec7f4e0174254f6f9020f9680fb1da9f'
        },
        endpoint: 'http://10.105.97.15'
    };

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 1000;

    describe('baidubce-sdk', function () {
        it('generateAuthorization', function () {
            var auth = new sdk.Auth(config.credentials.ak, config.credentials.sk);
            var httpMethod = 'POST';
            var path = '/v1/leeight/2.txt';
            var params = {uploads: ''};
            var headers = {
                'Connection': 'close',
                'Content-Length': 0,
                'Content-Type': 'text/plain',
                'Host': '10.105.97.15',
                'User-Agent': 'bce-sdk-nodejs/0.0.6/undefined/undefined',
                'x-bce-date': '2015-05-28T03:35:23Z'
            };
            var timestamp = 1432784755;
            var signature = auth.generateAuthorization(httpMethod, path, params, headers, timestamp);
            expect(signature).toEqual('bce-auth-v1/46bd9968a6194b4bbdf0341f2286ccce/2015-05-28T03:45:55Z/1800/content-length;content-type;host;x-bce-date/b7ab499d661899ffa2d8a1ff64edb61f3ab971b95f8cc75120a7cd4fd10389e8');
        });

        it('putObject', function (done) {
            var client = new sdk.BosClient(config);

            var bucket = 'leeight';
            var key = '1.txt';
            // data:text/plain;base64
            var text = (Math.random() * Number.MAX_VALUE).toString(16);
            var dataUrl = btoa(text);
            var options = {'Content-Type': 'text/plain'};
            client.putObjectFromDataUrl(bucket, key, dataUrl, options)
                .then(function () {
                    var url = client.generatePresignedUrl(bucket, key) + '&.timestamp=' + Date.now();
                    return $.get(url);
                })
                .then(function (data) {
                    expect(data).toEqual(text);
                })
                .catch(fail)
                .fin(done);
        });

        it('initiateMultipartUpload(simple)', function (done) {
            var client = new sdk.BosClient(config);

            var bucket = 'leeight';
            var key = '2.txt';
            var uploadId = null;
            var options = {
                'Content-Type': 'text/plain; charset=UTF-8'
            };
            client.initiateMultipartUpload(bucket, key, options)
                .then(function (response) {
                    uploadId = response.body.uploadId;
                    expect(uploadId).not.toBe(undefined);
                })
                .then(function (p1) {
                    // 如果只有一个 Part 的话，体积可以小于 5M
                    // uploadPartFile(1)
                    var partNumber = 1;
                    var partSize = 28;
                    var dataUrl = '5L2g5aW977yM5LiW55WMKGhlbGxvIHdvcmxkKQ==';
                    return client.uploadPartFromDataUrl(bucket, key, uploadId,
                        partNumber, partSize, dataUrl);
                })
                .then(function (response) {
                    var partList = [
                        {
                            partNumber: 1,
                            eTag: response.http_headers.etag
                        }
                    ];

                    return client.completeMultipartUpload(bucket, key, uploadId, partList);
                })
                .then(function () {
                    return $.get(client.generatePresignedUrl(bucket, key));
                })
                .then(function (data) {
                    expect(data).toEqual('你好，世界(hello world)');
                })
                .catch(fail)
                .fin(done);
        });

        it('initiateMultipartUpload(complex)', function (done) {
            var client = new sdk.BosClient(config);

            var bucket = 'leeight';
            var key = '2.txt';
            var uploadId = null;
            var options = {
                'Content-Type': 'text/plain; charset=UTF-8'
            };
            client.initiateMultipartUpload(bucket, key, options)
                .then(function (response) {
                    uploadId = response.body.uploadId;
                    expect(uploadId).not.toBe(undefined);
                })
                .then(function () {
                    // uploadPartFile(1)
                    // var b = new Buffer(5 * 1024 * 1024);
                    // b.toString('base64')
                    var partNumber = 1;
                    var partSize = 5 * 1024 * 1024 + 1;
                    var dataUrl = new Array(6990508 + 1).join('A') + '=';
                    return client.uploadPartFromDataUrl(bucket, key, uploadId,
                        partNumber, partSize, dataUrl);
                })
                .then(function (p1) {
                    // uploadPartFile(2)
                    var partNumber = 2;
                    var partSize = 28;
                    var dataUrl = '5L2g5aW977yM5LiW55WMKGhlbGxvIHdvcmxkKQ==';
                    return client.uploadPartFromDataUrl(bucket, key, uploadId,
                        partNumber, partSize, dataUrl).then(function (p2) {
                        expect(p1.http_headers.etag).toEqual('8ab420d03f1bad39feb6b4794f695e88');
                        expect(p2.http_headers.etag).toEqual('7fbabe5283ea825cc522da88f787fd28');
                        return [p1, p2];
                    });
                })
                .then(function (allResponses) {
                    var partList = [];
                    for (var i = 0; i < allResponses.length; i ++) {
                        partList.push({
                            partNumber: i + 1,
                            eTag: allResponses[i].http_headers.etag
                        });
                    }

                    return client.completeMultipartUpload(bucket, key, uploadId, partList);
                })
                .then(function () {
                    return $.get(client.generatePresignedUrl(bucket, key));
                })
                .then(function (data) {
                    // console.log(data.length);
                    // 5 * 1024 * 1024 + 1 + 28 = 5242909
                    // LENGTH(你好，世界) = 5
                    // 5 * 3 - 5          = 10
                    // 5242909 - 10       = 5242899
                    expect(data.length).toEqual(5242899);
                })
                .catch(fail)
                .fin(done);
        });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
