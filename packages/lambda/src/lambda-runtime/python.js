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
            + 'print(\'Logs:\')\n'
            + 'response = ' + handlerParts[1] + '(event, {})\n'
            + 'print(\'\\nResponse:\')\n'
            + 'print(json.dumps(response, indent=2))';
  return exec('python -c "' + cmd.replace(/"/g, '\\"') + '"', { cwd: fsPath })
  .then(res => {
    const stdOut = res[0].replace(/\\n/g, '\n');
    const stdErr = res[1].replace(/\\n/g, '\n');
    const output = (stdErr ? 'Errors:\n\n' + stdErr : '') + stdOut;
    return Promise.resolve(output);
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
