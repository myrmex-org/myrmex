'use strict';

const path = require('path');
const lager = require('@lager/lager/lib/lager');
const Promise = lager.getPromise();
const fs = Promise.promisifyAll(require('fs'));
const mkdirpAsync = Promise.promisify(require('mkdirp'));
const _ = lager.getLodash();

const cliTools = require('./cli-tools');

module.exports = function(program, inquirer) {
  // We have to require the plugin inside the function
  // Otherwise we could have a circular require occuring when Lager is registering it
  const plugin = lager.getPlugin('api-gateway');

  // First, retrieve possible values for the api-identifiers parameter
  return plugin.loadApis()
  .then(apis => {
    // Build the list of available APIs for input verification and interactive selection
    const valueLists = {
      'api-identifiers': _.map(apis, api => {
        return {
          value: api.spec['x-lager'].identifier,
          label: api.spec['x-lager'].identifier + (api.spec.info && api.spec.info.title ? ' - ' + api.spec.info.title : '')
        };
      }),
      'http-method': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      'mime-type': ['application/json', 'text/plain']
    };
    const validators = {
      'api-identifier': cliTools.generateListValidator(valueLists['api-identifier'], 'API identifier'),
      'http-method': cliTools.generateListValidator(valueLists['http-method'], 'HTTP method')
    };

    return program
    .command('create-endpoint')
    .description('create a new endpoint')
    .arguments('[http-method] [resource-path]')
    .option('-a, --apis <api-identifiers>', 'The identifiers of APIs that expose the endpoint separated by ","', (val) => { return val.split(','); })
    .option('-s, --summary <endpoint summary>', 'A short summary of what the operation does')
    .option('-c, --consume <mime-types>', 'A list of MIME types the operation can consume separated by ","', (val) => { return val.split(','); })
    .option('-p, --produce <mime-types>', 'A list of MIME types the operation can produce separated by ","', (val) => { return val.split(','); })
    .action(function(method, resourcePath, options) {
      // transformations specific to this command
      if (arguments[0]) {
        arguments[0] = arguments[0].toUpperCase();
      }

      // Transform cli arguments and options into a parameter map
      let parameters = cliTools.processCliArgs(arguments, validators);

      let spec, specFilePath;

      // If the cli arguments are correct, we can prepare the questions for the interactive prompt
      // Launch the interactive prompt
      return inquirer.prompt(prepareQuestions(parameters, valueLists))
      .then(answers => {
        // Merge the parameters provided in the command and in the prompt
        parameters =  _.merge(parameters, answers);

        // We create the endpoint OpenAPI specification
        spec = {
          'x-lager': {
            'apis': parameters.apis
          },
          summary: answers.summary,
          consume: answers.consume,
          produce: answers.produce
        };

        // We calculate the path where we will save the specification and create the directory
        // Destructuring parameters only available in node 6 :(
        // specFilePath = path.join(process.cwd(), 'endpoints', ...answers.resourcePath.split('/'));
        let pathParts = parameters['resource-path'].split('/');
        pathParts.push(parameters['http-method']);
        pathParts.unshift('endpoints');
        pathParts.unshift(process.cwd());
        specFilePath = path.join.apply(null, pathParts);
        return mkdirpAsync(specFilePath);
      })
      .then(() => {
        // We save the specification in a json file
        return fs.writeFileAsync(specFilePath + path.sep + 'spec.json', JSON.stringify(spec, null, 2));
      })
      .then(() => {
        let msg = '\n  A new endpoint has been created!\n\n';
        msg += '  Its OpenAPI specification is available in \x1b[36m' + specFilePath + path.sep + 'spec.json\x1b[0m\n';
        console.log(msg);
      })
      .catch(e => {
        console.error(e);
      });
    });
  });
};



/**
 * Prepare the list of questions for the prompt
 * @param  {Object} parameters - the parameters that have already been passed to the cli
 * @param  {Object} valueLists - lists of values for closed choice parameters
 * @return {Array}
 */
function prepareQuestions(parameters, valueLists) {
  return [{
    type: 'list',
    name: 'http-method',
    message: 'What is the HTTP method?',
    choices: valueLists['http-method'],
    when: answers => { return !parameters['http-method']; }
  }, {
    type: 'input',
    name: 'resource-path',
    message: 'What is the resource path?',
    when: answers => { return !parameters['resource-path']; }
  }, {
    type: 'input',
    name: 'summary',
    message: 'Shortly, what does the operation do?',
    when: answers => { return !parameters.summary; }
  }, {
    type: 'checkbox',
    name: 'consume',
    message: 'What are the MIME types that the operation can consume?',
    choices: valueLists['mime-type'],
    when: answers => { return !parameters.consume; },
    default: ['application/json']
  }, {
    type: 'checkbox',
    name: 'produce',
    message: 'What are the MIME types that the operation can produce?',
    choices: valueLists['mime-type'],
    when: answers => { return !parameters.produce; },
    default: ['application/json']
  }, {
    type: 'checkbox',
    name: 'api-identifiers',
    message: 'Which APIs should expose this endpoint?',
    choices: _.map(valueLists['api-identifiers'], 'label'),
    when: answers => { return !parameters.apis; }
  }];
}
