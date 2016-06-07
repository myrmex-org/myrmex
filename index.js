'use strict';

const lager = require('./lib/lager.js');

// Add the lambda integration plugin to Lager
// @TODO plugins should be auto-registered
const lambdaIntegration = require('./lib/plugins/lambda-integration');
lager.registerPlugin(lambdaIntegration);

module.exports = lager;
