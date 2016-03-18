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

服务端返回内容的格式如下：

\`\`\`js
{
  statusCode: number,
  signature: string,
  xbceDate: string
}
\`\`\`

正常情况下，\`statusCode\`应该是\`200\`


#### nodejs 后端示例

\`\`\`js
var http = require\('http');
var url = require\('url');
var util = require\('util');

var Auth = require\('bce-sdk-js').Auth;

var kCredentials = {
    ak: '您的AK',
    sk: '您的SK'
};

http.createServer(function (req, res) {
    var query = url.parse(req.url, true).query;
    var statusCode = 200;
    var signature = null;
    if (!query.httpMethod || !query.path || !query.params || !query.headers) {
        statusCode = 403;
    }
    else {
        var httpMethod = query.httpMethod;
        var path = query.path;
        var params = safeParse(query.params) || {};
        var headers = safeParse(query.headers) || {};

        // 添加您自己的额外逻辑

        var auth = new Auth(kCredentials.ak, kCredentials.sk);
        signature = auth.generateAuthorization(httpMethod, path, params, headers);
    }

    var payload = {
        statusCode: statusCode,
        signature: signature,
        xbceDate: new Date().toISOString().replace(/\\.\\d+Z$/, 'Z')
    };
    res.writeHead(statusCode, {'Content-Type': 'text/javascript; charset=utf-8'});
    if (query.callback) {
        res.end(util.format('%s(%s)', query.callback, JSON.stringify(payload)));
    }
    else {
        res.end(JSON.stringify(payload));
    }
}).listen(1337);
console.log('Server running at http://0.0.0.0:1337/');
\`\`\`

#### C# 后端实现

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Ajax;
using BaiduBce;
using BaiduBce.Auth;
using BaiduBce.Internal;
using Newtonsoft.Json;
using BaiduBce.Util;

namespace BaiduCloudEngine.Controllers
{
  class SignatureResult {
    public int statusCode { get; set; }
    public string signature { get; set; }
    public string xbceDate { get; set; }
  }

  public class HomeController : Controller
  {
    public string Index(string httpMethod, string path, string queries, string headers, string callback) {
      BceClientConfiguration config = new BceClientConfiguration();
      config.Credentials = new DefaultBceCredentials("AK", "SK");
      BceV1Signer bceV1Signer = new BceV1Signer();
      InternalRequest internalRequest = new InternalRequest();
      internalRequest.Config = config;
      internalRequest.Uri = new Uri("http://www.baidu.com" + path);
      internalRequest.HttpMethod = httpMethod;
      if (headers != null) {
        internalRequest.Headers = JsonConvert.DeserializeObject> (headers);
      }
      if (queries != null) {
        internalRequest.Parameters = JsonConvert.DeserializeObject> (queries);
      }
      var sign = bceV1Signer.Sign(internalRequest);

      var xbceDate = DateUtils.FormatAlternateIso8601Date (DateTime.Now);
      var result = JsonConvert.SerializeObject (new SignatureResult() {
        statusCode = 200,
        signature = sign,
        xbceDate = xbceDate
      });

      if (callback != null) {
        result = callback + "(" + result + ")";
      }

      return result;
    }
  }
}
\`\`\`

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
