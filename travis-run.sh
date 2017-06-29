#!/bin/bash

if [ -z "$TEST_SUITE" ]; then
    echo "No \$TEST_SUITE provided"
    exit 1;
elif [ "$TEST_SUITE" == "integration" ]; then
    npm run test-integ-ci
elif [ ! -d "packages/$TEST_SUITE" ]; then
    echo "The directory \"packages/$TEST_SUITE\" does not exists"
    exit 1;
else
    cd packages/$TEST_SUITE
    npm run test-ci
fi
