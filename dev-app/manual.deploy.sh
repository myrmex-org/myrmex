#!/bin/bash

function fail {
echo -e "
\033[90m
  \033[91m$1\033[90m
  \033[95m$2\033[90m
\033[0m"
}

function success {
echo -e "
\033[92m
  THE APPLICATION HAS BEEN SUCCESSFULLY DEPLOYED! CHEERS
\033[90m
"
}

########################################
# Deploy Lambdas
########################################
docker-compose run node lager deploy

if [ $? -ne 0 ]; then
  # If the Lambda deployment returned an error, we stop here
  echo -e "
    \033[91m!!! The Lambda deployment has not been correctly executed !!!\033[0m
  "
  fail "FAILED TO DEPLOY LAMBDA!" "The Swagger Importer will not be executed..."
  exit 1
fi


########################################
# Deploy API Gateway
########################################
docker-compose run api-importer

if [ $? -ne 0 ]; then
  # If the API Gateway deployment returned an error, we stop here
  echo -e "
    \033[91m!!! The API Gateway deployment has not been correctly executed !!!\033[0m
  "
  fail "FAILED TO IMPORT THE SWAGGER DEFINITION"
  exit 1
else
  echo -e "
    \033[92m!!! The deployment is finished !!!\033[0m
  "
  success
fi
