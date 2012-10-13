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
  var currRoute = "51B";
  
  window.changeMap = function(busName) {
    currRoute = busName;
    plotRoute(currRoute);
    get51B(currRoute);
  }
  
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
  
  var chooserDiv = document.createElement('div');
  chooserDiv.innerHTML = '<form style="float:left; "> \
    <select name="mapchange" onchange="changeMap(this.options[this.selectedIndex].value)"> \
        <option value="1">1</option> \
<option value="1R">1R</option> \
<option value="7">7</option> \
<option value="11">11</option> \
<option value="12">12</option> \
<option value="14">14</option> \
<option value="18">18</option> \
<option value="20">20</option> \
<option value="21">21</option> \
<option value="22">22</option> \
<option value="25">25</option> \
<option value="26">26</option> \
<option value="31">31</option> \
<option value="32">32</option> \
<option value="37">37</option> \
<option value="39">39</option> \
<option value="40">40</option> \
<option value="45">45</option> \
<option value="46">46</option> \
<option value="47">47</option> \
<option value="48">48</option> \
<option value="49">49</option> \
<option value="51A">51A</option> \
<option value="51B" selected="selected">51B</option> \
<option value="52">52</option> \
<option value="54">54</option> \
<option value="57">57</option> \
<option value="58L">58L</option> \
<option value="60">60</option> \
<option value="62">62</option> \
<option value="65">65</option> \
<option value="67">67</option> \
<option value="68">68</option> \
<option value="70">70</option> \
<option value="71">71</option> \
<option value="72">72</option> \
<option value="72M">72M</option> \
<option value="72R">72R</option> \
<option value="73">73</option> \
<option value="74">74</option> \
<option value="75">75</option> \
<option value="76">76</option> \
<option value="83">83</option> \
<option value="85">85</option> \
<option value="86">86</option> \
<option value="88">88</option> \
<option value="89">89</option> \
<option value="93">93</option> \
<option value="94">94</option> \
<option value="95">95</option> \
<option value="97">97</option> \
<option value="98">98</option> \
<option value="99">99</option> \
<option value="210">210</option> \
<option value="212">212</option> \
<option value="215">215</option> \
<option value="216">216</option> \
<option value="217">217</option> \
<option value="232">232</option> \
<option value="239">239</option> \
<option value="242">242</option> \
<option value="251">251</option> \
<option value="264">264</option> \
<option value="275">275</option> \
<option value="314">314</option> \
<option value="332">332</option> \
<option value="333">333</option> \
<option value="339">339</option> \
<option value="345">345</option> \
<option value="350">350</option> \
<option value="356">356</option> \
<option value="376">376</option> \
<option value="386">386</option> \
<option value="391">391</option> \
<option value="604">604</option> \
<option value="605">605</option> \
<option value="606">606</option> \
<option value="607">607</option> \
<option value="611">611</option> \
<option value="618">618</option> \
<option value="620">620</option> \
<option value="621">621</option> \
<option value="623">623</option> \
<option value="624">624</option> \
<option value="625">625</option> \
<option value="626">626</option> \
<option value="628">628</option> \
<option value="629">629</option> \
<option value="631">631</option> \
<option value="634">634</option> \
<option value="638">638</option> \
<option value="641">641</option> \
<option value="642">642</option> \
<option value="643">643</option> \
<option value="646">646</option> \
<option value="648">648</option> \
<option value="649">649</option> \
<option value="650">650</option> \
<option value="651">651</option> \
<option value="652">652</option> \
<option value="653">653</option> \
<option value="654">654</option> \
<option value="655">655</option> \
<option value="657">657</option> \
<option value="658">658</option> \
<option value="660">660</option> \
<option value="662">662</option> \
<option value="663">663</option> \
<option value="664">664</option> \
<option value="667">667</option> \
<option value="668">668</option> \
<option value="669">669</option> \
<option value="671">671</option> \
<option value="672">672</option> \
<option value="675">675</option> \
<option value="676">676</option> \
<option value="679">679</option> \
<option value="680">680</option> \
<option value="681">681</option> \
<option value="682">682</option> \
<option value="684">684</option> \
<option value="686">686</option> \
<option value="688">688</option> \
<option value="696">696</option> \
<option value="800">800</option> \
<option value="801">801</option> \
<option value="802">802</option> \
<option value="805">805</option> \
<option value="840">840</option> \
<option value="851">851</option> \
<option value="B">B</option> \
<option value="BSD">BSD</option> \
<option value="BSN">BSN</option> \
<option value="C">C</option> \
<option value="CB">CB</option> \
<option value="DA">DA</option> \
<option value="DB">DB</option> \
<option value="DB1">DB1</option> \
<option value="E">E</option> \
<option value="F">F</option> \
<option value="FS">FS</option> \
<option value="G">G</option> \
<option value="H">H</option> \
<option value="J">J</option> \
<option value="L">L</option> \
<option value="LA">LA</option> \
<option value="LC">LC</option> \
<option value="M">M</option> \
<option value="NL">NL</option> \
<option value="NX">NX</option> \
<option value="NX1">NX1</option> \
<option value="NX2">NX2</option> \
<option value="NX3">NX3</option> \
<option value="NX4">NX4</option> \
<option value="NXC">NXC</option> \
<option value="O">O</option> \
<option value="OX">OX</option> \
<option value="P">P</option> \
<option value="S">S</option> \
<option value="SB">SB</option> \
<option value="U">U</option> \
<option value="V">V</option> \
<option value="W">W</option> \
<option value="Z">Z</option> \
    </select> \
</form>';
  controlUI.appendChild(chooserDiv);
  controlDiv.appendChild(controlUI);

  // Setup the click event listeners: simply set the map to Chicago.
  //google.maps.event.addDomListener(controlUI, 'click', function() {
  //  alert("test");
  //});
}
  
  var tid = setInterval(intervalLoop, 10000);
  function intervalLoop() {
    get51B(currRoute);
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
    get51B(currRoute);
    var homeControlDiv = document.createElement('div');
    var homeControl = new HomeControl(homeControlDiv, map);
    homeControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);
    plotRoute(currRoute);
  });
  
  function clearBuses() {
    for(index in busMarkers) {
      var bus = busMarkers[index];
      bus.setMap(null);
    }
  }
  
  function get51B(routeId) {
    var newBusMarkers = new Array();
    $.get("http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=actransit&r="+routeId+"&t=0", function(res){
      var parsed = $.parseXML(res);
      $(res).find("vehicle").each(function() {
        var lat = $(this).attr("lat");
        var lon = $(this).attr("lon");

        var image = 'bus.gif';
        var myLatLng = new google.maps.LatLng(lat, lon);
        var extrapolatedLatLng = myLatLng.destinationPoint(parseInt($(this).attr("heading")), parseFloat($(this).attr("speedKmHr"))*parseFloat($(this).attr("secsSinceReport"))/3600);
        
        var existingBus;
        for(var i = 0; i < busMarkers.length; i++) {
            var bus = busMarkers[i];
            if (parseInt(bus.id) == parseInt($(this).attr("id"))) {
                extrapolatedLatLng = bus.getPosition();
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
        var contentString = "<div><h2 style='font-family:Segoe UI; font-size:2em'>" + $(this).attr("routeTag") + " - "+busMarker.id+"</h2>";
        contentString += "<div><p style='font-family:Calibri'>Last updated "+$(this).attr("secsSinceReport")+" seconds ago</p></div></div>";

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
        
        google.maps.event.addListener(infowindow, 'closeclick', function() {
          openInfoWindow = null;
          busWithWindow = null;
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

            google.maps.event.addListener(marker, 'closeclick', function() {
              openInfoWindow = null;
              busWithWindow = null;
            });
            
            google.maps.event.addListener(infowindow, 'click', function() {
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

  var polylines = new Array();
  
  function plotRoute(keyword) {
    // get routes by keyword
    $.get('api/keywordRoute', {
      keyword: keyword
    }, function(data) {
      // do stuff with data
      // data is an array of objects with the following keys:
      //    route_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence,
      //    trip_headsign
      while(polylines.length > 0) {
        var pl = polylines.pop();
        pl.setMap(null);
      }
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
        polylines.push(polyline);
      }
    });
  }
})
