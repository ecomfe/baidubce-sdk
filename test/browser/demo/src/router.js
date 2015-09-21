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
    var u = require('underscore');

    var exports = {};

    var config = {};
    var currentModules = null;

    var kDefaultPage = '/!bos/';

    function dispatchRequest() {
        if (!location.hash) {
            location.hash = kDefaultPage;
            return;
        }

        var chunks = location.hash.substr(2).split('/');
        var moduleName = chunks[0];
        if (!config[moduleName]) {
            moduleName = '*';
            if (!config[moduleName]) {
                throw new Error('Can\'t find handlers');
            }
        }

        if (currentModules) {
            u.each(currentModules, function (module) {
                if (typeof module.leave === 'function') {
                    try {
                        module.leave();
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
            });
        }

        currentModules = config[moduleName];
        if (currentModules) {
            u.each(currentModules, function (module) {
                if (typeof module.enter === 'function') {
                    try {
                        module.enter({
                            path: exports.getPath(true)
                        });
                    }
                    catch (ex) {
                        console.error(ex);
                    }
                }
            });
        }
    }

    exports.getPath = function (raw) {
        if (!location.hash) {
            return '';
        }

        var chunks = location.hash.substr(2).split('/');
        var moduleName = chunks[0];
        if (!config[moduleName]) {
            return location.hash;
        }
        else {
            chunks.shift();
            return (!raw ? '#/' : '') + chunks.join('/');
        }
    };

    exports.register = function (path, module) {
        if (!config[path]) {
            config[path] = [module];
        }
        else {
            config[path].push(module);
        }
    };

    exports.init = function () {
        $(window).on('hashchange', dispatchRequest);
        dispatchRequest();
    };

    return exports;
});











/* vim: set ts=4 sw=4 sts=4 tw=120: */
