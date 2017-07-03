'use strict';

const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');
const exec = Promise.promisify(require('child_process').exec, { multiArgs: true });
const nodejsContextMock = require('./nodejs-context-mock');

/**
 * Returns the result of a local execution
 * @returns {Object}
 */
module.exports.executeLocally = function executeLocally(lambda, event, contextMock) {
  const handlerParts = lambda.config.params.Handler.split('.');
  const m = require(path.join(lambda.getFsPath(), handlerParts[0]));
  contextMock = contextMock || nodejsContextMock;
  const contextPromise = new Promise((resolve, reject) => {
    const succeed = contextMock.succeed;
    const fail = contextMock.fail;
    contextMock.succeed = (res) => {
      succeed(res);
      resolve(res);
    };
    contextMock.fail = (e) => {
      fail(e);
      reject(e);
    };
  });
  console.log('Logs:');
  return Promise.any([
    Promise.promisify(m[handlerParts[1]])(event, contextMock || nodejsContextMock),
    contextPromise
  ])
  .then(result => {
    return Promise.resolve('\nResponse:\n' + JSON.stringify(result, null, 2));
  });
};

/**
 * Install the lambda dependencies
 * @returns {Promise<Lambda>}
 */
module.exports.installLocally = function install(lambda) {
  const fsPath = lambda.getFsPath();
  return fs.remove(path.join(fsPath, 'node_modules'))
  .then(() => {
    return exec('npm install --loglevel=error', { cwd: fsPath });
  });
};
