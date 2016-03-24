'use strict';

var _ = require('lodash');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var fs = require('fs');
var nameGenerator = require('./name_generator');
var policyHelperFn = require('./policy_helper');

AWS.config.apiVersions = {
  iam: '2010-05-08'
};
var pathPrefix = '/';
var iam;
var policyHelper;


/**
 * Constructor function
 *
 * @param Object options
 * {}
 */
var roleBuilder = function(options) {
  pathPrefix = '/' + (options.namePrefix ? options.namePrefix + '/' : '');
  iam = new AWS.IAM();
  policyHelper = policyHelperFn(iam);
};


/* istanbul ignore next */
/**
 * Deploy all roles in a directory
 * @param  String path
 * @return Promise
 */
roleBuilder.prototype.deployAll = function(path) {
  // Retrieve policy configuration directories
  var rolePaths = _.map(fs.readdirSync(path), function(dirName) {
    return path + '/' + dirName;
  });

  // Run the functions in serie
  return Promise.mapSeries(rolePaths, this.deploy.bind(this));
};

/* istanbul ignore next */
/**
 * Deploy a policy configuration
 * @param  String pathToPolicy
 * @return Promise
 */
roleBuilder.prototype.deploy = function(pathToRole) {
  var name = nameGenerator(pathToRole);
  var config = JSON.parse(fs.readFileSync(pathToRole).toString());

  return createOrUpdate(name, config)
  .then(function(data) {
    return attachPolicies(name, config);
  });
};


function createOrUpdate(name, config) {
  return Promise.promisify(iam.getRole.bind(iam))({ RoleName: name })
  .then(function(data) {
    // If the role already exists, we update it
    console.log(' * Update role ' + name);
    var params = {
      PolicyDocument: JSON.stringify(config['trust-relationship']),
      RoleName: data.Role.RoleName
    };
    return Promise.promisify(iam.updateAssumeRolePolicy.bind(iam))(params);
  })
  .catch(function(err) {
    if (err.code === 'NoSuchEntity') {
      // If the role does not exist, create it
      console.log(' * Create role ' + name);
      var params = {
        AssumeRolePolicyDocument: JSON.stringify(config['trust-relationship']),
        RoleName: name,
        Path: pathPrefix
      };
      return Promise.promisify(iam.createRole.bind(iam))(params);
    }
    throw(err);
  });
}

function attachPolicies(name, config) {
  // Run the functions in serie
  return Promise.mapSeries(config['managed-policies'], function(policy) {
    return attachManagedPolicy(name, policy);
  });
}

var params = {
  OnlyAttached: false,
  Scope: 'All'
};
function attachManagedPolicy(roleName, policyName) {
  return policyHelper.getPolicyByName(policyName, params)
  .then(function(policy) {
    if (!policy) {
      throw new Error('The policy ' + policyName + ' does not exists');
    }
    var params = {
      PolicyArn: policy.Arn,
      RoleName: roleName
    };
    return Promise.promisify(iam.attachRolePolicy.bind(iam))(params);
  });
}

module.exports = roleBuilder;
