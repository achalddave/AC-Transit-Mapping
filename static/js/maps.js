$(function() {

Number.prototype.toRad = function() {
   return this * Math.PI / 180;
}

Number.prototype.toDeg = function() {
   return this * 180 / Math.PI;
}

google.maps.LatLng.prototype.destinationPoint = function(brng, dist) {
   dist = dist / 6371;  
   brng = brng.toRad();  

   var lat1 = this.lat().toRad(), lon1 = this.lng().toRad();

   var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + 
                        Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

   var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) *
                                Math.cos(lat1), 
                                Math.cos(dist) - Math.sin(lat1) *
                                Math.sin(lat2));

   if (isNaN(lat2) || isNaN(lon2)) return null;

   return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
}

  var jMapDiv = $("#mapCanvas");
  var map;
  var openInfoWindow;
  var busMarkers = new Array();
  
  var tid = setInterval(intervalLoop, 10000);
  function intervalLoop() {
    get51B();
  }
  function abortTimer() {
    clearInterval(tid);
  }
  
  var glid = setInterval(graphicalLoop, 50);
  function graphicalLoop() {
    for(index in busMarkers) {
      var bus = busMarkers[index];
      var elapsed = Date.now()-bus.reportTime;
      var extrapolatedLatLng = bus.originalLatLng.destinationPoint(bus.bearing, bus.speed*(bus.timeSinceRefresh/3600+elapsed/3600000));
      bus.setPosition(extrapolatedLatLng);
    }
  }

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    plotRoutes(position);
    get51B();
  });
  
  function clearBuses() {
    for(index in busMarkers) {
      var bus = busMarkers[index];
      bus.setMap(null);
    }
  }
  
  function get51B() {
    clearBuses();
    var routeId = '51B';
    $.get("http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=actransit&r="+routeId+"&t=0", function(res){
      var parsed = $.parseXML(res);
      $(res).find("vehicle").each(function() {
        var lat = $(this).attr("lat");
        var lon = $(this).attr("lon");

        var image = 'bus-icon.gif';
        var myLatLng = new google.maps.LatLng(lat, lon);
        var extrapolatedLatLng = myLatLng.destinationPoint(parseInt($(this).attr("heading")), parseFloat($(this).attr("speedKmHr"))*parseFloat($(this).attr("secsSinceReport"))/3600);
        var busMarker = new google.maps.Marker({
          position: extrapolatedLatLng,
          map: map,
          icon: image
        });
        busMarker.originalLatLng = myLatLng;
        busMarker.bearing = parseFloat($(this).attr("heading"));
        busMarker.speed = parseFloat($(this).attr("speedKmHr"));
        busMarker.reportTime = Date.now();
        busMarker.timeSinceRefresh = parseFloat($(this).attr("secsSinceReport"));
        busMarkers.push(busMarker);
        var contentString = "<h1 style='font-family:Segoe UI; font-size:2em'>" + $(this).attr("routeTag") + "</h1>";
        contentString += "<p style='font-family:Calibri'>Last updated "+$(this).attr("secsSinceReport")+" seconds ago";

        var infowindow = new google.maps.InfoWindow({
          content : contentString
        });

        google.maps.event.addListener(busMarker, 'click', function() {
          if(openInfoWindow)
            openInfoWindow.close();
          infowindow.open(map,busMarker);
          openInfoWindow = infowindow;
        });
      });
    });
  }

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
              if(openInfoWindow)
                openInfoWindow.close();
              infowindow.open(map,marker);
              openInfoWindow = infowindow;
            });
          }
        })(point);

        setTimeout(drop, i*200);
      }
    });
  }
})
