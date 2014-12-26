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

describe('HttpClient', function() {
    it('invalidUrl', function(done) {
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
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
