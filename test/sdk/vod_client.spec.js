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
var expect = require('expect.js');

var config = require('../config');
var VodClient = require('../../').VodClient;
var helper = require('./helper');

var MediaStatus = {
    PUBLISHED: 'PUBLISHED',
    FAILED: 'FAILED',
    RUNNING: 'RUNNING',
    DISABLED: 'DISABLED',
    BANNED: 'BANNED',
    PROCESSING: 'PROCESSING'
};
var CodeType = [
    'html',
    'file',
    'cover'
];

describe('VodClient', function () {
    var fail;
    var mediaId;
    var title = 'testTitle' + (+new Date());
    var description = 'testDescription' + (+new Date());

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        // jasmine.getEnv().defaultTimeoutInterval = 5 * 60 * 1000;

        fail = helper.fail(this);
    });

    afterEach(function () {
        // TODO
    });

    it('Create Media Source', function () {
        var vod = new VodClient(config.vod);
        var filePath = path.join(__dirname, '123.mp3');
        return vod.createMediaResource(title, description, filePath)
            .then(function (response) {
                debug(response);
                mediaId = response.body.mediaId;
                expect(mediaId).not.to.be(undefined);
                return helper.loop(600, 30, function () {
                    return vod.getMediaResource(mediaId)
                        .then(function (response) {
                            debug('loop = %j', response.body);
                            if (response.body.status === 'RUNNING') {
                                throw '$continue';
                            }
                        });
                });
            });
    });

    it('Get Media Source', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.getMediaResource(mediaId)
            .then(function (response) {
                debug(response);
                expect(response.body.mediaId).to.eql(mediaId);
                expect(response.body.attributes.title).to.eql(title);
                expect(response.body.attributes.description).to.eql(description);
            });
    });

    it('Get All Media Sources', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.listMediaResource()
            .then(function (response) {
                debug(response);
                var uploadMedia = u.filter(response.body.media, function (media) {
                    return media.mediaId === mediaId;
                });
                expect(uploadMedia.length).to.eql(1);
                expect(uploadMedia[0].attributes.title).to.eql(title);
                expect(uploadMedia[0].attributes.description).to.eql(description);
            })
            .then(function () {
                return vod.getDownloadUrl(mediaId, 1000);
            })
            .then(function (response) {
                debug(response.body.sourceUrl);
                expect(response.body.sourceUrl).not.to.be(undefined);
            });
    });

    it('Disable Media Source', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.stopMediaResource(mediaId)
            .then(function () {
                return helper.loop(600, 30, function () {
                    return vod.getMediaResource(mediaId)
                        .then(function (response) {
                            debug('loop = %j', response.body);
                            if (response.body.status === MediaStatus.PROCESSING) {
                                throw '$continue';
                            }
                            return response;
                        });
                });
            })
            .then(function (response) {
                debug(response);
                expect(response.body.mediaId).to.eql(mediaId);
                expect(response.body.status).to.eql(MediaStatus.DISABLED);
            });
    });

    it('Publish Media Source', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.publishMediaResource(mediaId)
            .then(function () {
                return helper.loop(600, 30, function () {
                    return vod.getMediaResource(mediaId)
                        .then(function (response) {
                            debug('loop = %j', response.body);
                            if (response.body.status === MediaStatus.PROCESSING) {
                                throw '$continue';
                            }
                            return response;
                        });
                });
            })
            .then(function (response) {
                debug(response);
                expect(response.body.mediaId).to.eql(mediaId);
                expect(response.body.status).to.eql(MediaStatus.PUBLISHED);
            });
    });

    it('Update Media Source', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        title = 'updateTitle' + (+new Date());
        description = 'updateDescription' + (+new Date());
        return vod.updateMediaResource(mediaId, title, description)
            .then(function () {
                return helper.loop(600, 30, function () {
                    return vod.getMediaResource(mediaId)
                        .then(function (response) {
                            debug('loop = %j', response.body);
                            if (response.body.status === MediaStatus.PROCESSING) {
                                throw '$continue';
                            }
                            return response;
                        });
                });
            })
            .then(function (response) {
                debug(response.body);
                expect(response.body.mediaId).to.eql(mediaId);
                expect(response.body.attributes.title).to.eql(title);
                expect(response.body.attributes.description).to.eql(description);
            });
    });

    it('Get Player Code', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.getPlayerCode(mediaId, 800, 600, true)
            .then(function (response) {
                debug(response.body);
                var codes = u.filter(response.body.codes, function (code) {
                    return u.contains(CodeType, code.codeType);
                });
                expect(codes.length).to.eql(3);
                u.each(codes, function (code) {
                    if (code.codeType === 'url') {
                        expect(code.sourceCode).to.match(/^http:\/\//);
                    }
                    else {
                        expect(code.sourceCode).to.match(/[a-zA-Z0-9+/]+/);
                    }
                });
            });
    });

    it('Get Playable Url', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.getPlayableUrl(mediaId)
            .then(function (response) {
                debug(response.body);
                expect(response.body.file).to.match(/^http:\/\//);
                expect(response.body.mediaId).to.eql(mediaId);
            });
    });

    it('Delete Media Source', function () {
        expect(mediaId).not.to.be(undefined);
        var vod = new VodClient(config.vod);
        return vod.deleteMediaResource(mediaId)
            .then(function () {
                return vod.listMediaResource();
            })
            .then(function (response) {
                debug(response);
                var uploadMedia = u.filter(response.body.media, function (media) {
                    return media.mediaId === mediaId;
                });
                expect(uploadMedia.length).to.eql(0);
            });
    });
});
