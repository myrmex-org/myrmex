'use strict';

var fn = require('./index.js');

exports.handler = function(event, context) {
  fn(event, context.done);
};
