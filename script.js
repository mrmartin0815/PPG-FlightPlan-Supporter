// Initialisiere die Karte mit einem Defaultpunkt und Zoomlevel
var map = L.map('map').setView([48.534273854587, 9.443447047669531], 10);

// OpenStreetMap Layer hinzufügen
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Variablen für die Marker und Linie
var startMarker, endMarker, routeLine;

// Mindestfläche in Quadratmetern, unter der Flächen nicht angezeigt werden
var minArea = 250000; 

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

            // Filtere kleine Flächen heraus
            var filteredGeojson = L.geoJSON(geojson, {
                style: function(feature) {
                    // Überprüfen, ob es sich um ein besiedeltes/bebautes Gebiet handelt
                    var landuse = feature.properties.tags && feature.properties.tags.landuse;
                    if (landuse === "residential" || landuse === "industrial" || landuse === "commercial" || landuse === "retail") {
                        return {color: "#8B4513", fillOpacity: 0.5}; // Dunkelbraun für besiedelte Gebiete
                    }
                    return {color: "#808080", fillOpacity: 0.5}; // Grau für alle anderen Flächen
                },
                filter: function(feature) {
                    // Berechne die Fläche für Polygone (nur für Flächengeometrien)
                    if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
                        // Berechne die Fläche mit Turf.js
                        var area = turf.area(feature); // Fläche in Quadratmetern
                        return area > minArea; // Nur darstellen, wenn die Fläche größer als minArea ist
                    }
                    return true; // Alle anderen Geometrien (Linien, Punkte) werden nicht gefiltert
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

    // Setze Marker und Linie auf der Karte
    setRouteAndMarkers(startLat, startLng, endLat, endLng);

    // Berechne die bebauten/bewaldeten Flächen im Umkreis von 10 km um die Route
    findUnbebauteFlaechen(startLat, startLng, endLat, endLng);
});
