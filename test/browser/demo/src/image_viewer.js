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
    require('etpl/tpl!./tpl/viewer.tpl');

    var exports = {};

    var etpl = require('etpl');
    var u = require('underscore');

    var router = require('./router');
    var client = require('./client');
    var log = require('./log');

    function renderBody(templateName, data) {
        var html = etpl.render(templateName, data);
        $('#dropzone').html(html);
    }


    exports.enter = function (context) {
        $('#ocrBtn').show();
        renderBody('TPL_image_viewer', {
            url: '/' + context.path
        });
    };

    exports.leave = function () {
        $('#ocrBtn').hide();
        $('#dropzone').html('<div class="loading">努力加载中...</div>');
    };

    function rectangleToStyle(rect) {
        return 'position:absolute;'
               + 'background:rgba(255,255,0,.5);'
               + 'top:' + rect.top + 'px;'
               + 'left:' + rect.left + 'px;'
               + 'width:' + rect.width + 'px;'
               + 'height:' + rect.height + 'px';
    }

    function startImageOcr() {
        var bosPath = $('.ocr img').attr('src').replace(/^\/v1\//, '');
        var ocrClient = client.createOCRClient();
        ocrClient.allText(bosPath)
            .then(function (response) {
                var body = response.body;
                body.results.forEach(function (item) {
                    var div = '<div style="' + rectangleToStyle(item.rectangle)
                        + '">' + u.escape(item.word) + '</div>';
                    $('.ocr .image').append(div);
                });

                console.log(response);
            })
            .catch(function (error) {
                log.exception(error);
            })
    }

    exports.init = function () {
        router.register('!view', exports);

        $('#ocrBtn').click(startImageOcr);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
