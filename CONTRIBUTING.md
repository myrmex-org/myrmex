Contribute
===

If you are reading this, welcome aboard! :beers:

You can contribute to Myrmex by proposing pull requests on the repository or by creating your own plugins to extend Myrmex's
functionalities.

If you want to create a Myrmex plugin
---

*   Tell us about your idea by creating a github issue
*   We would be very pleased to give you support to archive your goal
*   Use a namespace for new commands: `myrmex my-plugin:command [options] arguments`
*   Use a namespace for new hooks: `my-plugin:i-can-fire-a-new-myrmex-hook`

If you want to contribute to Myrmex or one of its core plugins
---

*   Comment on the issue you want to work on or create one if it does not exist
*   Update the specs and docs along with the code
*   Write / rewrite ES6 code compatible with node v4
*   Follow the rules of the `.eslintrc` and `.remarkrc` files (You can test using the command `npm run lint`)
*   Respect case conventions: `ConstructorFunctionName`, `instanceName`, `functionName`, `node-module-file-name.js`
*   Code coverage objective: 80% minimum

Setup your development environment
---

The Myrmex core packages belong to a monorepo managed with [Lerna](https://github.com/lerna/lerna). The monorepo comes with a
development project that runs in a docker container. This allows to make new developments with the latest version of all core
packages.

### Prerequisites

*   Install `docker` and `docker-compose`
*   Clone the repo `git clone git@github.com:myrmex-org/myrmex.git && cd myrmex`
*   Install the Lerna command line globally:  `npm install -g lerna`
*   Install dependencies in all packages `lerna run npm install`
*   Go to the folder of the development environment/project `cd demo/dev-env`
*   `docker-compose run dev`

### Launching the development environment

The command `docker-compose run dev` runs zsh in a docker container.

```bash
# In the directory `/demo/dev-env`
docker-compose run dev
```

You will be logged with the user `myrmex`, in the root directory of a sample project. This sample project is empty, but it is
configured to use the core packages of Myrmex. Test that the project is correctly configured with the following command.

```bash
# Inside the node container
myrmex -h
```

The code of the repository is available in the container via docker volumes, so any change will be automatically visible in
the container.

### Configuring AWS credentials

The `docker-compose.yml` file uses a volume to mount the `~/.aws` directory inside the container. 

If set on the host, the environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_DEFAULT_REGION` will be
available in the container.

### Configuring user permissions

As explained before, the code of the repository is available in the container via docker volumes. By default, the user
`myrmex` in the container has the `UID` 1000 and the `GID` 1000. It is possible to change it to match the host user `UID` and
`GID` exposing them as environment variables. So the permissions in the container will match the permissions on the host.

```bash
# In the directory `/demo/dev-env`
# UID and GID are not environment variables but shell variables and therefore are not available in docker-compose
# The following command will set them as environment variables
export UID GID
docker-compose run dev
```

### Before creating a pull request

From the root folder of the git repository, run the unit tests and check the code style.

```bash
npm test
npm run lint
```
