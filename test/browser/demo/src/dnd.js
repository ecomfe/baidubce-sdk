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

    var u = require('underscore');

    var config = require('./config');
    var fileList = require('./file-list');
    var TaskManager = require('./task_manager');
    var Task = require('./task');

    /**
     * @type {TaskManager}
     */
    var gTM = null;

    function onDragOver(e) {
        e.preventDefault();
        $(this).find('.overlay').removeClass('hide');
    }

    function onDragLeave(e) {
        $(this).find('.overlay').addClass('hide');
    }

    function onDropFiles(e) {
        e.preventDefault();

        gTM = new TaskManager();
        gTM.startup().then(u.bind(fileList.refresh, fileList));

        var dataTransfer = e.originalEvent.dataTransfer;
        // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
        if (dataTransfer.items) {
            // Chrome
            u.each(dataTransfer.items, function (item) {
                var getAsEntry = item.getAsEntry || item.webkitGetAsEntry;
                if (typeof getAsEntry === 'function') {
                    var entry = getAsEntry.call(item);
                    if (entry) {
                        traverseFileTree(entry);
                    }
                }
            });
        }
        else if (dataTransfer.files) {
            // Firefox
            u.each(dataTransfer.files, function (file) {
                var options = config.getOptions();
                var bucketName = options.bucketName;
                var key = options.prefix + file.name;
                gTM.addTask(new Task(bucketName, key, file, options));
            });
        }

        return false;
    }

    function traverseFileTree(entry, path) {
        path = path || '';
        if (entry.isFile) {
            entry.file(function (file) {
                // console.log('File: ', path + file.name);
                var options = config.getOptions();
                var bucketName = options.bucketName;
                var key = options.prefix + path + file.name;
                gTM.addTask(new Task(bucketName, key, file, options));
            });
        }
        else if (entry.isDirectory) {
            var dirReader = entry.createReader();
            dirReader.readEntries(function (entries) {
                u.each(entries, function (item) {
                    traverseFileTree(item, path + entry.name + '/');
                });
            });
        }
    }

    exports.init = function () {
        $('#dropzone').on('drop', onDropFiles);
        $('#dropzone').on('dragover', onDragOver);
        $('#dropzone').on('dragleave', onDragLeave);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
