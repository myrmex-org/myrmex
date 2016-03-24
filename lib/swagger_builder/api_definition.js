'use strict';

var fs = require('fs')
  , _ = require('lodash')
  , Promise = require('bluebird');

/**
 * Constructor function
 *
 * @param Object swagger - swagger definition
 * @param Object config
 * {
 *   name: "Back Office API",
 *   identifier: "back-office",
 *   description: "The API used by the Back Office to administrate Zazcar",
 *   region: String,
 *   apiId: String,
 *   invokeRole: String
 * }
 */
var apiDefinition = function(swagger, config) {
  this.swagger = swagger;
  this.config = config;
  this.swagger.host = config.id + '.execute-api.' + config.region + '.amazonaws.com';
};


/**
 * Retrieve the id of the API in AWS API Gateway
 * If not found, a new API will be created
 * @return Promise
 */
apiDefinition.prototype.retrieveApiIdentifier = function() {
  // getRestApis()
  // Find API with the current name
  // If found, return the ID
  // If not found, create a new api and return the ID
};

/**
 * Returns the swagger definition
 * @return Object
 */
apiDefinition.prototype.getDefinition = function() {
  return this.swagger;
};


/**
 * Returns the api configuration
 * @return Object
 */
apiDefinition.prototype.getConfig = function() {
  return this.config;
};


/**
 * Write the definition in a file
 * @param OPTIONAL String stage - if set, write a swagger file that can be used for documentation
 * @return Promise
 */
apiDefinition.prototype.writeFile = function(stage) {
  var suffix = '';
  if (!stage) {
    suffix = '.deploy.' + this.config.id;
  } else {
    this.swagger.basePath = '/' + stage;
    this.swagger.info.title += ' ' + stage.toUpperCase();
    suffix = '.doc.' + stage;
  }
  var filePath = './swagger/swagger.' + this.config.identifier + suffix + '.json';
  return Promise.promisify(fs.writeFile)(filePath, JSON.stringify(this.getDefinition()))
  .then(function() {
    return filePath;
  });
};


/**
 * Convert a package.json file into a Swagger Info Object
 * http://swagger.io/specification/#infoObject
 * @param Object pkg - the content of a package.json file
 * @return Object apiDefinition
 */
apiDefinition.prototype.addPackageInfo = function(pkg) {
  this.swagger.info = {
    title: _.capitalize(pkg.name),
    description: pkg.description,
    version: pkg.version,
    contact: {
      name: pkg.author,
      url: pkg.homepage
    }
  };
  return this;
};


/**
 * Add a model definition to the document
 * @param String name - Model name
 * @param Object definition - Model definition
 * @return Object apiDefinition
 */
apiDefinition.prototype.addModelDefinition = function(name, definition) {
  this.swagger.definitions[name] = definition;
  return this;
};


/**
 * Indicate if an endpoint definition applies to the API
 * @param Object endpointDefinition - definition of the endpoint
 * @return bool
 */
apiDefinition.prototype.doesExposeEndpoint = function(endpointDefinition) {
  return endpointDefinition['x-zazcar']
      && endpointDefinition['x-zazcar'].apis
      && endpointDefinition['x-zazcar'].apis.indexOf(this.config.identifier) > -1;
};


/**
 * Append an endpoint definition a function
 * @param Object endpoint - array containing the path and the method of the endpoint
 * @param Object endpointDefinition - definition of the endpoint
 * @param Object integrationData - result from the Lambda function deployment or HTTP proxy information
 * @return Object apiDefinition
 */
apiDefinition.prototype.appendEndpointDefinition = function(endpoint, endpointDefinition, integrationData) {
  if (this.doesExposeEndpoint) {
    // We construct the path definition
    var path = {};
    path[endpoint.path] = {};
    path[endpoint.path][endpoint.method.toLowerCase()] = this._enrichEndpointDefinition(endpointDefinition, integrationData);

    addCorsConfig(path[endpoint.path], endpoint.method.toLowerCase(), endpointDefinition.tags);

    _.merge(this.swagger.paths, path);
  }
  return this;
};


/**
 * Enrich a swagger endpoint definition with the data retreived
 * when creating or updating a Lambda
 * @param Object endpointDefinition - an endpoint definition
 * @param Object lambdaData - Lambda information
 * @return Object - enriched definition
 */
apiDefinition.prototype._enrichEndpointDefinition = function(endpointDefinition, integrationData) {
  if (integrationData.FunctionName) {
    // Case of a lambda function integration
    endpointDefinition.operationId = integrationData.FunctionName;
    endpointDefinition['x-amazon-apigateway-integration'].uri = 'arn:aws:apigateway:' + this.config.region + ':lambda:path/2015-03-31/functions/' + integrationData.FunctionArn + '/invocations';
  } else if (integrationData.HTTPProxyEndpointURL) {
    // Case of an HTTP Proxy integration
    endpointDefinition.operationId = integrationData.operationId;
    endpointDefinition['x-amazon-apigateway-integration'].uri = integrationData.HTTPProxyEndpointURL;
  }
  endpointDefinition['x-amazon-apigateway-integration'].credentials = this.config.invokeRole;
  return endpointDefinition;
};


/**
 * Add the "options" method to a path to enable CORS for methods other than "get"
 * @param Object pathDefinition - the path to modify
 * @return void
 */
function addCorsConfig(pathDefinition, method, tags) {
  var corsConfig = {
    responseHeaders: {
      "Access-Control-Allow-Headers": { "type": "string" },
      "Access-Control-Allow-Methods": { "type": "string" },
      "Access-Control-Allow-Origin": { "type": "string" }
    },
    integrationResponseParameters: {
      "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-amz-security-token'",
      "method.response.header.Access-Control-Allow-Methods": "'*'",
      "method.response.header.Access-Control-Allow-Origin": "'*'"
    }
  };

  // We add CORS response headers for every response code
  _.forOwn(pathDefinition[method].responses, function(response) {
    response.headers = response.headers || {};
    _.assign(response.headers, corsConfig.responseHeaders);
  });

  // We add CORS integration ResponseParameters for every response code
  _.forOwn(pathDefinition[method]['x-amazon-apigateway-integration'].responses, function(integrationResponse) {
    integrationResponse.responseParameters = integrationResponse.responseParameters || {};
    _.assign(integrationResponse.responseParameters, corsConfig.integrationResponseParameters);
  });

  if (!pathDefinition.options) {
    // We add an OPTION route to enable CORS for POST, PUT and DELETE methods
    pathDefinition.options = {
      "tags": tags,
      "summary": "Enable CORS",
      "description": "Enable CORS requests for methods POST, PUT and DELETE",
      "responses": {
        "200": {
          "headers": corsConfig.responseHeaders
        }
      },
      "x-amazon-apigateway-integration" : {
        "type" : "mock",
        "requestTemplates": {
          "application/json": "{ \"statusCode\" : 200 }"
        },
        "responses" : {
          "default" : {
            "statusCode" : "200",
            "responseParameters": corsConfig.integrationResponseParameters,
            "responseTemplates": {
              "application/json": null
            }
          }
        }
      }
    };
  }
}


module.exports = apiDefinition;
