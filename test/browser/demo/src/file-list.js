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
    require('etpl/tpl!./tpl/list-bcs-buckets.tpl');
    require('etpl/tpl!./tpl/list-bcs-objects.tpl');

    var etpl = require('etpl');
    var sdk = require('baidubce-sdk');
    var u = require('underscore');
    var async = require('async');

    var log = require('./log');
    var acl = require('./acl');
    var lru = require('./lru');
    var config = require('./config');
    var router = require('./router');
    var Klient = require('./client');
    var kPageCount = 10;

    var exports = {};

    function renderBody(templateName, data) {
        var html = etpl.render(templateName, data);
        $('#dropzone').html(html);
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

    function attachFileType(body) {
        (body.contents || []).forEach(function (row) {
            row.isImage = /\.(je?pg|png|gif|bmp|webp)$/i.test(row.key);
        });

        return body;
    }

    var working = false;
    function loadDirectory() {
        if (working) {
            return;
        }
        working = true;

        var client = Klient.createInstance();
        if (router.getPath().length > 2) {
            // listObjects
            var options = getOptions();
            var bucketName = options.bucketName;
            delete options.bucketName;
            if (bucketName) {
                client.listObjects(bucketName, options)
                    .then(function (res) {
                        if (res.body.object_list) {
                            renderBody('TPL_list_bcs_objects', res.body);
                            res.body.isTruncated = (res.body.object_total >= res.body.limit);
                            if (res.body.isTruncated) {
                                var button = $('.file-list tfoot button');
                                var start = parseInt(button.data('next-marker'), 10);
                                if (isNaN(start)) {
                                    start = 0;
                                }
                                res.body.nextMarker = start + res.body.object_total;
                            }
                        }
                        else {
                            stripPrefix(res);
                            attachFileType(res.body);
                            renderBody('TPL_list_objects', res.body);
                        }

                        var button = $('.file-list tfoot button');
                        if (res.body.isTruncated) {
                            button.parents('tfoot').show();
                            button.data('next-marker', res.body.nextMarker);
                        }
                        else {
                            button.parents('tfoot').hide();
                        }
                    })
                    .catch(function (error) {
                        log.exception(error);
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

                var tpl = null;
                var buckets = null;
                var deferred = sdk.Q.defer();

                if (u.isArray(res.body)) {
                    tpl = 'TPL_list_bcs_buckets';
                    buckets = res.body;
                    deferred.resolve({tpl: tpl, buckets: buckets});
                }
                else {
                    tpl = 'TPL_list_buckets';
                    buckets = res.body.buckets;
                    async.mapLimit(buckets, 2,
                        function (bucket, callback) {
                            bucket.is_dir = true;
                            var aclKey = 'bos:bucket:acl:' + bucket.name;
                            var bucketAcl = lru.get(aclKey);
                            if (bucketAcl) {
                                bucket.acl = bucketAcl;
                                callback(null, bucket);
                            }
                            else {
                                client.getBucketAcl(bucket.name)
                                    .then(function (res) {
                                        bucket.acl = acl.getAcl(res.body.accessControlList);
                                        lru.set(aclKey, bucket.acl);
                                        callback(null, bucket);
                                    })
                                    .catch(function (err) {
                                        callback(null, bucket);
                                    });
                            }
                        },
                        function (_, results) {
                            deferred.resolve({tpl: tpl, buckets: results});
                        });
                }

                return deferred.promise;
            })
            .then(function (rv) {
                renderBody(rv.tpl, {rows: rv.buckets});
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
        if (u.isNumber(parseInt(nextMarker, 10))) {
            // bcs 用 start
            options.start = nextMarker;
        }
        else {
            // bos 用 marker
            options.marker = nextMarker;
        }
        if (bucketName) {
            var client = Klient.createInstance();
            client.listObjects(bucketName, options)
                .then(function (res) {
                    var html;
                    if (res.body.object_list) {
                        html = etpl.render('TPL_list_bcs_objects', res.body);
                        res.body.isTruncated = (res.body.object_total >= res.body.limit);
                        if (res.body.isTruncated) {
                            var start = parseInt(button.data('next-marker'), 10);
                            if (isNaN(start)) {
                                start = 0;
                            }
                            res.body.nextMarker = start + res.body.object_total;
                        }
                    }
                    else if (res.body.contents.length
                        || res.body.commonPrefixes.length) {
                        stripPrefix(res);
                        attachFileType(res.body);
                        html = etpl.render('TPL_list_objects', res.body);
                    }

                    if (html) {
                        $('.file-list tbody').append(html);
                    }

                    if (res.body.isTruncated) {
                        button.parents('tfoot').show();
                        button.data('next-marker', res.body.nextMarker);
                    }
                    else {
                        button.parents('tfoot').hide();
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
                var aclKey = 'bos:bucket:acl:' + bucketName;
                lru.set(aclKey, null);
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

    exports.enter = function (context) {
        loadDirectory();
    };

    exports.leave = function () {
    };

    exports.init = function () {
        router.register('!bos', exports);

        $('#dropzone').on('click', '.file-list .load-more button', loadMoreObjects);
        $('#dropzone').on('click', '.file-list .fa-trash-o', deleteObjects);
        $('#refreshList').click(loadDirectory);
        $(document).on('click', '.dropdown-menu li[data-acl]', setBucketAccess);
    };

    return exports;
});











/* vim: set ts=4 sw=4 sts=4 tw=120: */
