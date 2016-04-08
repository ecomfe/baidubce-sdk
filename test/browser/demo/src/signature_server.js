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
 * @file demo/src/signature_server.js
 * @author leeight
 */

var http = require('http');
var url = require('url');
var util = require('util');

var Auth = require('../../../../src/auth');

var kCredentials = {
    ak: '9fe103ae98de4798aabb34a433a3058b',
    sk: 'b084ab23d1ef44c997d10d2723dd8014'
};

function safeParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (ex) {
        return null;
    }
}

// BosClient.prototype.createSignature = function (credentials, httpMethod, path, params, headers) {
// http://signature_server/ack?httpMethod=$0&path=$1&params=$2&headers=$3
http.createServer(function (req, res) {
    console.log(req.url);

    // query: { httpMethod: '$0', path: '$1', params: '$2', headers: '$3' },
    var query = url.parse(req.url, true).query;

    var statusCode = 200;
    var signature = null;
    if (!query.httpMethod || !query.path || !query.params || !query.headers) {
        statusCode = 403;
    }
    else {
        var httpMethod = query.httpMethod;
        var path = query.path;
        var params = safeParse(query.params) || {};
        var headers = safeParse(query.headers) || {};

        var auth = new Auth(kCredentials.ak, kCredentials.sk);
        signature = auth.generateAuthorization(httpMethod, path, params, headers);
    }

    // 最多10s的延迟
    var delay = Math.min(query.delay || 0, 10);
    setTimeout(function () {
        var payload = {
            statusCode: statusCode,
            signature: signature,
            xbceDate: new Date().toISOString().replace(/\.\d+Z$/, 'Z')
        };

        res.writeHead(statusCode, {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        if (query.callback) {
            res.end(util.format('%s(%s)', query.callback, JSON.stringify(payload)));
        }
        else {
            res.end(JSON.stringify(payload));
        }
    }, delay * 1000);
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');

/* vim: set ts=4 sw=4 sts=4 tw=120: */
