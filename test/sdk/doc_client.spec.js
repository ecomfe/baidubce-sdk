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
 * @file sdk/ses_client.spec.js
 * @author leeight
 */

/* eslint fecs-camelcase:[2,{"ignore":["/file_(name|data)/"]}] */

var path = require('path');
var fs = require('fs');

var debug = require('debug')('doc_client.spec');
var expect = require('expect.js');

var config = require('../config');
var DocClient = require('../../').DocClient;
var BosClient = require('../../').BosClient;
var helper = require('./helper');

describe('DocClient', function () {
    var fail;
    var client;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);

        client = new DocClient(config.doc);
    });

    afterEach(function (done) {
        done();
    });

    it('createDocument from local file', function (done) {
        var file = path.join(__dirname, 'doc_client.spec.txt');
        client.createDocument(file)
            .then(function (response) {
                expect(response.documentId).not.to.be(undefined);
                expect(response.bosEndpoint).not.to.be(undefined);
                expect(response.bucket).not.to.be(undefined);
                expect(response.object).not.to.be(undefined);

                debug(response);
                var bosClient = new BosClient({
                    endpoint: response.bosEndpoint,
                    credentials: config.doc.credentials
                });
                // return bosClient.generatePresignedUrl(response.bucket, response.object);
                return bosClient.getObjectMetadata(response.bucket, response.object);
            })
            .then(function (response) {
                debug(response);
            })
            .catch(fail)
            .fin(done);
    });

    it('createDocument from buffer without format and title', function (done) {
        var buffer = fs.readFileSync(path.join(__dirname, 'doc_client.spec.txt'));
        client.createDocument(buffer)
            .catch(function (error) {
                expect(error.toString()).to.eql('buffer type required options.format and options.title');
            })
            .fin(done);
    });

    it('createDocument from buffer with format and title', function (done) {
        var buffer = fs.readFileSync(path.join(__dirname, 'doc_client.spec.txt'));
        client.createDocument(buffer, {format: 'txt', title: 'hello world'})
            .then(function (response) {
                expect(response.documentId).not.to.be(undefined);
                expect(response.bosEndpoint).not.to.be(undefined);
                expect(response.bucket).not.to.be(undefined);
                expect(response.object).not.to.be(undefined);
            })
            .catch(fail)
            .fin(done);
    });

    xit('createDocument from blob', function () {});
});


/* vim: set ts=4 sw=4 sts=4 tw=120: */
