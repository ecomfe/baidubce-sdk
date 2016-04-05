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
var expect = require('expect.js');

var config = require('../config');
var crypto = require('../../src/crypto');
var BcsClient = require('../..').BcsClient;
var helper = require('./helper');

describe('BcsClient', function () {
    var client;
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        // jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;

        fail = helper.fail(this);
        client = new BcsClient(config.bcs);
    });

    afterEach(function () {
        return client.deleteBucket('bcs-client-testcase').catch(function () {
        });
    });

    it('putObjectFromString', function () {
        var bucket = 'adtest';
        var object = 'this/is/the/path/a.txt';
        return client.putObjectFromString(bucket, object, 'Hello world')
            .then(function (response) {
                expect(response.http_headers['etag']).to.eql('3e25960a79dbc69b674cd4ec67a72c62');
                return client.deleteObject(bucket, object);
            })
            .then(function (response) {
                expect(response.body).to.eql({});
            });
    });

    it('createBucket', function () {
        var bucket = 'bcs-client-testcase';
        var object = 'a.txt';
        return client.createBucket(bucket)
            .then(function (response) {
                expect(response.body).to.eql({});
                return client.putObjectFromString(bucket, object, 'Hello world');
            })
            .then(function (response) {
                expect(response.http_headers['etag']).to.eql('3e25960a79dbc69b674cd4ec67a72c62');
                return client.deleteObject(bucket, object);
            })
            .then(function (response) {
                expect(response.body).to.eql({});
                return client.deleteBucket(bucket);
            })
            .then(function (response) {
                expect(response.body).to.eql({});
            });
    });

    it('getBucketAcl', function () {
        var bucket = 'bcs-client-testcase';
        return client.createBucket(bucket)
            .then(function (response) {
                return client.getBucketAcl(bucket);
            })
            .then(function (response) {
                expect(response.body).to.eql({
                    "statements": [
                        {
                            "action": [
                                "*"
                            ],
                            "effect": "allow",
                            "resource": [
                                "bcs-client-testcase/"
                            ],
                            "user": [
                                "liyubei"
                            ]
                        }
                    ]
                });
            });
    });

    it('listObjects with pagination', function () {
        var bucket = 'bcs-client-testcase';
        return client.createBucket(bucket)
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
            });
    });

    it('listObjects in empty bucket', function () {
        var bucket = 'bcs-client-testcase';
        return client.createBucket(bucket)
            .then(function (response) {
                return client.listObjects(bucket);
            })
            .then(function (response) {
                expect(response.body).to.eql({
                    object_total: 0,
                    bucket: 'bcs-client-testcase',
                    start: 0,
                    limit: 100,
                    object_list: []
                });

                return client.listObjects(bucket, {start: 1, limit: 7});
            })
            .then(function (response) {
                expect(response.body).to.eql({
                    object_total: 0,
                    bucket: 'bcs-client-testcase',
                    start: 1,
                    limit: 7,
                    object_list: []
                });
            });
    });

    it('deleteBucket failed if not empty', function () {
        var bucket = 'bcs-client-testcase';
        return client.createBucket(bucket)
            .then(function (response) {
                expect(response.body).to.eql({});
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
                expect(response).to.eql({
                    'status_code': 403,
                    'message': {}
                });
            });
    });

    it('listBuckets', function () {
        return client.listBuckets()
            .then(function (response) {
                expect(Array.isArray(response.body)).to.be(true);
            });
    });

    it('putObjectFromFile', function () {
        var bucket = 'adtest';
        return client.putObjectFromFile(bucket, path.basename(__filename), __filename)
            .then(function (response) {
                expect(response.http_headers['x-bs-bucket']).to.eql(bucket);
                expect(response.http_headers['x-bs-file-size']).to.eql('' + fs.lstatSync(__filename).size);
                return crypto.md5file(__filename, 'hex')
                    .then(function (md5sum) {
                        expect(response.http_headers['content-md5']).to.eql(md5sum);
                        expect(response.http_headers['etag']).to.eql(md5sum);
                    });
            })
            .then(function () {
                return client.getObjectMetadata(bucket, path.basename(__filename));
            })
            .then(function (response) {
                // console.log(response);
                expect(response.http_headers['content-length']).to.eql('' + fs.lstatSync(__filename).size);
            });
    });

    it('listObjects', function () {
        var bucket = 'adtest';

        return client.listObjects(bucket, {start: 1, limit: 3})
            .then(function (response) {
                // object_total 居然是 object_list.length，有卵用?
                expect(response.body.object_total).to.eql(3);
                expect(response.body.bucket).to.eql('adtest');
                expect(response.body.start).to.eql(1);
                expect(response.body.limit).to.eql(3);
                expect(response.body.object_list.length).to.eql(3);
            });
    });
});

/* vim: set ts=4 sw=4 sts=4 tw=120: */
