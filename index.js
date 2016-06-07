'use strict';

const path = require('path');
const lager = require('./lib/lager');
const _ = require('lodash');

let config;
try {
  config = require(path.join(process.cwd(), 'lager'));
  console.log('Lager project configuration loaded');
} catch(e) {
  // console.error('Unable to load the Lager configuration. Are you in a Lager project folder?');
  config = {};
}

config.plugins = config.plugins || [];

_.forEach(config.plugins, pluginIdentifier => {
  console.log('Loading plugin "' + pluginIdentifier + '"');
  lager.registerPlugin(require('.' + path.sep + path.join('plugins', pluginIdentifier)));
});

module.exports = lager;
