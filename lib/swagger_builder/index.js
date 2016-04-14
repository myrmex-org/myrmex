'use strict';

var AWS = require('aws-sdk')
  , fs = require('fs')
  , path = require('path')
  , file = require('file')
  , _ = require('lodash')
  , Promise = require('bluebird')
  , ApiSpecification = require('./api_specification')
  , EndpointSpecification = require('./endpoint_specification')
  , apiGatewayHelperFn = require('./api_gateway_helper');


AWS.config.apiVersions = {
  apigateway: '2015-07-09',
  iam: '2010-05-08'
};
var apiGateway;
var apiGatewayHelper;
var iam;

/**
 * Constructor function
 *
 * @param Object options
 * {
 *   credentials: Object AWS.Credentials
 *   region: String,
 *   environment: String
 * }
 */
var swaggerBuilder = function(options) {
  this.environment = options.environment;
  delete(options.environment);
  apiGateway = new AWS.APIGateway(options);
  apiGatewayHelper = apiGatewayHelperFn(apiGateway);
  iam = new AWS.IAM();
};


swaggerBuilder.prototype.initAllSpecifications = function(pathToApiDir) {
  // Retrieve api configuration directories
  var apiPaths = _.map(fs.readdirSync(pathToApiDir), function(dirName) {
    return pathToApiDir + '/' + dirName;
  });

  // Run the functions in serie
  return Promise.mapSeries(apiPaths, function(apiPath) {
    return this.initSpecification(apiPath);
  }.bind(this));
};


/**
 * Construct and returns an API specification
 * @param String pathToApi
 */
swaggerBuilder.prototype.initSpecification = function(pathToApi) {
  // @TODO refactor this to delete "config" and only use the "baseDef"
  // Implementing EventEmitter should allow to inject customisation programatically
  var config = require(process.cwd() + '/' + pathToApi + '/config');
  config.identifier = path.basename(pathToApi);
  console.log(' * Initializing specification of \x1b[0;36m' + config.name + '\x1b[0m');

  // Retrieve the current API in AWS using config.name
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
    var specification = new ApiSpecification(baseDef, config);

    // @TODO add only necessary models (AKA when an endpoint is added)
    var modelFiles = fs.readdirSync('./swagger/models/');
    modelFiles.forEach(function(fileName) {
      if (/\.json$/.test(fileName)) {
        specification.addModelDefinition(_.capitalize(fileName.substr(0, fileName.length - 5)), require(process.cwd() + '/swagger/models/' + fileName));
      }
    });
    return specification;
  });
};


/**
 * [function description]
 * @param  {String} pathToEnpointsDir
 * @return Array the list of all endpoints
 */
swaggerBuilder.prototype.initAllEndpointSpecifications = function(pathToEnpointsDir) {
  var endpointsSpecifications = [];
  file.walkSync(pathToEnpointsDir, function(dirPath, dirs, files) {
    var pathParts = dirPath.split('/');
    var method = pathParts.pop();
    if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method)) return;

    // We remove the first part of the path which is the name of the directory that contains the endpoints
    pathParts.shift();
    var path = pathParts.join('/');

    var swagger = aggregateSpecifications(pathToEnpointsDir, dirPath);

    var integrationHook;
    if (swagger['x-amazon-apigateway-integration'].type === 'HTTP' && files.indexOf('integration.js')) {
      integrationHook = Promise.promisify(require(process.cwd() + '/' + dirPath + '/httpProxy.js'));
    }

    endpointsSpecifications.push(new EndpointSpecification(
      method,
      path,
      aggregateSpecifications(pathToEnpointsDir, dirPath),
      integrationHook
    ));
  });
  return endpointsSpecifications;
};


/**
 * [function description]
 * @param  {[type]} lambdaDeployResponses  [description]
 * @param  {[type]} endpointSpecifications [description]
 */
swaggerBuilder.prototype.addLambdaIntegrationHooks = function(lambdaDeployResponses, endpointSpecifications) {
  _.forEach(endpointSpecifications, function(endpointSpecification) {
    // If the endpoint has a lambda integration, we add an integration hook based on the results of the deployment
    var swagger = endpointSpecification.getSpecification();

    if (swagger['x-amazon-apigateway-integration'].type === 'aws' && swagger['x-lager'] && swagger['x-lager'].lambda) {
      var lambdaDeployResponse = _.find(lambdaDeployResponses, function(response) {
        return response.FunctionName === this.environment + '_' + swagger['x-lager'].lambda;
      }.bind(this));
      if (!lambdaDeployResponse) {
        throw new Error(endpointSpecification.getMethod() + ' ' + endpointSpecification.getPath() + ' is associated with a Lambda that is not defined (' + swagger['x-lager'].lambda + ')');
      }

      endpointSpecification.setIntegrationHook(function(swagger) {
        swagger['x-amazon-apigateway-integration'].uri = 'arn:aws:apigateway:' + lambdaDeployResponse.FunctionArn.split(':')[3] + ':lambda:path/2015-03-31/functions/' + lambdaDeployResponse.FunctionArn + '/invocations';
        return retrieveRoleArn(swagger['x-lager'].lambdaInvocationRole, this.environment)
        .then(function(invocationRoleArn) {
          swagger['x-amazon-apigateway-integration'].credentials = invocationRoleArn;
          return Promise.resolve(swagger);
        });
      }.bind(this));
    }
  }.bind(this));
};


/**
 * [function description]
 * @param  {[type]} apiSpecifications      [description]
 * @param  {[type]} endpointSpecifications [description]
 */
swaggerBuilder.prototype.addEndpointsToApisSpecifications = function(apiSpecifications, endpointSpecifications) {
  return Promise.map(endpointSpecifications, function(endpointSpecifications) {
    return endpointSpecifications.execIntegrationHook();
  })
  .then(function() {
    _.forEach(apiSpecifications, function(apiSpecification) {
      _.forEach(endpointSpecifications, function(endpointSpecification) {
        apiSpecification.addEndpointSpecification(endpointSpecification);
      });
    });
    return Promise.resolve(apiSpecifications);
  });
};


/**
 * Static method that aggregates the definitions found in all swagger.json files in a path
 * @param String beginPath - path from which the function will look for swagger.json files
 * @param String endPath -path until which the function will look for swagger.json files
 * @return Object - aggregation of definitions that have been found
 */
function aggregateSpecifications(beginDir, endDir) {
  // Retrieve paths to all swagger.json that have to be aggregated
  var embedDirs = endDir.substr(beginDir.length + 1).split('/');
  var def = {};
  var fileContent = '';
  var next = true;
  console.log(beginDir, embedDirs);
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
}


/* istanbul ignore next */
/**
 * Retrieve a role Arn from a identifier that can be either the ARN or the name
 * @param  String identifier - The name or the ARN of the role
 * @return Promise
 */
function retrieveRoleArn(identifier, environment) {
  if (/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+]/.test(identifier)) {
    return Promise.resolve(identifier);
  }
  return Promise.promisify(iam.getRole.bind(iam))({ RoleName: identifier })
  .then(function(data) {
    return Promise.resolve(data.Role.Arn);
  })
  .catch(function(e) {
    if (e && environment) {
      return retrieveRoleArn(environment + '_' + identifier);
    }
    return Promise.reject(e);
  });
}


module.exports = swaggerBuilder;
