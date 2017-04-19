lerna publish --skip-git --skip-npm
lerna clean
lerna exec rm npm-shrinkwrap.json
lerna exec ncu -- -u
lerna exec npm install
lerna exec npm shrinkwrap
npm test
