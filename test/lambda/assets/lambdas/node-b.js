'use strict';

module.exports.handler = function(event, context, cb) {
  if (event.password.length < 6) {
    return context.fail(new Error('Password must be 6 character long minimum'));
  }
  context.succeed('cryptographed password');
};
