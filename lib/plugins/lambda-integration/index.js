'use strict';

// @TODO find a nice way to make the Lager instance accessible here
const lager = require('lager/lib/lager');

const path = require('path');
const Promise = lager.getPromise();
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');

const Lambda = require('./lambda');

let environment = lager.getEnvironment();
let region = lager.getAWSRegion();

// let LambdaBuilder = require('./legacy-lambda-builder');
// let lambdaBuilder = new LambdaBuilder({ region: region, environment: environment });


function loadLambdas() {
  let lambdaConfigsPath = path.join(process.cwd(), 'lambdas');

  // This event allows to inject code before loading all APIs
  return lager.fire('beforeLambdasLoad')
  .then(() => {
    // Retrieve configuration path of all API specifications
    return fs.readdirAsync(lambdaConfigsPath);
  })
  .then((subdirs) => {
    // Load all the lambda configurations
    var lambdaPromises = [];
    _.forEach(subdirs, (subdir) => {
      let lambdaConfigPath = path.join(lambdaConfigsPath, subdir, 'config');
      // subdir is the identifier of the Lambda, so we pass it as the second argument
      lambdaPromises.push(loadLambda(lambdaConfigPath, subdir));
    });
    return Promise.all(lambdaPromises);
  })
  .then((lambdas) => {
    // This event allows to inject code to add or delete or alter lambda configurations
    return lager.fire('beforeLambdasLoad', lambdas);
  })
  .spread((lambdas) => {
    return Promise.resolve(lambdas);
  });
}

function loadLambda(lambdaConfigPath, identifier) {
  return lager.fire('beforeLambdaLoad', lambdaConfigPath, identifier)
  .spread((lambdaConfigPath, identifier) => {
    // Because we use require() to get the config, it could either be a JSON file
    // or the content exported by a node module
    let lambdaConfig = require(lambdaConfigPath);

    // If the handler path is not specified, we consider it is the same that the config path
    lambdaConfig.handlerPath = lambdaConfig.handlerPath || path.dirname(lambdaConfigPath);

    // If the identifier is not specified, it will be the name of the directory that contains the config
    lambdaConfig.identifier = lambdaConfig.identifier || identifier;

    let lambda = new Lambda(lambdaConfig, { region: lager.getAWSRegion() });

    // This event allows to inject code to alter the Lambda configuration
    return lager.fire('AfterLambdaLoad', lambda);
  })
  .spread((lambda) => {
    return Promise.resolve(lambda);
  });
}

let lambdas = [];

module.exports = {
  name: 'LambdaIntegrationHook',

  /**
   * This hook load all lambda configurations
   * @return {Boolean}
   */
  beforeApisLoad: function beforeApisLoad() {
    return loadLambdas()
    .then((loadedLambdas) => {
      lambdas = loadedLambdas;
      return Promise.resolve([]);
    });
  },

  /**
   * This hook perform the deployment of lambdas in AWS and return integration data
   * that will be used to configure the related endpoints
   * @param  {Array} integrationResults - the collection of integration results
   *                                      we will add our own integrations results
   *                                      to this array
   * @return {Promise<Array>}
   */
  loadIntegrations: function loadIntegrations(integrationResults) {
    return Promise.map(lambdas, (lambda) => {
      return lambda.deploy();
    });
  },

  /**
   * When the APIs have been deployed, we should cleanup the Lambda environment
   * and delete the lambdas that are not used anymore
   * @return {[type]} [description]
   */
  afterDeployAll: function afterDeployAll() {
    return Promise.resolve();
  }

};
