'use strict';

const lager = require('@lager/lager/lib/lager');
const Promise = lager.getPromise();
const _ = lager.getLodash();

const cliTools = require('@lager/lager/lib/cli-tools');

module.exports = function(program, inquirer) {
  // We have to require the plugin inside the function
  // Otherwise we could have a circular require occuring when Lager is registering it
  const plugin = lager.getPlugin('api-gateway');

  // First, retrieve possible values for the identifier parameter
  return plugin.loadApis()
  .then(apis => {
    // Build the list of available APIs for input verification and interactive selection
    const valueLists = {
      'api-identifier': _.map(apis, api => {
        return {
          value: api.spec['x-lager'].identifier,
          label: api.spec['x-lager'].identifier + (api.spec.info && api.spec.info.title ? ' - ' + api.spec.info.title : '')
        };
      })
    };
    const validators = {
      'api-identifier': cliTools.generateListValidator(valueLists['api-identifier'], 'API identifier')
    };

    program
    .command('inspect-api')
    .description('inspect an api specification')
    .arguments('[api-identifier]')
    .option('-c, --colors', 'highlight output')
    .action(function (apiIdentifier, options) {
      // Transform cli arguments and options into a parameter map
      let parameters = cliTools.processCliArgs(arguments, validators);

      // If the cli arguments are correct, we can prepare the questions for the interactive prompt
      // Launch the interactive prompt
      return inquirer.prompt(prepareQuestions(parameters, valueLists))
      .then(answers => {
        // Merge the parameters provided in the command and in the prompt
        parameters =  _.merge(parameters, answers);
        return plugin.getApiSpec(parameters['api-identifier'], parameters.colors);
      })
      .then(spec => {
        return console.log(spec);
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
    name: 'api-identifier',
    message: 'Which API do you want to inspect?',
    choices: _.map(valueLists['api-identifier'], 'label'),
    when: function(currentAnswers) {
      return !parameters['api-identifier'];
    }
  }];
}
