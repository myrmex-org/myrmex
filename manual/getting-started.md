# Getting started

## Configuring AWS

### Prerequisites

To work with Lager and its main plugins, you should to have some notions about:

*   AWS IAM
*   AWS Lambda
*   Amazon API Gateway
*   OpenAPI (aka Swagger) specification
*   Node.js

Do not worry, Lager helps you to experiment quickly. But if you really want to be efficient, you will have to know the AWS services that works with Lager.

### Permissions needed to deploy the project in AWS

Lager plugins that manage AWS resources need to have permissions to execute commands that communicate with the AWS API. When a
command needs these permissions, Lager will use the AWS credentials provided by the environment.

To begin to use Lager, you can use AWS credentials with the following policies:

*  `IAMFullAccess`
*  `AWSLambdaFullAccess`
*  `AmazonAPIGatewayAdministrator`

You can always use a more restrictive set of permissions that better fit your use of Lager.

## Creating a new project


## Project configuration

### The `lager.json` file

In the root directory of a Lager project, there is a `lager.json` file that contains the base configuration of the project.

A `lager.json` file looks like this:

```json
{
  "name": "planet-express",
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

### The deployment `context`

When managing content in AWS, Lager main plugins take in consideration the notion of `context`. The `context` contains two
properties:

*   An environment name that allows to deploy several environment on one AWS account. For example `DEV`, `QA`, `DEVELOPER_JANE`, `DEVELOPER_JOHN`, etc ...
*   A stage name that allows to deploy several versions of the project in one environment. For example `v1`, `v2`, `latest`, etc ...

The use of the `context` will be explained for each main plugin.
