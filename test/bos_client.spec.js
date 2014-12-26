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

var Q = require('q');
var u = require('underscore');

var BosClient = require('../src/bos_client');

describe('BosClient', function() {
    var client;
    var fail;

    var bucket;
    var key;
    var filename;

    beforeEach(function() {
        fail = u.bind(function() {
            return this.fail.call(this, JSON.stringify(arguments));
        }, this);

        var id = Math.floor(Math.random() * 100000) + 900;
        bucket = util.format('test-bucket%d', id);
        key = util.format('test_object%d', id);
        filename = util.format('temp_file%d', id);

        client = new BosClient(require('./config'));
    });

    afterEach(function(done) {
        client.listBuckets()
            .then(function(response) {
                var defers = [];
                (response.body.buckets || []).forEach(function(bucket) {
                    defers.push(client.deleteBucket(bucket.name));
                });
                return Q.all(defers);
            })
            .catch(fail)
            .fin(done);
    });

    it('listBuckets', function(done) {
        client.listBuckets()
            .then(function(response) {
                expect(response.body.owner).toEqual({
                    id: '992c67ee10be4e85bf444d18b638f9ba',
                    displayName: 'PASSPORT:105015804',
                });
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
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
