'use strict';

var assert = require('assert');
var ad = require('../../../lib/swagger_builder/api_definition');

describe('The swagger_builder/apis_definition module', function() {

  var apiDefinition = null;

  before(function() {
    var swagger = {};
    var config = {};
    apiDefinition = new ad(swagger, config);
  });

  it('should be able to create an instance of ApiDefinition', function (done) {
    assert.ok(apiDefinition, 'an ApiDefinition has been created');
    assert.ok(typeof apiDefinition.addEndpointDefinition === 'function', 'an apiDefinition has a "addEndpointDefinition" method');
    assert.ok(typeof apiDefinition.addPackageInfo === 'function', 'an apiDefinition has a "addPackageInfo" method');
    assert.ok(typeof apiDefinition.addModelDefinition === 'function', 'an apiDefinition has a "addModelDefinition" method');
    assert.ok(typeof apiDefinition.writeFile === 'function', 'an apiDefinition has a "writeFile" method');
    done();
  });
/*
  it('should append an endpoint to a swagger definition', function (done) {
    var endpoint = {"path":"/user/{id}","method":"GET"};
    var swaggerDefOrig = require('./swaggerEndpointDef.orig.json');
    var lambdaData = {"FunctionArn":"Lager-TEST-user-_id__GET", "FunctionName":"Lager-TEST-user-_id__GET"};
    var swaggerDefResult = require('./swaggerEndpointDef.result.json');
    apiDefinition.appendEndpointDef(endpoint, swaggerDefOrig, lambdaData);
    assert.ok(JSON.stringify(apiDefinition.getDefinition().paths['/user/{id}'].get) === JSON.stringify(swaggerDefResult), 'the generated definition has the expected format');
    done();
  });

  it('should write the swagger definition in a file for a specific stage (for API developer documentation)', function (done) {
    apiDefinition.writeFile(__dirname + '/swagger.unit.json', 'unit', function(err, result) {
      assert.ok(!err, 'no error has been returned');
      done();
    });
  });

  it('should write the swagger definition in a file without specifying a stage (for API Gateway importation)', function (done) {
    apiDefinition.writeFile(__dirname + '/swagger.unit.json', function(err, result) {
      assert.ok(!err, 'no error has been returned');
      done();
    });
  });
*/
});
