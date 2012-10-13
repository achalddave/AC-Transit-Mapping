var mysql = require("mysql");
var http = require('http'),
    url = require('url'),
    xml2js = require('xml2js');
var parser = new xml2js.Parser();
var path = "/service/publicXMLFeed?command=vehicleLocations&a=actransit&r=<routeId>&t=0";
