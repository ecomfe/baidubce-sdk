store.js
========

store.js exposes a simple API for cross browser local storage

store.js depends on JSON for serialization.

Official site: https://github.com/marcuswestin/store.js

Usage
------

    edp import store

How does it work?
------------------
store.js uses localStorage when available, and falls back on the userData behavior in IE6 and IE7. No flash to slow down your page load. No cookies to fatten your network requests.
