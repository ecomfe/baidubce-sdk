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
 * @file test/sdk/bcc_client.spec.js
 * @author leeight
 */

var Q = require('q');
var u = require('underscore');

var config = require('../config');
var BccClient = require('../..').BccClient;
var helper = require('./helper');

describe('BccClient', function () {
    var client;
    var fail;

    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

        fail = helper.fail(this);
        client = new BccClient(config.bcc);
    });

    afterEach(function (done) {
        client.listInstances()
            .then(function (response) {
                var defers = (response.body.instances || [])
                    .filter(function (item) {
                        // 包年包月的不支持释放
                        return item.payment !== 'prepay';
                    })
                    .map(function (item) {
                        return client.deleteInstance(item.id);
                    });
                return Q.all(defers);
            })
            .fin(done);
    });

    function delay(ms) {
        var deferred = Q.defer();
        setTimeout(deferred.resolve, ms);
        return deferred.promise;
    }

    it('deleteInstance with invalid instance id', function (done) {
        client.deleteInstance('no-such-instance-id')
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('deleteInstance with valid instance id', function (done) {
        client.listInstances()
            .then(function (response) {
                var instance = u.find(response.body.instances, function (item) {
                    return item.payment !== 'prepay';
                });
                return client.deleteInstance(instance.id);
            })
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('listInstances', function (done) {
        client.listInstances()
            .then(function (response) {
                var body = response.body;
                expect(body).not.toBeUndefined();
                expect(body.maxKeys).toBe(1000);
                expect(body.nextMarker).toBe('');
                expect(body.marker).toBe('null');
                expect(body.isTruncated).toBe(false);
                expect(Array.isArray(body.instances)).toBe(true);
                // console.log(body.instances);
                // return client.getInstance(body.instances[0].id);
            })
            // .then(function (response) {
            //    expect(response.body.server).not.toBeUndefined();
            //    expect(response.body.server.id).not.toBe('');
            // })
            .catch(fail)
            .fin(done);
    });

    it('getImages', function (done) {
        client.getImages({maxKeys: 1})
            .then(function (response) {
                var body = response.body;
                expect(body.maxKeys).toBe(1);
                expect(body.marker).toBe('null');
                expect(body.nextMarker).not.toBe('');
                expect(body.isTruncated).toBe(true);
                expect(Array.isArray(body.images)).toBe(true);
            })
            .catch(fail)
            .fin(done);
    });

    it('getClientToken', function (done) {
        client.getClientToken()
            .then(function (response) {
                expect(response.body.token).not.toBe('');
            })
            .catch(fail)
            .fin(done);
    });

    it('createInstance', function (done) {
        Q.all([client.getImages({maxKeys: 1}), client.getPackages()])
            .then(function (results) {
                var images = results[0].body.images;
                var packages = results[1].body.instanceTypes;

                var instanceType = packages[0].name;
                var imageId = images[0].id;
                var requestBody = {
                    instanceType: instanceType,
                    imageId: imageId
                };

                return client.createInstance(requestBody);
            })
            .then(function (response) {
                expect(Array.isArray(response.body.instanceIds)).toBe(true);
                return delay(4000).then(function () {
                    return client.getInstance(response.body.instanceIds[0]);
                });
            })
            .then(function (response) {
                expect(response.body).not.toBe(null);
                expect(response.body.server).not.toBeUndefined();
            })
            .catch(fail)
            .fin(done);
    });

    it('getPackages', function (done) {
        client.getPackages()
            .then(function (response) {
                expect(response.body.instanceTypes[0]).toEqual({
                    name: 'bcc.t1.tiny',
                    type: 'Tiny',
                    cpuCount: 1,
                    memorySizeInGB: 1,
                    localDiskSizeInGB: -1
                });
            })
            .catch(fail)
            .fin(done);
    });

    xit('startInstance', function (done) {
        var id = '85f47301-fb64-4d6f-a761-870875537020';
        client.startInstance(id)
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    xit('restartInstance', function (done) {
        var id = '85f47301-fb64-4d6f-a761-870875537020';
        client.restartInstance(id)
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    xit('stopInstance', function (done) {
        var id = '85f47301-fb64-4d6f-a761-870875537020';
        client.stopInstance(id)
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('getVNCUrl', function (done) {
        var id = '85f47301-fb64-4d6f-a761-870875537020';

        client.getVNCUrl(id)
            .then(function (response) {
                // { vncUrl: 'http://10.105.97.40/vnc_auto.html?token=6996258f-a655-42b4-ba46-93e46eac0325' }
                expect(response.body.vncUrl).not.toBe('');
            })
            .catch(fail)
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
