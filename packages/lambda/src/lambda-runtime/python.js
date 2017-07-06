'use strict';

const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');
const exec = Promise.promisify(require('child_process').exec, { multiArgs: true });

const separator = '__LOGS_AND_RESPONSE_SEPARATOR__';

/**
 * Returns the result of a local execution
 * @param  {Lambda} lambda
 * @param  {Object} event
 * @returns {Promise<Object>}
 */
module.exports.executeLocally = function executeLocally(lambda, event) {
  const fsPath = lambda.getFsPath();
  const handlerParts = lambda.config.params.Handler.split('.');
  const cmd = 'from ' + handlerParts[0] + ' import ' + handlerParts[1] + '\n'
            + 'import json\n'
            + 'event = json.loads(\'' + JSON.stringify(event) + '\')\n'
            + 'response = ' + handlerParts[1] + '(event, {})\n'
            + 'print(\'' + separator + '\')\n'
            + 'print(json.dumps(response))';
  const python = lambda.getRuntime() === 'python2.7' ? 'python' : 'python3';
  return exec(python + ' -c "' + cmd.replace(/"/g, '\\"') + '"', { cwd: fsPath })
  .then(res => {
    const stdOut = res[0].split(separator + '\n');
    const logs = stdOut[0].replace(/\\n/g, '\n');
    const response = stdOut[1].replace(/\\n/g, '\n');
    const stdErr = res[1].replace(/\\n/g, '\n');
    const result = {
      logs: logs,
      response: response,
      stdErr: stdErr
    };
    return Promise.resolve(result);
  });
};

/**
 * Install the lambda dependencies
 * @param  {Lambda} lambda
 * @returns {Promise}
 */
module.exports.installLocally = function install(lambda) {
  const fsPath = lambda.getFsPath();
  return fs.pathExists(path.join(fsPath, 'requirements.txt'))
  .then(exists => {
    if (exists) {
      const fsPath = lambda.getFsPath();
      const pip = lambda.getRuntime() === 'python2.7' ? 'pip' : 'pip3';
      return exec(pip + ' install --requirement requirements.txt --target .', { cwd: fsPath });
    }
    return Promise.resolve('');
  });
};
