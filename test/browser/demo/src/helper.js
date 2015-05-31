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
    var exports = {};

    var sdk = require('baidubce-sdk');
    var u = require('underscore');
    var async = require('async');

    var Klient = require('./client');
    var config = require('./config');

    function uploadSingleFile(client, bucketName, key, blob, options) {
        if (!options['Content-Type']) {
            var ext = key.split(/\./g).pop();
            var mimeType = sdk.MimeType.guess(ext);
            if (/^text\//.test(mimeType)) {
                mimeType += '; charset=UTF-8';
            }
            options['Content-Type'] = mimeType;
        }

        return client.putObjectFromBlob(bucketName, key, blob, options);
    }


    function getTasks(file, uploadId, bucketName, key) {
        var leftSize = file.size;
        var minPartSize = config.kMinFileSize;
        var offset = 0;
        var partNumber = 1;

        var tasks = [];

        while (leftSize > 0) {
            var partSize = Math.min(leftSize, minPartSize);

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
        return function (item, callback) {
            // item.file
            // item.uploadId
            // item.bucketName
            // item.key
            // item.start
            // item.stop
            // item.partNumber
            // item.partSize
            var blob = item.file.slice(item.start, item.stop + 1);
            // var client = Klient.createInstance();
            client.uploadPartFromBlob(item.bucketName, item.key, item.uploadId, item.partNumber, item.partSize, blob)
                .then(function (res) {
                    ++state.loaded;
                    client.emit('bosprogress', state);
                    callback(null, res);
                })
                .catch(function (err) {
                    callback(err);
                });
        };
    }

    function uploadSuperFile(client, bucketName, key, blob, options) {
        if (!options['Content-Type']) {
            var ext = key.split(/\./g).pop();
            // Firefox在POST的时候，Content-Type 一定会有Charset的，因此
            // 这里不管3721，都加上.
            var mimeType = sdk.MimeType.guess(ext) + '; charset=UTF-8';
            u.extend(options, {
                'Content-Type': mimeType
            });
        }

        var uploadId = null;
        return client.initiateMultipartUpload(bucketName, key, options)
            .then(function (response) {
                uploadId = response.body.uploadId;

                var deferred = sdk.Q.defer();
                var tasks = getTasks(blob, uploadId, bucketName, key);
                var state = {
                    lengthComputable: true,
                    loaded: 0,
                    total: tasks.length
                };
                async.mapLimit(tasks, config.kParallel, uploadPartFile(state, client), function (err, results) {
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

                return client.completeMultipartUpload(bucketName, key, uploadId, partList);
            });
    }

    exports.upload = function (bucketName, key, blob, options, opt_client) {
        options = options || {};
        var client = opt_client || Klient.createInstance();

        if (blob.size > config.kMinFileSize) {
            return uploadSuperFile(client, bucketName, key, blob, options);
        }

        client.on('progress', function (evt) {
            client.emit('bosprogress', {
                lengthComputable: evt.lengthComputable,
                loaded: evt.loaded,
                total: evt.total
            });
        });
        return uploadSingleFile(client, bucketName, key, blob, options);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
