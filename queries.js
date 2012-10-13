var mysql = require("mysql"),
    mysqlConf = require("./mysqlConf"),
    http = require('http'),
    url = require('url'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser(),
    fs = require('fs');

var path = "/service/publicXMLFeed?command=vehicleLocations&a=actransit&r=<routeId>&t=0";
var thinningFactor = 3;

// from https://github.com/coopernurse/node-pool/blob/master/README.md
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
  name     : 'mysql',
  create   : function(callback) {
    var c = mysql.createConnection({
      "hostname": "localhost",
      "user": mysqlConf.user,
      "database": "gtfs"
    });
    c.connect();

    callback(null, c);
  },
    destroy  : function(connection) { connection.end(); },
    max      : 10,
    idleTimeoutMillis : 30 * 1000,
    log : false
});

// radius from current location to check stops for
var tolerance = 0.012;

function getStopsQuery(lat, lon, radius) {
  var lat = parseFloat(lat),
      lon = parseFloat(lon);

  var radius = typeof radius == "undefined" ? tolerance : radius;

  var minLat = lat-radius,
      maxLat = lat+radius,
      minLon = lon-radius,
      maxLon = lon+radius;

  var stopsQuery   = "SELECT stop_lat as lat, stop_lon as lon, stop_code, stop_id from stops ";
  stopsQuery      += "WHERE stop_lat BETWEEN " + minLat + " AND " + maxLat;
  stopsQuery      += " AND ";
  stopsQuery      += "stop_lon BETWEEN " + minLon + " AND " + maxLon;

  console.log(stopsQuery);
  return stopsQuery;
}

/* Radius in latitude/longitude steps */
function getStops(lat, lon, radius, callback) {
  var query = getStopsQuery(lat, lon, radius);

  pool.acquire(function(err, client) {
    if (err) {
      // handle error - this is generally the err from your
      // factory.create function  
    }
    else {
      client.query(query, function(err, rows, fields) {
        if (err) {
          console.log("MySQL error in getStops()");
          throw err;
        }
        callback(rows);
        // return object back to pool
        pool.release(client);
      });
    }
  });
}

function getRoutePaths(lat, lon, radius, callback) {
  var stopsQuery = getStopsQuery(lat, lon, radius)

  var routesQuery = "SELECT route_id, trip_headsign, lat, lon, stop_code from (" + stopsQuery + ")a ";
  routesQuery += " JOIN stop_times using (stop_id) ";
  routesQuery += " JOIN trips using (trip_id) ";

  var pathsQuery = "SELECT route_id, trip_headsign, shape_pt_lat as lat, shape_pt_lon as lon from ("+routesQuery+")a ";
  pathsQuery += " join trip_shapes t using (route_id, trip_headsign)";
  pathsQuery += " where shape_pt_sequence%"+thinningFactor+"=0 ";
  pathsQuery += " order by shape_pt_sequence ";

  console.log("\n" + pathsQuery + "\n");

  pool.acquire(function(err, client) {
    if (err) {
        // handle error
    }
    else {
      client.query(pathsQuery, function(err, rows, fields) {
        if (err) {
          console.log("MySQL error in getRoutePaths()");
          throw err;
        }
        callback(rows);
        // return object to pool
        pool.release(client);
      });
    }
  });
  
}

function getPredictionsFromStops(lat, lon, radius, callback) {
  var stopsQuery = getStopsQuery(lat, lon, radius)

  pool.acquire(function(err, client) {
    if (err) {
        // handle error
    }
    else {
      client.query(stopsQuery, function(err, rows, fields) {
        if (err) {
          console.log("MySQL error in getPredictionsFromStops()");
          throw err;
        }
        var stopCodes = [];
        for (var row in rows) {
          stopCodes.push(rows[row].stop_code);
        }
        getRoutes(stopCodes);
        // return object to pool
        pool.release(client);
      });
    }
  });
}

function getRoutes(stops) {
  stops.forEach(function(stop) {
    console.log("STOP: "+stop);
    // stop = e.g. 50400
    // vehicle
    var options = {
      host: 'webservices.nextbus.com',
      path: '/service/publicXMLFeed?command=predictions&a=actransit&stopId='+stop
    }
    http.get(options,function(res){
      var myData = "";
      res.on('data',function(chunk){

        parser.parseString(chunk,function(err,result){
          try{
            for(var i in result['body']['predictions']){
              vehiclePrediction(result['body']['predictions'][i]['$']['routeTag']);
            }
          }
          catch(e){
            console.log("NextBus getRoutes error");
          }
        });
      });
    });
  });
}

function vehiclePrediction(routeId) {
  console.log(routeId);
  var options = {
    host: 'webservices.nextbus.com',
    //path: path.replace('<routeId>',routeId)
    path:"/service/publicXMLFeed?command=vehicleLocations&a=actransit&r="+routeId+"&t=0"
  }
  http.get(options, function(res){
    res.setEncoding('utf8');
    var myData = "";
    res.on('data',function(chunk){
      parser.parseString(chunk,function(err,result){
        result = result['body']['vehicle'];
        try{
          for(var i in result){
            var bus = result[i]['$'];
            console.log(bus['id']);
            var output = "";
            var busId = bus['id'];
            output+="Bus ID: "+busId+", ";
            var routeTag = bus['routeTag'];
            output+="Route Tag: "+routeTag+", ";
            var dirTag = bus['out'];
            var lat = bus['lat'];
            output+="Location: ("+lat+",";
            var lon = bus['lon'];
            output+=lon+"), ";
            var secsPassed = bus['secsSinceReport'];
            output+="Time Passed: "+secsPassed+", ";
            var predictable = bus['predictable'];
            output+= "Predictable: "+predictable;
            console.log(output);
          }
        }
        catch(e){
          console.log("Error in getting bus data");
          console.log("NextBus vehiclePrediction data error");
        }
      });
    }).on("error",function(e){
      console.log("Error: "+e.message);
    });
  });
}

exports.getRoutePaths = getRoutePaths;
exports.getStops = getStops;
exports.getRoutes = getRoutes;
exports.vehiclePrediction = vehiclePrediction;
exports.getPredictionsFromStops = getPredictionsFromStops;
