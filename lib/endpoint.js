'use strict';

const Promise = require('bluebird');
const _ = require('lodash');


/**
 * Constructor function
 * @param  rootDir
 * @param  pathAndMethod
 */
var Endpoint = function Endpoint(spec, resourcePath, method) {
  this.method = method;
  this.resourcePath = resourcePath;
  this.spec = spec;
};

Endpoint.prototype.getMethod = function() {
  return this.method;
};

Endpoint.prototype.getResourcePath = function() {
  return this.resourcePath;
};

Endpoint.prototype.getSpec = function() {
  return this.spec;
};

module.exports = Endpoint;
