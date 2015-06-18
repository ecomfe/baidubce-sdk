#!/usr/bin/env bash

find demo -type f | while read f
do
   baidubce bos --put-object $f bos://omnidocker/browser/$f
done
