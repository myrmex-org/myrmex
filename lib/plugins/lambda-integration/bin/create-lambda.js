const path = require('path');
const ncp = require('ncp');

module.exports = (program) => {
  program
    .command('create-lambda')
    .description('create a new lambda')
    .arguments('[lambda-identifier]')
    .action(function (lambdaIdentifier) {
      lambdaIdentifier = lambdaIdentifier || 'new-lambda';
      const src = __dirname + '/template-create';
      const dst = path.join(process.cwd(), 'lambdas', lambdaIdentifier);
      ncp(src, dst, (e) => {
        if (e) { return console.error(e); }
        console.log('New lambda created');
      });
    });

};
