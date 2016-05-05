/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
主要的实现原理是把需要签名的数据发送给服务端，主要是 \`httpMethod\`, \`path\`, \`queries\`, \`headers\`。
收到服务器返回生成的签名之后，我们把签名和要上传的文件发送给 BOS 的服务器。

这种方案的优点是：因为签名的过程在服务端动态完成的，因此不需要把 AK 和 SK 放到页面上，而且可以添加
自己额外的验证逻辑，比如用户是否登录了，不允许 DELETE 这个 \`httpMethod\` 之类的。缺点是每次签名
都需要跟服务器交互一次。

### 实现代码

1. [nodejs](https://github.com/leeight/bce-sdk-js-usage/tree/master/nodejs/bce-sdk-js-usage)
2. [java](https://github.com/leeight/bce-sdk-js-usage/tree/master/java/bce-sdk-js-usage)
3. [c#](https://github.com/leeight/bce-sdk-js-usage/tree/master/csharp)
4. [php5.3+](https://github.com/leeight/bce-sdk-js-usage/tree/master/php)

#### 浏览器前端实现

把签名的过程由后端完成，浏览器端需要更改签名过程。以下代码重写了sdk中签名的方式：

\`\`\`js
var tokenUrl = '后端签名api';
var bosConfig = {
    endpoint: 'http://bos.bj.baidubce.com'
};
var client = new baidubce.sdk.BosClient(bosConfig));
var bucket = 'bce-javascript-sdk-demo-test';

// 重写签名方法，改为从服务器获取签名
// 您的代码可以不与此相同，您可加入特定的控制逻辑，如是否允许删除？操作者是否已登录？
client.createSignature = function (_, httpMethod, path, params, headers) {
    var deferred = baidubce.sdk.Q.defer();
    $.ajax({
        url: tokenUrl,
        dataType: 'json',
        data: {
            httpMethod: httpMethod,
            path: path,
            params: JSON.stringify(params || {}),
            headers: JSON.stringify(headers || {})
        },
        success: function (payload) {
            if (payload.statusCode === 200 && payload.signature) {
                deferred.resolve(payload.signature, payload.xbceDate);
            }
            else {
                deferred.reject(new Error('createSignature failed, statusCode = ' + payload.statusCode));
            }
        }
    });
    return deferred.promise;
};


$('#upload').on('change', function (evt) {
    var file = evt.target.files[0];
    var key = file.name;
    var blob = file;
    var id = +new Date();

    var ext = key.split(/\\./g).pop();
    var mimeType = sdk.MimeType.guess(ext);
    if (/^text\\//.test(mimeType)) {
        mimeType += '; charset=UTF-8';
    }
    var options = {
        'Content-Type': mimeType
    };

    // 以下逻辑与基本示例中的相同
    var promise = client.putObjectFromBlob(bucket, key, blob, options);
    client.on('progress', function (evt) {
        // 上传中
    });
    promise.then(function (res) {
            // 上传成功
        })
        .catch(function (err) {
            // 上传失败
        });
});
\`\`\`
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"advanced-topics-server-signature","title":"服务端签名","layout":"docs","category":"Advanced Topics","next":"advanced-topics-sts","permalink":"docs/advanced-topics-server-signature.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
