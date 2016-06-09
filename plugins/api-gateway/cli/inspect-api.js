'use strict';

const lager = require('@lager/lager/lib/lager');
const Promise = lager.getPromise();
const _ = lager.getLodash();
const inquirer = lager.getInquirer();

module.exports = function(program) {
  // We have to require the plugin inside the function
  // Otherwise we could have a circular require occuring when Lager register it
  const plugin = lager.getPlugin('api-gateway');

  return plugin.loadApis()
  .then(apis => {
    let apiChoices = _.map(apis, api => {
      return {
        value: api.spec['x-lager'].identifier,
        label: api.spec['x-lager'].identifier + (api.spec.info && api.spec.info.title ? ' - ' + api.spec.info.title : '')
      };
    });

    let questions = [{
      type: 'list',
      name: 'identifier',
      message: 'Which API do you want to inspect?',
      choices: _.map(apiChoices, 'label')
    }];

    program
    .command('inspect-api')
    .description('inspect an api specification')
    .arguments('[api-identifier]')
    .option('-c, --colors', 'output with colors')
    .action((identifier, options) => {
      inquirer.prompt(questions)
      .then(answers => {
        return plugin.getApiSpec(answers.identifier, answers.colors);
      })
      .then(spec => {
        return console.log(spec);
      });
    });
  });
};
