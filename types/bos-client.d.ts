/**
 * Copyright (c) 2020 Baidu Inc. All Rights Reserved
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file bos-client.d.ts
 * @author 木休大人 (zhanghao25@baidu.com)
 */

/// <reference path="bce-config.d.ts" />
/// <reference path="http-client.d.ts" />

declare namespace BaiduBce.SDK {
    type BosEndpoint = 'https://bj.bcebos.com' | 'https://gz.bcebos.com'
        | 'https://gz.bcebos.com' | 'https://hkg.bcebos.com'
        | 'https://su.bcebos.com' | 'https://fsh.bcebos.com'
        | 'https://bd.bcebos.com' | 'https://fwh.bcebos.com';

    enum BucketAcl {
        Private = 'private',
        PublicRead = 'public-read',
        PublicReadWrite = 'public-read-write'
    }
    enum BucketPermission {
        FULL_CONTROL = "FULL_CONTROL",
        READ = "READ",
        WRITE = "WRITE",
        LIST = "LIST",
        MODIFY = "MODIFY",
        GetObject = "GetObject",
        PutObject = "PutObject",
        DeleteObject = "DeleteObject",
        RestoreObject = "RestoreObject"
    }

    type BosResponse<TBody = any, THeader = {}> = PromiseResult<
        TBody, THeader & HttpResponseHeaders & { server: "BceBos" }
    >

    type Owner = { id: string, displayName: string }
    enum StorageCategory {
        /** 标准存储类型 */
        STANDARD = "STANDARD",
        /** 低频存储 */
        STANDARD_IA = "STANDARD_IA",
        /** 归档存储 */
        ARCHIVE = "ARCHIVE",
        /** 冷存储 */
        COLD = "COLD"
    }

    type ObjectKey = { eTag: string, key: string, lastModified: string, owner: Owner, size: number, storageClass: StorageCategory }
    type ListObjectOptions = { delimiter: string, marker: string, maxKeys: number, prefix: string }

    type BucketReplicationData = {
        id: string,
        status: "enabled" | "disable",
        resource: Array<string>,
        replicateDeletes: "enabled" | "disable",
        destination: { bucket: string, storageClass: StorageCategory },
        replicateHistory: { bucket: string, storageClass: StorageCategory }
    }

    type BucketLifecycle = {
        rule: Array<{
            id: string,
            status: "enabled" | "disabled",
            resource: Array<string>,
            condition: {
                time: { dateGreaterThan: UTCDateString }
            },
            action: { name: BucketPermission },
            storageClass: StorageCategory
        }>
    }

    type BucketCorsData = {
        corsConfiguration: Array<{
            allowedOrigins: Array<string>,
            allowedMethods: Array<"GET" | "POST" | "HEAD" | "PUT" | "DELETE">
            allowedHeaders: Array<string>,
            allowedExposeHeaders: Array<string>,
            maxAgeSeconds: number
        }>
    }

    /** 🦦百度智能云 `BOS` 服务客户端 */
    class BosClient {
        constructor(options: { endpoint: BosEndpoint } & Credentials);

        /*************************************************************************************
         *                                  📦Bucket 操作相关接口
         *************************************************************************************/

        /**
         * `📦Bucket 操作接口`: 列举请求者拥有的所有bucket。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#listbuckets%E6%8E%A5%E5%8F%A3)
         */
        listBuckets(): BosResponse<{
            owner: Owner,
            buckets: Array<{ name: string, location: Region, creationDate: string }>
        }>;

        /**
         * `📦Bucket 操作接口`: 获取Bucket所在的区域。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketlocation%E6%8E%A5%E5%8F%A3)
         */
        getBucketLocation(): BosResponse<{ locationConstraint: Region }>;

