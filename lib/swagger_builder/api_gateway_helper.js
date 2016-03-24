var Promise = require('bluebird');
var _ = require('lodash');


module.exports = function(apiGateway) {
  return {
    // We cannot find an API by name with the AWS SDK (only by ID)
    // Since we do not know the API ID but only the name, we have to list
    // all local policies and search for the API name
    // Note that an API name is not necessarily unique, but we consider it should
    getApiByName: function getApiByName(name, listParams, position) {
      var params = _.assign({
        position: position,
        limit: 100
      }, listParams);
      return Promise.promisify(apiGateway.getRestApis.bind(apiGateway))(params)
      .then(function(apiList) {
        var apiFound = _.find(apiList.items, function(api) { return api.name === name; });
        if (apiFound) {
          return Promise.resolve(apiFound);
        } else if (apiList.items.length === params.limit) {
          return getApiByName(name, listParams, params.position + limit - 1);
        } else {
          return Promise.resolve(null);
        }
      });
    }
  };

};
