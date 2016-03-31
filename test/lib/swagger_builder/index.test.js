'use strict';

var assert = require('assert');
var sb = require('../../../lib/swagger_builder');

describe('The swagger_builder module', function() {

  var swaggerBuilder = null;

  before(function() {
    swaggerBuilder = new sb({ region: 'an-aws-region' });
  });

  it('should create a swagger builder instance', function (done) {
    assert.ok(swaggerBuilder, 'a swaggerBuilder has been created');
    assert.ok(typeof swaggerBuilder.initDefinition === 'function', 'a swaggerBuilder has a "initDefinition" method');
    assert.ok(typeof swaggerBuilder.aggregateDefinitions === 'function', 'a swaggerBuilder has a "aggregateDefinitions" method');
    done();
  });
/*
  it('should aggregate the swagger definition from a directory structure', function (done) {
    var endpointDefinition = swaggerBuilder.aggregateDefinitions(
      __dirname + '../../testing-app/endpoints/',
      __dirname + '../../testing-app/endpoints/path/{params}/GET'
    );
    var expectedDefinition = require('./swagger-aggregated.json');
    assert.ok(JSON.stringify(endpointDefinition) === JSON.stringify(expectedDefinition), 'the agregated definition has the expected format');
    done();
  });
*/
});
