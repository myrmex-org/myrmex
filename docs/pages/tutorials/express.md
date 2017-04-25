---
title: Deploying an express app in Lambda
keywords: lager, api-gateway, lambda, express
tags: [getting_started, tutorial, api-gateway, lambda]
summary: "In this tutorial, we will see how to deploy an existing express application in Lambda."
sidebar: home_sidebar
permalink: express.html
folder: tutorials
---

Starting with an Express application
---

We will start to create a basic Express application following [the documentation](https://expressjs.com/en/starter/generator.html).

```bash
$ # Installation of the express generator
$ npm install express-generator -g
$ # Creation of a basic application
$ express --view=pug myapp
$ # Installation of dependencies
$ cd myapp && npm install
```

We start the application locally to check that everything works correctly.

```bash
$ set DEBUG=myapp:* & npm start
```

Visit ttp://127.0.0.1:3000/.

Adding Lager to the project
---

Be sure that the Lager cli is installed

```bash
$ npm install -g @lager/cli
```

Deploy Express in AWS Lambda and API Gateway
---

Add the package lambda-express to the project
===

[lambda-express](https://www.npmjs.com/package/lambda-express) is a npm package that call Express with the data sent from API Gateway to a Lambda integration.  

```bash
$ npm install --save lambda-express
```

Edit `app.js` to load `lambda-express` and expose a Lambda handler.

```javascript
var lambdaExpress = require('lambda-express');

// original content of app.js

exports.handler = lambdaExpress.appHandler(app);
```

The Express application can continue to work "normally".

Install Lager in the project
===

```bash
$ # For the prompt "What is your project name?", leave it empty, so Lager will be installed in the same directory that express
$ # We will need the plugins @lager/iam @lager/api-gateway and @lager/node-lambda
$ lager new @lager/iam @lager/api-gateway @lager/node-lambda
```

Lager and its plugins will be installed in the section `devDependencies` of the file `package.json`.

Creation of IAM roles
===

We create two IAM roles: one to allow Lambda to write in cloudwatch and the other to allow API Gateway to invoke Lambda.

```bash
$ lager create-role MyExpressAppLambdaExecution -m LambdaBasicExecutionRole
$ lager create-role MyExpressAppLambdaInvocation -m APIGatewayLambdaInvocation
```

Creation of the Lambda
===

lager create-node-lambda express -t 30 -m 256 -r MyExpressAppLambdaExecution

```json
{
  "name": "express",
  "version": "0.0.0",
  "dependencies": {
    "my-express-app": "../../.."
  }
}
```

```javascript
module.exports.handler = require('myExpressApp');
```

Creation of the API
===
