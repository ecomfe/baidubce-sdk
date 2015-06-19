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
 * @file demo/src/file-list.js
 * @author leeight
 */

define(function (require) {
    require('etpl/tpl!./tpl/list-buckets.tpl');
    require('etpl/tpl!./tpl/list-objects.tpl');

    var etpl = require('etpl');
    var sdk = require('baidubce-sdk');
    var u = require('underscore');
    var async = require('async');

    var log = require('./log');
    var acl = require('./acl');
    var config = require('./config');
    var Klient = require('./client');
    var kPageCount = 10;

    var exports = {};

    function renderBody(templateName, data) {
        var html = etpl.render(templateName, data);
        $('.file-list tbody').html(html);
    }

    function getOptions() {
        var options = u.extend({
            maxKeys: kPageCount,
            marker: '',
            delimiter: '/'
        }, config.getOptions());

        return options;
    }

    function stripPrefix(res) {
        if (res.body.prefix) {
            u.each(res.body.contents, function (item) {
                item.key = item.key.replace(res.body.prefix, '');
            });
            res.body.contents = u.filter(res.body.contents, function (item) {
                return !!item.key;
            });
            u.each(res.body.commonPrefixes, function (item) {
                item.prefix = item.prefix.replace(res.body.prefix, '');
            });
        }
    }

    var working = false;
    function loadDirectory() {
        if (working) {
            return;
        }
        working = true;

        var client = Klient.createInstance();
        if (location.hash.length > 2) {
            // listObjects
            var options = getOptions();
            var bucketName = options.bucketName;
            delete options.bucketName;
            if (bucketName) {
                client.listObjects(bucketName, options)
                    .then(function (res) {
                        stripPrefix(res);
                        renderBody('TPL_list_objects', res.body);
                        var button = $('.file-list tfoot button');
                        if (res.body.isTruncated) {
                            button.parents('tfoot').show();
                            button.data('next-marker', res.body.nextMarker);
                        }
                        else {
                            button.parents('tfoot').hide();
                        }
                    })
                    .fin(function () {
                        working = false;
                    });
                return;
            }
        }


        // listBuckets
        client.listBuckets()
            .then(function (res) {
                var button = $('.file-list tfoot button');
                button.parents('tfoot').hide();

                var buckets = res.body.buckets;
                var deferred = sdk.Q.defer();
                async.mapLimit(buckets, 2,
                    function (bucket, callback) {
                        bucket.is_dir = true;
                        client.getBucketAcl(bucket.name)
                            .then(function (res) {
                                bucket.acl = acl.getAcl(res.body.accessControlList);
                                callback(null, bucket);
                            })
                            .catch(function (err) {
                                callback(null, bucket);
                            });
                    },
                    function (_, results) {
                        deferred.resolve(results);
                    });

                return deferred.promise;
            })
            .then(function (buckets) {
                renderBody('TPL_list_buckets', {rows: buckets});
            })
            .catch(function (error) {
                log.exception(error);
            })
            .fin(function () {
                working = false;
            });
    }

    // FIXME(leeight) listObjects 存在一个BUG， uploader/app.js 返回的不太正常.
    function loadMoreObjects(e) {
        var button = $(this);
        var nextMarker = button.data('next-marker');

        // listObjects
        var options = getOptions();
        var bucketName = options.bucketName;
        delete options.bucketName;
        options.marker = nextMarker;
        if (bucketName) {
            var client = Klient.createInstance();
            client.listObjects(bucketName, options)
                .then(function (res) {
                    if (res.body.contents.length
                        || res.body.commonPrefixes.length) {
                        stripPrefix(res);
                        var html = etpl.render('TPL_list_objects', res.body);
                        $('.file-list tbody').append(html);
                    }

                    if (!res.body.isTruncated) {
                        // 隐藏按钮
                        button.parents('tfoot').hide();
                    }
                    else {
                        // 有内容 并且 isTruncated === true
                        button.data('next-marker', res.body.nextMarker);
                    }
                });
        }
    }

    function deleteObjects(e) {
        var row = $(this).parents('tr');
        var bucketName = $(this).data('bucket');
        var key = $(this).data('key');
        var client = Klient.createInstance();
        client.deleteObject(bucketName, '' + key)
            .then(function (res) {
                row.remove();
            });
    }

    function setBucketAccess(e) {
        // console.log(e);
        var acl = $(this).data('acl');
        var bucketName = $(this).parent().data('bucket-name');
        var client = Klient.createInstance();
        client.setBucketCannedAcl(bucketName, acl)
            .then(function (response) {
                log.ok('成功设置『' + bucketName + '』访问权限为『' + acl + '』');
                loadDirectory();
            })
            .catch(function (error) {
                log.exception(error);
            });
    }

    exports.refresh = function () {
        loadDirectory();
    };

    exports.init = function () {
        loadDirectory();
        $(window).on('hashchange', loadDirectory);
        $('.file-list').on('click', '.load-more button', loadMoreObjects);
        $('.file-list').on('click', '.fa-trash-o', deleteObjects);
        $(document).on('click', '.dropdown-menu li[data-acl]', setBucketAccess);
    };

    return exports;
});











/* vim: set ts=4 sw=4 sts=4 tw=120: */
