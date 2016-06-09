'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const file = require('file');

const _ = require('lodash');
const AWS = require('aws-sdk');

const ApiSpecification = require('./api_specification');
const EndpointSpecification = require('./endpoint_specification');
const apiGatewayHelperFn = require('./api_gateway_helper');


AWS.config.apiVersions = {
  apigateway: '2015-07-09',
  iam: '2010-05-08'
};
let apiGateway;
let apiGatewayHelper;
let iam;

/**
 * Constructor function
 *
 * @param Object options
 * {
 *   credentials: Object AWS.Credentials
 *   region: String,
 *   environment: String
 * }
 */
let specBuilder = function(options) {
  apiGateway = new AWS.APIGateway(options);
  apiGatewayHelper = apiGatewayHelperFn(apiGateway);
  iam = new AWS.IAM();
};
