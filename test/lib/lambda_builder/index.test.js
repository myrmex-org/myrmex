'use strict';

var assert = require('assert');
var lb = require('../../../lib/lambda_builder');

describe('The lambda_builder module', function() {

  var lambdaBuilder = null;

  before(function() {
    lambdaBuilder = new lb({ region: 'an-aws-region' });
  });

  it('should create a lambda builder instance', function (done) {
    assert.ok(lambdaBuilder, 'a lambdaBuilder has been created');
    assert.ok(typeof lambdaBuilder.deploy === 'function', 'a lambdaBuilder has a `deploy()` method');
    done();
  });

});
