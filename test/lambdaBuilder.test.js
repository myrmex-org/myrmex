"use strict";

var assert = require("assert");
var lb = require("../lambdaBuilder");

describe("The lambdaBuilder module", function() {

  var lambdaBuilder = null;

  before(function() {
    lambdaBuilder = new lb({ region: "an-aws-region" });
  });

  it("should create a lambda builder instance", function (done) {
    assert.ok(lambdaBuilder, "a lambdaBuilder has been created");
    assert.ok(typeof lambdaBuilder.deploy === "function", "a lambdaBuilder has a `deploy()` method");
    done();
  });

  it("should create a zip package for a lambda and provide it\"s content in a buffer", function (done) {
    this.timeout(20000);
    lambdaBuilder.getPackageBuffer("test/test-endpoints/path/{param}/GET", ["endpoints", "lib"], function(err, buffer) {
      assert.ok(!err, "no error has been returned");
      assert.ok(Buffer.isBuffer(buffer), "a buffer has been returned");
      done();
    });
  });

});
