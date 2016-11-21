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

var debug = require('debug')('bce-sdk:OCRClient');

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

    return this.sendRequest('POST', url, {
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

module.exports = OCRClient;









