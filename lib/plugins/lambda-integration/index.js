'use strict';

// @TODO this plugin should evolve to use an architecture similar to Lager/Api/Endpoint

// @TODO find a nice way to make the Lager instance accessible here
let lager = require('../../lager');
let Promise = lager.getPromise();
let environment = lager.getEnvironment();
let region = lager.getAWSRegion();

let LambdaBuilder = require('./legacy-lambda-builder');
let lambdaBuilder = new LambdaBuilder({ region: region, environment: environment });

module.exports = {

  /**
   * This hook perform the deployment of lambdas in AWS and return integration data
   * that will be used to configure the related endpoints
   * @param  {Array} integrationResults - the collection of integration results
   *                                      we will add our own integrations results
   *                                      to this array
   * @return {Promise<Array>}
   */
  loadIntegrations: function loadIntegrations(integrationResults) {
    // Instead of simply perform "lambdaBuilder.deployAll()",
    // we should create lambda instances and call lambda.deploy() for every lambda
    return lambdaBuilder.deployAll('./lambdas')
    .then((results) => {
      // Transform the results from the legacy-lambda-builder into integration results
      console.log(results);
      return Promise.resolve(results);
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
