'use strict';

var fs = require('fs')
  , _ = require('lodash')
  , Promise = require('bluebird');


/**
 * Constructor function
 * @param  rootDir
 * @param  pathAndMethod
 */
var EndpointSpecification = function(method, path, swagger, integrationHook) {
  this.method = method;
  this.path = path;
  this.swagger = swagger;
  this.integrationHook = integrationHook || function(swagger) { return Promise.resolve(swagger); };
};

EndpointSpecification.prototype.getMethod = function() {
  return this.method;
};


EndpointSpecification.prototype.getPath = function() {
  return this.path;
};


EndpointSpecification.prototype.getSpecification = function() {
  return this.swagger;
};


EndpointSpecification.prototype.setIntegrationHook = function(hook) {
  this.integrationHook = hook;
};


EndpointSpecification.prototype.execIntegrationHook = function() {
  return this.integrationHook(this.swagger);
};

module.exports = EndpointSpecification;
