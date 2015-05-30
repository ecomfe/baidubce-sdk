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

    var $ = require('jquery');
    var u = require('underscore');

    function onDragOver(e) {
        e.preventDefault();
        $(this).css('background', 'yellow');
    }

    function onDragLeave(e) {
        $(this).css('background', 'white');
    }

    function onDropFiles(e) {
        e.preventDefault();

        u.each(e.originalEvent.dataTransfer.items, function (item) {
            var entry = item.webkitGetAsEntry();
            if (entry) {
                traverseFileTree(entry);
            }
        });

        return false;
    }

    function traverseFileTree(entry, path) {
        path = path || '';
        if (entry.isFile) {
            entry.file(function (file) {
                console.log('File: ', path + file.name);
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