        /**
         * `📦Bucket 操作接口`: 此命令用于创建Bucket。每一个用户只允许创建100个Bucket。创建的Bucket其权限默认为private，即Bucket Owner获得FULL_CONTROL，其他人没有任何权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketlocation%E6%8E%A5%E5%8F%A3)
         */
        putBucket(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: `putBucket` alias
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketlocation%E6%8E%A5%E5%8F%A3)
         */
        createBucket(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用于查看Bucket是否存在和请求者是否有权限访问这个Bucket。当请求返还200 OK时，说明Bucket存在且请求者有权限访问。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#headbucket%E6%8E%A5%E5%8F%A3)
         */
        headBucket(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用于删除一个Bucket。在删除前需要保证此Bucket下的所有Object和未完成的三步上传Part已经已被删除，否则会删除失败。
         *
         * ----
         *
         * **🚨说明：**
         *
         * - 删除Bucket之前确认该Bucket没有开通跨区域复制，不是跨区域复制规则中的源Bucket或目标Bucket，否则不能删除.
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#headbucket%E6%8E%A5%E5%8F%A3)
         */
        deleteBucket(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用于设置Bucket的访问权限。目前BOS支持两种方式设置ACL。第一种是使用CannedAcl，在PutBucketAcl的时候，通过头域的“x-bce-acl"来设置，当前可设置的权限包括：private, public-read, public-read-write（大小写敏感）。第二种方式是上传一个ACL文件，文件格式参见 [ACL文件格式](https://cloud.baidu.com/doc/BOS/s/Tjwvysda9#%E4%B8%8A%E4%BC%A0acl%E6%96%87%E4%BB%B6%E6%96%B9%E5%BC%8F%E7%9A%84%E6%9D%83%E9%99%90%E6%8E%A7%E5%88%B6)。
         *
         * ----
         *
         * **🚨说明：**
         *
         * - BOS系统不支持在同一请求中，同时设置“x-bce-acl”和上传ACL文件。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#headbucket%E6%8E%A5%E5%8F%A3)
         */
        putBucketAcl(bucket: string, acl: BucketAcl): BosResponse;

        /**
         * `📦Bucket 操作接口`: `putBucketAcl` alias
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#headbucket%E6%8E%A5%E5%8F%A3)
         */
        setBucketAcl(bucket: string, acl: BucketAcl): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取某个Bucket的访问权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketacl%E6%8E%A5%E5%8F%A3)
         */
        getBucketAcl(bucket: string): BosResponse<{
            owner: Owner,
            accessControlList: Array<{
                grantee: Array<{ id: string }>
                permission: Array<BucketPermission>,
                condition: any,
                resource: Array<string>
            }>
        }>;

        /**
         * `📦Bucket 操作接口`: 此命令用来创建数据同步。该接口在status为disable时，可以重复调用；但如果已经成功创建一个数据同步，即put一个status为enable的Replication后，如果需要修改，则只能先调用DeleteBucketReplication接口后，再调用该接口进行重新put。
         *
         * ----
         *
         * **🚨说明：**
         *
         * - 用户必须是源Bucket的owner且拥有FULL_CONTROL权限，且是目标Bucket的owner。
         * - 目标Bucket和源Bucket必须存在。
         * - 目标Bucket和源Bucket可以是同region下的Bucket，也可以是不同Region下的Bucket。
         * - 目标Bucket和源Bucket都必须没有开通过replication,且没有成为别的数据同步规则中的目的Bucket。
         * - 整个配置的大小不能超过128k。
         * - 数据同步暂时不支持归档类型文件的同步，进行数据同步时会忽略归档类型文件。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketreplication%E6%8E%A5%E5%8F%A3)
         */
        putBucketReplication(bucket: string, data: BucketReplicationData): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取数据同步的Bucket信息，包括源Bucket名称、目的Bucket名称、存储类型、是否进行历史复制，数据同步策略等。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketreplication%E6%8E%A5%E5%8F%A3)
         */
        getBucketReplication(bucket: string): BosResponse<BucketReplicationData>;

        /**
         * `📦Bucket 操作接口`: 此命令用来删除数据同步复制配置。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketreplication%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketReplication(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取数据同步复制的进程状态。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketreplicationprogress%E6%8E%A5%E5%8F%A3)
         */
        getBucketReplicationProgress(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来开启Bucket的访问日志并指定存放日志的Bucket和访问日志的文件前缀。访问日志的规则请参见日志命名规则和日志格式。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketlogging%E6%8E%A5%E5%8F%A3)
         */
        putBucketLogging(bucket: string, data: { targetBucket: string, targetPrefix: string }): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取某个Bucket的访问日志配置情况。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketlogging%E6%8E%A5%E5%8F%A3)
         */
        getBucketLogging(bucket: string): BosResponse<{
            status: "enabled" | "disabled", targetBucket: string, targetPrefix: string
        }>;

        /**
         * `📦Bucket 操作接口`: 此命令用来关闭Bucket访问日志记录功能。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketlogging%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketLogging(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此接口用来创建生命周期管理规则。
         *
         * ----
         *
         * **🚨说明：**
         *
         * - 只有bucket的owner且拥有FULL_CONTROL权限才能够进行此请求。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketlifecycle%E6%8E%A5%E5%8F%A3)
         */
        putBucketLifecycle(bucket: string, data: BucketLifecycle): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此接口用于获取定义的生命周期管理规则详细信息。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketlifecycle%E6%8E%A5%E5%8F%A3)
         */
        getBucketLifecycle(bucket: string): BosResponse<{BucketLifecycle}>;

