# PPG FlightPlanHelper 🪂✈️

**PPG FlightPlanHelper** ist ein leichtgewichtiges, browserbasiertes Web-Tool zur Flugplanung und Terrainanalyse für Motorschirmflieger (Paramotor / PPG) und Leichtflugzeuge. Es ermöglicht das schnelle Zeichnen von Flugrouten, die Analyse von Flugkorridoren hinsichtlich Gefahrenstellen und Notlandeflächen sowie den einfachen Export in gängige Navigations- und Fluginstrument-Formate.

---

## 🌟 Hauptfunktionen

* **Interaktive Routenplanung:**
  * **Wegpunkte setzen:** Per Rechtsklick (bzw. Touch) Punkte direkt auf der Karte erstellen.
  * **Wegpunkte anpassen:** Punkte beliebig per Drag & Drop verschieben oder per Rechtsklick auf den Marker löschen.
  * **Zwischenpunkte einfügen:** Klick auf ein bestehendes Routensegment fügt automatisch einen neuen Wegpunkt an der richtigen Position entlang der Route ein.
  * **Echtzeit-Distanzberechnung:** Automatische Anzeige der Gesamtlänge der Flugroute in Kilometern (`km`).

* **Umgebungs- & Gefahrenanalyse (via Overpass API):**
  * Klick auf **"Berechnen"** analysiert den Korridor entlang der Route (oder im Umkreis) auf Hindernisse und Bodennutzung und zeigt diese auf der Karte an:
    * **Gefahren & Hindernisse:** Windkraftanlagen und Türme/Masten (als rote Warnmarker).
    * **Flugplätze:** Start- und Landebahnen (purple hervorgehoben).
    * **Bebauung & Flächen:** Besiedelte Gebiete, Industrie-/Gewerbezonen, Obstplantagen/Weinberge, Wälder und Campingplätze.

* **Vielseitige Kartenstile (Base Maps):**
  * **OpenStreetMap (DE)** – Standard-Straßen- und Landkarte.
  * **OpenTopoMap** – Topografische Karte mit Höhenlinien und Relief.
  * **ESRI Satellite & Google Satellite** – Hochauflösende Satellitenbilder zur visuellen Terrainbeurteilung.
  * **ESRI World Street Map** & **Humanitarian OSM Layer**.

* **Export-Funktionen:**
  * **GPX Route** (`.gpx` mit `<rte>`) – Für klassischen Import in Navigationsgeräte.
  * **GPX Track** (`.gpx` mit `<trk>`) – Pfad für Track-Anzeigen.
  * **GPX Wegpunkte** (`.gpx` mit `<wpt>`) – Einzelne Wegpunkte für GPS-Geräte.
  * **XCTrack Task** (`.xctsk`) – Aufgaben-Export direkt kompatibel mit **XCTrack** (inkl. Turnpoint-Radien).

* **Mobile- & Desktop-Optimiert:**
  * Vollständig responsive Benutzeroberfläche mit angepasster Touch-Bedienung und vergrößerten Interaktionsflächen für Smartphones und Tablets.

---

## 🚀 Schnellstart & Nutzung

Es ist keine Installation oder ein Backend-Server erforderlich. Das Tool läuft vollständig lokal im Webbrowser (Client-Side HTML/JS).

1. Repository klonen oder als ZIP herunterladen:
   ```bash
   git clone https://github.com/Ihr-Nutzername/PPG-FlightPlanHelper.git
   ```
2. Öffne die Datei [`index.html`](file:///d:/Cloud/Dropbox/Repo/PPG-FlightPlanHelper/index.html) in einem beliebigen modernen Browser (Chrome, Firefox, Safari, Edge).
3. Alternativ kann die Seite direkt über **GitHub Pages** gehostet und genutzt werden.

---

## 🕹️ Bedienung

| Aktion | Durchführung |
| :--- | :--- |
| **Neuen Punkt setzen** | **Rechtsklick** auf freie Stelle der Karte |
| **Zwischenpunkt hinzufügen** | Linksklick / Touch auf eine bestehende **Routenlinie** |
| **Punkt verschieben** | Marker anklicken / gedrückt halten und **ziehen** |
| **Punkt löschen** | **Rechtsklick** auf den zu löschenden Marker |
| **Route analysieren** | Klick auf Button **"Berechnen"** |
| **Route exportieren** | Klick auf Button **"GPX"** → Format wählen (Route, Track, Wegpunkte, XCTrack) |
| **Route zurücksetzen** | Klick auf Button **"Reset"** |

---

## 🛠️ Verwendete Technologien & Bibliotheken

* **HTML5 / CSS3 / JavaScript (ES6)**
* [Leaflet.js](https://leafletjs.com/) – Interaktive Kartenansicht
* [Turf.js](https://turfjs.org/) – Geospatiale Analysen, Korridor-Buffering & Flächenberechnung
* [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) & [osmtogeojson](https://github.com/tyrasd/osmtogeojson) – OpenStreetMap Live-Datenabfrage & GeoJSON-Konvertierung
* [Esri Leaflet](https://esri.github.io/esri-leaflet/) – Einbindung von ArcGIS Online Tiles

---

## 📜 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Freie Nutzung und Anpassung für alle Pilotinnen und Piloten.

*Flieg vorsichtig und hab eine gute Landung! 🪂*
