'use strict';

var taskslib = require('vsts-task-lib/task');
var iothub = require('azure-iothub');
var fs = require('fs');
var path = require('path');
var utf8 = require('utf8');
var crypto = require('crypto');
var https = require('https');


var _deviceQueryString = "SELECT * FROM Devices "; // taskslib.getInput('DeviceQueryString');
var _deviceResultNumber = 1000; //taskslib.getInput('DeviceResultNumber');
var _filePath = "./buildtask/edgedeviceconfigsample.json"; // taskslib.getInput('ConfigFilePath');
var _posthost = "";
var _postpathhead = "/devices/";
var _postpathtail = "/applyConfigurationContent?api-version=2017-11-08-preview";
var _saKey = "";
var _saUser = "iothubowner"
var _connectionString = "HostName=" + _posthost + ";SharedAccessKeyName=" + _saUser + ";SharedAccessKey=" + _saKey;  // taskslib.getInput('IotHubConnectionString');


var _registry = iothub.Registry.fromConnectionString(_connectionString);


var postConfigUpdateForDevice = function (deviceId, configContentJson, host, pathhead, pathtail, sas) {
    // prepare the header
    var postheaders = {
        'Content-Type': 'application/json',
        'Authorization': sas
    };

    // the post options
    var optionspost = {
        host: host,
        port: 443,
        path: pathhead + deviceId + pathtail,
        method: 'POST',
        headers: postheaders
    };

    // do the POST call
    var reqPost = https.request(optionspost, function (res) {
        console.log("statusCode: ", res.statusCode);

        res.on('data', function (d) {
            console.info('POST result:\n');
            process.stdout.write(d);
            console.info('\n\nPOST completed');
        });
    });

    // write the json data
    reqPost.write(configContentJson);
    reqPost.end();
    reqPost.on('error', function (e) {
        console.error(e);
    }); 

}


function createSharedAccessToken(uri, saName, saKey) {
    if (!uri || !saName || !saKey) {
        throw "Missing required parameter";
    }
    var encoded = encodeURIComponent(uri);
    var now = new Date();
    var week = 60 * 60 * 24 * 7;
    var ttl = Math.round(now.getTime() / 1000) + week;
    var signature = encoded + '\n' + ttl;
    var signatureUTF8 = utf8.encode(signature);

    // ADD THIS Base64 decoding here!!!
    var decodekey = Buffer.from(saKey, "base64");
    var hash = crypto.createHmac('sha256', decodekey).update(signatureUTF8).digest('base64');
    var token = 'SharedAccessSignature sr=' + encoded + '&sig=' +
        encodeURIComponent(hash) + '&se=' + ttl + '&skn=' + saName;

    return token;
}

var updateModuleConfig = function (queryString, resultNr, filePath, registry) {
  
    var query = registry.createQuery(queryString, resultNr);

    var configdata = "{no config data}"

    // read config file
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
        if (!err) {
            console.log('config data' + data);
            configdata = data;

            // run query, iterate over results
            query.nextAsTwin(function (err, results) {
                if (err) {
                    console.error('Failed to fetch the results: ' + err.message);
                } else {

                    console.log("Found " + results.length + " for query : \'" + queryString + "\'.");
                    if (results.length > 0) {
                        // update all found twins
                        results.map(function (twin) {
                            var sas = createSharedAccessToken(_posthost, _saUser, _saKey);
                            // sas += "DeviceId="+ twin.deviceId+";";

                            console.log("SAS Token" + sas);
                            postConfigUpdateForDevice(twin.deviceId, configdata, _posthost, _postpathhead, _postpathtail, sas);
                            console.log("Updated device twin for device with id " + twin.deviceId + " .");
                        }
                        )
                    }
                }
            });
        } else {
            console.log(err);
        }
    });



};

updateModuleConfig(_deviceQueryString, _deviceResultNumber, _filePath, _registry);



