'use strict';

const _ = require('lodash');

let LambdaIntegrationDataInjector = function LambdaIntegrationDataInjector(lambdaData) {
  this.lambdaData = lambdaData;
};


LambdaIntegrationDataInjector.prototype.applyToEnpoint = function applyToEnpoint(endpoint) {
  // @TODO inject data
  let spec = endpoint.getSpec();
  if (spec['x-lager'] && spec['x-lager'].lambda && spec['x-lager'].lambda === this.lambdaData.FunctionName) {
    spec['x-amazon-apigateway-integration'].type = 'aws';
    spec['x-amazon-apigateway-integration'].uri = 'arn:aws:apigateway:'
                                                + this.lambdaData.FunctionArn.split(':')[3]
                                                + ':lambda:path/2015-03-31/functions/'
                                                + this.lambdaData.FunctionArn
                                                + '/invocations';
  }
  console.log(this.lambdaData, endpoint);
  console.log('*********************');
  return endpoint;
};

module.exports = LambdaIntegrationDataInjector;
