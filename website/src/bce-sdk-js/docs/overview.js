/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
bce-sdk-js 可以运行在浏览器或者Nodejs环境中。 开发者通过调用简单易用的API来使用百度开放云的服务，快速的构建自己的应用。

### AK和SK

使用 bce-sdk-js 之前，需要有至少一对有效的 AK 和 SK 来完成签名的计算的工作。获取 AK 和 SK 的步骤如下：

1. [登录百度开放云控制台](https://console.bce.baidu.com/)
2. [访问Access Key管理页面](https://console.bce.baidu.com/iam/#/iam/accesslist)

如果没有 AK 和 SK 的话，可以点击『创建Access Key』按钮，生成一对新的AK和SK。

### 安装

1. [Nodejs环境](quickstart-env-nodejs.html)
2. [浏览器环境](quickstart-env-browser.html)

### 环境差异

用户可以在浏览器环境和Node.js环境中使用bce-sdk-js。但受限于浏览器环境本身的功能限制和安全性限制，在浏览器环境中，sdk的一些功能将无法使用。具体有如下几种情况：

* 本地文件读写：浏览器中无法直接操作本地文件，所以BOS服务的\`putObjectFromFile\`和\`getObject\`等相关api将无法使用。类似的，Node.js环境也没有Blob对象，所以BOS服务的\`putObjectFromBlob\`是专门为浏览器环境而开发的。
* bucket级相关操作：由于浏览器跨域访问的限制，需要在服务端设置相应的CORS配置才能进行跨域访问。现在百度开放云支持对特定bucket内的对象进行CORS配置，但不支持对bucket级别api的跨域访问。所以\`listBuckets\`等api在浏览器端无法使用，bucket级别的api的详细情况请参考[BOS - api](api-reference-bos.html)。
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"getting-started","title":"总览","layout":"docs","category":"Quick Start","next":"quickstart-env-nodejs","permalink":"docs/overview.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
