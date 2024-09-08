// Initialisiere die Karte mit einem Defaultpunkt und Zoomlevel
var map = L.map('map').setView([48.534273854587, 9.443447047669531], 14);

// Definiere verschiedene Kartenlayer
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.opentopomap.org/copyright">OpenTopoMap</a> contributors'
});

// Humanitarian Layer
var humanitarianLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of Humanitarian OpenStreetMap Team'
});

var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '© Google',
    maxZoom: 20
});

// Füge den Standard-OSM-Layer zur Karte hinzu
osmLayer.addTo(map);

// Definiere die Layer-Kontrollfunktion
var baseMaps = {
    "OpenStreetMap Standard": osmLayer,
    "Humanitarian": humanitarianLayer,
    "Topoansicht": topoLayer,
    "googleSatellite": googleSatellite
};

// Füge die Layer-Kontrolle zur Karte hinzu
L.control.layers(baseMaps).addTo(map);

// Mindestfläche in Quadratmetern, unter der Flächen nicht angezeigt werden
var minArea = 250000;

// Variablen für die Marker und Linie
var startMarker, endMarker, routeLine;

// Funktion, um eine Bounding Box basierend auf den Koordinaten und einem erweiterten Radius zu berechnen
function getBoundingBoxForRoute(startLat, startLng, endLat, endLng, radius) {
    var bufferLat = radius / 111; // Umrechnung von km in Breitengrad
    var bufferLng = radius / (111 * Math.cos(startLat * Math.PI / 180)); // Umrechnung von km in Längengrad

    var minLat = Math.min(startLat, endLat) - bufferLat;
    var maxLat = Math.max(startLat, endLat) + bufferLat;
    var minLng = Math.min(startLng, endLng) - bufferLng;
    var maxLng = Math.max(startLng, endLng) + bufferLng;

    return {minLat, minLng, maxLat, maxLng};
}

// Funktion, um die Route (blaue Linie) und die Marker (Start: rot, Ende: grün) darzustellen
function setRouteAndMarkers(startLat, startLng, endLat, endLng) {
    // Falls Marker und Linie existieren, entferne sie
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routeLine) map.removeLayer(routeLine);

    // Setze den roten Marker für den Startpunkt
    startMarker = L.circleMarker([startLat, startLng], {
        color: "#ff0000",
        radius: 8,
        fillColor: "#ff0000",
        fillOpacity: 1
    }).addTo(map);

    // Setze den grünen Marker für den Endpunkt
    endMarker = L.circleMarker([endLat, endLng], {
        color: "#00ff00",
        radius: 8,
        fillColor: "#00ff00",
        fillOpacity: 1
    }).addTo(map);

    // Zeichne die blaue Linie zwischen Start- und Endpunkt
    routeLine = L.polyline([[startLat, startLng], [endLat, endLng]], {
        color: 'blue',
        weight: 3
    }).addTo(map);
}

// Funktion, um die Start- oder Endkoordinaten zu setzen und die Marker zu aktualisieren
function setCoordinate(type, lat, lng) {
    if (type === 'start') {
        document.getElementById('start-coordinates').value = lat + ', ' + lng;
        if (endMarker) {
            setRouteAndMarkers(lat, lng, endMarker.getLatLng().lat, endMarker.getLatLng().lng);
        } else {
            startMarker = L.circleMarker([lat, lng], {color: "red", radius: 8}).addTo(map);
        }
    } else if (type === 'end') {
        document.getElementById('end-coordinates').value = lat + ', ' + lng;
        if (startMarker) {
            setRouteAndMarkers(startMarker.getLatLng().lat, startMarker.getLatLng().lng, lat, lng);
        } else {
            endMarker = L.circleMarker([lat, lng], {color: "green", radius: 8}).addTo(map);
        }
    }
}

