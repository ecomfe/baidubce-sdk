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

    var kPrivate = 'private';
    var kPublicRead = 'public-read';
    var kPublicWrite = 'public-read-write';

    exports.getAcl = function (accessControlList) {
        for (var i = 0; i < accessControlList.length; i++) {
            var item = accessControlList[i];
            for (var j = 0; j < item.grantee.length; j++) {
                var grantee = item.grantee[j];
                if (grantee.id === '*') {
                    var permission = item.permission.join(',');
                    if (permission === 'READ') {
                        return kPublicRead;
                    }
                    else if (permission === 'READ,WRITE') {
                        return kPublicWrite;
                    }

                    // 其它没有涵盖到的情况
                    return kPrivate;
                }
            }
        }

        return kPrivate;
    };

    exports.init = function () {
    };


    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
