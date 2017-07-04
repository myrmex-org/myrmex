'use strict';

const dataAccess = require('data-access');

module.exports.handler = function(event, context, cb) {
  console.log('Callback Lambda');
  const data = dataAccess.get(event.id);
  if (event.success) {
    cb(null, data);
  } else {
    console.log('XXXXXXXXX');
    cb(new Error('Callback Lambda error'), null);
  }
};
