'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const AWS = require('aws-sdk');

const iamHelper = require('./helper');
const plugin = require('./index');

/**
 * Constructor function
 * @param {[type]} config     [description]
 * @param {[type]} name       [description]
 * @param {[type]} pathPrefix [description]
 */
const Role = function Role(config, name, pathPrefix) {
  this.config = config;
  this.name = name;
  this.pathPrefix = pathPrefix || '/';
};

/**
 * Returns the name of the role
 * @return {string} - the role name
 */
Role.prototype.getName = function getName() {
  return this.name;
};


/**
 * Returns the name of the role
 * @return {string} - the role name
 */
Role.prototype.getDescription = function getDescription() {
  return this.config.description;
};


/**
 * Deploy the role in AWS
 * @param {Object} context - an object containing the stage and the environment of the role
 * @returns {Promise} - a promise that resolve after the deployment
 */
Role.prototype.deploy = function deploy(context) {
  const awsIAM = new AWS.IAM();
  let name = this.name;
  if (context.environment) { name = context.environment + '_' + name; }
  if (context.stage) { name = name + '_' + context.stage; }
  const report = { name: name };
  const initTime = process.hrtime();

  return plugin.myrmex.fire('beforeDeployRole', this)
  .spread(() => {
    return awsIAM.getRole({ RoleName: name }).promise()
    .catch(e => {
      // We silently ignore the error if the role is not found: we will have to create it
      if (e.code === 'NoSuchEntity') { return Promise.resolve(null); }
      return Promise.reject(e);
    });
  })
  .then(data => {
    if (data) {
      // If the role already exists, we update it
      report.arn = data.Role.Arn;
      return this.update(awsIAM, data.Role.RoleName, report);
    } else {
      // If the does not exists, we create it
      return this.create(awsIAM, name, report);
    }
  })
  .then(data => {
    // @TODO allow to detach policies
    report.arn = data.Role.Arn;
    return this.attachPolicies(awsIAM, name, context);
  })
  .then(data => {
    report.deployTime = process.hrtime(initTime);
    return plugin.myrmex.fire('afterDeployPolicy', this);
  })
  .spread(() => {
    return Promise.resolve(report);
  });
};

/**
 * Create a new role in AWS
 * @param {AWS.IAM} awsIAM
 * @param {string} name
 * @param {Object} report
 * @returns {Promise<Object>}
 */
Role.prototype.create = function create(awsIAM, name, report) {
  report = report || {};
  report.operation = 'Creation';
  var params = {
    AssumeRolePolicyDocument: JSON.stringify(this.config['trust-relationship']),
    RoleName: name,
    Path: this.pathPrefix
  };
  return awsIAM.createRole(params).promise()
  .catch(e => {
    if (e.code === 'EntityAlreadyExists') {
      return this.update(awsIAM, name, report);
    }
    return Promise.reject(e);
  });
};

/**
* @param {AWS.IAM} awsIAM
* @param {string} policyArn
* @param {Object} report
* @returns {Promise<Object>}
*/
Role.prototype.update = function update(awsIAM, roleName, report) {
  report = report || {};
  report.operation = 'Update';
  var params = {
    PolicyDocument: JSON.stringify(this.config['trust-relationship']),
    RoleName: roleName
  };
  return awsIAM.updateAssumeRolePolicy(params).promise()
  .then(() => {
    return awsIAM.getRole({ RoleName: roleName }).promise();
  });
};

/**
 * [attachPolicies description]
 * @param {[type]} name        [description]
 * @param {[type]} config      [description]
 * @param {[type]} context     [description]
 * @returns {[type]}           [description]
 */
Role.prototype.attachPolicies = function attachPolicies(awsIAM, roleName, context) {
  // Run the functions in serie
  return Promise.mapSeries(this.config['managed-policies'], (policyIdentifier) => {
    return this.attachManagedPolicy(awsIAM, policyIdentifier, roleName, context);
  })
  .then(() => {
    const names = [];
    const documents = [];
    _.forEach(this.config['inline-policies'], (document, name) => {
      names.push(name);
      documents.push(document);
    });
    return Promise.mapSeries(documents, (policyDocument, index) => {
      return this.putInlinePolicy(awsIAM, policyDocument, names[index], roleName);
    });
  });
};

/**
 * [attachManagedPolicy description]
 * @param {String} roleName         Role name
 * @param {String} policyIdentifier Name or arn
 * @returnsPromise
 */
Role.prototype.attachManagedPolicy = function attachManagedPolicy(awsIAM, policyIdentifier, roleName, context) {
  const searchParams = {
    OnlyAttached: false,
    Scope: 'All'
  };
  return iamHelper.retrievePolicyArn(policyIdentifier, context, searchParams)
  .then(policyArn => {
    var params = {
      PolicyArn: policyArn,
      RoleName: roleName
    };
    return awsIAM.attachRolePolicy(params).promise();
  });
};

/**
 * [putInlinePolicy description]
 * @param {object} awsIAM
 * @param {object} policyDocument
 * @param {string} policyName
 * @param {string} roleName
 * @returns Promise
 */
Role.prototype.putInlinePolicy = function attachManagedPolicy(awsIAM, policyDocument, policyName, roleName) {
  const params = {
    PolicyDocument: JSON.stringify(policyDocument),
    PolicyName: policyName,
    RoleName: roleName
  };
  return awsIAM.putRolePolicy(params).promise();
};

module.exports = Role;
