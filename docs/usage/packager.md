# Packager plugin

## Why ?

When installing Node.js and python dependencies to create a package for Lambda, some modules may not be compatible with
the execution environment of Amazon Lambda, because of differences of version of Node.js, python or GCC when modules
have C++ bindings. The `@myrmex/packager` plugin helps to prevent this problem.

## How it works

A common solution to this problem is to create the packages on a EC2 instance using an Amazon Linux AMI. To avoid
having to use a server to deploy serverless application, `@myrmex/packager` uses the Docker image
[`myrmex/lambda-packager`](https://github.com/myrmex-org/docker-lambda-packager) based on the
[Amazon Linux image](https://hub.docker.com/_/amazonlinux/). The image `myrmex/lambda-packager` comes with all Node.js
and python runtimes supported by Amazon Lambda and GCC.

When the plugin `@myrmex/lambda` deploys a Lambda, `@myrmex/packager` takes in charge the creation of the package by
executing `docker run myrmex/lambda-packager` with appropriates parameters.

## Prerequisites

To use the `@myrmex/packager` plugin, it is necessary to have [Docker](https://www.docker.com/) installed on the
environment that perform the deployment of Lambdas.

## Installation

Install the npm module in a Myrmex project:

```shell
npm install @myrmex/packager
```

Then enable the plugin in the `myrmex.json` file:

```json
{
  "name": "my-app",
  "plugins": [
    "@myrmex/lambda"
    "@myrmex/packager"
  ]
}
```

Once the plugin is installed and enabled in the project, the `@myrmex/lambda` plugin will use it to create packages
when deploying Node.js and python Lambdas.

## Configuration

These are [Myrmex configuration keys](/manual/installation/getting-started.html#project-configuration) specific to to
the `@myrmex/packager` plugin.

### Default values

Using `myrmex show-config` after installing the plugin, we can see the default configuration:

```json
{
  "packager": {
    "bucket": null,
    "docker": {
      "useSudo": false,
      "showStdout": false
    }
  }
}
```

### `packager.bucket`

Name of the S3 bucket where the packages will be uploaded. If it does not exists, `@myrmex/packager` will try to create
it. If this configuration key is not provided, `@myrmex/packager` will directly upload the packages to Lambda without
using S3.

### `packager.docker.useSudo`

If set to `true`, `@myrmex/packager` will use `sudo` to execute `docker run`. Alternatively, it is possible to
[manage Docker as a non-root user ](https://docs.docker.com/engine/installation/linux/linux-postinstall/) using a group.

### `packager.docker.showStdout`

It set to `true`, the output of `docker run` will be diplayed in the terminal.
