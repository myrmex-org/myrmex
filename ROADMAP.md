* Update to node 4.3
* Use AWS SDK to deploy the swagger file and not AWS API importer anymore
* Create a command `lager endpoint-spec <METHOD PATH>` to show an endpoint specification for debugging purpose
* Implements the components as Event Emitter to allow hooks
* Create a sequelize blueprint hook to automatically create REST API when declaring sequelize models
* When deploying, show the configuration api/endpoints using an array
* Create a local webserver (Koa or Hapi?)
