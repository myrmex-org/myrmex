'use strict';

const Promise = require('bluebird');
const _ = require('lodash');


/**
 * Constructor function
 * @param  rootDir
 * @param  pathAndMethod
 */
var EndpointSpecification = function(spec, resourcePath, method) {
  this.method = method;
  this.resourcePath = resourcePath;
  this.spec = spec;
};

EndpointSpecification.prototype.getMethod = function() {
  return this.method;
};

EndpointSpecification.prototype.getResourcePath = function() {
  return this.resourcePath;
};

EndpointSpecification.prototype.getSpec = function() {
  return this.spec;
};

module.exports = EndpointSpecification;
