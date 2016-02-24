/**
 * @providesModule HeaderLinks
 * @jsx React.DOM
 */

var HeaderLinks = React.createClass({
  links: [
    {section: 'docs', href: '/bce-sdk-js/docs/overview.html#content', text: '文档'},
    {section: 'github', href: 'http://github.com/baidubce/bce-sdk-js', text: '源码'},
    {section: 'bce', href: 'https://bce.baidu.com/index.html', text: '百度开放云'},
  ],

  render: function() {
    return (
      <ul className="nav-site">
        {this.links.map(function(link) {
          return (
            <li key={link.section}>
              <a
                href={link.href}
                className={link.section === this.props.section ? 'active' : ''}>
                {link.text}
              </a>
            </li>
          );
        }, this)}
      </ul>
    );
  }
});

module.exports = HeaderLinks;
