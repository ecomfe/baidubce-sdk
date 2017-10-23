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
 * @file test/sdk/tsdb_admin_client.spec.js
 * @author lidandan
 */

var util = require('util');
var UUID = require('uuid');

var expect = require('expect.js');
var debug = require('debug')('tsdb_admin_client.spec');
var config = require('../config');
var helper = require('./helper');
var TsdbAdminClient = require('../../src/tsdb_admin_client');

describe('TsdbAdminClient', function () {
    var clientAdmin;
    var fail;
    var databaseName;
    var length;
    var clientToken;
    var purchaseLength;
    var description;
    var datapoints;
    var ingestDataPointsMonthly;
    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);
        var id = Math.floor(Math.random() * 100000) + 900;
        databaseName = util.format('testdata%d', id);
        clientToken = UUID.v4();
        clientAdmin = new TsdbAdminClient(config.tsdbAdmin);
    });

    afterEach(function () {
        // nothing
    });

    it('ok', function () {});

    it('createDatabase & listDatabase & getDatabaseInfo', function () { 
        ingestDataPointsMonthly = 1;
        purchaseLength = 1;
        description = 'This is a test for TSDB.';

        return clientAdmin.createDatabase(clientToken, databaseName,
            ingestDataPointsMonthly, purchaseLength, description)
            .then(function () {
                return clientAdmin.listDatabase();
            })
            .then(function (response) {
                debug('%j', response);
                var length = response.body.databases.length;
                console.log(length);
                expect(response.body.databases[length - 1].databaseName).to.eql(databaseName);
                var databaseId = response.body.databases[length - 1].databaseId;
                return clientAdmin.getDatabaseInfo(databaseId);
            })
            .then(function (response) {
                debug('%j', response);
                expect(response.body.databaseName).to.eql(databaseName);
                expect(response.body.description).to.eql(description);
            });
    });

    it('deleteDatabase', function () {
        ingestDataPointsMonthly = 1;
        purchaseLength = 1;
        description = 'This is a test for TSDB.';

        return clientAdmin.createDatabase(clientToken, databaseName,
            ingestDataPointsMonthly, purchaseLength, description)
            .then(function (response) {
                var databaseId = response.body.databaseId;
                console.log(databaseId);
                return clientAdmin.deleteDatabase(databaseId);
            })
           // 不能删除未到期数据库
        .catch(function (error) {
            if (error.code === 'DeleteUnexpiredDatabaseFailed') {
                expect(error.status_code).to.eql(400);
                expect(error.message).to.eql('Can not delete unexpired database');
                expect(error.code).to.eql('DeleteUnexpiredDatabaseFailed');
            }
            else {
                fail(error);
            }
        });
    });
});
