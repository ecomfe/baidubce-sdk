#!/usr/bin/env bash

export ONLINE_USER_ID=de4b0bd8c0c940939dccada871591da5
export ONLINE_USER_NAME=PASSPORT:16897023

export DEBUG=*.spec

export BOS_ENDPOINT=https://bj.bcebos.com
export BOS_AK=${ONLINE_AK}
export BOS_SK=${ONLINE_SK}

export MEDIA_ENDPOINT=http://media.gz.baidubce.com
export MEDIA_AK=${ONLINE_AK}
export MEDIA_SK=${ONLINE_SK}

# 没有LSS的权限
# env MEDIA_ENDPOINT=http://media.gz.baidubce.com MEDIA_AK=${ONLINE_AK} MEDIA_SK=${ONLINE_SK} make lss

export BCS_ENDPOINT=https://bs.baidu.com

export SES_ENDPOINT=http://ses.bj.baidubce.com
export SES_AK=${ONLINE_AK}
export SES_SK=${ONLINE_SK}

export OCR_ENDPOINT=http://ocr.bj.baidubce.com
export OCR_AK=${ONLINE_AK}
export OCR_SK=${ONLINE_SK}

# QNS问题多多
# env QNS_ENDPOINT=http://qns.bj.baidubce.com QNS_AK=${ONLINE_AK} QNS_SK=${ONLINE_SK} make qns

export FACE_ENDPOINT=http://face.bj.baidubce.com
export FACE_AK=${ONLINE_AK}
export FACE_SK=${ONLINE_SK}

export STS_ENDPOINT=https://sts.bj.baidubce.com
export STS_AK=${ONLINE_AK}
export STS_SK=${ONLINE_SK}

export VOD_ENDPOINT=http://vod.baidubce.com

SPECS=(
  sdk/upload_helper.spec.js
  sdk/sts.spec.js
  sdk/crypto.spec.js
  sdk/auth.spec.js
  sdk/http_client.spec.js
  sdk/mime.types.spec.js
  sdk/bos_client.spec.js
  sdk/mct_client.spec.js
  sdk/bcs_client.spec.js
  sdk/ses_client.spec.js
  sdk/ocr_client.spec.js
  sdk/face_client.spec.js
  sdk/vod_client.spec.js
)

cd $(dirname "$0")
../node_modules/.bin/jasmine-node --verbose --growl --captureExceptions ${SPECS[@]}
