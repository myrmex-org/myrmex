'use strict';

module.exports.handler = function(event, context, cb) {
  if (event.password.length < 6) {
    return cb(new Error('Password must be 6 character long minimum'));
  }
  cb(undefined, 'cryptographed password');
};
