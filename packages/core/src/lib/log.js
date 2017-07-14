'use strict';

const path = require('path');
const util = require('util');
const _ = require('lodash');
const bunyan = require('bunyan');
const eol = require('os').EOL;

const levels = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL'
}
const excludedKeys = ['name', 'hostname', 'pid', 'level', 'msg', 'time', 'v'];
function cleanObject(o) {
  let hasData = false;
  const r = {};
  Object.keys(o).forEach(k => {
    if (excludedKeys.indexOf(k) === -1) {
      r[k] = o[k];
      hasData = true;
    }
  });
  return hasData ? r : undefined;
}

const stderrStream = {
  level: 'warn',
  type: 'raw',
  stream: {
    write: (obj) => {
      process.stderr.write(eol + '[' + obj.time.toISOString() + '] ' + levels[obj.level] + ': ' + obj.msg + eol);
      if (obj.err && obj.err.stack) {
        process.stderr.write(obj.err.stack + eol);
        process.stderr.write(eol + 'More information in myrmex.log' + eol);
      } else {
        const cleanedObj = cleanObject(obj);
        if (cleanedObj) {
          process.stderr.write(util.inspect(cleanedObj) + eol);
        }
      }
    }
  }
};

const fileStream = {
  level: 'debug',
  path: path.join(process.cwd(), 'myrmex.log')
};

const log = bunyan.createLogger({
  name: 'myrmex',
  streams: [stderrStream, fileStream],
  src: false
});

module.exports = log;
