'use strict';

exports.onHandleHTML = function(ev) {
  // Add favicon
  ev.data.html = ev.data.html.replace(
    '</head>',
    `<link rel="icon" type="image/png" sizes="32x32" href="manual/asset/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="manual/asset/favicon-16x16.png">`
  );

  // Add logo in header
  ev.data.html = ev.data.html.replace(
    '<header>',
    '<header><a href="./" class="myrmex-home">Myrmex</a>'
  )
  
  // Remove prettify because we use highlight.js
  ev.data.html = ev.data.html.replace(
    '<script src="script/prettify/prettify.js"></script>',
    ''
  );
  ev.data.html = ev.data.html.replace(
    '<link type="text/css" rel="stylesheet" href="css/prettify-tomorrow.css">',
    ''
  );
  ev.data.html = ev.data.html.replace(
    '<script src=\"script/pretty-print.js\"></script>',
    '<script>hljs.initHighlightingOnLoad();</script></head>'
  );
  const codeOpen = /<code class="lang-([a-zA-Z0-9_-]+)">\s*<code class="source-code prettyprint">/g;
  const codeClose = /<\/code>\s*<\/code>/g
  ev.data.html = ev.data.html.replace(codeOpen, '<code class="$1">');
  ev.data.html = ev.data.html.replace(codeClose, '</code>');
};
