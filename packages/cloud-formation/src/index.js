'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

/**
 * Load all packages
 * @return {Promise<[Template]>} - promise of an array of Cloud Formation templates
 */
function loadTemplates() {
  const templatesPath = path.join(process.cwd(), plugin.config.templatesPath);

  return plugin.myrmex.fire('beforeTemplatesLoad')
  .then(() => {
    // Retrieve paths of all node packages
    return Promise.promisify(fs.readdir)(templatesPath);
  })
  .then(files => {
    // Load all packages configurations
    const templatePromises = [];
    _.forEach(files, (fileName) => {
      const templatePath = path.join(templatesPath, fileName);
      // subdir is the identifier of the template, so we pass it as the second argument
      templatePromises.push(loadTemplate(templatePath, fileName));
    });
    return Promise.all(templatePromises);
  })
  .then(templates => {
    // This event allows to inject code to add or delete or alter node templates configurations
    return plugin.myrmex.fire('afterTemplatesLoad', templates);
  })
  .spread(templates => {
    return Promise.resolve(templates);
  })
  .catch(e => {
    // In case the project does not have any template yet, an exception will be thrown
    // We silently ignore it
    if (e.code === 'ENOENT' && path.basename(e.path) === 'templates') {
      return Promise.resolve([]);
    }
    return Promise.reject(e);
  });
}

/**
 * Load a Template object
 * @param  {string} templatePath - path to the template file
 * @param  {string} identifier - identifier od the template
 * @return {Promise<Template>} - promise of a Cloud Formation template
 */
function loadTemplate(templatePath, identifier) {
  return plugin.myrmex.fire('beforeTemplateLoad', templatePath, identifier)
  .spread((templatePath, name) => {
    const templateDoc = _.cloneDeep(require(path.join(templatePath)));

    // Lasy loading because the plugin has to be registered in a Myrmex instance before requiring the document
    const Template = require('./template');
    const template = new Template(templateDoc, identifier);

    // This event allows to inject code to alter the template configuration
    return plugin.myrmex.fire('afterTemplateLoad', template);
  })
  .spread(template => {
    return Promise.resolve(template);
  });
}

const plugin = {
  name: 'cloud-formation',
  version: require('../package.json').version,

  config: {
    templatesPath: 'cf-templates'
  },

  hooks: {
    /**
     * Register plugin commands
     * @returns {Promise} - a promise that resolves when all commands are registered
     */
    registerCommands: function registerCommandsHook(icli) {
      return Promise.all([
        require('./cli/deploy-cf-templates')(icli)
      ]);
    }
  },

  loadTemplates
};

module.exports = plugin;
