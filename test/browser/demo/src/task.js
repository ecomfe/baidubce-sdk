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
    var helper = require('./helper');

    /**
     * @constructor
     * @param {string} bucketName The bucket name.
     * @param {string} key The object name.
     * @param {Blob} blob 需要上传的文件内容.
     * @param {Object=} options 上传文件的参数.
     * @param {sdk.BosClient=} client The bos client.
     */
    function Task(bucketName, key, blob, options, client) {
        this.bucketName = bucketName;
        this.key = key;
        this.blob = blob;
        this.options = options;
        this.client = client;
    }

    /**
     * @return {sdk.Q.promise}
     */
    Task.prototype.run = function () {
        return helper.upload(this.bucketName, this.key, this.blob, this.options, this.client);
    };

    return Task;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
