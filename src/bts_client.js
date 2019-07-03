/*
 * Copyright (c) 2019 Baidu.com, Inc. All Rights Reserved
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
var debug = require('debug')('bce-sdk:BtsClient');

var BceBaseClient = require('./bce_base_client');

/**
 * Bts service api
 *
 *
 * @see https://cloud.baidu.com/doc/BTS/s/Ljwvydqd9
 *
 * @constructor
 * @param {Object} config The bts client configuration.
 * @extends {BceBaseClient}
 */

function BtsClient(config) {
    BceBaseClient.call(this, config, 'bts', true);
}

util.inherits(BtsClient, BceBaseClient);

BtsClient.prototype.putRow = function (body) {
    debug('putRow, body = %j', body);
    return this.sendRequest('PUT', '/v1/instance/test_whx/table/table1/row', {
        params: {},
        body: JSON.stringify(body)
    });
};

BtsClient.prototype.batchPutRow = function (body) {
    debug('batchPutRow, body = %j', body);
    return this.sendRequest('PUT', '/v1/instance/test_whx/table/table1/rows', {
        params: {},
        body: JSON.stringify(body)
    });
};

BtsClient.prototype.deleteRow = function (body) {
    debug('deleteRow, body = %j', body);
    return this.sendRequest('DELETE', '/v1/instance/test_whx/table/table1/row', {
        params: {},
        body: JSON.stringify(body)
    });
};

BtsClient.prototype.batchDeleteRow = function (body) {
    debug('batchDeleteRow, body = %j', body);
    return this.sendRequest('DELETE', '/v1/instance/test_whx/table/table1/rows', {
        params: {},
        body: JSON.stringify(body)
    })
};

BtsClient.prototype.getRow = function (body) {
    debug('putRow, body = %j', body);
    return this.sendRequest('GET', '/v1/instance/test_whx/table/table1/row', {
        params: {},
        body: JSON.stringify(body)
    });
};

BtsClient.prototype.batchGetRow = function (body) {
    debug('batchGetRow, body = %j', body);
    return this.sendRequest('GET', '/v1/instance/test_whx/table/table1/rows', {
        params: {},
        body: JSON.stringify(body)
    });
};

BtsClient.prototype.scan = function (body) {
    debug('scan, body = %j', body);
    return this.sendRequest('GET', '/v1/instance/test_whx/table/table1/rows', {
        params: {},
        body: JSON.stringify(body)
    });
};

module.exports = BtsClient;