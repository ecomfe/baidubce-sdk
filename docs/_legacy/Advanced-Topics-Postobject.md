---
id: advanced-topics-postobject
title: IE低版本的处理
layout: docs
category: Advanced Topics
next: api-reference-bos
permalink: docs/advanced-topics-postobject.html
---

因为 IE低版本（IE8, IE9）对 html5 支持的不完善，为了在这些浏览器里面实现文件直传的功能，
BOS 开发了 PostObject 接口，通过一个 multipart/form-data 的格式，就可以把文件上传到 BOS 服务器。

我们已经在 [bce-bos-uploader](http://leeight.github.io/bce-bos-uploader/) 实现了对这个接口的支持，使用
之前需要进行额外的配置工作：

1. 上传 crossdomain.xml
2. 升级服务端计算签名的代码（Node.js 和 C#）
3. 升级 bce-bos-uploader
4. 通过条件注释引用 polyfills 文件

### 上传 crossdomain.xml

基于html5的跨域方案，我们需要设置 cors；如果通过 flash 来完成跨域数据交互的话，需要设置 crossdomain.xml，可以直接把
如下内容保存为 `crossdomain.xml`，然后上传到 `bucket` 的根目录：

```xml

<?xml version="1.0"?>
<!DOCTYPE cross-domain-policy SYSTEM
"http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
  <allow-access-from domain="*" secure="false" />
</cross-domain-policy>
```

### 升级服务端计算签名的代码

请参考[服务端动态签名](advanced-topics-server-signature)

### 升级 bce-bos-uploader

通过 bower 安装最新的 bce-bos-uploader

```
bower install bce-bos-uploader
```

### 通过条件注释引用 polyfills 文件

因为低版本的IE对 es5 的一些特性支持的不完善，所以需要引入 polyfills 文件来处理一下。

```html
<!--[if lt IE 8]><script src="bower_components/json3/lib/json3.min.js"></script><![endif]-->
<!--[if lt IE 9]><script src="bower_components/js-polyfills/es5.js"></script><![endif]-->
<!--[if lt IE 10]><script src="bower_components/moxie/bin/js/moxie.min.js"></script><![endif]-->
```

然后在初始化 `baidubce.bos.Uploader` 的时候，设置一下 `flash_swf_url` 即可：

```js
var uploader = new baidubce.bos.Uploader({
    ...
    flash_swf_url: 'bower_components/moxie/bin/flash/Moxie.swf'
    ...
});
```
