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

var crypto = require('crypto');
var util = require('util');

/**
 * @constructor
 * @param {string} ak The access key.
 * @param {string} sk The security key.
 */
function Auth(ak, sk) {
    this.ak = ak;
    this.sk = sk;
}

Auth.prototype.generateAuthorization = function(method, resource,
    opt_params, opt_headers, opt_timestamp,
    opt_expiration_in_seconds, opt_headers_to_sign) {

    var params = opt_params || {};
    var headers = opt_headers || {};
    var timestamp = opt_timestamp || 0;
    var expiration_in_seconds = opt_expiration_in_seconds || 1800;
    var headers_to_sign = opt_headers_to_sign || null;

    var now = timestamp ? new Date(timestamp * 1000) : new Date();
    var raw_session_key = util.format("bce-auth-v1/%s/%s/%d",
        this.ak, now.toISOString().replace(/\.\d+Z$/, 'Z'), expiration_in_seconds);
    var session_key = this.hash(raw_session_key, this.sk);

    var canonical_uri = encodeURI(resource);
    var canonical_query_string = this.queryStringCanonicalization(params);

    var rv = this.headersCanonicalization(headers, headers_to_sign);
    var canonical_headers = rv[0];
    var signed_headers = rv[1];

    var raw_signature = util.format("%s\n%s\n%s\n%s",
        method, canonical_uri, canonical_query_string, canonical_headers);
    var signature = this.hash(raw_signature, session_key);

    if (signed_headers.length) {
        return util.format('%s/%s/%s', raw_session_key, signed_headers.join(';'), signature);
    }

    return util.format('%s//%s', raw_session_key, signature);
};

Auth.prototype.queryStringCanonicalization = function(params) {
    var canonical_query_string = [];
    Object.keys(params).forEach(function(key) {
        if (key === 'authorization') {
            return;
        }

        var value = params[key] == null ? '' : params[key];
        canonical_query_string.push(
            encodeURIComponent(key) + '=' + encodeURIComponent(value)
        );
    });

    canonical_query_string.sort();

    return canonical_query_string.join('&');
};

Auth.prototype.headersCanonicalization = function(headers, headers_to_sign) {
    if (!headers_to_sign || !headers_to_sign.length) {
        headers_to_sign = ['host', 'content-md5', 'content-length', 'content-type'];
    }

    var headers_map = {};
    headers_to_sign.forEach(function(item) {
        headers_map[item] = true;
    });

    var canonical_headers = [];
    Object.keys(headers).forEach(function(key) {
        var value = headers[key];
        if (value == null || value === '') {
            return;
        }

        key = key.toLowerCase();
        if (/^x\-bce\-/.test(key) || headers_map[key] === true) {
            canonical_headers.push(util.format('%s:%s',
                encodeURIComponent(key), encodeURIComponent(value)));
        }
    });

    canonical_headers.sort();

    var signed_headers = [];
    canonical_headers.forEach(function(item) {
        signed_headers.push(item.split(':')[0]);
    });

    return [canonical_headers.join('\n'), signed_headers];
};

Auth.prototype.hash = function(data, key) {
    var sha256_hmac = crypto.createHmac('sha256', key);
    sha256_hmac.update(data);
    return sha256_hmac.digest('hex');
};

module.exports = Auth;








/* vim: set ts=4 sw=4 sts=4 tw=120: */
