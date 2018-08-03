---
id: api-reference-tsdb
title: TSDB - api
layout: docs
category: API Reference
permalink: docs/api-reference-tsdb.html
---

[百度云时序数据库（Time Series Database，简称TSDB](https://cloud.baidu.com/product/tsdb.html)是一种存储和管理时间序列数据的专业化数据库，为时间序列的存储提供高性能读写、低成本存储、强计算能力和多生态支持的多种能力。

百度开放云目前开通了多区域支持，请参考[区域选择说明](https://bce.baidu.com/doc/Reference/Regions.html)。BOS 目前支持“华北-北京”和“华南-广州”两个区域。

TSDB API支持HTTP和HTTPS两种调用方式。为了提升数据的安全性，建议通过HTTPS调用。

Tsdb SDK 主要主要有两种类型的API，数据接口和管理接口。数据接口主要是对某个具体的数据库里的数据进行增、删、查看等；管理接口主要对数据库进行操作，包括增、删、查看等。用户需要根据具体需求创建不同的client。

## 创建TsdbClient

```js
import {TsdbDataClient} from 'bce-sdk-js'; 
const config = {
    endpoint: 'http(s)://{databaseName}.tsdb.iot.{region}.baidubce.com',
    credentials: {
         ak: '<AccessKeyID>',
         sk: '<SecretAccessKey>'
    }
};
// 初始化一个TsdbClient
const client = new TsdbDataClient(config);
```

## 写入操作
1、创建TsdbDataClient。
2、执行writeDatapoints()方法，您需要提供写入的数据的具体信息。
用户可以参考如下代码写入单域数据点：
```js
// 构建想要写入的datapoints
var datapoints = [
    {
        "metric": "cpu_idle",
        "field": "test",
        "tags": {
            "host": "server1",
            "rack": "rack1"
        },
        "timestamp": Math.round(new Date().getTime() / 1000),   // 用于生成时间戳
        "value": 51
    }
];
// 获取并返回结果
client.writeDatapoints(datapoints)
    .then(response => console.log(response))         // 获取成功
    .catch(error => console.error(error));           // 获取失败，并返回错误类型
```

这时，可在对应数据库，点击查询面板，在选项Metrics下出现一个新的metric。
对于同一个field，如果写入了某个数据类型的value之后，相同的field不允许写入其他数据类型。

## 查询操作

### 获取度量（metric）

基本流程：
1、创建TsdbDataClient。
2、执行getMetrics()方法。
如下代码可以获取metric列表：

```js
// 获取并打印Metric
client.getMetrics()
    .then(response => console.log(response.body))// 获取成功
    .catch(error => console.error(error));       // 获取失败，并返回错误类型
```

### 获取域（Field）

```js
var metricName = '<metricName>';
// 获取并打印Field
client.getFields('<metricName>')
    .then(response => console.log(response.body))        // 获取成功
    .catch(error => console.error(error));               // 获取失败，并返回错误类型
```

### 获取标签（Tag）

```js
var metricName = '<metricName>';
// 获取并打印Tag
client.getTags('<metricName>')
    .then(response => console.log(response.body))        // 获取成功
    .catch(error => console.error(error));               // 获取失败，并返回错误类型
```

### 查询数据点

```js
// 构建想要查询的queryList
var queryList = [
    {
        "metric": "cpu_idle1",
        "filters": {
            "start": "1 hour ago",
            "tags": {
                "host": [
                    "server1",
                    "server2"
                ]
            },
            "value": ">= 10"
        },
        "groupBy": [
            {
                "name": "Tag",
                "tags": [
                    "rack"
                ]
            }
        ]
    }
];
// 获取并打印查询结果
client.getDatapoints('<queryList>')
    .then(response => console.log(JSON.stringify(response.body))) // 获取成功
    .catch(error => console.error(error));                // 获取失败，并返回错误类型
```

### 通过SQL查询数据点

TSDB支持标准ANSI SQL语义，可以通过如如下代码，使用SQL查询数据点

```js
var sql = 'select * from cpu_idle';
client.getRowsWithSql(sql)
      .then(function (response) {
            console.log(response.body);
      });
```

## 生成查询数据点的预签名URL

预签名URL可以用于前端页面查询数据点。用法：前端请求服务器生成预签名url并返回给前端，前端使用该URL发起ajax请求查询数据点。

### 生成Query对象的预签名URL
```js
// 构建想要查询的queryList
var queryList = [{
        "metric": "cpu_idle3",
        "fields": ["field1","field2"],
        "tags": ["rack", "host"],
        "filters": {
            "start": "5 hour ago",
            "fields": [{
                "field": "field1",
                "value": ">= 10"
             },{
                "field": "field2",
                "value": "<= 10"
             }],
                "tags": { "rack": [ "rack1" ], "host": [ "server1" ] },
             },
             "groupBy": [{
                 "name": "Tag",
                  "tags": ["rack", "host"]
              }],
                "limit": 1000
     }];
var presignedUrl = client.generatePresignedUrl(queryList, 0, 1800, null, {})
console.log(presignedUrl);
```

### 生成SQL的预签名URL

```js
var sql = 'select * from cpu_idle';
var presignedUrl = client.generatePresignedUrlWithSql(sql, 0, 1800, null, {})
console.log(presignedUrl);
```

## 管理接口

### 创建TsdbAdminClient

```js
var TsdbAdminClient = require('./tsdb_admin_client');    
const config = {
    endpoint: 'tsdb.{region}.baidubce.com',
         ak: '<AccessKeyID>',
         sk: '<SecretAccessKey>'
    }
};
// 初始化一个TsdbAdminClient
const client = new TsdbAdminClient(config);
```

### 创建时序数据库实例

```js
// 设置实例各参数
var databaseName = "test"；   // 实例的名字
var clientToken = UUID.v4(); // 用于保证幂等性，重试发送创建请求时，使用同一个clientToken。
var description = 'This is just a test for TSDB.';  // 实例描述，可不填写
var ingestDataPointsMonthly = 1;                    // 写入额度，单位：百万点/月
var storeBytesQuota = 1;                            // 存储空间额度，单位：GB
var purchaseLength = 1;                             // 购买时长，单位：月
var couponName = '<your-coupon-name>';              // 代金券号，可不填写

// 创建并返回创建结果
client.createDatabase(clientToken, databaseName, ingestDataPointsMonthly, purchaseLength, description, couponName, storeBytesQuota)
    .then(response => console.log(response.body))   // 创建成功
    .catch(error => console.error(error));          // 创建失败，并返回错误类型
```

### 删除时序数据库实例

```js
// 删除实例的ID
var databaseId = 'tsdb-xxxxxxxxxxx';
// 删除实例并返回结果
client.deleteDatabase(databaseId)
    .then(response => console.log(response.body))          // 删除成功
    .catch(error => console.error(error));                 // 删除失败，并返回错误类型
```

### 获取时序数据库实例信息

```js
// 获取实例的ID
var databaseId = 'tsdb-xxxxxxxxxxxx';
// 获取实例并返回实例信息
client.getDatabaseInfo(databaseId)
    .then(response => console.log(response.body))        // 获取成功
    .catch(error => console.error(error));               // 获取失败，并返回错误类型
```

#### 获取时序数据库实例列表

```js
// 获取并返回结果
client.listDatabase()
    .then(response => console.log(response.body))          // 获取成功
    .catch(error => console.error(error));                 // 获取失败，并返回错误类型
```