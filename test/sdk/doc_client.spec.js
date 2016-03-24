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
var crypto = require('../../src/crypto');
var helper = require('./helper');

describe('DocClient.Notification', function () {
    var fail;
    var notification;

    this.timeout(10 * 60 * 1000);

    beforeEach(function (done) {
        fail = helper.fail(this);

        notification = new DocClient.Notification(config.doc);

        notification.removeAll().catch(fail).fin(done);
    });

    it('list', function (done) {
        notification.list()
            .then(function (response) {
                expect(response.body.notifications).not.to.be(undefined);
                expect(response.body.notifications).to.eql([]);
            })
            .catch(fail)
            .fin(done);
    });

    it('create', function (done) {
        var name = 'haha';
        var endpoint = 'http://www.baidu.com';
        notification.create(name, endpoint)
            .then(function () {
                return notification.get()
            })
            .then(function (response) {
                var body = response.body;
                expect(body.name).to.eql(name);
                expect(body.endpoint).to.eql(endpoint);
                expect(body.createTime).not.to.eql(undefined);
                expect(body.createTime).to.be.a('string');

                // 重复创建
                return notification.create(name, endpoint);
            })
            .catch(function (error) {
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('DocExceptions.DuplicateNotification');

                return notification.remove();
            })
            .then(function (response) {
                return notification.get();
            })
            .catch(function (error) {
                expect(error.status_code).to.eql(404);
                expect(error.code).to.eql('DocExceptions.NoSuchNotification');
            })
            .catch(fail)
            .fin(done);
    });

    it('create with invalid name', function (done) {
        var name = '你好';
        var endpoint = 'http://www.baidu.com';
        notification.create(name, endpoint)
            .then(function () {
                expect().fail('SHOULD NOT REACH HERE.');
            })
            .catch(function (error) {
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('BceValidationException');
            })
            .fin(done);
    });

    it('create with invalid endpoint', function (done) {
        var name = 'haha';
        var endpoint = new Array(300).join('a');
        notification.create(name, endpoint)
            .then(function () {
                expect().fail('SHOULD NOT REACH HERE.');
            })
            .catch(function (error) {
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('BceValidationException');
            })
            .fin(done);
    });
});

