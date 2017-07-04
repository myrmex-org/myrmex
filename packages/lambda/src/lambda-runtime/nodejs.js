'use strict';

const util = require('util');
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
  const result = { logs: [] };
  const handlerParts = lambda.config.params.Handler.split('.');
  const m = require(path.join(lambda.getFsPath(), handlerParts[0]));
  contextMock = contextMock || nodejsContextMock;

  // Catch console.log output
  const consoleLogFn = console.log;
  console.log = function() {
    const log = Array.prototype.slice.call(arguments).map(e => {
      return util.inspect(e, { depth: 2 });
    }).join(' ');
    result.logs.push(log);
  };

  // Transform  context.succeed() / context.fail() as a Promise
  const contextPromise = new Promise((resolve, reject) => {
    const succeed = contextMock.succeed;
    const fail = contextMock.fail;
    contextMock.fail = (res) => {
      fail(res);
      resolve({ failure: res });
    };
    contextMock.succeed = (res) => {
      succeed(res);
      resolve({ success: res });
    };
  });

  // Transform callback as a Promise
  const callbackPromise = new Promise((resolve, reject) => {
    m[handlerParts[1]](event, contextMock || nodejsContextMock, (err, res) => {
      if (err) {
        resolve({ failure: err });
      } else {
        resolve({ success: res });
      }
    });
  });

  // The first method (context or callback) that resolves or rejects will be considered
  return Promise.race([callbackPromise, contextPromise])
  .then(res => {
    console.log = consoleLogFn;
    result.logs = result.logs.join('\n');
    result.response = res;
    return Promise.resolve(result, null, 2);
  })
  .catch(e => {
    console.log = consoleLogFn;
    return Promise.reject(e);
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
