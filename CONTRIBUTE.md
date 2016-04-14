Contribute
===

Rules
---

*   Follow the ROADMAP.md file for priorities and task t-shirt sizing
*   Update the specs and docs along with the code
*   Write / rewrite ES6 code
*   Follow the rules of the .jshint.rc and mdastrc files
*   Respect case: ConstructorFunctionName, instanceName, functionName, node-module-name
*   Code coverage objective: 80%

Setup dev environment
---

Install docker and docker-compose

### Working container

```bash
docker-compose run node zsh
```

You will enter in container as the user `dev` in the root directory of a sample project.
Lager will be installed globally.

### Unit tests container

There is a specific container to run tests, so we can define a different execution environment
and be sure to isolate the execution of tests.

```bash
docker-compose run test
```
