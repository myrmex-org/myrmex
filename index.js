'use strict';

var deployer = require('./lib/deployer.js');


/**
 * Retrieve the configuration from environment variables
 */
var region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
var stage = process.env.API_GATEWAY_STAGE || 'NO_STAGE';


module.exports = {
  deploy: function() {
    deployer(region, stage);
  }
};
