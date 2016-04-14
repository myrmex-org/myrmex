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
  this.environment = options.environment;
  pathPrefix = '/' + (this.environment ? this.environment + '/' : '');
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
  // Retrieve role configuration directories
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
  var name = nameGenerator(pathToRole, this.environment);
  var config = JSON.parse(fs.readFileSync(pathToRole).toString());

  return createOrUpdate(name, config)
  .then(function(data) {
    return attachPolicies(name, config, this.environment);
  }.bind(this));
};


function createOrUpdate(name, config) {
  // @TODO check if the role exist or not insted of checking the error
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

/**
 * [attachPolicies description]
 * @param  {[type]} name        [description]
 * @param  {[type]} config      [description]
 * @param  {[type]} environment [description]
 * @return {[type]}             [description]
 */
function attachPolicies(name, config, environment) {
  // Run the functions in serie
  return Promise.mapSeries(config['managed-policies'], function(policyIdentifier) {
    return attachManagedPolicy(name, policyIdentifier, environment);
  });
}

/**
 * [attachManagedPolicy description]
 * @param  {String} roleName         Role name
 * @param  {String} policyIdentifier Name or arn
 * @return Promise
 */
function attachManagedPolicy(roleName, policyIdentifier, environment) {
  var searchParams = {
    OnlyAttached: false,
    Scope: 'All'
  };
  retrievePolicyArn(policyIdentifier, environment, searchParams)
  .then(function(policyArn) {
    var params = {
      PolicyArn: policyArn,
      RoleName: roleName
    };
    return Promise.promisify(iam.attachRolePolicy.bind(iam))(params);
  });
}

/* istanbul ignore next */
/**
 * Retrieve a policy Arn from a identifier that can be either the ARN or the name
 * @param  String identifier - The name or the ARN of the role
 * @return Promise
 */
function retrievePolicyArn(identifier, environment, searchParams) {
  if (/arn:aws:iam::\d{12}:policy\/?[a-zA-Z_0-9+=,.@\-_/]+]/.test(identifier)) {
    return Promise.resolve(identifier);
  }
  return policyHelper.getPolicyByName(identifier, searchParams)
  .then(function(policy) {
    if (!policy) {
      // If we didn't find a policy and "environment" is available,
      // we are adding it as a prefix and do another search
      if (environment) {
        return retrievePolicyArn(environment + '_' + identifier, searchParams);
      }
      // Or else, we throw an error because the policy cannot be found
      throw new Error('The policy ' + identifier + ' does not exists');
    }
    return policy.Arn;
  });
}

module.exports = roleBuilder;
