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
 * @file sdk/ses_client.spec.js
 * @author leeight
 */

/* eslint fecs-camelcase:[2,{"ignore":["/file_(name|data)/"]}] */

var path = require('path');
var fs = require('fs');

var debug = require('debug')('ses_client.spec');
var expect = require('expect.js');

var config = require('../config');
var SesClient = require('../../').SesClient;
var helper = require('./helper');

describe('SesClient', function () {
    var fail;
    var client;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        // jasmine.getEnv().defaultTimeoutInterval = 60 * 1000;

        fail = helper.fail(this);

        client = new SesClient(config.ses);
    });

    afterEach(function () {
        // nothing
    });

    it('ok', function () {});

    it('addVerifiedEmail', function () {
        return client.addVerifiedEmail('liyubei@baidu.com').then(function (response) {
            debug('%j', response);
        }).catch(function (error) {
            if (error.code == '207') {
                expect(error.status_code).to.eql(500);
                expect(error.message).to.eql('mail addr [liyubei@baidu.com] already verified, please not re-verify');
                expect(error.code).to.eql('207');
            }
            else {
                fail(error);
            }
        });
    });

    it('getAllVerifiedEmails', function () {
        return client.getAllVerifiedEmails()
            .then(function (response) {
                expect(response.body).to.eql({
                    details: [
                        {
                            address: 'liyubei@baidu.com',
                            status: 0
                        }
                    ]
                });
            });
    });

    it('sendMail', function () {
        return client.sendMail({
            from: 'liyubei@baidu.com',
            to: 'liyubei@baidu.com',
            // cc: 'liyubei@baidu.com',
            // bcc: 'liyubei@baidu.com',
            subject: '测试邮件',
            text: '文本内容',
            html: '<font color="red">HTML内容</font>'
                  + '<p><img src="cid:bd_logo1.png" /></p>'
                  + '<p><img src="cid:googlelogo_color_272x92dp.png" /></p>',
            attachments: [
                __filename,
                {
                    file_name: '你好.txt',
                    file_data: {
                        data: new Buffer('你好').toString('base64')
                    }
                },
                {
                    file_name: 'googlelogo_color_272x92dp.png',
                    cid: 'googlelogo_color_272x92dp.png',
                    file_data: {
                        data: fs.readFileSync(
                            path.join(__dirname, './googlelogo_color_272x92dp.png')).toString('base64')
                    }
                },
                {
                    file_name: 'bd_logo1.png',
                    cid: 'bd_logo1.png',
                    file_data: {
                        data: fs.readFileSync(path.join(__dirname, './bd_logo1.png')).toString('base64')
                    }
                }
            ]
        }).then(function (response) {
            expect(response.body.message_id).not.to.be(undefined);
        });
    });

    it('getQuota', function () {
        return client.getQuota().then(function (response) {
            expect(response.body.maxPerDay).not.to.be(undefined);
            expect(response.body.maxPerSecond).not.to.be(undefined);
            expect(response.body.usedToday).not.to.be(undefined);
        });
    });

    it('setQuota', function () {
        var quota = {
            maxPerDay: 100
        };
        return client.setQuota(quota).then(function (response) {
            expect(response.body).to.eql({});
        });
    });
});


/* vim: set ts=4 sw=4 sts=4 tw=120: */
