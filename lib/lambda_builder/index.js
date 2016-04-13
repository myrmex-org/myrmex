'use strict';

const util = require('util');
const EventEmitter = require('events');
const AWS = require('aws-sdk');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

AWS.config.apiVersions = {
  lambda: '2015-03-31',
  iam: '2010-05-08'
};
var lambda;
var iam;


/**
 * Constructor function
 * @param Object options
 * {
 *   credentials: Object AWS.Credentials
 *   region: String
 *   environment: String
 * }
 */
var LambdaBuilder = function(options) {
  EventEmitter.call(this);
  this.environment = options.environment || 'NO-ENV';
  lambda = new AWS.Lambda(options);
  iam = new AWS.IAM();
};
/**
 * LambdaBuilder inherits from EventEmitter
 * https://nodejs.org/dist/latest-v4.x/docs/api/events.html#events_class_eventemitter
 * https://nodejs.org/dist/latest-v4.x/docs/api/util.html#util_util_inherits_constructor_superconstructor
 * @param  {function} LambdaBuilder - constructor
 * @param  {function} EventEmitter  - superconstructor
 */
util.inherits(LambdaBuilder, EventEmitter);


/* istanbul ignore next */
/**
 * Deploy all lambda functions in a directory
 * @param  String path - path to the lambda definitions
 * @return Promise
 */
LambdaBuilder.prototype.deployAll = function(path) {
  this.emit('beforeDeployAll');

  // Retrieve lambda configuration directories
  var lambdaPaths = _.map(fs.readdirSync(path), function(dirName) {
    return path + '/' + dirName;
  });

  // Run the functions in serie
  return Promise.mapSeries(lambdaPaths, this.deploy.bind(this))
  .then(result => {
    this.emit('afterDeployAll', result);
    return Promise.resolve(result);
  });
};

/* istanbul ignore next */
/**
 * Deploy a lambda function
 * @param  String pathToLambda
 * @return Promise
 */
LambdaBuilder.prototype.deploy = function(pathToLambda) {
  var t = process.hrtime();
  var config = require(process.cwd() + '/' + pathToLambda + '/config');
  // The name is used to generate the function name and select the endpoints using the lambda
  config.name = path.basename(pathToLambda);

  this.emit('beforeDeploy', config);

  var buffer = null;
  var functionName = this.environment + '_' + config.name;
  console.log(' * Deploying \x1b[0;36m' + functionName + ' \x1b[0m');

  var params = config.params || {};
  params = _.assign({
    FunctionName: functionName,
    Handler: 'lambda.handler',
    Role: 'PLEASE-CONFIGURE-AN-EXECUTION-ROLE-FOR-' + functionName,
    Runtime: 'nodejs4.3',
    Timeout: 15,
    Publish: false
  }, params);

  var dependencies = _.map(
    config.includeLibs || [],
    function(libDir) { return 'libs/' + libDir; }
  );

  if (config.includeEndpoints) {
    dependencies.push('endpoints');
  }

  return getPackageBuffer(pathToLambda, dependencies)
  .then((packageBuffer) => {
    buffer = packageBuffer;
    console.log('   * Archive built in %d seconds', process.hrtime(t)[0]);
    return Promise.promisify(lambda.getFunction.bind(lambda))({ FunctionName: params.FunctionName });
  })
  .then(() => {
    // If the function already exists, delete old versions
    console.log('   * The lambda already exists');
    // @TODO delete old versions to free space, see if we can use aliases to do this securely
  //   return Promise.promisify(deleteLambda)(params);
  // })
  // .then(function() {
    // Update the lambda
    return this.updateLambda(buffer, params);
  })
  .then((data) => {
    // Publish a new version
    console.log('   * Updated lambda in %d seconds', process.hrtime(t)[0]);
    console.log('   * Memory usage: ', util.inspect(process.memoryUsage()));
    return publishVersion(data.FunctionName);
  })
  .then((data) => {
    console.log('   * Published \x1b[0;36mversion ' + data.Version + '\x1b[0m');
    console.log('   * Function ARN: \x1b[0;36m' + data.FunctionArn + '\x1b[0m\n');
    data.name = config.name;
    this.emit('afterDeploy', data);
    return data;
  })
  .catch((e) => {
    // Check the type of error
    if (e.code !== 'ResourceNotFoundException') {
      throw(e);
    }
    // If error occured because the function does not exists, we create it
    console.log('   * The lambda does not exists');
    return this.createLambda(buffer, params)
    .then((data) => {
      // Publish a new version
      console.log('   * Created lambda in %d seconds', process.hrtime(t)[0]);
      console.log('   * Memory usage: ', util.inspect(process.memoryUsage()));
      return publishVersion(data.FunctionName);
    })
    .then((data) => {
      console.log('   * Published \x1b[0;36mversion ' + data.Version + '\x1b[0m');
      console.log('   * Function ARN: \x1b[0;36m' + data.FunctionArn + '\x1b[0m\n');
      data.name = config.name;
      this.emit('afterDeploy', data);
      return data;
    });
  });
};


