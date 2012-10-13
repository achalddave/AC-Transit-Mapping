var mysql = require("mysql");

function getShapes(route, headsign, callback) {
  var connection = mysql.createConnection({
    "hostname": "localhost",
    "user": "root",
    "password": "",
    "database": "gtfs"
  });

  connection.connect();

  var query = 'SELECT DISTINCT shape_pt_lat as lat, shape_pt_lon as lon from trips JOIN shapes ON trips.shape_id=shapes.shape_id WHERE trips.route_id="'+route+'" AND trips.trip_headsign="'+headsign+'" ORDER BY shape_pt_sequence';

  connection.query(query, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    console.log(rows);
    callback(rows);
  });
}

exports.getShapes = getShapes;
