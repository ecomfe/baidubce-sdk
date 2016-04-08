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

define(function (require) {
    var exports = {};

    var u = require('underscore');
    var MultiStreamRecorder = require('msr');

    var config = require('./config');
    var helper = require('./helper');
    var fileList = require('./file-list');

    var gMSR;
    var gWorking = false;
    var kInterval = 10 * 1000;
    var kMediaConstraints = {
        audio: true,
        video: {
            mandatory: {
                maxWidth: 1280,
                maxHeight: 720
                // minFrameRate: 3,
                // maxFrameRate: 64,
                // minAspectRatio: 1.77
            }
        }
    };

    function onVideoRecord() {
        if (gWorking) {
            stop();
        }
        else {
            navigator.getUserMedia(kMediaConstraints, onMediaSuccess, onMediaError);
        }
    }

    function onMediaSuccess(stream) {
        gWorking = true;

        var video = document.createElement('video');
        video.controls = true;
        video.src = URL.createObjectURL(stream);

        video.addEventListener('loadedmetadata', function () {
            gMSR = new MultiStreamRecorder(stream);
            gMSR.video = video;
            gMSR.canvas = {
                width: video.width,
                height: video.height
            };
            gMSR.ondataavailable = function (blobs) {
                var name = Date.now();
                blobStore(blobs.audio, name);
                blobStore(blobs.video, name);
            };
            gMSR.start(kInterval);
        });
        $('#camera').parent().append($(video));
        video.play();
    }

    function blobStore(blob, name) {
        var options = config.getOptions();
        var bucketName = options.bucketName;
        var prefix = options.prefix;

        var ext = blob.type.split('/').pop();
        var key = prefix + '/' + name + '.' + ext;
        var opt = {
            'Content-Type': blob.type + '; charset=UTF-8'
        };
        helper.upload(bucketName, key, blob, opt)
            .then(u.bind(fileList.refresh, fileList));
    }

    function onMediaError(e) {
        gWorking = false;
        console.error('media error', e);
    }

    function stop() {
        gWorking = false;
        gMSR.stop();
        if (gMSR.stream) {
            gMSR.stream.stop();
        }
    }

    exports.init = function () {
        $('#camera').on('click', onVideoRecord);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
