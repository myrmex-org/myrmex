'use strict';

const plugin = {
  name: 'lambda',
  version: require('../package.json').version,

  config: {
    excludeLambda: false,
    excludeRole: false
  },

  hooks: {
    /**
     * This hook allows to manage the packaging of a Lambda
     * @param {Lambda} lambda - the Lambda being deployed
     * @param {Object} codeParams - the parameters describing the location of the package
     * @returns {Promise}
     */
    buildLambdaPackage: function buildLambdaPackageHook(lambda, codeParams) {
      return require('./hooks/build-lambda-package')(lambda, codeParams);
    }
  },

  extensions: {}
};

module.exports = plugin;
