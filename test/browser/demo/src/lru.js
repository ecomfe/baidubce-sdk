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

    var exports = {};

    /**
     * 最长的存活时间一小时，单位(ms)
     */
    var kMaxTime = 60 * 60 * 1000;

    /**
     * @param {string} key The cache key.
     * @return {*}
     */
    exports.get = function (key) {
        try {
            var package = JSON.parse(store.get(key));
            if ((Date.now() - package.time) > kMaxTime) {
                // 很久没访问了...
                store.remove(key);
                return null;
            }
            else {
                exports.set(key, package.data);
                return package.data;
            }
        }
        catch (ex) {
            return null;
        }
    };

    /**
     * @param {string} key The cache key.
     * @param {*} value The cache value.
     */
    exports.set = function (key, value) {
        store.set(key, JSON.stringify({
            data: value,
            time: Date.now()
        }));
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
