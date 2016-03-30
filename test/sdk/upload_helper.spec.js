/*
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

var util = require('util');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('upload_helper.spec');

var config = require('../config');
var helper = require('./helper');
var BosClient = require('../..').BosClient;
var UploadHelper = require('../../src/helper');

describe('BosClient', function() {
    var client;
    var fail;

    var bucket;
    var key;
    var filename;

    beforeEach(function(done) {
        jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;

        fail = helper.fail(this);

        var id = Math.floor(Math.random() * 100000) + 900;
        bucket = util.format('test-bucket%d', id);
        key = util.format('test_object %d', id);
        filename = util.format('temp_file%d', id);

        client = new BosClient(config.bos);

        client.createBucket(bucket).catch(fail).fin(done);
    });

    afterEach(function(done) {
        function deleteBucket(bucket_name) {
            var promise
                = client.listObjects(bucket_name)
                    .then(function(response) {
                        var defers = [];
                        u.each(response.body.contents, function(object) {
                            defers.push(client.deleteObject(bucket_name, object.key));
                        });
                        return Q.all(defers);
                    })
                    .then(function() {
                        return client.deleteBucket(bucket_name);
                    });
            return promise;
        }

        client.listBuckets()
            .then(function(response) {
                var defers = [];
                (response.body.buckets || []).forEach(function(bucket) {
                    if (/^test\-bucket/.test(bucket.name)) {
                        defers.push(deleteBucket(bucket.name));
                    }
                });
                return Q.all(defers);
            })
            .catch(fail)
            .fin(done);

        try {
            fs.unlinkSync(filename);
        }
        catch (ex) {
        }
    });

    function prepareTemporaryFile(size) {
        var fd = fs.openSync(filename, 'w+');
        // 随机填充的数据
        var buffer = new Buffer(size);
        // buffer.fill(0);
        fs.writeSync(fd, buffer, 0, size, 0);
        fs.closeSync(fd);
    }

    it('upload direct from file', function (done) {
        UploadHelper.upload(client, bucket, key, __filename)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(__filename).size);
                debug(response);
            })
            .catch(fail)
            .fin(done);
    });

    it('upload multipart from file', function (done) {
        var filesize = 5 * 1024 * 1024 + 1;
        prepareTemporaryFile(filesize);

        UploadHelper.upload(client, bucket, key, filename)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                expect(response.http_headers['content-type']).toEqual('application/octet-stream');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(filename).size);
                debug(response);
            })
            .catch(fail)
            .fin(done);
    });

    it('upload direct from stream', function (done) {
        var stream = fs.createReadStream(__filename);
        var options = {};
        options['Content-Length'] = fs.lstatSync(__filename).size;
        UploadHelper.upload(client, bucket, key, stream, options)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                expect(response.http_headers['content-type']).toEqual('application/octet-stream');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(__filename).size);
                debug(response);
            })
            .catch(fail)
            .fin(done);
    });

    it('upload multipart from stream', function (done) {
        var filesize = 5 * 1024 * 1024 + 1;
        prepareTemporaryFile(filesize);

        var stream = fs.createReadStream(filename);
        var options = {};
        options['Content-Length'] = fs.lstatSync(filename).size;
        UploadHelper.upload(client, bucket, key, stream, options)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                debug(response);
                expect(response.http_headers['content-type']).toEqual('application/octet-stream');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(filename).size);
                return require('../../src/crypto').md5file(filename)
                    .then(function(md5sum) {
                        expect(response.http_headers['content-md5']).toEqual(md5sum);
                    });
            })
            .catch(fail)
            .fin(done);
    });

    it('upload direct from buffer', function (done) {
        var buffer = fs.readFileSync(__filename);
        var options = {};
        options['Content-Type'] = 'application/javascript';
        UploadHelper.upload(client, bucket, key, buffer, options)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(__filename).size);
                debug(response);
            })
            .catch(fail)
            .fin(done);
    });

    it('upload multipart from buffer', function (done) {
        var filesize = 5 * 1024 * 1024 + 1;
        prepareTemporaryFile(filesize);

        var buffer = fs.readFileSync(filename);
        var options = {};
        options['Content-Type'] = 'application/javascript';
        UploadHelper.upload(client, bucket, key, buffer, options)
            .then(function (response) {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function (response) {
                debug(response);
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.http_headers['content-length']).toEqual(
                    '' + fs.lstatSync(filename).size);
            })
            .catch(fail)
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
