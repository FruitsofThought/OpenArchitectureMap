/*
OpenRailwayMap Copyright (C) 2012 Alexander Matheisen
This program comes with ABSOLUTELY NO WARRANTY.
This is free software, and you are welcome to redistribute it under certain conditions.
See http://wiki.openstreetmap.org/wiki/OpenRailwayMap for details.
*/


// main function, creates map and layers, controls other functions
function createMap(embed)
{
	root = "http://localhost/kothic-js/dist/";
	loading = "<img class='loading' src='"+root+"/img/loading.gif'><br>"+translations['loading'];
	// path to the bitmap tile directory
	tiledir = "http://tiles.mountbatten.nl/";
	// available map rendering styles
	availableStyles = new Array("buildings", "architecture", "all");
        defaultStyle = "architecture";
	if (params['offset'] != null)
		offset = params['offset'];
	else
	{
		// get time offset to UTC
		var now = new Date();
		offset = -(now.getTimezoneOffset() / 60);
	}

	map = L.map('mapFrame');

	if (!embed)
	{
		map.on('moveend', function(e)
		{
			updatePermalink(railmap.selectedStyle);
		});
	}

	// grayscale mapnik background layer
	var mapnikGray = new L.TileLayer.Grayscale('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		attribution: translations['mapnikAttribution'],
		maxZoom: 19
	}).addTo(map);
/*	// normal mapnik background layer
	var mapnik = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	{
		attribution: translations['mapnikAttribution'],
		maxZoom: 19
	});

	// grayscale MapQuest background layer
	var mapquestGray = new L.TileLayer.Grayscale('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
	{
		attribution: translations['mapquestAttribution'],
		maxZoom: 18
	});
	// normal MapQuest background layer
	var mapquest = new L.TileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
	{
		attribution: translations['mapquestAttribution'],
		maxZoom: 18
	});
*/
	// blank background map
	var blank = new L.TileLayer(root+'/img/blank.png',
	{
		maxZoom: 20
	});

	// railmap layer
	railmap = new L.TileLayer.Kothic(tiledir+defaultStyle+'/{z}/{x}/{y}.json',
	{
		attribution: "Served by Reinier",
		minZoom: 13,
		maxZoom: 19,
		tileSize: 256,
                zoomOffset: 0,
	}).addTo(map);

	
	var MVTSource = new L.TileLayer.MVTSource({
//	    url: "http://spatialserver.spatialdev.com/services/vector-tiles/GAUL_FSP/{z}/{x}/{y}.pbf",
	    url: tiledir+defaultStyle+'/{z}/{x}/{y}.mvt',
	    debug: true,
	    clickableLayers: [defaultStyle],
	    getIDForLayerFeature: function(feature) {
	      return feature.properties.id;
	    },

	    /**
	     * The filter function gets called when iterating though each vector tile feature (vtf). You have access
	     * to every property associated with a given feature (the feature, and the layer). You can also filter
	     * based of the context (each tile that the feature is drawn onto).
	     *
	     * Returning false skips over the feature and it is not drawn.
	     *
	     * @param feature
	     * @returns {boolean}
	     */
	    filter: function(feature, context) {
	      if (feature.layer.name === defaultStyle) {
	        return true;
	      }
	      return false;
	    },

	    style: function (feature) {
	      var style = {};

	      var type = feature.type;
	      switch (type) {
	        case 1: //'Point'
	          style.color = 'rgba(49,79,79,1)';
	          style.radius = 5;
	          style.selected = {
	            color: 'rgba(255,255,0,0.5)',
	            radius: 6
	          };
	          break;
	        case 2: //'LineString'
	          style.color = 'rgba(161,217,155,0.8)';
	          style.size = 3;
	          style.selected = {
	            color: 'rgba(255,25,0,0.5)',
	            size: 4
	          };
	          break;
	        case 3: //'Polygon'
	          style.color = fillColor;
	          style.outline = {
	            color: strokeColor,
	            size: 1
	          };
	          style.selected = {
	            color: 'rgba(255,140,0,0.3)',
	            outline: {
	              color: 'rgba(255,140,0,1)',
	              size: 2
	            }
	          };
	          break;
	      }
	      
	      switch (feature.properties.architecture_style) {
	      case "modernism":
	          style.color = "blue";
	          break;
	      
	    };
	      return style;
	    }

	  });
	//  debug.mvtSource = mvtSource;

	  //Globals that we can change later.
	  var fillColor = 'rgba(149,139,255,0.4)';
	  var strokeColor = 'rgb(20,20,20)';

	  //Add layer
	 map.addLayer(MVTSource);

	
	
	if (!embed)
	{
		map.on('zoomend', function(e)
		{
//			updateLegend("legend", railmap.selectedStyle);
			updatePermalink(railmap.selectedStyle);
		});
	}

	// hillshading layer
	var hillshading = new L.TileLayer('http://{s}.tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png',
	{
		attribution: translations['hillshadingAttribution'],
		maxZoom: 17
	});

	var baseLayers = new Object();
