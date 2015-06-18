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

    exports.init = function () {
        etpl.addFilter('relativeTime', function (source) {
            var timestamp = moment(source).unix();
            return humanize.relativeTime(timestamp);
        });
        etpl.addFilter('filesize', function (source) {
            return humanize.filesize(source);
        });
        etpl.addFilter('i18n', function (value) {
            return config.kWorkGroupMap[value] || value;
        });
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
