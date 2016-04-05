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

var util = require('util');
var path = require('path');
var fs = require('fs');

var Q = require('q');
var u = require('underscore');
var expect = require('expect.js');
var debug = require('debug')('ocr_client.spec');

var config = require('../config');
var crypto = require('../../src/crypto');
var OCRClient = require('../..').OCRClient;
var helper = require('./helper');

describe('OCRClient', function () {
    var client;
    var fail;

    this.timeout(10 * 60 * 1000);

    beforeEach(function () {
        fail = helper.fail(this);
        client = new OCRClient(config.ocr);
    });

    it('ok', function () {});

    it('allText', function () {
        var data = fs.readFileSync(path.join(__dirname, 'ocr_client.allText.png'));
        return client.allText(data)
            .then(function (response) {
                debug('%j', response);
                expect(response.body).to.eql({
                    results: [
                        {rectangle: {left: 39, top: 11, width: 38, height: 13}, word: '  王保清'},
                        {rectangle: {left: 60, top: 39, width: 158, height: 15}, word: '  成'},
                        {rectangle: {left: 305, top: 39, width: 202, height: 15}, word: 'e的分流配置、各种网络状态的访问时，'},
                        {rectangle: {left: 60, top: 56, width: 51, height: 16}, word: '  长出问题'}
                    ]
                });
            });
    });

    it('oneLine', function () {
        var data = fs.readFileSync(path.join(__dirname, 'ocr_client.oneLine.png'));
        return client.oneLine(data)
            .then(function (response) {
                debug('%j', response);
                expect(response.body).to.eql({
                    results: [
                        {
                            rectangle: {left: 0, top: 0, width: 1071, height: 29},
                            word: '尊敬的用户:7月7日9月30日,免费试用百度多媒体服务并参与答题即可获赠300GBCDN流量+300GBBOS空间'
                        }
                    ]
                });
            });
    });

    it('singleCharacter', function () {
        var data = fs.readFileSync(path.join(__dirname, 'ocr_client.singleCharacter.png'));
        return client.singleCharacter(data)
            .then(function (response) {
                debug('%j', response);
                expect(response.body).to.eql({
                    "results": [
                        {"word":"图", "confidence":0.999907},
                        {"word":"圈", "confidence":0.000059},
                        {"word":"囹", "confidence":0.000018},
                        {"word":"圆", "confidence":0.00001},
                        {"word":"圄", "confidence":0.000002}
                    ]
                });
            });
    });
});















/* vim: set ts=4 sw=4 sts=4 tw=120: */
