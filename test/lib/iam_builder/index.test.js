'use strict';

var assert = require('assert');
var iamBuilder = require('../../../lib/iam_builder');

describe('The iam_builder module', function() {

  it('should export the IAM builder', function (done) {
    assert.ok(iamBuilder, 'iamBuilder has been created');
    assert.ok(typeof iamBuilder.policyBuilder === 'function', 'iamBuilder expose  a policyBuilder constructor');
    assert.ok(typeof iamBuilder.roleBuilder === 'function', 'iamBuilder expose a roleBuilder constructor');
    assert.ok(typeof iamBuilder.deployAll === 'function', 'iamBuilder expose a function to deploy all ploicies and roles');
    done();
  });

});
