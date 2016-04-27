'use strict';

const Promise = require('bluebird');
const path = require('path');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const file = require('file');

const Api = require('./api');
const Endpoint = require('./endpoint');

/**
 * Construct the lager instance
 *
 * The lager instance is a singleton that can explore the application configuration
 * give information about it, control it's validity and perform deployment
 *
 * It is possible to register plugins on the lager instance
 * A lager plugin can implements hooks to inject code and modify the behavior of
 * the lager instance
 * A lager plugin can create his own hooks for the lager instance, so it is possible
 * to create plugins for a lager plugin!
 * @constructor
 */
function Lager() {
  this.plugins = [];
}

/**
 * Lager expose it's version of bluebird, so plugins don't need to add it as a dependency
 * @param  {Object} plugin
 * @return {Lager}
 */
Lager.prototype.getPromise = function() {
  return Promise;
};

Lager.prototype.getEnvironment = function() {
  return 'NO_ENV';
};

Lager.prototype.getAWSRegion = function() {
  return 'us-east-1';
};

/**
 * Add a plugin to the lager instance
 * @param  {Object} plugin
 * @return {Lager}
 */
Lager.prototype.registerPlugin = function(plugin) {
  this.plugins.push(plugin);
  return this;
};

/**
 * Fire a hook/event
 * @param  {string} eventName - the name of the hook
 * @param  {...*} arg - the list of arguments provided to the hook
 * @return {Promise<[]>} return the promise of an array containing the hook's arguments
 *         eventually transformed by plugins
 */
Lager.prototype.fire = function() {
  // Extract arguments and eventName
  let args = Array.prototype.slice.call(arguments);
  let eventName = args.shift();

  // Define a recusive function that will check if a plugin implements the hook,
  // execute it and pass the eventually transformed arguments to the next one
  let callPluginsSequencialy = function callPluginsSequencialy(i, args) {
    if (!this.plugins[i]) {
      // If there is no more plugin to execute, we return a promise of the event arguments/result
      // So we are getting out of the sequencial calls
      return Promise.resolve.call(this, args);
    }

    if (this.plugins[i][eventName]) {
      // If the plugin implements the hook, then we execute it
      return this.plugins[i][eventName].apply(this.plugins[i], args)
      .spread(function() {
        // When the plugin hook has been executed, we move to the next plugin (recursivity)
        return callPluginsSequencialy.bind(this)(i + 1, arguments);
      }.bind(this));
    }

    // If the plugin does not implement the hook, we move to the next plugin (recursivity)
    return callPluginsSequencialy.bind(this)(i + 1, args);
  };
  // Call the recursive function
  return callPluginsSequencialy.bind(this)(0, args);
};

/**
 * Load all API specifications
 * @return {Promise<[Api]>}
 */
Lager.prototype.loadApis = function() {
  let apiSpecsPath = path.join(process.cwd(), 'apis');

  // This event allows to inject code before loading all APIs
  return this.fire('beforeApisLoad')
  .then(() => {
    // Retrieve configuration path of all API specifications
    return fs.readdirAsync(apiSpecsPath);
  })
  .then((subdirs) => {
    // Load all the API specifications
    var apiPromises = [];
    _.forEach(subdirs, (subdir) => {
      let apiSpecPath = path.join(apiSpecsPath, subdir, 'spec');
      // subdir is the identifier of the API, so we pass it as the second argument
      apiPromises.push(this.loadApi(apiSpecPath, subdir));
    });
    return Promise.all(apiPromises);
  })
  .then((apis) => {
    // This event allows to inject code to add or delete or alter API specifications
    return this.fire('AfterApisLoad', apis);
  })
  .spread((apis) => {
    return Promise.resolve(apis);
  });
};

/**
 * Load an API specification
 * @param  {string} apiSpecPath - the full path to the specification file
 * @param  {string} OPTIONAL identifier - a human readable identifier, eventually
 *                                        configured in the specification file itself
 * @return {Promise<Api>}
 */
Lager.prototype.loadApi = function(apiSpecPath, identifier) {
  return this.fire('beforeApiLoad', apiSpecPath, identifier)
  .spread((apiSpecPath, identifier) => {
    // Because we use require() to get the spec, it could either be a JSON file
    // or the content exported by a node module
    let apiSpec = require(apiSpecPath);
    apiSpec['x-lager'] = apiSpec['x-lager'] || {};
    apiSpec['x-lager'].identifier = apiSpec['x-lager'].identifier || identifier;
    let api = new Api(apiSpec);

    // This event allows to inject code to alter the API specification
    return this.fire('AfterApiLoad', api);
  })
  .spread((api) => {
    return Promise.resolve(api);
  });
};

/**
 * Load all Endpoint specifications
 * @return {Promise<[Endpoints]>}
 */
Lager.prototype.loadEndpoints = function() {
  let endpointSpecsPath = path.join(process.cwd(), 'endpoints');

  return this.fire('BeforeEndpointsLoad')
  .spread(() => {
    let endpointPromises = [];
    file.walkSync(endpointSpecsPath, (dirPath, dirs, files) => {
      // We are looking for directories that have the name of an HTTP method
      let subPath = dirPath.substr(endpointSpecsPath.length);
      let resourcePathParts = subPath.split(path.sep);
      let method = resourcePathParts.pop();
      if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method)) return;

      // We construct the path to the resource (url style, not filesystem)
      let resourcePath = resourcePathParts.join('/');

      endpointPromises.push(this.loadEndpoint(endpointSpecsPath, resourcePath, method));
    });
    return Promise.all(endpointPromises);
  });
};

