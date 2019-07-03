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

        client = new BtsClient(config.bts);
    });
    var putRow_body = {
        'rowkey': 'a',
        'cells': [
            {
                'column': 'c1',
                'value': 'v1'
            },
            {
                'column': 'c2',
                'value': 'v2'
            }
        ]
    };
    var getAndDel_body = {
        'rowkey': 'a',
        'cells': [
            {
                'column': 'c1',
            },
            {
                'column': 'c2',
            }
        ]
    };

    var batchPutRow_body = {
        'rows': [
            {
                'rowkey': 'a1',
                'cells': [
                    {
                        'column': 'c1',
                        'value': 'v11'
                    },
                    {
                        'column': 'c2',
                        'value': 'v12'
                    }
                ]
            },
            {
                'rowkey': 'a2',
                'cells': [
                    {
                        'column': 'c1',
                        'value': 'v21'
                    },
                    {
                        'column': 'c2',
                        'value': 'v22'
                    }
                ]
            }
        ]
    };

    var batchGetAndDel_body = {
        'rows': [
            {
                'rowkey': 'a1',
                'cells': [
                    {
                        'column': 'c1'
                    },
                    {
                        'column': 'c2'
                    }
                ]
            },
            {
                'rowkey': 'a2',
                'cells': [
                    {
                        'column': 'c1'
                    },
                    {
                        'column': 'c2'
                    }
                ]
            }
        ]
    };

    var scan_body = {
        'startRowkey': 'a1',
        'includeStart': true,
        'stopRowkey': 'a2',
        'includeStop': false,
        'selector': [
            {
                'column': 'c1'
            },
            {
                'column': 'c2'
            }
        ],
        'limit': 1000
    };

    debug('name ', 'bce_sdk_test' + Date.now());
    it('putRow', function () {
        return client.putRow(putRow_body)
            .then(function (response) {
                debug('putRow response (%j)', response);
                return client.getRow(getAndDel_body)
            }).then(function (response) {
                debug('getRow response (%j)', response);
                return client.batchPutRow(batchPutRow_body)
            }).then(function (response) {
                debug('batchPutRow response (%j)', response);
                return client.deleteRow(getAndDel_body)
            }).then(function (response) {
                debug('deleteRow response (%j)', response);
                return client.batchGetRow(batchGetAndDel_body)
            }).then(function (response) {
                debug('batchGetRow response (%j)', response);
                return client.scan(scan_body)
            }).then(function (response) {
                debug('scan response (%j)', response);
                return client.batchDeleteRow(batchGetAndDel_body)
            }).then(function (response) {
                debug('batchDeleteRow response (%j)', response);
            }).catch(function (reason) {
                debug('error', reason);
            });
    });

});
