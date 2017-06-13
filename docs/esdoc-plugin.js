'use strict';

exports.onHandleHTML = function(ev) {
  ev.data.html = ev.data.html.replace(
    '</head>',
    `<link rel="icon" type="image/png" sizes="32x32" href="manual/asset/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="manual/asset/favicon-16x16.png">`
  );

  ev.data.html = ev.data.html.replace(
    '<header>',
    '<header><a href="./index.html" class="myrmex-home">Myrmex</a>'
  )

  ev.data.html = ev.data.html.replace(
    'script/prettify/prettify.js',
    'http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/highlight.min.js'
  );
  ev.data.html = ev.data.html.replace(
    'css/prettify-tomorrow.css',
    'http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/tomorrow-night.min.css'
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
