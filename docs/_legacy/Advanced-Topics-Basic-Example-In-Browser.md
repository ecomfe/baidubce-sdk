---
id: advanced-topics-basic-example-in-browser
title: 在浏览器中直接上传文件到bos
layout: docs
category: Advanced Topics
next: advanced-topics-security-issue
permalink: docs/advanced-topics-basic-example-in-browser.html
---

这一小节将会指导您如何在浏览器中直接上传文件到BOS中。

### 开启bucket的跨域访问

受浏览器安全限制，如果想直接在浏览器中访问BOS服务，必须正确设置好相关bucket的跨域功能。设置方法如下：

1. 登录开放云控制台
2. 选择一个 Bucket，进入 Bucket 管理页面
3. 点击左侧『Bucket属性』，进入 Bucket 配置的页面
4. 点击右侧『CORS设置』，进入 CORS设置 页面
5. 点击『添加规则』按钮，可以添加一条或者多条CORS的规则

如下图所示：

![](http://google.bceimg.com/cors.png)

> 注意：Origins里面的配置，不应该有最后的 '/'。例如：https://*.github.io/ 是错误的配置

### 初始化

```js
var bosConfig = {
    credentials: {
        ak: '从开放云控制台查询您的ak',
        sk: '从开放云控制台查询上面这个ak所对应的sk'
    },
    endpoint: 'http://bos.bj.baidubce.com' // 根据您选用bos服务的区域配置相应的endpoint
};
var bucket = 'bce-javascript-sdk-demo-test'; // 设置您想要操作的bucket
var client = new baidubce.sdk.BosClient(bosConfig);
```

后续我们可以使用client这个实例来进行bos相关操作。

### 上传逻辑

我们可以通过调用`client.putObjectFromBlob(bucket, key, blob, options)`来完成文件的上传操作。

这个函数支持4个参数，其中`options`是可选的。如果需要手工设置文件的的`Content-Type`，可以放到`options`参数里面。
如果没有手工设置，默认的`Content-Type`是`application/oceat-stream`。

另外，可以通过调用`baidubce.sdk.MimeType.guess(ext)`来根据后缀名得到一些常用的`Content-Type`。

> 因为Firefox兼容性的一个问题，如果上传的文件是 `text/***` 类型，Firefox 会自动添加 `charset=utf-8`
> 因此我们给 options 设置 `Content-Type` 的时候，需要手工加上 `charset=utf-8`，否则会导致浏览器计算的签名跟服务器计算的签名不一致，导致上传失败


```js
// 监听文件上传的事件，假设页面中有：<input type="file" id="upload" />
$('#upload').on('change', function (evt) {
    var file = evt.target.files[0]; // 获取要上传的文件
    var key = file.name; // 保存到bos时的key，您可更改，默认以文件名作为key
    var blob = file;

    var ext = key.split(/\./g).pop();
    var mimeType = baidubce.sdk.MimeType.guess(ext);
    if (/^text\//.test(mimeType)) {
        mimeType += '; charset=UTF-8';
    }
    var options = {
        'Content-Type': mimeType
    };

    client.putObjectFromBlob(bucket, key, blob, options)
        .then(function (res) {
            // 上传完成，添加您的代码
            console.log('上传成功');
        })
        .catch(function (err) {
            // 上传失败，添加您的代码
            console.error(err);
        });

});
```

如果想获悉当前上传的进度，可以监听`progress`事件。

```js
client.on('progress', function (evt) {
    // 监听上传进度
    if (evt.lengthComputable) {
        // 添加您的代码
        var percentage = (evt.loaded / evt.total) * 100;
        console.log('上传中，已上传了' + percentage + '%');
    }
});
```
