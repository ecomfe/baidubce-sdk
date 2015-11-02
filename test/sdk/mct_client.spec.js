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
var debug = require('debug')('mct_client.spec');

var config = require('../config');
var MctClient = require('../../').MctClient;
var helper = require('./helper');

describe('MctClient', function () {
    var fail;

    beforeEach(function (done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10 * 1000;

        fail = helper.fail(this);

        Q.all([
            new MctClient.Watermark(config.media).removeAll(),
            new MctClient.Pipeline(config.media).removeAll(),
            new MctClient.Preset(config.media).removeAll()
        ]).catch(fail).fin(done);
    });

    afterEach(function (done) {
        done();
    });

    it('ok', function () {});

    it('Watermark.create', function (done) {
        var watermark = new MctClient.Watermark(config.media);
        var options = {
            bucket: 'baidubce',
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
        watermark.create(options)
            .then(function (response) {
                expect(response.body.watermarkId).not.toBeUndefined();
                return watermark.get();
            })
            .then(function (response) {
                expect(u.pick(response.body, 'bucket', 'key',
                    'verticalAlignment', 'horizontalAlignment',
                    'verticalOffsetInPixel', 'horizontalOffsetInPixel')).toEqual(options);
                return watermark.list();
            })
            .then(function (response) {
                expect(response.body.watermarks.length).toEqual(1);
                return watermark.remove();
            })
            .then(function (response) {
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('MediaInfo.get', function (done) {
        var mediaInfo = new MctClient.MediaInfo(config.media);
        mediaInfo.get('apple', 'big_buck_bunny_1080p_surround.mp4')
            .then(function (response) {
                var info = {
                  bucket: 'apple',
                  key: 'big_buck_bunny_1080p_surround.mp4',
                  fileSizeInByte: 266565031,
                  type: 'video',
                  container: 'mov,mp4,m4a,3gp,3g2,mj2',
                  durationInSecond: 596,
                  video: {
                    codec: 'h264',
                    heightInPixel: 1080,
                    widthInPixel: 1920,
                    bitRateInBps: 3339490,
                    frameRate: 24
                  },
                  audio: {
                    codec: 'aac',
                    channels: 2,
                    sampleRateInHz: 44100,
                    bitRateInBps: 148455
                  },
                  etag: '9ab9279f3cf42129efb3092009bbbb05'
                };
                expect(response.body).toEqual(info);
            })
            .then(function (response) {
                debug('%j', response);
            })
            .catch(fail)
            .fin(done);
    });

    it('MediaInfo.get invalid media info', function (done) {
        var mediaInfo = new MctClient.MediaInfo(config.media);
        mediaInfo.get('apple', 'KCon.zip')
            .catch(function (error) {
                expect(u.omit(error, 'request_id')).toEqual({
                    status_code: 400,
                    message: 'Get media info failed with errno: 1001',
                    code: 'VideoExceptions.GetMediaInfoFailed'
                });
            })
            .fin(done);
    });

    it('Pipeline.list should be empty', function (done) {
        var pipeline = new MctClient.Pipeline(config.media);
        pipeline.list()
            .then(function (response) {
                debug('%j', response.body);
                expect(u.filter(response.body.pipelines, function (item) {
                    // 有 running/pending 在运行的 Pipeline 无法删除
                    var status = item.jobStatus;
                    return (status.running + status.pending) <= 0;
                })).toEqual([]);
            })
            .catch(fail)
            .fin(done);
    });

    it('Pipeline.create & Transcoding.create & Thumbnail.create', function (done) {
        var pipelineName = 'google_is_good_' + Date.now();
        var pipeline = new MctClient.Pipeline(config.media);
        var options = {
            pipelineName: pipelineName,
            description: pipelineName + ' description',
            sourceBucket: 'apple',
            targetBucket: 'asset',
            config: {
                // 0 ~ 100
                capacity: 5,
                // must match \"[a-z][0-9a-z_]{0,39}\"
                // notification: 'my_notification_name'
            }
        };
        pipeline.create(options)
            .then(function (response) {
                expect(response.body).toEqual({});
                return pipeline.get();
            })
            .then(function (response) {
                var p = response.body;
                expect(p.pipelineName).toEqual(options.pipelineName);
                expect(p.sourceBucket).toEqual(options.sourceBucket);
                expect(p.targetBucket).toEqual(options.targetBucket);
                expect(p.config.capacity).toEqual(options.config.capacity);
                expect(p.config.notification).toEqual(null);
                expect(p.state).toEqual('ACTIVE');
                expect(p.description).toEqual(options.description);
                expect(p.createTime).not.toBeUndefined();

                return pipeline.getTranscodingJobs();
            })
            .then(function (response) {
                expect(response.body.jobs).toEqual([]);
                return pipeline.addTranscodingJob({
                    source: {
                        sourceKey: 'big_buck_bunny_1080p_surround.mp4'
                    },
                    target: {
                        targetKey: 'big_buck_bunny_1080p_surround.mp4',
                        presetName: 'bce.video_mp4_1920x1080_3660kbps'
                    }
                });
            })
            .then(function (job) {
                expect(job._jobId).not.toBe(null);
                return job.get();
            })
            .then(function (response) {
                var jobInfo = response.body;
                expect(jobInfo.pipelineName).toEqual(pipelineName);
                expect(jobInfo.source).toEqual({
                    sourceKey: 'big_buck_bunny_1080p_surround.mp4'
                });
                expect(jobInfo.target).toEqual({
                    targetKey: 'big_buck_bunny_1080p_surround.mp4',
                    presetName: 'bce.video_mp4_1920x1080_3660kbps'
                });
            })
            .then(function (response) {
                return pipeline.addThumbnailJob({
                    source: {
                        key: 'big_buck_bunny_1080p_surround.mp4'
                    },
                    target: {
                        keyPrefix: 'thumbnails/big_buck_bunny_1080p_surround/',
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
                expect(job._jobId).not.toBe(null);
            })
            .catch(fail)
            .fin(done);
    });

    it('Preset.copy', function (done) {
        var preset = new MctClient.Preset(config.media);
        var original = 'bce.video_mp4_1920x1080_3660kbps';
        var target = 'leeight_' + Date.now();
        preset.get(original)
            .then(function (response) {
                debug('%j', response);
                var options = u.clone(response.body);
                options.presetName = target;
                return preset.create(options);
            })
            .then(function (response) {
                expect(preset._name).toEqual(target);
                expect(response.body).toEqual({});
                return preset.get();
            })
            .then(function (response) {
                expect(response.body.presetName).toEqual(target);
                return preset.remove();
            })
            .catch(fail)
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
