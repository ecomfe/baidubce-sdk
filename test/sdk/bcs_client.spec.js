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

var util = require('util');
var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');

var config = require('../config');
var crypto = require('../../src/crypto');
var BcsClient = require('../../src/bcs_client');

describe('BcsClient', function () {
    var client;
    var fail;

    beforeEach(function () {
        fail = u.bind(function() {
            return this.fail.call(this, JSON.stringify(arguments));
        }, this);

        client = new BcsClient(config.bcs);
    });

    afterEach(function (done) {
        client.deleteBucket('bcs-client-testcase').fin(done);
    });

    it('createBucket', function (done) {
        var bucket = 'bcs-client-testcase';
        var object = 'a.txt';
        client.createBucket(bucket)
            .then(function (response) {
                expect(response.body).toEqual({});
                return client.putObjectFromString(bucket, object, 'Hello world');
            })
            .then(function (response) {
                expect(response.http_headers['etag']).toEqual('3e25960a79dbc69b674cd4ec67a72c62');
                return client.deleteObject(bucket, object);
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                return client.deleteBucket(bucket);
            })
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('listObjects with pagination', function (done) {
        var bucket = 'bcs-client-testcase';
        client.createBucket(bucket)
            .then(function (response) {
                return Q.all([
                    client.putObjectFromString(bucket, 'a.txt', 'Hello a'),
                    client.putObjectFromString(bucket, 'b.txt', 'Hello b')
                ]);
            })
            .then(function (response) {
                // console.log(response);
                return Q.all([
                    client.deleteObject(bucket, 'a.txt'),
                    client.deleteObject(bucket, 'b.txt')
                ]);
            })
            .catch(fail)
            .fin(done);
    });

    it('listObjects in empty bucket', function (done) {
        var bucket = 'bcs-client-testcase';
        client.createBucket(bucket)
            .then(function (response) {
                return client.listObjects(bucket);
            })
            .then(function (response) {
                expect(response.body).toEqual({
                    object_total: 0,
                    bucket: 'bcs-client-testcase',
                    start: 0,
                    limit: 100,
                    object_list: []
                });

                return client.listObjects(bucket, {start: 1, limit: 7});
            })
            .then(function (response) {
                expect(response.body).toEqual({
                    object_total: 0,
                    bucket: 'bcs-client-testcase',
                    start: 1,
                    limit: 7,
                    object_list: []
                });
            })
            .catch(fail)
            .fin(done);
    });

    it('deleteBucket failed if not empty', function (done) {
        var bucket = 'bcs-client-testcase';
        client.createBucket(bucket)
            .then(function (response) {
                expect(response.body).toEqual({});
                return client.putObjectFromString(bucket, 'a.txt', 'Hello world');
            })
            .then(function (response) {
                // NB呀，Bucket不是空的，也可以直接干掉
                return client.deleteBucket(bucket);
            })
            .then(function (response) {
                return client.getObjectMetadata(bucket, 'a.txt');
            })
            .catch(function (response) {
                expect(response).toEqual({
                    'status_code': 403,
                    'message': {}
                });
            })
            .fin(done);
    });

    it('listBuckets', function (done) {
        client.listBuckets()
            .then(function (response) {
                expect(Array.isArray(response.body)).toBe(true);
            })
            .catch(fail)
            .fin(done);
    });

    it('putObjectFromFile', function(done) {
        var bucket = 'adtest';
        client.putObjectFromFile(bucket, path.basename(__filename), __filename)
            .then(function(response) {
                expect(response.http_headers['x-bs-bucket']).toEqual(bucket);
                expect(response.http_headers['x-bs-file-size']).toEqual('' + fs.lstatSync(__filename).size);
                return crypto.md5file(__filename, 'hex')
                    .then(function(md5sum) {
                        expect(response.http_headers['content-md5']).toEqual(md5sum);
                        expect(response.http_headers['etag']).toEqual(md5sum);
                    });
            })
            .then(function() {
                return client.getObjectMetadata(bucket, path.basename(__filename));
            })
            .then(function (response) {
                // console.log(response);
                expect(response.http_headers['content-length']).toEqual('' + fs.lstatSync(__filename).size);
            })
            .catch(fail)
            .fin(done);
    });

    it('listObjects', function (done) {
        var bucket = 'adtest';

        client.listObjects(bucket, {start: 1, limit: 3})
            .then(function (response) {
                // object_total 居然是 object_list.length，有卵用?
                expect(response.body.object_total).toEqual(3);
                expect(response.body.bucket).toEqual('adtest');
                expect(response.body.start).toEqual(1);
                expect(response.body.limit).toEqual(3);
                expect(response.body.object_list.length).toEqual(3);
            })
            .catch(fail)
            .fin(done);
    });
});









/* vim: set ts=4 sw=4 sts=4 tw=120: */
