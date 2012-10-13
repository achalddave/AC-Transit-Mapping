$(function() {

  var jMapDiv = $("#mapCanvas");
  var map;

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    plotRoutes(position.coords.latitude, position.coords.longitude);
  });

  function mapSetup(position) {
    var mapOptions = {
      center: new google.maps.LatLng(37.87, -122.2705),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(jMapDiv[0], mapOptions);
  }

  function plotRoutes(lat, lon) {

    $.get('api/routes', {
      lat : lat,
      lon : lon
    }, function(data, textStatus, jqXHR) {
      console.log(routes);
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

