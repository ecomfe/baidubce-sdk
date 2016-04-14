---
id: advanced-topics-server-signature
title: 服务端签名
layout: docs
category: Advanced Topics
next: advanced-topics-sts
permalink: docs/advanced-topics-server-signature.html
---

主要的实现原理是把需要签名的数据发送给服务端，主要是 `httpMethod`, `path`, `queries`, `headers`。
收到服务器返回生成的签名之后，我们把签名和要上传的文件发送给 BOS 的服务器。

这种方案的优点是：因为签名的过程在服务端动态完成的，因此不需要把 AK 和 SK 放到页面上，而且可以添加
自己额外的验证逻辑，比如用户是否登录了，不允许 DELETE 这个 `httpMethod` 之类的。缺点是每次签名
都需要跟服务器交互一次。

### 实现代码

服务端返回内容的格式如下：

```js
{
  statusCode: number,
  signature: string,
  xbceDate: string
}
```

正常情况下，`statusCode`应该是`200`


#### nodejs 后端示例

```js
var http = require('http');
var url = require('url');
var util = require('util');

var sdk = require('bce-sdk-js');

var kCredentials = {
    ak: '<your ak>',
    sk: '<your sk>'
};

function safeParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (ex) {
        return null;
    }
}

function buildStsResponse(sts) {
    var stsClient = new sdk.STS({
        credentials: kCredentials,
        region: 'bj'
    });
    return stsClient.getSessionToken(60 * 60 * 24, safeParse(sts)).then(function (response) {
        var body = response.body;
        return {
            AccessKeyId: body.accessKeyId,
            SecretAccessKey: body.secretAccessKey,
            SessionToken: body.sessionToken,
            Expiration: body.expiration
        };
    });
}

function buildPolicyResponse(policy) {
    var auth = new sdk.Auth(kCredentials.ak, kCredentials.sk);
    policy = new Buffer(policy).toString('base64');
    signature = auth.hash(policy, kCredentials.sk);

    return sdk.Q.resolve({
        accessKey: kCredentials.ak,
        policy: policy,
        signature: signature
    });
}

function buildNormalResponse(query) {
    if (!(query.httpMethod && query.path && query.params && query.headers)) {
        return sdk.Q.resolve({statusCode: 403});
    }

    if (query.httpMethod !== 'PUT' && query.httpMethod !== 'POST' && query.httpMethod !== 'GET') {
        // 只允许 PUT/POST/GET Method
        return sdk.Q.resolve({statusCode: 403});
    }

    var httpMethod = query.httpMethod;
    var path = query.path;
    var params = safeParse(query.params) || {};
    var headers = safeParse(query.headers) || {};

    var auth = new sdk.Auth(kCredentials.ak, kCredentials.sk);
    signature = auth.generateAuthorization(httpMethod, path, params, headers);

    return sdk.Q.resolve({
        statusCode: 200,
        signature: signature,
        xbceDate: new Date().toISOString().replace(/\.\d+Z$/, 'Z')
    });
}

http.createServer(function (req, res) {
    console.log(req.url);

    var query = url.parse(req.url, true).query;

    var promise = null;
    if (query.sts) {
        promise = buildStsResponse(query.sts);
    }
    else if (query.policy) {
        promise = buildPolicyResponse(query.policy);
    }
    else {
        promise = buildNormalResponse(query);
    }

    promise.then(function (payload) {
        res.writeHead(200, {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });

        if (query.callback) {
            res.end(util.format('%s(%s)', query.callback, JSON.stringify(payload)));
        }
        else {
            res.end(JSON.stringify(payload));
        }
    });
}).listen(1337);
console.log('Server running at http://0.0.0.0:1337/');
```

#### C# 后端实现

```csharp
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
using System.Text;
using System.Security.Cryptography;
using BaiduBce.Services.Sts;
using BaiduBce.Services.Sts.Model;

namespace BaiduCloudEngine.Controllers
{
  class SignatureResult
  {
    public int statusCode { get; set; }
    public string signature { get; set; }
    public string xbceDate { get; set; }
  }

  class PolicySignatureResult
  {
    public string policy { get; set; }
    public string signature { get; set; }
    public string accessKey { get; set; }
  }

  public class HomeController : Controller
  {
    private static string EncodeHex (byte[] data)
    {
      var sb = new StringBuilder ();
      foreach (var b in data) {
        sb.Append (BceV1Signer.HexTable [b]);
      }
      return sb.ToString ();
    }

    public string Index (string httpMethod, string path, string queries, string headers, string policy, string sts, string callback)
    {
      string ak = "<your ak>";
      string sk = "<your sk>";
      BceClientConfiguration config = new BceClientConfiguration () {
        Credentials = new DefaultBceCredentials (ak, sk)
      };

      string result = null;
      if (sts != null) {
        StsClient client = new StsClient (config);
        string accessControlList = sts;
        GetSessionTokenRequest request = new GetSessionTokenRequest () {
          DurationSeconds = 60 * 60 * 24,
          AccessControlList = accessControlList
        };
        GetSessionTokenResponse response = client.GetSessionToken (request);
        result = JsonConvert.SerializeObject (response);
      }
      else if (policy != null) {
        string base64 = Convert.ToBase64String (Encoding.UTF8.GetBytes (policy));
        var hash = new HMACSHA256 (Encoding.UTF8.GetBytes (sk));
        string signature = EncodeHex (hash.ComputeHash (Encoding.UTF8.GetBytes (base64)));
        result = JsonConvert.SerializeObject (new PolicySignatureResult () {
          policy = base64,
          signature = signature,
          accessKey = ak,
        });
      } else {
        InternalRequest internalRequest = new InternalRequest ();
        internalRequest.Config = config;
        internalRequest.Uri = new Uri ("http://www.baidu.com" + path);
        internalRequest.HttpMethod = httpMethod;
        if (headers != null) {
          internalRequest.Headers = JsonConvert.DeserializeObject<Dictionary<string, string>> (headers);
        }
        if (queries != null) {
          internalRequest.Parameters = JsonConvert.DeserializeObject<Dictionary<string, string>> (queries);
        }

        BceV1Signer bceV1Signer = new BceV1Signer ();
        string sign = bceV1Signer.Sign (internalRequest);

        string xbceDate = DateUtils.FormatAlternateIso8601Date (DateTime.Now);
        result = JsonConvert.SerializeObject (new SignatureResult () {
          statusCode = 200,
          signature = sign,
          xbceDate = xbceDate,
        });
      }

      if (callback != null) {
        result = callback + "(" + result + ")";
      }

      return result;
    }
  }
}
```

#### 浏览器前端实现

把签名的过程由后端完成，浏览器端需要更改签名过程。以下代码重写了sdk中签名的方式：

```js
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

    var ext = key.split(/\./g).pop();
    var mimeType = sdk.MimeType.guess(ext);
    if (/^text\//.test(mimeType)) {
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
```
