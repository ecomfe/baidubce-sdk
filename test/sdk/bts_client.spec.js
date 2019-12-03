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

var config = require('../config');
var BtsClient = require('../..').BtsClient;
var debug = require('debug')('bce-sdk:BtsClient');

describe('BtsClient', function () {
    var client;
    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

        client = new BtsClient.BtsClient(config.bts);
    });

    var instanceName = 'test0';
    var tableName = 'test';
    debug('name ', 'bce_sdk_test' + Date.now());

    // 单行写入 PutRow
    var putRowRequest = new BtsClient.PutRowRequest();
    putRowRequest.rowkey = "a";
    putRowRequest.addCells("c1", "v1");
    putRowRequest.addCells("c2", "v2");

    // 批量写入 BatchPutRow
    var batchPutRowRequest = new BtsClient.BatchPutRowRequest();
    batchPutRowRequest.addRows('a1', 'c1', 'v1');
    batchPutRowRequest.addRows('a2', 'c1', 'v1');

    // 单条随机读 GetRow
    var getRowRequest = new BtsClient.GetRowRequest();
    getRowRequest.rowkey = 'a';
    getRowRequest.addCells('c1');
    getRowRequest.addCells('c2');

    // 批量读 BatchGetRow
    var batchGetRowRequest = new BtsClient.BatchGetRowRequest();
    batchGetRowRequest.addRows('a1', 'c1');
    batchGetRowRequest.addRows('a2', 'c1');

    // 区间读 ScanRow
    var scanRowRequest = new BtsClient.ScanRequest();
    scanRowRequest.startRowkey = 'a1';
    scanRowRequest.stopRowkey = 'a2';
    scanRowRequest.includeStart = true;
    scanRowRequest.includeStop = false;

    // 单条删除 DeleteRow
    var deleteRowRequest = new BtsClient.DeleteRowRequest();
    deleteRowRequest.rowkey = 'a1';
    deleteRowRequest.addCells('c1');

    // 批量删除 BatchDeleteRow
    var batchDeleteRowRequest = new BtsClient.BatchDeleteRowRequest();
    batchDeleteRowRequest.addRows('a1', 'c1');
    batchDeleteRowRequest.addRows('a2', 'c1');

    it('putRow', function () {
        return client.putRow(instanceName, tableName, putRowRequest)
            .then(function (response) {
                debug('putRow response (%j)', response);
                return client.batchPutRow(instanceName, tableName, batchPutRowRequest)
            }).then(function (response) {
                debug('batchPutRow response (%j)', response);
                return client.getRow(instanceName, tableName, getRowRequest)
            }).then(function (response) {
                debug('getRow response (%j)', response);
                return client.batchGetRow(instanceName, tableName, batchGetRowRequest)
            }).then(function (response) {
                debug('batchGetRow response (%j)', response);
                return client.scan(instanceName, tableName, scanRowRequest)
            }).then(function (response) {
                debug('scan response (%j)', response);
                return client.deleteRow(instanceName, tableName, deleteRowRequest)
            }).then(function (response) {
                debug('deleteRow response (%j)', response);
                return client.batchDeleteRow(instanceName, tableName, batchDeleteRowRequest)
            }).then(function (response) {
                debug('batchDeleteRow response (%j)', response);
                return client.listInstances()
            }).then(function (response) {
                debug('listInstances response (%j)', response);
                return client.showInstance(instanceName)
            }).then(function (response) {
                debug('showInstance response (%j)', response);
                return client.listTables(instanceName)
            }).then(function (response) {
                debug('listTables response (%j)', response);
                return client.showTable(instanceName, tableName)
            }).then(function (response) {
                debug('showTable response (%j)', response);
            }).catch(function (reason) {
                debug('error', reason);
            });
    });

});