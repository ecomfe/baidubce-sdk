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

    var client = require('./client');
    var log = require('./log');

    var G_appId;

    function initEvent() {
        $('#addFaceApp').dropdown();

        $('#addFaceApp').click(function () {
            if ($(this).data('appId')) {
                return false;
            }

            var faceClient = client.createFaceClient();
            faceClient.createApp()
                .then(function (response) {
                    G_appId = response.body.appId;
                    $('#addFaceApp')
                        .data('appId', G_appId)
                        .html('<i class="fa fa-smile-o"></i> 人脸识别(' + G_appId + ') <span class="caret"></span>');
                })
                .catch(log.exception);
        });

        $(document).on('click', '[data-cmd="CREATE_GROUP"]', createNewGroup);
        $(document).on('click', '[data-cmd="DELETE_GROUP"]', deleteNowGroup);
    }

    function deleteNowGroup(evt) {
        var groupName = $(this).data('group-name');
        var faceClient = client.createFaceClient();
        faceClient.deleteGroup(G_appId, groupName)
            .then(function () {
                log.ok('成功删除组『' + groupName + '』');
                refreshList();
            })
            .catch(log.exception);
    }

    function createNewGroup(evt) {
        var groupName = prompt('请输入组名：');
        if (!groupName) {
            return;
        }

        var faceClient = client.createFaceClient();
        faceClient.createGroup(G_appId, groupName)
            .then(function () {
                log.ok('成功创建组『' + groupName + '』');
                refreshList();
            })
            .catch(log.exception);
    }

    function refreshList() {
        var faceClient = client.createFaceClient();
        faceClient.listGroups(G_appId)
            .then(function (response) {
                var html = [];
                var groups = response.body.groups;
                for (var i = 0; i < groups.length; i ++) {
                    var group = groups[i];
                    html.push('<li><a>' + group.groupName
                        + '<i data-cmd="DELETE_GROUP" data-group-name="' + group.groupName + '" class="fa fa-times-circle"></i></a></li>');
                }
                if (groups.length) {
                    html.unshift('<li class="dropdown-header">当前组列表</li>');
                    html.push('<li role="separator" class="divider"></li>');
                }
                html.push('<li data-cmd="CREATE_GROUP"><a>创建组</a></li>');
                $('#addFaceApp + .dropdown-menu').html(html.join(''));
            })
            .catch(log.exception);
    }

    exports.init = function () {
        initEvent();

        var faceClient = client.createFaceClient();
        faceClient.listApps()
            .then(function (response) {
                var apps = response.body.apps;
                if (!apps.length) {
                    $('#addFaceApp')
                        .attr('disabled', false)
                        .html('<i class="fa fa-smile-o"></i> 初始化人脸识别工程');
                }
                else {
                    G_appId = apps[0].appId;
                    $('#addFaceApp')
                        .attr('disabled', false)
                        .data('appId', G_appId)
                        .html('<i class="fa fa-smile-o"></i> 人脸识别(' + G_appId + ') <span class="caret"></span>');
                    refreshList();
                }
            })
            .catch(log.exception);
    };

    return exports;
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
