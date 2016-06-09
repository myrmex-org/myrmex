'use strict';

const lager = require('@lager/lager/lib/lager');

module.exports = function(program) {
  return program
  .command('inspect-endpoint <HTTP_METHOD> <resourcePath>')
  .description('inspect an endpoint specification')
  .option('-c, --colors', 'output with colors')
  .action((method, resourcePath, options) => {
    lager.getPlugin('api-gateway').getEndpointSpec(method, resourcePath, options.colors);
  });
};
