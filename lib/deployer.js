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
 *  - Swagger definition generation
 * @param  region
 * @param  stage
 * @param  Bool simulate - If set, the deployment is not performed and a sample swagger definition is generated
 * @return Promise
 */
module.exports = function(region, stage, simulate) {
  /**
   * Initialise the modules to deploy Lambdas and generate swagger definitions
   */
  var lambdaBuilder = new LambdaBuilder({ region: region, namePrefix: stage });
  var swaggerBuilder = new SwaggerBuilder({ region: region });

  /**
   * Variable to mesure performances
   */
  var t = process.hrtime();

  var iamRoleResponses = [];
  var lambdaDeployResponses = [];
  var apiDefinitions = [];

  // Deploy IAM policies and roles functions
  logTitle('Deploying IAM policies and roles');
  return iamBuilder.deployAll('./iam', { namePrefix: stage })
  .then(function(responses) {
    iamRoleResponses = responses;
    // Deploy lambda definitions
    logTitle('Deploying Lambda functions');
    return lambdaBuilder.deployAll('./lambdas');
  })
  .then(function(responses) {
    lambdaDeployResponses = responses;
    // Initialize API definitions
    logTitle('Initializing Swagger definitions');
    return swaggerBuilder.initAllDefinitions('./apis');
  })
  .then(function(definitions) {
    apiDefinitions = definitions;
    // Complete API definitions with Lambda deployment responses
    logTitle('Appending endpoints to Swagger definitions');
    return createEndpointDefinitions(swaggerBuilder, apiDefinitions, lambdaDeployResponses, stage);
  })
  .then(function() {
    // Save the swagger documents on the filesystem
    // Run the functions in serie
    logTitle('Writting Swagger definitions files');
    return Promise.mapSeries(apiDefinitions, function (apiDefinition) {
      console.log(' * Generation of Swagger files for \x1b[0;36m' + apiDefinition.getConfig().identifier + '\x1b[0m');
      return apiDefinition.writeFile()
      .then(function(filePath) {
        console.log('   * API deployment file generated: \x1b[0;36m' + filePath + '\x1b[0m');
        return apiDefinition.writeFile(stage);
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



function createEndpointDefinitions(swaggerBuilder, apiDefinitions, lambdaDeployResponses, stage) {
  var endpointsRootDir = 'endpoints';
  var supportedHttpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  file.walkSync(endpointsRootDir, function(dirPath, dirs, files) {
    var pathParts = dirPath.split('/');
    var method = pathParts.pop();

    // Shortcut if the directory is not an endpoint
    if (supportedHttpMethods.indexOf(method) === -1) return;

    // @TODO create a module to handle endpoints behaviors
    var endpoint = parseDirPath(dirPath);
    var endpointDefinition = swaggerBuilder.aggregateDefinitions(endpointsRootDir, dirPath);
    // @TODO cleanup this "stage" thing
    endpointDefinition['x-zazcar'].lambda = stage + '_' + endpointDefinition['x-zazcar'].lambda;
    console.log(' * The endpoint \x1b[0;36m' + _.padEnd(endpoint.method, 7) + endpoint.path + '\x1b[0m');
    if (files.indexOf('httpProxy.js') !== -1) {
      // If we found a httpProxy.js file, we get the endpoint configuration and complete the swagger definition
      var proxyConfig = require(process.cwd() + '/' + dirPath + '/httpProxy.js');
      console.log('   * will proxify \x1b[0;36m' + proxyConfig.HTTPProxyEndpointURL + '\x1b[0m');
      appendEndpoint(apiDefinitions, endpoint, endpointDefinition, proxyConfig);
    } else if (files.indexOf('index.js') !== -1) {
      // If we find an index.js file, we retrieve the function associated to the endpoint
      var lambdaDeployResponse = _.find(lambdaDeployResponses, function(response) {
        return response.FunctionName === endpointDefinition['x-zazcar'].lambda;
      });
      if (!lambdaDeployResponse) {
        throw new Error(endpoint.method + ' ' + endpoint.path + ' is associated with a Lambda that is not defined (' + endpointDefinition['x-zazcar'].lambda + ')');
      }
      console.log('   * will invoke the lambda \x1b[0;36m' + lambdaDeployResponse.FunctionName + '\x1b[0m');
      appendEndpoint(apiDefinitions, endpoint, endpointDefinition, lambdaDeployResponse);
    } else {
      console.log('   * \x1b[0;33m has no integration defined \x1b[0m');
    }
    console.log('');
  });
  return true;
}

function appendEndpoint(apiDefinitions, endpoint, definition, integrationData) {
  var addedToAnAPI = false;
  apiDefinitions.map(function(apiDefinition) {
    if (apiDefinition.doesExposeEndpoint(definition)) {
      addedToAnAPI = true;
      console.log('   * applies to \x1b[0;36m' + apiDefinition.config.name + '\x1b[0m');
      apiDefinition.appendEndpointDefinition(endpoint, definition, integrationData);
    }
  });
  if (!addedToAnAPI) {
    console.log('   * \x1b[0;33mdoes not apply to any API\x1b[0m');
  }
}

/**
 * Clean the directory path to an endpoint definition to extract
 * the API path and the HTTP method
 *
 * @param String dirPath
 * @return Object
 * {
 *   path: '/path/to/resource'
 *   method: GET|POST|PUT|DELETE
 * }
 */
function parseDirPath(dirPath) {
  var pathParts = dirPath.split('/');

  // We remove the first part of the path which is the name
  // of the directory that contains the endpoints
  pathParts.shift();

  // We retrieve the last part of the path which is the http method
  var method = pathParts.pop();

  return {
    path: '/' + pathParts.join('/'),
    method: method
  };
}


function logTitle(title) {
  console.log('\x1b[0;32m');
  console.log('    ######################################################');
  console.log('    #                                                    #');
  console.log('    # ' + _.padEnd(title, 50) + ' #');
  console.log('    #                                                    #');
  console.log('    ######################################################');
  console.log('\x1b[0m');
}
