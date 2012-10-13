$(function() {

  var jMapDiv = $("#mapCanvas");
  var map;

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    plotRoutes();
  });

  function mapSetup(position) {
    var mapOptions = {
      // center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      center: new google.maps.LatLng(37.8700931, -122.2703423),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(jMapDiv[0], mapOptions);
  }

  function plotRoutes() {
    var points = []
    $.get('query', {
      route : '51B-93',
      headsign : "51B Rockridge Bart"
    }, function(data, textStatus, jqXHR) {
      for (var i = 0; i < data.length; i++) {
        var point = data[i];
        points.push(new google.maps.LatLng(point.lat, point.lon));
        if (i == data.length-1) {
          console.log(points);
          var path = new google.maps.Polyline({
            path : points,
            strokeColor : "#FF0000"
          })
          path.setMap(map);
        }
      }
    });
  }
})

