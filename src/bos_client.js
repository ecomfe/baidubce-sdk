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

var u = require('underscore');
var Q = require('q');

var Auth = require('./auth');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');
var MimeType = require('./mime.types');
var WMStream = require('./wm_stream');


const MIN_PART_SIZE = 5242880;                // 5M
const MAX_PUT_OBJECT_LENGTH = 5368709120;     // 5G
const MAX_USER_METADATA_SIZE = 2048;          // 2 * 1024
const MIN_PART_NUMBER = 1;
const MAX_PART_NUMBER = 10000;

/**
 * @constructor
 * @param {Object} config The bos client configuration.
 * @extends {BceBaseClient}
 */
function BosClient (config) {
    BceBaseClient.call(this, config, 'bos', true);
}
util.inherits(BosClient, BceBaseClient);

// --- B E G I N ---
BosClient.prototype.generatePresignedUrl = function (bucket_name, key,
                                                     opt_timestamp,
                                                     opt_expiration_in_seconds,
                                                     opt_headers,
                                                     opt_params,
                                                     opt_headers_to_sign,
                                                     opt_config) {

    var timestamp = opt_timestamp || 0;
    var expiration_in_seconds = opt_expiration_in_seconds || 1800;
    var headers = opt_headers || {};
    var params = opt_params || {};
    var headers_to_sign = opt_headers_to_sign || [];
    var config = u.extend({}, this.config, opt_config || {});

    var resource = path.normalize(path.join(
        '/v1',
        bucket_name || '',
        key || ''
    ));

    headers['Host'] = require('url').parse(config.endpoint).host;

    var credentials = config.credentials;
    var auth = new Auth(credentials.ak, credentials.sk);
    var authorization = auth.generateAuthorization(
        'GET', resource, params, headers, timestamp, expiration_in_seconds,
        headers_to_sign);

    return util.format("%s%s?authorization=%s", config.endpoint,
        resource, encodeURIComponent(authorization));
}

BosClient.prototype.listBuckets = function (opt_options) {
    var options = opt_options || {};
    return this._sendRequest('GET', {config: options.config});
};

BosClient.prototype.createBucket = function (bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        config: options.config
    });
};

BosClient.prototype.listObjects = function (bucket_name, opt_options) {
    var options = opt_options || {};

    var params = u.extend(
        {maxKeys: 1000},
        u.pick(options, 'maxKeys', 'prefix', 'marker', 'delimiter')
    );

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        params: params,
        config: options.config
    });
};

BosClient.prototype.doesBucketExist = function (bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('HEAD', {
        bucket_name: bucket_name,
        config: options.config
    }).then(
        /*eslint-disable*/
        function () {
            return Q(true);
        },
        function (e) {
            if (e && e.status_code === 403) {
                return Q(true);
            }
            if (e && e.status_code === 404) {
                return Q(false);
            }
            return Q.reject(e);
        }
        /*eslint-enable*/
    );
};

BosClient.prototype.deleteBucket = function (bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('DELETE', {
        bucket_name: bucket_name,
        config: options.config
    });
};

BosClient.prototype.setBucketCannedAcl = function (bucket_name, canned_acl, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        headers: {'x-bce-acl': canned_acl},
        params: {'acl': ''},
        config: options.config
    });
};

BosClient.prototype.setBucketAcl = function (bucket_name, acl, opt_options) {
    var options = opt_options || {};
    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        body: JSON.stringify({accessControlList: acl}),
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        params: {'acl': ''},
        config: options.config
    });
};

BosClient.prototype.getBucketAcl = function (bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        params: {'acl': ''},
        config: options.config
    });
};

BosClient.prototype.deleteObject = function (bucket_name, key, opt_options) {
    var options = opt_options || {};
    return this._sendRequest('DELETE', {
        bucket_name: bucket_name,
        key: key,
        config: options.config
    });
};

BosClient.prototype.putObject = function (bucket_name, key, data, opt_options) {
    if (!key) {
        throw new TypeError('key should not be empty.');
    }

    var options = this._checkOptions(opt_options || {});

    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        key: key,
        body: data,
        headers: options.headers,
        config: options.config
    });
};

BosClient.prototype.putObjectFromString = function (bucket_name, key, data, opt_options) {
    var options = u.extend({
        'Content-Length': Buffer.byteLength(data),
        'Content-MD5': require('./crypto').md5sum(data)
    }, opt_options);
    return this.putObject(bucket_name, key, data, options);
};

