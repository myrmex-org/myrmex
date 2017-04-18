/*eslint-env mocha */
'use strict';

const path = require('path');
const assert = require('assert');
const Promise = require('bluebird');
const fs = require('fs-extra');
const remove = Promise.promisify(fs.remove);
const icli = require('../../packages/cli/src/bin/lager');

describe('Creation of a new project', () => {

  before(() => {
    process.chdir(__dirname);
  });

  beforeEach(() => {
    return icli.init();
  });

  after(() => {
    return remove(path.join(__dirname, 'my-project'));
  });

  it('should be done via the sub-command "new"', function() {
    this.timeout(120000);
    return icli.parse('node script.js new my-project @lager/iam'.split(' '))
    .then(res => {
      assert.ok(true);
    });
  });

});
