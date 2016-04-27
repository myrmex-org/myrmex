'use strict';
var path = require('path');

module.exports = function(filePath, environment) {
  var fileName = path.basename(filePath);
  return (environment ? environment + '_' : '') + fileName.split('.')[0];
};
