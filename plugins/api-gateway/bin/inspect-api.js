'use strict';

const lager = require('@lager/lager/lib/lager');
const program = lager.getProgram();

program
  .command('inspect-api <api-identifier>')
  .description('inspect an api specification')
  .option('-c, --colors', 'output with colors')
  .action((apiIdentifier, options) => {
    lager.getPlugin('api-gateway').outputApiSpec(apiIdentifier, options.colors);
  });
