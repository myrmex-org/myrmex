'use strict';

var assert = require('assert');
var sb = require('../swaggerBuilder');

describe('The swaggerBuilder module', function() {

  var swaggerBuilder = null;

  it('should create a swagger builder instance', function (done) {
    var swaggerBuilderOptions = {
      "region": 'an-aws-region',
      "api-config": {
        "name": "An API name"
      }
    };
    sb.factory(swaggerBuilderOptions, function(err, result) {
      swaggerBuilder = result;
      done();
    });
    assert.ok(swaggerBuilder, 'a swaggerBuilder has been created');
    assert.ok(typeof swaggerBuilder.getDefinition === 'function', 'a swaggerBuilder has a "getDefinition" method');
    assert.ok(typeof swaggerBuilder.appendEndpointDef === 'function', 'a swaggerBuilder has a "appendEndpointDef" method');
    assert.ok(typeof swaggerBuilder.addPackageInfo === 'function', 'a swaggerBuilder has a "addPackageInfo" method');
    assert.ok(typeof swaggerBuilder.addModelDefinition === 'function', 'a swaggerBuilder has a "addModelDefinition" method');
    assert.ok(typeof swaggerBuilder.writeFile === 'function', 'a swaggerBuilder has a "writeFile" method');
    assert.ok(typeof swaggerBuilder.aggregateDefinitions === 'function', 'a swaggerBuilder has a "aggregateDefinitions" method');
    assert.ok(typeof swaggerBuilder._enrichSwaggerDef === 'function', 'a swaggerBuilder has a "_enrichSwaggerDef" method');
    done();
  });

  it('should append an endpoint to a swagger definition', function (done) {
    var endpoint = {"path":"/user/{id}","method":"GET"};
    var swaggerDefOrig = require('./swaggerEndpointDef.orig.json');
    var lambdaData = {"FunctionArn":"Zazcar-TEST-user-_id__GET", "FunctionName":"Zazcar-TEST-user-_id__GET"};
    var swaggerDefResult = require('./swaggerEndpointDef.result.json');
    swaggerBuilder.appendEndpointDef(endpoint, swaggerDefOrig, lambdaData);
    assert.ok(JSON.stringify(swaggerBuilder.getDefinition().paths['/user/{id}'].get) === JSON.stringify(swaggerDefResult), 'the generated definition has the expected format');
    done();
  });

  it('should aggregate the swagger definition from a directory structure', function (done) {
    var endpointDefinition = swaggerBuilder.aggregateDefinitions(
      __dirname + '/swagger-aggregation',
      __dirname + '/swagger-aggregation/dir1/dir2/dir3'
    );
    var expectedDefinition = require('./swagger-aggregated.json');
    assert.ok(JSON.stringify(endpointDefinition) === JSON.stringify(expectedDefinition), 'the agregated definition has the expected format');
    done();
  });

  it('should write the swagger definition in a file for a specific stage (for API developer documentation)', function (done) {
    swaggerBuilder.writeFile(__dirname + '/swagger.unit.json', 'unit', function(err, result) {
      assert.ok(!err, 'no error has been returned');
      done();
    });
  });

  it('should write the swagger definition in a file without specifying a stage (for API Gateway importation)', function (done) {
    swaggerBuilder.writeFile(__dirname + '/swagger.unit.json', function(err, result) {
      assert.ok(!err, 'no error has been returned');
      done();
    });
  });

});
