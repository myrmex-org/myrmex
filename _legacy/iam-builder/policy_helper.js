var Promise = require('bluebird');
var _ = require('lodash');


module.exports = function(iam) {
  return {
    // We cannot find a policy by name with the AWS SDK (only by ARN)
    // Since we do not know the account id of the environment, we have to list
    // all local policies and search for the policy name
    getPolicyByName: function getPolicyByName(name, listParams, marker) {
      var params = _.assign({
        Marker: marker,
        MaxItems: 100,
        PathPrefix: '/',
        OnlyAttached: false,
        Scope: 'All'
      }, listParams);
      return Promise.promisify(iam.listPolicies.bind(iam))(params)
      .then(function(policyList) {
        var policyFound = _.find(policyList.Policies, function(policy) { return policy.PolicyName === name; });
        if (policyFound) {
          return Promise.resolve(policyFound);
        } else if (policyList.IsTruncated) {
          return getPolicyByName(name, listParams, policyList.Marker);
        } else {
          return Promise.resolve(null);
        }
      });
    }
  };

};
