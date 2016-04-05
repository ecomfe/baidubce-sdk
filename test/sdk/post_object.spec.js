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
var expect = require('expect.js');
var debug = require('debug')('bos_client.spec');

var config = require('../config');
var helper = require('./helper');
var BosClient = require('../..').BosClient;
var crypto = require('../../src/crypto');

describe('XBosClient', function () {
    var client;
    var fail;

    beforeEach(function () {
        fail = helper.fail(this);

        client = new BosClient({
            endpoint: 'https://bos.qasandbox.bcetest.baidu.com',
            credentials: {
                ak: 'f932edbccdb04cec8e3307b1798f16e6',
                sk: 'cdeb07159a884b80aac08ff474b6e71f'
            }
        });
    });

    it('postObject to public-read bucket', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'))
            .then(function (response) {
                expect().fail('SHOULD NOT REACH HERE.');
            })
            .catch(function (error) {
                debug(error);
                expect(error.status_code).to.eql(403);
            });
    });

    it('postObject with expired policy', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'), {
                'policy': {
                    'expiration': '2015-04-26T13:29:46Z',
                    'conditions': [
                        {'bucket': 'bcecdn'}
                    ]
                }
            })
            .then(function () {
                expect().fail('SHOULD NOT REACH HERE.');
            })
            .catch(function (error) {
                debug(error);
                expect(error.status_code).to.eql(403);
                expect(error.code).to.eql('RequestExpired');
            });
    });

    it('postObject with success-action-status-200', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'), {
            'success-action-status': '204',
            'policy': {
                'expiration': '2016-04-26T13:29:46Z',
                'conditions': [
                    {'bucket': 'bcecdn'}
                ]
            }
        })
        .then(function (response) {
            debug(response);
            expect(response.http_headers['etag']).to.eql('5eb63bbbe01eeed093cb22bb8f5acdc3');
        });
    });

    it('postObject with invalid content-length', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'), {
            'policy': {
                'expiration': '2016-04-26T13:29:46Z',
                'conditions': [
                    {'bucket': 'bcecdn'},
                    ["content-length-range", 0, 10]
                ]
            }
        })
        .then(function () {
            expect().fail('SHOULD NOT REACH HERE.');
        })
        .catch(function (error) {
            debug(error);
            expect(error.status_code).to.eql(400);
            expect(error.code).to.eql('MaxMessageLengthExceeded');
        });
    });

    it('postObject with invalid key name', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'), {
            'policy': {
                'expiration': '2016-04-26T13:29:46Z',
                'conditions': [
                    {'bucket': 'bcecdn'},
                    {'key': 'abc*'}
                ]
            }
        })
        .then(function (response) {
            expect().fail('SHOULD NOT REACH HERE.');
        })
        .catch(function (error) {
            debug(error);
            // expect(1).to.eql(2);
            expect(error.status_code).to.eql(403);
            expect(error.code).to.eql('AccessDenied');
        });
    });

    it('postObject with success-action-status-201', function () {
        return client.postObject('bcecdn', 'world.txt', new Buffer('hello world'), {
            'Content-Type': 'foo/bar',
            'x-bce-meta-foo': 'bar',
            'success-action-redirect': 'https://www.baidu.com',
            'success-action-status': '201',
            'policy': {
                'expiration': '2016-04-26T13:29:46Z',
                'conditions': [
                    {'bucket': 'bcecdn'}
                ]
            }
        })
        .then(function (response) {
            expect().fail('SHOULD NOT REACH HERE.');
        })
        .catch(function (error) {
            debug(error);
            expect(error.status_code).to.eql(302);
            return client.getObjectMetadata('bcecdn', 'world.txt');
        })
        .then(function (response) {
            debug(response);
            expect(response.http_headers['content-type']).to.eql('foo/bar');
            expect(response.http_headers['x-bce-meta-foo']).to.eql('bar');
        });
    });
});
