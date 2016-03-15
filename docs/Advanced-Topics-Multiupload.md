---
id: advanced-topics-multiupload
title: 大文件分块上传
layout: docs
category: Advanced Topics
next: advanced-topics-postobject
permalink: docs/advanced-topics-multiupload.html
---

对于大文件而言，可以采用分块上传，一方面可以利用浏览器多线程上传，加快上传速度；另一方面，把大文件分割成若干个小部分，每一部分传输出错可以单独重试，对其他部分没有影响，减小由于网络传输造成的出错重试成本。

分块上传比直接上传稍微复杂一点，直接上只需要调用putObjectFromBlob就可以了，而分块上传需要分为三个阶段：开始上传（initiateMultipartUpload）、上传分块（uploadPartFromBlob）、上传完成（completeMultipartUpload）。

### 前端代码示例

```js
var PART_SIZE = 5 * 1024 * 1024; // 指定分块大小

// 按照指定的分块大小对文件进行分块
function getTasks(file, uploadId, bucketName, key) {
    var leftSize = file.size;
    var offset = 0;
    var partNumber = 1;

    var tasks = [];

    while (leftSize > 0) {
        var partSize = Math.min(leftSize, PART_SIZE);
        tasks.push({
            file: file,
            uploadId: uploadId,
            bucketName: bucketName,
            key: key,
            partNumber: partNumber,
            partSize: partSize,
            start: offset,
            stop: offset + partSize - 1
        });

        leftSize -= partSize;
        offset += partSize;
        partNumber += 1;
    }
    return tasks;
}

// 定义分块上传的方法
function uploadPartFile(state, client) {
    return function(task, callback) {
        var blob = task.file.slice(task.start, task.stop + 1);
        client.uploadPartFromBlob(task.bucketName, task.key, task.uploadId, task.partNumber, task.partSize, blob)
            .then(function(res) {
                ++state.loaded;
                client.emit('overallProgress', state);
                callback(null, res);
            })
            .catch(function(err) {
                callback(err);
            });
    };
}

var uploadId; // 开始上传时，由服务器生成本次分块上传的id，所有分块都要用
promise = client.initiateMultipartUpload(bucket, key, options)
    .then(function(response) {
        uploadId = response.body.uploadId; // 开始上传，获取服务器生成的uploadId

        var deferred = sdk.Q.defer();
        var tasks = getTasks(blob, uploadId, bucket, key);
        var state = {
            lengthComputable: true,
            loaded: 0,
            total: tasks.length
        };

        // 为了管理分块上传，使用了async（https://github.com/caolan/async）库来进行异步处理
        var THREADS = 2; // 同时上传的分块数量
        async.mapLimit(tasks, THREADS, uploadPartFile(state, client), function(err, results) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(results);
            }
        });
        return deferred.promise;
    })
    .then(function(allResponse) {
        var partList = [];
        allResponse.forEach(function(response, index) {
            // 生成分块清单
            partList.push({
                partNumber: index + 1,
                eTag: response.http_headers.etag
            });
        });
        return client.completeMultipartUpload(bucket, key, uploadId, partList); // 完成上传
    });
}
client.on('overallProgress', function(evt) {
    // 监听上传进度
    if (evt.lengthComputable) {
        // 添加您的代码
        var percentage = (evt.loaded / evt.total) * 100;
        console.log('上传中，已上传了' + percentage + '%');
    }
});
promise.then(function (res) {
        // 上传完成，添加您的代码
        console.log('上传成功，下载地址：' + url);
    })
    .catch(function (err) {
        // 上传失败，添加您的代码
        console.error(err);
    });
```

在完成上传的步骤中，参数中需要带上上传区块的清单时需要每个分块上传成功时的ETag，为了能正确地接收BOS服务器返回的这个字段，您需要在相关bucket的cors设置中，在ExposeHeaders中添加“ETag”，如下图所示。

![](http://bos.bj.baidubce.com/v1/bce-javascript-sdk-demo-test/%E7%A4%BA%E4%BE%8B%E5%9B%BE.png)

### 自动重试

对于网络条件不佳的环境，可能在上传阶段出现错误，有初始化 BOS 服务的时候可以指定网络错误重试的次数：

```js
var bosConfig = {
    credentials: {
        ak: '您的AK',
        sk: '您的SK'
    },
    retry: 50, // 指定重试的次数
    endpoint: 'http://bos.bj.baidubce.com'
};
```
