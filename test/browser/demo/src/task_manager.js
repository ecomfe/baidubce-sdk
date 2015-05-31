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
    var sdk = require('baidubce-sdk');

    var config = require('./config');

    /**
     * 上传文件夹的时候，文件的列表是异步获取的，无法直接使用 async 的接口
     * @constructor
     */
    function TaskManager() {
        /**
         * 最多可以同时运行的任务数目.
         * @type {number}
         */
        this.parallel = config.kParallel;

        /**
         * @type {number}
         * 当前运行的任务数目
         */
        this.running = 0;

        /**
         * FIFO
         * @type {Array.<Task>}
         */
        this.tasks = [];

        this.deferred = sdk.Q.defer();
    }

    /**
     * @param {Task} task 需要执行的任务.
     */
    TaskManager.prototype.addTask = function (task) {
        this.tasks.push(task);
        this.runNext();
    };

    TaskManager.prototype.runNext = function () {
        if (this.running >= this.parallel) {
            return;
        }

        if (this.tasks.length <= 0) {
            this.deferred.resolve();
            return;
        }

        // FIFO
        var task = this.tasks.shift();
        if (task && typeof task.run === 'function') {
            this.running ++;
            task.run().then(
                u.bind(this.runTaskSuccess, this),
                u.bind(this.runTaskFailure, this)
            );
        }
    };

    TaskManager.prototype.runTaskFailure = function (err) {
        this.deferred.reject(err);
    };

    TaskManager.prototype.runTaskSuccess = function () {
        this.running--;
        this.runNext();

    };

    /**
     * 开始执行 this.tasks 里面的任务.
     * @return {sdk.Q.promise}
     */
    TaskManager.prototype.startup = function () {
        return this.deferred.promise;
    };

    return TaskManager;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
