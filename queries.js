var mysql = require("mysql"),
    connection = mysql.createConnection({
      "hostname": "localhost",
      "user": "root",
      "password": "",
      "database": "gtfs"
    });

var routeShapeQuery = 'SELECT DISTINCT shapes.shape_id FROM routes JOIN trips USING (route_id) JOIN shapes ON trips.shape_id=shapes.shape_id WHERE routes.route_short_name="51b"';

function getShapes(route) {
  connection.connect();

  var query = 'SELECT DISTINCT shape_pt_lat as lat, shape_pt_lon as lon FROM routes JOIN trips USING (route_id) JOIN shapes ON trips.shape_id=shapes.shape_id WHERE routes.route_short_name="'+route+'" ORDER BY shape_pt_sequence';

  connection.query(query, function(err, rows, fields) {
    if (err) {
      console.log("Aw snap, MySQL query didn't work.");
      throw err;
    }

    console.log(rows);
    // console.log(rows[0].shape_pt_lat, rows[0].shape_pt_lon);
  });
}

exports.getShapes = getShapes;
