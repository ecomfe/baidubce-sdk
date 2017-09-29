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
 * @file test/sdk/tsdbAdmin_client.spec.js
 * @author lidandan
 */

var UUID = require('uuid');

var expect = require('expect.js');
var debug = require('debug')('tsdbAdmin_client.spec');
var config = require('../config');
var helper = require('./helper');
var TsdbAdminClient = require('../../src/tsdbAdmin_client');

describe('TsdbAdminClient', function () {
    var client;
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);
        client = new TsdbAdminClient(config.tsdb);
    });

    afterEach(function () {
        // nothing
    });

    it('ok', function () {});

    it('listDatabase', function () {

        return client.listDatabase()
            .then(function (response) {
                expect(response.body.databases[0].databaseId).to.eql('tsdb-dvb9we5yfkcc');
            });
    });

    it('createDatabase', function () {
        var clientToken = UUID.v4();
        var ingestDataPointsMonthly = 1;
        var purchaseLength = 1;
        var databaseName = 'testcrdbdan';
        var description = 'This is just a test for TSDB.';

        return client.createDatabase(clientToken, databaseName,
            ingestDataPointsMonthly, purchaseLength, description)
            .then(function () {
                return client.listDatabase();
            })
            .then(function (response) {
                debug('%j', response);
                var length = response.body.databases.length;
                console.log(length);
                expect(response.body.databases[length - 1].databaseName).to.eql('testcrdbdan');
                var databaseId = response.body.databases[length - 1].databaseId;
                return client.getDatabaseInfo(databaseId);
            })
            .then(function (response) {
                debug('%j', response);
                expect(response.body.databaseName).to.eql('testcrdbdan');
                expect(response.body.description).to.eql('This is just a test for TSDB.');
                expect(response.body.endpoint).to.eql(databaseName + '.tsdb.iot.gz.baidubce.com');
                expect(response.body.quota).to.eql('ingestDataPointsMonthly:' + ingestDataPointsMonthly);
                expect(response.body.status).to.eql('Active');
                    // 重复创建
                return client.createDatabase(clientToken, databaseName,
                ingestDataPointsMonthly, purchaseLength, description);
            }).catch(function (error) {
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('DatabaseNameNotAvailable');
                expect(error.message).to.eql('Database name already exists');
            });
    });

    it('deleteDatabase', function () {
        var databaseId = 'tsdb-dvb9we5yfkcc';
        client.deleteDatabase(databaseId)
        .then(function (response) {
            debug('%j', response);
            expect(response.body).to.eql({});
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
