'use strict';

module.exports = function buildLambdaPackageHook(lambda, codeParams) {
  // Create zip of the Lambda (without installing dependencies)
  // Upload zip to S3
  // Execute the Lambda function that performs the installation
  // Retrieve the location of the final zip on S3
};
