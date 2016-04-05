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

var http = require('http');
var https = require('https');

var async = require('async');
var Q = require('q');
var expect = require('expect.js');
var debug = require('debug')('helper.spec');

exports.fail = function (spec) {
    // var failImpl = spec.fail.bind(spec);
    return function (error) {
        debug(error);

        if (error instanceof Error) {
            expect().fail(error);
        }
        else if (Buffer.isBuffer(error)) {
            expect().fail(new Error(error.toString()));
        }
        else {
            expect().fail(new Error(JSON.stringify(error)));
        }
    }
};

exports.delayMs = function (ms) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, ms);
    return deferred.promise;
};

/**
 * @param {number} maxWaitSeconds 最长的等待时间.
 * @param {number} tickSeconds 周期性的检查时间.
 * @param {Function} iterate 执行检查的逻辑，返回（）
 */
exports.loop = function (maxWaitSeconds, tickSeconds, iterate) {
    var deferred = Q.defer();

    var startTime = Date.now();

    function check() {
        var now = Date.now();
        if ((now - startTime) >= maxWaitSeconds * 1000) {
            deferred.reject('helper.loop(' + maxWaitSeconds + 's) Timeout.');
            return;
        }

        iterate().then(deferred.resolve).catch(function (error) {
            if (error === '$continue') {
                debug('enter next loop');
                setTimeout(check, tickSeconds * 1000);
            }
            else {
                deferred.reject(error);
            }
        });
    }

    setTimeout(check, tickSeconds * 1000);

    return deferred.promise;
};

exports.get = function (url) {
    var client = /^https/.test(url) ? https : http;
    var deferred = Q.defer();
    client.get(url, function (res) {
            var buffer = [];
            res.on('data', function (data) {
                buffer.push(data);
            });
            res.on('end', function () {
                var body = Buffer.concat(buffer);
                debug('statusCode = %s', res.statusCode);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    deferred.resolve(body);
                }
                else {
                    deferred.reject(body);
                }
            })
        })
        .on('error', deferred.reject);
    return deferred.promise;
};

/* vim: set ts=4 sw=4 sts=4 tw=120: */
