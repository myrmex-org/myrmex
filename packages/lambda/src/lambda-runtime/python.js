'use strict';

const Promise = require('bluebird');
const exec = Promise.promisify(require('child_process').exec, { multiArgs: true });

/**
 * Returns the result of a local execution
 * @returns {Object}
 */
module.exports.executeLocally = function executeLocally(lambda, event) {
  const fsPath = lambda.getFsPath();
  const handlerParts = lambda.config.params.Handler.split('.');
  const cmd = 'from ' + handlerParts[0] + ' import ' + handlerParts[1] + '\n'
            + 'import json\n'
            + 'event = json.loads(\'' + JSON.stringify(event) + '\')\n'
            + 'response = ' + handlerParts[1] + '(event, {})\n'
            + 'print(\'__LOGS_AND_RESPONSE_SEPARATOR__\')\n'
            + 'print(json.dumps(response))';
  return exec('python -c "' + cmd.replace(/"/g, '\\"') + '"', { cwd: fsPath })
  .then(res => {
    const stdOut = res[0].split('\n__LOGS_AND_RESPONSE_SEPARATOR__\n');
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
 * @returns {Promise<Lambda>}
 */
module.exports.installLocally = function install(lambda) {
  const fsPath = lambda.getFsPath();
  return exec('pip install --requirement requirements.txt --target .', { cwd: fsPath });
};
