'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

let iam = new AWS.IAM();

/* istanbul ignore next */
/**
 * Retrieve a role Arn from a identifier that can be either the ARN or the name
 * @param  {string} identifier - The name or the ARN of the role
 * @return {Promise<string>}
 */
module.exports = function retrieveRoleArn(identifier) {
  // First check if the parameter already is an ARN
  if (/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+]/.test(identifier)) {
    return Promise.resolve(identifier);
  }

  // Then, we check if a role exists with the parameter as its name
  let environment = this.getEnvironment();
  return Promise.promisify(iam.getRole.bind(iam))({ RoleName: identifier })
  .then((data) => {
    return Promise.resolve(data.Role.Arn);
  })
  .catch((e) => {
    if (e && environment) {
      // If we did not find a role yet, we try to add the environment value as a prefix
      return this.retrieveRoleArn(environment + '_' + identifier);
    }
    return Promise.reject(e);
  });
};