/**
 * Load an Endpoint specification
 *
 * From the `endpointSpecRootPath` directory, lager will look for a specification in
 * each subdirectory following the structure `path/to/the/resource/HTTP_METHOD/`
 * @param  {string} endpointSpecRootPath - the root directory of the endpoint configuration
 * @param  {string} resourcePath - the URL path to the endpoint resource
 * @param  {string} method - the HTTP method of the endpoint
 * @return {Promise<Endpoint>}
 */
Lager.prototype.loadEndpoint = function(endpointSpecRootPath, resourcePath, method) {
  return this.fire('BeforeEndpointLoad')
  .spread(() => {
    let parts = resourcePath.split('/');
    let subPath = parts.join(path.sep) + path.sep + method;
    let spec = mergeSpecsFiles(endpointSpecRootPath, subPath);
    let endpoint = new Endpoint(spec, resourcePath, method);

    // This event allows to inject code to alter the endpoint specification
    return this.fire('AfterEndpointLoad', endpoint);
  })
  .spread((endpoint) => {
    return Promise.resolve(endpoint);
  });
};

/**
 * Integration load and deployment is performed by plugins, even for Lambda
 * @return {[IntegrationObject]} [description]
 */
Lager.prototype.loadIntegrations = function() {
  // The `deployIntegrations` hook takes one argument
  // An array that will receive integration results
  return this.fire('loadIntegrations', [])
  .spread((integrationResults) => {
    return Promise.resolve(integrationResults);
  });
};

/**
 * Update the configuration of endpoints with data returned by integration
 * This data can come from the deployment of a lambda function, the configuration
 * of an HTTP proxy, the generation of a mock etc ...
 * @param  {[Endpoint]} - a list of Endpoints
 * @param  {[IntegrationDataInjector]} - a list of integration data injectors
 *                                       an integration data injector is able to recognize
 *                                       if it applies to an endpoint and update its specification
 * @return {[Endpoint]}
 */
Lager.prototype.addIntegrationDataToEndpoints = function(endpoints, IntegrationDataInjectors) {
  // @TODO implement IntegrationDataInjector logic
  return Promise.resolve(endpoints);
};

/**
 * Build all API specifications with their endpoints
 * @return {[Object]}
 */
Lager.prototype.buildSpecs = function() {
  return Promise.all([this.loadApis(), this.loadEndpoints()])
  .spread((apis, endpoints) => {
    return Promise.map(apis, (api) => {
      return Promise.map(endpoints, (endpoint) => {
        return api.addEndpoint(endpoint);
      })
      .then(() => {
        return Promise.resolve(api);
      });
    });
  });
};


/**
 * @return {[type]}
 */
Lager.prototype.deploy = function() {
  // First load API and endpoint specifications
  console.log('Load APIs and Endpoints');
  return Promise.all([this.loadApis(), this.loadEndpoints()])
  .spread((apis, endpoints) => {
    console.log('Load integrations');
    // The load of API and endpoint specifications succeeded, we can deploy the integrations
    // Typically, il is lambda functions, but it could be anything published by a plugin
    return Promise.all([this.loadIntegrations(), apis, endpoints]);
  })
  .spread((integrationsResults, apis, endpoints) => {
    console.log('Add integrations to endpoints');
    // Once the integrations have been deployed we can update the endpoints with integration data
    return Promise.all([apis, this.addIntegrationDataToEndpoints(endpoints, integrationsResults)]);
  })
  .spread((apis, endpoints) => {
    // Once the endpoints are up-to-date with the integrations, we can add them to the APIs
    return this.addEndpointsToApis(apis, endpoints);
  })
  .then((apis) => {
    // Now that we have complete API specifications, we can publish them in API Gateway
    return this.publishAllApis(apis);
  });
};


module.exports = new Lager();


/**
 * Funbcion that aggregates the specifications found in all spec.json|js files in a path
 * @param  {string} beginPath - path from which the function will look for swagger.json|js files
 * @param  {string} subPath - path until which the function will look for swagger.json|js files
 * @return {Object} - aggregation of specifications that have been found
 */
function mergeSpecsFiles(beginPath, subPath) {
  // Initialise specification
  let spec = {};

  // List all directories where we have to look for specifications
  let subDirs = subPath.split(path.sep);

  // Initialize the directory path for the do/while statement
  let searchSpecDir = beginPath;

  do {
    let subSpec = {};
    let subDir = subDirs.shift();
    searchSpecDir = path.join(searchSpecDir, subDir);

    try {
      // Try to load the definition and silently ignore the error if it does not exist
      subSpec = require(searchSpecDir + path.sep + 'spec');
    } catch (e) {}

    // Merge the spec eventually found
    _.merge(spec, subSpec);
  } while (subDirs.length);

  // return the result of the merges
  return spec;
}


// module.exports.buildSpecs()
// .then((apis) => {
//   var util = require('util');
//   console.log(util.inspect(apis, false, null));
// });

// module.exports.registerPlugin({
//   name: 'myTestPlugin',
//   testEvent: function(aString, anObject) {
//     console.log('Inside the hook myTestPlugin', aString, anObject);
//     anObject.c = 3;
//     return Promise.resolve([aString + '123', anObject]);
//   }
// });
//
// module.exports.registerPlugin({
//   name: 'anotherTestPlugin',
//   testEvent: function(aString, anObject) {
//     console.log('Inside the hook anotherTestPlugin', aString, anObject);
//     anObject.d = 4;
//     return Promise.resolve([aString + 'xyz', anObject]);
//   }
// });
//
//
// module.exports.fire('testEvent', 'abc', { a: 1, b: 2 })
// .spread(function(aString, anObject) {
//   console.log(aString, anObject);
// });
