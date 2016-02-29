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

describe('VodClient', function () {
    var fail;
    var mediaId;
    var title = 'testTitle' + (+new Date());
    var description = 'testDescription' + (+new Date());

    beforeEach(function (done) {
        done();
    });

    afterEach(function (done) {
        done();
    });

    it('ok', function () {});

    it('Create Media Source', function (done) {
        var vod = new VodClient(config.media, config.media_bos);
        vod.createMediaResource(title, description, './Two Steps From Hell - Victory.mp3')
            .then(function (response) {
                mediaId = response.body.mediaId;
            })
            .catch(fail)
            .fin(done);
    });
    it('Get Media Source', function (done) {
        expect(mediaId).not.toBeUndefined();
        var vod = new VodClient(config.media, config.media_bos);
        vod.getMediaResource(mediaId)
            .then(function (response) {
                mediaId = response.body.mediaId;
            })
            .catch(fail)
            .fin(done);
    });

});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
