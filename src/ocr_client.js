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
 * @file src/ocr_client.js
 * @author leeight
 */

/* eslint-env node */
/* eslint max-params:[0,10] */

var util = require('util');

var u = require('underscore');
var Q = require('q');
var debug = require('debug')('OCRClient');

var Auth = require('./auth');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');

/**
 * OCR API
 *
 * @see http://gollum.baidu.com/bceocrapi
 * @constructor
 * @param {Object} config The face client configuration.
 * @extends {BceBaseClient}
 */
function OCRClient(config) {
    BceBaseClient.call(this, config, 'face', true);

    /**
     * @type {HttpClient}
     */
    this._httpAgent = null;
}
util.inherits(OCRClient, BceBaseClient);

// --- BEGIN ---

OCRClient.prototype._apiCall = function (url, data, language, options) {
    debug('url = %j, data = %j, language = %j, options = %j',
        url, data, language, options);

    options = options || {};

    var body = {};
    if (Buffer.isBuffer(data)) {
        body = {
            base64: data.toString('base64')
        };
    }
    else {
        body = {
            bosPath: data
        };
    }

    if (language) {
        body.language = language;
    }

    return this._sendRequest('POST', url, {
        body: JSON.stringify(body),
        config: options.config
    });
};

OCRClient.prototype.allText = function (data, language, options) {
    return this._apiCall('/v1/recognize/text', data, language, options);
};

OCRClient.prototype.oneLine = function (data, language, options) {
    return this._apiCall('/v1/recognize/line', data, language, options);
};

OCRClient.prototype.singleCharacter = function (data, language, options) {
    return this._apiCall('/v1/recognize/character', data, language, options);
};

OCRClient.prototype.createSignature = function (credentials, httpMethod, path, params, headers) {
    return Q.fcall(function () {
        var auth = new Auth(credentials.ak, credentials.sk);
        return auth.generateAuthorization(httpMethod, path, params, headers);
    });
};

// --- E N D ---


OCRClient.prototype._sendRequest = function (httpMethod, resource, varArgs) {
    var defaultArgs = {
        body: null,
        headers: {},
        params: {},
        config: {},
        outputStream: null
    };
    var args = u.extend(defaultArgs, varArgs);

    var config = u.extend({}, this.config, args.config);

    var client = this;
    var agent = this._httpAgent = new HttpClient(config);
    u.each(['progress', 'error', 'abort'], function (eventName) {
        agent.on(eventName, function (evt) {
            client.emit(eventName, evt);
        });
    });
    return this._httpAgent.sendRequest(httpMethod, resource, args.body,
        args.headers, args.params, u.bind(this.createSignature, this),
        args.outputStream
    );
};

module.exports = OCRClient;









/* vim: set ts=4 sw=4 sts=4 tw=120: */
