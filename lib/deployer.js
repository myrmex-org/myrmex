'use strict';

var _ = require('lodash')
  , Promise = require('bluebird')
  , file = require('file')
  , iamBuilder = require('./iam_builder')
  , LambdaBuilder = require('./lambda_builder')
  , SwaggerBuilder = require('./swagger_builder');


/* istanbul ignore next */
/**
 * Function performing a complete deployment:
 *  - AIM policies
 *  - AIM roles
 *  - Lambda functions
 *  - Swagger specification generation
 * @param  region
 * @param  environment
 * @param  stage
 * @param  Bool simulate - If set, the deployment is not performed and a sample swagger specification is generated
 * @return Promise
 */
module.exports = function(region, environment, stage, simulate) {

  /**
   * Initialise the modules to deploy Lambdas and generate swagger specifications
   */
  var lambdaBuilder = new LambdaBuilder({ region: region, environment: environment });
  var swaggerBuilder = new SwaggerBuilder({ region: region, environment: environment });

  /**
   * Variable to mesure performances
   */
  var t = process.hrtime();

  var iamRoleResponses = [];
  var lambdaDeployResponses = [];
  var apiSpecifications = [];
  var endpointSpecifications = [];

  // Deploy IAM policies and roles functions
  logTitle('Deploying IAM policies and roles');
  return iamBuilder.deployAll('./iam', { environment: environment })
  .then(function(responses) {
    iamRoleResponses = responses;
    // Deploy lambda
    logTitle('Deploying Lambda functions');
    return lambdaBuilder.deployAll('./lambdas');
  })
  .then(function(responses) {
    lambdaDeployResponses = responses;
    // Initialize API specifications
    logTitle('Initializing Swagger API specifications');
    return swaggerBuilder.initAllSpecifications('./apis');
  })
  .then(function(specifications) {
    apiSpecifications = specifications;
    // Initialize endpoints specifications
    logTitle('Initializing Swagger endpoint specifications');
    return swaggerBuilder.initAllEndpointSpecifications('endpoints');
  })
  .then(function(specifications) {
    endpointSpecifications = specifications;
    // Add lambda integration hooks to lambda endpoints
    swaggerBuilder.addLambdaIntegrationHooks(lambdaDeployResponses, endpointSpecifications);
    // Add endpoint specifications to API specifications
    logTitle('Add endpoints to Swagger API specifications');
    return swaggerBuilder.addEndpointsToApisSpecifications(apiSpecifications, endpointSpecifications);
  })
  .then(function() {
    // Save the swagger documents on the filesystem
    // Run the functions in serie
    logTitle('Writting Swagger specifications files');
    return Promise.mapSeries(apiSpecifications, function (apiSpecification) {
      console.log(' * Generation of Swagger files for \x1b[0;36m' + apiSpecification.getConfig().identifier + '\x1b[0m');
      return apiSpecification.writeFile(true, stage)
      .then(function(filePath) {
        console.log('   * API deployment file generated: \x1b[0;36m' + filePath + '\x1b[0m');
        return apiSpecification.writeFile(false, stage);
      })
      .then(function(filePath) {
        console.log('   * API documentation file generated: \x1b[0;36m' + filePath + '\x1b[0m\n');
      });
    });
  })
  .then(function() {
    logTitle('Lambda deployment and Swagger generation done');
  })
  .catch(function(err) {
    console.log(err, err.stack);
    process.exit(1);
  });

};


function logTitle(title) {
  console.log('\x1b[0;32m');
  console.log('    ######################################################');
  console.log('    #                                                    #');
  console.log('    # ' + _.padEnd(title, 50) + ' #');
  console.log('    #                                                    #');
  console.log('    ######################################################');
  console.log('\x1b[0m');
}
