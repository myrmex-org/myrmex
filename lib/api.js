'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

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
var Api = function(spec) {
  this.spec = spec;
};

Api.prototype.addEndpoint = function(endpoint) {
  return getLager().fire('beforeAddEndpointToApi', endpoint)
  .spread((endpoint) => {
    // We construct the path specification
    var path = {};
    path[endpoint.getResourcePath()] = {};
    path[endpoint.getResourcePath()][endpoint.getMethod().toLowerCase()] = endpoint.getSpec();
    _.merge(this.spec.paths, path);

    // @TODO Add CORS configuration
    // Create or update OPTION method if necessary
    //addCorsConfig(endpointSpecification);

    return getLager().fire('afterAddEndpointToApi', endpoint);
  })
  .spread((endpoint) => {
    return Promise.resolve(this);
  });
};

module.exports = Api;
