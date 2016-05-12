'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const AWS = require('aws-sdk');

let lager;

/**
 * Lazy loading of the lager instance to avoid circular require()
 * @return {Lager} the Lager instance
 */
function getLager() {
  if (!lager) {
    lager = require('lager/lib/lager');
  }
  return lager;
}

/**
 * Constructor function
 *
 * @param {Object} spec - base API specification
 */
let Api = function Api(spec, APIGatewayOptions) {
  // @TODO: rename apiGateway in awsApiGateway to make it more clear it is tha AWS SDK client
  this.spec = spec;
  this.apiGateway = new AWS.APIGateway(APIGatewayOptions);
};

Api.prototype.addEndpoint = function addEndpoint(endpoint) {
  return getLager().fire('beforeAddEndpointToApi', endpoint)
  .spread((endpoint) => {
    // We construct the path specification
    var path = {};
    path[endpoint.getResourcePath()] = {};
    path[endpoint.getResourcePath()][endpoint.getMethod().toLowerCase()] = endpoint.getSpec();
    _.merge(this.spec.paths, path);

    // @TODO Add models referenced in the endpoint

    // @TODO Add CORS configuration
    // Create or update OPTION method if necessary
    //addCorsConfig(endpointSpecification);

    return getLager().fire('afterAddEndpointToApi', endpoint);
  })
  .spread(() => {
    return Promise.resolve(this);
  });
};

Api.prototype.genSpec = function genSpec(type) {
  let spec = _.cloneDeep(this.spec);
  if (type === 'publish') {
    return cleanSpecForPublish(spec);
  } else if (type === 'doc') {
    return cleanSpecForDoc(spec);
  }
  return spec;
};

Api.prototype.publish = function publish() {
  return getLager().fire('beforePublishApi', this)
  .spread(() => {
    return this.genSpec('publish');
  })
  .then((spec) => {
    return [getApiByName(this.apiGateway, spec['x-lager'].identifier), spec];
  })
  .spread((awsApi, spec) => {
    if (awsApi) {
      return putRestApi(spec, awsApi, this.apiGateway);
    } else {
      return importRestApi(spec, this.apiGateway);
    }
  })
  .then(() => {
    console.log('YOUPIII');
    return getLager().fire('afterPublishApi', this);
  })
  .spread(() => {
    return Promise.resolve(this);
  });
};


module.exports = Api;



/**
 * We cannot find an API by name with the AWS SDK (only by ID)
 * Since we do not know the API ID but only the name, we have to list
 * all APIs and search for the name
 * Note that an API name is not necessarily unique, but we consider it should be
 * @param  {APIGateway} apiGateway - an API Gateway client from the AWS SDK
 * @param  {string} name - the name of the API we are looking for
 * @param  {[]} listParams - params of the apiGateway.getRestApis() method from the AWS SDK
 * @param  {Integer} position - used for recusive call when the list of APIs is too long
 * @return {Promise<Object|null>}
 */
function getApiByName(apiGateway, name, listParams, position) {
  var params = _.assign({
    position: position,
    limit: 100
  }, listParams);
  return Promise.promisify(apiGateway.getRestApis.bind(apiGateway))(params)
  .then(function(apiList) {
    var apiFound = _.find(apiList.items, function(api) { return api.name === name; });
    if (apiFound) {
      return Promise.resolve(apiFound);
    } else if (apiList.items.length === params.limit) {
      return getApiByName(apiGateway, name, listParams, params.position + params.limit - 1);
    } else {
      return Promise.resolve(null);
    }
  });
}


/**
 * [importRestApi description]
 * @param  {[type]} apiSpec    [description]
 * @param  {[type]} apiGateway [description]
 * @return {[type]}            [description]
 */
function importRestApi(apiSpec, apiGateway) {
  let params = {
    body: JSON.stringify(apiSpec),
    failOnWarnings: false
  };
  console.log('importRestApi', params);
  return Promise.promisify(apiGateway.importRestApi.bind(apiGateway))(params);
}

/**
 * [putRestApi description]
 * @param  {[type]} apiSpec    [description]
 * @param  {[type]} apiGateway [description]
 * @return {[type]}            [description]
 */
function putRestApi(apiSpec, awsApi, apiGateway) {
  let params = {
    body: JSON.stringify(apiSpec),
    failOnWarnings: false,
    restApiId: awsApi.id,
    mode: 'overwrite'
  };
  console.log('putRestApi', params);
  return Promise.promisify(apiGateway.putRestApi.bind(apiGateway))(params);
}

/**
 * [cleanSpecForPublish description]
 * @param  {[type]} spec [description]
 * @return {[type]}      [description]
 */
function cleanSpecForPublish(spec) {
  // @TODO: see if it is still useful when importing with the SDK
  // JSON schema doesn't allow to have example as property, but swagger model does
  // https://github.com/awslabs/aws-apigateway-importer/issues/177
  _.forEach(spec.definitions, function(definition) {
    delete(definition.example);
    _.forEach(definition.properties, function(property) {
      delete(property.example);
    });
  });
  return spec;
}

/**
 * [cleanSpecForDoc description]
 * @param  {[type]} spec [description]
 * @return {[type]}      [description]
 */
function cleanSpecForDoc(spec) {
  // @TODO: also delete lager extentions
  // For documentation, we can remove the OPTION methods, the lager extentions
  // and the extentions from API Gateway Importer
  _.forEach(spec.paths, function(path) {
    delete(path.options);
    _.forEach(path, function(methodDefinition) {
      delete(methodDefinition['x-amazon-apigateway-auth']);
      delete(methodDefinition['x-amazon-apigateway-integration']);
    });
  });
  return spec;
}
