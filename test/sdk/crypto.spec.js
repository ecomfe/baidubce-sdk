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
 * @file crypto.spec.js
 * @author leeight
 */

var path = require('path');
var fs = require('fs');

var crypto = require('../../src/crypto');

describe('crypto', function () {
    it('md5sum', function () {
        expect(crypto.md5sum('hello world')).toEqual('XrY7u+Ae7tCTyyK7j1rNww==');
    });

    it('md5file', function (done) {
        crypto.md5file(path.join(__dirname, '..', 'Makefile'))
            .then(function (md5sum) {
                expect(md5sum).toEqual('yRK9tU4xvtCYzRI7VHTRhg==');
            })
            .fin(done);
    });

    it('md5stream', function (done) {
        var fp = fs.createReadStream(__filename, {start: 0, end: 99});
        var buffer = fs.readFileSync(__filename).slice(0, 100);
        crypto.md5stream(fp)
            .then(function (md5sum) {
                expect(md5sum).toEqual(crypto.md5sum(buffer));
            })
            .fin(done);
    });
});










/* vim: set ts=4 sw=4 sts=4 tw=120: */
