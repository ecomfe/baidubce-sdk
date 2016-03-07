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
 * @file sdk/vod_client.spec.js
 * @author zhouhua
 */

var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('vod_client.spec');

var config = require('../config');
var VodClient = require('../../').VodClient;
var helper = require('./helper');

var MediaStatus = {
    PUBLISHED: 'PUBLISHED',
    FAILED: 'FAILED',
    RUNNING: 'RUNNING',
    DISABLED: 'DISABLED',
    BANNED: 'BANNED'
};
var CodeType = [
    'html',
    'flash',
    'url'
];

describe('VodClient', function () {
    var fail;
    var mediaId;
    var title = 'testTitle' + (+new Date());
    var description = 'testDescription' + (+new Date());

    beforeEach(function (done) {
        fail = helper.fail(this);
        done();
    });

    afterEach(function (done) {
        done();
    });

    it('ok', function () {
    });

    it('Create Media Source', function (done) {
        var vod = new VodClient(config.media, config.media_bos);
        vod.createMediaResource(title, description, './Two Steps From Hell - Victory.mp3')
            .then(function (response) {
                expect(mediaId).not.toBeUndefined();
                mediaId = response.body.mediaId;
            })
            .catch(fail)
            .fin(function () {
                // wait two minuets for encoding media
                setTimeout(done, 120000);
            });
    });
    it('Get Media Source', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.getMediaResource(mediaId)
            .then(function (response) {
                expect(response.body.mediaId).toEqual(mediaId);
                expect(response.body.attributes.title).toEqual(title);
                expect(response.body.attributes.description).toEqual(description);
            })
            .catch(fail)
            .fin(done);
    });
    it('Get All Media Sources', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.listMediaResource()
            .then(function (response) {
                var uploadMedia = u.filter(response.body.medias, function (media) {
                    return media.mediaId === mediaId;
                });
                expect(uploadMedia.length).toEqual(1);
                expect(uploadMedia[0].attributes.title).toEqual(title);
                expect(uploadMedia[0].attributes.description).toEqual(description);
            })
            .catch(fail)
            .fin(done);
    });
    it('Disable Media Source', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.publishMediaResource(mediaId)
            .then(function () {
                return vod.stopMediaResource(mediaId);
            }).then(function () {
                return vod.getMediaResource(mediaId);
            })
            .then(function (response) {
                expect(response.body.mediaId).toEqual(mediaId);
                expect(response.body.status).toEqual(MediaStatus.DISABLED);
            })
            .catch(fail)
            .fin(done);
    });
    it('Publish Media Source', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.stopMediaResource(mediaId)
            .then(function () {
                return vod.publishMediaResource(mediaId);
            }).then(function () {
                return vod.getMediaResource(mediaId);
            })
            .then(function (response) {
                expect(response.body.mediaId).toEqual(mediaId);
                expect(response.body.status).toEqual(MediaStatus.PUBLISHED);
            })
            .catch(fail)
            .fin(done);
    });
    it('Update Media Source', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        title = 'updateTitle' + (+new Date());
        description = 'updateDescription' + (+new Date());
        vod.updateMediaResource(mediaId, title, description)
            .then(function () {
                return vod.getMediaResource(mediaId);
            })
            .then(function (response) {
                expect(response.body.mediaId).toEqual(mediaId);
                expect(response.body.attributes.title).toEqual(title);
                expect(response.body.attributes.description).toEqual(description);
            })
            .catch(fail)
            .fin(done);
    });
    it('Get Playable Url', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.getPlayableUrl(mediaId)
            .then(function (response) {
                var codes = u.filter(response.body.codes, function (code) {
                    return u.contains(CodeType, code.codeType);
                });
                expect(codes.length).toEqual(3);
                u.each(codes, function (code) {
                    if (code.codeType === 'url') {
                        expect(code.sourceCode).toMatch(/^http:\/\//);
                    }
                    else {
                        expect(code.sourceCode).toMatch(/[a-zA-Z0-9+/]+/);
                    }
                });
            })
            .catch(fail)
            .fin(done);
    });

});

/* vim: set ts=4 sw=4 sts=4 tw=120: */
