#!/bin/bash

if [ -z "$TEST_SUITE" ]; then
    echo "No \$TEST_SUITE provided"
    exit 1;
elif [ "$TEST_SUITE" == "integration" ]; then
    # Integration tests depend on all npm packages
    npm install
    lerna exec npm install --production
elif [ ! -d "packages/$TEST_SUITE" ]; then
    echo "The directory \"packages/$TEST_SUITE\" does not exists"
    exit 1;
else
    # All tests depend on the @lager/lager package
    npm --prefix ./packages/lager install ./packages/lager --production
    # Install dependencies of the tested package itself
    cd packages/$TEST_SUITE
    npm install
fi
