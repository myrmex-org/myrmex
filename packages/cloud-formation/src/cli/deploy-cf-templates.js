'use strict';

const _ = require('lodash');
const plugin = require('../index');

/**
 * This module exports a function that enrich the interactive command line and return a promise
 * @returns {Promise} - a promise that resolve when the operation is done
 */
module.exports = (icli) => {

  // Build the lists of choices
  const choicesLists = getChoices();

  const config = {
    section: 'Cloud Formation plugin',
    cmd: 'deploy-cf-templates',
    description: 'deploy cloud formation templates',
    parameters: [{
      cmdSpec: '[template-identifiers...]',
      type: 'checkbox',
      choices: choicesLists.templateIdentifiers,
      question: {
        message: 'Which Template do you want to deploy?',
        when: (answers, cmdParameterValues) => {
          return cmdParameterValues.templateIdentifiers.length === 0 && !cmdParameterValues.all;
        }
      }
    }, {
      cmdSpec: '--all',
      description: 'deploy all templates of the project',
      type: 'boolean',
    }, {
      cmdSpec: '-r, --region <region>',
      description: 'select the AWS region',
      type: 'list',
      choices: choicesLists.region,
      validationMsgLabel: 'AWS region',
      question: {
        message: 'On which AWS region do you want to deploy?'
      }
    }, {
      cmdSpec: '-e, --environment <environment>',
      description: 'select the environment',
      type: 'input',
      default: 'DEV',
      question: {
        message: 'On which environment do you want to deploy?',
        when: (answers, cmdParameterValues) => {
          return cmdParameterValues['environment'] === undefined && plugin.myrmex.getConfig('environment') === undefined;
        }
      }
    }
  ],
    execute: executeCommand
  };

  /**
   * Create the command and the prompt
   */
  return icli.createSubCommand(config);


  /**
   * Build the choices for "list" and "checkbox" parameters
   * @returns {Object} - collection of lists of choices for "list" and "checkbox" parameters
   */
  function getChoices() {
    // First, retrieve possible values for the api-identifiers parameter
    return {
      templateIdentifiers: () => {
        return plugin.loadTemplates()
        .then(templates => {
          if (!templates.length) {
            icli.print(icli.format.error('This project does not contain any Cloud Fornation template.'));
            process.exit(1);
          }
          return _.map(templates, template => {
            return {
              value: template.getIdentifier(),
              name: icli.format.info(template.getIdentifier())
            };
          });
        });
      },
      region: [
        {
          value: 'us-east-1',
          name: icli.format.info('us-east-1') + '      US East (N. Virginia)',
          short: 'us-east-1 - US East (N. Virginia)'
        }, {
          value: 'us-west-2',
          name: icli.format.info('us-west-2') + '      US West (Oregon)',
          short: 'us-west-2 - US West (Oregon)'
        }, {
          value: 'eu-west-1',
          name: icli.format.info('eu-west-1') + '      EU (Ireland)',
          short: 'eu-west-1 - EU (Ireland)'
        }, {
          value: 'eu-central-1',
          name: icli.format.info('eu-central-1') + '   EU (Frankfurt)',
          short: 'eu-central-1 - EU (Frankfurt)'
        }, {
          value: 'ap-northeast-1',
          name: icli.format.info('ap-northeast-1') + ' Asia Pacific (Tokyo)',
          short: 'ap-northeast-1 - Asia Pacific (Tokyo)'
        }, {
          value: 'ap-southeast-1',
          name: icli.format.info('ap-southeast-2') + ' Asia Pacific (Sydney)',
          short: 'ap-southeast-2 - Asia Pacific (Sydney)'
        }
      ]
    };
  }

  /**
   * Execute the deployment
   * @param {Object} parameters - the parameters provided in the command and in the prompt
   * @returns {Promise<null>} - The execution stops here
   */
  function executeCommand(parameters) {
    if (parameters.environment === undefined) { parameters.environment = plugin.myrmex.getConfig('environment'); }

    return plugin.loadTemplates()
    .then(templates => {
      // If the parameter "all" is set, we deploy all templates
      if (!parameters.all) {
        templates = _.filter(templates, template => { return parameters.templateIdentifiers.indexOf(template.getIdentifier()) !== -1; });
      }

      icli.print();
      icli.print('Deploying ' + icli.format.info(templates.length) + ' template(s):');
      icli.print('  AWS region: ' + icli.format.info(parameters.region));
      icli.print('  Environement: ' + icli.format.info(parameters.environment || 'no environment specified'));
      icli.print();
      icli.print('This operation may last a little');

      return Promise.map(templates, template => {
        const context = {
          environment: parameters.environment
        };
        return template.deploy(parameters.region, context);
      });
    })
    .then(reports => {
      console.log(reports);
    })
    .catch(e => {
      if (e.code === 'AccessDeniedException' && e.cause && e.cause.message) {
        icli.print('\n    ' + icli.format.error('Insufficient permissions to perform the action\n'));
        icli.print('The IAM user/role you are using to perform this action does not have sufficient permissions.\n');
        icli.print(e.cause.message + '\n');
        icli.print('Please update the policies of the user/role before trying again.\n');
        process.exit(1);
      }
      throw e;
    });
  }

};
