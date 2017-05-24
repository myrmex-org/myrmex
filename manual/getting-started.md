# Getting started

## Configuring AWS

### Prerequisites

To work with Lager and its main plugins, you should to have some notions about:

*   AWS IAM
*   AWS Lambda
*   Amazon API Gateway
*   OpenAPI (aka Swagger) specification
*   Node.js

Lager aims to experiment quickly, but to really be efficient, it is necessary to know the AWS services that works with Lager.

### Permissions needed to deploy the project in AWS

Lager plugins that manage AWS resources need to have permissions to execute commands that communicate with the AWS API. When a
command needs these permissions, Lager will use the AWS credentials provided by the environment.

To begin to work with Lager, the following policies can be used:

*  `IAMFullAccess`
*  `AWSLambdaFullAccess`
*  `AmazonAPIGatewayAdministrator`

## Installation

**Prerequisites**: `node` (version 4 minimum) and `npm` (version 4 recommended) must be installed.

### Installing the Lager command line

The `lager` command line has its own npm module. Install it globally.

```bash
npm install -g @lager/cli
```

We can check that the `lager` command line is correctly installed.

```bash
# This command will show the available options and sub-commands
lager -h
```

At this point, there is only one sub-command available: `lager new`. When creating a project, other subcommands will be
provided by Lager plugins.

### Creating a new project

`lager new` is the command that creates new projects. If it is called without argument and/or option, it will provide a prompt
to define the configuration of the project.

```bash
# Using the command without option and argument,
# the user will be prompted to give information about the project configuration
lager new
```

The prompt will ask to choose a project name and to select the plugins to install among `@lager/iam`, `@lager/lambda` and
`@lager/api-gateway`. The plugin selection depend on the project. It is easy to install a plugin later if it is not done at
this step (see next section).

`lager new` will perform 3 operations:

*   create a project folder
*   install the latest version of Lager and the project's plugins
*   create a `lager.json` configuration file

Once the project is created we can enter its folder. Using `lager -h` we can see that new `lager` sub-commands are available.
They are provided by plugins that have been installed in the project.

### Installing plugins

`lager new` propose a selection of plugins to install but it is possible to install them or other plugins separately. Lager
plugins are npm packages. So the following command will install the plugin `@lager/api-gateway`:

```bash
npm install @lager/api-gateway --save-dev
```

To be loaded by Lager, the plugin needs to be referenced in the `lager.json` file, in the `plugins` section:

```json
{
  "name": "my-serverless-application",
  "plugins": [
    "@lager/api-gateway"
  ]
}
```

It is possible to disable a plugin by removing it from the `lager.json` file.

## Project configuration

Lager can be configured in different ways.

### The `lager.json` file

In the root directory of a Lager project, there is a `lager.json` file that contains the configuration of the project.

A `lager.json` file looks like this:

```json
{
  "name": "my-serverless-application",
  "plugins": [
    "@lager/iam",
    "@lager/api-gateway",
    "@lager/lambda"
  ],
  "config": {
    "myConfigKey": "my-config-value",
    "myNestedConfig": {
      "level1": 42,
      "level2": {
        "key1": true,
        "key2": false
      }
    }
  }
}
```

*   `name`: the identifier of the project.
*   `plugins`: the list of plugins that Lager has to register. A Lager plugin can be a node module installed via npm or
    defined in the project. A plugin installed via npm but specified here will not be registered by Lager.
*   `config`: the configuration of the project. Each plugin can use the it and inject default values in it.

The command `lager show-config` allows to see the current configuration of a project. This is the response of this command for
the previous `lager.json` file.

```json
  "myConfigKey": "my-config-value",
  "myNestedConfig": {
    "level1": 42,
    "level2": {
      "key1": true,
      "key2": false
    }
  },
  "iam": {
    "policiesPath": "iam/policies",
    "rolesPath": "iam/roles"
  },
  "apiGateway": {
    "apisPath": "api-gateway/apis",
    "endpointsPath": "api-gateway/endpoints",
    "modelsPath": "api-gateway/models"
  },
  "lambda": {
    "lambdasPath": "lambda/lambdas",
    "modulesPath": "lambda/modules"
  }
}
```

This example shows that the three plugins injected the configuration to define the location of the content that
they manage. It is possible to override this configuration in the `lager.json` file.

### Splitting the configuration into various files

If a project has a many configuration keys, it is possible to split the configuration object into various files in a folder
named `config`.

For the previous example, to define the same configuration that in the previous example, the directory structure will look
like this:

```text
project-root
├── lager.json
└── config
    └── myNestedConfig.json
```

The `lager.json` file:

```json
{
  "name": "planet-express",
  "plugins": [
    "@lager/iam",
    "@lager/api-gateway",
    "@lager/lambda"
  ],
  "config": {
    "myConfigKey": "my-config-value"
  }
}
```

The file `config/myNestedConfig.json`:

```json
{
  "level1": 42,
  "level2": {
    "key1": true,
    "key2": false
  }
}
```

The command `lager show-config` will give the same response:

```json
  "myConfigKey": "my-config-value",
  "myNestedConfig": {
    "level1": 42,
    "level2": {
      "key1": true,
      "key2": false
    }
  },
  "iam": {
    "policiesPath": "iam/policies",
    "rolesPath": "iam/roles"
  },
  "apiGateway": {
    "apisPath": "api-gateway/apis",
    "endpointsPath": "api-gateway/endpoints",
    "modelsPath": "api-gateway/models"
  },
  "lambda": {
    "lambdasPath": "lambda/lambdas",
    "modulesPath": "lambda/modules"
  }
}
```

### Using environment variables to override the configuration

It is also possible to define configuration via environment variables. Any environment variable that starts with `LAGER_`
is injected as a configuration key/value. An underscore is used to resolve nested keys.

> Because `_` is used to resolve nested key, this technique cannot work with configuration keys containing a `_`.

For example, the configuration of `myNestedConfig.level1` can be overrided using the environment variable
`LAGER_myNestedConfig_level1`:

```
export LAGER_myNestedConfig_level1=43
lager show-config
```

Result:

```json
{
  "myConfigKey": "my-config-value",
  "myNestedConfig": {
    "level1": "43",
    "level2": {
      "key1": true,
      "key2": false
    }
  },
  "iam": {
    "policiesPath": "iam/policies",
    "rolesPath": "iam/roles"
  },
  "apiGateway": {
    "apisPath": "api-gateway/apis",
    "endpointsPath": "api-gateway/endpoints",
    "modelsPath": "api-gateway/models"
  },
  "lambda": {
    "lambdasPath": "lambda/lambdas",
    "modulesPath": "lambda/modules"
  }
}
```

> Configuration values defined via an environment variable are always of type `String`  

### Defining the configuration programmatically

All json configuration files in Lager are loaded using the Node.js `require()` function. This means that they all can be
replaced by a javascript file that exposes the desired configuration.

For example, the previous `lager.json` file can be replaced by this `lager.js` file:

```javascript
module.exports = {
  name: 'planet-express',
  plugins: [
    '@lager/iam',
    '@lager/api-gateway',
    '@lager/lambda'
  ],
  config: {
    myConfigKey: process.env.MY_ENVIRONMENT_VARIABLE || 'my-default-value'
  }
}
```
