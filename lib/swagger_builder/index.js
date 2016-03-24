'use strict';

var AWS = require('aws-sdk')
  , fs = require('fs')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , ApiDefinition = require('./api_definition')
  , apiGatewayHelperFn = require('./api_gateway_helper');


AWS.config.apiVersions = {
  apigateway: '2015-07-09'
};
var namePrefix = '';
var apiGateway;
var apiGatewayHelper;

/**
 * Constructor function
 *
 * @param Object options
 * {
 *   credentials: Object AWS.Credentials
 *   region: String
 *   namePrefix: String
 * }
 */
var swaggerBuilder = function(options) {
  namePrefix = options.namePrefix || 'NO-PREFIX';
  apiGateway = new AWS.APIGateway(options);
  apiGatewayHelper = apiGatewayHelperFn(apiGateway);
};


swaggerBuilder.prototype.initAllDefinitions = function(pathToApiDir) {
  // Retrieve api configuration directories
  var apiPaths = _.map(fs.readdirSync(pathToApiDir), function(dirName) {
    return pathToApiDir + '/' + dirName;
  });

  // Run the functions in serie
  return Promise.mapSeries(apiPaths, function(apiPath) {
    return this.initDefinition(apiPath);
  }.bind(this));
};


/**
 * Construct and returns an API definition
 *
 * @param String pathToApi
 */
swaggerBuilder.prototype.initDefinition = function(pathToApi) {
  var config = require(process.cwd() + '/' + pathToApi + '/config');
  console.log(' * Initializing definition of \x1b[0;36m' + config.name + '\x1b[0m');

  // Retrieve the current API using config.name
  return apiGatewayHelper.getApiByName(config.name)
  .then(function(api) {
    if (!api) {
      // If the API was not found, we create it
      console.log('   * The API \x1b[0;36m' + config.name + '\x1b[0m will be created');
      return Promise.promisify(apiGateway.createRestApi.bind(apiGateway))(config);
    } else {
      console.log('   * The API \x1b[0;36m' + config.name + '\x1b[0m already exists');
      return Promise.resolve(api);
    }
  })
  .then(function(api) {
    config.id = api.id;
    console.log('   * The API \x1b[0;36m' + api.name + '\x1b[0m has the ID \x1b[0;36m' + api.id + '\x1b[0m');
    return Promise.promisify(fs.readFile)(pathToApi + '/base.json', 'utf-8');
  })
  .then(function(fileContent) {
    var baseDef = JSON.parse(fileContent);
    var definition = new ApiDefinition(baseDef, config);

    // @TODO add only necessary models (AKA when an endpoint is added)
    var modelFiles = fs.readdirSync('./swagger/models/');
    modelFiles.forEach(function(fileName) {
      if (/\.json$/.test(fileName)) {
        definition.addModelDefinition(_.capitalize(fileName.substr(0, fileName.length - 5)), require(process.cwd() + '/swagger/models/' + fileName));
      }
    });
    return definition;
  });
};


/**
 * Static method that aggregates the definitions found in swagger.json files in a path
 *
 * @param String beginPath - path from which the function will look for swagger.json files
 * @param String endPath -path until which the function will look for swagger.json files
 * @return Object - aggregation of definitions that have been found
 */
swaggerBuilder.prototype.aggregateDefinitions = function(beginDir, endDir) {
  // Retrieve paths to all swagger.json that have to be aggregated
  var embedDirs = endDir.substr(beginDir.length + 1).split('/');
  var def = {};
  var fileContent = '';
  var next = true;
  while (next) {
    try {
      fileContent = fs.readFileSync(beginDir + '/swagger.json', 'utf8');
    } catch (e) {
      // If the file does not exists, a exception will be triggered
      fileContent = '{}';
    }
    // If a JSON parsing error occurs, the Exception has to be thrown
    def = _.merge(def, JSON.parse(fileContent));
    if (embedDirs.length > 0) {
      beginDir += '/' + embedDirs.shift();
    } else {
      next = false;
    }
  }
  return def;
};


module.exports = swaggerBuilder;
