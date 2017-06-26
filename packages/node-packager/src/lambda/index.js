'use strict';

var fs = require('fs');
var exec = require('child_process').exec;

var AWS = require('aws-sdk');
var unzip = require('unzip');
var archiver = require('archiver');

var s3 = new AWS.S3();
var packagePath = '/tmp/package';


module.exports.handler = function(event, context, cb) {
  // Extract file from S3 to /tmp
  var stream = s3.getObject(event).createReadStream().pipe(unzip.Extract({ path: packagePath }));
  stream.on('close', function() {
    // Exec npm install
    install(function() {
      // Zip installed package
      archive(function() {
        // Upload to S3
        upload(function() {
          cb();
        });
      });
    });
  });
};


function install(cb) {
  return exec('npm install --loglevel=error', { cwd: packagePath }, cb);
}


function archive(cb) {
  const archivePath = '/tmp/package.zip';
  const outputStream = fs.createWriteStream(archivePath);
  const archive = archiver.create('zip', {});
  outputStream.on('close', cb);

  archive.on('error', function(e) {
    cb(e);
  });

  archive.pipe(outputStream);

  // Add the Lamba code to the archive
  archive.directory(packagePath, '');

  archive.finalize();
}


function upload(stream, cb) {
  var params = {
    Body: stream,
    Bucket: 'examplebucket',
    Key: 'exampleobject'
  };
  s3.putObject(params, cb);
}
