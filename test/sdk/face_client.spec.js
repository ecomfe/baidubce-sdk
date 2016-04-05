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
 */

var util = require('util');
var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('face_client.spec');
var expect = require('expect.js');

var config = require('../config');
var crypto = require('../../src/crypto');
var FaceClient = require('../..').FaceClient;
var helper = require('./helper');

describe('FaceClient', function () {
    var client;
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        // jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;
        fail = helper.fail(this);
        client = new FaceClient(config.face);
    });

    afterEach(function () {
        // client.deleteBucket('bcs-client-testcase').fin(done);
        var appId;
        return client.listApps()
            .then(function (response) {
                if (!response.body.apps
                    || !response.body.apps.length) {
                    throw 'Empty Apps';
                }
                return (appId = response.body.apps[0].appId);
            })
            .then(function () {
                return client.listPersons(appId);
            })
            .then(function (response) {
                var persons = response.body.persons;
                debug('Persons = %j', persons);
                var defers = [];
                for (var i = 0; i < persons.length; i ++) {
                    defers.push(client.deletePerson(appId, persons[i].personName));
                }
                return Q.all(defers);
            })
            .then(function () {
                return client.listGroups(appId);
            })
            .then(function (response) {
                var defers = [];
                for (var i = 0; i < response.body.groups.length; i ++) {
                    var group = response.body.groups[i];
                    defers.push(client.deleteGroup(appId, group.groupName));
                }
                return Q.all(defers);
            })
            .catch(function (error) {
                console.log(error);
            });
    });

    it('ok', function () {});

    it('createApp & listApps', function () {
        return client.listApps()
            .then(function (response) {
                expect(Array.isArray(response.body.apps)).to.be(true);
                if (!response.body.apps.length) {
                    return client.createApp('leeight');
                }
                else {
                    var deferred = Q.defer();
                    deferred.resolve({
                        body: response.body.apps[0]
                    });
                    return deferred.promise;
                }
            })
            .then(function (response) {
                debug('response = %j', response);
                expect(response.body.appId).not.to.be(undefined);
            });
    });

    it('createGroup', function () {
        var appId;
        return client.listApps()
            .then(function (response) {
                return (appId = response.body.apps[0].appId);
            })
            .then(function () {
                var MAX_GROUPS = 10;
                var defers = [];
                for (var i = 0; i < MAX_GROUPS; i ++) {
                    defers.push(client.createGroup(appId, 'group' + i));
                }
                return Q.all(defers);
            })
            .then(function () {
                return client.listGroups(appId);
            })
            .then(function (response) {
                debug('listGroups = %j', response);
            });
    });

    it('createGroup & getGroup', function () {
        var appId;
        var groupName = 'mygroup';
        return client.listApps()
            .then(function (response) {
                return (appId = response.body.apps[0].appId);
            })
            .then(function () {
                return client.createGroup(appId, groupName);
            })
            .then(function () {
                return client.getGroup(appId, groupName);
            })
            .then(function (response) {
                debug('getGroup = %j', response);
                expect(response.body).to.eql({groupName: 'mygroup'});
            });
    });

    it('listPersons by group', function () {
        var appId;
        var groupName1 = 'mygroup1';
        var personName1 = 'leeight1';
        var groupName2 = 'mygroup2';
        var personName2 = 'leeight2';
        var faces1 = [
            'faces/photos/stars/liudehua/1.jpg',
            'faces/photos/stars/liudehua/2.jpg',
            'faces/photos/stars/liudehua/3.jpg',
            'faces/photos/stars/liudehua/4.jpg',
            'faces/photos/stars/liudehua/5.jpg',
            'faces/photos/stars/liudehua/6.jpg',
            'faces/photos/stars/liudehua/7.jpg',
            'faces/photos/stars/liudehua/8.jpg',
            'faces/photos/stars/liudehua/9.jpg'
        ];
        var faces2 = [
            'faces/photos/stars/canglaoshi/c1.jpg',
            'faces/photos/stars/canglaoshi/c2.jpg',
            'faces/photos/stars/canglaoshi/c3.jpg',
            'faces/photos/stars/canglaoshi/c4.jpg',
            'faces/photos/stars/canglaoshi/c5.jpg',
            'faces/photos/stars/canglaoshi/c6.jpg'
        ];
        return client.listApps()
            .then(function (response) {
                return (appId = response.body.apps[0].appId);
            })
            .then(function () {
                return Q.all([
                    client.createGroup(appId, groupName1),
                    client.createGroup(appId, groupName2)
                ]);
            })
            .then(function () {
                return Q.all([
                    client.createPerson(appId, groupName1, personName1, faces1),
                    client.createPerson(appId, groupName2, personName2, faces2)
                ]);
            })
            .then(function () {
                return client.listPersons(appId, {groupName: groupName2});
            })
            .then(function (response) {
                expect(response.body).to.eql({
                    persons: [
                        {
                            personName: personName2,
                            groupName: groupName2,
                            faces: [
                                {bosPath: 'faces/photos/stars/canglaoshi/c1.jpg'},
                                {bosPath: 'faces/photos/stars/canglaoshi/c2.jpg'},
                                {bosPath: 'faces/photos/stars/canglaoshi/c3.jpg'},
                                {bosPath: 'faces/photos/stars/canglaoshi/c4.jpg'},
                                {bosPath: 'faces/photos/stars/canglaoshi/c5.jpg'},
                                {bosPath: 'faces/photos/stars/canglaoshi/c6.jpg'}
                            ]
                        }
                    ]
                });
            });

    }, 60 * 1000);

    xit('createPerson & deletePerson & updatePerson & getPerson', function () {
        var appId;
        var groupName = 'mygroup';
        var personName = 'leeight';
        var faces = [
            'faces/photos/stars/liudehua/1.jpg',
            'faces/photos/stars/liudehua/2.jpg',
            'faces/photos/stars/liudehua/3.jpg',
            'faces/photos/stars/liudehua/4.jpg',
            'faces/photos/stars/liudehua/5.jpg',
            'faces/photos/stars/liudehua/6.jpg',
            'faces/photos/stars/liudehua/7.jpg',
            'faces/photos/stars/liudehua/8.jpg',
            'faces/photos/stars/liudehua/9.jpg'
        ];
        return client.listApps()
            .then(function (response) {
                return (appId = response.body.apps[0].appId);
            })
            .then(function () {
                return client.createGroup(appId, groupName);
            })
            .then(function () {
                return client.getGroup(appId, groupName);
            })
            .then(function (response) {
                debug('getGroup = %j', response);
                expect(response.body).to.eql({groupName: groupName});
                return client.createPerson(appId, groupName, personName, faces);
            })
            .then(function (response) {
                debug('createPerson = %j', response);
            })
            .then(function (response) {
                return client.createPerson(appId, groupName, personName, faces).catch(function (error) {
                    expect(error.status_code).to.eql(400);
                    expect(error.code).to.eql('DuplicatePerson');
                });
            })
            .then(function () {
                return client.updatePerson(appId, personName, faces.slice(0, 2));
            })
            .then(function (response) {
                return client.getPerson(appId, personName);
            })
            .then(function (response) {
                expect(response.body).to.eql({
                    personName: personName,
                    groupName: groupName,
                    faces: [
                        {bosPath: 'faces/photos/stars/liudehua/1.jpg'},
                        {bosPath: 'faces/photos/stars/liudehua/2.jpg'}
                    ]
                });
            })
            .then(function (response) {
                var data = 'faces/photos/stars/liudehua/2.jpg';
                return client.verify(appId, personName, data);
            })
            .then(function (response) {
                debug('Verify Response = %j', response);
                expect(response.body).to.eql({
                    personName: personName,
                    confidence: 100
                });
                var data = 'faces/photos/stars/liudehua/1.jpg';
                return client.identify(appId, groupName, data);
            })
            .then(function (response) {
                debug('Identify Response = %j', response);
                expect(response.body).to.eql({
                    personName: personName,
                    confidence: 100
                });
            })
            .then(function (response) {
                return client.deletePerson(appId, personName);
            })
            .then(function (response) {
                debug('deletePerson = %j', response);
            })
            .then(function () {
                return client.listPersons(appId);
            })
            .then(function (response) {
                var persons = response.body.persons;
                debug('Persons = %j', persons);
                expect(persons.length).to.eql(0);
            });
    }, 60 * 1000);
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
