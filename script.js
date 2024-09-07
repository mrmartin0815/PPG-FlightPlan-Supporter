document.getElementById('calculate-route').addEventListener('click', async () => {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) {
        alert('Bitte geben Sie sowohl den Start- als auch den Endpunkt ein.');
        return;
    }

    const [startLat, startLon] = start.split(',').map(Number);
    const [endLat, endLon] = end.split(',').map(Number);

    // Rufe bebautes Gebiet und Wälder entlang der Route ab
    const avoidanceAreas = await fetchOverpassData(startLat, startLon, endLat, endLon);

    // Berechne die Route, die diese Gebiete vermeidet
    const route = calculateRouteWithAvoidance(startLat, startLon, endLat, endLon, avoidanceAreas);

    // Route auf der Karte anzeigen und Polygone visualisieren
    displayRouteOnMap(route, avoidanceAreas); 

    enableDownload(route);
});


// Abrufen von bebauten Gebieten und Wäldern entlang der Route
async function fetchOverpassData(startLat, startLon, endLat, endLon) {
    const bbox = `${Math.min(startLat, endLat) - 0.05},${Math.min(startLon, endLon) - 0.05},${Math.max(startLat, endLat) + 0.05},${Math.max(startLon, endLon) + 0.05}`;

	const query = `
		[out:json];
		(
		way["landuse"="residential"](${bbox});
		way["natural"="wood"](${bbox});     // Waldgebiete
		way["landuse"="forest"](${bbox});   // Waldnutzung
		relation["natural"="wood"](${bbox});  // Große Waldgebiete, die als Relation gespeichert sind
		relation["landuse"="forest"](${bbox}); // Große Waldnutzung als Relation
		);
		out body;
		>;
		out skel qt;
	`;


    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

    if (response.ok) {
        const data = await response.json();
        console.log('Overpass API Daten:', data);
        return extractPolygonsFromOverpassData(data); // Gib die Polygone zurück
    } else {
        console.error('Overpass API Fehler:', response.statusText);
        return null;
    }
}



// Berechne die Route, die bebaute Gebiete und Wälder vermeidet
function calculateRouteWithAvoidance(startLat, startLon, endLat, endLon, avoidanceAreas) {
    const coordinates = [
        { lat: startLat, lon: startLon },
        { lat: endLat, lon: endLon }
    ];

    // Route anpassen, um die bebaute Gebiete und Wälder zu vermeiden
    const adjustedRoute = avoidAreas(coordinates, avoidanceAreas);

    console.log('Berechnete und angepasste Route:', adjustedRoute);
    return { coordinates: adjustedRoute };
}


// Diese Funktion überprüft, ob Punkte in bebauten Gebieten liegen und passt die Route an
function avoidAreas(coordinates, avoidanceAreas) {
    const adjustedRoute = [];

    coordinates.forEach(coord => {
        let avoid = false;

        // Überprüfe für jedes Polygon, ob die Koordinate innerhalb des Gebiets liegt
        avoidanceAreas.forEach((polygon, index) => {
            if (isPointInPolygon([coord.lat, coord.lon], polygon)) {
                console.log(`Koordinate (${coord.lat}, ${coord.lon}) liegt in Gebiet ${index}`);
                avoid = true;
            }
        });

        // Falls die Koordinate in einem verbotenen Gebiet liegt, weiche ab
        if (avoid) {
            console.log(`Koordinate in verbotenem Gebiet. Anpassung notwendig für: ${coord.lat}, ${coord.lon}`);

            // Beispiel: Verschiebe die Koordinate leicht, um das Gebiet zu umgehen
            adjustedRoute.push({
                lat: coord.lat + 0.01, // Anpassung: kleine Abweichung
                lon: coord.lon + 0.01
            });
        } else {
            adjustedRoute.push(coord); // Wenn kein Hindernis vorliegt, nutze die ursprüngliche Koordinate
        }
    });

    return adjustedRoute;
}




// Prüft, ob ein Punkt innerhalb eines Polygons liegt (Ray-Casting-Algorithmus)
function isPointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;

    console.log('Überprüfe Punkt:', point, 'gegen Polygon:', polygon);

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = ((yi > y) !== (yj > y)) && 
                          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    console.log(`Punkt (${x}, ${y}) liegt ${inside ? 'innerhalb' : 'außerhalb'} des Polygons`);
    
    return inside;
}





// Extrahiere Polygone (Gebiete) aus den Overpass-Daten
function extractPolygonsFromOverpassData(data) {
    const nodes = {};
    const polygons = [];

    // Erstelle ein Dictionary aller nodes mit ihren Koordinaten
    data.elements.forEach(element => {
        if (element.type === 'node') {
            nodes[element.id] = [element.lat, element.lon];
        }
    });

    // Erstelle Polygone aus den way- und relation-Elementen
    data.elements.forEach(element => {
        if (element.type === 'way' && element.nodes) {
            const polygon = element.nodes.map(nodeId => nodes[nodeId]);
            if (polygon.length > 0) {
                polygons.push(polygon);
            }
        }

        // Verarbeite Relationen (Multipolygone) und prüfe, ob members und nodes existieren
        if (element.type === 'relation' && element.members) {
            element.members.forEach(member => {
			if (member.type === 'way' && member.role === 'outer') {
				if (!member.nodes) {
					console.error(`Keine Nodes in Relation: ${member.type}, Role: ${member.role}`);
				} else {
					const polygon = member.nodes.map(nodeId => nodes[nodeId]);
					if (polygon.length > 0) {
						polygons.push(polygon);
						}
					}
				}
			});

        }
    });

    console.log('Extrahierte Polygone (Gebiete):', polygons);
    return polygons;
}





const map = L.map('map').setView([52.52, 13.405], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

let routeLayer;



function displayRouteOnMap(route, polygons = []) {
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    const latlngs = route.coordinates.map(coord => [coord.lat, coord.lon]);
    routeLayer = L.polyline(latlngs, { color: 'blue' }).addTo(map);
    map.fitBounds(routeLayer.getBounds());

    // Polygone auf der Karte darstellen
    polygons.forEach(polygon => {
        const polygonLatLngs = polygon.map(coord => [coord[0], coord[1]]);
        L.polygon(polygonLatLngs, { color: 'red' }).addTo(map); // Polygone in rot darstellen
    });
}





function enableDownload(route) {
    const gpxData = generateGPX(route);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);

    const downloadButton = document.getElementById('download-gpx');
    downloadButton.href = url;
    downloadButton.download = 'route.gpx';
    downloadButton.style.display = 'block';
}

function generateGPX(route) {
    let gpx = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
    <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Flugrouten-Planer">
        <trk><name>Berechnete Route</name><trkseg>`;
    
    route.coordinates.forEach(coord => {
        gpx += `<trkpt lat="${coord.lat}" lon="${coord.lon}"></trkpt>`;
    });

    gpx += `</trkseg></trk></gpx>`;
    return gpx;
}
