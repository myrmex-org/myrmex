'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const program = require('commander');

const retrieveRoleArn = require('./helper/retrieve-role-arn');

/**
 * Construct the lager instance
 *
 * The lager instance is a singleton that can explore the application configuration
 * give information about it, control it's validity and perform deployment
 *
 * It is possible to register plugins on the lager instance
 * A lager plugin can implements hooks to inject code and modify the behavior of
 * the lager instance
 * A lager plugin can create his own hooks for the lager instance, so it is possible
 * to create plugins for a lager plugin!
 * @constructor
 */
function Lager() {
  this.plugins = [];
}

/**
 * Lager expose it's bluebird dependency, so plugins don't need to add it as a dependency
 */
Lager.prototype.getPromise = function() {
  return Promise;
};

/**
 * Lager expose it's bluebird dependency, so plugins don't need to add it as a dependency
 */
Lager.prototype.getLodash = function() {
  return _;
};

/**
 * Lager expose it's commander dependency, so plugins can add their own commands
 */
Lager.prototype.getProgram = function() {
  return program;
};

/**
 * Add a plugin to the lager instance
 * @param  {Object} plugin
 * @return {Lager}
 */
Lager.prototype.registerPlugin = function(plugin) {
  this.plugins.push(plugin);
  return this;
};

/**
 * Retrieve a plugin by name
 * @param  {string} name
 * @return {Object}
 */
 Lager.prototype.getPlugin = function(name) {
   return _.find(this.plugins, plugin => {
     return plugin.name === name;
   });
 };

/**
 * Fire a hook/event
 * @param  {string} eventName - the name of the hook
 * @param  {...*} arg - the list of arguments provided to the hook
 * @return {Promise<[]>} return the promise of an array containing the hook's arguments
 *         eventually transformed by plugins
 */
Lager.prototype.fire = function() {
  // Extract arguments and eventName
  let args = Array.prototype.slice.call(arguments);
  let eventName = args.shift();

  // let argsDescription = '(' + _.map(args, arg => {
  //   return !arg ? arg : (arg.toString ? arg.toString() : Object.prototype.toString.call(arg));
  // }).join(', ') + ')';
  // console.log('HOOK ' + eventName + argsDescription);

  // Define a recusive function that will check if a plugin implements the hook,
  // execute it and pass the eventually transformed arguments to the next one
  let callPluginsSequencialy = function callPluginsSequencialy(i, args) {
    if (!this.plugins[i]) {
      // If there is no more plugin to execute, we return a promise of the event arguments/result
      // So we are getting out of the sequencial calls
      return Promise.resolve.call(this, args);
    }

    if (this.plugins[i][eventName]) {
      // If the plugin implements the hook, then we execute it
      return this.plugins[i][eventName].apply(this.plugins[i], args)
      .spread(function() {
        // When the plugin hook has been executed, we move to the next plugin (recursivity
        return callPluginsSequencialy.bind(this)(i + 1, arguments);
      }.bind(this));
    }

    // If the plugin does not implement the hook, we move to the next plugin (recursivity)
    return callPluginsSequencialy.bind(this)(i + 1, args);
  };
  // Call the recursive function
  return callPluginsSequencialy.bind(this)(0, args);
};

/******************************************************
 * Add helper functions to the Lager constructor
 ******************************************************/

/**
 * Take a string as parameter and return a role ARN
 * @type {function}
 */
Lager.prototype.retrieveRoleArn = retrieveRoleArn;


module.exports = new Lager();




// const util = require('util');
// module.exports.buildSpecs()
// .then((apis) => {
//   var util = require('util');
//   console.log(util.inspect(apis, false, null));
// });

// module.exports.registerPlugin({
//   name: 'myTestPlugin',
//   testEvent: function(aString, anObject) {
//     console.log('Inside the hook myTestPlugin', aString, anObject);
//     anObject.c = 3;
//     return Promise.resolve([aString + '123', anObject]);
//   }
// });
//
// module.exports.registerPlugin({
//   name: 'anotherTestPlugin',
//   testEvent: function(aString, anObject) {
//     console.log('Inside the hook anotherTestPlugin', aString, anObject);
//     anObject.d = 4;
//     return Promise.resolve([aString + 'xyz', anObject]);
//   }
// });
//
//
// module.exports.fire('testEvent', 'abc', { a: 1, b: 2 })
// .spread(function(aString, anObject) {
//   console.log(aString, anObject);
// });
