
var spawn = require('child_process').spawn;
var events = require('events');

function NodeDownloader() {
  
  var dirToSave = '/Users/downloads/';
  var dl;
  var lastProgress;
  
  var eventEmitter = new events.EventEmitter();
  
  // add the Trim function to javascript
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  } 
  
  this.setDirToSave = function(dir) {
    dirToSave = dir;
  };
  
  this.getDirToSave = function() {
    return dirToSave;
  }
  
  this.downloadFile = function(url,filename) {
    console.log('Beginning Download from: ' + url + ' Saving to: ' + dirToSave);
    if (typeof filename == 'undefined') {
      var filename = url.substring(url.lastIndexOf('/') + 1);
    }
    // Clean filename
    filename = filename.replace(/[^0-9a-zA-Z\.]+/gi, '');

    var savePath = dirToSave + filename;

    dl = spawn('wget', ['–directory-prefix=' + dirToSave ,'–output-document=' + filename, url]);
    
    dl.on('exit', function (code) {
      console.log('child process exited with code ' + code);
    });
    
    dl.stderr.on('data', function (data) {
      
      data = data.toString('ascii');
      
      // extract the progress percentage
      var regExp = new RegExp('\\d{0,}%','i');  
      if(regExp.test(data)) {
        var progress = data.match(regExp);
        
        // call only when percentage changed
        if(lastProgress != progress[0]) {
          //console.log('progress: ' + progress[0]);
          
          lastProgress = progress[0];
          
          // extract the download speed
          var position = data.search(regExp);
          var speed = data.substr(position + progress[0].length).trim();
          speed = speed.substr(0, speed.indexOf('/s') + 2).trim();
          
          // call the event
          eventEmitter.emit('progress', progress, speed);
        }
      }
      
    });
    dl.stdin.end();
  }
  
  this.stopDownload = function() {
    console.log('download stopped');
    dl.kill();
  }
  
  // Expose the public API
  return {
    hello: this.hello,
    setDirToSave: this.setDirToSave,
    getDirToSave: this.getDirToSave,
    downloadFile: this.downloadFile,
    stopDownload: this.stopDownload,
    eventEmitter: eventEmitter
  };
  
}

exports.NodeDownloader = NodeDownloader;

function CurlDownloader() {

  var dirToSave = './';
  var dl;
  var dlOptions;
  var lastProgress = 0;
  var authVal
  var authType

  var eventEmitter = new events.EventEmitter();

  this.setAuthType = function(type) {
    authType = type
  }

  this.setPrivateToken = function(token) {
    authVal = '-H' + authType + ':' + token
  }

  this.setDirToSave = function(dir) {
    dirToSave = dir;
  }

  this.getDirToSave = function() {
    return dirToSave;
  }

  this.downloadFile = function(url, file) {
    console.log('Beginning Download from: ' + url + ' Saving to: ' + dirToSave);

    if (typeof file == 'undefined') {
      var file = url.substring(url.lastIndexOf('/') + 1);
    }

    // Clean filename
    file = file.replace(/[^0-9a-zA-Z\.]+/gi, '');

    var path = dirToSave + file;

    dlOptions = [
      authVal, url, '--create-dirs', '-o' + path,
      '-#',
      '--insecure'
    ];

    dl = spawn('curl', dlOptions);

    dl.on('exit', function(code) {
      // Important for multiple downloads to know when they are finished.
      eventEmitter.emit('end', code);
    });

    dl.stderr.on('data', function(data) {

      data = data.toString('ascii');

      // Extract the progress percentage
      if (/\d+(\.\d{1,2})/.test(data)) {
        var progress = parseInt(RegExp.lastMatch);

        // Do only when percentage changed
        if (lastProgress != progress && progress >= lastProgress) {
          lastProgress = progress;

          eventEmitter.emit('progress', progress + '%');
        }
      }

    });

    dl.stdin.end();
  }

  this.stopDownload = function() {
    console.log('Download stopped');
    dl.kill();
  }

  // Expose the public API
  return {
    setPrivateToken: this.setPrivateToken,
    setAuthType: this.setAuthType,
    setDirToSave: this.setDirToSave,
    getDirToSave: this.getDirToSave,
    downloadFile: this.downloadFile,
    stopDownload: this.stopDownload,
    eventEmitter: eventEmitter
  };
}

exports.CurlDownloader = CurlDownloader;