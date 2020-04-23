/**
 * Copyright (c) 2020 Baidu Inc. All Rights Reserved
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file bcc-client.d.ts
 * @author 木休大人 (zhanghao25@baidu.com)
 */

/// <reference path="bce-config.d.ts" />
/// <reference path="http-client.d.ts" />

declare namespace BaiduBce.SDK {
    class BccClient {
        constructor(options: { endpoint: string } & Credentials);
    }
}
