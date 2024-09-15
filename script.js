// Karte initialisieren
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var initialZoom = isMobile ? 14 : 13; // Höheres Zoom-Level auf mobilen Geräten
var map = L.map('map').setView([48.53484850819166, 9.441566000254877], initialZoom);

// Kartenlayerdefinitionen
    // Basislayer
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenStreetMap (CC-BY-SA)',
        minZoom: 1,
        maxZoom: 19
    }).addTo(map);

    // Topo Layer
    var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenStreetMap (CC-BY-SA)',
        minZoom: 1,
        maxZoom: 17
    });

    // Esri Sat Layer
    var esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Humanitarian Layer
    var humanitarianLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap, HOT, (c) OpenStreetMap contributors, and the GIS User Community'
    });
    // Google Layer
    var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '© Google',
        maxZoom: 20
    });

    // Esri Street Layer
    var esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

// Kartenauswahl definieren
var baseMaps = {
    "OpenStreetMap": osm,
    "OpenTopoMap": topo,
    "EsriStreet": esriStreet,
    "Humanitarian": humanitarianLayer,
    "esriSat": esriSat,
    "googleSat": googleSatellite
};

// Layer-Kontrolle für die Kartenauswahl hinzufügen
L.control.layers(baseMaps).addTo(map);

// Maßstab hinzufügen
L.control.scale({
    metric: true,
    imperial: false,
    position: 'topright'
}).addTo(map);

// Array zum Speichern der Marker und der Linie
var markers = [];

// Linienbreite abhängig vom Gerät
var polylineWeight = isMobile ? 10 : 5; // 10 Pixel auf mobilen Geräten, 5 Pixel auf Desktop
var polyline = L.polyline([], {
    color: 'red',
    weight: polylineWeight,
    interactive: true // Interaktive Polylines erlauben
}).addTo(map);

// Layer für Overpass-Daten
var overpassLayer;

// Kontextmenü des Browsers verhindern
map.getContainer().addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Ereignislistener für Rechtsklick zum Hinzufügen eines Punkts
map.on('contextmenu', function(e) {
    var marker = L.marker(e.latlng, {draggable: true}).addTo(map);
    markers.push(marker);

    // Linie aktualisieren
    updatePolyline();

    // Rechtsklick auf Marker zum Löschen
    marker.on('contextmenu', function() {
        map.removeLayer(marker);
        markers = markers.filter(function(m) { return m !== marker; });
        // Linie aktualisieren
        updatePolyline();
    });

    // Beim Verschieben des Markers die Linie aktualisieren
    marker.on('drag', function() {
        updatePolyline();
    });
});

// Funktion zum Aktualisieren der Polyline
function updatePolyline() {
    var latlngs = markers.map(function(m) { return m.getLatLng(); });
    polyline.setLatLngs(latlngs);
    updateRouteLength();
}

// Dialog-Elemente
var exportDialog = document.getElementById('export-dialog');
var gpxRouteButton = document.getElementById('gpx-route');
var gpxTrackButton = document.getElementById('gpx-track');
var gpxWaypointsButton = document.getElementById('gpx-waypoints');
var xctskExportButton = document.getElementById('xctsk-export');
var exportCancelButton = document.getElementById('export-cancel');

// Berechnen-Button Klick-Event
document.getElementById('calculate-button').addEventListener('click', function() {
    // Overpass-API-Abfrage durchführen
    fetchOverpassData();
});

// Reset-Button Klick-Event
document.getElementById('reset-button').addEventListener('click', function() {
    // Alle Marker entfernen
    markers.forEach(function(marker) {
        map.removeLayer(marker);
    });
    markers = [];

    // Polyline zurücksetzen
    polyline.setLatLngs([]);

    // Overpass-Layer entfernen
    if (overpassLayer) {
        map.removeLayer(overpassLayer);
        overpassLayer = null;
    }

    // Aktualisiere die Routenlänge nach dem Zurücksetzen
    updateRouteLength();
});

// GPX-Button Klick-Event (umbenennen zu Export-Button)
document.getElementById('gpx-button').addEventListener('click', function() {
    if (markers.length === 0) {
        alert('Keine Punkte zum Exportieren vorhanden.');
        return;
    }
    // Dialog anzeigen
    exportDialog.classList.remove('hidden');
});

