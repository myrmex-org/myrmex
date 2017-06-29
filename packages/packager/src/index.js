'use strict';

const plugin = {
  name: 'packager',
  version: require('../package.json').version,

  config: {
    bucket: null,
    docker: {
      useSudo: false,
      showStdout: false
    }
  },

  hooks: {
    /**
     * This hook allows to manage the packaging of a Lambda
     * @param {Lambda} lambda - the Lambda being deployed
     * @param {Object} context - informations about the current deployment (environment, alias ...)
     * @param {Object} codeParams - the parameters describing the location of the package
     * @returns {Promise}
     */
    buildLambdaPackage: function buildLambdaPackageHook(lambda, context, codeParams) {
      return require('./hooks/build-lambda-package')(lambda, context, codeParams);
    }
  },

  extensions: {}
};

module.exports = plugin;
