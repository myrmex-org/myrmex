'use strict';

const lager = require('@lager/lager/lib/lager');
const _ = lager.getLodash();

// Hightlight text with contextualized colors
const format = {
  cmd:     msg => { return format.custom(msg, '\x1b[33m'); }, // Yellow
  info:    msg => { return format.custom(msg, '\x1b[36m'); }, // Cyan
  error:   msg => { return format.custom(msg, '\x1b[31m'); }, // Red
  success: msg => { return format.custom(msg, '\x1b[32m'); }, // Green
  custom: (msg, code) => { return code + msg + '\x1b[0m'; }
};
// shortcuts
format.ko = format.error;
format.ok = format.success;

/**
 * Format a list passed as an option to the command line
 * @param  {string} val - a comma separated list
 * @return {Array}
 */
function listParser(val) {
  return _.map(val.split(','), _.trim);
}

/**
 * Given a list of labels, retreive the corresponding values in a list of items
 * @param  {Array} list - a list of strings or objects { value, label }
 * @param  {string|Array} label - the label or list of labels we are searching
 * @return void
 */
function retrieveValuesFromList(list, labels) {
  const results = [];
  _.forEach(labels, label => {
    results.push(retrieveValueFromList(list, label));
  });
  return results;
}

/**
 * Given a label, retreive the corresponding value in a list of items
 * @param  {Array} list - a list of strings or objects { value, label }
 * @param  {string|Array} label - the label we are searching
 * @return void
 */
function retrieveValueFromList(list, label) {
  const item = _.find(list, item => {
    if (item.label) {
      return item.label === label;
    }
    return item === label;
  });
  if (item.label) {
    return item.value;
  }
  return item;
}


/**
 * Generate a function that check if an item belongs to a list
 * @param  {Array} list - the list of available values
 * @param  {string} label - a label to identify the type of the list items
 * @return {function}
 */
function generateListValidator(list, label) {
  return function(providedValue) {
    // Normalize the list if some items a object { value, label }
    const availableValues = _.map(list, item => { return item.value || item; });
    if (_.indexOf(availableValues, providedValue) === -1) {
      let help = 'available value: ' + format.info(availableValues[0]);
      if (availableValues.length > 1) {
        help = 'available values: ' +  _.map(availableValues, format.info).join(', ');
      }
      return format.ko(providedValue) + ' is not a valid ' + label + ' - ' + help;
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
    console.log('\n  ' + format.ko('error') + ':\n    ' + validationResult.join('\n    ') + '\n');
    process.exit(1);
  }

  return parameters;
}

/**
 * [processAnswerTypeOther description]
 * @param  {[type]} answers [description]
 * @param  {[type]} key     [description]
 * @return {[type]}         [description]
 */
function processAnswerTypeOther(answers, key) {
  _.pull(answers[key], 'other');
  if (answers[key + '-other']) {
    answers[key] = _.concat(answers[key], _.map(answers[key + '-other'].split(','), _.trim));
  }
}

module.exports = {
  format,
  listParser,
  retrieveValuesFromList,
  retrieveValueFromList,
  generateListValidator,
  processCliArgs,
  processAnswerTypeOther
};


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
