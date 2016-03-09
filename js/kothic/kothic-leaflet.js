L.TileLayer.Kothic = L.TileLayer.Canvas.extend({
    options: {
        tileSize: 256 * 4,
        zoomOffset: 2,
        minZoom: 2,
        maxZoom: 22,
        updateWhenIdle: true,
        unloadInvisibleTiles: true,
        attribution: 'Map data &copy; 2013 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors,' +
                     ' Rendering by <a href="http://github.com/kothic/kothic-js">Kothic JS</a>',
        async: true,
        buffered: false,
        styles: MapCSS.availableStyles,
        granularity: 1000,
    },

    initialize: function(url,options) {
        L.Util.setOptions(this, options);

        this._url = url;
        this._canvases = {};
        this._scripts = {};
        this._debugMessages = [];

      //  window.onKothicDataResponse = L.Util.bind(this._onKothicDataResponse, this);
    },

    _onKothicDataResponse: function(data, zoom, x, y) {
        var key = [zoom, x, y].join('/'),
            canvas = this._canvases[key],
            zoomOffset = this.options.zoomOffset,
            layer = this;

        if (!canvas) {
            return;
        }

        function onRenderComplete() {
            layer.tileDrawn(canvas);

      //      document.getElementsByTagName('head')[0].removeChild(layer._scripts[key]);
        //    delete layer._scripts[key];
        }

        this._invertYAxe(data);

        var styles = this.options.styles;

        Kothic.render(canvas, data, zoom + zoomOffset, {
            styles: styles,
            locales: ['be', 'ru', 'en'],
            onRenderComplete: onRenderComplete
        });

        delete this._canvases[key];
    },

    getDebugMessages: function() {
        return this._debugMessages;
    },

    drawTile: function(canvas, tilePoint, zoom) {
        return;
        var zoomOffset = this.options.zoomOffset,
            key = [(zoom - zoomOffset), tilePoint.x, tilePoint.y].join('/'),
            url=this._url.replace('{x}',tilePoint.x).
                    replace('{y}',tilePoint.y).
                    replace('{z}',zoom-zoomOffset);
        this._canvases[key] = canvas;
        //this._scripts[key] = this._loadScript(url);
        $.getJSON({
            dataType: "json",
            url: url,
            x: tilePoint.x,
            y: tilePoint.y,
            zoom: zoom-zoomOffset,
            canvas: canvas,
            layer: this,
            key: key,
            success: function(data){
                this.layer._renderTile(data,this.x,this.y,this.zoom,this.canvas,this.layer);
            },
          });
    },
    
    enableStyle: function(name) {
        if (MapCSS.availableStyles.indexOf(name) >= 0 && this.options.styles.indexOf(name) < 0) {
            this.options.styles.push(name);
            this.redraw();
        }
    },

    disableStyle: function(name) {
        if (this.options.styles.indexOf(name) >= 0) {
            var i = this.options.styles.indexOf(name);
            this.options.styles.splice(i, 1);
            this.redraw();
        }
    },

    redraw: function() {
        MapCSS.invalidateCache();
        // TODO implement layer.redraw() in Leaflet
        this._map.getPanes().tilePane.empty = false;
        if (this._map && this._map._container) {
            this._reset();
            this._update();
        }
    },

    _renderTile: function (data,x,y,zoom,canvas,layer) {
        function onRenderComplete() {
            layer.tileDrawn(canvas);

      //      document.getElementsByTagName('head')[0].removeChild(layer._scripts[key]);
        //    delete layer._scripts[key];
        }
        //TODO if featurecollection
        data.granularity = this.options.tileSize;
        
        this._invertYAxe(data);

        var styles = this.options.styles;

        Kothic.render(canvas, data, zoom + this.options.zoomOffset, {
            styles: styles,
            locales: ['be', 'ru', 'en'],
            onRenderComplete: this._onRenderTileComplete
        });
    },

    _invertYAxe: function(data) {
        var type, coordinates, tileSize = data.granularity, i, j, k, l, feature;
        for (i = 0; i < data.features.length; i++) {
            feature = data.features[i];
            feature.coordinates = feature.geometry.coordinates;
            feature.type = feature.geometry.type;
            coordinates = feature.coordinates;
            type = data.features[i].type;
            if (type === 'Point') {
                coordinates[1] = tileSize - coordinates[1];
            } else if (type === 'MultiPoint' || type === 'LineString') {
                for (j = 0; j < coordinates.length; j++) {
                    coordinates[j][1] = tileSize - coordinates[j][1];
                }
            } else if (type === 'MultiLineString' || type === 'Polygon') {
                for (k = 0; k < coordinates.length; k++) {
                    for (j = 0; j < coordinates[k].length; j++) {
                        coordinates[k][j][1] = tileSize - coordinates[k][j][1];
                    }
                }
            } else if (type === 'MultiPolygon') {
                for (l = 0; l < coordinates.length; l++) {
                    for (k = 0; k < coordinates[l].length; k++) {
                        for (j = 0; j < coordinates[l][k].length; j++) {
                            coordinates[l][k][j][1] = tileSize - coordinates[l][k][j][1];
                        }
                    }
                }
            } else {
                throw "Unexpected GeoJSON type: " + type;
            }

            if (feature.hasOwnProperty('reprpoint')) {
                feature.reprpoint[1] = tileSize - feature.reprpoint[1];
            }
        }
    },

    _get_sphmerc_bbox:function (x,y,z) {
        var HALF_EARTH = 20037508.34;
        var EARTH =40075016.68;
        bbox=array();
        metresInTile = EARTH /Math.pow(2,z);
        bbox[0] = (x*$metresInTile)-HALF_EARTH - 0.01;
        bbox[3] = HALF_EARTH-(y*metresInTile) - 0.01;
        bbox[2] = bbox[0]+metresInTile + 0.01;
        bbox[1] = bbox[3]-metresInTile + 0.01;
        return bbox;
    },
    
    _sphmerc_to_ll: function (x,y) {
        var value = array();
        value['lon'] = sphmerc_to_lon(x);
        value['lat'] = sphmerc_to_lat(y);
        return value;
    },
    
    _sphmerc_to_lon: function (m) {
        var HALF_EARTH = 20037508.34;
        return (m/HALF_EARTH) * 180.0;
    },
    
    _kothicAdjust: function(f, bbox)
    {
        granularity = this.options.granularity;
        factor = granularity / (bbox[2]-bbox[0]);
        coords=array();
        switch(f["type"])
        {
            case "Point":
                x = ((f["coordinates"][0] - bbox[0]) * factor);
                y = ((f["coordinates"][1] - bbox[1]) * factor);
            coords = array(x,y);
            break;
            case "LineString":
                for(i=0; i<count(f["coordinates"]); i++)
                {
                    x =  (int)    
                    round((f["coordinates"][i][0]-bbox[0]) * factor);
                    y =     (int)
                    round((f["coordinates"][i][1]-bbox[1]) * factor);
                    // coords of (0,0) seem to  screw up rendering
                    x=(x==0)?1:x;
                    y=(y==0)?1:y;
    
                    x=(x==granularity)?granularity-1:x;
                    y=(y==granularity)?granularity-1:y;
                    if(x>=0 && y>=0 && x<=granularity && 
                        y<=granularity)
            if(true)
                    {
                //FIXME
                           coords = array(x,y);
                    }
                }
                break;
            case "MultiLineString":
            case "Polygon":
                for(i=0; i<count(f["coordinates"]); i++)
                {
                    coords[i]=array();
                    for(j=0; j<count(f["coordinates"][i]); j++)
                    {
                        x =  (int)    
                        round((f["coordinates"][i][j][0]-
                        bbox[0]) * factor);
                        y =     (int)
                        round((f["coordinates"][i][j][1]-
                        bbox[1]) * factor);
                        // coords of (0,0) seem to screw up rendering
                        if($f["type"]=="MultiLineString")
                        {
                            x=(x==0)?1:x;
                            y=(y==0)?1:y;
                            x=(x==granularity)?granularity-1:x;
                            y=(y==granularity)?granularity-1:y;
                        }
            //FIXME
                        coords[i] = array(x,y);
                    }
                }
                break;
            case "MultiPolygon":
                for(i=0; i<f["coordinates"].length; i++)
                {
                    coords[i]= new Array;
                    for(j=0; j<count(f["coordinates"][i]); j++)
                    {
                        coords[i][j]=array();
                        for($k=0; $k<count(f["coordinates"][i][j]); $k++)
                        {
                            x =  (int)    
                            round((f["coordinates"][i][j][$k][0]-
                            bbox[0]) * 
                            factor);
                            y =     (int)
                            round((f["coordinates"][i][j][$k][1]-
                            bbox[1]) * 
                            factor);
                // coords of (0,0) screw up rendering
                            x=(x==0)?1:x;
                            y=(y==0)?1:y;
                            x=(x==granularity)?granularity-1:x;
                            y=(y==granularity)?granularity-1:y;
                            //FIXME
                            coords[i][j] = array(x,y);
                        }
                    }
                }
                break;
        }
        return coords;
    }
});
