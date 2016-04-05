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
 * @file sdk/lss_client.spec.js
 * @author leeight
 */

var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var expect = require('expect.js');
var debug = require('debug')('lss_client.spec');

var config = require('../config');
var LssClient = require('../../').LssClient;
var helper = require('./helper');

describe('LssClient.Preset', function () {
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);

        return new LssClient.Preset(config.lss).removeAll();
    });

    it('list', function () {
        var preset = new LssClient.Preset(config.lss);
        return preset.list()
            .then(function (response) {
                var presets = response.body.presets || [];
                expect(presets.length).to.be.above(0);
            });
    });

    it('create', function () {
        var preset = new LssClient.Preset(config.lss);
        var options = {
            // preset name must match pattern:[a-z][0-9a-z_]{0,39}
            presetName: 'my_test_preset_name',
            description: 'my test preset name description',
            forwardOnly: false,
            audio: {
                // 大于1000
                bitRateInBps: 1000,
                // 22050, 32000, 44100, 48000, 96000
                sampleRateInHz: 96000,
                // 1, 2
                channels: 2,
            },
            video: {
                codec: 'h264',
                codecOptions: {
                    // baseline, main, high
                    profile: 'baseline',
                },
                // 32000 ~ max
                bitRateInBps: 64000,
                // 10, 15, 20, 23.97, 24, 25, 29.97, 30, 50, 60
                maxFrameRate: 15,
                // 128 ~ 4096
                maxWidthInPixel: 128,
                // 96 ~ 3072
                maxHeightInPixel: 96,
                // keep, shrinkToFit, stretch
                sizingPolicy: 'stretch'
            },
            hls: {
                segmentTimeInSecond: 10,
                segmentListSize: 5,
                adaptive: false
            },
            rtmp: {
                gopCache: false,
                playToken: false
            },
            recording: {
                format: 'mp4',
                periodInMinute: 1
            },
            thumbnail: {
                target: {
                    format: 'jpg',
                    // keep、shrinkToFit、stretch
                    sizingPolicy: 'stretch',
                    // 10~4096
                    widthInPixel: 10,
                    // 10~3072
                    heightInPixel: 10
                },
                capture: {
                    // thumbnail start/end time or interval shouldn't be set in auto mode
                    mode: 'manual',
                    startTimeInSecond: 10,
                    endTimeInSecond: 20,
                    intervalInSecond: 5
                }
            }
        };

        return preset.create(options)
            .then(function (response) {
                expect(response.body).to.eql({});
                return preset.get();
            })
            .then(function (response) {
                debug('%j', response);
                expect(u.omit(response.body, 'userId', 'createTime')).to.eql(options);
            });
    });
});

describe('LssClient.Session', function () {
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);

        return new LssClient.Session(config.lss).removeAll();
    });

    it('list', function () {
        var session = new LssClient.Session(config.lss);
        return session.list()
            .then(function (response) {
                debug('%j', response.body);
                var sessions = response.body.liveInfos;
                u.each(sessions, function (item) {
                    debug('%j', item.sessionId);
                    expect(item.sessionId).to.be.an('string');
                });
            });
    });

    it('create', function () {
        var session = new LssClient.Session(config.lss);
        var options = {
            target: {
                bosBucket: 'baidubce',
                userDomain: 'www.baidu.com'
            },
            presetName: 'lss.rtmp_forward_only',
            description: 'lss.rtmp_forward_only description',
            publish: {
                pushAuth: false,
            },
            // notification=must match \"[a-z][0-9a-z_]{0,39}\"
            notification: undefined
        };
        return session.create(options)
            .then(function (response) {
                debug(response);

                var s = response.body;

                expect(s.target).to.eql(options.target);
                expect(s.presetName).to.eql(options.presetName);
                expect(s.description).to.eql(options.description);
                expect(s.status).to.eql('READY');

                expect(s.publish.pushAuth).to.eql(false);
                expect(s.publish.pushUrl).not.to.be(undefined);

                expect(s.play).not.to.be(undefined);
                expect(s.play.rtmpUrl).not.to.be(undefined);

                expect(s.record).not.to.be(undefined);
                expect(s.record.keyPrefix).not.to.be(undefined);

                expect(s.createTime).not.to.be(undefined);
                expect(s.lastUpdateTime).not.to.be(undefined);
                expect(s.sessionId).not.to.be(undefined);
                expect(s.userId).not.to.be(undefined);

                return session.pause();
            })
            .then(function (response) {
                expect(response.body).to.eql({});
                return session.get();
            })
            .then(function (response) {
                expect(response.body.status).to.eql('PAUSED');
                return session.resume();
            })
            .then(function (response) {
                expect(response.body).to.eql({});
                return session.get();
            })
            .then(function (response) {
                expect(response.body.status).to.eql('READY');
                return session.refresh();
            })
            .then(function (response) {
                var s = response.body;

                expect(s.target).to.eql(options.target);
                expect(s.presetName).to.eql(options.presetName);
                expect(s.description).to.eql(options.description);
                expect(s.status).to.eql('READY');

                expect(s.publish.pushAuth).to.eql(false);
                expect(s.publish.pushUrl).not.to.be(undefined);

                expect(s.play).not.to.be(undefined);
                expect(s.play.rtmpUrl).not.to.be(undefined);

                expect(s.record).not.to.be(undefined);
                expect(s.record.keyPrefix).not.to.be(undefined);

                expect(s.createTime).not.to.be(undefined);
                expect(s.lastUpdateTime).not.to.be(undefined);
                expect(s.sessionId).not.to.be(undefined);
                expect(s.userId).not.to.be(undefined);
            });
    });
});

describe('LssClient.Notification', function () {
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);

        return new LssClient.Notification(config.lss).removeAll();
    });

    it('list', function () {
        var notification = new LssClient.Notification(config.lss);
        return notification.list()
            .then(function (response) {
                var notifications = response.body.notifications;
                expect(notifications).to.eql([]);
            });
    });

    it('create', function () {
        var notification = new LssClient.Notification(config.lss);
        var name = 'live_notification';
        var endpoint = 'http://www.baidu.com';
        return notification.removeAll()
            .then(function () {
                // 好像有数据同步的问题，删除之后还是可以读取
                return helper.delayMs(5 * 1000);
            })
            .then(function () {
                return notification.create(name, endpoint)
            })
            .then(function (response) {
                debug(response);
                expect(response.body).to.eql({});
                return notification.get();
            })
            .then(function (response) {
                debug(response);
                expect(response.body.name).to.eql('live_notification');
                expect(response.body.endpoint).to.eql('http://www.baidu.com');
                return notification.create(name, endpoint);
            })
            .catch(function (error) {
                debug(error);
                expect(error.status_code).to.eql(400);
                expect(error.code).to.eql('LiveExceptions.DuplicateNotification');
                return notification.remove(name);
            })
            .then(function (response) {
                debug(response);
                expect(response.body).to.eql({});
                return notification.list();
            })
            .then(function (response) {
                expect(response.body.notifications).to.eql([]);
            });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
