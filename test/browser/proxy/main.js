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

var fs = require('fs');
var url = require('url');
var path = require('path');
var http = require('http');

var httpProxy = require('http-proxy');
var debug = require('debug')('proxy');

// 10.32.249.237   qasandbox.bcetest.baidu.com
// 10.107.37.49    rdsandbox.bcetest.baidu.com
var kDefaultHost = process.env.DEFAULT_HOST || 'bos.bj.baidubce.com';
var kDefaultTarget = 'http://' + kDefaultHost;

// var kDefaultTarget = 'http://platform.v3.bae.baidu.com';
// var kDefaultHost = 'platform.v3.bae.baidu.com';
// var kDefaultTarget = 'http://bs.baidu.com';
// var kDefaultHost = 'bs.baidu.com';
var kWebRoot = process.env.WEBROOT || path.join(__dirname, '..', 'demo');

var proxy = httpProxy.createProxyServer({});
proxy.on('proxyRes', function (proxyRes, req, res) {
    delete proxyRes.headers['content-disposition'];
});

proxy.on('proxyReq', function (proxyReq, req, res, options) {
    if (options.host) {
        proxyReq.setHeader('Host', options.host);
    }
});
proxy.on('error', function (e) {
    console.error(e);
});

console.log("Listening on port 8964")
http.createServer(function (req, res) {
    var target = kDefaultTarget;
    var host = kDefaultHost;
    debug('target = %j, host = %j', target, host);

    var pathname = url.parse(req.url).pathname;
    // /-/
    if (/^\/-\//.test(req.url)) {
        host = req.url.split('/')[2];
        target = 'http://' + host;
        req.url = '/' + req.url.split('/').slice(3).join('/');
    }
    else if (req.method === 'GET'
        && req.url.indexOf('sign=') === -1
        && fs.existsSync(path.join(kWebRoot, pathname))) {
        // TODO 只有调试bcs的时候才需要开启
        target = 'http://127.0.0.1:8000';
        host = '127.0.0.1:8000';
    }

    debug('[%s] %s%s', req.method, target, req.url);

    proxy.web(req, res, {
        target: target,
        // bos server 限定了 Request Header 里面的 Host
        // 因此不能随便设置了，必须跟请求的服务保持一致
        host: host
    });
}).listen(8964);










/* vim: set ts=4 sw=4 sts=4 tw=120: */
