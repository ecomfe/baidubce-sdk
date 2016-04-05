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
 * @file sdk/mct_client.spec.js
 * @author leeight
 */

var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var expect = require('expect.js');
var debug = require('debug')('mct_client.spec');

var config = require('../config');
var MctClient = require('../../').MctClient;
var helper = require('./helper');

describe('MctClient', function () {
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        // jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;

        fail = helper.fail(this);

        return Q.all([
            new MctClient.Watermark(config.media).removeAll(),
            new MctClient.Pipeline(config.media).removeAll(),
            new MctClient.Preset(config.media).removeAll()
        ]);
    });

    afterEach(function () {
        // nothing
    });

    it('Watermark.create', function () {
        var watermark = new MctClient.Watermark(config.media);
        var options = {
            bucket: 'bcesdk',
            key: 'Screenshot_2014-11-17-15-13-31.png',
            // top, center, bottom
            verticalAlignment: 'top',
            // left, center, right
            horizontalAlignment: 'right',
            // 0 ~ 3072
            verticalOffsetInPixel: 1024,
            // 0 ~ 4096
            horizontalOffsetInPixel: 1024
        };
        return watermark.create(options)
            .then(function (response) {
                debug(response);
                expect(response.body.watermarkId).not.to.be(undefined);
                return watermark.get();
            })
            .then(function (response) {
                debug(response);
                expect(u.pick(response.body, 'bucket', 'key',
                    'verticalAlignment', 'horizontalAlignment',
                    'verticalOffsetInPixel', 'horizontalOffsetInPixel')).to.eql(options);
                return watermark.list();
            })
            .then(function (response) {
                debug(response);
                expect(response.body.watermarks.length).to.eql(1);
                return watermark.remove();
            })
            .then(function (response) {
                expect(response.body).to.eql({});
            });
    });

    it('MediaInfo.get', function () {
        var mediaInfo = new MctClient.MediaInfo(config.media);
        return mediaInfo.get('bcesdk', 'big_buck_bunny_720p_surround.avi')
            .then(function (response) {
                var info = {
                  bucket: 'bcesdk',
                  key: 'big_buck_bunny_720p_surround.avi',
                  fileSizeInByte: 332243668,
                  type: 'video',
                  // container: 'mov,mp4,m4a,3gp,3g2,mj2',
                  container: 'avi',
                  durationInSecond: 596,
                  video: {
                    codec: 'mpeg4',
                    heightInPixel: 720,
                    widthInPixel: 1280,
                    // bitRateInBps: 3339490,
                    frameRate: 24
                  },
                  audio: {
                    codec: 'ac3',
                    channels: 6,
                    sampleRateInHz: 48000,
                    bitRateInBps: 437500
                  },
                  etag: '0da8fe124595f5b206d64cb1400bbefc'
                };
                expect(response.body).to.eql(info);
            })
            .then(function (response) {
                debug('%j', response);
            });
    });

    it('MediaInfo.get invalid media info', function () {
        var mediaInfo = new MctClient.MediaInfo(config.media);
        return mediaInfo.get('bcesdk', 'KCon.zip')
            .catch(function (error) {
                expect(u.omit(error, 'request_id')).to.eql({
                    status_code: 400,
                    message: 'Get media info failed with errno: 1001',
                    code: 'MetaInfoExceptions.GetMediaInfoFailed'
                });
            });
    });

    it('Pipeline.list should be empty', function () {
        var pipeline = new MctClient.Pipeline(config.media);
        return pipeline.list()
            .then(function (response) {
                debug('%j', response.body);
                expect(u.filter(response.body.pipelines, function (item) {
                    // 有 running/pending 在运行的 Pipeline 无法删除
                    var status = item.jobStatus;
                    return (status.running + status.pending) <= 0;
                })).to.eql([]);
            });
    });

    it('Pipeline.create & Transcoding.create & Thumbnail.create', function () {
        var pipelineName = 'google_is_good_' + Date.now();
        var pipeline = new MctClient.Pipeline(config.media);
        var options = {
            pipelineName: pipelineName,
            description: pipelineName + ' description',
            sourceBucket: 'bcesdk',
            targetBucket: 'asset',
            config: {
                // 0 ~ 100
                capacity: 5,
                // must match \"[a-z][0-9a-z_]{0,39}\"
                // notification: 'my_notification_name'
            }
        };
        return pipeline.create(options)
            .then(function (response) {
                expect(response.body).to.eql({});
                return pipeline.get();
            })
            .then(function (response) {
                var p = response.body;
                expect(p.pipelineName).to.eql(options.pipelineName);
                expect(p.sourceBucket).to.eql(options.sourceBucket);
                expect(p.targetBucket).to.eql(options.targetBucket);
                expect(p.config.capacity).to.eql(options.config.capacity);
                expect(p.config.notification).to.eql(null);
                expect(p.state).to.eql('ACTIVE');
                expect(p.description).to.eql(options.description);
                expect(p.createTime).not.to.be(undefined);

                return pipeline.getTranscodingJobs();
            })
            .then(function (response) {
                expect(response.body.jobs).to.eql([]);
                return pipeline.addTranscodingJob({
                    source: {
                        sourceKey: 'big_buck_bunny_720p_surround.avi'
                    },
                    target: {
                        targetKey: 'big_buck_bunny_720p_surround.avi',
                        presetName: 'bce.video_mp4_1920x1080_3660kbps'
                    }
                });
            })
            .then(function (job) {
                expect(job._jobId).not.to.be(null);
                return job.get();
            })
            .then(function (response) {
                var jobInfo = response.body;
                expect(jobInfo.pipelineName).to.eql(pipelineName);
                expect(jobInfo.source).to.eql({
                    sourceKey: 'big_buck_bunny_720p_surround.avi'
                });
                expect(jobInfo.target).to.eql({
                    targetKey: 'big_buck_bunny_720p_surround.avi',
                    presetName: 'bce.video_mp4_1920x1080_3660kbps'
                });
            })
            .then(function (response) {
                return pipeline.addThumbnailJob({
                    source: {
                        key: 'big_buck_bunny_720p_surround.avi'
                    },
                    target: {
                        keyPrefix: 'thumbnails/big_buck_bunny_720p_surround/',
                        format: 'jpg',
                        // keep、shrinkToFit、stretch
                        sizingPolicy: 'keep',
                        // 10 ~ 2000
                        widthInPixel: 2000,
                        // 10 ~ 2000
                        heightInPixel: 2000,
                    },
                    capture: {
                        // auto, manual
                        mode: 'manual',
                        startTimeInSecond: 0,
                        endTimeInSecond: 160,
                        intervalInSecond: 10
                    }
                });
            })
            .then(function (job) {
                expect(job._jobId).not.to.be(null);
            });
    });

    it('Preset.copy', function () {
        var preset = new MctClient.Preset(config.media);
        var original = 'bce.video_mp4_1920x1080_3660kbps';
        var target = 'leeight_' + Date.now();
        return preset.get(original)
            .then(function (response) {
                debug('%j', response);
                var options = u.clone(response.body);
                options.presetName = target;
                return preset.create(options);
            })
            .then(function (response) {
                expect(preset._name).to.eql(target);
                expect(response.body).to.eql({});
                return preset.get();
            })
            .then(function (response) {
                expect(response.body.presetName).to.eql(target);
                return preset.remove();
            });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
