/**
 * Copyright (c) 2020 Baidu Inc. All Rights Reserved
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file bce-auth.d.ts
 * @author 木休大人 (zhanghao25@baidu.com)
 */

declare namespace BaiduBce.SDK {
    interface Credentials {
        /** 主账户的临时身份凭证。 [参考文档](https://cloud.baidu.com/doc/IAM/s/Qjwvyc8ov#getsessiontoken) */
        sessionToken?: string,

        credentials: {
            /** 百度云账户体系 `Access Key` [参考文档](https://cloud.baidu.com/doc/Reference/s/9jwvz2egb) */
            ak: string,
            /** 百度云账户体系 `Secret Access Key` [参考文档](https://cloud.baidu.com/doc/Reference/s/9jwvz2egb) */
            sk: string
        }
    }

    /** 服务Endpoinit, default: http(s)://<Service>.<Region>.baidubce.com */
    type Endpoint = string;

    /** 翻译不了枚举了，因为我也不知道啥都是啥 */
    type Region = 'bj' | 'cn-n1' | 'gz' | 'hk' | 'hkg' | 'hk02' | 'su' | 'fsh' | 'bd' | 'hb-fsg' | 'fwh' | 'sin' | 'bjfsg' | 'gz';
}