//	baseLayers[translations['mapnik']] = mapnik;
	baseLayers[translations['mapnikGrayscale']] = mapnikGray;
//	baseLayers[translations['mapquest']] = mapquest;
//	baseLayers[translations['mapquestGrayscale']] = mapquestGray;
	baseLayers[translations['blank']] = blank;

	var overlays = new Object();
	overlays[translations['hillshading']] = hillshading;
	overlays[translations['railmap']] = railmap;

	var scaleLine = new L.Control.Scale({metric:true, maxWidth:200}).addTo(map);
	var layerSwitch = new L.Control.Layers(baseLayers, overlays).addTo(map);

	// only in not-embed mode
	if (!embed)
	{
		// setting start position
		startposition = new Startposition(map);
		// loading timestamp
		var timestamp = new Timestamp("info");
		// create search
//		search = new Search(map, "searchBox", "searchBar", "searchButton", "clearButton");
		// build style selection and it's event handling
//		getStyleSelection();
		// set rendering style
		if (params['style'] != null && styleValid(params['style']))
			applyStyle(params['style']);
		else
			applyStyle(defaultStyle);
		// onclick event of locate button
		gEBI("locateButton").onclick = function()
		{
			startposition.setPosition();
		};
		// initialize the permalink url
		updatePermalink(railmap.selectedStyle);
	}
	else
	{
		// set rendering style
		if (params['style'] != null && styleValid(params['style']))
			setStyle(params['style']);
		else
			setStyle(defaultStyle);

		// setting start position
		startposition = new Startposition(map);
	}
}


// changes the current map rendering style to the style given as parameter
function setStyle(style)
{
	// helper variable for saving current map style
	railmap.selectedStyle = style;
	// change tileserver url to load different style
	railmap._url = tiledir+style+'/{z}/{x}/{y}.json';
	// reload all tiles after style was changed
	railmap.redraw();
}


// changes the current map rendering style to the style given as parameter and updates legend, permalink and style selection
function applyStyle(style)
{
	setStyle(style);

	// mark selected item as checked
//	var selectableItems = gEBI('styleSelectionBar').getElementsByTagName('input');
//	for (var i=0; i<selectableItems.length; i++)
//		if (selectableItems[i].value == style)
//			var index = i;

//	selectableItems[index].checked = true;
//	updateLegend("legend", style);
//	updatePermalink(railmap.selectedStyle);
}


// build a radio-button list of available map styles
function getStyleSelection()
{
//	gEBI('styleSelectionBar').innerHTML = '<form id="styleSelection"><b>'+translations['styleSelection']+':</b><br /><p>';
//	for (var i=0; i<availableStyles.length; i++)
//		gEBI('styleSelectionBar').innerHTML += '<label><input onchange="applyStyle(this.value)" type="radio" name="style" value="'+availableStyles[i]+'">'+translations['style.'+availableStyles[i]]+'</label><br />';
//	gEBI('styleSelectionBar').innerHTML += '</p></form>';
}


// returns true if the given stylename is a valid and available style; otherwise false is returned
function styleValid(style)
{
	return (availableStyles.indexOf(style) >= 0);
}
