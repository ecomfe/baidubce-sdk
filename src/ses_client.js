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
 * @file src/ses_client.js
 * @author leeight
 */

/* eslint-env node */
/* eslint max-params:[0,10] */
var fs = require('fs');
var path = require('path');
var util = require('util');

var u = require('underscore');
var Q = require('q');

var Auth = require('./auth');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');

/**
 * SES service api
 *
 * @constructor
 * @param {Object} config The bos client configuration.
 * @extends {BceBaseClient}
 */
function SesClient(config) {
    BceBaseClient.call(this, config, 'bos', true);

    /**
     * @type {HttpClient}
     */
    this._httpAgent = null;
}
util.inherits(SesClient, BceBaseClient);

// --- B E G I N ---
SesClient.prototype.addVerifiedEmail = function (email) {
    var url = '/v1/verifiedEmail/' + (email);
    return this._sendRequest('PUT', url);
};

SesClient.prototype.getAllVerifiedEmails = function () {
    var url = '/v1/verifiedEmail';
    return this._sendRequest('GET', url);
};

SesClient.prototype.getVerifiedEmail = function (email) {
    var url = '/v1/verifiedEmail/' + (email);
    return this._sendRequest('GET', url);
};

SesClient.prototype.deleteVerifiedEmail = function (email) {
    var url = '/v1/verifiedEmail/' + (email);
    return this._sendRequest('DELETE', url);
};

SesClient.prototype.getQuota = function () {
    var url = '/v1/quota';
    return this._sendRequest('GET', url);
};

SesClient.prototype.setQuota = function (quota) {
    var url = '/v1/quota';
    Object.keys(quota).forEach(function (key) {
        var value = quota[key];
        // 如果是 number，传递到后端会出错的
        quota[key] = value.toString();
    });

    return this._sendRequest('PUT', url, {
        body: JSON.stringify(quota)
    });
};

SesClient.prototype.sendMail = function (mailOptions) {
    var from = mailOptions.from || '';

    var to = mailOptions.to || [];
    if (typeof to === 'string') {
        to = [to];
    }

    var cc = mailOptions.cc || [];
    if (typeof cc === 'string') {
        cc = [cc];
    }

    var bcc = mailOptions.bcc || [];
    if (typeof bcc === 'string') {
        bcc = [bcc];
    }

    var subject = mailOptions.subject;
    var text = mailOptions.text || '';
    var html = mailOptions.html || '';
    var attachments = mailOptions.attachments || [];

    attachments = attachments.map(function (item) {
        if (typeof item === 'string') {
            return {
                /* eslint-disable */
                file_name: path.basename(item),
                file_data: {
                    data: fs.readFileSync(item).toString('base64')
                }
                /* eslint-enable */
            };
        }

        return item;
    });

    var url = '/v1/email';
    var body = JSON.stringify({
        mail: {
            source: {
                from: from
            },
            destination: {
                /* eslint-disable */
                to_addr: to.map(function (item) {
                    return {
                        addr: item
                    };
                }),
                cc_addr: cc.map(function (item) {
                    return {
                        addr: item
                    };
                }),
                bcc_addr: bcc.map(function (item) {
                    return {
                        addr: item
                    };
                })
                /* eslint-enable */
            },
            subject: {
                charset: 1,
                data: subject
            },
            priority: 1,
            message: {
                text: {
                    charset: 1,
                    data: text
                },
                html: {
                    charset: 1,
                    data: html
                }
            },
            attachments: attachments
        }
    });

    return this._sendRequest('POST', url, {body: body});
};

SesClient.prototype.createSignature = function (credentials, httpMethod, path, params, headers) {
    return Q.fcall(function () {
        var auth = new Auth(credentials.ak, credentials.sk);
        return auth.generateAuthorization(httpMethod, path, params, headers);
    });
};
// --- E   N   D ---


SesClient.prototype._sendRequest = function (httpMethod, resource, varArgs) {
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

module.exports = SesClient;








/* vim: set ts=4 sw=4 sts=4 tw=120: */
