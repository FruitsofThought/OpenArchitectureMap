/*jslint browser: true*/
/*global Tangram, gui */

map = (function() {
  'use strict';

  var map = L.map('map', {
    visualClickEvents: 'click contextmenu' //can be multiple space-seperated events, like 'click', 'contextmenu', 'dblclick'...
  });
  
  // Sidebar Control
  var sidebar = L.control.sidebar('sidebar', {
    position: 'right'
  }).addTo(map);

  var switcher = L.control.sceneswitcher('sceneswitcher', {
    styles: styles,
    currentStyle: "buildingage",
  }).addTo(map);
  //TODO: build: getscurrentScene;
  var initialstyle = switcher.getCurrentStyle();
  var layer = Tangram.leafletLayer({
    scene: styles[initialstyle].file,
    preUpdate: preUpdate,
    postUpdate: postUpdate,
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | <a href="http://www.openstreetmap.org/about" target="_blank">&copy; OSM contributors | <a href="https://tilesmountbatten.nl/" target="_blank">Mountbatten</a>',
  });
  //      layer.addTo(map);

  // leaflet-style URL hash pattern:
  // #[zoom],[lat],[lng]
  var url_hash = window.location.hash.slice(1, window.location.hash.length).split('/');

  if (url_hash.length == 3) {
    map_start_location = [url_hash[1], url_hash[2], url_hash[0]];
    // convert from strings
    map_start_location = map_start_location.map(Number);
  }

  if (typeof locations != 'undefined') {
    // Location List Control
    var llist = new L.control.locationlist(locations);
    map.addControl(llist);
  }
  
  <!-- This is needed in the interaction functions -->    
  window.sidebar = sidebar;
  window.layer = layer;
  var scene = layer.scene;
  window.scene = scene;

  // setView expects format ([lat, long], zoom)
  map.setView(map_start_location.slice(0, 3), map_start_location[2]);
  var hash = new L.Hash(map);

  function preUpdate(will_render) {
    if (!will_render) {
      return;
    }
  }


  function postUpdate() {}


  function long2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
  }

  function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
  }

  /***** Render loop *****/

  function addGUI() {
    // Link to edit in OSM - hold 'e' and click
    function onMapClick(e) {
      if (key.shift) {
        var url = 'https://www.openstreetmap.org/edit?';

        if (scene.selection.feature && scene.selection.feature.properties.id) {
          url += 'way=' + scene.selection.feature.properties.id;
        }

        if (scene.center) {
          url += '#map=' + scene.baseZoom(scene.zoom) + '/' + scene.center.lat + '/' + scene.center.lng;
        }

        window.open(url, '_blank');
      }

      if (key.command) {
        //  var url = 'http://vector.mapzen.com/osm/all/' + scene.tile_zoom + '/' + long2tile(e.latlng.lng,scene.tile_zoom)  + '/' + lat2tile(e.latlng.lat,scene.tile_zoom) + '.topojson?api_key=vector-tiles-HqUVidw';
        //  window.open(url, '_blank');
        //console.log( e );
      }
    }

    map.on('click', onMapClick);
  }


  // Feature selection
  function initFeatureSelection() {
    // Selection info shown on hover
    var selection_info_label = document.createElement('span');
    var selection_info_table = document.createElement('dl');
    //      selection_info.setAttribute('class', 'label');
    //      selection_info.style.display = 'block';

    // Show selected feature on hover
    scene.container.addEventListener('mousemove', function(event) {
      var pixel = {
        x: event.clientX,
        y: event.clientY
      };

      scene.getFeatureAt(pixel).then(function(selection) {
        if (!selection) {
          $('.leaflet-container').css('cursor', 'pointer');
          return;
        }
        var feature = selection.feature;
        // Only if there is a feature, but we have not clicked on a feature and are
        // showing the table with attributes
        // TODO do nicer stuff with the events of the sidebar
        if ((feature != null) && (selection_info_table.parentNode == null)) {
          $('.leaflet-container').css('cursor', 'help');

          var label = '';
          if (feature.properties.name != null) {
            label = feature.properties.name;
          }
          // Only if there is a label
          if (label != '') {
            selection_info_label.innerHTML = label;
            $('#infopane .sidebar-header').append(selection_info_label);
          } else if (selection_info_label.parentNode != null) {
            //                        ('#home .sidebar-header').html = '';
            $('.leaflet-container').css('cursor', 'pointer');
            selection_info_label.parentNode.removeChild(selection_info_label);
          }
        } else {
          if (selection_info_label.parentNode != null) {
            selection_info_label.parentNode.removeChild(selection_info_label);
          }
        }
        // But always when not hoovering a feature, reset the mousepointer
        if (feature == null) {
          $('.leaflet-container').css('cursor', 'pointer');
        }
      });

      // Don't show labels while panning
      // Why not?
      if (scene.panning == true) {
        if (selection_info_label.parentNode != null) {
          //                    selection_info_label.parentNode.removeChild(selection_info_label);
        }
      }
    });

    // Show selected feature on hover
    scene.container.addEventListener('click', function(event) {
      var pixel = {
        x: event.clientX,
        y: event.clientY
      };

      scene.getFeatureAt(pixel).then(function(selection) {
        if (!selection) {
          if (selection_info_label.parentNode != null) {
            selection_info_label.parentNode.removeChild(selection_info_label);
          }
          if (selection_info_table.parentNode != null) {
            selection_info_table.parentNode.removeChild(selection_info_table);
          }
          return;
        }
        var feature = selection.feature;
        if (feature != null) {
          // console.log("selection map: " + JSON.stringify(feature));

          var table = '';
          if (feature.properties != null) {
            console.log(feature.properties);
            var obj = JSON.parse(JSON.stringify(feature.properties));
            for (var x in feature.properties) {
              var val = feature.properties[x]
              table += "<dt>" + x + '</dt><dd onclick=\"setValuesFromSpan(this)\">' + val + '</dd>';
            }
          }

          if (table != '') {
            //                                                selection_info.style.left = (pixel.x + 5) + 'px';
            //                                                selection_info.style.top = (pixel.y + 15) + 'px';
            selection_info_table.innerHTML = table;
            $('#info').append(selection_info_table);
            window.sidebar.open('infopane');
            if (feature.properties.wikipedia != null) {
              var items = feature.properties.wikipedia.split(':');
              // we could also embed ?printable=yes
              if (items.length == 1) {
                var url = '//en.m.wikipedia.org/wiki/'+items[1];
              } else {
                var url = '//'+items[0]+'.m.wikipedia.org/wiki/'+items[1];
              }
              $('#wikipedia').attr('src', url);
              window.sidebar.enable('wikipediapane');
            } else {
              window.sidebar.disable('wikipediapane');
            } 
          } else if (selection_info_label.parentNode != null) {
 //           selection_info_table.parentNode.removeChild(selection_info_table);
 //s           window.sidebar.disable('wikipediapane');
            //window.sidebar.disable('infopane');
          }
        } else if (selection_info_label.parentNode != null) {
          selection_info_label.parentNode.removeChild(selection_info_label);
          if (selection_info_table.parentNode != null) {
            selection_info_table.parentNode.removeChild(selection_info_table);
          }
        }
      });

      // Don't show labels while panning
      if (scene.panning == true) {
        if (selection_info_label.parentNode != null) {
          //                    selection_info_label.parentNode.removeChild(selection_info);
        }
      }
    });

  }

  window.addEventListener('load', function() {
    // Scene initialized
    layer.on('init', function() {
      addGUI();
      initFeatureSelection();
      });
    layer.addTo(map);
  });

  // iFrame integration
  window.addEventListener("DOMContentLoaded", function() {

    if (window.self !== window.top) {
      //disable scroll zoom if it is iframed
      map.scrollWheelZoom.disable();
      //sending message that child frame is ready to parent window
      window.parent.postMessage("loaded", "*");
      window.addEventListener("message", function(e) {
        // Ignore the message if origin is self (this fixes a Safari bug where iframed documents posts messages at itself)
        if (e.origin === window.location.origin) return;
        switchStyles(e.data);
      }, false);
    }
  }, false);

  return map;

}());
