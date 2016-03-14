/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
### 安装

推荐使用 npm 来安装。

\`\`\`sh
npm install bce-sdk-js
\`\`\`

### 基本用法

\`\`\`js
import {BosClient} from 'bce-sdk-js';

const config = {
    endpoint: 'http://bos.bj.baidubce.com',
    credentials: {
        ak: '您的ak',
        sk: '您的sk'
    }
};

let bucket = 'my-bucket';
let key = 'hello.js';
let client = new BosClient(config);

client.putObjectFromFile(bucket, key, __filename)
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
    return <Layout metadata={{"id":"quickstart-env-nodejs","title":"Nodejs环境","layout":"docs","category":"Quick Start","next":"quickstart-env-browser","permalink":"docs/quickstart-env-nodejs.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
