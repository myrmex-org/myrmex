'use strict';

var _ = require('lodash');
var AWS = require('aws-sdk');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var util = require('util');

AWS.config.apiVersions = {
  lambda: '2015-03-31',
  iam: '2010-05-08'
};
var namePrefix = '';
var lambda;
var iam;


/**
 * Constructor function
 *
 * @param Object options
 * {
 *   credentials: Object AWS.Credentials
 *   region: String
 *   namePrefix: String
 * }
 */
var lambdaBuilder = function(options) {
  namePrefix = options.namePrefix || 'NO-PREFIX';
  lambda = new AWS.Lambda(options);
  iam = new AWS.IAM();
};

/* istanbul ignore next */
/**
 * Deploy all lambda functions in a directory
 * @param  String path - path to the lambda definitions
 * @return Promise
 */
lambdaBuilder.prototype.deployAll = function(path) {
  // Retrieve lambda configuration directories
  var lambdaPaths = _.map(fs.readdirSync(path), function(dirName) {
    return path + '/' + dirName;
  });

  // Run the functions in serie
  return Promise.mapSeries(lambdaPaths, this.deploy.bind(this));
};

/* istanbul ignore next */
/**
 * Deploy a lambda function
 * @param  String pathToLambda
 * @return Promise
 */
lambdaBuilder.prototype.deploy = function(pathToLambda) {
  var t = process.hrtime();
  var config = require(process.cwd() + '/' + pathToLambda + '/config');
  // The name is used to generate the function name and select the endpoints using the lambda
  config.name = path.basename(pathToLambda);
  var buffer = null;
  var functionName = namePrefix + '_' + config.name;
  console.log(' * Deploying \x1b[0;36m' + functionName + ' \x1b[0m');

  var params = config.params || {};
  params = _.assign({
    FunctionName: functionName,
    Handler: 'lambda.handler',
    Role: 'PLEASE-CONFIGURE-AN-EXECUTION-ROLE-FOR-' + functionName,
    Runtime: 'nodejs',
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
  .then(function(packageBuffer) {
    buffer = packageBuffer;
    console.log('   * Archive built in %d seconds', process.hrtime(t)[0]);
    return Promise.promisify(lambda.getFunction.bind(lambda))({ FunctionName: params.FunctionName });
  })
  .then(function() {
    // If the function already exists, delete old versions
    console.log('   * The lambda already exists');
    // @TODO delete old versions to free space, see if we can use aliases to do this securely
  //   return Promise.promisify(deleteLambda)(params);
  // })
  // .then(function() {
    // Update the lambda
    return updateLambda(buffer, params);
  })
  .then(function(data) {
    // Publish a new version
    console.log('   * Updated lambda in %d seconds', process.hrtime(t)[0]);
    console.log('   * Memory usage: ', util.inspect(process.memoryUsage()));
    return publishVersion(data.FunctionName);
  })
  .then(function(data) {
    console.log('   * Published \x1b[0;36mversion ' + data.Version + '\x1b[0m');
    console.log('   * Function ARN: \x1b[0;36m' + data.FunctionArn + '\x1b[0m\n');
    data.name = config.name;
    return data;
  })
  .catch(function(err) {
    // Check the type of error
    if (err.code !== 'ResourceNotFoundException') {
      throw(err);
    }
    // If error occured because the function does not exists, we create it
    console.log('   * The lambda does not exists');
    return createLambda(buffer, params)
    .then(function(data) {
      // Publish a new version
      console.log('   * Created lambda in %d seconds', process.hrtime(t)[0]);
      console.log('   * Memory usage: ', util.inspect(process.memoryUsage()));
      return publishVersion(data.FunctionName);
    })
    .then(function(data) {
      console.log('   * Published \x1b[0;36mversion ' + data.Version + '\x1b[0m');
      console.log('   * Function ARN: \x1b[0;36m' + data.FunctionArn + '\x1b[0m\n');
      data.name = config.name;
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

  archive.on('error', function(err) {
    cb(err);
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
function createLambda(buffer, params) {
  params = _.cloneDeep(params);
  params.Code = { ZipFile: buffer };
  return retrieveRoleArn(params.Role)
  .then(function(roleArn) {
    params.Role = roleArn;
    return Promise.promisify(lambda.createFunction.bind(lambda))(params);
  });
}


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
 * @param Function cb
 * @return Promise
 */
function updateLambda(buffer, params) {
  var codeParams = {
    FunctionName: params.FunctionName,
    Publish: params.Publish,
    ZipFile: buffer
  };
  return Promise.promisify(lambda.updateFunctionCode.bind(lambda))(codeParams)
  .then(function(data) {
    return retrieveRoleArn(params.Role);
  })
  .then(function(roleArn) {
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
}


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
function retrieveRoleArn(identifier) {
  if (/arn:aws:iam::\d{12}:role\/?[a-zA-Z_0-9+=,.@\-_/]+]/.test(identifier)) {
    return Promise.resolve(identifier);
  }
  return Promise.promisify(iam.getRole.bind(iam))({ RoleName: identifier })
  .then(function(data) {
    return Promise.resolve(data.Role.Arn);
  });
}

module.exports = lambdaBuilder;
