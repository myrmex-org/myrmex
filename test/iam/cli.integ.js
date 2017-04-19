/*eslint-env mocha */
'use strict';

const path = require('path');
const assert = require('assert');
const Promise = require('bluebird');
const fs = require('fs-extra');
const remove = Promise.promisify(fs.remove);
const catchStdout = require('../catch-stdout');
const icli = require('../../packages/cli/src/bin/lager');
const showStdout = !!process.env.LAGER_SHOW_STDOUT;

describe('Definition of IAM permissions', () => {

  before(() => {
    process.chdir(__dirname);
  });

  beforeEach(() => {
    return icli.init();
  });

  after(() => {
    return Promise.all([
      remove(path.join(__dirname, 'iam')),
      remove(path.join(__dirname, 'lager.log'))
    ]);
  });

  it('should allow to define policies', () => {
    catchStdout.start(showStdout);
    return icli.parse('node script.js create-policy integration-test-policy'.split(' '))
    .then(res => {
      const stdout = catchStdout.stop();
      assert.ok(stdout.indexOf('The IAM policy \x1b[36mintegration-test-policy\x1b[0m has been created') > -1);
      const path = icli.lager.getConfig('iam.policiesPath');
      const policy = require('./' + path + '/integration-test-policy');
      assert.equal(policy.Statement[0].Effect, 'Deny');
    });
  });

  it('should allow to deploy policies', () => {
    catchStdout.start(showStdout);
    return icli.parse('node script.js deploy-policies integration-test-policy -e TEST -s v0'.split(' '))
    .then(res => {
      const stdout = catchStdout.stop();
      assert.ok(stdout.indexOf('Policies deployed') > -1);
      assert.ok(stdout.indexOf('TEST_integration-test-policy_v0') > -1);
    });
  });

});
