var mysql = require("mysql"),
    mysqlConf = require("./mysqlConf"),
    http = require('http'),
    url = require('url'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser();

var path = "/service/publicXMLFeed?command=vehicleLocations&a=actransit&r=<routeId>&t=0";

function getStopsQuery(lat, lon, radius) {
  var lat = parseFloat(lat),
      lon = parseFloat(lon);

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
  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": mysqlConf.user,
    "database": "gtfs"
  });

  connection.connect();

  var radius = typeof radius == "undefined" ? 0.02 : radius;

  var query = getStopsQuery(lat, lon, radius);
  connection.query(query, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    callback(rows);
  });
}

function getRoutePaths(lat, lon, radius, callback) {
  var radius = typeof radius == "undefined" ? 0.02 : radius;
  var stopsQuery = getStopsQuery(lat, lon, radius)

  var routesQuery = "SELECT route_id, trip_headsign, lat, lon, stop_code from (" + stopsQuery + ")a ";
  routesQuery += " JOIN stop_times using (stop_id) ";
  routesQuery += " JOIN trips using (trip_id) ";

  var pathsQuery = "SELECT shape_pt_lat as lat, shape_pt_lon as lon from ("+routesQuery+")a ";
  pathsQuery += "join trip_shapes t using (route_id, trip_headsign)";

  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": mysqlConf.user,
    "database": "gtfs"
  });

  connection.connect();

  connection.query(pathsQuery, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    callback(rows);
  });
  
}

function getPredictionsFromStops(lat, lon, radius, callback) {
  var radius = typeof radius == "undefined" ? 0.02 : radius;
  var stopsQuery = getStopsQuery(lat, lon, radius)

  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": mysqlConf.user,
    "database": "gtfs"
  });

  connection.connect();

  connection.query(stopsQuery, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    var stopCodes = [];
    for (var row in rows) {
      stopCodes.push(rows[row].stop_code);
    }
    getRoutes(stopCodes);
  });
}

function getRoutes(stops) {
  stops.forEach(function(stop) {
    // stop = e.g. 50400
    // vehicle
    var options = {
      host: 'webservices.nextbus.com',
      path: '/service/publicXMLFeed?command=predictions&a=actransit&stopId='+stop
    }
    http.get(options,function(res){
      console.log("Got a response:", res);
      console.log("---------------------");
      console.log("---------------------");
      console.log("---------------------");
      console.log("---------------------");
      console.log("---------------------");
      res.setEncoding('utf8');
      res.on('data',function(chunk){
        parser.parseString(chunk,function(err,result){
          try{
            for(var i in result){
              vehiclePrediction(result[i]['routeTag']);
            }
          }
          catch(e){
            console.log("NextBus getRoutes error");
          }
        });
      })
    });
  });
}

function vehiclePrediction(routeId) {
  var options = {
    host: 'webservices.nextbus.com',
    path: path.replace('<routeId>',routeId)
  }
  http.get(options, function(res){
    res.setEncoding('utf8');
    res.on('data',function(chunk){
      parser.parseString(chunk,function(err,result){
        try{
          for(var i in result){
            var output = "";
            var busId = result['id'];
            output+="Bus ID: "+busId+", ";
            var routeTag = result['routeTag'];
            output+="Route Tag: "+routeTag+", ";
            var dirTag = result['out'];
            var lat = result['lat'];
            output+="Location: ("+lat+",";
            var lon = result['lon'];
            output+=lon+"), ";
            var secsPassed = result['secsSinceLastReport'];
            output+="Time Passed: "+secsPassed+", ";
            var predictable = result['predictable'];
            output+= "Predictable: "+predictable;
            console.log(output);
          }
        }
        catch(e){
          console.log("Error in getting bus data");
          console.log("NextBus vehiclePrediction data error");
        }
      });
      });
      res.on('end',function(){
      });
    }).on("error",function(e){
      console.log("Error: "+e.message);
  });
}

exports.getRoutePaths = getRoutePaths;
exports.getStops = getStops;
exports.getRoutes = getRoutes;
exports.vehiclePrediction = vehiclePrediction;
exports.getPredictionsFromStops = getPredictionsFromStops;
