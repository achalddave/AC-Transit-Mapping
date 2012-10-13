var config = require("./config");

var mapsUrl = "http://maps.googleapis.com/maps/api/js?key="+config.api.maps+"&sensor=true";

var scripts = {
  "maps"  : mapsUrl,
  "jQuery" : "http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"
}

for (var key in scripts) {
  exports[key] = scripts[key];
}

