Roadmap
===

General
---

*   Find a super cool name and create Github organization (Alexis) **S**
*   ~~Allow plugins to create new lager commands~~ (Alexis) **L**
*   Manage IAM credentials from various sources: config file, environment variables, parameters **S**
*   Update the dev application to create the "Planet Express" apis **L**
*   Complete `lager` command line (see spec/COMMAND_LINE.md) **S**
*   Document IAM permission needed *for each plugin* **M**
*   Add a logging system **M**
*   Write unit tests
*   Setup continuous integration
*   Create a local webserver (Koa or Hapi?) **XL**
*   Put core plugins in their own node modules **M**
*   Bonus: put the promise based event/observer in its own node module

`api-gateway` core plugin
---

*   ~~Export the "doc" specification with double quotes~~ (Alexis) **S**
*   ~~Put the code about Api and Endpoint definitions in it's own plugin~~ (Alexis) **M**
*   Complete `api-gateway` command line (see spec/COMMAND_LINE.md) **M**
*   Add syntax highlighting to inspection commands **S**
*   Beautify deploy output (ASCII array describing configuration?) **M**

`node-lambda` core plugin
---

*   Complete `node-lambda` command line (see spec/COMMAND_LINE.md) (Alexis) **M**
*   Allow CORS configuration **L**
*   Beautify deploy output **M**

`iam` core plugin
---

*   Create a plugin to create/update/manage IAM roles/policies **L**
*   Implement `iam` command line (see spec/COMMAND_LINE.md) **M**

Other plugins
---

*   Create a Lager plugin to inject documentation in the API (Heucles) **S**
*   Create a Sequelize REST blueprint plugin to automatically create REST API when declaring Sequelize models **XL**
