'use strict';

const AWS = require('aws-sdk');
var cloudformation = new AWS.CloudFormation();

/**
 * Constructor function
 * @param {Object} templateDoc - the content of a Cloud Formation template
 * @param {string} identifier - the identifier of the template
 * @constructor
 */
const Template = function Template(templateDoc, identifier) {
  this.document = templateDoc;
  this.identifier = identifier;
};

/**
 * Returns the template identifier
 * @returns {string}
 */
Template.prototype.getIdentifier = function getIdentifier() {
  return this.identifier;
};

/**
 * Returns the content of the package.json file of the module
 * @returns {object}
 */
Template.prototype.getDocument = function getDocument() {
  return this.document;
};

/**
 * Deploy the template in AWS
 * @returns {object}
 */
Template.prototype.deploy = function deploy(region, context) {
  const awsCloudFormation = new AWS.CloudFormation({ region });

  return this._create(awsCloudFormation, context)
  .catch(e => {
    if (e.code === 'AlreadyExistsException') {
      return this._update(awsCloudFormation, context);
    }
    return Promise.reject(e);
  });
};

/**
 * Create the stack in AWS
 * @returns {object}
 */
Template.prototype._create = function _create(awsCloudFormation, context) {
  const params = {
    StackName: context.environment || 'myrmex',
    TemplateBody: JSON.stringify(this.document)
  }
  return awsCloudFormation.createStack(params).promise();
};

/**
 * Update the stack in AWS
 * @returns {object}
 */
Template.prototype._update = function _update(awsCloudFormation, context) {
  const params = {
    StackName: context.environment || 'myrmex',
    TemplateBody: JSON.stringify(this.document)
  }
  return awsCloudFormation.updateStack(params).promise();
};

module.exports = Template;
