'use strict';

var policyBuilder = require('./policy_builder')
  , roleBuilder = require('./role_builder');


module.exports = {
  policyBuilder: policyBuilder,
  roleBuilder: roleBuilder,
  deployAll: function(path, options) {
    return (new policyBuilder(options)).deployAll(path + '/policies')
    .then(function(policies) {
      return (new roleBuilder(options)).deployAll(path + '/roles');
    });
  }
};
