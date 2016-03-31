#!/usr/bin/python

# Looks for files in /usr/src/, using this file name template:
# swagger.deploy.${API_GATEWAY_ID}.${API_GATEWAY_STAGE}.json

import os
from subprocess import call

source = '/usr/src/'
for f in os.listdir(source):
    if os.path.isfile(os.path.join(source, f)):
        parts = f.split('.')
        if len(parts) == 5 and parts[3] == 'deploy' and parts[4] == 'json':
            print('    Deploy API {} - stage {} - file {}'.format(parts[1], parts[2], f))
            call([
                '/root/aws-apigateway-importer/aws-api-import.sh',
                '-r', os.environ['AWS_DEFAULT_REGION'],
                '-u', parts[1],
                '-d', parts[2],
                os.path.join(source, f)
            ])
# cd /root/aws-apigateway-importer/
# for FILE_PATH in /usr/src/swagger.deploy.*.*.json; do
#     FILE_NAME=$(basename "$FILE_PATH")
#     WITHOUT_EXT="${FILE_NAME%.*}"
#     API_GATEWAY_STAGE="${WITHOUT_EXT##*.}"
#     WITHOUT_API_GATEWAY_STAGE="${WITHOUT_EXT%.*}"
#     API_GATEWAY_ID="${WITHOUT_API_GATEWAY_STAGE##*.}"
#
#     echo -e "\n    Deploy API Gateway ${API_GATEWAY_ID} - stage ${API_GATEWAY_STAGE} - file ${FILE_NAME}\n"
#
#     # Run the importer
#     /root/aws-apigateway-importer/aws-api-import.sh \
#       --region $AWS_DEFAULT_REGION \
#       -u $API_GATEWAY_ID \
#       -d $API_GATEWAY_STAGE \
#       $FILE_PATH
#
#     deploy_exit_code=$?
#     if [ "$deploy_exit_code" -ne 0 ]; then
#         echo "The deployment of ${API_GATEWAY_ID} failed"
#         break
#     fi
#
#     echo -e "\n    API Gateway ${API_GATEWAY_ID} - stage ${$API_GATEWAY_STAGE} - has been deployed\n"
# done
#
# exit $deploy_exit_code
