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
    require('etpl/tpl!./tpl/upload-panel-item.tpl');

    var u = require('underscore');
    var etpl = require('etpl');

    var exports = {};

    var uid = 0x8964;

    function nextId() {
        return '__uuid_' + (uid++).toString(16);
    }

    exports.addFiles = function (files) {
        return u.map(files, function (file) {
            var item = {
                uuid: nextId(),
                file: file
            };
            exports.addItem(item);
            return item;
        });
    };

    exports.progress = function (uuid, value) {
        if (value >= 1) {
            $('#' + uuid + ' .progress').parent().html('<i class="fa fa-check"></i>');
        }
        else {
            $('#' + uuid + ' .progress-bar').css('width', (value * 100) + '%');
        }
    };

    exports.addItem = function (item) {
        $('.upload-panel table tbody').append(
            etpl.render('TPL_upload_panel_item', item));
    };

    exports.init = function () {
        $('.upload-panel .fa-close').on('click', exports.hide);
    };

    exports.show = function () {
        $('.upload-panel').show('slow');
    };

    exports.hide = function () {
        $('.upload-panel').hide('slow');
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
