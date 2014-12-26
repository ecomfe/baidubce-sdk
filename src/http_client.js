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
var stream = require('stream');

var Q = require('q');

/**
 * @constructor
 * @param {Object} config The http client configuration.
 */
function HttpClient(config) {
    this.config = config;
}


// public function sendRequest($http_method, $path, $body = null, $headers = array(),
//                             $params = array(), $sign_function = null, $output_stream = null) {
HttpClient.prototype.sendRequest = function(http_method, path, opt_body,
                                            opt_headers, opt_params, opt_sign_function,
                                            opt_output_stream) {

    var body = opt_body || null;
    var headers = opt_headers || {};
    var params = opt_params || {};

    var request_url = this._getRequestUrl(path, params);
    var options = require('url').parse(request_url);

    // Prepare the request headers.
    var default_headers = {
        'User-Agent': util.format("bce-sdk-nodejs/%s/%s/%s", require('../package.json').version,
                                  process.platform, process.version),
        'x-bce-date': new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
        'Connection': 'close',
        // 'Expect': '',
        // 'Transfer-Encoding': '',
        'Content-Type': 'application/json; charset=utf-8',
        'Host': options.host,
    };
    for (var key in default_headers) {
        if (!headers.hasOwnProperty(key)) {
            headers[key] = default_headers[key];
        }
    }
    if (typeof opt_sign_function === 'function') {
        headers['Authorization'] = opt_sign_function(this.config['credentials'],
            http_method, path, params, headers);
    }

    // Check the content-length
    if (!headers.hasOwnProperty('Content-Length')) {
        headers['Content-Length'] = this._guessContentLength(body);
    }

    var api = options.protocol === 'https:' ? require('https') : require('http');
    options.method = http_method;
    options.headers = headers;

    var deferred = Q.defer();

    var client = this;
    var req = api.request(options, function(res) {
        if (opt_output_stream
            && opt_output_stream instanceof stream.Writable) {
            res.pipe(opt_output_stream);
            res.on('end', function(){
                deferred.resolve({
                    http_headers: client._fixHeaders(res.headers),
                    body: {},
                });
            });
            return;
        }

        deferred.resolve(client._recvResponse(res));
    });

    req.on('error', function(e) {
        deferred.reject(e);
    });

    client._sendRequest(req, body);

    return deferred.promise;
};

HttpClient.prototype._guessContentLength = function(data) {
    if (data == null) {
        return 0;
    }
    else if (typeof data === 'string') {
        return Buffer.byteLength(data);
    }
    else if (Buffer.isBuffer(data)) {
        return data.length;
    }

    throw new Error('No Content-Length is specified.');
};

HttpClient.prototype._fixHeaders = function(headers) {
    var fixed_headers = {};

    Object.keys(headers).forEach(function(key) {
        var value = headers[key].trim();
        if (value) {
            key = key.toLowerCase();
            if (key === 'etag') {
                value = value.replace(/"/g, '');
            }
            fixed_headers[key] = value;
        }
    });

    return fixed_headers;
};

HttpClient.prototype._recvResponse = function(res) {
    var response_headers = this._fixHeaders(res.headers);
    var status_code = res.statusCode;

    function parseHttpResponseBody(raw) {
        var content_type = response_headers['content-type'];

        if (!raw.length) {
            return {};
        }
        else if (content_type
                 && /(application|text)\/json/.test(content_type)) {
            return JSON.parse(raw.toString());
        }
        else {
            return raw;
        }
    }

    var deferred = Q.defer();

    var payload = [];
    res.on('data', function(chunk) { payload.push(chunk); });
    res.on('error', function(e) { deferred.reject(e); });
    res.on('end', function(){
        var raw = Buffer.concat(payload);
        var response_body = null;

        try {
            response_body = parseHttpResponseBody(raw);
        }
        catch (e) {
            deferred.reject(e);
            return;
        }

        if (status_code >= 100 && status_code < 200) {
            deferred.reject({
                status_code: status_code,
                message: 'Can not handle 1xx http status code.',
            });
        }
        else if (status_code < 100 || status_code >= 300) {
            if (response_body['requestId']) {
                deferred.reject({
                    status_code: status_code,
                    message: response_body['message'],
                    code: response_body['code'],
                    request_id: response_body['requestId'],
                });
            }
            else {
                deferred.reject({
                    status_code: status_code,
                    message: response_body,
                });
            }
        }

        deferred.resolve({
            http_headers: response_headers,
            body: response_body,
        });
    });

    return deferred.promise;
};

HttpClient.prototype._sendRequest = function(req, data) {
    if (!data) { req.end(); return; }
    if (typeof data === 'string') { data = new Buffer(data); }

    if (Buffer.isBuffer(data)) {
        req.write(data);
        req.end();
    }
    else if (data instanceof stream.Readable) {
        data.on('data', function(chunk) {
            req.write(chunk);
        });
        data.on('end', function(){
            req.end();
        });
    }
    else {
        throw new Error('Invalid body type = ' + typeof data);
    }
};

HttpClient.prototype._getRequestUrl = function(path, params) {
    var uri = encodeURI(path);
    var query_string = require('querystring').encode(params);
    if (query_string) {
        uri += '?' + query_string;
    }

    return this.config['endpoint'] + uri;
};

module.exports = HttpClient;









/* vim: set ts=4 sw=4 sts=4 tw=120: */
