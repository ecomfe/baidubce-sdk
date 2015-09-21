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

    function log(msg, type) {
        $('.log').html('<div class="alert alert-' + type
            + '" role="alert">'
            + '<button type="button" class="close" data-dismiss="alert" aria-label="Close">'
            + '<span aria-hidden="true">×</span></button>'
            + msg + '</div>');
        setTimeout(function () {
            $('.log').html('');
        }, 5000);
    }

    exports.ok = function (msg) {
        log(msg, 'success');
    };

    exports.info = function (msg) {
        log(msg, 'info');
    };

    exports.warn = function (msg) {
        log(msg, 'warning');
    };

    exports.fatal = function (msg) {
        log(msg, 'danger');
    };

    exports.exception = function (error) {
        if (error instanceof Error) {
            exports.fatal(error.toString());
        }
        else {
            exports.fatal(JSON.stringify(error));
        }
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
