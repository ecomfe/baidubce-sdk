/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
这一小节将会指导您如何在浏览器中直接上传文件到BOS中。

### 开启bucket的跨域访问

受浏览器安全限制，如果想直接在浏览器中访问BOS服务，必须正确设置好相关bucket的跨域功能。设置方法如下：

1. 登录开放云控制台
2. 选择一个 Bucket，进入 Bucket 管理页面
3. 点击左侧『Bucket属性』，进入 Bucket 配置的页面
4. 点击右侧『CORS设置』，进入 CORS设置 页面
5. 点击『添加规则』按钮，可以添加一条或者多条CORS的规则

如下图所示：

![](http://bce-javascript-sdk-demo-test.bj.bcebos.com/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202016-01-26%2014.05.23.png)

### 初始化

\`\`\`js
var bosConfig = {
    credentials: {
        ak: '从开放云控制台查询您的ak',
        sk: '从开放云控制台查询上面这个ak所对应的sk'
    },
    endpoint: 'http://bos.bj.baidubce.com' // 根据您选用bos服务的区域配置相应的endpoint
};
var bucket = 'bce-javascript-sdk-demo-test'; // 设置您想要操作的bucket
var client = new baidubceSdk.BosClient(bosConfig));
\`\`\`

后续我们可以使用client这个实例来进行bos相关操作。

### 上传逻辑

\`\`\`js
// 监听文件上传的事件，假设页面中有：<input type="file" id="upload" />
$('#upload').on('change', function (evt) {
    var file = evt.target.files[0]; // 获取要上传的文件
    var key = file.name; // 保存到bos时的key，您可更改，默认以文件名作为key
    var blob = file;

    var ext = key.split(/\\./g).pop();
    var mimeType = sdk.MimeType.guess(ext);
    if (/^text\\//.test(mimeType)) {
        mimeType += '; charset=UTF-8';
    }
    var options = {
        'Content-Type': mimeType
    };

    var promise = client.putObjectFromBlob(bucket, key, blob, options); // 将文件存储到bos，返回一个promise对象
    client.on('progress', function (evt) {
        // 监听上传进度
        if (evt.lengthComputable) {
            // 添加您的代码
            var percentage = (evt.loaded / evt.total) * 100;
            console.log('上传中，已上传了' + percentage + '%');
        }
    });
    promise.then(function (res) {
            // 上传完成，添加您的代码
            console.log('上传成功');
        })
        .catch(function (err) {
            // 上传失败，添加您的代码
            console.error(err);
        });

});
\`\`\`
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"advanced-topics-basic-example-in-browser","title":"在浏览器中直接上传文件到bos","layout":"docs","category":"Advanced Topics","next":"advanced-topics-security-issue","permalink":"docs/advanced-topics-basic-example-in-browser.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
