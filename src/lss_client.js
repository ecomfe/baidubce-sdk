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
 *
 * @file src/lss_client.js
 * @author leeight
 */

/* eslint-env node */
/* eslint max-params:[0,10] */
/* eslint fecs-camelcase:[2,{"ignore":["/opt_/"]}] */

var util = require('util');

var Q = require('q');

var BceBaseClient = require('./bce_base_client');

/**
 * 直播模板
 * http://bce.baidu.com/doc/LSS/API.html#.9E.2A.60.EA.11.C8.DD.82.F7.A6.B1.71.BC.C3.B7.68
 *
 * @constructor
 * @param {Object} config The lss client configuration.
 * @extends {BceBaseClient}
 */
function Preset(config) {
    BceBaseClient.call(this, config, 'media', true);

    this._name = null;
}
util.inherits(Preset, BceBaseClient);

// --- B E G I N ---

Preset.prototype._buildUrl = function (opt_name) {
    var url = '/v3/live/preset';
    if (opt_name === false) {
        return url;
    }

    var name = opt_name || this._name;
    return url + (name ? '/' + name : '');
};

Preset.prototype.setName = function (name) {
    this._name = name;
    return this;
};

Preset.prototype.create = function (options) {
    var self = this;

    var url = self._buildUrl(false);
    return self.sendRequest('POST', url, {
        body: JSON.stringify(options)
    }).then(function (response) {
        self._name = options.presetName;
        return response;
    });
};

Preset.prototype.remove = function (name) {
    var url = this._buildUrl(name);
    return this.sendRequest('DELETE', url);
};

Preset.prototype.removeAll = function () {
    var self = this;
    return self.list().then(function (response) {
        var asyncTasks = response.body.presets
            .filter(function (item) {
                // bce.~~ | lss.~~
                return !/^(bce|lss)\./.test(item.presetName);
            })
            .map(function (item) {
                return self.remove(item.presetName);
            });
        return Q.all(asyncTasks);
    });
};

Preset.prototype.get = function (name) {
    var url = this._buildUrl(name);
    return this.sendRequest('GET', url);
};

Preset.prototype.list = function () {
    var url = this._buildUrl(false);
    return this.sendRequest('GET', url);
};

// --- E   N   D ---

/**
 * 直播会话接口（Live Session API）
 * http://bce.baidu.com/doc/LSS/API.html#.23.14.D5.44.EE.00.30.BA.DB.38.4B.3D.1E.12.15.C3
 *
 * @constructor
 * @param {Object} config The lss client configuration.
 * @extends {BceBaseClient}
 */
function Session(config) {
    BceBaseClient.call(this, config, 'media', true);

    /**
     * The session id.
     *
     * @private
     * @type {string}
     */
    this._sessionId = null;
}
util.inherits(Session, BceBaseClient);

// --- B E G I N ---

Session.prototype._buildUrl = function (opt_sessionId) {
    var url = '/v3/live/session';
    if (opt_sessionId === false) {
        return url;
    }

    var sessionId = opt_sessionId || this._sessionId;
    return url + (sessionId ? '/' + sessionId : '');
};

/**
 * 设置当前 Session 的 Id.
 *
 * @param {string} sessionId The session id.
 * @return {Session}
 */
Session.prototype.setSessionId = function (sessionId) {
    this._sessionId = sessionId;
    return this;
};

Session.prototype.create = function (options) {
    var self = this;

    var url = self._buildUrl(false);
    return self.sendRequest('POST', url, {
        body: JSON.stringify(options)
    }).then(function (response) {
        var session = response.body;
        self.setSessionId(session.sessionId);
        return response;
    });
};

Session.prototype.remove = function (sessionId) {
    var url = this._buildUrl(sessionId);
    return this.sendRequest('DELETE', url);
};

Session.prototype.removeAll = function () {
    var self = this;
    return self.list().then(function (response) {
        var asyncTasks = response.body.liveInfos.map(function (item) {
            return self.remove(item.sessionId);
        });
        return Q.all(asyncTasks);
    });
};

Session.prototype.get = function (sessionId) {
    var url = this._buildUrl(sessionId);
    return this.sendRequest('GET', url);
};

Session.prototype.list = function () {
    return this.sendRequest('GET', this._buildUrl(false));
};

Session.prototype.pause = function (sessionId) {
    var url = this._buildUrl(sessionId);
    return this.sendRequest('PUT', url, {
        params: {stop: ''}
    });
};

Session.prototype.resume = function (sessionId) {
    var url = this._buildUrl(sessionId);
    return this.sendRequest('PUT', url, {
        params: {resume: ''}
    });
};

Session.prototype.refresh = function (sessionId) {
    var url = this._buildUrl(sessionId);
    return this.sendRequest('PUT', url, {
        params: {refresh: ''}
    });
};

// --- E   N   D ---

/**
 * 直播通知接口（Live Notification API）
 * http://bce.baidu.com/doc/LSS/API.html#.72.90.9D.94.D6.1A.76.02.A5.A9.63.B2.32.A8.E7.2C
 *
 * @constructor
 * @param {Object} config The lss client configuration.
 * @param {string} name The notification name.
 * @param {string} endpoint The notification endpoint.
 * @extends {BceBaseClient}
 */
function Notification(config, name, endpoint) {
    BceBaseClient.call(this, config, 'media', true);

    this._name = name;
    this._endpoint = endpoint;
}
util.inherits(Notification, BceBaseClient);

// --- B E G I N ---

Notification.prototype._buildUrl = function (opt_name) {
    var url = '/v3/live/notification';
    if (opt_name === false) {
        return url;
    }

    var name = opt_name || this._name;
    return url + (name ? '/' + name : '');
};

Notification.prototype.create = function () {
    var url = this._buildUrl(false);
    var data = {
        name: this._name,
        endpoint: this._endpoint
    };
    return this.sendRequest('POST', url, {
        body: JSON.stringify(data)
    });
};

Notification.prototype.get = function (name) {
    var url = this._buildUrl(name);
    return this.sendRequest('GET', url);
};

Notification.prototype.remove = function (name) {
    var url = this._buildUrl(name);
    return this.sendRequest('DELETE', url);
};

Notification.prototype.removeAll = function () {
    var self = this;
    return self.list().then(function (response) {
        var asyncTasks = (response.body.notifications || []).map(function (item) {
            return self.remove(item.name);
        });
        return Q.all(asyncTasks);
    });
};

Notification.prototype.list = function () {
    var url = this._buildUrl(false);
    return this.sendRequest('GET', url);
};

// --- E   N   D ---

exports.Preset = Preset;
exports.Session = Session;
exports.Notification = Notification;





/* vim: set ts=4 sw=4 sts=4 tw=120: */
