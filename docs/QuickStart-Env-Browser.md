---
id: quickstart-env-browser
title: 浏览器环境
layout: docs
category: Quick Start
next: quickstart-api-basics
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

### 基本用法

```js
const config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: 'ak',
        sk: 'sk'
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new baidubceSdk.BosClient(config);

client.putObjectFromString(bucket, key, 'hello world')
    .then(response => console.log(response))    // 成功
    .catch(error => console.error(error));      // 失败
```

Next, let's go into the basics of the API and learn what else you can do with Draft.js.
