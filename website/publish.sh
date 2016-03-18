#!/bin/bash

set -e

# Start in website/ even if run from root directory
cd "$(dirname "$0")"

REPOS=bce-sdk-js

cd ../../${REPOS}-gh-pages
git checkout -- .
git clean -dfx
git fetch
git rebase
rm -Rf *
cd ../${REPOS}/website
rm -Rf build/
node server/generate.js
cp -R build/${REPOS}/* ../../${REPOS}-gh-pages/
rm -Rf build/
cd ../../${REPOS}-gh-pages
git add --all
git commit -m "update website"
git push origin gh-pages
cd ../${REPOS}/website
