/*eslint-env mocha */
'use strict';

const assert = require('assert');

describe('Creation and deployment of a Lambda project', () => {

  let icli;

  before(() => {
    process.chdir(__dirname);
    delete require.cache[require.resolve('../../packages/cli/src/bin/lager')];
    return require('../../packages/cli/src/bin/lager')
    .then(lagerCli => {
      icli = lagerCli;
    });
  });

  describe('Creation of an execution role', () => {
    it('should be done via the sub-command "create-role"', () => {
      return icli.parse('node script.js create-role LambdaInspection -p LambdaBasicExecutionRole'.split(' '))
      .then(res => {
        assert.ok(true);
      });
    });
  });

  describe('Creation of a node module', () => {
    it('should be done via the sub-command "create-node-module"', () => {
      return icli.parse('node script.js create-node-module inspection'.split(' '))
      .then(res => {
        assert.ok(true);
      });
    });
  });

  describe('Creation of node Lambdas', () => {
    it('should be done via the sub-command "create-node-lambda"', () => {
      return icli.parse('node script.js create-node-lambda config-128 -t 30 -m 128 --dependencies inspection -r LambdaInspection'.split(' '))
      .then(res => {
        return icli.parse('node script.js create-node-lambda config-512 -t 30 -m 512 --dependencies inspection -r LambdaInspection'.split(' '));
      })
      .then(res => {
        return icli.parse('node script.js create-node-lambda config-1536 -t 30 -m 1536 --dependencies inspection -r LambdaInspection'.split(' '));
      })
      .then(res => {
        assert.ok(true);
      });
    });
  });

  describe('Local execution of node Lambdas', () => {
    it('should be done via the sub-command "test-node-lambda"', () => {
      return icli.parse('node script.js test-node-lambda config-128 -r us-east-1 -e DEV -s v0 --event test'.split(' '))
      .then(res => {
        assert.ok(true);
      });
    });
  });

  describe('Deployment of node Lambdas', () => {
    it('should be done via the sub-command "deploy-node-lambdas"', () => {
      return icli.parse('node script.js deploy-node-lambdas config-128 config-1536 config-512 config-1536 -r us-east-1 -e DEV -s v0'.split(' '))
      .then(res => {
        assert.ok(true);
      });
    });
  });


  describe('Execution of node Lambdas in AWS', () => {
    it('should be done via the sub-command "deploy-node-lambdas"', () => {
      return icli.parse('node script.js test-node-lambda config-128 -r us-east-1 -e DEV -s v0'.split(' '))
      .then(res => {
        return icli.parse('node script.js test-node-lambda config-512 -r us-east-1 -e DEV -s v0'.split(' '));
      })
      .then(res => {
        return icli.parse('node script.js test-node-lambda config-1536 -r us-east-1 -e DEV -s v0'.split(' '));
      })
      .then(res => {
        assert.ok(true);
      });
    });
  });

});
