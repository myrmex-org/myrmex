'use strict';

module.exports.handler = function(event, context, cb) {
  if (event.success) {
    console.log('Success');
    context.succeed('A successful Lambda execution');
  } else {
    console.log('Failure');
    context.fail(new Error('An error should occur here'));
  }
};
