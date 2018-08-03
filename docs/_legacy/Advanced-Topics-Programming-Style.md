---
id: advanced-topics-programming-style
title: 多种异步编程风格
layout: docs
category: Advanced Topics
next: advanced-topics-postobject
permalink: docs/advanced-topics-programming-style.html
---

在bce-sdk-js中，所有的服务交互接口均是异步接口，返回一个Promise对象。

以Node.js为例，让我们先初始化一个BosClient：

```js
import {BosClient} from 'bce-sdk-js';
var config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: '您的ak',
        sk: '您的sk'
    }
};
var client = new BosClient(config);
```

然后设想以下流程：

- 在BOS中创建一个bucket，名称为`bucket-for-test`；
- 在这个bucket中上传一个Object，key为`test`;
- 删除这个Object

我们应该如何实现这样的流程呢？

## Promise实现（默认异步风格）

```js
// 0. 开始流程
client.createBucket('bucket-for-test')
    .then(function (response) {
        // 2. 完成bucket创建
        return client.putObjectFromString('bucket-for-test', 'test', 'hello world');
    })
    .then(function (response) {
        // 3. 完成Object上传
        return client.deleteObject('bucket-for-test', 'test');
    })
    .then(function (response) {
        // 4. 完成Object删除
    })
    .catch(function (error) {
        // 异常处理
    });
// 1. 先执行其他代码，api操作异步执行
```

在上面的示例中，实际运行时会按照注释中编号的次序执行。通过`catch`方法统一处理异常。

这种编程风格过程比较清晰，Node.js端和浏览器端都可以直接使用，bce-sdk-js默认支持这种编程风格。想了解更多关于Promise的api，请参考[此文档](http://documentup.com/kriskowal/q/)。

## Generator Function实现

可能有些开发者会更习惯同步风格的api调用方式。但由于Node.js语言本身的限制，这种做法并不多见。但在es6中，我们可以使用[Generator Function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/function*)来进行更灵活的流程控制，这可以帮助我们很方便地实现同步调用的编程风格。

为了简化开发，我们需要[co](https://github.com/tj/co)库的配合：

```sh
npm install --save co
```

下面的代码来演示整个流程：

```js
import co from 'co';

// 0. 开始流程
co(function *() {
    var response = yield client.createBucket('bucket-for-test');
    // 2. 完成bucket创建

    response = yield client.putObjectFromString('bucket-for-test', 'test', 'hello world');
    // 3. 完成Object上传

    response = yield client.deleteObject('bucket-for-test', 'test');
    // 4. 完成Object删除

}).catch(function (error) {
    // 异常处理
});
// 1. 先执行其他代码，api操作异步执行
```

co库的作用是帮助开发者把处理generator中流程的复杂操作省略了，并且让Promise对象成为“yieldable”。开发者可以参照以上代码，以同步的风格进行开发。

### 兼容情况

* 在Node.js的较新的版本中（建议使用最新的稳定版本），已经提供了es-harmony的支持，而Generator Function的支持亦包含在其中。你可以这样开启：

    ```sh
    node --harmony yourScript.js
    ```

* 在浏览器中的支持情况可见下表：

|Chrome|Firefox|IE|Edge|Opera|Safari|
|---|---|---|---|---|---|
|39.0|26.0|不支持|13|26|不支持|

## async-await实现

在es7草案中提出了async-await的异步解决方案。上述流程可以这样实现：

```js
let run = async () => {
    // 0. 开始流程
    try {
        var response = await client.createBucket('bucket-for-test');
        // 2. 完成bucket创建

        response = await client.putObjectFromString('bucket-for-test', 'test', 'hello world');
        // 3. 完成Object上传

        response = await client.deleteObject('bucket-for-test', 'test');
        // 4. 完成Object删除
    }
    catch(error) {
        // 异常处理
    }
}

run();
// 1. 先执行其他代码，api操作异步执行
```

整个过程跟Generator Function的方案很类似，似乎更简洁一点。不过需要通过try...catch来手动捕获异常。

## javascript预编译器

为了能在浏览器端和Node.js端使用Generator Function和async-await特性，开发者可以使用javascript预编译器对代码进行处理，转成浏览器和Node.js中能够正常执行的版本。下面以[babel](http://babeljs.io/)为例：

### 安装

在项目根目录下执行：

```sh
npm install --save babel-core babel-polyfill babel-preset-es2015 babel-preset-stage-3
npm install --save-dev babel-cli
echo '{ "presets": ["stage-3", "es2015"] }' > .babelrc
```

### 编译

假设在original.js中使用了Generator Function和async-await特性，通过以下命令，可以生成compiled.js，这个js文件可以在浏览器端和Node.js端正常运行。

```sh
babel original.js -o compiled.js
```

更多编译细节请参考[此文档](http://babeljs.io/docs/usage/cli/)。
