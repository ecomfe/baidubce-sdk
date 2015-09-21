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
 * @file src/face_client.js
 * @author leeight
 */

/* eslint-env node */
/* eslint max-params:[0,10] */

var util = require('util');

var u = require('underscore');
var Q = require('q');
var debug = require('debug')('FaceClient');

var H = require('./headers');
var Auth = require('./auth');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');

var MAX_PUT_OBJECT_LENGTH = 5368709120;     // 5G
var MAX_USER_METADATA_SIZE = 2048;          // 2 * 1024
// var MIN_PART_NUMBER = 1;
// var MAX_PART_NUMBER = 10000;


/**
 * 人脸识别API
 *
 * @see http://gollum.baidu.com/bcefaceapi
 * @constructor
 * @param {Object} config The face client configuration.
 * @extends {BceBaseClient}
 */
function FaceClient(config) {
    BceBaseClient.call(this, config, 'face', true);

    /**
     * @type {HttpClient}
     */
    this._httpAgent = null;
}
util.inherits(FaceClient, BceBaseClient);

// --- BEGIN ---

FaceClient.prototype.createApp = function (options) {
    options = options || {};

    var url = '/v1/app';
    return this._sendRequest('POST', url, {
        config: options.config
    });
};

FaceClient.prototype.listApps = function (options) {
    options = options || {};

    var url = '/v1/app';
    return this._sendRequest('GET', url, {
        config: options.config
    });
};

FaceClient.prototype.createGroup = function (appId, groupName, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/group';
    return this._sendRequest('POST', url, {
        body: JSON.stringify({groupName: groupName}),
        config: options.config
    });
};

FaceClient.prototype.deleteGroup = function (appId, groupName, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/group/' + groupName;
    return this._sendRequest('DELETE', url, {
        config: options.config
    });
};

FaceClient.prototype.getGroup = function (appId, groupName, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/group/' + groupName;
    return this._sendRequest('GET', url, {
        config: options.config
    });
};

FaceClient.prototype.listGroups = function (appId, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/group';
    return this._sendRequest('GET', url, {
        config: options.config
    });
};

FaceClient.prototype.createPerson = function (appId, groupName, personName, faces, options) {
    options = options || {};

    faces = faces.map(function (item) {
        return {
            bosPath: item
        };
    });

    debug('Create Person Faces = %j', faces);

    var url = '/v1/app/' + appId + '/person';
    return this._sendRequest('POST', url, {
        body: JSON.stringify({
            personName: personName,
            groupName: groupName,
            faces: faces
        }),
        config: options.config
    });
};

FaceClient.prototype.deletePerson = function (appId, personName, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/person/' + personName;
    return this._sendRequest('DELETE', url, {
        config: options.config
    });
};

FaceClient.prototype.updatePerson = function (appId, personName, faces, options) {
    options = options || {};

    faces = faces.map(function (item) {
        return {
            bosPath: item
        };
    });

    var url = '/v1/app/' + appId + '/person/' + personName;
    return this._sendRequest('PUT', url, {
        body: JSON.stringify({faces: faces}),
        config: options.config
    });
};

FaceClient.prototype.getPerson = function (appId, personName, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/person/' + personName;
    return this._sendRequest('GET', url, {
        config: options.config
    });
};

FaceClient.prototype.listPersons = function (appId, options) {
    options = options || {};

    var url = '/v1/app/' + appId + '/person';
    var params = u.pick(options, 'groupName');
    return this._sendRequest('GET', url, {
        params: params,
        config: options.config
    });
};

FaceClient.prototype.identify = function (appId, groupName, data, options) {
    options = options || {};

    var body = {};
    if (Buffer.isBuffer(data)) {
        body = {
            base64: data.toString('base64')
        };
    }
    else {
        body = {
            bosPath: data
        };
    }

    var url = '/v1/app/' + appId + '/group/' + groupName;
    return this._sendRequest('POST', url, {
        params: {identify: ''},
        body: JSON.stringify(body),
        config: options.config
    });

};

FaceClient.prototype.verify = function (appId, personName, data, options) {
    options = options || {};

    var body = {};
    if (Buffer.isBuffer(data)) {
        body = {
            base64: data.toString('base64')
        };
    }
    else {
        body = {
            bosPath: data
        };
    }

    var url = '/v1/app/' + appId + '/person/' + personName;
    return this._sendRequest('POST', url, {
        params: {verify: ''},
        body: JSON.stringify(body),
        config: options.config
    });
};

FaceClient.prototype.createSignature = function (credentials, httpMethod, path, params, headers) {
    return Q.fcall(function () {
        var auth = new Auth(credentials.ak, credentials.sk);
        return auth.generateAuthorization(httpMethod, path, params, headers);
    });
};

// --- E N D ---


FaceClient.prototype._sendRequest = function (httpMethod, resource, varArgs) {
    var defaultArgs = {
        body: null,
        headers: {},
        params: {},
        config: {},
        outputStream: null
    };
    var args = u.extend(defaultArgs, varArgs);

    var config = u.extend({}, this.config, args.config);

    var client = this;
    var agent = this._httpAgent = new HttpClient(config);
    u.each(['progress', 'error', 'abort'], function (eventName) {
        agent.on(eventName, function (evt) {
            client.emit(eventName, evt);
        });
    });
    return this._httpAgent.sendRequest(httpMethod, resource, args.body,
        args.headers, args.params, u.bind(this.createSignature, this),
        args.outputStream
    );
};

module.exports = FaceClient;









/* vim: set ts=4 sw=4 sts=4 tw=120: */
