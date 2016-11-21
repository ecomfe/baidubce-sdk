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
 * @file src/sts.js
 * @author zhouhua
 */

/* eslint-env node */
/* eslint max-params:[0,10] */

var util = require('util');
var u = require('underscore');

var BceBaseClient = require('./bce_base_client');

/**
 * STS支持 - 将STS抽象成一种服务
 *
 * @see https://bce.baidu.com/doc/BOS/API.html#STS.20.E6.9C.8D.E5.8A.A1.E6.8E.A5.E5.8F.A3
 * @constructor
 * @param {Object} config The STS configuration.
 * @extends {BceBaseClient}
 */
function STS(config) {
    BceBaseClient.call(this, config, 'sts', true);
}
util.inherits(STS, BceBaseClient);

// --- BEGIN ---

STS.prototype.getSessionToken = function (durationSeconds, params, options) {
    options = options || {};

    var body = '';
    if (params) {
        params = u.pick(params, 'id', 'accessControlList');

        if (params.accessControlList) {
            params.accessControlList = u.map(params.accessControlList, function (acl) {
                return u.pick(acl, 'eid', 'service', 'region', 'effect', 'resource', 'permission');
            });
        }

        body = JSON.stringify(params);
    }

    var url = '/v1/sessionToken';

    return this.sendRequest('POST', url, {
        config: options.config,
        params: {
            durationSeconds: durationSeconds
        },
        body: body
    });
};

// --- E N D ---

module.exports = STS;