// Rechtsklick-Event, um ein Popup-Menü anzuzeigen
map.on('contextmenu', function(e) {
    // Erstelle das Popup-Menü
    var popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(`
            <div>
                <button id="set-start">Als Startpunkt festlegen</button><br>
                <button id="set-end">Als Endpunkt festlegen</button>
            </div>
        `)
        .openOn(map);

    // Event-Listener für "Als Startpunkt festlegen"
    document.getElementById('set-start').addEventListener('click', function() {
        setCoordinate('start', e.latlng.lat, e.latlng.lng);
        map.closePopup();
    });

    // Event-Listener für "Als Endpunkt festlegen"
    document.getElementById('set-end').addEventListener('click', function() {
        setCoordinate('end', e.latlng.lat, e.latlng.lng);
        map.closePopup();
    });
});

// Funktion, um bebautes/bewaldetes Gebiet im Umkreis von 10 km um die Route zu finden
function findUnbebauteFlaechen(startLat, startLng, endLat, endLng) {
    var bbox = getBoundingBoxForRoute(startLat, startLng, endLat, endLng, 10);

    var query = `
    [out:json];
    (
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="residential"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="industrial"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="commercial"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="forest"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["natural"="wood"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="retail"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="military"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="railway"];
      way(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="cemetery"];
      
      // Windräder und Türme (als Punkte)
      node(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["generator:source"="wind"];
      node(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["man_made"="tower"];
      
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="residential"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="industrial"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="commercial"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="forest"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["natural"="wood"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="retail"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="military"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="railway"];
      relation(${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng})["landuse"="cemetery"];
    );
    out body;
    >;
    out skel qt;
    `;

    var url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var geojson = osmtogeojson(data); // OSM-Daten in GeoJSON umwandeln

            // Filtere kleine Flächen heraus und style die GeoJSON-Features
            var filteredGeojson = L.geoJSON(geojson, {
                style: function(feature) {
                    // Überprüfe, ob es sich um eine Fläche handelt
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        var landuse = feature.properties.tags && feature.properties.tags.landuse;
                        if (landuse === "residential" || landuse === "industrial" || landuse === "commercial" || landuse === "retail"  || landuse === "cemetery") {
                            return {color: "#8B4513", fillOpacity: 0.5}; // Dunkelbraun für besiedelte Gebiete
                        }
                        return {color: "#808080", fillOpacity: 0.5}; // Grau für alle anderen Flächen
                    }
                    // Keine Stile für Punkte wie Windräder und Türme anwenden
                    return null;
                },
                filter: function(feature) {
                    var landuse = feature.properties.tags && feature.properties.tags.landuse;
                    // MinArea nur auf nicht besiedelte Flächen anwenden
                    if (landuse !== "residential" && landuse !== "industrial" && landuse !== "commercial" && landuse !== "retail" && landuse !== "cemetery") {
                        if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                            var area = turf.area(feature); // Fläche in Quadratmetern
                            return area > minArea; // Nur darstellen, wenn die Fläche größer als minArea ist
                        }
                    }
                    // Besiedelte Flächen immer anzeigen
                    return true;
                },
                pointToLayer: function(feature, latlng) {
                    var type = feature.properties.tags && feature.properties.tags["generator:source"];
                    var manMade = feature.properties.tags && feature.properties.tags["man_made"];
                    // Windräder und Türme als kleine rote Kreise anzeigen
                    if (type === "wind" || manMade === "tower") {
                        return L.circleMarker(latlng, {
                            radius: 5, // Größe des Kreises
                            color: "red", // Roter Rand
                            fillColor: "red", // Rote Füllung
                            fillOpacity: 0.5,
                            weight: 1
                        });
                    }
                }
            });

            // Füge das gefilterte Layer zur Karte hinzu
            map.addLayer(filteredGeojson);
        })
        .catch(err => console.log("Fehler bei der Abfrage: ", err));
}

// Button-Event für Berechnung
document.getElementById('search').addEventListener('click', function() {
    var startCoordinates = document.getElementById('start-coordinates').value.split(',');
    var endCoordinates = document.getElementById('end-coordinates').value.split(',');

    var startLat = parseFloat(startCoordinates[0]);
    var startLng = parseFloat(startCoordinates[1]);
    var endLat = parseFloat(endCoordinates[0]);
    var endLng = parseFloat(endCoordinates[1]);

    // Berechne die bebauten/bewaldeten Flächen im Umkreis von 10 km um die Route
    findUnbebauteFlaechen(startLat, startLng, endLat, endLng);
});
