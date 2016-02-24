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
