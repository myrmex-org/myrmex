'use strict';

const path = require('path');
const lager = require('@lager/lager/lib/lager');
const Promise = lager.getPromise();
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const _ = lager.getLodash();
const program = lager.getProgram();
const inquirer = lager.getInquirer();

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const commonMimeTypes = ['text/plain', 'application/json'];

program
  .command('create-endpoint')
  .description('create a new endpoint')
  .arguments('[HTTP_METHOD] [resource-path]')
  .option('-s, --summary <endpoint summary>', 'A short summary of what the operation does')
  .option('-c, --consume <>', 'A list of MIME types the operation can consume')
  .option('-p, --produce <>', 'A list of MIME types the operation can produce')
  .action((method, resourcePath, options) => {
    if (!resourcePath && method && httpMethods.indexOf(method.toUpperCase()) === -1) {
      resourcePath = method;
      method = undefined;
    }
    if (method) {
      method = method.toUpperCase();
    }
    let spec, specFilePath;
    const defaults = {
      method,
      resourcePath,
      summary: options.summary,
      consume: options.consume,
      produce: options.produce
    };
    prompt(defaults)
    .then(answers => {
      spec = {
        'x-lager': {},
        summary: answers.summary,
        consume: answers.consume,
        produce: answers.produce
      };
      // Destructuring parameters only available in node 6 :(
      // specFilePath = path.join(process.cwd(), 'endpoints', ...answers.resourcePath.split('/'));
      let pathParts = answers.resourcePath.split('/');
      pathParts.push(answers.method);
      pathParts.unshift('endpoints');
      pathParts.unshift(process.cwd());
      specFilePath = path.join.apply(null, pathParts);
      return mkdirpAsync(specFilePath);
    })
    .then(() => {
      return fs.writeFileAsync(specFilePath + path.sep + 'spec.json', JSON.stringify(spec, null, 2));
    })
    .then(() => {
      let msg = '\n  A new endpoint has been created!\n\n';
      msg += '  Its OpenAPI specification is available in \x1b[36m' + specFilePath + path.sep + 'spec.json\x1b[36m\n';
      console.log(msg);
    })
    .catch(e => {
      console.error(e);
    });
  });


function prompt(defaults) {
  let questions = [{
    type: 'list',
    name: 'method',
    message: 'What is the HTTP method?',
    choices: httpMethods,
    when: answers => { return !defaults.method; }
  }, {
    type: 'input',
    name: 'resourcePath',
    message: 'What is the resource path?',
    when: answers => { return !defaults.resourcePath; }
  }, {
    type: 'input',
    name: 'summary',
    message: 'Shortly, what does the operation do?',
    when: answers => { return !defaults.summary; }
  }, {
    type: 'checkbox',
    name: 'consume',
    message: 'What are the MIME types that the operation can consume?',
    choices: commonMimeTypes,
    when: answers => { return !defaults.consume; }
  }, {
    type: 'checkbox',
    name: 'produce',
    message: 'What are the MIME types that the operation can produce?',
    choices: commonMimeTypes,
    when: answers => { return !defaults.produce; }
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
