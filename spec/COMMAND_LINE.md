The user should be prompted for every argument that is not provided.
Meanwhile, the user should be able to script the utilization of the command line.

```
lager [--interactive] <command>
```

```
lager new [<project-name>]
```
Create a new project in the `project-name` folder. If `project-name` is omitted, create in the current folder.

```
lager deploy
```
Deploy the application in AWS following the configuration of environment variables.

```
lager new lambda <identifier> [--name <name>] [--timeout <seconds>] [--memory <size>]
                              [--include-endpoints <true|false>] [--include-lib <lib-identifier>]
```

```
lager new endpoint <method> <path> [--lambda <name>] [--lambda-invocation-role <seconds>] [--api <identifier>]
```
