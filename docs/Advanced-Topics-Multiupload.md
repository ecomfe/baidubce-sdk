---
id: advanced-topics-multiupload
title: 大文件分块上传
layout: docs
category: Advanced Topics
next: advanced-topics-resume
permalink: docs/advanced-topics-multiupload.html
---

对于大文件而言，可以采用分块上传，一方面可以利用浏览器多线程上传，加快上传速度；另一方面，把大文件分割成若干个小部分，每一部分传输出错可以单独重试，对其他部分没有影响，减小由于网络传输造成的出错重试成本。

分块上传比直接上传稍微复杂一点，直接上传只需要调用putObjectFromBlob就可以了，而分块上传需要分为三个阶段：

* 开始上传（initiateMultipartUpload）
* 上传分块（uploadPartFromBlob）
* 上传完成（completeMultipartUpload）

### 浏览器端代码示例

按照指定的分块大小对文件进行分块

```js
var PART_SIZE = 5 * 1024 * 1024; // 指定分块大小

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
```

处理每个分块上传的逻辑

```js
function uploadPartFile(state, client) {
    return function (task, callback) {
        var blob = task.file.slice(task.start, task.stop + 1);
        client.uploadPartFromBlob(task.bucketName, task.key, task.uploadId, task.partNumber, task.partSize, blob)
            .then(function (res) {
                ++state.loaded;
                callback(null, res);
            })
            .catch(function (err) {
                callback(err);
            });
    };
}
```

初始化uploadId，然后开始上传分块

```js
var uploadId;
client.initiateMultipartUpload(bucket, key, options)
    .then(function (response) {
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
        async.mapLimit(tasks, THREADS, uploadPartFile(state, client), function (err, results) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(results);
            }
        });
        return deferred.promise;
    })
    .then(function (allResponse) {
        var partList = [];
        allResponse.forEach(function (response, index) {
            // 生成分块清单
            partList.push({
                partNumber: index + 1,
                eTag: response.http_headers.etag
            });
        });
        return client.completeMultipartUpload(bucket, key, uploadId, partList); // 完成上传
    })
    .then(function (res) {
        // 上传完成
    })
    .catch(function (err) {
        // 上传失败，添加您的代码
        console.error(err);
    });
```

### nodejs端使用分块上传

与浏览器端很类似，直接上传只需要调用putObjectFromFile就可以了，而分块上传需要分为三个阶段：

* 开始上传（initiateMultipartUpload）
* 上传分块（uploadPartFromFile）
* 上传完成（completeMultipartUpload）

```js
var PART_SIZE = 5 * 1024 * 1024; // 指定分块大小
var uploadId;
client.initiateMultipartUpload(bucket, key, options)
    .then(function (response) {
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
        async.mapLimit(tasks, THREADS, uploadPartFile(state, client), function (err, results) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(results);
            }
        });
        return deferred.promise;
    })
    .then(function (allResponse) {
        var partList = [];
        allResponse.forEach(function (response, index) {
            // 生成分块清单
            partList.push({
                partNumber: index + 1,
                eTag: response.http_headers.etag
            });
        });
        return client.completeMultipartUpload(bucket, key, uploadId, partList); // 完成上传
    })
    .then(function (res) {
        // 上传完成
    })
    .catch(function (err) {
        // 上传失败，添加您的代码
        console.error(err);
    });

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
function uploadPartFile(state, client) {
    return function (task, callback) {
        return client.uploadPartFromFile(task.bucketName, task.key, task.uploadId, task.partNumber, task.partSize, task.file , task.start)
            .then(function (res) {
                ++state.loaded;
                callback(null, res);
            })
            .catch(function (err) {
                callback(err);
            });
    };
}
```

### 取消分块上传事件

用户可以使用abortMultipartUpload方法取消分块上传。

```js
client.abortMultipartUpload(<bucketName>, <key>, <uploadId>);
```

### 获取未完成的分块上传事件

用户可以使用listMultipartUploads方法获取Bucket内未完成的分块上传事件。

```js
client.listMultipartUploads(<bucketName>)
    .then(function (response) {
        // 遍历所有上传事件
        for (var i = 0; i < response.body.multipartUploads.length; i++) {
            console.log(response.body.multipartUploads[i].uploadId);
        }
    });
```

### 获取所有已上传的块信息

用户可以使用listParts方法获取某个上传事件中所有已上传的块。

```js
client.listParts(<bucketName>, <key>, <uploadId>)
    .then(function (response) {
        // 遍历所有上传事件
        for (var i = 0; i < response.body.parts.length; i++) {
            console.log(response.body.parts[i].partNumber);
        }
    });
```
