$(function() {

  var jMapDiv = $("#mapCanvas");
  var map;
  var markers = [];
  var degreeRadius = 0.02;

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    plotRoutes();
    plotNearStops();
  });

  function mapSetup(position) {
    var mapOptions = {
      // center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      center: new google.maps.LatLng(37.8700931, -122.2703423),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(jMapDiv[0], mapOptions);
    google.maps.event.addListener(map,'center_changed',plotNearStops());
  }

  function plotNearStops(){
    for(var i = 0; i< markers.length;i++){
      markers[i].setMap(null);
    }
    var request = {
      location: map.getCenter(),
      radius: 111.325*1000*degreeRadius,
      types: ['bus_station']
    };
    service = new google.maps.places.PlacesService(map);
    service.search(request,searchCallback);
  }
  function searchCallback(results,status) {
    if(status == google.maps.places.PlacesServiceStatus.OK){
      for(var i = 0;i<results.length;i++){
        createMarker(results[i]);
      }
    }
  }
  function createMarker(place){
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map
      position: place.geometry.location
    });
    markers.push(marker);
    marker.setTitle(place.name);
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

