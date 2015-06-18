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

    var config = require('./config');
    var helper = require('./helper');
    var fileList = require('./file-list');

    function onPaste(e) {
        var options = config.getOptions();
        var bucketName = options.bucketName;
        var prefix = options.prefix;

        var clipboardData = e.originalEvent.clipboardData;
        var items = clipboardData.items || [];
        u.each(items, function (item) {
            var blob = item.getAsFile();
            if (!blob) {
                return;
            }

            var ext = blob.type.split('/').pop();
            var key = prefix + Date.now() + '.' + ext;
            var options = {
                'Content-Type': blob.type + '; charset=UTF-8'
            };
            helper.upload(bucketName, key, blob, options)
                .then(u.bind(fileList.refresh, fileList));
        });
    }

    exports.init = function () {
        $(document).on('paste', onPaste);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