BosClient.prototype.putObjectFromFile = function (bucket_name, key, filename, opt_options) {
    var options = u.extend({
        'Content-Length': fs.statSync(filename).size,
        'Content-Type': MimeType.guess(path.extname(filename))
    }, opt_options);

    var fp = fs.createReadStream(filename);
    if (!u.has(options, 'Content-MD5')) {
        var me = this;
        return require('./crypto').md5file(filename)
            .then(function (md5sum) {
                options['Content-MD5'] = md5sum;
                return me.putObject(bucket_name, key, fp, options);
            });
    }
    return this.putObject(bucket_name, key, fp, options);
};

BosClient.prototype.getObjectMetadata = function (bucket_name, key, opt_options) {
    var options = opt_options || {};
    return this._sendRequest('HEAD', {
        bucket_name: bucket_name,
        key: key,
        config: options.config
    });
};

BosClient.prototype.getObject = function (bucket_name, key, opt_range, opt_options) {
    var options = opt_options || {};

    var output_stream = new WMStream();
    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        key: key,
        headers: {
            'Range': opt_range ? util.format('bytes=%s', opt_range) : ''
        },
        config: options.config,
        output_stream: output_stream
    }).then(function (response) {
        response.body = output_stream.store;
        return response;
    });
};

BosClient.prototype.getObjectToFile = function (bucket_name, key, filename, opt_range, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        key: key,
        headers: {
            'Range': opt_range ? util.format('bytes=%s', opt_range) : ''
        },
        config: options.config,
        output_stream: fs.createWriteStream(filename)
    });
};

BosClient.prototype.copyObject = function (source_bucket_name, source_key,
                                           target_bucket_name, target_key,
                                           opt_options) {
    /*eslint-disable*/
    if (!source_bucket_name) { throw new TypeError('source_bucket_name should not be empty'); }
    if (!source_key) { throw new TypeError('source_key should not be empty'); }
    if (!target_bucket_name) { throw new TypeError('target_bucket_name should not be empty'); }
    if (!target_key) { throw new TypeError('target_key should not be empty'); }
    /*eslint-enable*/

    var options = this._checkOptions(opt_options || {});
    var has_user_metadata = false;
    u.some(options.headers, function (value, key) {
        if (key.indexOf('x-bce-meta-') === 0) {
            has_user_metadata = true;
            return true;
        }
    });
    options.headers['x-bce-copy-source'] = encodeURI(util.format('/%s/%s',
        source_bucket_name, source_key));
    if (u.has(options.headers, 'ETag')) {
        options.headers['x-bce-copy-source-if-match'] = options.headers.ETag;
    }
    options.headers['x-bce-metadata-directive'] = has_user_metadata ? 'replace' : 'copy';

    return this._sendRequest('PUT', {
        bucket_name: target_bucket_name,
        key: target_key,
        headers: options.headers,
        config: options.config
    });
};

BosClient.prototype.initiateMultipartUpload = function (bucket_name, key, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('POST', {
        bucket_name: bucket_name,
        key: key,
        params: {'uploads': ''},
        headers: {
            'Content-Type': MimeType.guess(path.basename(key))
        },
        config: options.config
    });
};

BosClient.prototype.abortMultipartUpload = function (bucket_name, key, upload_id, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('DELETE', {
        bucket_name: bucket_name,
        key: key,
        params: {'uploadId': upload_id},
        config: options.config
    });
};

BosClient.prototype.completeMultipartUpload = function (bucket_name, key, upload_id,
                                                        part_list, opt_options) {

    var options = this._checkOptions(u.extend({
        'Content-Type': 'application/json; charset=utf-8'
    }, opt_options));

    return this._sendRequest('POST', {
        bucket_name: bucket_name,
        key: key,
        body: JSON.stringify({parts: part_list}),
        headers: options.headers,
        params: {uploadId: upload_id},
        config: options.config
    });
};

BosClient.prototype.uploadPartFromFile = function (bucket_name, key, upload_id,
                                                   part_number, part_size, filename, offset,
                                                   part_md5, opt_options) {
    var start = offset;
    var end = offset + part_size - 1;
    var part_fp = fs.createReadStream(filename, {start: start, end: end});
    return this.uploadPart(bucket_name, key, upload_id, part_number,
        part_size, part_fp, part_md5, opt_options);
};

