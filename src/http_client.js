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
 * @file src/http_client.js
 * @author leeight
 */

/*eslint-env node*/
/*eslint max-params:[0,10]*/

var util = require('util');
var stream = require('stream');

var u = require('underscore');
var Q = require('q');

var H = require('./headers');

/**
 * @constructor
 * @param {Object} config The http client configuration.
 */
function HttpClient(config) {
    this.config = config;

    /**
     * http(s) request object
     * @type {Object}
     */
    this._req = null;
}


/**
 * @param {string} httpMethod GET,POST,PUT,DELETE,HEAD
 * @param {string} path The http request path.
 * @param {(string|Buffer|stream.Readable)=} body The request body. If `body` is a
 * stream, `Content-Length` must be set explicitly.
 * @param {Object=} headers The http request headers.
 * @param {Object=} params The querystrings in url.
 * @param {function():string=} signFunction The `Authorization` signature function
 * @param {stream.Writable=} outputStream The http response body.
 *
 * @reslove {{http_headers:Object,body:Object}}
 * @reject {Object}
 *
 * @return {Q.defer}
 */
HttpClient.prototype.sendRequest = function (httpMethod, path, body, headers, params,
    signFunction, outputStream) {

    var requestUrl = this._getRequestUrl(path, params);
    var options = require('url').parse(requestUrl);

    // Prepare the request headers.
    var defaultHeaders = {};
    if (typeof navigator === 'object') {
        defaultHeaders[H.USER_AGENT] = navigator.userAgent;
    }
    else {
        defaultHeaders[H.USER_AGENT] = util.format('bce-sdk-nodejs/%s/%s/%s', require('../package.json').version,
            process.platform, process.version);
    }
    defaultHeaders[H.X_BCE_DATE] = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    defaultHeaders[H.CONNECTION] = 'close';
    defaultHeaders[H.CONTENT_TYPE] = 'application/json; charset=utf-8';
    defaultHeaders[H.HOST] = options.host;

    headers = u.extend({}, defaultHeaders, headers);

    // if (!headers.hasOwnProperty(H.X_BCE_REQUEST_ID)) {
    //    headers[H.X_BCE_REQUEST_ID] = this._generateRequestId();
    // }

    // Check the content-length
    if (!headers.hasOwnProperty(H.CONTENT_LENGTH)) {
        headers[H.CONTENT_LENGTH] = this._guessContentLength(body);
    }

    if (typeof signFunction === 'function') {
        headers[H.AUTHORIZATION] = signFunction(this.config.credentials,
            httpMethod, path, params, headers);
    }

    var api = options.protocol === 'https:' ? require('https') : require('http');
    options.method = httpMethod;
    options.headers = headers;

    var deferred = Q.defer();

    var client = this;
    var req = client._req = api.request(options, function (res) {
        if (outputStream
            && outputStream instanceof stream.Writable) {
            res.pipe(outputStream);
            res.on('end', function () {
                deferred.resolve(success(client._fixHeaders(res.headers), {}));
            });
            return;
        }

        deferred.resolve(client._recvResponse(res));
    });

    req.on('error', function (error) {
        deferred.reject(error);
    });

    try {
        client._sendRequest(req, body);
    }
    catch(ex) {
        deferred.reject(ex);
    }

    return deferred.promise;
};

HttpClient.prototype._generateRequestId = function () {
    function chunk() {
        var v = (~~(Math.random() * 0xffff)).toString(16);
        if (v.length < 4) {
            v += new Array(4 - v.length + 1).join('0');
        }
        return v;
    }

    return util.format('%s%s-%s-%s-%s-%s%s%s',
        chunk(), chunk(), chunk(), chunk(),
        chunk(), chunk(), chunk(), chunk());
};

HttpClient.prototype._guessContentLength = function (data) {
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

HttpClient.prototype._fixHeaders = function (headers) {
    var fixedHeaders = {};

    if (headers) {
        Object.keys(headers).forEach(function (key) {
            var value = headers[key].trim();
            if (value) {
                key = key.toLowerCase();
                if (key === 'etag') {
                    value = value.replace(/"/g, '');
                }
                fixedHeaders[key] = value;
            }
        });
    }

    return fixedHeaders;
};

HttpClient.prototype._recvResponse = function (res) {
    var responseHeaders = this._fixHeaders(res.headers);
    var statusCode = res.statusCode;

    function parseHttpResponseBody(raw) {
        var contentType = responseHeaders['content-type'];

        if (!raw.length) {
            return {};
        }
        else if (contentType
                 && /(application|text)\/json/.test(contentType)) {
            return JSON.parse(raw.toString());
        }
        return raw;
    }

    var deferred = Q.defer();

    var payload = [];
    /*eslint-disable*/
    res.on('data', function (chunk) { payload.push(chunk); });
    res.on('error', function (e) { deferred.reject(e); });
    /*eslint-enable*/
    res.on('end', function () {
        var raw = Buffer.concat(payload);
        var responseBody = null;

        try {
            responseBody = parseHttpResponseBody(raw);
        }
        catch (e) {
            deferred.reject(e);
            return;
        }

        if (statusCode >= 100 && statusCode < 200) {
            deferred.reject(failure(statusCode, 'Can not handle 1xx http status code.'));
        }
        else if (statusCode < 100 || statusCode >= 300) {
            if (responseBody.requestId) {
                deferred.reject(failure(statusCode, responseBody.message,
                    responseBody.code, responseBody.requestId));
            }
            else {
                deferred.reject(failure(statusCode, responseBody));
            }
        }

        deferred.resolve(success(responseHeaders, responseBody));
    });

    return deferred.promise;
};

HttpClient.prototype._sendRequest = function (req, data) {
    /*eslint-disable*/
    if (!data) { req.end(); return; }
    if (typeof data === 'string') { data = new Buffer(data); }
    /*eslint-enable*/

    if (Buffer.isBuffer(data)) {
        req.write(data);
        req.end();
    }
    else if (data instanceof stream.Readable) {
        if (!data.readable) {
            throw new Error('stream is not readable');
        }

        data.on('data', function (chunk) {
            req.write(chunk);
        });
        data.on('end', function () {
            req.end();
        });
    }
    else {
        throw new Error('Invalid body type = ' + typeof data);
    }
};

HttpClient.prototype._getRequestUrl = function (path, params) {
    var uri = encodeURI(path);
    var queryString = require('querystring').encode(params);
    if (queryString) {
        uri += '?' + queryString;
    }

    return this.config.endpoint + uri;
};

function success(httpHeaders, body) {
    var response = {};

    response[H.X_HTTP_HEADERS] = httpHeaders;
    response[H.X_BODY] = body;

    return response;
}

function failure(statusCode, message, code, requestId) {
    var response = {};

    response[H.X_STATUS_CODE] = statusCode;
    response[H.X_MESSAGE] = message;
    if (code) {
        response[H.X_CODE] = code;
    }
    if (requestId) {
        response[H.X_REQUEST_ID] = requestId;
    }

    return response;
}

module.exports = HttpClient;









/* vim: set ts=4 sw=4 sts=4 tw=120: */
