/**
 * @generated
 */
var React = require("React");
var Layout = require("DocsLayout");
var content = `
通过浏览器直传文件到 BOS 服务器的时候，如果把 AK 和 SK 暴露在页面中，会引发安全性的问题。
攻击者如果获取了 AK 和 SK，可以对 BOS 上面的数据进行任意的操作，为了降低泄露的风险，可以
采取的方案有两种：

1. STS
2. 服务端动态签名


### STS

TODO

### 服务端动态签名

主要的实现原理是把需要签名的数据发送给服务端，主要是 \`httpMethod\`, \`path\`, \`queries\`, \`headers\`。
收到服务器返回生成的签名之后，我们把签名和要上传的文件发送给 BOS 的服务器。

这种方案的优点是：因为签名的过程在服务端动态完成的，因此不需要把 AK 和 SK 放到页面上，而且可以添加
自己额外的验证逻辑，比如用户是否登录了，不允许 DELETE 这个 \`httpMethod\` 之类的。缺点是每次签名
都需要跟服务器交互一次。

#### 实现代码

服务端返回内容的格式如下：

\`\`\`js
{
  statusCode: number,
  signature: string,
  xbceDate: string
}
\`\`\`

正常情况下，\`statusCode\`应该是\`200\`

##### Nodejs

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

##### CSharp

\`\`\`c#
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
      config.Credentials = new DefaultBceCredentials("9fe103ae98de4798aabb34a433a3058b",
                                                             "b084ab23d1ef44c997d10d2723dd8014");
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

Managing text input focus can be a tricky task within React components. The browser
focus/blur API is imperative, so setting or removing focus via declarative means
purely through \`render()\` tends to feel awkward and incorrect, and it requires
challenging attempts at controlling focus state.

With that in mind, at Facebook we often choose to expose \`focus()\` methods
on components that wrap text inputs. This breaks the declarative paradigm,
but it also simplifies the work needed for engineers to successfully manage
focus behavior within their apps.

The \`Editor\` component follows this pattern, so there is a public \`focus()\`
method available on the component. This allows you to use a ref within your
higher-level component to call \`focus()\` directly on the component when needed.

The event listeners within the component will observe focus changes and
propagate them through \`onChange\` as expected, so state and DOM will remain
correctly in sync.

## Translating container clicks to focus

Your higher-level component will most likely wrap the \`Editor\` component in a
container of some kind, perhaps with padding to style it to match your app.

By default, if a user clicks within this container but outside of the rendered
\`Editor\` while attempting to focus the editor, the editor will have no awareness
of the click event. It is therefore recommended that you use a click listener
on your container component, and use the \`focus()\` method described above to
apply focus to your editor.

The [plaintext editor example](https://github.com/facebook/draft-js/tree/master/examples/plaintext),
for instance, uses this pattern.
`
var Post = React.createClass({
  statics: {
    content: content
  },
  render: function() {
    return <Layout metadata={{"id":"advanced-topics-managing-focus","title":"AK和SK的安全性问题","layout":"docs","category":"Advanced Topics","next":"advanced-topics-block-styling","permalink":"docs/advanced-topics-managing-focus.html"}}>{content}</Layout>;
  }
});
module.exports = Post;
