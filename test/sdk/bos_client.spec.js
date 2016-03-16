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
var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('bos_client.spec');

var config = require('../config');
var helper = require('./helper');
var BosClient = require('../..').BosClient;

describe('BosClient', function() {
    var client;
    var fail;

    var bucket;
    var key;
    var filename;

    beforeEach(function() {
        jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;

        fail = helper.fail(this);

        var id = Math.floor(Math.random() * 100000) + 900;
        bucket = util.format('test-bucket%d', id);
        key = util.format('test_object %d', id);
        filename = util.format('temp_file%d', id);

        client = new BosClient(config.bos);
    });

    afterEach(function(done) {
        function deleteBucket(bucket_name) {
            var promise =
                client.listObjects(bucket_name)
                    .then(function(response) {
                        var defers = [];
                        u.each(response.body.contents, function(object) {
                            defers.push(client.deleteObject(bucket_name, object.key))
                        });
                        return Q.all(defers);
                    })
                    .then(function() {
                        return client.deleteBucket(bucket_name);
                    })
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
    });

    function prepareTemporaryFile(size) {
        var fd = fs.openSync(filename, 'w+');
        var buffer = new Buffer(size);
        buffer.fill(0);
        fs.writeSync(fd, buffer, 0, size, 0);
        fs.closeSync(fd);
    }

    it('listBuckets', function(done) {
        client.listBuckets()
            .then(function(response) {
                var buckets = u.filter(response.body.buckets, function (bucket) {
                    return /^test\-bucket/.test(bucket);
                });
                expect(buckets.length).toEqual(0);
                // expect(response.body.owner).toEqual(config.bos.account);
            })
            .catch(fail)
            .fin(done);
    });

    it('doesBucketExist', function(done) {
        client.doesBucketExist(bucket)
            .then(function(response) {
                expect(response).toBe(false);
            })
            .catch(fail)
            .fin(done);
    });

    it('deleteBucket', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.doesBucketExist(bucket)
            })
            .then(function(response) {
                expect(response).toBe(true);
            })
            .then(function() {
                return client.deleteBucket(bucket);
            })
            .then(function() {
                return client.doesBucketExist(bucket)
            })
            .then(function(response) {
                expect(response).toBe(false);
            })
            .catch(fail)
            .fin(done);
    });

    it('setBucketCannedAcl', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.setBucketCannedAcl(bucket, 'public-read-write');
            })
            .then(function(response) {
                return client.setBucketCannedAcl(bucket, 'public-read');
            })
            .then(function(response) {
                return client.setBucketCannedAcl(bucket, 'private');
            })
            .then(function(response) {
                return client.setBucketCannedAcl(bucket, 'invalid-acl');
            })
            .catch(function(error) {
                if (error.code !== 'InvalidArgument') {
                    fail(error);
                }
            })
            .fin(done);
    });

    it('setBucketAcl', function(done) {
        var grant_list = [
            {
                'grantee': [
                    {'id': '992c67ee10be4e85bf444d18b638f9ba'},
                    {'id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
                ],
                'permission': ['FULL_CONTROL']
            },
            {
                'grantee': [
                    {'id': config.bos.account.id}
                ],
                'permission': ['FULL_CONTROL']
            }
        ];
        client.createBucket(bucket)
            .then(function() {
                return client.setBucketAcl(bucket, grant_list);
            })
            .then(function() {
                return client.getBucketAcl(bucket)
            })
            .then(function(response) {
                expect(response.body.accessControlList[0]).toEqual(grant_list[0]);
                expect(response.body.accessControlList[1]).toEqual(grant_list[1]);
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectWithInvalidSHA256', function (done) {
        client.createBucket(bucket)
            .then(function () {
                return client.putObjectFromString(bucket, key, 'hello world', {
                    'x-bce-content-sha256': 'hahahaha'
                });
            })
            .then(function () {
                fail('should not reach here');
            })
            .catch(function (error) {
                expect(error.status_code).toEqual(400);
                expect(error.code).toEqual('BadDigest');
            })
            .fin(done);
    });

    it('putObjectFromDataUrl', function (done) {
        client.createBucket(bucket)
            .then(function() {
                var dataUrl = new Buffer('hello world').toString('base64');
                return client.putObjectFromDataUrl(bucket, key, dataUrl);
            })
            .then(function() {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('11');
                expect(response.http_headers['content-md5']).toEqual(
                    require('../../src/crypto').md5sum('hello world')
                );
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectFromString2', function (done) {
        var objectName = '/this/is/a/file.txt';
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromString(bucket, objectName, 'hello world');
            })
            .then(function() {
                return client.getObjectMetadata(bucket, objectName);
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('11');
                expect(response.http_headers['content-md5']).toEqual(
                    require('../../src/crypto').md5sum('hello world')
                );

                return client.generatePresignedUrl(bucket, objectName, 0, 1800, null, {'x-bce-range': '0-5'});
            })
            .then(function(url) {
                debug('url = %s', url);
                return helper.get(url);
            })
            .then(function (body) {
                expect(body.toString()).toEqual('hello ');
                return client.generatePresignedUrl(bucket, objectName);
            })
            .then(function (url) {
                return helper.get(url);
            })
            .then(function (body) {
               expect(body.toString()).toEqual('hello world');
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectFromString', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromString(bucket, key, 'hello world');
            })
            .then(function() {
                return client.getObjectMetadata(bucket, key);
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('11');
                expect(response.http_headers['content-md5']).toEqual(
                    require('../../src/crypto').md5sum('hello world')
                );

                return client.generatePresignedUrl(bucket, key, 0, 1800, null, {'x-bce-range': '0-5'});
            })
            .then(function(url) {
                debug('url = %s', url);
                return helper.get(url);
            })
            .then(function (body) {
                expect(body.toString()).toEqual('hello ');
                return client.generatePresignedUrl(bucket, key);
            })
            .then(function (url) {
                return helper.get(url);
            })
            .then(function (body) {
               expect(body.toString()).toEqual('hello world');
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectFromFile', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObjectMetadata(bucket, path.basename(__filename));
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('' + fs.lstatSync(__filename).size);
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                return require('../../src/crypto').md5file(__filename)
                    .then(function(md5sum) {
                        expect(response.http_headers['content-md5']).toEqual(md5sum);
                    });
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectFromFileWithContentLength', function (done) {
        var options = {
            'Content-Length': 100
        };
        client.createBucket(bucket)
            .then(function () {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename, options);
            })
            .then(function () {
                return client.getObjectMetadata(bucket, path.basename(__filename))
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('100');
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                return require('../../src/crypto').md5stream(fs.createReadStream(__filename, {start: 0, end: 99}))
                    .then(function(md5sum) {
                        expect(response.http_headers['content-md5']).toEqual(md5sum);
                    });
            })
            .catch(fail)
            .fin(done);
    });

    it('createBucketFailed', function (done) {
        var invalidBucketName = 'invalid-bucket-你好\\&1231@#@#@';
        client.createBucket(invalidBucketName)
            .catch(function (error) {
                expect(error.status_code).toEqual(400);
                expect(error.code).toEqual('InvalidBucketName');
                invalidBucketName = 'xinglubucket\'xinglubucket1213213123';
                return client.createBucket(invalidBucketName)
            })
            .catch(function (error) {
                expect(error.status_code).toEqual(400);
                expect(error.code).toEqual('InvalidBucketName');
            })
            .fin(done);
    });

    it('getObject', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObject(bucket, path.basename(__filename));
            })
            .then(function(response) {
                expect(response.http_headers['content-length']).toEqual('' + fs.lstatSync(__filename).size);
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(Buffer.isBuffer(response.body)).toEqual(true);
                expect(response.body.length).toEqual(fs.lstatSync(__filename).size);
            })
            .catch(fail)
            .fin(done);
    });

    it('getObjectFailed', function (done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObject(bucket, path.basename(__filename) + '.failed');
            })
            .catch(function (response) {
                expect(response.status_code).toEqual(404);
                expect(response.code).toEqual('NoSuchKey');
            })
            .fin(done);
    });

    it('getObjectWithRange', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObject(bucket, path.basename(__filename), '9-19');
            })
            .then(function(response) {
                var filesize = fs.lstatSync(__filename).size;
                expect(response.http_headers['content-length']).toEqual('11');
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.http_headers['content-range']).toEqual('bytes 9-19/' + filesize);
                expect(Buffer.isBuffer(response.body)).toEqual(true);
                expect(response.body.length).toEqual(11);
            })
            .catch(fail)
            .fin(done);
    });

    it('getObjectToFile', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObjectToFile(bucket, path.basename(__filename), filename);
            })
            .then(function(response) {
                debug('response = %j', response);
                expect(fs.existsSync(filename)).toEqual(true);
                var filesize = fs.lstatSync(filename).size;
                expect(response.http_headers['content-length']).toEqual('' + filesize);
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.body).toEqual({});
                fs.unlinkSync(filename);
            })
            .catch(fail)
            .fin(done);
    });

    it('getObjectToFileWithRange', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.putObjectFromFile(bucket, path.basename(__filename), __filename);
            })
            .then(function() {
                return client.getObjectToFile(bucket, path.basename(__filename), filename, '9-19');
            })
            .then(function(response) {
                expect(fs.existsSync(filename)).toEqual(true);
                var filesize = fs.lstatSync(filename).size;
                expect(filesize).toEqual(11);
                expect(response.http_headers['content-length']).toEqual('11');
                expect(response.http_headers['content-type']).toEqual('application/javascript');
                expect(response.body).toEqual({});
                fs.unlinkSync(filename);
            })
            .catch(fail)
            .fin(done);
    });

    it('copyObjectAndCopyMeta', function(done) {
        var target_bucket_name = 'test-bucket-a-is-this';
        client.createBucket(bucket)
            .then(function() {
                return client.createBucket(target_bucket_name);
            })
            .then(function() {
                return client.putObjectFromString(bucket, key, 'Hello World', {
                    'x-bce-meta-foo1': 'bar1',
                    'x-bce-meta-foo2': 'bar2',
                    'x-bce-meta-foo3': 'bar3',
                    'x-bce-meta-foo4': 'bar4',
                });
            })
            .then(function() {
                return client.copyObject(bucket, key, target_bucket_name, key, {
                    'ETag': require('../../src/crypto').md5sum('Hello World', null, 'hex')
                });
            })
            .then(function() {
                return client.getObjectMetadata(target_bucket_name, key);
            })
            .then(function(response) {
                expect(response.http_headers['x-bce-meta-foo1']).toEqual('bar1');
                expect(response.http_headers['x-bce-meta-foo2']).toEqual('bar2');
                expect(response.http_headers['x-bce-meta-foo3']).toEqual('bar3');
                expect(response.http_headers['x-bce-meta-foo4']).toEqual('bar4');
            })
            .catch(fail)
            .fin(done);
    });

    it('copyObjectWithCustomMeta', function(done) {
        var target_bucket_name = 'test-bucket-a-is-this';
        client.createBucket(bucket)
            .then(function() {
                return client.createBucket(target_bucket_name);
            })
            .then(function() {
                return client.putObjectFromString(bucket, key, 'Hello World', {
                    'x-bce-meta-foo1': 'bar1',
                    'x-bce-meta-foo2': 'bar2',
                    'x-bce-meta-foo3': 'bar3',
                    'x-bce-meta-foo4': 'bar4',
                });
            })
            .then(function() {
                return client.copyObject(bucket, key, target_bucket_name, key, {
                    'ETag': require('../../src/crypto').md5sum('Hello World', null, 'hex'),
                    'x-bce-meta-bar1': 'foo1',
                    'x-bce-meta-bar2': 'foo2',
                    'x-bce-meta-bar3': 'foo3',
                });
            })
            .then(function() {
                return client.getObjectMetadata(target_bucket_name, key);
            })
            .then(function(response) {
                expect(response.http_headers['x-bce-meta-bar1']).toEqual('foo1');
                expect(response.http_headers['x-bce-meta-bar2']).toEqual('foo2');
                expect(response.http_headers['x-bce-meta-bar3']).toEqual('foo3');
            })
            .catch(fail)
            .fin(done);
    });

    it('initiateMultipartUpload', function(done) {
        client.createBucket(bucket)
            .then(function() {
                return client.initiateMultipartUpload(bucket, key);
            })
            .then(function(response) {
                var upload_id = response.body.uploadId;
                return client.abortMultipartUpload(bucket, key, upload_id);
            })
            .catch(fail)
            .fin(done);
    });

    it('uploadPartFromFile', function(done) {
        var MIN_PART_SIZE = 5 * 1024 * 1024;
        var filesize = 20 * 1024 * 1024 + 317;
        prepareTemporaryFile(filesize);

        var upload_id = null;
        var part_list = [];
        var etags = '';
        client.createBucket(bucket)
            .then(function() {
                return client.initiateMultipartUpload(bucket, key);
            })
            .then(function(response) {
                upload_id = response.body.uploadId;

                var left_size = filesize;
                var offset = 0;
                var part_number = 1;

                var defers = [];

                function uploadPartPromise(part_number, part_size, offset) {
                    return client.uploadPartFromFile(bucket, key, upload_id,
                        part_number, part_size, filename, offset);
                }

                while (left_size > 0) {
                    var part_size = Math.min(left_size, MIN_PART_SIZE);

                    defers.push(uploadPartPromise(part_number, part_size, offset));

                    left_size -= part_size;
                    offset += part_size;
                    part_number += 1;
                }

                return Q.all(defers);
            })
            .then(function(all_response) {
                u.each(all_response, function(response, index) {
                    part_list.push({
                        partNumber: index + 1,
                        eTag: response.http_headers['etag'],
                    });
                    etags += response.http_headers['etag'];
                });

                return client.completeMultipartUpload(bucket, key, upload_id, part_list);
            })
            .then(function(response) {
                fs.unlinkSync(filename);
                expect(response.body.eTag).toEqual(
                    '-' + require('../../src/crypto').md5sum(etags, null, 'hex')
                );
            })
            .catch(fail)
            .fin(done);
    }, 60 * 1000);

    it('testMultipartUploadSmallSuperfileX', function(done) {
        var MIN_PART_SIZE = 5 * 1024 * 1024;
        var filesize = 1 * 1024 * 1024 - 1;
        prepareTemporaryFile(filesize);

        var upload_id = null;
        var part_list = [];
        var etags = '';
        client.createBucket(bucket)
            .then(function() {
                return client.initiateMultipartUpload(bucket, key);
            })
            .then(function(response) {
                upload_id = response.body.uploadId;

                var left_size = filesize;
                var offset = 0;
                var part_number = 1;

                var defers = [];

                function uploadPartPromise(part_number, part_size, offset) {
                    return client.uploadPartFromFile(bucket, key, upload_id,
                        part_number, part_size, filename, offset);
                }

                while (left_size > 0) {
                    var part_size = Math.min(left_size, MIN_PART_SIZE);

                    defers.push(uploadPartPromise(part_number, part_size, offset));

                    left_size -= part_size;
                    offset += part_size;
                    part_number += 1;
                }

                return Q.all(defers);
            })
            .then(function(all_response) {
                u.each(all_response, function(response, index) {
                    part_list.push({
                        partNumber: index + 1,
                        eTag: response.http_headers['etag'],
                    });
                    etags += response.http_headers['etag'];
                });

                return client.completeMultipartUpload(bucket, key, upload_id, part_list);
            })
            .then(function(response) {
                fs.unlinkSync(filename);
                expect(response.body.eTag).toEqual('e57598cd670284cf7d09e16ed9d4b2ac');
            })
            .catch(fail)
            .fin(done);
    }, 60 * 1000);
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
