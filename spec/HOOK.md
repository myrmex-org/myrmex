Events to implements
===

Events fired before any call to AWS
---

```javascript
lager.specBuilder.on('beforeInitAPISpec', () => {})           // this = ApiSpec instance
lager.specBuilder.on('afterInitAPISpec', () => {})            // this = ApiSpec instance
lager.specBuilder.on('beforeInitEndpointSpec', () => {})      // this = EndpointSpec instance
lager.specBuilder.on('afterInitEndpointSpec', () => {})       // this = EndpointSpec instance
lager.specBuilder.on('beforeAddEndpointsToAPISpec', (apiSpec) => {})
lager.specBuilder.on('beforeAddEndpointToAPISpec', (endpointSpec, apiSpec) => {})
lager.specBuilder.on('afterAddEndpointToAPISpec', (endpointSpec, apiSpec) => {})
lager.specBuilder.on('afterAddEndpointsToAPISpec', (apiSpec) => {})
```

Events fired during the deployment of policies
---

```javascript
lager.iamBuilder.on('beforeDeployAllPolicies', () => {})
lager.iamBuilder.on('beforeDeployPolicy', () => {})           // this = Policy instance
lager.iamBuilder.on('beforeCreatePolicy', () => {})           // this = Policy instance
lager.iamBuilder.on('afterCreatePolicy', () => {})            // this = Policy instance
lager.iamBuilder.on('beforeUpdatePolicy', () => {})           // this = Policy instance
lager.iamBuilder.on('afterUpdatePolicy', () => {})            // this = Policy instance
lager.iamBuilder.on('afterDeployPolicy', () => {})            // this = Policy instance
lager.iamBuilder.on('afterDeployAllPolicies(', () => {})
```

Events fired during the deployment of roles
---

```javascript
lager.iamBuilder.on('beforeDeployAllRoles', () => {})
lager.iamBuilder.on('beforeDeployRole', () => {})                     // this = Role instance
lager.iamBuilder.on('beforeAttachPoliciesToRole(', (policies) => {})  // this = Role instance
lager.iamBuilder.on('afterAttachPoliciesToRole', (policies) => {})    // this = Role instance
lager.iamBuilder.on('beforeCreateRole', () => {})                     // this = Role instance
lager.iamBuilder.on('afterCreateRole', () => {})                      // this = Role instance
lager.iamBuilder.on('beforeUpdateRole', () => {})                     // this = Role instance
lager.iamBuilder.on('afterUpdateRole', () => {})                      // this = Role instance
lager.iamBuilder.on('afterDeployRole', () => {})                      // this = Role instance
lager.iamBuilder.on('afterDeployAllRoles', () => {})
```

Events fired during the deployment of lambdas
---

```javascript
lager.lambdaBuilder.on('beforeDeployAllLambdas', () => {})
lager.lambdaBuilder.on('beforeDeployLambda', () => {})          // this = Lambda instance
lager.lambdaBuilder.on('beforeCreateLambda', () => {})          // this = Lambda instance
lager.lambdaBuilder.on('beforeUpdateLambda', () => {})          // this = Lambda instance
lager.lambdaBuilder.on('beforeBuildLambdaPackage', () => {})    // this = Lambda instance
lager.lambdaBuilder.on('afterBuildLambdaPackage', () => {})     // this = Lambda instance
lager.lambdaBuilder.on('beforePublishLambdaVersion', () => {})  // this = Lambda instance
lager.lambdaBuilder.on('afterPublishLambdaVersion', () => {})   // this = Lambda instance
lager.lambdaBuilder.on('afterDeployLambda', () => {})           // this = Lambda instance
lager.lambdaBuilder.on('afterDeployAllLambdas', () => {})
```

Events fired when applying integration data to the specs
---

```javascript
lager.specBuilder.on('beforeAddIntegrationDataToEndpoint', (integrationData) => {})  // this = EndpointSpec instance
lager.specBuilder.on('afterAddIntegrationDataToEndpoint', (integrationData) => {})   // this = EndpointSpec instance
```

Events fired during the deployment of APIs
---

```javascript
lager.specBuilder.on('beforeDeployAllApis', () => {})
lager.specBuilder.on('beforeDeployApi', () => {})     // this = ApiSpec instance
lager.specBuilder.on('afterDeployApi', () => {})      // this = ApiSpec instance
lager.specBuilder.on('afterDeployAllApis', () => {})
```
