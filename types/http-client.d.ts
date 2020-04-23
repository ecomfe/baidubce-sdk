/**
 * Copyright (c) 2020 Baidu Inc. All Rights Reserved
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file http-client.d.ts
 * @author 木休大人 (zhanghao25@baidu.com)
 */

declare namespace BaiduBce.SDK {
    type UTCDateString = string
    type HttpResponseHeaders = {
        date: UTCDateString
        "content-length": string
        "content-type": "application/json; charset=utf-8"
        "x-bce-debug-id"?: string
        "x-bce-request-id": string
    }

    type Result<
        TBody = any,
        THeader = HttpResponseHeaders
    > = {http_headers: THeader, body: TBody};

    type PromiseResult<Tbody = any, THeader = {}> = Promise<
        Result<Tbody, THeader & HttpResponseHeaders>
    >
}
