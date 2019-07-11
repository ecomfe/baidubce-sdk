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

var BceBaseClient = require('./bce_base_client');
const models = require('./bts/models');
const PutRowRequest = models.PutRowRequest;
const BatchPutRowRequest = models.BatchPutRowRequest;
const DeleteRowRequest = models.DeleteRowRequest;
const BatchDeleteRowRequest = models.BatchDeleteRowRequest;
const GetRowRequest = models.GetRowRequest;
const BatchGetRowRequest = models.BatchGetRowRequest;
const ScanRequest = models.ScanRequest;

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

/**
 * 单条写入 PutRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param putRowRequest PutRow请求体
 * @returns {*}
 */
BtsClient.prototype.putRow = function (instanceName, tableName, putRowRequest) {
    putRowRequest.rowkey = putRowRequest.encode(putRowRequest.rowkey);
    return this.sendRequest('PUT', '/v1/instance/' + instanceName + '/table/' + tableName + '/row', {
        body: JSON.stringify(putRowRequest)
    });
};

/**
 * 批量写入 BatchPutRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param batchPutRowRequest batchPutRow 请求体
 * @returns {*}
 */
BtsClient.prototype.batchPutRow = function(instanceName, tableName, batchPutRowRequest) {
    return this.sendRequest('PUT', '/v1/instance/' + instanceName + '/table/' + tableName + '/rows', {
        body: JSON.stringify(batchPutRowRequest)
    });
};

/**
 * 单条删除 DeleteRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param deleteRowRequest deleteRow 请求体
 * @returns {*}
 */
BtsClient.prototype.deleteRow = function(instanceName, tableName, deleteRowRequest) {
    deleteRowRequest.rowkey = deleteRowRequest.encode(deleteRowRequest.rowkey);
    return this.sendRequest('DELETE', '/v1/instance/' + instanceName + '/table/' + tableName + '/row', {
        body: JSON.stringify(deleteRowRequest)
    });
};

/**
 * 批量删除 BatchDeleteRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param batchDeleteRowRequest BatchDeleteRow 请求体
 * @returns {*}
 */
BtsClient.prototype.batchDeleteRow = function(instanceName, tableName, batchDeleteRowRequest) {
    return this.sendRequest('DELETE', '/v1/instance/' + instanceName + '/table/' + tableName + '/rows', {
        body: JSON.stringify(batchDeleteRowRequest)
    });
};

/**
 * 单条随机读 GetRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param getRowRequest GetRow 请求体
 * @returns {*}
 */
BtsClient.prototype.getRow = function(instanceName, tableName, getRowRequest) {
    getRowRequest.rowkey = getRowRequest.encode(getRowRequest.rowkey);
    return this.sendRequest('GET', '/v1/instance/' + instanceName + '/table/' + tableName + '/row', {
        body: JSON.stringify(getRowRequest)
    });
};

/**
 * 批量读 BatchGetRow
 * @param instanceName 实例名
 * @param tableName 表名
 * @param batchGetRowRequest BatchGetRow 请求体
 * @returns {*}
 */
BtsClient.prototype.batchGetRow = function(instanceName, tableName, batchGetRowRequest) {
    return this.sendRequest('GET', '/v1/instance/' + instanceName + '/table/' + tableName + '/rows', {
        body: JSON.stringify(batchGetRowRequest)
    });
};

/**
 * 区间读 Scan
 * @param instanceName 实例名
 * @param tableName 表名
 * @param scanRowRequest Scan 请求体
 * @returns {*}
 */
BtsClient.prototype.scan = function(instanceName, tableName, scanRowRequest) {
    if (scanRowRequest.startRowkey !== null) {
        scanRowRequest.startRowkey = scanRowRequest.encode(scanRowRequest.startRowkey);
    }

    if (scanRowRequest.stopRowkey !== null) {
        scanRowRequest.stopRowkey = scanRowRequest.encode(scanRowRequest.stopRowkey);
    }
    return this.sendRequest('GET', '/v1/instance/' + instanceName + '/table/' + tableName + '/rows', {
        body: JSON.stringify(scanRowRequest)
    });
};

module.exports = {
    BtsClient:BtsClient,
    PutRowRequest:PutRowRequest,
    BatchPutRowRequest: BatchPutRowRequest,
    DeleteRowRequest: DeleteRowRequest,
    BatchDeleteRowRequest: BatchDeleteRowRequest,
    GetRowRequest: GetRowRequest,
    BatchGetRowRequest: BatchGetRowRequest,
    ScanRequest: ScanRequest,
};