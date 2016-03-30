---
id: advanced-topics-sts
title: STS临时认证
layout: docs
category: Advanced Topics
next: advanced-topics-multiupload
permalink: docs/advanced-topics-sts.html
---

百度开放云SDK支持STS（Security Token Service）临时授权的方式。用这种方式可以从服务端生成一组具体特定操作权限、具有一定时效性的临时AK/SK。这组临时的AK/SK可以暴露给浏览器端直接使用。

关于STS方面的介绍请参考[此文档](https://bce.baidu.com/doc/BOS/API.html#.E8.AE.BF.E9.97.AE.E6.8E.A7.E5.88.B6)。

使用STS比服务端签名更安全灵活，它可以对用户的使用权限进行灵活、精确地控制，而且不必像服务端签名需要每次请求都调用后端接口，在有效期内就可以不用再请求新的Security Token。

### 实现代码

#### nodejs服务端代码

<script src="https://gist.github.com/leeight/9602b43a6b9385dbe6e1.js"></script>

在服务器端，用与创建bosClient实例类似的方式创建一个stsClient实例。对于stsClient实例，主要有一个方法，那就是getSessionToken。这个方法接收两个参数，第一个参数是临时授权的有效期，以秒为单位；第二个单位是具体的权限控制，参见STS[服务接口文档](https://bce.baidu.com/doc/BOS/API.html#STS.20.E6.9C.8D.E5.8A.A1.E6.8E.A5.E5.8F.A3)。

这个方法会异步访问sts授权服务器，返回一个promise对象。STS授权服务器会返回类似如下内容：

```json
{
    ...
    body: {
        "accessKeyId": "d87a16e5ce1d47c1917b38ed03fbb329",
        "secretAccessKey": "e9b6f59ce06c45cdaaea2296111dab46",
        "sessionToken": "MjUzZjQzNTY4OTE0NDRkNjg3N2E4YzJhZTc4YmU5ZDh8AAAAABwCAAB/HfHDVV2bu5xUf6rApt2YdSLG6+21UTC62EHvIuiaamtuMQQKNkR9PU2NJGVbuWgBn8Ot0atk0HnWYQGgwgyew24HtbrX3GFiR/cDymCowm0TI6OGq7k8pGuBiCczT8qZcarH7VdZBd1lkpYaXbtP7wQJqiochDXrswrCd+J/I2CeSQT6mJiMmvupUV06R89dWBL/Vcu7JQpdYBk0d5cp2B+gdaHddBobevlBmKQw50/oOykJIuho4Wn7FgOGPMPdod0Pf0s7lW/HgSnPOjZCgRl0pihs197rP3GWpnlJRyfdCY0g0GFG6T0/FsqDbxbi8lWzF1QRTmJzzh2Tax8xoPFKGMbpntp//vGP7oPYK1JoES34TjcdcZnLzIRnVIGaZAzmZMUhPEXE5RVX1w8jPEXMJJHSrFs3lJe13o9Dwg==",
        "createTime": "2016-02-16T14:01:29Z",
        "expiration": "2016-02-16T15:41:29Z",
        "userId": "5e433c4a8fe74765a7ec6fc147e25c80"
    }
}
```

服务器端需要把`accessKeyId`、`secretAccessKey`、`sessionToken`三个字段下发给浏览器端。

#### 浏览器前端代码

前端使用STS临时授权机制时，只需要在各个服务初始化的时候把上面所说的参数`accessKeyId`、`secretAccessKey`、`sessionToken`引入就可以了。以BOS为例：

```js
var bosConfig = {
    credentials: {
        ak: '{accessKeyId}', // STS服务器下发的临时ak
        sk: '{secretAccessKey}' // STS服务器下发的临时sk
    },
    sessionToken: '{sessionToken}',  // STS服务器下发的sessionToken
    endpoint: 'http://bos.bj.baidubce.com'
};
var client = new baidubce.sdk.BosClient(bosConfig);
```
