/*
* Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
* an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
* specific language governing permissions and limitations under the License.
*/

module.exports = {
    'credentials': {
        'ak': 'a9622cb5f13c4003a80f2c00fe451d81',
        'sk': '668ce0b2164e42e6b40d56a8efda8338',
    },
    'connection_timeout_in_mills': 5000,    // 5 seconds
    'endpoint': 'http://10.105.97.15',
    'account': {
        'id': '04e0d2c9e8ef478c951b97714c092f77',
        'displayName': 'PASSPORT:105016607'
    },
    'bcc': {
        'endpoint': 'http://bcc.bce-api.baidu.com',
        'credentials': {
            'ak': '97559b0876464e6989e628edeb892e8f',
            'sk': '3e3b467ab329490a9cac428fe3f60b48'
        }
    },
    'bcs': {
        'endpoint': 'https://bs.baidu.com',
        'credentials': {
            'ak': process.env.BCS_AK,
            'sk': process.env.BCS_SK
        }
    },
    'face': {
        // 'endpoint': 'http://face.bj.baidubce.com',
        'endpoint': 'http://nmg02-bce-test15.nmg02.baidu.com:8750',
        'credentials': {
            'ak': process.env.FACE_AK,
            'sk': process.env.FACE_SK
        }
    }
    // 'endpoint': 'http://localhost:8828',
};











/* vim: set ts=4 sw=4 sts=4 tw=120: */
