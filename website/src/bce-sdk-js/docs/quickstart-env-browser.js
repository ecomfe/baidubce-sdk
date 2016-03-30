/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
### 安装

推荐使用 bower 来安装。

\`\`\`sh
bower install bce-sdk-js
\`\`\`

通过\`<script>\`来加载\`baidubce-sdk.bundle.min.js\`到页面：

\`\`\`html
<script src="bower_components/bce-sdk-js/baidubce-sdk.bundle.min.js"></script>
\`\`\`

当 js 加载到页面之后，可以用过全局变量\`baidubce.sdk\`来使用 sdk 的功能。

### 支持的浏览器版本

|浏览器|最低版本|
|------|--------|
|Google Chrome|28.0+|
|Microsoft Internet Explorer|10.0|
|Mozilla Firefox|23.0+|
|Apple Safari|5.1+|
|Opera|17.0+|
|Android Browser|4.3+|

> IE低版本（IE8, IE9）有特殊的支持方式，请参考[IE低版本的处理](advanced-topics-postobject.html)

### 基本用法

\`\`\`js
const config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: '您的ak',
        sk: '您的sk'
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new baidubce.sdk.BosClient(config);

client.putObjectFromString(bucket, key, 'hello world')
    .then(response => console.log(response))    // 成功
    .catch(error => console.error(error));      // 失败
\`\`\`

所有的接口均返回一个promise对象。
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"quickstart-env-browser","title":"浏览器环境","layout":"docs","category":"Quick Start","next":"advanced-topics-basic-example-in-browser","permalink":"docs/quickstart-env-browser.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
