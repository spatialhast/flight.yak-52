Cesium.BingMapsApi.defaultKey = "AmpMgzJo6R6yUmEllLhbqHLYM5Jrza_bJkzpR0rXdZFYywlCPcbMI07S1eN5Qnvd";

var imageryViewModels = [];

// ESRI World Imagery base layer
imageryViewModels.push(new Cesium.ProviderViewModel({
    name: 'ESRI World Imagery',
    iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/esriWorldImagery.png'),
    tooltip: '\
World Imagery provides one meter or better satellite and aerial imagery in many parts of the world and lower resolution \
satellite imagery worldwide.  The map includes NASA Blue Marble: Next Generation 500m resolution imagery at small scales \
(above 1:1,000,000), i-cubed 15m eSAT imagery at medium-to-large scales (down to 1:70,000) for the world, and USGS 15m Landsat \
imagery for Antarctica. The map features 0.3m resolution imagery in the continental United States and 0.6m resolution imagery in \
parts of Western Europe from DigitalGlobe. In other parts of the world, 1 meter resolution imagery is available from GeoEye IKONOS, \
i-cubed Nationwide Prime, Getmapping, AeroGRID, IGN Spain, and IGP Portugal.  Additionally, imagery at different resolutions has been \
contributed by the GIS User Community.\nhttp://www.esri.com',
    creationFunction: function () {
        return new Cesium.ArcGisMapServerImageryProvider({
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
            enablePickFeatures: false,
            credit: 'Tiles @ Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
    }
}));

// OpenStreetMap base alyer
imageryViewModels.push(new Cesium.ProviderViewModel({
    name: 'Open\u00adStreet\u00adMap',
    iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
    tooltip: 'OpenStreetMap (OSM) is a collaborative project to create a free editable map of the world.\nhttp://www.openstreetmap.org',
    creationFunction: function () {
        return new Cesium.createOpenStreetMapImageryProvider({
            url: 'https://{s}.tile.openstreetmap.org/',
            credit: '@ OpenStreetMap contributors'
        });
    }
}));

var viewer = new Cesium.Viewer('cesiumContainer', {
    //animation: false,
    baseLayerPicker: false,
    geocoder: false,
    imageryProvider: false,
    homeButton: false,
    navigationHelpButton: false,
    //timeline: false,
    infoBox: false,
    sceneModePicker: false
});

viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
    requestVertexNormals: true
});

// init Base Layers
var layers = viewer.imageryLayers;
var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {
    globe: viewer.scene.globe,
    imageryProviderViewModels: imageryViewModels
});

$.getJSON("data/points.geojson", function (data) {
	addModel(data)
});

function addModel(data) {
    var positionArray = [];
    var flightTimeArray = [];
    id = 0;

    for (var key in data.features) {
        var lat = data.features[key].geometry.coordinates[0];
        var lng = data.features[key].geometry.coordinates[1];
        var alt = data.features[key].properties.GPS_Alt;
		var time = moment.unix(data.features[key].properties.TimeStamp/1000).format("YYYY-MM-DDTHH:mm:ssZ");
		
		console.log(time)
		
        positionArray.push(id, lat, lng, +alt);
        flightTimeArray.push(time);

        id = id + 1;

        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lat, lng, alt),
            point: {
                color: Cesium.Color.fromCssColorString('#ff0000'),
                pixelSize: 3
            }
        });

    };

    var czml = [{
        "id": "document",
        "name": "CZML Path",
        "version": "1.0",
        "clock": {
            "interval": flightTimeArray[0] + "/" + flightTimeArray[flightTimeArray.length - 1],
            "currentTime": flightTimeArray[0],
            "multiplier": 1
        }
    }, {
        "id": "path",
        "name": "path with GPS flight data",
        "description": "FlySight sample",
        "availability": flightTimeArray[0] + "/" + flightTimeArray[flightTimeArray.length - 1],
        "path": {
            "material": {
                "polylineOutline": {
                    "color": {
                        "rgba": [255, 0, 255, 255]
                    },
                    "outlineColor": {
                        "rgba": [0, 255, 255, 255]
                    },
                    "outlineWidth": 5
                }
            },
            "width": 1,
            "leadTime": 0,
            "trailTime": 1000,
            "resolution": 5
        },
		"model": {
			"gltf" : "data/model.gltf",
			"scale" : 0.05
		},
        "position": {
            "epoch": flightTimeArray[0],
            "cartographicDegrees": positionArray
        }
    }];

    viewer.dataSources.add(Cesium.CzmlDataSource.load(czml)).then(function (ds) {
        viewer.trackedEntity = ds.entities.getById('path');
    });

};

