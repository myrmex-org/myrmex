'use strict';

let catched = '';
let old_write;

module.exports.start = (disableOld) => {
  old_write = process.stdout.write;
  process.stdout.write = function(string, encoding, fd) {
    if (!disableOld) {
      old_write.apply(process.stdout, arguments);
    }
    catched += string;
  };
};

module.exports.stop = () => {
  process.stdout.write = old_write;
  return catched;
};
