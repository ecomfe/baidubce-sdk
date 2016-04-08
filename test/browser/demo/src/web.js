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

/**
 * 页面中需要有 jQuery，自行引用.
 * @constructor
 */
function BosWebClient(options) {
    /**
     * 配置信息
     * @type {Object}
     */
    this.options = options;

    /**
     * Bucket的名字
     * @type {string}
     */
    this.bucketName = null;

    /**
     * 上传到 Bucket 的文件名，必须以 '/' 开头.
     * @type {string}
     */
    this.objectName = null;

    /**
     * SDK所在页面的引用
     * @type {Window}
     */
    this._sdkWinRef = null;

    /**
     * @type {Object}
     */
    this._eventHandlers = {};
}

BosWebClient.prototype.on = function (type, handler, opt_context) {
    var list = this._eventHandlers[type];
    if (!list) {
        list = (this._eventHandlers[type] = []);
    }

    list.push({handler: handler, context: opt_context});
};

BosWebClient.prototype.dispatchEvent = function (type, data) {
    var list = this._eventHandlers[type];
    if (!list) {
        return;
    }

    for (var i = 0; i < list.length; i ++) {
        var item = list[i];
        try {
            item.handler.call(item.context, data);
        }
        catch (ex) {
            // IGNORE
        }
    }
};


BosWebClient.prototype.fire = function (type, data) {
    this._sdkWinRef.postMessage({
        type: type,
        data: data
    }, '*');
};

/**
 * 初始化Web Uploader
 * @param {jQuery} container 容器的Id.
 */
BosWebClient.prototype.init = function (container) {
    var config = JSON.stringify(this.options);
    var mark = this.options.relayUrl.indexOf('?') === -1 ? '?' : '&';
    var iframeUrl = this.options.relayUrl + mark + 'config=' + encodeURIComponent(config);
    // var iframeUrl = config.endpoint + '/explorer/sdk.html?config=' + encodeURIComponent(config);

    container.html('<iframe src="' + iframeUrl + '">');

    this._sdkWinRef = container.find('iframe').get(0).contentWindow;

    var client = this;
    $(window).on('message', function (evt) {
        var payload = evt.originalEvent.data;
        client.dispatchEvent(payload.type, payload.data);
    });
};

BosWebClient.prototype.setBucketName = function (bucketName) {
    if (!bucketName) {
        throw new Error('Invalid bucketName');
    }

    this.bucketName = bucketName;
};

BosWebClient.prototype.setObjectName = function (objectName) {
    if (!objectName || objectName.substr(0, 1) !== '/') {
        throw new Error('Invalid objectName');
    }

    this.objectName = objectName;
};

BosWebClient.prototype.upload = function () {
    if (!this.bucketName || !this.objectName) {
        return;
    }

    this.fire('upload', {
        bucketName: this.bucketName,
        objectName: this.objectName
    });
};










/* vim: set ts=4 sw=4 sts=4 tw=120: */
