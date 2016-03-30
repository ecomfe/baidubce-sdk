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

var u = require('underscore');
var debug = require('debug')('media_client.spec');

var config = require('../config');
var MediaClient = require('../..').MediaClient;
var helper = require('./helper');

describe('MediaClient', function () {
    var client;
    var fail;

    beforeEach(function () {
        fail = helper.fail(this);
        client = new MediaClient(config.media);
    });

    afterEach(function () {
        // TODO delete all pipelines
    });

    it('createPipeline', function (done) {
        var pipelineName = 'medium_priority_pipe';
        var sourceBucket = 'example-input-bucket';
        var targetBucket = 'example-output-bucket';
        client.createPipeline(pipelineName, sourceBucket, targetBucket)
            .then(function (response) {
                debug('%j', response);
            })
            .catch(function (error) {
                expect(error.message).toEqual("duplicated pipeline name:medium_priority_pipe");
            })
            .catch(fail)
            .fin(done);
    });

    it('getPipeline', function (done) {
        var pipelineName = 'medium_priority_pipe';
        client.getPipeline(pipelineName)
            .then(function (response) {
                expect(response.body.pipelineName).toEqual(pipelineName);
                expect(response.body.sourceBucket).toEqual('example-input-bucket');
                expect(response.body.targetBucket).toEqual('example-output-bucket');
            })
            .catch(fail)
            .fin(done);
    });

    it('getAllPipelines', function (done) {
        client.getAllPipelines()
            .then(function (response) {
                expect(response.body.pipelines).not.toBe(null);
                expect(response.body.pipelines.length > 0).toBe(true);
            })
            .catch(fail)
            .fin(done);
    });

    it('createJob', function (done) {
        var pipelineName = 'medium_priority_pipe';
        var source = {sourceKey: 'a'};
        var target = {targetKey: 'b'};
        var presetName = 'bce_video_mp4_1920x1080_3660kbps';
        client.createJob(pipelineName, source, target, presetName)
            .then(function (response) {
                debug('%j', response);
            })
            .catch(fail)
            .fin(done);
    });

    it('getAllJobs', function (done) {
        var pipelineName = 'medium_priority_pipe';
        client.getAllJobs(pipelineName)
            .then(function (response) {
                // debug('getAllJobs response %j', response);
                expect(response.body.jobs).not.toBe(null);
            })
            .catch(fail)
            .fin(done);
    });

    it('getJob', function (done) {
        var jobId = 'jobId';
        client.getJob(jobId)
            .then(function (response) {
                debug('%j', response);
            })
            .catch(fail)
            .fin(done);
    });

    it('deletePreset', function (done) {
        var presetName = 'tmp_bce_video_mp4_320x640_128kbps';
        client.deletePreset(presetName)
            .then(function (response) {
                debug('deletePreset response = %j', response);
                expect(response.body).toEqual({});
            })
            .catch(fail)
            .fin(done);
    });

    it('createPreset', function (done) {
        var presetName = 'tmp_bce_video_mp4_320x640_128kbps';
        var container = 'mp4';
        var clip = {
            startTimeInSecond: 0,
            durationInSecond: 60
        };
        var audio = {
            bitRateInBps: 256000
        };
        var video = {
            codec: 'h264',
            codecOptions: {
                profile: 'baseline'
            },
            bitRateInBps: 1024000,
            maxFrameRate: 30,
            maxWidthInPixel: 4096,
            maxHeightInPixel: 3072,
            sizingPolicy: 'keep'
        };
        client.createPreset(presetName, container, clip, audio, video)
            .then(function (response) {
                debug('createPreset response = %j', response);
                return client.deletePreset(presetName);
            })
            .catch(fail)
            .fin(done);
    });

    it('getPreset', function (done) {
        var presetName = 'bce_video_mp4_1920x1080_3660kbps';
        client.getPreset(presetName)
            .then(function (response) {
                expect(response.body.presetName).toEqual(presetName);
                expect(response.body.state).toEqual('ACTIVE');
                expect(response.body.container).toEqual('mp4');
                expect(response.body.transmux).toEqual(false);
                expect(response.body.clip).toEqual({ startTimeInSecond: 0 });
                expect(response.body.audio).toEqual({
                    bitRateInBps: 160000,
                    sampleRateInHz: 44100,
                    channels: 2
                });
            })
            .catch(fail)
            .fin(done);
    });

    it('getMediainfo', function (done) {
        var bucket = 'bucket';
        var key = 'key';
        client.getMediainfo(bucket, key)
            .then(function (response) {
                debug('%j', response);
            })
            .catch(fail)
            .fin(done);
    });
});









/* vim: set ts=4 sw=4 sts=4 tw=120: */
