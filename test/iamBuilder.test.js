"use strict";

var assert = require("assert");
var ib = require("../iamBuilder");

describe("The iamBuilder module", function() {

  var iamBuilder = null;

  it("should create a IAM builder instance", function (done) {
    iamBuilder = new ib({ region: "an-aws-region" });
    assert.ok(iamBuilder, "an iamBuilder has been created");
    assert.ok(typeof iamBuilder.createOrUpdateRole === "function", "an iamBuilder has a `createOrUpdateRole()` method");
    assert.ok(typeof iamBuilder.createOrUpdatePolicy === "function", "an iamBuilder has a `createOrUpdatePolicy()` method");
    done();
  });

});
