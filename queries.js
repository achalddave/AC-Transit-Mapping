var mysql = require("mysql"),
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

  return stopsQuery;
}

/* Radius in latitude/longitude steps */
function getStops(lat, lon, radius, callback) {
  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": "root",
    "password": "",
    "database": "gtfs"
  });

  connection.connect();

  var radius = typeof radius == "undefined" ? 0.01 : radius;

  var query = getStopsQuery(lat, lon, radius);
  /*
     var allTripsQuery = "select route_id, trip_headsign, shape_pt_lat, shape_pt_lon from (select route_id, trip_headsign, shape_id from trips group by route_id, trip_headsign)a join shapes using (shape_id)";

     var allTripsQuery = "select route_id, trip_headsign, shape_pt_lat, shape_pt_lon from trip_shapes";

     var query = 'SELECT DISTINCT shape_pt_lat as lat, shape_pt_lon as lon from trips JOIN shapes ON trips.shape_id=shapes.shape_id WHERE trips.route_id="'+route+'" AND trips.trip_headsign="'+headsign+'" ORDER BY shape_pt_sequence';
     */

  connection.query(query, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    callback(rows);
  });
}

function getRoutePaths(lat, lon, radius, callback) {
  var radius = typeof radius == "undefined" ? 0.01 : radius;
  var stopsQuery = getStopsQuery(lat, lon, radius)

  var routesQuery = "SELECT route_id, trip_headsign from (" + stopsQuery + ")a ";
  routesQuery += " JOIN stop_times using (stop_id) ";
  routesQuery += " JOIN trips using (trip_id) ";

  var pathsQuery = "SELECT shape_pt_lat, shape_pt_lon from ("+routesQuery+")a ";
  pathsQuery += "join trip_shapes t using (route_id, trip_headsign)";

  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": "root",
    "password": "",
    "database": "gtfs"
  });

  connection.connect();

  connection.query(pathsQuery, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    console.log("Finished query");
    callback(rows);
  });
}

function getRoutes(stops) {
  stops.forEach(function(stop) {
    // stop = e.g. 50400
    // vehicle
    var options = {
      host: 'http://webservices.nextbus.com',
      path: '/service/publicXMLFeed?command=predictions&a=actransit&stopId='+stop
    }
    http.get(options,function(res){
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
    host: 'http://webservices.nextbus.com',
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
            mainRes.write(output);
          }
        }
        catch(e){
          mainRes.write("Error in getting bus data");
          console.log("NextBus vehiclePrediction data error");
        }
      });
      });
      res.on('end',function(){
        mainRes.end();
      });
    }).on("error",function(e){
      console.log("Error: "+e.message);
      mainRes.end();
  });
}

exports.getRoutePaths = getRoutePaths;
exports.getStops = getStops;
exports.getRoutes = getRoutes;
exports.vehiclePrediction = vehiclePrediction;