describe('DocClient.Document', function () {
    var fail;
    var document;

    this.timeout(10 * 60 * 1000);

    beforeEach(function (done) {
        fail = helper.fail(this);

        document = new DocClient.Document(config.doc);

        document.removeAll().catch(fail).fin(done);
    });

    afterEach(function (done) {
        done();
    });

    it('create from local file', function (done) {
        var file = path.join(__dirname, 'doc_client.spec.txt');
        var documentId;
        document.create(file)
            .then(function (response) {
                debug(response);

                documentId = document.getId();

                expect(response.body.documentId).not.to.be(undefined);
                expect(response.body.bosEndpoint).not.to.be(undefined);
                expect(response.body.bucket).not.to.be(undefined);
                expect(response.body.object).not.to.be(undefined);

                var bosClient = new BosClient({
                    endpoint: response.body.bosEndpoint,
                    credentials: config.doc.credentials
                });
                return bosClient.getObjectMetadata(response.body.bucket,
                    response.body.object);
            })
            .then(function (response) {
                expect().fail('SHOULD NOT REACH HERE');
            })
            .catch(function (error) {
                // Bucket不属于创建文档的用户，只是有 write 的权限而已
                expect(error.status_code).to.eql(403);
                return helper.loop(5 * 60, 20, function () {
                    return document.get(documentId).then(function (response) {
                        debug(response.body);
                        // UPLOADING/PROCESSING/PUBLISHED/FAILED
                        var status = response.body.status;
                        if (status === 'FAILED') {
                            throw status;
                        }
                        else if (status !== 'PUBLISHED') {
                            throw '$continue';
                        }
                    });
                });
            })
            .then(function (response) {
                return document.get();
            })
            .then(function (response) {
                debug(response);
                var body = response.body;
                expect(body.docId).not.to.be(undefined);
                expect(body.publishTime).not.to.be(undefined);
                expect(body.publishInfo).not.to.be(undefined);
                expect(body.publishInfo.pageCount).not.to.be(undefined);
                expect(body.publishInfo.coverUrl).not.to.be(undefined);
                return document.read();
            })
            .then(function (response) {
                debug(response);
                var body = response.body;
                expect(body.documentId).to.eql(documentId);
                expect(body.host).not.to.be(undefined);
                expect(body.docId).not.to.be(undefined);
                expect(body.token).not.to.be(undefined);
                expect(body.createTime).not.to.be(undefined);
                expect(body.expireTime).not.to.be(undefined);
            })
            .catch(fail)
            .fin(done);
    });

    it('create from local file with invalid md5', function (done) {
        var file = path.join(__dirname, 'doc_client.spec.txt');
        document.create(file, {meta: {md5: 'haha'}})
            .catch(function (error) {
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('BceValidationException');
                expect(error.message).to.eql('meta.md5:meta.md5=invalid md5 value\n');
            })
            .fin(done);
    });

    it('create from buffer without format and title', function (done) {
        var buffer = fs.readFileSync(path.join(__dirname, 'doc_client.spec.txt'));
        document.create(buffer)
            .catch(function (error) {
                expect(error.toString()).to.eql('buffer type required options.format and options.title');
            })
            .fin(done);
    });

    it('create from buffer with format and title', function (done) {
        var buffer = fs.readFileSync(path.join(__dirname, 'doc_client.spec.txt'));
        document.create(buffer, {format: 'txt', title: 'hello world'})
            .then(function (response) {
                expect(response.body.documentId).not.to.be(undefined);
                expect(response.body.bosEndpoint).not.to.be(undefined);
                expect(response.body.bucket).not.to.be(undefined);
                expect(response.body.object).not.to.be(undefined);
            })
            .catch(fail)
            .fin(done);
    });

    it('list', function (done) {
        document.list()
            .then(function (response) {
                var documents = response.body.documents || [];
                expect(documents.length).to.eql(0);
            })
            .catch(fail)
            .fin(done);
    });

    it('create from bos', function (done) {
        var bosClient = new BosClient(config.bos);
        var bucket = 'bce-bos-uploader';
        var object = 'doc_client.spec.txt';
        var title = '你好，世界.txt';
        var fsize = fs.lstatSync(__filename).size;
        var bceMetaMd5;

        crypto.md5file(__filename, 'hex')
            .then(function (md5) {
                bceMetaMd5 = md5;
                return bosClient.putObjectFromFile(bucket, object, __filename, {
                    'x-bce-meta-md5': md5
                })
            })
            .then(function () {
                return bosClient.getObjectMetadata(bucket, object);
            })
            .then(function (response) {
                debug(response.http_headers);
                expect(response.http_headers['x-bce-meta-md5']).not.to.be(undefined);
                expect(response.http_headers['content-length']).to.eql('' + fsize);
                return document.create('bos://' + bucket + '/' + object, {
                    format: 'txt',
                    title: title
                });
            })
            .then(function (response) {
                expect(response.body).not.to.be(undefined);
                expect(response.body.documentId).not.to.be(undefined);
                return document.get();
            })
            .then(function (response) {
                debug(response);
                var body = response.body;
                expect(body.title).to.eql(title);
                expect(body.format).to.eql('txt');
                expect(body.meta.md5).to.eql(bceMetaMd5);
                expect(body.meta.sizeInBytes).to.eql(fsize);
                expect(body.status).to.eql('PROCESSING');
            })
            .catch(fail)
            .fin(done);
    });


    xit('create from blob', function () {});
});


/* vim: set ts=4 sw=4 sts=4 tw=120: */
