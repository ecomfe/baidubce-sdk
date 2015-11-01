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
var debug = require('debug')('lss_client.spec');

var config = require('../config');
var LssClient = require('../../').LssClient;
var helper = require('./helper');

describe('LssClient', function () {
    var fail;

    beforeEach(function (done) {
        fail = helper.fail(this);

        Q.all([
            new LssClient.Preset(config.media).removeAll(),
            new LssClient.Session(config.media).removeAll(),
            new LssClient.Notification(config.media).removeAll()
        ]).catch(fail).fin(done);
    });

    afterEach(function (done) {
        done();
    });

    it('ok', function () {});

    it('Preset.list', function (done) {
        var preset = new LssClient.Preset(config.media);
        preset.list()
            .then(function (response) {
                var presets = response.body.presets;
                u.each(presets, function (item) {
                    debug('%j', item.presetName);
                });
            })
            .catch(fail)
            .fin(done);
    });

    it('Preset.create', function (done) {
        var preset = new LssClient.Preset(config.media);
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

        preset.create(options)
            .then(function (response) {
                expect(response.body).toEqual({});
                return preset.get();
            })
            .then(function (response) {
                debug('%j', response);
                expect(u.omit(response.body, 'userId', 'createTime')).toEqual(options);
            })
            .catch(fail)
            .fin(done);
    });

    it('Session.list', function (done) {
        var session = new LssClient.Session(config.media);
        session.list()
            .then(function (response) {
                debug('%j', response.body);
                var sessions = response.body.liveInfos;
                u.each(sessions, function (item) {
                    debug('%j', item.sessionId);
                });
            })
            .catch(fail)
            .fin(done);
    });

    it('Session.create', function (done) {
        var session = new LssClient.Session(config.media);
        var options = {
            target: {
                bosBucket: 'apple',
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
        session.create(options)
            .then(function (response) {
                var s = response.body;

                expect(s.target).toEqual(options.target);
                expect(s.presetName).toEqual(options.presetName);
                expect(s.description).toEqual(options.description);
                expect(s.status).toEqual('READY');

                expect(s.publish.pushAuth).toEqual(false);
                expect(s.publish.pushUrl).not.toBeUndefined();

                expect(s.play).not.toBeUndefined();
                expect(s.play.rtmpUrl).not.toBeUndefined();

                expect(s.record).not.toBeUndefined();
                expect(s.record.keyPrefix).not.toBeUndefined();

                expect(s.createTime).not.toBeUndefined();
                expect(s.lastUpdateTime).not.toBeUndefined();
                expect(s.sessionId).not.toBeUndefined();
                expect(s.userId).not.toBeUndefined();

                return session.pause();
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                return session.get();
            })
            .then(function (response) {
                expect(response.body.status).toEqual('PAUSED');
                return session.resume();
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                return session.get();
            })
            .then(function (response) {
                expect(response.body.status).toEqual('READY');
                return session.refresh();
            })
            .then(function (response) {
                var s = response.body;

                expect(s.target).toEqual(options.target);
                expect(s.presetName).toEqual(options.presetName);
                expect(s.description).toEqual(options.description);
                expect(s.status).toEqual('READY');

                expect(s.publish.pushAuth).toEqual(false);
                expect(s.publish.pushUrl).not.toBeUndefined();

                expect(s.play).not.toBeUndefined();
                expect(s.play.rtmpUrl).not.toBeUndefined();

                expect(s.record).not.toBeUndefined();
                expect(s.record.keyPrefix).not.toBeUndefined();

                expect(s.createTime).not.toBeUndefined();
                expect(s.lastUpdateTime).not.toBeUndefined();
                expect(s.sessionId).not.toBeUndefined();
                expect(s.userId).not.toBeUndefined();
            })
            .catch(fail)
            .fin(done);
    });

    it('Notification.create', function (done) {
        var notification = new LssClient.Notification(config.media,
            'live_notification', 'http://www.baidu.com');
        notification.create()
            .then(function (response) {
                expect(response.body).toEqual({});
                return notification.get();
            })
            .then(function (response) {
                expect(response.body.name).toEqual('live_notification');
                expect(response.body.endpoint).toEqual('http://www.baidu.com');
                return notification.remove();
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                return notification.list();
            })
            .then(function (response) {
                expect(response.body.notifications.length).toEqual(0);
            })
            .catch(fail)
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
