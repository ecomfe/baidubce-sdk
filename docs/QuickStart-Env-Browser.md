---
id: quickstart-env-browser
title: 浏览器环境
layout: docs
category: Quick Start
next: advanced-topics-basic-example-in-browser
permalink: docs/quickstart-env-browser.html
---

### 安装

推荐使用 bower 来安装。

```sh
bower install bce-sdk-js
```

或者直接引入一个CDN地址：

```html
<script src="//sdk.bceimg.com/js/latest.js"></script>
```

当 js 加载到页面之后，可以用过全局变量`baidubceSdk`来使用 sdk 的功能。

### 支持的浏览器版本

|浏览器|最低版本|
|------|--------|
|Google Chrome|28.0+|
|Microsoft Internet Explorer|10.0|
|Mozilla Firefox|23.0+|
|Apple Safari|5.1+|
|Opera|17.0+|
|Android Browser|4.3+|

> IE低版本（IE8, IE9）有特殊的支持方式，请参考[IE低版本的处理](advanced-topics-key-bindings.html)

### 基本用法

```js
const config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: '您的ak',
        sk: '您的sk'
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new baidubceSdk.BosClient(config);

client.putObjectFromString(bucket, key, 'hello world')
    .then(response => console.log(response))    // 成功
    .catch(error => console.error(error));      // 失败
```

所有的接口均返回一个promise对象。
