'use strict';

const lager = require('lager/lib/lager');
const program = lager.getProgram();

program
  .command('inspect-endpoint <HTTP_METHOD> <resourcePath>')
  .description('inspect an endpoint specification')
  .option('-c, --colors', 'output with colors')
  .action((method, resourcePath, options) => {
    lager.getPlugin('api-gateway').outputEndpointSpec(method, resourcePath, options.colors);
  });
