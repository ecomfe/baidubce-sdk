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

var u = require('underscore');
var Q = require('q');

var Auth = require('./auth');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');

/**
 * @constructor
 * @extends {BceBaseClient}
 */
function BosClient(config) {
    BceBaseClient.call(this, config, 'bos', true);
}
util.inherits(BosClient, BceBaseClient);

// --- B E G I N ---

BosClient.prototype.listBuckets = function(opt_options) {
    var options = opt_options || {};
    return this._sendRequest('GET', {config: options.config});
};

BosClient.prototype.createBucket = function(bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        config: options.config,
    })
};

BosClient.prototype.listObjects = function(bucket_name, opt_options) {
    var options = opt_options || {};

    var params = u.extend(
        {maxKeys: 1000},
        u.pick(options, 'maxKeys', 'prefix', 'marker', 'delimiter')
    );

    return this._sendRequest('GET', {
        bucket_name: bucket_name,
        params: params,
        config: options.config,
    });
};

BosClient.prototype.doesBucketExist = function(bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('HEAD', {
        bucket_name: bucket_name,
        config: options.config,
    }).then(
        function() {
            return Q(true);
        },
        function(e) {
            if (e && e.status_code === 403) {
                return Q(true);
            }
            if (e && e.status_code === 404) {
                return Q(false);
            }
            return Q.reject(e);
        }
    );
};

BosClient.prototype.deleteBucket = function(bucket_name, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('DELETE', {
        bucket_name: bucket_name,
        config: options.config,
    });
};

BosClient.prototype.setBucketCannedAcl = function(bucket_name, canned_acl, opt_options) {
    var options = opt_options || {};

    return this._sendRequest('PUT', {
        bucket_name: bucket_name,
        headers: {'x-bce-acl': canned_acl},
        params: {'acl': ''},
        config: options.config,
    });
};

BosClient.prototype.createSignature = function(credentials, http_method,
                                               path, params, headers) {
    var auth = new Auth(credentials.ak, credentials.sk)
    return auth.generateAuthorization(http_method, path, params, headers);
};

// --- E N D ---

BosClient.prototype._sendRequest = function(http_method, var_args) {
    var default_args = {
        bucket_name: null,
        key: null,
        body: null,
        headers: {},
        params: {},
        config: {},
        output_stream: null,
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


module.exports = BosClient;


/* vim: set ts=4 sw=4 sts=4 tw=120: */
