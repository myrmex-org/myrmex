'use strict';

const lager = require('@lager/lager/lib/lager');
const _ = lager.getLodash();

function generateListValidator(list, label) {
  return function(providedValue) {
    // Test if the list is a collection of strings or a collection of objects { value, label }
    const availableValues = list.length && list[0].label ? _.map(list, 'value') : list;
    if (_.indexOf(availableValues, providedValue) === -1) {
      let help = 'available value: "\x1b[36m' +  availableValues[0] + '\x1b[0m"';
      if (availableValues.length > 1) {
        help = 'available values: \x1b[36m' +  availableValues.join('\x1b[0m, \x1b[36m') + '\x1b[0m';
      }
      return '\x1b[31m' + providedValue + '\x1b[0m is not a valid ' + label + ' - ' + help;
    }
    return true;
  };
}

/**
 * @param  {Object} cliArgs - "arguments" object passed to the method action()
 * @param  {Object} validators - map of parameterKey / validators
 * @return void
 */
function processCliArgs(cliArgs, validators) {
  // Initialize an object that will contain the final parameters (cli + prompt)
  let parameters = cliArgsToParameters(cliArgs);

  // We verify that arguments provided in the command are correct
  // For example, check if the provided api-identifier does really exist
  // If an argument is a comma separated list, we could also transform it into an Array here
  const validationResult = validateParameters(parameters, validators);
  if (validationResult !== true) {
    console.log('\n  error:\n    ' + validationResult.join('\n    ') + '\n');
    process.exit(1);
  }

  return parameters;
}


/**
 * Verify and transform cli args into parameters
 * @param  {Object} cliArgs - arguments and options that have been passed to the cli
 * @return {Object}
 */
function cliArgsToParameters(cliArgs) {
  // Initialize an object that will contain the final parameters (cli + prompt)
  const parameters = {};
  let options = Array.prototype.pop.call(cliArgs);
  // Convert cli arguments to parameters
  _.forEach(options._args, (argsDefinition, i) => {
    parameters[argsDefinition.name] = cliArgs[i];
  });
  // Convert cli options to parameters
  _.forEach(options.options, option => {
    let key = _.trimStart(option.long, '-');
    parameters[key] = options[key];
  });
  return parameters;
}

/**
 * Verify and transform cli args into parameters
 * @param  {Object} parameters - parameters that have been passed to the cli
 * @param  {Object} valueLists - lists of values for closed choice parameters
 * @return {Object}
 */
function validateParameters(parameters, validators) {
  const messages = [];
  _.forEach(parameters, (value, key) => {
    if (value && validators[key] ) {
      const validation = validators[key](value);
      if (validation !== true) {
        messages.push(validation);
      }
    }
  });
  return messages.length ? messages : true;
}

module.exports = {
  generateListValidator,
  processCliArgs
};