/**
 * Create a zip package for a lambda and provide it's content in a buffer
 *
 * @param String lambdaPath - path to the function
 * @param Array dependenciesPaths - directories to include in the the function
 * @param Function cb
 */
function getPackageBufferCb(lambdaPath, dependenciesPaths, cb) {
  dependenciesPaths = dependenciesPaths || [];

  var archivePath = '/tmp/' + (new Buffer(lambdaPath).toString('base64')) + '.zip';
  var outputStream = fs.createWriteStream(archivePath);
  var archive = archiver.create('zip', {});
  outputStream.on('close', function() {
    fs.readFile(archivePath, cb);
  });

  archive.on('error', function(e) {
    cb(e);
  });

  archive.pipe(outputStream);

  // Add the Lamba code to the archive
  archive.directory(lambdaPath, '');

  // Add the library code (aka code in common for all lambdas) to the archive
  dependenciesPaths.forEach(function (path) {
     archive.directory(path);
  });

  // Add the application configuration of the environment to the archive
  var envConfig = process.env;
  envConfig.LAMBDA = true;
  archive.append(JSON.stringify(envConfig), { name: 'env_config.json' });

  archive.finalize();
}
// How to improve this code?
// Is it possible to return a promise without using `Promise.promisify` considering the EventEmitter?
var getPackageBuffer = Promise.promisify(getPackageBufferCb);


/* istanbul ignore next */
/**
 * Create a function
 * @param Buffer buffer - The zip package containing the lambda
 * @param Object params
 * {
 *   FunctionName: String,
 * }
 * @param Function cb
 * @return Promise
 */
LambdaBuilder.prototype.createLambda = function(buffer, params) {
  params = _.cloneDeep(params);
  params.Code = { ZipFile: buffer };
  return retrieveRoleArn(params.Role, this.environment)
  .then((roleArn) => {
    params.Role = roleArn;
    return Promise.promisify(lambda.createFunction.bind(lambda))(params);
  });
};


/* istanbul ignore next */
/**
 * Update a function code and configuration
 * @param Buffer buffer - The zip package containing the lambda
 * @param Object params
 * {
 *   FunctionName: String,
 *   Description: String,
 *   Handler: String,
 *   MemorySize: int,
 *   Role: String,
 *   Timeout: int
 * }
 * @return Promise
 */
LambdaBuilder.prototype.updateLambda = function(buffer, params) {
  var codeParams = {
    FunctionName: params.FunctionName,
    Publish: params.Publish,
    ZipFile: buffer
  };
  return Promise.promisify(lambda.updateFunctionCode.bind(lambda))(codeParams)
  .then((data) => {
    return retrieveRoleArn(params.Role, this.environment);
  })
  .then((roleArn) => {
    var configParams = {
      FunctionName: params.FunctionName,
      Description: params.Description,
      Handler: params.Handler,
      MemorySize: params.MemorySize,
      Role: roleArn,
      Timeout: params.Timeout
    };
    return Promise.promisify(lambda.updateFunctionConfiguration.bind(lambda))(configParams);
  });
};


/* istanbul ignore next */
/**
 * Create a new version of a lambda
 * @param  String functionName - The name of the lambda
 * @return Promise
 */
function publishVersion(functionName) {
  return Promise.promisify(lambda.publishVersion.bind(lambda))({FunctionName: functionName});
}


/* istanbul ignore next */
/**
 * Retrieve a role Arn from a identifier that can be either the ARN or the name
 * @param  String identifier - The name or the ARN of the role
 * @return Promise
 */
function retrieveRoleArn(identifier, environment) {
  if (/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+]/.test(identifier)) {
    return Promise.resolve(identifier);
  }
  return Promise.promisify(iam.getRole.bind(iam))({ RoleName: identifier })
  .then((data) => {
    return Promise.resolve(data.Role.Arn);
  })
  .catch((e) => {
    if (e && environment) {
      return retrieveRoleArn(environment + '_' + identifier);
    }
    return Promise.reject(e);
  });
}

module.exports = LambdaBuilder;