// GPX-Route-Button Klick-Event
gpxRouteButton.addEventListener('click', function() {
    var gpxData = generateGPX('route');
    downloadGPX(gpxData, 'route.gpx');
    closeExportDialog();
});

// GPX-Track-Button Klick-Event
gpxTrackButton.addEventListener('click', function() {
    var gpxData = generateGPX('track');
    downloadGPX(gpxData, 'track.gpx');
    closeExportDialog();
});

// GPX-Wegpunkte-Button Klick-Event
gpxWaypointsButton.addEventListener('click', function() {
    var gpxData = generateGPX('waypoints');
    downloadGPX(gpxData, 'waypoints.gpx');
    closeExportDialog();
});

// SeeYou-Export-Button Klick-Event

xctskExportButton.addEventListener('click', function() {
    var gpxData = generateXCTask();
    downloadGPX(gpxData, 'xctrack.xctsk');
    closeExportDialog();
});

// Export-Cancel-Button Klick-Event
exportCancelButton.addEventListener('click', function() {
    closeExportDialog();
});

// Funktion zum Schließen des Export-Dialogs
function closeExportDialog() {
    exportDialog.classList.add('hidden');
}

// Funktion zum Generieren des GPX-Inhalts
function generateGPX(type) {
    var gpxHeader = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<gpx version="1.1" creator="Kartenanwendung" xmlns="http://www.topografix.com/GPX/1/1">
`;
    var gpxFooter = `</gpx>`;

    var content = '';

    if (type === 'route') {
        content += '    <rte>\n';
        markers.forEach(function(marker) {
            var latlng = marker.getLatLng();
            content += `        <rtept lat="${latlng.lat}" lon="${latlng.lng}"></rtept>\n`;
        });
        content += '    </rte>\n';
    } else if (type === 'track') {
        content += '    <trk>\n        <trkseg>\n';
        markers.forEach(function(marker) {
            var latlng = marker.getLatLng();
            content += `            <trkpt lat="${latlng.lat}" lon="${latlng.lng}"></trkpt>\n`;
        });
        content += '        </trkseg>\n    </trk>\n';
    } else if (type === 'waypoints') {
        markers.forEach(function(marker, index) {
            var latlng = marker.getLatLng();
            content += `    <wpt lat="${latlng.lat}" lon="${latlng.lng}">\n`;
            content += `        <name>Punkt ${index + 1}</name>\n`;
            content += '    </wpt>\n';
        });
    }

    return gpxHeader + content + gpxFooter;
}

// Funktion zum Generieren des XCTask-Inhalts
function generateXCTask() {
    var task = {
        taskType: "CLASSIC",
        version: 1,
        turnpoints: []
    };

    markers.forEach(function(marker, index) {
        var latlng = marker.getLatLng();
        var turnpoint = {
            radius: 100,
            waypoint: {
                name: `Punkt${(index + 1).toString().padStart(2, '0')}`,
                lat: latlng.lat,
                lon: latlng.lng,
                altSmoothed: 0
            }
        };
        task.turnpoints.push(turnpoint);
    });

    return JSON.stringify(task, null, 2);
}

// Funktion zum Herunterladen der jeweiligen GPX-Datei
function downloadGPX(gpxData, filename) {
    var blob = new Blob([gpxData], {type: 'application/gpx+xml'});
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Funktion zum Abrufen der Overpass-Daten
function fetchOverpassData() {
    // Existierende Overpass-Layer entfernen
    if (overpassLayer) {
        map.removeLayer(overpassLayer);
    }

    // Polyline temporär entfernen
    map.removeLayer(polyline);

    // Bounding Box berechnen
    var bufferDistance; // in Metern
    var latlngs = markers.map(function(m) { return m.getLatLng(); });
    var bufferedArea;

    if (markers.length === 0) {
        var center = map.getCenter();
        bufferDistance = 25000; // 25 km
        bufferedArea = turf.buffer(turf.point([center.lng, center.lat]), bufferDistance, {units: 'meters'});
    } else if (markers.length === 1) {
        bufferDistance = 25000; // 25 km
        bufferedArea = turf.buffer(turf.point([latlngs[0].lng, latlngs[0].lat]), bufferDistance, {units: 'meters'});
    } else {
        bufferDistance = 10000; // 10 km
        var line = turf.lineString(latlngs.map(function(latlng) { return [latlng.lng, latlng.lat]; }));
        bufferedArea = turf.buffer(line, bufferDistance, {units: 'meters'});
    }

    // Bounding Box aus dem gepufferten Gebiet extrahieren
    var bbox = turf.bbox(bufferedArea);

    var minLat = bbox[1];
    var minLng = bbox[0];
    var maxLat = bbox[3];
    var maxLng = bbox[2];

    // Overpass-API-Abfrage erstellen
    var query = `
        [out:json];
        (
          way(${minLat},${minLng},${maxLat},${maxLng})["landuse"~"residential|industrial|commercial|forest|retail|military|railway|cemetery|farmyard|vineyard|orchard"];
          way(${minLat},${minLng},${maxLat},${maxLng})["natural"="wood"];
          way(${minLat},${minLng},${maxLat},${maxLng})["aeroway"="runway"];
          way(${minLat},${minLng},${maxLat},${maxLng})["tourism"="camp_site"];
          relation(${minLat},${minLng},${maxLat},${maxLng})["landuse"~"residential|industrial|commercial|forest|retail|military|railway|cemetery|farmyard|vineyard|orchard"];
          relation(${minLat},${minLng},${maxLat},${maxLng})["natural"="wood"];
          relation(${minLat},${minLng},${maxLat},${maxLng})["tourism"="camp_site"];
          node(${minLat},${minLng},${maxLat},${maxLng})["generator:source"="wind"];
          node(${minLat},${minLng},${maxLat},${maxLng})["man_made"="tower"];
        );
        out body;
        >;
        out skel qt;
    `;

    var url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    // Daten abrufen
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // Daten in GeoJSON umwandeln
            var geojson = osmtogeojson(data);

            // GeoJSON filtern und stilisieren
            var minArea = 300000; // Fläche in Quadratmetern

            overpassLayer = L.geoJSON(geojson, {
                style: function(feature) {
                    // Überprüfe, ob es sich um eine Fläche handelt
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        var landuse = feature.properties.tags && feature.properties.tags.landuse;
                        var tourism = feature.properties.tags && feature.properties.tags.tourism;
                        // Stil für bebaute Flächen (residential, commercial, etc.)
                        if (landuse === "residential" || landuse === "cemetery") {
                            return {color: "#8b5a2b", fillOpacity: 0.5}; // Dunkelbraun für besiedelte Gebiete
                        }
                        // Stil für bebaute kommerzielle Flächen (industrial, commercial, etc.)
                        if (landuse === "industrial" || landuse === "commercial" || landuse === "retail" || landuse === "farmyard" || landuse === "military") {
                            return {color: "#cd853f", fillOpacity: 0.5}; // Helleres Dunkelbraun für kommerzielle Gebiete
                        }
                        // Stil für Weinbau und Obstplantagen
                        if (landuse === "orchard"|| landuse === "vineyard") {
                            return {color: "#008B8B", fillOpacity: 0.5};
                        }
                        // Stil für Campingplätze
                        if (tourism === "camp_site") {
                            return {color: "#8b5a2b", fillOpacity: 0.5};
                        }
                        // Stil für alle anderen Flächen (z.B. Wälder)
                        return {color: "#698b69", fillOpacity: 0.5};
                    }
                    // Start- und Landebahnen als lilafarbene dicke Linien anzeigen
                    if (feature.properties.tags && feature.properties.tags.aeroway === "runway") {
                        return {color: "#8A2BE2", weight: 7}; // Lila Farbe, 7 Pixel dick
                    }
                    // Keine Stile für Punkte wie Windräder und Türme anwenden
                    return null;
                },
                filter: function(feature) {
                    var landuse = feature.properties.tags && feature.properties.tags.landuse;
                    var tourism = feature.properties.tags && feature.properties.tags.tourism;
                    var featureType = feature.geometry.type;
                    
                    // Überprüfen, ob das Feature eine Fläche ist
                    var isArea = featureType === "Polygon" || featureType === "MultiPolygon";

                    // Liste der Landuse-Typen, bei denen minArea nicht angewendet wird
                    var alwaysShowTypes = [
                        "residential",
                        "industrial",
                        "commercial",
                        "retail",
                        "cemetery",
                        "farmyard",
                        "orchard",
                        "vineyard"
                    ];

                    // Wenn es sich um eine Fläche handelt und der Landuse-Typ nicht in der Liste ist, minArea anwenden
                    if (isArea && !alwaysShowTypes.includes(landuse) && tourism !== "camp_site") {
                        var area = turf.area(feature); // Fläche in Quadratmetern
                        return area > minArea; // Nur darstellen, wenn die Fläche größer als minArea ist
                    }

                    // Ansonsten das Feature anzeigen
                    return true;
                },
                pointToLayer: function(feature, latlng) {
                    var type = feature.properties.tags && feature.properties.tags["generator:source"];
                    var manMade = feature.properties.tags && feature.properties.tags["man_made"];
                    // Windräder und Türme als kleine rote Kreise anzeigen
                    if (type === "wind" || manMade === "tower") {
                        return L.circleMarker(latlng, {
                            radius: 5, // Größe des Kreises in Metern
                            color: "red", // Roter Rand
                            fillColor: "red", // Rote Füllung
                            fillOpacity: 0.5,
                            weight: 1
                        });
                    }
                }
            }).addTo(map);

            // Polyline wieder hinzufügen, damit sie über dem Overpass-Layer liegt
            polyline.addTo(map);
        })
        .catch(function(error) {
            console.error('Fehler bei der Overpass-API-Abfrage:', error);
            // Bei einem Fehler die Polyline trotzdem wieder hinzufügen
            polyline.addTo(map);
        });
}

// Hinzufügen des Ereignislisteners für Desktop und Mobilgeräte
polyline.on('click', onPolylineClick);
polyline.on('touchstart', onPolylineClick);

// Ereignislistener für Klicks auf die Polyline zum Hinzufügen neuer Punkte
function onPolylineClick(e) {
    // Neuen Marker an der Klickposition hinzufügen
    var marker = L.marker(e.latlng, { draggable: true }).addTo(map);

    // Marker in die Liste einfügen
    markers.push(marker);

    // Ereignislistener zum Marker hinzufügen
    addMarkerEventListeners(marker);

    // Marker entlang der Polyline sortieren
    sortMarkersAlongPolyline();

    // Polyline aktualisieren
    updatePolyline();
}

// Funktion zum Hinzufügen von Ereignislistenern zu einem Marker
function addMarkerEventListeners(marker) {
    // Rechtsklick auf Marker zum Löschen
    marker.on('contextmenu', function() {
        map.removeLayer(marker);
        markers = markers.filter(function(m) { return m !== marker; });
        // Polyline aktualisieren
        updatePolyline();
    });

    // Beim Verschieben des Markers die Polyline aktualisieren
    marker.on('drag', function() {
        updatePolyline();
    });
}

// Vorhandene Marker aktualisieren, um die Ereignislistener hinzuzufügen
markers.forEach(function(marker) {
    addMarkerEventListeners(marker);
});

// Funktion zum Sortieren der Marker entlang der Polyline
function sortMarkersAlongPolyline() {
    var latlngs = polyline.getLatLngs();

    // Liste der Marker mit ihren Positionen entlang der Polyline
    var markerPositions = markers.map(function(marker) {
        var latlng = marker.getLatLng();
        var closestPoint = L.GeometryUtil.closest(map, polyline, latlng);
        var distance = L.GeometryUtil.length(L.polyline([polyline.getLatLngs()[0], closestPoint]));
        return {
            marker: marker,
            distance: distance
        };
    });

    // Marker nach ihrer Position entlang der Polyline sortieren
    markerPositions.sort(function(a, b) {
        return a.distance - b.distance;
    });

    // Aktualisierte Marker-Liste
    markers = markerPositions.map(function(item) {
        return item.marker;
    });
}

// Funktion zur Berechnung der Routenlänge
function updateRouteLength() {
    var totalLength = 0;
    var latlngs = polyline.getLatLngs();
    
    for (var i = 1; i < latlngs.length; i++) {
        totalLength += latlngs[i-1].distanceTo(latlngs[i]);
    }
    
    var lengthInKm = (totalLength / 1000).toFixed(1);
    document.getElementById('route-length').innerHTML = lengthInKm + ' km';
}

// Initialisiere die Routenlänge beim Laden der Seite
updateRouteLength();
