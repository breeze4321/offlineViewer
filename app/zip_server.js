var http = require('http');
var StreamZip = require('node-stream-zip');
var detect = require('detect-port');

var zips = {};



var server = http.createServer(function(request, response) {
	var responseStreamOpen=true;
	response.on('finish', () => {
	  responseStreamOpen=false;
	});

    try {

        var decodedURL = decodeURI(request.url);

        if (decodedURL.includes('.pano')) {
            var separator = '.pano';
            var slash = '/';
        } else {
            var separator = '.zip';
            var slash = '\\';
        }

        var splitPath = decodedURL.split(separator);
        var currentPath = splitPath[0].substr('1') + separator;
        var splitSubPath = splitPath[1].split('/');
        if (splitSubPath.length < 3) {
            var entryPath = splitSubPath.join('');
        } else {
            var entryPath = splitSubPath.join(slash).substr(1);
        }

        if (currentPath in zips) {
            zips[currentPath].stream(entryPath, function(err, stm) {
            	pipeResponse(stm);
            });
        } else {
            // new zip file
            zips[currentPath] = new StreamZip({
                file: currentPath,
                storeEntries: true
            });
        }

        zips[currentPath].on('error', function(err) {
        	serveError();
        });

        zips[currentPath].on('ready', function() {
            zips[currentPath].stream(entryPath, function(err, stm) {
            pipeResponse(stm);
            });
        });

    } catch (e) {

        serveError();
    }

    function pipeResponse(stm) {
        if (stm) {
        	if (responseStreamOpen) {
            	stm.pipe(response);
            }
        } else {
			serveError();
        }
    }

    function serveError(){
        if (responseStreamOpen) {
	    	response.writeHead(500, {
	            "Content-Type": "text/plain"
	        });
	        response.write("500 Error");
	        response.end();
    	}
    }
});



var port = 8000;

detect(port, (err, _port) => {
  global.sharedObj = {port: _port};
    server.listen(_port);
});
