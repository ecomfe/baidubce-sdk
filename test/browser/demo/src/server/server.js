/**
 * Created by zhouhua on 2016/2/16.
 */
var koa = require('koa');
var logger = require('koa-logger');
var router = require('koa-router')();
var app = koa();
var url = require('url');
var util = require('util');
var Q = require('q');

var Auth = require('../../../../../src/auth');
var STS = require('../../../../../src/sts');

var kCredentials = {
    ak: '9fe103ae98de4798aabb34a433a3058b',
    sk: 'b084ab23d1ef44c997d10d2723dd8014'
};
var kRegion = 'bj';

function safeParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (ex) {
        return null;
    }
}
app.use(logger());

router
    .get('/ack', function *(next){
        var query = this.query;

        var statusCode = 200;
        var signature = null;
        if (!query.httpMethod || !query.path || !query.params || !query.headers) {
            statusCode = 403;
        }
        else {
            var httpMethod = query.httpMethod;
            var path = query.path;
            var params = safeParse(query.params) || {};
            var headers = safeParse(query.headers) || {};

            var auth = new Auth(kCredentials.ak, kCredentials.sk);
            signature = auth.generateAuthorization(httpMethod, path, params, headers);
        }

        var payload = {
            statusCode: statusCode,
            signature: signature,
            xbceDate: new Date().toISOString().replace(/\.\d+Z$/, 'Z')
        };
        this.status = statusCode;
        this.set({
            'Content-Type': 'text/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        });
        if (query.callback) {
            this.body = util.format('%s(%s)', query.callback, JSON.stringify(payload));
        }
        else {
            this.body = JSON.stringify(payload);
        }
    })
    .get('/sts', function *(next){
        var stsClient = new STS({
            credentials: kCredentials,
            region: kRegion,
            protocol: 'http'
        });
        var res = yield stsClient.getSessionToken(6000, {
            accessControlList: [{
                service: 'bce:bos',
                resource: ['bce-javascript-sdk-demo-test'],
                region: '*',
                effect: 'Allow',
                permission: ['READ', 'WRITE']
            }]
        });
        this.body = JSON.stringify(res.body);
    });

app.use(router.routes())
    .use(router.allowedMethods());

app.listen(3000);
console.log('Server is running...');