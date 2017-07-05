'use strict';

const path = require('path');

/**
 * Constructor function
 * @param {Object} packageJson - the content of a package.json file
 * @param {string} name - the name of the module
 * @param {string} path - the fsPath to the module on the filesystem
 * @constructor
 */
const NodeModule = function NodeModule(packageJson, name, fsPath) {
  this.packageJson = packageJson;
  this.name = name;
  this.fsPath = fsPath;
};

/**
 * Returns the Module name
 * @returns {string}
 */
NodeModule.prototype.getName = function getName() {
  return this.name;
};

/**
 * Returns the content of the package.json file of the module
 * @returns {object}
 */
NodeModule.prototype.getPackageJson = function getPackageJson() {
  return require(path.join(this.fsPath, 'package.json'));
};

/**
 * Returns the module location on the file system
 * @returns {string}
 */
NodeModule.prototype.getFsPath = function getFsPath() {
  return this.fsPath;
};

module.exports = NodeModule;
