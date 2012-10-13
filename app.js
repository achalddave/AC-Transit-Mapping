var queries = require("./queries"),
    externalScripts = require("./externalScripts"),
    express = require("express"),
    app = express();

app.listen(9000);
console.log("listening on default port 9000");

// use ejs-locals for all ejs templates:
var engine = require('ejs-locals');
app.engine('ejs', engine);

app.set('views',__dirname + '/views');
app.set('view engine', 'ejs'); // so you can render('index')

app.use(express.static(__dirname + "/static"));

app.get("/test", function(req, res) {
  res.render('home.ejs', { 
    scripts: {
      external : [
        externalScripts.maps,
        externalScripts.jQuery
      ],
      local : [
        "maps.js",
        "selectToAutocomplete/jquery.select-to-autocomplete.min.js",
        "selectToAutocomplete/jquery-ui-autocomplete.min.js",
      ]
    },
    styles: {
      local : ["home.css"]
    }
  });
});

app.get("/api/stops", function(req, res) {
  console.log("Hey.");
  res.set('Content-Type', 'application/json');
  console.log(req.query);
  queries.getStops(req.query.lat, req.query.lon, req.query.radius, function(data) { res.send(data); });
});

app.get("/api/routes", function(req, res) {
  queries.getRoutePaths(req.query.lat, req.query.lon, req.query.radius, function(data) { res.send(data); });
});

app.get("/api/prediction", function(req, res) {
  queries.getPredictionsFromStops(req.query.lat, req.query.lon, req.query.radius, function(data) { res.send(data); });
});

app.get("/api/keywordRoute", function(req, res) {
  queries.getRoutesByKeyword(req.query.keyword, function(data) { res.send(data); });
});
