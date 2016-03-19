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
 * @file src/doc_client.js
 * @author guofan
 */

/* eslint-env node */
/* eslint max-params:[0,10] */
/* eslint fecs-camelcase:[2,{"ignore":["/opt_/"]}] */

var fs = require('fs');
var path = require('path');
var util = require('util');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('bce-sdk:DocClient');

var BosClient = require('./bos_client');
var BceBaseClient = require('./bce_base_client');
var UploadHelper = require('./helper');
var crypto = require('./crypto');

var DATA_TYPE_FILE     = 1;
var DATA_TYPE_BUFFER   = 2;
var DATA_TYPE_BLOB     = 4;

/**
 * 文档转码任务接口（Job/Transcoding API）
 * http://bce.baidu.com/doc/DOC/API.html#.1D.1E.B0.1E.6C.74.0C.6D.C1.68.D2.57.6F.70.EA.F1
 *
 * @constructor
 * @param {Object} config The doc client configuration.
 * @extends {BceBaseClient}
 */
function DocClient(config) {
    BceBaseClient.call(this, config, 'doc', false);
}
util.inherits(DocClient, BceBaseClient);

// --- B E G I N ---

DocClient.prototype._buildUrl = function () {
    return '/v1/document';
};

/**
 * Create a document transfer job from local file, buffer, readable stream or blob.
 *
 * @param {Blob|Buffer|string} data The document data. If the data type
 *   is string, which means the file path.
 * @param {Object=} opt_options The extra options.
 * @return {Promise}
 */
DocClient.prototype.createDocument = function (data, opt_options) {
    var options = u.extend({meta: {}}, opt_options);
    var dataType = -1;

    if (u.isString(data)) {
        dataType = DATA_TYPE_FILE;
        options.meta.sizeInBytes = fs.lstatSync(data).size;
        options.format = options.format || path.extname(data).substr(1);
        options.title = options.title || path.basename(data, path.extname(data));
    }
    else if (Buffer.isBuffer(data)) {
        if (options.format == null || options.title == null) {
            return Q.reject(new Error('buffer type required options.format and options.title'));
        }
        dataType = DATA_TYPE_BUFFER;
        options.meta.sizeInBytes = data.length;
        // 同步计算 MD5
        options.meta.md5 = options.meta.md5 || crypto.md5sum(data, null, 'hex');
    }
    else if (typeof Blob !== 'undefined' && data instanceof Blob) {
        dataType = DATA_TYPE_BLOB;
        options.meta.sizeInBytes = data.size;
        options.format = options.format || path.extname(data).substr(1);
        options.title = options.title || path.basename(data, path.extname(data));
    }
    else {
        return Q.reject(new Error('Unsupported dataType.'));
    }

    if (!options.title || !options.format) {
        return Q.reject(new Error('`title` and `format` are required.'));
    }

    if (options.meta.md5) {
        return this._doCreateDocument(data, options);
    }

    var self = this;
    if (dataType === DATA_TYPE_FILE) {
        return crypto.md5stream(fs.createReadStream(data), 'hex')
            .then(function (md5) {
                options.meta.md5 = md5;
                return self._doCreateDocument(data, options);
            });
    }
    else if (dataType === DATA_TYPE_BLOB) {
        return crypto.md5blob(data, 'hex')
            .then(function (md5) {
                options.meta.md5 = md5;
                return self._doCreateDocument(data, options);
            });
    }
    return this._doCreateDocument(data, options);
};

DocClient.prototype._doCreateDocument = function (data, options) {
    var documentId = null;
    var bucket = null;
    var object = null;
    var bosEndpoint = null;

    var self = this;

    return self.registerDocument(options)
        .then(function (response) {
            debug('registerDocument[response = %j]', response);

            documentId = response.body.documentId;
            bucket = response.body.bucket;
            object = response.body.object;
            bosEndpoint = response.body.bosEndpoint;

            var bosConfig = u.extend({}, self.config, {endpoint: bosEndpoint});
            var bosClient = new BosClient(bosConfig);

            return UploadHelper.upload(bosClient, bucket, object, data);
        })
        .then(function (response) {
            debug('upload[response = %j]', response);
            return self.publishDocument(documentId);
        })
        .then(function (response) {
            debug('publishDocument[response = %j]', response);
            return {
                documentId: documentId,
                bucket: bucket,
                object: object,
                bosEndpoint: bosEndpoint
            };
        });
};

DocClient.prototype.registerDocument = function (options) {
    debug('registerDocument[options = %j]', options);

    var url = this._buildUrl();
    return this.sendRequest('POST', url, {
        params: {register: ''},
        body: JSON.stringify(options)
    });
};

DocClient.prototype.publishDocument = function (documentId) {
    var url = this._buildUrl();
    url = url + '/' + documentId;
    return this.sendRequest('PUT', url, {
        params: {publish: ''}
    });
};

// --- E   N   D ---

module.exports = DocClient;
