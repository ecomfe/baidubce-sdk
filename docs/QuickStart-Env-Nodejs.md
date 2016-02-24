---
id: quickstart-env-nodejs
title: Nodejs环境
layout: docs
category: Quick Start
next: quickstart-env-browser
permalink: docs/quickstart-env-nodejs.html
---

### 安装

推荐使用 npm 来安装。

```sh
npm install bce-sdk-js
```

### 基本用法

```js
import {BosClient} from 'bce-sdk-js';

const config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: 'ak',
        sk: 'sk'
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new BosClient(config);

client.putObjectFromFile(bucket, key, __filename)
    .then(response => console.log(response))    // 成功
    .catch(error => console.error(error));      // 失败
```

Next, let's go into the basics of the API and learn what else you can do with Draft.js.
