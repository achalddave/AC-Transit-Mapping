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
  var busWithWindow;
  var busMarkers = new Array();
  
  function HomeControl(controlDiv, map) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map.
  controlDiv.style.padding = '5px';

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '2px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to set the map to Home';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = '<strong>Home</strong>';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to Chicago.
  google.maps.event.addDomListener(controlUI, 'click', function() {
    alert("test");
  });
}
  
  var tid = setInterval(intervalLoop, 10000);
  function intervalLoop() {
    get51B();
  }
  function abortTimer() {
    clearInterval(tid);
  }
  
  var glid = setInterval(graphicalLoop, 20);
  function graphicalLoop() {
    for(index in busMarkers) {
      var bus = busMarkers[index];
      var elapsed = Date.now()-bus.reportTime;
      var SMOOTHMOVETIME = 1000.0;
      if(elapsed < SMOOTHMOVETIME && bus.timeSinceRefresh <= 20) {
        var oneSecExtrapolatedLatLng = bus.originalLatLng.destinationPoint(bus.bearing, bus.speed*((elapsed/SMOOTHMOVETIME+bus.timeSinceRefresh)/3600));
        var latDiff = oneSecExtrapolatedLatLng.lat() - bus.animStartLatLng.lat();
        var lngDiff = oneSecExtrapolatedLatLng.lng() - bus.animStartLatLng.lng();
        var factor = Math.sqrt(elapsed/SMOOTHMOVETIME);
        latDiff *= factor;
        lngDiff *= factor;
        bus.setPosition(new google.maps.LatLng(bus.animStartLatLng.lat()+latDiff, bus.animStartLatLng.lng()+lngDiff));
      } else {
        var extrapolatedLatLng = bus.originalLatLng.destinationPoint(bus.bearing, bus.speed*(bus.timeSinceRefresh/3600+elapsed/3600000));
        bus.setPosition(extrapolatedLatLng);
      }
    }
  }

  navigator.geolocation.getCurrentPosition(function(position) {
    mapSetup(position);
    get51B();
    var homeControlDiv = document.createElement('div');
    var homeControl = new HomeControl(homeControlDiv, map);
    homeControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);
    plotRoute("51b");
  });
  
  function clearBuses() {
    for(index in busMarkers) {
      var bus = busMarkers[index];
      bus.setMap(null);
    }
  }
  
  function get51B() {
    var newBusMarkers = new Array();
    var routeId = '51B';
    $.get("http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=actransit&r="+routeId+"&t=0", function(res){
      var parsed = $.parseXML(res);
      $(res).find("vehicle").each(function() {
        var lat = $(this).attr("lat");
        var lon = $(this).attr("lon");

        var image = 'bus-icon.gif';
        var myLatLng = new google.maps.LatLng(lat, lon);
        var extrapolatedLatLng = myLatLng.destinationPoint(parseInt($(this).attr("heading")), parseFloat($(this).attr("speedKmHr"))*parseFloat($(this).attr("secsSinceReport"))/3600);
        
        var existingBus;
        for(var i = 0; i < busMarkers.length; i++) {
            var bus = busMarkers[i];
            console.log("TRYING TO MATCH: "+parseInt($(this).attr("id")));
            console.log(parseInt(bus.id));
            if (parseInt(bus.id) == parseInt($(this).attr("id"))) {
                extrapolatedLatLng = bus.getPosition();
                console.log("BUS UPDATED AND KEPT: "+bus.id);
            }
        }
        
        var busMarker = new google.maps.Marker({
          position: extrapolatedLatLng,
          map: map,
          icon: image
        });
        busMarker.id = $(this).attr("id");
        busMarker.originalLatLng = myLatLng;
        busMarker.animStartLatLng = busMarker.position;
        busMarker.bearing = parseFloat($(this).attr("heading"));
        busMarker.speed = parseFloat($(this).attr("speedKmHr"));
        busMarker.reportTime = Date.now();
        busMarker.timeSinceRefresh = parseFloat($(this).attr("secsSinceReport"));
        newBusMarkers.push(busMarker);
        var contentString = "<h1 style='font-family:Segoe UI; font-size:2em'>" + $(this).attr("routeTag") + " - "+busMarker.id+"</h1>";
        contentString += "<p style='font-family:Calibri'>Last updated "+$(this).attr("secsSinceReport")+" seconds ago";

        var infowindow = new google.maps.InfoWindow({
          content : contentString
        });
        
        if(busWithWindow && busWithWindow.id == busMarker.id) {
          infowindow.open(map,busMarker);
          openInfoWindow = infowindow;
          busWithWindow = busMarker;
        }

        google.maps.event.addListener(busMarker, 'click', function() {
          if(openInfoWindow)
            openInfoWindow.close();
          infowindow.open(map,busMarker);
          openInfoWindow = infowindow;
          busWithWindow = busMarker;
        });
      });
      clearBuses();
      busMarkers = newBusMarkers;
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

/*
  function plot51BRoute() {
    var routeId = "51B";
    var color = "#5B76A0";
    $.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=actransit&r="+routeId, function(res){
      console.log(res);
      var parsed = $.parseXML(res);
      console.log(parsed);
      $(res).find("path").each(function() {
          // "this" is a <path> full of <points>
          var path = [];
          $(this).find("point").each(function() {
            path.push(new google.maps.LatLng(this.lat, this.lon));
          });
          var polyline = new google.maps.Polyline({
            path: path,
            strokeColor: color,
            strokeWeight: 5,
            visible: true
          });
          polyline.setMap(map);
      });
    });
  }
*/

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
              busWithWindow = null;
            });
          }
        })(point);

        setTimeout(drop, i*200);
      }
    });
  }

  function plotRoute(keyword) {
    // get routes by keyword
    $.get('api/keywordRoute', {
      keyword: keyword
    }, function(data) {
      // do stuff with data
      // data is an array of objects with the following keys:
      //    route_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence,
      //    trip_headsign
      var paths = {};
      var path = [];
      for (var i in data) {
        var point = data[i],
            lat = point.lat,
            lon = point.lon,
            dir = point.trip_headsign;
        if (!paths[dir]) {
          paths[dir] = [];
        }
        paths[dir].push(new google.maps.LatLng(lat, lon));
      }
      for (var dir in paths) {
        var path = paths[dir];
        var polyline = new google.maps.Polyline({
            path: path,
            strokeColor: "#5B76A0",
            strokeWeight: 5
        });
        polyline.setMap(map);
      }
    });
  }
})
