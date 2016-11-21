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
 * @file src/bcc_client.js
 * @author leeight
 */

/* eslint-env node */
/* eslint max-params:[0,10] */
/* eslint fecs-camelcase:[2,{"ignore":["/opt_/"]}] */

var util = require('util');

var u = require('underscore');
var debug = require('debug')('bce-sdk:BccClient');

var BceBaseClient = require('./bce_base_client');


/**
 * BCC service api
 *
 * 内网API地址：http://api.bcc.bce-sandbox.baidu.com
 * 沙盒API地址：http://bcc.bce-api.baidu.com
 *
 * @see http://gollum.baidu.com/BceDocumentation/BccOpenAPI#简介
 *
 * @constructor
 * @param {Object} config The bcc client configuration.
 * @extends {BceBaseClient}
 */
function BccClient(config) {
    BceBaseClient.call(this, config, 'bcc', true);
}
util.inherits(BccClient, BceBaseClient);

// --- BEGIN ---

BccClient.prototype.listInstances = function (opt_options) {
    var options = opt_options || {};
    var params = u.extend(
        {maxKeys: 1000},
        u.pick(options, 'maxKeys', 'marker')
    );

    return this.sendRequest('GET', '/v1/instance', {
        params: params,
        config: options.config
    });
};

function abstractMethod() {
    throw new Error('unimplemented method');
}

// GET /instance/price
BccClient.prototype.getPackages = function (opt_options) {
    var options = opt_options || {};

    return this.sendRequest('GET', '/v1/instance/price', {
        config: options.config
    });
};

// GET /image?marker={marker}&maxKeys={maxKeys}&imageType={imageType}
BccClient.prototype.getImages = function (opt_options) {
    var options = opt_options || {};

    // imageType => All, System, Custom, Integration
    var params = u.extend(
        {maxKeys: 1000, imageType: 'All'},
        u.pick(options, 'maxKeys', 'marker', 'imageType')
    );

    return this.sendRequest('GET', '/v1/image', {
        config: options.config,
        params: params
    });
};

// POST /instance
BccClient.prototype.createInstance = function (body, opt_options) {
    var me = this;
    return this.getClientToken().then(function (response) {
        var options = opt_options || {};

        var clientToken = response.body.token;
        var params = {
            clientToken: clientToken
        };

        /**
        var body = {
            // MICRO,SMALL,MEDIUM,LARGE,XLARGE,XXLARGE
            instanceType: string,
            imageId: string,
            ?localDiskSizeInGB: int,
            ?createCdsList: List<CreateCdsModel>,
            ?networkCapacityInMbps: int,
            ?purchaseCount: int,
            ?name: string,
            ?adminPass: string,
            ?networkType: string,
            ?noahNode: string
        };
        */

        debug('createInstance, params = %j, body = %j', params, body);

        return me.sendRequest('POST', '/v1/instance', {
            config: options.config,
            params: params,
            body: JSON.stringify(body)
        });
    });
};

// GET /instance/{instanceId}
BccClient.prototype.getInstance = function (id, opt_options) {
    var options = opt_options || {};

    return this.sendRequest('GET', '/v1/instance/' + id, {
        config: options.config
    });
};

// PUT /instance/{instanceId}?action=start
BccClient.prototype.startInstance = function (id, opt_options) {
    var options = opt_options || {};
    var params = {
        start: ''
    };

    return this.sendRequest('PUT', '/v1/instance/' + id, {
        params: params,
        config: options.config
    });
};

// PUT /instance/{instanceId}?action=stop
BccClient.prototype.stopInstance = function (id, opt_options) {
    var options = opt_options || {};
    var params = {
        stop: ''
    };

    return this.sendRequest('PUT', '/v1/instance/' + id, {
        params: params,
        config: options.config
    });
};

// PUT /instance/{instanceId}?action=reboot
BccClient.prototype.restartInstance = function (id, opt_options) {
    var options = opt_options || {};
    var params = {
        reboot: ''
    };

    return this.sendRequest('PUT', '/v1/instance/' + id, {
        params: params,
        config: options.config
    });
};

// PUT /instance/{instanceId}?action=changePass
BccClient.prototype.changeInstanceAdminPassword = abstractMethod;

// PUT /instance/{instanceId}?action=rebuild
BccClient.prototype.rebuildInstance = abstractMethod;

// DELETE /instance/{instanceId}
BccClient.prototype.deleteInstance = function (id, opt_options) {
    var options = opt_options || {};

    return this.sendRequest('DELETE', '/v1/instance/' + id, {
        config: options.config
    });
};

// PUT /instance/{instanceId}/securityGroup/{securityGroupId}?action=bind
BccClient.prototype.joinSecurityGroup = abstractMethod;

// PUT /instance/{instanceId}/securityGroup/{securityGroupId}?action=unbind
BccClient.prototype.leaveSecurityGroup = abstractMethod;

// GET /instance/{instanceId}/vnc
BccClient.prototype.getVNCUrl = function (id, opt_options) {
    var options = opt_options || {};

    return this.sendRequest('GET', '/v1/instance/' + id + '/vnc', {
        config: options.config
    });
};

BccClient.prototype.getClientToken = function (opt_options) {
    return this.sendRequest('POST', '/v1/token/create');
};

// --- E N D ---

BccClient.prototype._generateClientToken = function () {
    var clientToken = Date.now().toString(16) + (Number.MAX_VALUE * Math.random()).toString(16).substr(0, 8);
    return 'ClientToken:' + clientToken;
};



module.exports = BccClient;


