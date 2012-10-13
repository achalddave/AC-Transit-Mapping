$(function() {

  var jMapDiv = $("#mapCanvas");
  var map;

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    plotRoutes(position);
  });

  function mapSetup(position) {
    var lat = 37.875489;
    var lon = -122.245544;
    var mapOptions = {
      center: new google.maps.LatLng(lat, lon),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(jMapDiv[0], mapOptions);
  }

  function plotRoutes(position) {
    var lat = position.coords.latitude,
        lon = position.coords.longitude;

    lat = 37.875489;
    lon = -122.245544;

    console.log(new Date().getSeconds());
    $.get('api/prediction', {
      lat : lat,
      lon : lon
    }, function(data, textStatus, jqXHR) {
      console.log("Hey");
    });

    function get_random_color() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
      }
      return color;
    }

    $.get('api/routes', {
      lat : lat,
      lon : lon
    }, function(data, textStatus, jqXHR) {
      console.log(data);
      var paths = {};
      for (var i = 0; i < data.length; i++) {
        var key = data[i].route_id + "|" + data[i].trip_headsign;
        if (!paths[key]) {
          paths[key] = []
        }
        var path = paths[key];

        var point = data[i];
        path.push(new google.maps.LatLng(point.lat, point.lon));

        if (i == data.length - 1) {
          for (var key in paths) {
            console.log("Setting path for ", key);
            var path = paths[key];
            console.log(path);
            var polyline = new google.maps.Polyline({
              path : path,
              strokeColor : get_random_color(),
              strokeWeight: 5
            });

            polyline.setMap(map);
          }
        }
      }
    });

    // get all the stops
    $.get('api/stops', {
      lat : lat,
      lon : lon
    }, function(data, textStatus, jqXHR) {
      for (var i = 0; i < data.length; i++) {
        var point = data[i];
        var drop = (function(point) {
          return function() {
            var marker = new google.maps.Marker({
              position : new google.maps.LatLng(point.lat, point.lon),
              map : map,
              animation : google.maps.Animation.DROP,
              title : point.stop_code
            });

            var contentString = "<h1 style='font-family:Segoe UI; font-size:2em'>" + point.stop_code + "</h1>";
            contentString += "<p style='font-family:Calibri'>Next bus arriving in ... minutes";

            var infowindow = new google.maps.InfoWindow({
              content : contentString
            });

            google.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map,marker);
            });
          }
        })(point);

        setTimeout(drop, i*200);
      }
    });
  }
})
