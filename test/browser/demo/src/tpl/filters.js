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
    var etpl = require('etpl');
    var humanize = require('humanize');
    var moment = require('moment');

    var config = require('../config');

    var exports = {};

    var kExts2Type = {};

    exports.init = function () {
        for (var type in config.kType2Exts) {
            var exts = config.kType2Exts[type];
            for (var i = 0; i < exts.length; i ++) {
                kExts2Type[exts[i]] = type;
            }
        }

        etpl.addFilter('relativeTime', function (source, raw) {
            var timestamp = raw ? source : moment(source).unix();
            return humanize.relativeTime(timestamp);
        });
        etpl.addFilter('filesize', function (source) {
            return humanize.filesize(source);
        });
        etpl.addFilter('i18n', function (value) {
            return config.kWorkGroupMap[value] || value;
        });
        etpl.addFilter('fa_icon', function (value) {
            var match = /\.([a-z0-9]+)$/i.exec(value);
            if (match && match[1]) {
                var type = kExts2Type[match[1].toLowerCase()];
                return type ? 'fa-file-' + type + '-o' : 'fa-file';
            }
            return 'fa-file';
        });
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
