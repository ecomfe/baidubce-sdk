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
    var store = require('store');

    var fileList = require('./file-list');

    var exports = {};

    function savePref() {
        var ak = $('#g_ak').val();
        var sk = $('#g_sk').val();
        store.set('ak', ak);
        store.set('sk', sk);

        $('#settingsModal').modal('hide');
        location.hash = '';
        fileList.refresh();
    }

    function beforeShowModal() {
        var ak = store.get('ak');
        var sk = store.get('sk');

        $('#g_ak').val(ak || '');
        $('#g_sk').val(sk || '');
    }

    exports.show = function () {
        $('#settingsModal').modal('show');
    };

    exports.init = function () {
        $('#save-pref').click(savePref);
        $('#settingsModal').on('show.bs.modal', beforeShowModal);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
