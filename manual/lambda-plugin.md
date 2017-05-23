# Lambda plugin

The Lambda plugin allows to define and deploy Lambdas. It should work with any runtime but has been tested mostly with
Node.js and secondly with Python.

## Prerequisites

To use the `@lager/lambda` plugin, it is necessary to have a minimal knowledge about
[AWS Lambda](https://aws.amazon.com/lambda/).

An AWS user or role that uses the plugin `@lager/lambda` must have access to Lambda administration. The AWS policy
`AWSLambdaFullAccess` gives all necessary permissions.

## Installation

Install the node module in a lager project:

```bash
npm install @lager/lambda
```

Then enable the plugin in the `lager.json` config file:

```json
{
  "name": "my-app",
  "plugins": [
    "@lager/lambda"
  ]
}
```

Once the plugin is installed and enabled in the project, the `lager` command line will provide new sub-commands to manage and
deploy Lambdas.

## Project anatomy

By default, the content managed by the Lambda plugin is located in an `lambda` directory in the root directory of the
project.

Out of the box, for the Node.js runtime, the Lambda plugin allows to separate the definition of Lambdas from the logic of the
application by providing a specific place to write node modules but it is not mandatory to use it. `@lager/lambda` helps to
define and deploy Lambdas but the developer is responsible of the implementation of the application. Other plugins built on
top of the Lambda plugin may be more opinionated.

The directory `lambda/lambdas` contains the Lambdas definitions. For each of its sub-directory is considered as a
Lambda definition. It must contains a `config.json` file and the code of the Lambda. The name of the subdirectory is used
as the Lambda identifier.

The `config.json` file allows to define the runtime, the timeout, the memory, the role and other properties of the Lambda.
The content of the `params` property is used as the argument of the following methods from the AWS SDK:

* [`createFunction()`](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#createFunction-property)
* [`updateFunctionCode()`](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateFunctionCode-property)
* [`updateFunctionConfiguration()`](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateFunctionConfiguration-property)

By default, for the NodeJS runtime, the directory `lambda/modules` contains the node modules of the project. For example,
some of these modules could be named `log`, or `data-access` or `authorization` etc...

Each module should have a clear responsibility so that each Lambda can embed only the code it needs. This is a recommendation
but the developer is free to organize the code as he want. The Lambda plugin does not force you to use a specific project
organization.

This is what a project structure could look like:

```text
lambda
├── lambdas                         The Lambdas defined by the application
|   ├── my-lambda                   The name of this directory is the identifier of a Lambda
|   |   ├── config.json             The configuration of the Lambda (runtime, memory, timeout, execution role...)
|   |   ├── index.js                A node module that exposes the handler
|   |   └── package.json            It is possible to install the dependencies of the Lambda here
|   └── my-other-lambda
|       ├── config.json
|       └── index.js
└── modules                         The node modules of the application - they can be added as a dependency of a Lambda in its
    |                               package.json file
    ├── authorization               The name of this directory is the identifier of a module
    |   ├── package.json            Package file of the module
    |   ├── index.js                Main file of the module
    |   └── test                    If you wish, you can write the code to test the module in this directory
    ├── data-access
    |   ├── package.json
    |   └── index.js
    └── log
        ├── package.json
        └── index.js
```

Example of `config.json` file:

```json
{
  "params": {
    "Timeout": 30,
    "MemorySize": 256,
    "Role": "arn:aws:iam::123456789012:role/MyRole",
    "Runtime": "nodejs6.10",
    "Handler": "index.handler"
  }
}
```

The `package.json` of a module or a Lambda can declare dependencies with other modules using file paths in the `dependencies`
property:

```json
{
  "name": "data-access",
  "version": "0.0.0",
  "dependencies": {
    "log": "../log"
  }
}
```

In this case, `require('log')` will load the module `log` installed in `lambda/modules/data-access/node_modules/log`.

It is recommended to use a recent version of `npm` to minimize the size of the Lambda packages and facilitate the
configuration of nested dependencies. Indeed, `npm@2` can behave in an unexpected manner with nested dependencies when using
file paths.

## Commands

### create-lambda

### create-node-module

### deploy-lambdas

### install-lambdas-locally

### test-lambda-locally

### test-lambda