BosClient.prototype.uploadPart = function (bucket_name, key, upload_id,
                                           part_number, part_size, part_fp, part_md5,
                                           opt_options) {
    /*eslint-disable*/
    if (!bucket_name) { throw new TypeError('bucket_name should not be empty');}
    if (!key) { throw new TypeError('key should not be empty'); }
    /*eslint-enable*/
    if (part_number < MIN_PART_NUMBER || part_number > MAX_PART_NUMBER) {
        throw new TypeError(util.format('Invalid part_number %d. The valid range is from %d to %d.',
            part_number, MIN_PART_NUMBER, MAX_PART_NUMBER));
    }

    var client = this;

    // TODO(leeight) 计算md5的时候已经把 part_fp 读完了，如果从头再来呢？
    var cloned_part_fp = fs.createReadStream(part_fp.path, {
        start: part_fp.start,
        end: part_fp.end
    });

    var options = u.extend({
        'Content-Length': part_size,
        'Content-Type': 'application/octet-stream',
        'Content-MD5': part_md5
    }, opt_options);

    if (!options['Content-MD5']) {
        return require('./crypto').md5stream(part_fp)
            .then(function (md5sum) {
                options['Content-MD5'] = md5sum;
                return newPromise();
            });
    }

    function newPromise() {
        options = client._checkOptions(options);
        return client._sendRequest('PUT', {
            bucket_name: bucket_name,
            key: key,
            body: cloned_part_fp,
            headers: options.headers,
            params: {partNumber: part_number, uploadId: upload_id},
            config: options.config
        });
    }
    return newPromise();
};

BosClient.prototype.listParts = function (bucket_name, key, upload_id, opt_options) {
    /*eslint-disable*/
    if (!upload_id) { throw new TypeError('upload_id should not empty'); }
    /*eslint-enable*/

    var allowed_params = ['maxParts', 'partNumberMarker', 'uploadId'];
    var options = this._checkOptions(opt_options || {}, allowed_params);
    options.params.uploadId = upload_id;

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        key: key,
        params: options.params,
        config: options.config
    });
};

BosClient.prototype.listMultipartUploads = function (bucket_name, opt_options) {
    var allowed_params = ['delimiter', 'maxUploads', 'keyMarker', 'prefix', 'uploads'];

    var options = this._checkOptions(opt_options || {}, allowed_params);
    options.params.uploads = '';

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        params: options.params,
        config: options.config
    });
};

BosClient.prototype.createSignature = function (credentials, http_method,
                                                path, params, headers) {
    var auth = new Auth(credentials.ak, credentials.sk);
    return auth.generateAuthorization(http_method, path, params, headers);
};

// --- E N D ---

BosClient.prototype._sendRequest = function (http_method, var_args) {
    var default_args = {
        bucket_name: null,
        key: null,
        body: null,
        headers: {},
        params: {},
        config: {},
        output_stream: null
    };
    var args = u.extend(default_args, var_args);

    var config = u.extend({}, this.config, args.config);
    var resource = path.normalize(path.join(
        '/v1',
        args.bucket_name || '',
        args.key || ''
    ));

    var http_client = new HttpClient(config);
    return http_client.sendRequest(http_method, resource, args.body,
        args.headers, args.params, u.bind(this.createSignature, this),
        args.output_stream
    );
};

BosClient.prototype._checkOptions = function (options, opt_allowed_params) {
    var rv = {};
    var allowed_params = [];

    rv.config = options.config || {};
    rv.headers = this._prepareObjectHeaders(options);
    rv.params = u.pick(options, allowed_params);

    return rv;
};

BosClient.prototype._prepareObjectHeaders = function (options) {
    var allowed_headers = [
        'Content-Length',
        'Content-Encoding',
        'Content-MD5',
        'Content-Type',
        'Content-Disposition',
        'ETag'
    ];
    var meta_size = 0;
    var headers = u.pick(options, function (value, key) {
        if (allowed_headers.indexOf(key) !== -1) {
            return true;
        }
        else if (/^x\-bce\-meta\-/.test(key)) {
            meta_size += Buffer.byteLength(key) + Buffer.byteLength('' + value);
            return true;
        }
    });

    if (meta_size > 2048) {
        throw new TypeError('Metadata size should not be greater than 2048.');
    }

    if (u.has(headers, 'Content-Length')) {
        var content_length = headers['Content-Length'];
        if (content_length < 0) {
            throw new TypeError('content_length should not be negative.')
        }
        else if (content_length > 5368709120) { // 5G
            throw new TypeError('Object length should be less than 5368709120. Use multi-part upload instead.')
        }
    }

    if (u.has(headers, 'ETag')) {
        var etag = headers.ETag;
        if (!/^"/.test(etag)) {
            headers.ETag = util.format('"%s"', etag);
        }
    }

    if (!u.has(headers, 'Content-Type')) {
        headers['Content-Type'] = 'application/octet-stream';
    }

    return headers;
};

module.exports = BosClient;


/* vim: set ts=4 sw=4 sts=4 tw=120: */
