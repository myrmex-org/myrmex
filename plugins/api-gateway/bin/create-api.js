'use strict';

const path = require('path');
const lager = require('@lager/lager/lib/lager');
const Promise = lager.getPromise();
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const _ = lager.getLodash();
const program = lager.getProgram();
const inquirer = lager.getInquirer();

program
  .command('create-api')
  .description('create a new API')
  .arguments('[api-identifier]')
  .action((identifier) => {
    let spec, specFilePath;
    prompt({ identifier })
    .then(answers => {
      spec = {
        swagger: '2.0',
        info: {},
        schemes: ['https'],
        host: 'API_ID.execute-api.REGION.amazonaws.com',
        paths: {},
        definitions: {}
      };
      // If a name has been provided, we create the project directory
      specFilePath = path.join(process.cwd(), 'apis', answers.identifier);
      return mkdirpAsync(specFilePath);
    })
    .then(() => {
      return fs.writeFileAsync(specFilePath + path.sep + 'spec.json', JSON.stringify(spec, null, 2));
    })
    .then(() => {
      let msg = '\n  A new API has been created!\n\n';
      msg += '  Its OpenAPI specification is available in \x1b[36m' + specFilePath + path.sep + 'spec.json\x1b[36m\n';
      console.log(msg);
    })
    .catch(e => {
      console.error(e);
    });
  });


function prompt(defaults) {
  let questions = [{
    type: 'input',
    name: 'identifier',
    message: 'What is the API identifier?',
    when: answers => { return !defaults.identifier; }
  }];
  return inquirer.prompt(questions)
  .then(answers => {
    _.forEach(defaults, (value, key) => {
      if (!answers[key]) {
        answers[key] = value;
      }
    });
    return Promise.resolve(answers);
  });
}
