"use strict";

var compression = require('compression');
var connect = require('connect');
var convert = require('./convert.js');
var errorHandler = require('errorhandler');
var http = require('http');
var morgan = require('morgan');
var optimist = require('optimist');
var path = require('path');
var reactMiddleware = require('react-page-middleware');
var serveFavicon = require('serve-favicon');
var serveStatic = require('serve-static');

var argv = optimist.argv;

var PROJECT_ROOT = path.resolve(__dirname, '..');
var FILE_SERVE_ROOT = path.join(PROJECT_ROOT, 'src');

var port = argv.port;
if (process.argv[1] === path.resolve(__dirname, 'generate.js')) {
  // Using a different port so that you can publish the website
  // and keeping the server up at the same time.
  port = 8079;
}

var buildOptions = {
  projectRoot: PROJECT_ROOT,
  pageRouteRoot: FILE_SERVE_ROOT,
  useBrowserBuiltins: false,
  logTiming: true,
  useSourceMaps: true,
  ignorePaths: function(p) {
    return p.indexOf('__tests__') !== -1;
  },
  serverRender: true,
  dev: argv.dev !== 'false',
  static: true
};

var app = connect()
  .use(function(req, res, next) {
    // convert all the md files on every request. This is not optimal
    // but fast enough that we don't really need to care right now.
    convert();
    next();
  })
  .use(reactMiddleware.provide(buildOptions))
  .use(serveStatic(FILE_SERVE_ROOT))
  // .use(serveFavicon(path.join(FILE_SERVE_ROOT, 'elements', 'favicon', 'favicon.ico')))
  .use(morgan('combined'))
  .use(compression())
  .use(errorHandler());

var portToUse = port || 8080;
var server = http.createServer(app);
server.listen(portToUse);
console.log('Open http://localhost:' + portToUse + '/bce-sdk-js/index.html');
module.exports = server;
