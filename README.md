## baidubce-sdk

Baidu Cloud Engine Node.js SDK

## Install

```
npm i baidubce-sdk
```

## Usage

### createBucket

```
var bce = require('baidubce-sdk');

var config = {
    credentials: {
        ak: 'ak',
        sk: 'sk'
    },
    endpoint: 'http://10.105.97.15'
};
var bucket = 'this-is-a-bucket';

var client = new bce.BosClient(config);
client.createBucket(bucket)
    .then(function(response) {
        console.log(response);
    })
    .then(function() {
        return client.deleteBucket(bucket);
    })
    .catch(function(error) {
        console.error(error);
    });
```

### putObject

常用接口：

1. putObjectFromString
2. putObjectFromFile

```
var bce = require('baidubce-sdk');

var config = {
    credentials: {
        ak: 'ak',
        sk: 'sk'
    },
    endpoint: 'http://10.105.97.15'
};

var bucket = 'this-is-a-bucket';
var key = 'hello_world.js';

var client = new bce.BosClient(config);
client.createBucket(bucket)
    .then(function() {
        return client.putObjectFromFile(bucket, key, __filename);
    })
    .then(function() {
        return client.getObjectMetadata(bucket, key);
    })
    .then(function(response) {
        console.log(response);
    })
    .catch(function(error) {
        console.error(error);
    });
```

### multipartUpload

常用接口：

1. initiateMultipartUpload
2. uploadPartFromFile
3. completeMultipartUpload

```
var Q = require('q');
var bce = require('baidubce-sdk');

var config = {
    credentials: {
        ak: 'ak',
        sk: 'sk'
    },
    endpoint: 'http://10.105.97.15'
};

var bucket = 'this-is-a-bucket';
var key = 'large_file';

var large_file = 'this/is/a/large/file/path';
var filesize = fs.lstatSync(large_file).size;

var upload_id = null;

var client = new bce.BosClient(config);
client.createBucket(bucket)
    .then(function() {
        return client.initiateMultipartUpload(bucket, key);
    })
    .then(function(response) {
        upload_id = response.body.uploadId;
        
        var left_size = filesize;
        var offset = 0;
        var part_number = 1;
        
        var defers = [];
        while (left_size > 0) {
            var part_size = Math.min(left_size, 5 * 1024 * 1024);
            defers.push(client.uploadPartFromFile(
                bucket, file, upload_id,
                part_number, part_size, large_file, offset
            ));

            left_size -= part_size;
            offset += part_size;
            part_number += 1;
        }
        
        return Q.all(defers);
    })
    .then(function(all_response) {
        var part_list = [];
        for (var i = 0; i < all_response.length; i ++) {
            var response = all_response[i];
            part_list.push({
                partNumber: i + 1,
                eTag: response.http_headers.etag
            });
        }
        return client.completeMultipartUpload(bucket, key, upload_id, part_list);
    })
    .then(function(response) {
        console.log(response)
    })
    .catch(function(error) {
        console.error(error);
    });
```

## Browser Usage

Use the `putObjectFromBlob` api.

```
browserify -s baidubce-sdk index.js -o baidubce-sdk.bundle.js
```

```
var sdk = require('./baidubce-sdk.bundle');
var $ = require('jquery');

$('files').on('change', function (evt) {
    var file = evt.target.files[0];

    var client = new sdk.BosClient(getBOSConfig());
    var bucket = getBucket();
    var key = file.name;
    var blob = file;

    var ext = key.split(/\./g).pop();
    var mimeType = sdk.MimeType.guess(ext);
    if (/^text\//.test(mimeType)) {
        mimeType += '; charset=UTF-8';
    }
    var options = {
        'Content-Type': mimeType
    };
    var promise = client.putObjectFromBlob(bucket, key, blob, options);
    client._httpAgent._req.xhr.upload.onprogress = function (evt) {
        if (evt.lengthComputable) {
            $('#g_progress').val(evt.loaded / evt.total);
        }
    };
    promise.then(function (res) {
        $('#g_progress').val(1);
        var url = client.generatePresignedUrl(bucket, key)
        $('#g_url').html('<a href="' + url + '" target="_blank">下载地址</a>');
    })
    .catch(function (err) {
        console.error(err);
    });
});
```
### Others

More api usages please refer [test/bos_client.spec.js](test/bos_client.spec.js)
