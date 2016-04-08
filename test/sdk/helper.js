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

var Q = require('q');
var debug = require('debug')('helper');

exports.fail = function (spec) {
    var failImpl = spec.fail.bind(spec);
    return function (error) {
        if (error instanceof Error) {
            failImpl(error);
        }
        else {
            failImpl(new Error(JSON.stringify(error)));
        }
    }
};

exports.delayMs = function (ms) {
    var deferred = Q.defer();
    setTimeout(deferred.resolve, ms);
    return deferred.promise;
};

exports.get = function (url) {
    var deferred = Q.defer();
    http.get(url, function (res) {
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
