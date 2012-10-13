var mysql = require("mysql");

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

function getRoutes(lat, lon, radius, callback) {
  var stopsQuery = getStopsQuery(lat, lon, radius)

  var routesQuery = "SELECT route_id, trip_headsign, lat, lon, stop_code from (" + stopsQuery + ")a ";
  routesQuery += " JOIN stop_times using (stop_id) ";
  routesQuery += " JOIN trips using (trip_id) ";

  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": "root",
    "password": "",
    "database": "gtfs"
  });

  connection.connect();

  connection.query(routesQuery, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    callback(rows);
  });
}

exports.getStops = getStops;
exports.getRoutes = getRoutes;
