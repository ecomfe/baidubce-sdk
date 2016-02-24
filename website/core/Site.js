/**
 * @providesModule Site
 * @jsx React.DOM
 */

var React = require('React');
var HeaderLinks = require('HeaderLinks');

var Site = React.createClass({
  render: function() {
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
          <title>Baidu Cloud Engine JavaScript SDK</title>
          <meta name="viewport" content="width=device-width" />
          <link rel="stylesheet" href="/bce-sdk-js/css/draft.css" />
          <script type="text/javascript" src="//use.typekit.net/vqa1hcx.js"></script>
          <script type="text/javascript">{'try{Typekit.load();}catch(e){}'}</script>
        </head>
        <body>

          <div className="container">
            <div className="nav-main">
              <div className="wrap">
                <a className="nav-home" href="/bce-sdk-js/">
                  bce-sdk-js
                </a>
                <HeaderLinks section={this.props.section} />
              </div>
            </div>

            {this.props.children}

            <footer className="wrap">
              <div className="right">© 2016 Baidu Inc.</div>
            </footer>
          </div>
        </body>
      </html>
    );
  }
});

module.exports = Site;
