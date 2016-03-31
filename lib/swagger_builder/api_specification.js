'use strict';

var fs = require('fs')
  , _ = require('lodash')
  , Promise = require('bluebird');


/**
 * Constructor function
 *
 * @param Object swagger - swagger specification
 * @param Object config
 * {
 *   name: String,
 *   description: String,
 *   region: String,
 *   id: String,
 *   invokeRole: String
 * }
 */
var apiSpecification = function(swagger, config) {
  this.swagger = swagger;
  this.config = config;
  this.swagger.host = config.id + '.execute-api.' + config.region + '.amazonaws.com';
};


/**
 * Returns the swagger specification
 * @param  bool deploy  - if true, generate the file for the API importer
 *                        if false, generate the file for testing and documentation tools
 * @param  String stage - The stage to apply to the specification file
 * @return Object
 */
apiSpecification.prototype.getSpecification = function(deploy, stage) {
  var swaggerSpec = _.cloneDeep(this.swagger);

  if (deploy) {
    // JSON schema doesn't allow to have example as property, but swagger model does
    // https://github.com/awslabs/aws-apigateway-importer/issues/177
    _.forEach(swaggerSpec.specifications, function(specification) {
      delete(specification.example);
      _.forEach(specification.properties, function(property) {
        delete(property.example);
      });
    });
  } else {
    swaggerSpec.basePath = '/' + stage;
    swaggerSpec.info.title += ' ' + stage.toUpperCase();

  }

  return swaggerSpec;
};


/**
 * Returns the api configuration
 * @return Object
 */
apiSpecification.prototype.getConfig = function() {
  return this.config;
};


/**
 * Write the specification in a file
 * @param  bool deploy  - if true, generate the file for the API importer
 *                        if false, generate the file for testing and documentation tools
 * @param  String stage - The stage to apply to the specification file
 * @return Promise
 */
apiSpecification.prototype.writeFile = function(deploy, stage) {
  var fileNameParts = [
    this.config.identifier,
    this.config.id,
    stage,
    deploy ? 'deploy' : 'doc',
    'json'
  ];
  var filePath = './swagger/specifications/' + fileNameParts.join('.');
  return Promise.promisify(fs.writeFile)(filePath, JSON.stringify(this.getSpecification(deploy, stage)))
  .then(function() {
    return filePath;
  });
};


/**
 * Convert a package.json file into a Swagger Info Object
 * http://swagger.io/specification/#infoObject
 * @param Object pkg - the content of a package.json file
 * @return Object apiSpecification
 */
apiSpecification.prototype.addPackageInfo = function(pkg) {
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
 * @return Object apiSpecification
 */
apiSpecification.prototype.addModelDefinition = function(name, definition) {
  this.swagger.definitions[name] = definition;
  return this;
};


/**
 * Indicate if an endpoint definition applies to the API
 * @param Object endpointSpecification - definition of the endpoint
 * @return bool
 */
apiSpecification.prototype.doesExposeEndpoint = function(endpointSpecification) {
  var spec = endpointSpecification.getSpecification();
  return spec['x-lager']
      && spec['x-lager'].apis
      && spec['x-lager'].apis.indexOf(this.config.identifier) > -1;
};


/**
 * Add an endpoint specification a function
 * @param Object endpoint - array containing the path and the method of the endpoint
 * @param Object endpointDefinition - definition of the endpoint
 * @param Object integrationData - result from the Lambda function deployment or HTTP proxy information
 * @return Object apiSpecification
 */
apiSpecification.prototype.addEndpointSpecification = function(endpointSpecification) {
  if (this.doesExposeEndpoint(endpointSpecification)) {
    // We construct the path definition
    var path = {};
    path[endpointSpecification.getPath()] = {};
    path[endpointSpecification.getPath()][endpointSpecification.getMethod().toLowerCase()] = endpointSpecification.getSpecification();

    // @TODO Add CORS configuration
    // Creates or updates OPTION method if necessary
    //addCorsConfig(endpointSpecification);

    _.merge(this.swagger.paths, path);
  }
  return this;
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

module.exports = apiSpecification;
