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
 * @file test/sdk/vod_client_media.spec.js
 * @author leeight
 */

var path = require('path');

var Q = require('q');
var u = require('underscore');
var debug = require('debug')('vod_client_media.spec');
var expect = require('expect.js');

var config = require('../config');
var helper = require('./helper');
var STS = require('../../').STS;
var Media = require('../../src/vod/Media');
var Player = require('../../src/vod/Player');
var PresetGroup = require('../../src/vod/PresetGroup');
var StrategyGroup = require('../../src/vod/StrategyGroup');
var Notification= require('../../src/vod/Notification');
var BosClient = require('../..').BosClient;

var MediaStatus = {
    PUBLISHED: 'PUBLISHED',
    FAILED: 'FAILED',
    RUNNING: 'RUNNING',
    DISABLED: 'DISABLED',
    BANNED: 'BANNED',
    PROCESSING: 'PROCESSING'
};

describe('VodClient', function () {
    var mediaId = null;

    this.timeout(10 * 60 * 1000);

    function waitingStatus(client, opt_status) {
        return function () {
            var status = opt_status || 'RUNNING';
            return client.get().then(function (response) {
                if (response.body.status === status) {
                    throw '$continue';
                }
            });
        };
    }

describe('Media', function () {
    it('apply && upload && process', function () {
        mediaId = null;

        var client = new Media(config.vod);
        return client.apply()
            .then(function (response) {
                debug(response);
                expect(response.body.mediaId).not.to.be(undefined);
                expect(response.body.sourceBucket).not.to.be(undefined);
                expect(response.body.sourceKey).not.to.be(undefined);
                expect(response.body.host).not.to.be(undefined);
                var bos = new BosClient({
                    endpoint: 'http://' + response.body.host,
                    credentials: {
                        ak: config.vod.credentials.ak,
                        sk: config.vod.credentials.sk
                    }
                });
                return bos.putObjectFromFile(response.body.sourceBucket, response.body.sourceKey,
                    path.join(__dirname, 'vod_client_media.mp4'));
            })
            .then(function (response) {
                debug(response);
                return client.process('6s视频', {
                    description: '来自 https://www.youtube.com/watch?v=UGskRF-cztw'
                });
            })
            .then(function (response) {
                debug(response);
                expect(client._mediaId).to.be(response.body.mediaId);

                // 等待发布状态的处理
                return helper.loop(600, 10, waitingStatus(client));
            }).then(function () {
                mediaId = client._mediaId;
            });
    });

    it('disable & resume', function () {
        expect(mediaId).not.to.be(null);

        var client = new Media(config.vod);
        return client.setMediaId(mediaId).disable()
            .then(function (response) {
                debug(response);
                // 调用了 disable 或者 resume 之后，有一个中间的状态 PROCESSING
                return helper.loop(600, 10, waitingStatus(client, 'PROCESSING'));
            })
            .then(function () {
                return client.get();
            })
            .then(function (response) {
                debug(response);
                expect(response.body.status).to.eql('DISABLED');
                return client.resume();
            })
            .then(function () {
                return helper.loop(600, 10, waitingStatus(client, 'PROCESSING'));
            })
            .then(function (response) {
                return client.get();
            })
            .then(function (response) {
                debug(response);
                expect(response.body.status).to.eql('PUBLISHED');
            });
    });

    it('get && update', function () {
        expect(mediaId).not.to.be(null);

        var client = new Media(config.vod);
        return client.setMediaId(mediaId).get().then(function (response) {
            debug(response);
            expect(response.body.attributes).not.to.be(undefined);

            var attributes = response.body.attributes;
            expect(attributes.title).to.be('6s视频');
            expect(attributes.description).to.be('来自 https://www.youtube.com/watch?v=UGskRF-cztw');

            return client.update('6s视频(2)', '这里是描述');
        }).then(function (response) {
            debug(response);
            return client.get();
        }).then(function (response) {
            debug(response);
            var attributes = response.body.attributes;
            expect(attributes.title).to.be('6s视频(2)');
            expect(attributes.description).to.be('这里是描述');
        });
    });

    it('list with pageSize & pageNo', function () {
        var client = new Media(config.vod);
        return client.list({pageSize: 2}).then(function (response) {
            debug(response);
            expect(response.body.media).to.be.an('array');
            expect(response.body.pageNo).to.be.a('number');
            expect(response.body.pageSize).to.be.a('number');
            expect(response.body.totalCount).to.be.a('number');
            expect(response.body.pageNo).to.be(1);
            expect(response.body.pageSize).to.be(2);

            return client.list({pageSize: 2, pageNo: 10});
        }).then(function (response) {
            debug(response);
            expect(response.body.media).to.eql([]);
        });
    });

    it('list with marker & maxSize', function () {
        var client = new Media(config.vod);

        return client.list({marker: '', maxSize: 2}).then(function (response) {
            debug(response);
            // media: [ [Object], [Object] ], isTruncated: true, nextMarker: 'mda-giikt65n049kme9c'
            expect(response.body.media).to.be.an('array');
            expect(response.body.isTruncated).to.be.a('boolean');
            expect(response.body.nextMarker).to.be.a('string');
        });
    });

    it('stat', function () {
        expect(mediaId).not.to.be(null);

        var client = new Media(config.vod);

        return client.setMediaId(mediaId).stat().then(function (response) {
            debug(response);
            expect(response.body.mediaId).to.eql(mediaId);
            expect(response.body.startTime).to.be.a('string');
            expect(response.body.endTime).to.be.a('string');
            expect(response.body.aggregate).to.be.a('object');

            return client.stat({aggregate: false});
        }).then(function (response) {
            debug(response);
            expect(response.body.mediaId).to.eql(mediaId);
            expect(response.body.startTime).to.be.a('string');
            expect(response.body.endTime).to.be.a('string');
            expect(response.body.statistics).to.be.an('array');
        });
    });

    it('remove', function () {
        expect(mediaId).not.to.be(null);

        var client = new Media(config.vod);

        return client.setMediaId(mediaId).remove().then(function (response) {
            debug(response);
        });
    });
});

describe('Player', function () {
    it('delivery', function () {
        var client = new Player(config.vod);
        var mediaId = 'mda-gkrt6nyjt36r15e4';

        return client.setMediaId(mediaId).delivery().then(function (response) {
            debug(response);
            expect(response.body).to.eql({
                mediaId: 'mda-gkrt6nyjt36r15e4',
                title: 'vr_6.mp4',
                duration: 64,
                file: 'http://gfsckqubg70kpmwe7vr.exp.bcevod.com/mda-gkrt6nyjt36r15e4/mda-gkrt6nyjt36r15e4.m3u8',
                cover: 'http://gfsckqubg70kpmwe7vr.exp.bcevod.com/mda-gkrt6nyjt36r15e4/mda-gkrt6nyjt36r15e4.jpg'
            });
        });
    });

    it('code', function () {
        var client = new Player(config.vod);
        var mediaId = 'mda-gkrt6nyjt36r15e4';

        return client.setMediaId(mediaId).code({ak: '46bd9968a6194b4bbdf0341f2286ccce'}).then(function (response) {
            debug(response.body.codes);
            expect(response.body.codes).to.be.an('array');
            expect(response.body.codes[0].codeType).to.eql('html');
            expect(response.body.codes[1].codeType).to.eql('file');
            expect(response.body.codes[2].codeType).to.eql('cover');
        });
    });
});

describe('PresetGroup', function () {
    beforeEach(function () {
        var client = new PresetGroup(config.vod);

        return client.listAll().then(function (response) {
            var tasks = [];
            u.each(response.body.presetGroups, function (presetGroup) {
                // vod.inbuilt.adaptive.hls
                if (!/^vod\.inbuilt/.test(presetGroup.name)) {
                    tasks.push(client.remove(presetGroup.name));
                }
            });
            return Q.all(tasks);
        });
    });

    it('listAll', function () {
        var client = new PresetGroup(config.vod);

        return client.listAll().then(function (response) {
            debug(response);
            expect(response.body.presetGroups).to.be.an('array');

            var hlsPresent = response.body.presetGroups[0];
            expect(hlsPresent.name).to.eql('vod.inbuilt.adaptive.hls');
            expect(hlsPresent.transcodingPresets).to.eql([
                {
                    "name": "preference",
                    "container": "a-hls",
                    "video": {
                        "codecOptions": {
                            "profile": "high"
                        },
                        "maxWidthInPixel": 1920,
                        "maxHeightInPixel": 1080,
                        "bitRateInBps": 3500000
                    }
                }
            ]);
        });
    });

    it('create & get & update', function () {
        var client = new PresetGroup(config.vod);
        var presetGroupConfig = {
            name: 'hls_user',
            description: '模板组描述',
            preference: 'preset_1',
            transcodingPresets: [
                {
                    name: 'preset_1',
                    container: 'a-hls',
                    video: {
                        codecOptions: {
                            profile: 'high'
                        },
                        maxWidthInPixel: 1920,
                        maxHeightInPixel: 1080,
                        bitRateInBps: 3500000
                    }
                }
            ]
        };

        return client.create(presetGroupConfig).then(function (response) {
            debug(response);
            return client.listAll();
        }).then(function (response) {
            debug(response.body.presetGroups);
            var presetGroup = u.find(response.body.presetGroups, function (item) {
                return item.name === 'hls_user';
            });
            expect(presetGroup).not.to.be(null);
            expect(presetGroup.description).to.eql('模板组描述');
            expect(presetGroup.preference).to.eql('preset_1');
            return client.get('hls_user');
        }).then(function (response) {
            debug(response);
            expect(response.body.name).to.eql('hls_user');
            response.body.description = 'presetgroup_description';
            return client.update('hls_user', response.body);
        }).then(function (response) {
            return client.get('hls_user');
        }).then(function (response) {
            debug(response);
            expect(response.body.name).to.eql('hls_user');
            expect(response.body.description).to.eql('presetgroup_description');
        });
    });
});

describe('StrategyGroup', function () {
    it('listAll & get', function () {
        var client = new StrategyGroup(config.vod);

        return client.listAll().then(function (response) {
            debug(response.body.strategyGroups);
            expect(response.body.strategyGroups).to.be.an('array');
            expect(response.body.strategyGroups[0].name).to.eql('default');
            return client.get('default');
        }).then(function (response) {
            debug(response);
            return client.update('default', {
                antiLeech: {
                    refer: {
                        whitelist: [],
                        blacklist: ['https://www.google.com']
                    },
                    ip: {
                        whitelist: ['8.8.8.8', '8.8.4.4/24'],
                        blacklist: []
                    }
                }
            });
        }).then(function (response) {
            return client.get('default');
        }).then(function (response) {
            expect(response.body.antiLeech.refer.blacklist).to.eql(['https://www.google.com']);
        });
    });
});

describe('Notification', function () {
    beforeEach(function () {
        var client = new Notification(config.vod);

        return client.listAll().then(function (response) {
            var tasks = u.map(response.body.notifications, function (item) {
                return client.remove(item.name);
            });
            return Q.all(tasks);
        });
    });

    it('listAll', function () {
        var client = new Notification(config.vod);

        return client.listAll().then(function (response) {
            debug(response);
            expect(response.body.notifications).to.be.an('array');
        });
    });

    it('create & get & remove', function () {
        var client = new Notification(config.vod);

        return client.create('default', 'http://www.baidu.com').then(function (response) {
            debug(response);
            return client.get('default');
        }).then(function (response) {
            debug(response);
            expect(response.body.endpoint).to.eql('http://www.baidu.com');
            expect(response.body.createTime).to.be.a('string');
            return client.remove('default');
        });
    });
});

xdescribe('STS access', function () {
    it('Media.list', function () {
        var sts = new STS(config.sts);
        return sts.getSessionToken(6000, {
            accessControlList: [
                {
                    service: 'bce:vod',
                    region: '*',
                    effect: 'Allow',
                    permission: ['WRITE', 'READ']
                }
            ]
        }).then(function (response) {
            debug(response);
        });
    });
});

});









