#!/bin/bash
docker run \
       -u root \
       --env HOST_UID=`id -u` \
       --env HOST_GID=`id -g` \
       --env-file ./env.list \
       -v `pwd`:/home/lager/app \
       -v `pwd`/../../packages/cli:/home/lager/.node/lib/node_modules/@lager/cli \
       -it \
       lager/dev
