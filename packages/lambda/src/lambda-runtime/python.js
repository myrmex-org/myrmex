'use strict';

const Promise = require('bluebird');
const exec = Promise.promisify(require('child_process').exec, { multiArgs: true });

/**
 * Returns the result of a local execution
 * @returns {Object}
 */
module.exports.executeLocally = function executeLocally(lambda, event) {
};

/**
 * Install the lambda dependencies
 * @returns {Promise<Lambda>}
 */
module.exports.installLocally = function install(lambda) {
  const fsPath = lambda.getFsPath();
  return exec('pip install --requirement requirements.txt --target .', { cwd: fsPath });
};
