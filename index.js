'use strict';

var lager = require('./lib/lager.js');
var lambdaIntegration = require('./lib/plugins/lambda-integration');

// Add the lambda integration plugin to Lager
lager.registerPlugin(lambdaIntegration);

// Retrieve the configuration from environment variables
var region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
var stage = process.env.API_GATEWAY_STAGE || 'NO_STAGE';
var environment = process.env.NODE_ENV || 'NO_ENV';

module.exports = {
  deploy: function() {
    lager.deploy(region, environment, stage);
  }
};
