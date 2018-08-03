---
id: api-reference-vod
title: VOD - api
layout: docs
category: API Reference
permalink: docs/api-reference-vod.html
---

[百度 VOD (Video On Demand)](https://bce.baidu.com/doc/VOD/index.html) 是百度开放云 BCE (Baidu Cloud Engine) 提供的面向音视频点播的 PaaS (Platform as a Service) 服务平台，为开发者提供音视频文件的存储、管理及播放服务。您无需了解音视频存储、转码、加密、分发、播放等技术细节，即可快速搭建安全可靠、高可定制的点播平台和应用。

## VodClient

VodClient是VOD服务的javascript客户端，为调用者与VOD服务进行交互提供了一系列的方法。

- 浏览器端：`var VodClient = baidubce.sdk.VodClient`
- nodejs：`import {VodClient} from 'bce-sdk-js'`

### 初始化

```js
var config = {
    endpoint: 'http://vod.baidubce.com',
    credentials: {
        ak: '您的ak',
        sk: '您的sk'
    }
};
var client = new VodClient(config);
```

## 媒资管理
VOD 平台为企业音视频媒资提供通用管理服务，媒资上传 VOD 平台后，会分配一个唯一标识: mediaId, 开发者可通过此 ID 查询并管理媒资。

### 上传媒资文件

假设本地媒资文件由变量`data`指定(浏览器中为blob对象，nodejs中可以为文件路径、stream或buffer)，并且标题和描述通过`title`和`description`来描述，下面示例代码用于通过`createMediaResource()`上传媒资文件：

```js
client.createMediaResource(title, description, data)
    .then(function (response) {
        // 上传完成
        console.log(response.body.mediaId);
    })
    .catch(function (error) {
        // 上传错误
    });
```

### 查询指定的媒资信息

每个媒资有下列属性，并可以通过函数接口`getMediaResource`查询。

参数|父节点|描述
---|---|---
mediaId|-|媒资的唯一标识，开发者可通过 mediaId 查询指定媒资的详细信息
status|-|媒资状态，可选值PENDING/RUNNING/FAILED/PUBLISHED/DISABLED/BANNED
attributes|-|媒资属性
title|attributes|媒资名称，“媒资属性”的子参数
description|attributes|媒资描述，“媒资属性”的子参数
meta|-|媒资元数据
sizeInBytes|meta|媒资数据大小，“媒资元数据”的子参数
durationInSeconds|meta|媒资时长，“媒资元数据”的子参数
publishTime|-|媒资发布时间
createTime|-|媒资创建时间

下述示例代码用于查询指定媒资的属性:

```js
client.getMediaResource(<mediaId>)
    .then(function (response) {
        // 查询成功
        console.dir(response.body);
    })
    .catch(function (error) {
        // 查询错误
    });
```

### 查询所有媒资

下述示例代码用于查询系统内所有的媒资信息:

```js
client.listMediaResources()
    .then(function (response) {
        // 查询成功
        for (var i = 0; i < response.body.media.length; i++) {
            console.log(response.body.media[i]);
        }
    })
    .catch(function (error) {
        // 查询错误
    });
```

### 更新媒资的 title 和 description

下述示例代码用于更新媒资的 title 和 description：

```js
client.updateMediaResource(<mediaId>, title, description)
    .then(function (response) {
        // 更新成功
    })
    .catch(function (error) {
        // 更新错误
    });
```

### 停用指定媒资

下述示例代码用于停用指定的媒资，使之无法播放：

```js
client.stopMediaResource(<mediaId>)
    .then(function (response) {
        // 停用成功
    })
    .catch(function (error) {
        // 停用错误
    });
```

### 恢复指定媒资

下述示例代码用于将被停用的媒资恢复到可播放状态：

```js
client.publishMediaResource(<mediaId>)
    .then(function (response) {
        // 恢复成功
    })
    .catch(function (error) {
        // 恢复错误
    });
```
### 删除指定媒资

下述示例代码用于删除指定媒资：

```js
client.deleteMediaResource(<mediaId>)
    .then(function (response) {
        // 删除成功
    })
    .catch(function (error) {
        // 删除错误
    });
```

## 播放器管理

### 查询媒资播放地址

下述示例代码用于查询指定媒资的播放地址：

```js
client.getPlayableUrl(<mediaId>)
    .then(function (response) {
        // 查询成功
        console.log(response.body.result.file); // 获取媒资对应的可播放源文件的地址
        console.log(response.body.result.cover); // 获取媒资对应的封面图片的地址
    })
    .catch(function (error) {
        // 查询错误
    });
```

### 查询播放器代码

VOD SDK 可以为媒资生成定制的Web播放器代码，开发者只需提供视频播放视图的长度、宽度、以及说明页面加载后是否自动播放。

定制播放器有三种形式：

- 独立播放页面
- 嵌入式HTML代码
- 嵌入式Flash代码。

```js
var width = 800; // 播放器的宽度
var height = 600; // 播放器的高度
var autoStart = true; // 是否自动播放
client.getPlayerCode(<mediaId>, width, height, autoStart)
    .then(function (response) {
        for (var i = 0; i < response.body.codes.length; i++) {
            var code = response.body.codes[i];
            console.log(code.codeType); // 代码类型，为url、html和flash一种，分别表示独立播放页面、嵌入式HTML代码和嵌入式FLASH代码
            console.log(code.sourceCode); // 获取代码
        }
    })
    .catch(function (error) {
        // 查询错误
    });
```
