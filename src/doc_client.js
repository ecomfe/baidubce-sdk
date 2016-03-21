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
var builtinUrl = require('url');

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
    var pattern = /^bos:\/\//;

    if (u.isString(data)) {
        if (pattern.test(data)) {
            // createDocumentFromBosObject
            try {
                var parsed = builtinUrl.parse(data);
                var bucket = parsed.host;
                var object = parsed.pathname.substr(1);

                options = u.extend(options, parsed.query);
                var title = options.title || path.basename(object);
                var format = options.format || path.extname(object).substr(1);
                var notification = options.notification;
                return this.createDocumentFromBosObject(bucket, object,
                    title, format, notification);
            }
            catch (error) {
                return Q.reject(error);
            }
        }

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
            response.body = {
                documentId: documentId,
                bucket: bucket,
                object: object,
                bosEndpoint: bosEndpoint
            };
            return response;
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

DocClient.prototype.getDocument = function (documentId) {
    var url = this._buildUrl() + '/' + documentId;
    return this.sendRequest('GET', url);
};

/**
 * Get docId and token to render the document in the browser.
 *
 * ```html
 * <div id="reader"></div>
 * <script src="http://bce.bdstatic.com/doc/doc_reader.js"></script>
 * <script>
 * var host = location.host;
 * var option = {
 *     docId: <docId>,
 *     token: <token>,
 *     host: <host>
 * };
 * new Document('reader', option);
 * </script>
 * ```
 *
 * @param {string} documentId The document Id.
 * @return {Promise}
 */
DocClient.prototype.readDocument = function (documentId) {
    var url = this._buildUrl() + '/' + documentId;
    return this.sendRequest('GET', url, {
        params: {read: ''}
    });
};

/**
 * Create document from bos object.
 *
 * 1. The BOS bucket must in bj-region.
 * 2. The BOS bucket permission must be public-read.
 *
 * 用户需要将源文档所在BOS bucket权限设置为公共读，或者在自定义权限设置中为开放云文档转码服务账号
 *（沙盒：798c20fa770840438a29efd66cdccf7f，线上：183db8cd3d5a4bf9a94459f89a7a3a91）添加READ权限。
 *
 * 文档转码服务依赖文档的md5，为提高转码性能，文档转码服务需要用户为源文档指定md5；
 * 因此用户需要在上传文档至BOS时设置自定义meta header x-bce-meta-md5来记录源文档md5。
 * 补充说明：实际上当用户没有为源文档设置x-bce-meta-md5 header时，文档转码服务还会
 * 尝试根据BOS object ETag解析源文档md5，如果解析失败（ETag以'-'开头），才会真正报错。
 *
 * @param {string} bucket The bucket name in bj region.
 * @param {string} object The object name.
 * @param {string} title The document title.
 * @param {string=} opt_format The document extension is possible.
 * @param {string=} opt_notification The notification name.
 * @return {Promise}
 */
DocClient.prototype.createDocumentFromBosObject = function (
    bucket, object, title, opt_format, opt_notification) {
    var url = this._buildUrl();

    var body = {
        bucket: bucket,
        object: object,
        title: title
    };

    var format = opt_format || path.extname(object).substr(1);
    if (!format) {
        throw new Error('Document format parameter required');
    }

    body.format = format;
    if (opt_notification) {
        body.notification = opt_notification;
    }

    debug('createDocumentFromBosObject:arguments = [%j], body = [%j]', arguments, body);
    return this.sendRequest('POST', url, {
        params: {bos: ''},
        body: JSON.stringify(body),
        headers: {
            'x-bce-doc-format': format,
            'x-bce-doc-title': title
        }
    });
};

DocClient.prototype.removeAll = function () {
    var self = this;
    return self.listDocuments().then(function (response) {
        var asyncTasks = (response.body.documents || []).map(function (item) {
            return self.removeDocument(item.documentId);
        });
        return Q.all(asyncTasks);
    });
};

DocClient.prototype.removeDocument = function (documentId) {
    var url = this._buildUrl() + '/' + documentId;
    return this.sendRequest('DELETE', url);
};

DocClient.prototype.listDocuments = function (opt_status) {
    var status = opt_status || '';

    var url = this._buildUrl();
    return this.sendRequest('GET', url, {
        params: {status: status}
    });
};

// --- E   N   D ---

module.exports = DocClient;
