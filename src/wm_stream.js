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
 * @file src/wm_stream.js
 * @author leeight
 */

/* eslint-env node */

var stream = require('stream');
var util = require('util');

/**
 * Writable memory stream, which can be
 * used a http_client output stream.
 *
 * @constructor
 */
function WMStream() {
    stream.Writable.call(this);

    this.store = new Buffer('');
}
util.inherits(WMStream, stream.Writable);

WMStream.prototype._write = function (chunk, enc, cb) {
    var buffer = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk, enc);
    this.store = Buffer.concat([this.store, buffer]);

    cb();
};

module.exports = WMStream;









/* vim: set ts=4 sw=4 sts=4 tw=120: */
