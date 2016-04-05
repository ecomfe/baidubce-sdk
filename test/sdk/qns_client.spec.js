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
 * @file sdk/qns_client.spec.js
 * @author leeight
 */

var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('qns_client.spec');

var config = require('../config');
var QnsClient = require('../../').QnsClient;
var helper = require('./helper');

describe('QnsClient', function () {
    var fail;
    var account = 'bce-sdk-qns-test-case';

    beforeEach(function () {
        fail = helper.fail(this);
        return new QnsClient.Topic(config.qns, account).list()
            .then(function (response) {
                var topics = response.body.topics || [];
                return Q.all(topics.map(function (item) {
                    return new QnsClient.Topic(config.qns, account, item.name).remove();
                }));
            })
            .then(function () {
                return new QnsClient.Subscription(config.qns, account).list();
            })
            .then(function (response) {
                var subscriptions = response.body.subscriptions || [];
                return Q.all(subscriptions.map(function (item) {
                    return new QnsClient.Subscription(config.qns, account, item.name).remove();
                }));
            });
    });

    afterEach(function () {
        // nothing
    });

    it('ok', function () {});

    it('Topic.create and sendMessages', function () {
        var topic = new QnsClient.Topic(config.qns, account, 'my-test-topic');
        return topic.create()
            .then(function (response) {
                var messages = [
                    'hello',
                    'world',
                    '你好，世界',
                    {
                        messageBody: '一二三四五六七',
                        delayInSeconds: 1024
                    }
                ];
                return topic.sendMessages(messages);
            })
            .then(function (response) {
                expect(response.body.messages[0].messageBodyMd5)
                    .toEqual('5d41402abc4b2a76b9719d911017c592');
                expect(response.body.messages[0].messageId)
                    .not.toBeUndefined();
                expect(response.body.messages[1].messageBodyMd5)
                    .toEqual('7d793037a0760186574b0282f2f435e7');
                expect(response.body.messages[1].messageId)
                    .not.toBeUndefined();
                expect(response.body.messages[2].messageBodyMd5)
                    .toEqual('dbefd3ada018615b35588a01e216ae6e');
                expect(response.body.messages[2].messageId)
                    .not.toBeUndefined();
                expect(response.body.messages[3].messageBodyMd5)
                    .toEqual('297c9b46a7dcce323245af01c31dc0ea');
                expect(response.body.messages[3].messageId)
                    .not.toBeUndefined();
            })
            .then(function () {
                return topic.remove();
            });
    });

    it('getTopic and updateTopic', function () {
        var topicName = 'my-test-topic';
        var topic = new QnsClient.Topic(config.qns, account, topicName);
        return topic.create()
            .then(function (response) {
                return topic.get();
            })
            .then(function (response) {
                debug('%j', response);

                expect(response.body.delayInSeconds).toEqual(0);
                expect(response.body.maximumMessageSizeInBytes).toEqual(262144);
                expect(response.body.messageRetentionPeriodInSeconds).toEqual(1209600);
                expect(response.body.numberOfMessages).toEqual(0);
                expect(response.body.numberOfMessagesDelayed).toEqual(0);
                expect(response.body.createdAt).not.toBeUndefined();
                expect(response.body.updatedAt).not.toBeUndefined();
            })
            .then(function () {
                var params = {
                    // 0 - 3600
                    delayInSeconds: 10,
                    // 1024 - 262144
                    maximumMessageSizeInBytes: 1024,
                    // 60 - 1209600
                    messageRetentionPeriodInSeconds: 60
                };
                return topic.update(params);
            })
            .then(function () {
                return topic.get();
            })
            .then(function (response) {
                expect(response.body.delayInSeconds).toEqual(10);
                expect(response.body.maximumMessageSizeInBytes).toEqual(1024);
                expect(response.body.messageRetentionPeriodInSeconds).toEqual(60);
            })
            .then(function () {
                return topic.remove();
            });
    });

    it('Topic.create but failed', function () {
        var topicName = 'my-test-topic';
        var topic = new QnsClient.Topic(config.qns, account, topicName);
        return topic.create()
            .then(function (response) {
                expect(response.body).toEqual({});
                return topic.create();
            })
            .fail(function (response) {
                expect(u.pick(response, 'status_code', 'message', 'code')).toEqual({
                    status_code: 409,
                    message: 'The specified topic already exists',
                    code: 'ResourceConflict'
                });
                return topic.list();
            })
            .then(function (response) {
                expect(response.body).not.toBeUndefined();
                expect(response.body.topics).not.toBeUndefined();
                expect(response.body.topics.length).toBe(1);
                expect(u.pick(response.body.topics[0], 'delayInSeconds',
                    'maximumMessageSizeInBytes', 'messageRetentionPeriodInSeconds', 'name')).toEqual({
                    delayInSeconds: 0,
                    maximumMessageSizeInBytes: 262144,
                    messageRetentionPeriodInSeconds: 1209600,
                    name: 'my-test-topic'
                });
                return topic.remove();
            })
            .then(function (response) {
                debug('%j', response);
                expect(response.body).toEqual({});
                return topic.list()
            })
            .fail(function (response) {
                debug('%j', response);
            })
            .then(function (response) {
                expect(response.body).toEqual({
                    "isTruncated": false,
                    "marker": "MA==",
                    "topics":[]
                });
            });
    });

    it('Subscription.create', function () {
        var topicName = 'my-topic-name';
        var subscriptionName = 'my-subscription-name';
        var topic = new QnsClient.Topic(config.qns, account, topicName);
        return topic.create()
            .then(function (response) {
                return topic.createSubscription(subscriptionName, {
                    receiveMessageWaitTimeInSeconds: 20,
                    visibilityTimeoutInSeconds: 43200,
                    pushConfig: {
                        endpoint: 'http://www.baidu.com',
                        version: 'v1alpha'
                    }
                });
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                var s = new QnsClient.Subscription(config.qns,
                    account, subscriptionName);
                return s.get();
            })
            .then(function (response) {
                expect(response.body.numberOfMessages).toEqual(0);
                expect(response.body.numberOfMessagesNotVisible).toEqual(0);
                expect(response.body.pushConfig).toEqual({
                    endpoint: 'http://www.baidu.com',
                    version: 'v1alpha'
                });
                expect(response.body.receiveMessageWaitTimeInSeconds).toEqual(20);
                expect(response.body.topic).toEqual(topicName);
                expect(response.body.visibilityTimeoutInSeconds).toEqual(43200);

                debug('%j', response);
            })
            .then(function (response) {
                var s = new QnsClient.Subscription(config.qns,
                    account, subscriptionName);
                return s.update({
                    receiveMessageWaitTimeInSeconds: 10,
                    visibilityTimeoutInSeconds: 1024
                });
            })
            .then(function (response) {
                expect(response.body).toEqual({});
                return new QnsClient.Subscription(config.qns,
                    account, subscriptionName).get();
            })
            .then(function (response) {
                expect(response.body.receiveMessageWaitTimeInSeconds).toEqual(10);
                expect(response.body.visibilityTimeoutInSeconds).toEqual(1024);
            })
            .then(function () {
                return new QnsClient.Subscription(config.qns,
                    account, subscriptionName).remove();
            })
            .then(function (response) {
                expect(response.body).toEqual({});
            });
    });

    it('send & receive', function () {
        var topicName = 'my-test-topic';
        var subscriptionName = 'my-subscription-name';
        var receiptHandle = null;

        var topic = new QnsClient.Topic(config.qns, account, topicName);
        var subscription = new QnsClient.Subscription(config.qns,
            account, subscriptionName);
        return topic.create()
            .then(function () {
                return topic.createSubscription(subscriptionName);
            })
            .then(function () {
                return topic.sendMessages(['1', '2', '3']);
            })
            .then(function (response) {
                debug('%j', response);
                return helper.delayMs(3000);
            })
            .then(function () {
                return subscription.receiveMessages({
                    maxMessages: 32,
                    waitInSeconds: 20,
                    peek: 1
                })
            })
            .then(function (response) {
                debug('%j', response);
                // TODO 好奇怪，发送了3个消息，只能得到一个？
                // FIXME expect(response.body.messages.length).toEqual(3);
                var message = response.body.messages[0];
                expect(message.messageBody).toEqual('3');
                expect(message.messageBodyMd5).toEqual('eccbc87e4b5ce2fe28308fd9f2a7baf3');
                expect(message.receiptHandle).not.toBeUndefined();
                expect(message.receiveCount).toEqual(1);

                receiptHandle = message.receiptHandle;

                return subscription.changeVisibility(receiptHandle, 10240);
            })
            .then(function (response) {
                debug('%j', response);
                expect(response.body.receiptHandle).toEqual(receiptHandle);
                return subscription.deleteMessage(receiptHandle);
            })
            .then(function (response) {
                debug('%j', response);
                expect(response.body).toEqual({});
            });
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
