/**
 * @providesModule Header
 * @jsx React.DOM
 */

var React = require('React');

var Header = React.createClass({
  slug: function(string) {
    return encodeURI(string.toLowerCase());
  },

  render: function() {
    var slug = this.slug(this.props.toSlug || this.props.children);
    var Heading = 'h' + this.props.level;

    return (
      <Heading {...this.props}>
        <a className="anchor" name={slug}></a>
        {this.props.children}
        {' '}<a className="hash-link" href={'#' + slug}>#</a>
      </Heading>
    );
  }
});

module.exports = Header;
