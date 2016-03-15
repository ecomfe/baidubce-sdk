/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
通过浏览器直传文件到 BOS 服务器的时候，如果把 AK 和 SK 暴露在页面中，会引发安全性的问题。
攻击者如果获取了 AK 和 SK，可以对 BOS 上面的数据进行任意的操作，为了降低泄露的风险，可以
采取的方案有两种：

1. [服务端动态签名](advanced-topics-server-signature)
2. [STS](advanced-topics-sts)
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"advanced-topics-security-issue","title":"AK和SK的安全性问题","layout":"docs","category":"Advanced Topics","next":"advanced-topics-server-signature","permalink":"docs/advanced-topics-security-issue.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
