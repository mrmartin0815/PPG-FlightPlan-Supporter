// Karte initialisieren
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); // Überprüfung, ob das Gerät ein Mobilgerät ist
var initialZoom = isMobile ? 14 : 13; // Höheres Zoom-Level auf mobilen Geräten
var map = L.map('map').setView([48.53484850819166, 9.441566000254877], initialZoom); // Karte initialisieren und setzen

// Kartenlayerdefinitionen
    // Basislayer (Verwendung des OSM.de-Servers zur Vermeidung von 403-Sperren bei lokalen Dateien/ohne Referrer)
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
        attribution: 'Kartendaten: © OpenStreetMap-Mitwirkende | Kartendarstellung: © OpenStreetMap Deutschland',
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
    position: 'topleft'
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

// Hilfsfunktion zur Anzeige von Status-Meldungen
function showStatus(message, isError, timeoutMs) {
    var statusEl = document.getElementById('status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = isError ? 'error' : 'success';
    
    if (timeoutMs) {
        setTimeout(function() {
            if (statusEl.textContent === message) {
                statusEl.className = 'hidden';
            }
        }, timeoutMs);
    }
}

// Funktion zum Abrufen der Overpass-Daten
function fetchOverpassData() {
    var calculateBtn = document.getElementById('calculate-button');
    if (calculateBtn) {
        calculateBtn.disabled = true;
        calculateBtn.textContent = 'Lädt...';
    }

    // Existierende Overpass-Layer entfernen
    if (overpassLayer) {
        map.removeLayer(overpassLayer);
    }

    // Bounding Box berechnen
    var bufferDistance; // in Metern
    var latlngs = markers.map(function(m) { return m.getLatLng(); });
    var bufferedArea;

    if (markers.length === 0) { // Keine Marker vorhanden
        var center = map.getCenter();
        bufferDistance = 3000; // 3 km Puffer um Kartenzentrum
        bufferedArea = turf.buffer(turf.point([center.lng, center.lat]), bufferDistance, {units: 'meters'});
    } else if (markers.length === 1) { // Ein Marker vorhanden
        bufferDistance = 4000; // 4 km Puffer um den Marker
        bufferedArea = turf.buffer(turf.point([latlngs[0].lng, latlngs[0].lat]), bufferDistance, {units: 'meters'});
    } else { // Mehrere Marker vorhanden
        bufferDistance = 3000; // 3 km Korridor entlang der Flugroute
        var line = turf.lineString(latlngs.map(function(latlng) { return [latlng.lng, latlng.lat]; }));
        bufferedArea = turf.buffer(line, bufferDistance, {units: 'meters'});
    }

    // Bounding Box aus dem gepufferten Gebiet extrahieren
    var bbox = turf.bbox(bufferedArea);

    var minLat = bbox[1];
    var minLng = bbox[0];
    var maxLat = bbox[3];
    var maxLng = bbox[2];

    // Overpass-API-Abfrage erstellen (inkl. Relationen für Multipolygone wie Wälder und Wohngebiete).
    // Globale bbox + "out geom" liefert die Geometrie direkt mit, statt alle Knoten einzeln
    // per ">; out skel" nachzuladen – deutlich weniger Last für die (oft überlasteten) Server.
    var query = `[out:json][timeout:60][bbox:${minLat},${minLng},${maxLat},${maxLng}];
(
  wr["landuse"~"^(residential|industrial|commercial|forest|retail|military|railway|cemetery|farmyard|vineyard|orchard)$"];
  wr["natural"="wood"];
  way["aeroway"="runway"];
  wr["tourism"="camp_site"];
  node["generator:source"="wind"];
  node["man_made"="tower"];
);
out geom qt;`;

    // Overpass-API-Server für Redundanz/Fallback
    var endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://z.overpass-api.de/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter'
    ];
    var requestTimeoutMs = 75000; // Überlastete Server brauchen aktuell oft 30-45s
    var maxRounds = 2;            // Alle Server bis zu zweimal durchprobieren
    var startTime = Date.now();

    showStatus('Overpass-Daten werden geladen...', false, 0);

    // Laufende Sekundenanzeige, damit klar ist, dass noch geladen wird
    var statusText = '';
    var elapsedTimer = setInterval(function() {
        showStatus(statusText + ' – ' + Math.round((Date.now() - startTime) / 1000) + ' s', false, 0);
    }, 1000);

    // Newlines entfernen, um Apache 406-Fehler zu vermeiden
    var cleanQuery = query.replace(/[\r\n]+/g, '').trim();

    function wait(ms) {
        return new Promise(function(resolve) { setTimeout(resolve, ms); });
    }

    // Versucht nacheinander alle Endpoints; nach einer erfolglosen Runde wird kurz gewartet (Backoff)
    function fetchFromEndpoint(index, round) {
        if (index >= endpoints.length) {
            if (round + 1 >= maxRounds) {
                return Promise.reject(new Error('Kein Overpass-API-Server erreichbar. Bitte prüfen Sie Ihre Internetverbindung.'));
            }
            statusText = 'Alle Server ausgelastet, neuer Versuch gleich';
            return wait(5000 * (round + 1)).then(function() {
                return fetchFromEndpoint(0, round + 1);
            });
        }

        var currentUrl = endpoints[index];
        statusText = 'Lade Geländedaten (Server ' + (index + 1) + '/' + endpoints.length +
            (round > 0 ? ', Versuch ' + (round + 1) : '') + ')';

        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, requestTimeoutMs);

        return fetch(currentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'data=' + encodeURIComponent(cleanQuery),
            signal: controller.signal
        }).then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.json();
        }).then(function(data) {
            clearTimeout(timeoutId);
            // Overpass liefert bei Abbruch (Timeout/Speicher) Status 200 mit "remark" und unvollständigen Daten
            if (data.remark && /runtime error|timed out|out of memory/i.test(data.remark)) {
                throw new Error('Unvollständige Antwort: ' + data.remark);
            }
            return data;
        }).catch(function(err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.warn('Overpass Endpoint ' + currentUrl + ' hat nach ' + (requestTimeoutMs / 1000) + 's nicht geantwortet (Timeout), versuche nächsten...');
            } else {
                // Hinweis: Überlastete Server (429/502/504) senden keinen CORS-Header -> erscheint als "Failed to fetch"
                console.warn('Fehler bei Overpass Endpoint ' + currentUrl + ':', err.message || err);
            }
            return fetchFromEndpoint(index + 1, round);
        });
    }

    // Daten abrufen
    fetchFromEndpoint(0, 0)
        .finally(function() {
            clearInterval(elapsedTimer);
        })
        .then(function(data) {
            // Daten in GeoJSON umwandeln
            var geojson = osmtogeojson(data);
            // GeoJSON filtern und stilisieren
            // Overpass-Layer erstellen und stylen
            overpassLayer = L.geoJSON(geojson, {
                style: function(feature) {
                    // Überprüfe, ob es sich um eine Fläche handelt
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        var landuse = feature.properties.tags && feature.properties.tags.landuse;
                        var tourism = feature.properties.tags && feature.properties.tags.tourism;
                        // Stil für bebaute bewohnte Flächen (residential, commercial, etc.)
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
                // Filter für die Anzeige der Flächen
                filter: function(feature) {
                    var minAreaBig = 300000; // Mindestfläche für sonstige Flächen in qm
                    var minAreaSmall = 15000; // Mindestfläche für Siedlungen, Gewerbe etc. in qm (1,5 ha)
                    var minAreaForest = 20000; // Mindestfläche für Waldflächen in qm (2 ha)
                    var landuse = feature.properties.tags && feature.properties.tags.landuse;
                    var natural = feature.properties.tags && feature.properties.tags.natural;
                    var tourism = feature.properties.tags && feature.properties.tags.tourism;
                    var featureType = feature.geometry.type;
                    // Überprüfen, ob das Feature eine Fläche ist (Boolean)
                    var isArea = featureType === "Polygon" || featureType === "MultiPolygon";
                    // Wenn es keine Fläche ist, Feature anzeigen
                    if (!isArea) {
                        return true;
                    }
                    // Ansonsten, wenn es eine Fläche ist:
                    if (isArea) {
                        var area = turf.area(feature); // Fläche in Quadratmetern ermitteln

                        // Waldflächen (landuse=forest oder natural=wood) ab minAreaForest anzeigen
                        var isForest = landuse === "forest" || natural === "wood";
                        if (isForest) {
                            return area > minAreaForest;
                        }

                        // Liste der Landuse-Typen, die ab minAreaSmall angezeigt werden
                        var showTypeSmall = [
                            "residential",
                            "industrial", 
                            "commercial",
                            "retail",
                            "cemetery",
                            "farmyard",
                            "orchard",
                            "vineyard"
                        ];
                        // Wenn Landuse in showTypeSmall oder tourism=camp_site, dann minAreaSmall verwenden
                        if (showTypeSmall.includes(landuse) || tourism === "camp_site") {
                            return area > minAreaSmall;
                        }
                        return area > minAreaBig; // Für alle anderen Flächen minAreaBig verwenden
                    }
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

            // Route nach vorne holen, damit sie über dem Overpass-Layer liegt
            polyline.bringToFront();

            var count = data && data.elements ? data.elements.length : 0;
            showStatus('Geländedaten geladen (' + count + ' Objekte)!', false, 4000);
        })
        .catch(function(error) {
            console.error('Fehler bei der Overpass-API-Abfrage:', error);
            showStatus('Fehler: Overpass-Server nicht erreichbar. Bitte später erneut versuchen.', true, 6000);
        })
        .finally(function() {
            if (calculateBtn) {
                calculateBtn.disabled = false;
                calculateBtn.textContent = 'Berechnen';
            }
        });
}

// Ereignislistener für Desktop und Mobilgeräte (ein Tippen löst auf Touch-Geräten ebenfalls "click" aus;
// "touchstart" würde schon beim Verschieben der Karte über der Linie einen Punkt setzen)
polyline.on('click', onPolylineClick);

// Ereignislistener für Klicks auf die Polyline zum Hinzufügen neuer Punkte
function onPolylineClick(e) {
    // Neuen Marker an der Klickposition hinzufügen
    var marker = L.marker(e.latlng, { draggable: true }).addTo(map);

    // Marker direkt hinter dem Startpunkt des angeklickten Segments einfügen
    var segIndex = findNearestSegmentIndex(e.latlng);
    markers.splice(segIndex + 1, 0, marker);

    // Ereignislistener zum Marker hinzufügen
    addMarkerEventListeners(marker);

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

// Index des Routensegments (Marker i -> i+1), das dem Punkt am nächsten liegt.
// Gerechnet wird in Bildschirm-Pixeln, damit Längen- und Breitengrade gleich gewichtet sind.
function findNearestSegmentIndex(latlng) {
    var p = map.latLngToLayerPoint(latlng);
    var bestSegIndex = 0;
    var bestDist = Infinity;

    for (var i = 0; i < markers.length - 1; i++) {
        var a = map.latLngToLayerPoint(markers[i].getLatLng());
        var b = map.latLngToLayerPoint(markers[i + 1].getLatLng());
        var dist = L.LineUtil.pointToSegmentDistance(p, a, b);
        if (dist < bestDist) {
            bestDist = dist;
            bestSegIndex = i;
        }
    }

    return bestSegIndex;
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
