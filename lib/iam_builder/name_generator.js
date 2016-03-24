'use strict';
var path = require('path');

module.exports = function(filePath) {
  var fileName = path.basename(filePath);
  return fileName.split('.')[0];
};
