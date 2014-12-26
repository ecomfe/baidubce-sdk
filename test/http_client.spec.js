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

var Auth = require('../src/auth');
var HttpClient = require('../src/http_client');

function sign_function(credentials, http_method, path, params, headers) {
    var auth = new Auth(credentials.ak, credentials.sk);
    return auth.generateAuthorization(http_method, path, params, headers);
}

describe('HttpClient', function() {
    it('invalidUrl', function(done) {
        var fail = this.fail.bind(this);

        var config = {
            'endpoint': 'http://no-such-url',
        };
        var client = new HttpClient(config);
        client.sendRequest('GET', '/')
            .then(
                function() {
                    fail('Should not reach here');
                },
                function(e) {
                    expect(e.code).toEqual('ENOTFOUND');
                }
            )
            .then(done);
    });

    it('get', function(done) {
        var config = {
            'endpoint': 'https://bs.baidu.com'
        };
        var client = new HttpClient(config);

        client.sendRequest('GET', '/adtest/test.json')
            .then(function(response) {
                expect(response.body).toEqual({hello: 'world'});
                expect(response.http_headers['content-type']).toEqual('text/json');
                expect(response.http_headers.server).toEqual('BaiduBS');
                expect(response.http_headers.etag).toEqual('d0b8560f261410878a68bbe070d81853');
            })
            .then(done);
    });

    it('invalidHttpStatus', function(done) {
        var config = {
            'endpoint': 'https://bs.baidu.com'
        };
        var client = new HttpClient(config);
        client.sendRequest('GET', '/')
            .then(
                function(){ fail('Should not reach here'); },
                function(e) {
                    expect(e.status_code).toEqual(403);
                }
            )
            .then(done);
    });

    it('sendRequest', function(done) {
        var fail = this.fail.bind(this);

        var config = require('./config');
        var client = new HttpClient(config);

        client.sendRequest('GET', '/v1', null, null, null, sign_function)
            .then(
                function(response) {
                    expect(response.http_headers['content-type']).toEqual('application/json; charset=utf-8');
                    expect(response.http_headers.hasOwnProperty('x-bce-request-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('x-bce-debug-id')).toEqual(true);
                    expect(response.body.owner).toEqual({
                        id: '992c67ee10be4e85bf444d18b638f9ba',
                        displayName: 'PASSPORT:105015804'
                    });
                    expect(Array.isArray(response.body.buckets)).toEqual(true);
                },
                function(e) {
                    fail(e);
                }
            )
            .then(done);
    });


    it('readRequestBodyFromBuffer', function(done) {
        var fail = this.fail.bind(this);

        var grant_list = [
            {
                grantee: [
                    {id: '992c67ee10be4e85bf444d18b638f9ba'},
                    {id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}
                ],
                permission: ['FULL_CONTROL']
            }
        ]
        var bucket = 'no-such-bucket-name';

        // Prepare the request body
        var body = new Buffer(JSON.stringify({accessControlList: grant_list}));

        var config = require('./config');
        var client = new HttpClient(config);
        var path = '/v1/' + bucket;


        client.sendRequest('DELETE', path, null, null, null, sign_function)
            .then(start, start);

        function start() {
            // Create the bucket
            client.sendRequest('PUT', path, null, null, null, sign_function)
                .then(function(x) {
                    // Set bucket acl
                    var params = {'acl': ''};
                    return client.sendRequest('PUT', path, body, null, params, sign_function);
                })
                .then(function(response) {
                    expect(response.http_headers.hasOwnProperty('x-bce-request-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('x-bce-debug-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('content-length')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('date')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('server')).toEqual(true);
                    expect(response.body).toEqual({});
                })
                .then(function() {
                    return client.sendRequest('DELETE', path, null, null, null, sign_function);
                })
                .catch(fail)
                .fin(done);
        }
    });

    it('readRequestBodyFromString', function(done) {
        var fail = this.fail.bind(this);

        var grant_list = [
            {
                grantee: [
                    {id: '992c67ee10be4e85bf444d18b638f9ba'},
                    {id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}
                ],
                permission: ['FULL_CONTROL']
            }
        ]
        var bucket = 'no-such-bucket-name';

        // Prepare the request body
        var body = JSON.stringify({accessControlList: grant_list});

        var config = require('./config');
        var client = new HttpClient(config);
        var path = '/v1/' + bucket;


        client.sendRequest('DELETE', path, null, null, null, sign_function)
            .then(start, start);

        function start() {
            // Create the bucket
            client.sendRequest('PUT', path, null, null, null, sign_function)
                .then(function(x) {
                    // Set bucket acl
                    var params = {'acl': ''};
                    return client.sendRequest('PUT', path, body, null, params, sign_function);
                })
                .then(function(response) {
                    expect(response.http_headers.hasOwnProperty('x-bce-request-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('x-bce-debug-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('content-length')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('date')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('server')).toEqual(true);
                    expect(response.body).toEqual({});
                })
                .then(function() {
                    return client.sendRequest('DELETE', path, null, null, null, sign_function);
                })
                .catch(fail)
                .fin(done);
        }
    });

    it('readRequestBodyFromStream', function(done) {
        var fail = this.fail.bind(this);

        var grant_list = [
            {
                grantee: [
                    {id: '992c67ee10be4e85bf444d18b638f9ba'},
                    {id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}
                ],
                permission: ['FULL_CONTROL']
            }
        ]
        var bucket = 'no-such-bucket-name';

        var access_control_list = JSON.stringify({accessControlList: grant_list});
        // Prepare the request body
        var Readable = require('stream').Readable
        var body = new Readable();
        body.push(access_control_list);
        body.push(null);

        var config = require('./config');
        var client = new HttpClient(config);
        var path = '/v1/' + bucket;


        client.sendRequest('DELETE', path, null, null, null, sign_function)
            .then(start, start);

        function start() {
            // Create the bucket
            client.sendRequest('PUT', path, null, null, null, sign_function)
                .then(function(x) {
                    // Set bucket acl
                    var params = {'acl': ''};
                    var headers = {'Content-Length': Buffer.byteLength(access_control_list)};
                    return client.sendRequest('PUT', path, body, headers, params, sign_function);
                })
                .then(function(response) {
                    expect(response.http_headers.hasOwnProperty('x-bce-request-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('x-bce-debug-id')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('content-length')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('date')).toEqual(true);
                    expect(response.http_headers.hasOwnProperty('server')).toEqual(true);
                    expect(response.body).toEqual({});
                })
                .then(function() {
                    return client.sendRequest('DELETE', path, null, null, null, sign_function);
                })
                .catch(fail)
                .fin(done);
        }
    });

    it('sendRequestWithOutputStream', function(done) {
        var fail = this.fail.bind(this);

        var config = require('./config');
        var client = new HttpClient(config);

        var WMStream = require('./wm_stream');
        var output_stream = new WMStream();
        client.sendRequest('GET', '/v1', null, null, null, sign_function, output_stream)
            .then(function(response) {
                expect(response.body).toEqual({});
                expect(output_stream.store.length).toBeGreaterThan(0);
                var owner = JSON.parse(output_stream.store.toString()).owner;
                expect(owner).toEqual({"id":"992c67ee10be4e85bf444d18b638f9ba","displayName":"PASSPORT:105015804"});
            })
            .catch(fail)
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