        /**
         * `📦Bucket 操作接口`: 此命令用来删除定义的生命周期管理规则。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketlifecycle%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketLifecycle(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来设置Bucket的默认存储类型。
         *
         * 如果用户使用API、CLI或者SDK上传的Object未指定存储类型，则继承Bucket的默认存储类型。如果上传Object指定的存储类型和Bucket默认存储类型不一致时，以Object的存储类型为准。存储类型包含标准存储、低频存储、冷存储和归档存储四种，具体使用场景和性能请参见分级存储。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketlifecycle%E6%8E%A5%E5%8F%A3)
         */
        putBucketStorageclass(bucket: string, storageClass: StorageCategory): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取Bucket的默认存储类型。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketstorageclass%E6%8E%A5%E5%8F%A3)
         */
        getBucketStorageClass(bucket: string): BosResponse<StorageCategory>;

        /**
         * `📦Bucket 操作接口`: 开启指定Bucket的加密开关。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketencryption%E6%8E%A5%E5%8F%A3)
         */
        putBucketEncryption(bucket: string, encryptionAlgorithm: "AES256"): BosResponse;

        /**
         * `📦Bucket 操作接口`: 获取Bucket服务端加密是否打开。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketencryption%E6%8E%A5%E5%8F%A3)
         */
        getBucketEncryption(bucket: string): BosResponse<{encryptionAlgorithm: "AES256"}>;

        /**
         * `📦Bucket 操作接口`: 关闭服务端加密功能。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketencryption%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketEncryption(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 用于设置静态网站托管。
         *
         * 用户必须对bucket具有full control 权限。不建议设置归档文件，归档文件没有取回时不可读，StaticWebsite此时不会生效。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketstaticwebsite)
         */
        putBucketStaticWebsite(bucket: string, data: {index: string, notFound: string}): BosResponse;

        /**
         * `📦Bucket 操作接口`: 获取bucket的静态网站托管信息
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketstaticwebsite)
         */
        getBucketStaticWebsite(bucket: string): BosResponse<{index: string, notFound: string}>;

        /**
         * `📦Bucket 操作接口`: 删除bucket设置的静态网站托管信息，并关闭此bucket的静态网站托管。
         *
         * 用户必须对bucket具有 FULL_CONTROL 权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketstaticwebsite)
         */
        deleteBucketStaticWebsite(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 开通Bucket Trash功能，用户必须是源Bucket的owner且拥有FULL_CONTROL权限，且是目标Bucket的owner。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbuckettrash%E6%8E%A5%E5%8F%A3)
         */
        putBucketTrash(bucket: string, trashDir: ".trash"): BosResponse;

        /**
         * `📦Bucket 操作接口`: 获取Bucket Trash开通状态，返回当前trash目录名，默认为.trash。用户必须是源Bucket的owner且拥有FULL_CONTROL权限，且是目标Bucket的owner。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbuckettrash%E6%8E%A5%E5%8F%A3)
         */
        getBucketTrash(bucket: string): BosResponse<{trashDir: string}>;

        /**
         * `📦Bucket 操作接口`: 关闭trash功能，用户必须是源Bucket的owner且拥有FULL_CONTROL权限，且是目标Bucket的owner。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebuckettrash%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketTrash(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: PutBucketCors操作用来在指定的Bucket上设定一个跨域资源共享（CORS）的规则，如果原规则存在则覆盖原规则。
         *
         * ----
         *
         * **权限说明**
         *
         * 只有Bucket的所有者和被授予FULL_CONTROL权限的用户才能设置Bucket的CORS。没有权限时，返回403 Forbidden错误，错误码：AccessDenied。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketcors%E6%8E%A5%E5%8F%A3)
         */
        putBucketCors(bucket: string, data: BucketCorsData): BosResponse;

        /**
         * `📦Bucket 操作接口`: GetBucketCors操作用于获取指定的Bucket当前的CORS规则。
         *
         * ----
         *
         * **权限说明**
         *
         * 只有Bucket的所有者和被授予FULL_CONTROL权限的用户才能设置Bucket的CORS。没有权限时，返回403 Forbidden错误，错误码： AccessDenied。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getbucketcors%E6%8E%A5%E5%8F%A3)
         */
        getBucketCors(bucket: string): BosResponse<BucketCorsData>;

        /**
         * `📦Bucket 操作接口`: DeleteBucketCors用于关闭指定Bucket的CORS功能并清空所有规则。
         *
         * ----
         *
         * **权限说明**
         *
         * 只有Bucket的所有者和被授予FULL_CONTROL权限的用户才有权限删除CORS规则。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletebucketcors%E6%8E%A5%E5%8F%A3)
         */
        deleteBucketCors(bucket: string): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来开启Bucket的原图保护功能，并指定resource字段，表示生效的资源范围。 对于开通原图保护的文件，不允许匿名下载访问该文件，或带自定义图片处理参数访问，只允许使用style样式访问或携带合法签名访问。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putbucketcopyrightprotection%E6%8E%A5%E5%8F%A3)
         */
        putBucketCopyrightProtection(bucket: string, data: {resource: Array<string>}): BosResponse;

        /**
         * `📦Bucket 操作接口`: 此命令用来获取某个Bucket的原图保护配置情况。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getcopyrightprotection%E6%8E%A5%E5%8F%A3)
         */
        getCopyrightProtection(bucket: string): BosResponse<{resource: Array<string>}>;

        /**
         * `📦Bucket 操作接口`: 此命令用来关闭Bucket原图保护功能。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletecopyrightprotection%E6%8E%A5%E5%8F%A3)
         */
        deleteCopyrightProtection(bucket: string): BosResponse;

        /*************************************************************************************
         *                              💨Bucket 事件通知相关接口
         *************************************************************************************/

        /**
         * `💨Bucket 事件通知接口`: 指定bucket上增加通知规则。
         *
         * ----
         *
         * **🚨注意**
         *
         * - 只有bucket owner或者full control权限才能获取这个bucket的配置。
         * - 如果不是bucket owner则返回403，如果对应的文件不存在则返回404。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#putnotification%E6%8E%A5%E5%8F%A3)
         */
        putNotification(): BosResponse;

        /**
         * `💨Bucket 事件通知接口`: 获取指定bucket上的通知规则。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getnotification%E6%8E%A5%E5%8F%A3)
         */
        getNotification(): BosResponse;

        /**
         * `💨Bucket 事件通知接口`: 删除指定bucket上的通知规则。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#deletenotification)
         */
        deleteNotification(): BosResponse;

        /**
         * `💨Bucket 事件通知接口`: 将事件消息推送到配置的url上
         *
         * ----
         *
         * **🚨注意**
         *
         * - Status Code: 200 OK才会认为消息推送成功，否则将会重试；
         * - 对于过载保护的情况，支持Status Code: 429 Too Many Requests返回值，会间隔一段时间再重试；
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#postevent%E6%8E%A5%E5%8F%A3)
         */
        postEvent(): BosResponse;

        /**
         * `💨Bucket 事件通知接口`: 将ImageOcr和ImageClassify两种产品处理后的事件消息推送到app设置的url上，内容包含BOS的事件信息和AI处理的结果。
         *
         * 如果规则中配置了encryption字段，那么请求中会包含Authorization的签名，保证消息不会被伪造或篡改。
         *
         * ----
         *
         * **🚨注意**
         *
         * - Status Code: 200 OK才会认为消息推送成功，否则将会重试；
         * - 对于过载保护的情况，支持Status Code: 429 Too Many Requests返回值，会间隔一段时间再重试；
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#getnotification%E6%8E%A5%E5%8F%A3)
         */
        postResult(): BosResponse;


        /*************************************************************************************
         *                              📑Object 操作相关接口
         *************************************************************************************/

        /**
         * `📑Object 操作相关接口`: 此命令用于获得指定Bucket的Object信息列表。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/4jwvysf0k#listobjects%E6%8E%A5%E5%8F%A3)
         */
        listObjects(bucket: string, options?: Partial<ListObjectOptions>): BosResponse<
            Omit<ListObjectOptions, "delimiter"> & { name: string, isTruncated: boolean, contents: Array<ObjectKey> }
        >

        /**
         * `📑Object 操作相关接口`: 此接口用于向指定的Bucket上传一个文件，请求者必须具有Write权限。在PutObject前需要确保对应的Bucket已经存在，BOS支持Object文件的长度范围是0Byte-5GB。如果需要上传大于5GB的文件，请参考分块上传。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#putobject%E6%8E%A5%E5%8F%A3)
         */
        putObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此接口使用HTML表单上传文件到指定bucket，用于实现通过浏览器上传文件到bucket。在PutObject操作中通过HTTP请求头传递参数，在PostObject操作中使用消息实体中的表单域传递参数，其中消息实体使用多重表单格式（multipart/form-data）编码。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#postobject%E6%8E%A5%E5%8F%A3)
         */
        postObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此接口用于把一个已经存在的Object拷贝为另外一个Object，支持Object文件的长度范围是0Byte-5GB。该接口也可以用来实现Meta更新（使用replace模式且源和目标指向同一个文件）。此接口需要请求者在header中指定拷贝源。
         *
         * CopyObject接口支持跨区域文件复制，即复制文件所在的源Bucket和目标Bucket可以不在同一region(目前只支持从其它Region向本Region复制数据)。当进行跨区域文件复制时，复制产生的流量会收取跨区域流量费。跨区域收费标准参见产品定价。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#copyobject%E6%8E%A5%E5%8F%A3)
         */
        copyObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用于从BOS获取某个Object。此操作需要请求者对该Object有读权限。请求者可以在Header中设置Range来指定需要获取的Object数据的范围。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#getobject%E6%8E%A5%E5%8F%A3)
         */
        getObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用于获取某个Object的Meta信息，但此时并不返回数据。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#getobjectmeta%E6%8E%A5%E5%8F%A3)
         */
        getObjectMeta(): BosResponse;

        /**
         * `📑Object 操作相关接口`: RestoreObject用于取回归档存储文件，请求者必须有归档存储文件的读权限，并且归档存储文件处于冰冻状态。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#restoreobject%E6%8E%A5%E5%8F%A3)
         */
        restoreObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此接口用于向Bucket中指定object执行SQL语句，选取出指定内容返回。请求者必须对选取的object具有read权限。在SelectObject前需要确保对应的Bucket和Object已经存在，详细信息参考SelectObject接口选取对象。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#selectobject%E6%8E%A5%E5%8F%A3)
         */
        selectObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此接口用于从指定URL抓取资源，并将资源存储到指定的Bucket中。此操作需要请求者对该Bucket有写权限，每次只能抓取一个Object，且用户可以自定义Object的名称。
         *
         * ----
         *
         * **🚨注意**
         *
         * - FetchObject接口抓取资源的大小限制为0~10GB。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#fetchobject%E6%8E%A5%E5%8F%A3)
         */
        fetchObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: AppendObject以追加写的方式上传文件。通过AppendObject操作创建的Object类型为Appendable Object，可以对该Object追加数据；而通过PutObject上传的Object是Normal Object，不可进行数据追加写。
         *
         * ----
         *
         * **🚨注意**
         *
         * - Appendable Object大小限制为0~5G
         * - AppendObject接口在进行追加写时要求对该Object有写权限
         * - 归档类型对象暂时不支持AppendObject。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#appendobject%E6%8E%A5%E5%8F%A3)
         */
        appendObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用于删除指定Bucket的一个Object，要求请求者对此Object有写权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#deleteobject%E6%8E%A5%E5%8F%A3)
         */
        deleteObject(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 该命令可以实现通过一个HTTP请求删除同一个Bucket下的多个Object。
         *
         * ----
         *
         * **🚨注意**
         *
         * - 支持一次请求内最多删除1000个Object。
         * - 消息体（body）不超过2M。
         * - 返回的消息体中只包含删除过程中出错的Object结果；如果所有Object都删除都成功的话，则没有消息体。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#deletemultipleobjects%E6%8E%A5%E5%8F%A3)
         */
        deleteMultipleObjects(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用来获取某个Object的访问权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#getobjectacl%E6%8E%A5%E5%8F%A3)
         */
        getObjectAcl(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用于设置Object的访问权限。目前BOS支持两种方式设置ACL。第一种是使用Canned Acl，在PutObjectAcl的时候，通过头域的"x-bce-acl"或者"x-bce-grant-permission'来设置object访问权限，当前可设置的权限包括private和public-read，两种类型的header不可以同时在一个请求中出现。第二种方式是上传一个ACL文件，文件格式参见ACL文件格式，目前ACL文件只支持accessControlList，grantee，id，permission字段。
         *
         * ----
         *
         * **🚨注意**
         *
         * - 目前不支持在同一请求中同时设置canned acl和上传ACL文件。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#putobjectacl%E6%8E%A5%E5%8F%A3)
         */
        putObjectAcl(): BosResponse;

        /**
         * `📑Object 操作相关接口`: 此命令用来删除某个Object的访问权限。
         *
         * [更多文档](https://cloud.baidu.com/doc/BOS/s/qjwvyseos#deleteobjectacl%E6%8E%A5%E5%8F%A3)
         */
        deleteObjectAcl(): BosResponse;
    }
}
