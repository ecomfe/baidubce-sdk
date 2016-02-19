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
 * @file src/doc_client.js
 * @author guofan
 */

/* eslint-env node */
/* eslint max-params:[0,10] */
/* eslint fecs-camelcase:[2,{"ignore":["/opt_/"]}] */

var util = require('util');

var Q = require('q');
var u = require('underscore');
var fs = require('fs');
var path = require('path');
var Auth = require('./auth');
var BosClient = require('./bos_client');
var HttpClient = require('./http_client');
var BceBaseClient = require('./bce_base_client');

/**
 * 文档转码任务接口（Job/Transcoding API）
 * http://bce.baidu.com/doc/DOC/API.html#.1D.1E.B0.1E.6C.74.0C.6D.C1.68.D2.57.6F.70.EA.F1
 *
 * @constructor
 * @param {Object} config The doc client configuration.
 * @extends {BceBaseClient}
 */
function DocClient(config) {
    BceBaseClient.call(this, config, 'doc', true);
    this._config = config;
    this.regionSupported = false;
    this.serviceId = 'doc';
    this._docId = null;
}
util.inherits(DocClient, BceBaseClient);

// --- B E G I N ---

DocClient.prototype._buildUrl = function () {
    var url = '/v1/document';
    return url;
};

DocClient.prototype._isValidFormat = function() {

}

DocClient.prototype.createDocument = function (file, options) {
    var self = this;
    var url = self._buildUrl();
    options = options || {};
    //calc md5 and sizeInBytes
    var filename = file.name;
    if(!options["title"]){
        options["title"] = filename.split('.')[0];
    }
    if (!options["format"]){
        options["format"] = filename.split('.')[1];
    }
    options["meta"] = {};
    options["meta"]["sizeInBytes"] = file.size;

    var deffered = function(file) {
        var reader = new FileReader();
        var deferred = Q.defer();
        reader.readAsBinaryString(file);
        reader.onloadend = function (e) {
            if (e.target.readyState == FileReader.DONE) {
                var content = e.target.result;
                //var data = new Buffer(content,'UTF-8');
                deferred.resolve(content);
            }
        };
        return deferred.promise;
    };
    return deffered(file).then(function(content){
        SparkMD5 = require("./spark-md5");
        spark = new SparkMD5();
        spark.appendBinary(content);
        options["meta"]["md5"] = spark.end();
        //options["meta"]["md5"] = require('./crypto').md5sum(content,0,'hex');
        return doPromise(content);
    });
    function doPromise(content){
        //register
        return self.registerDocument(options).then(function(){
            //upload
            var bos_config = JSON.parse(JSON.stringify(self._config));
            bos_config["endpoint"] = self._bosEndpoint;
            bos_client = new BosClient(bos_config);

            return bos_client.putObjectFromBlob(self._bucket, self._object, file).then(function(){
                return self.publishDocument();
            });
        })
    };
};

DocClient.prototype.registerDocument = function(options) {
    var self = this;
    var url = self._buildUrl();
    return self.sendRequest('POST', url, {
        params:{register:''},
        body: JSON.stringify(options)
    }).then(function (response) {
        self._documentId = response.body.documentId;
        self._bucket = response.body.bucket;
        self._object = response.body.object;
        self._bosEndpoint = response.body.bosEndpoint;
        return response;
    });
};

DocClient.prototype.publishDocument = function() {
    var self = this;
    var url = self._buildUrl();
    url =url + "/"+self._documentId;
    return self.sendRequest('PUT', url, {
        params:{publish:''}
    }).then(function (response) {
        return response;
    });
};

// --- E   N   D ---

DocClient.prototype.sendRequest = function (httpMethod, resource, varArgs) {
    var defaultArgs = {
        body: null,
        headers: {},
        params: {},
        config: {}
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

//exports.DocClient = DocClient;
module.exports = DocClient;






/* vim: set ts=4 sw=4 sts=4 tw=120: */
