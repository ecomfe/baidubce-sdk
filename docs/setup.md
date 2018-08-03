---
title: BCE-SDK-JS
side: bce-sdk-js
---

[![Build Status](https://img.shields.io/travis/baidubce/bce-sdk-js.svg?style=flat-square)](https://travis-ci.org/baidubce/bce-sdk-js)[![NPM version](https://img.shields.io/npm/v/@baiducloud/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@baiducloud/sdk)[![Coverage Status](https://img.shields.io/coveralls/github/baidubce/bce-sdk-js.svg?style=flat-square)](https://coveralls.io/github/baidubce/bce-sdk-js?branch=master)[![Dependencies](https://img.shields.io/david/baidubce/bce-sdk-js.svg?style=flat-square)](https://david-dm.org/baidubce/bce-sdk-js)

本文档主要介绍JavaScript SDK的安装和使用，JavaScript SDK可以同时运行在浏览器或者Node.js环境中。

---

安装SDK
-------

### Node 环境

环境支持：`4.x`、`5.x`

安装方式：JavaScript包已经上传npm管理器，直接使用npm安装SDK的开发包

```javascript
    npm install @baiducloud/sdk
```

示例代码：本示例采用`ES6`语法，依据不同版本Node的支持程度，你可能需要`babel`支持

```javascript
import {BosClient} from '@baiducloud/sdk';

const config = {
    endpoint: <EndPoint>,         //传入Bucket所在区域域名
    credentials: {
        ak: <AccessKeyID>,        //您的AccessKey
        sk: <SecretAccessKey>     //您的SecretAccessKey
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new BosClient(config);

client.putObjectFromFile(bucket, key, __filename)
    .then(response => console.log(response))    // 成功
    .catch(error => console.error(error));      // 失败
```

### 浏览器环境

环境支持：

- `Opera` : `17.0+`
- `Apple Safari` : `5.1+`
- `Android Browser` : `4.3+`
- `Google Chrome` : `28.0+`
- `Mozilla Firefox` : `23.0+`
- `Microsoft Internet Explorer` : `10.0`

使用方式:

```html
    // 通过node_modules引入
    <script src="./node_modules/bce-sdk-js/baidubce-sdk.bundle.min.js"></script>
    // 通过CDN引入
    <script src="//bce.bdstatic.com/lib/@baiducloud/sdk/lastest/baidubce-sdk.bundle.min.js"></script>
```

示例代码：

```html
<script src="//bce.bdstatic.com/lib/@baiducloud/sdk/lastest/baidubce-sdk.bundle.min.js"></script>
<script>
    var client = new baidubce.sdk.BosClient({
        endpoint: <EndPoint>,         //传入Bucket所在区域域名
        credentials: {
            ak: <AccessKeyID>,        //您的AccessKey
            sk: <SecretAccessKey>     //您的SecretAccessKey
        }
    });

    client.putObjectFromString('my-bucket', 'my-object-key', 'hello world')
        .then(response => console.log(response))    //成功
        .catch(error => console.error(error));      //失败
</script>
```
