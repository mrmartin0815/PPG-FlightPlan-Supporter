# PPG FlightPlanHelper 🪂✈️

**PPG FlightPlanHelper** ist ein leichtgewichtiges, browserbasiertes Web-Tool zur Flugplanung und Terrainanalyse für Motorschirmflieger (Paramotor / PPG) und Leichtflugzeuge. Es ermöglicht das schnelle Zeichnen von Flugrouten, zeigt entlang des Flugkorridors Hindernisse, Bebauung und Wald an – und damit indirekt auch, wo freie Flächen für eine Notlandung liegen – und exportiert die Route in gängige Navigations- und Fluginstrument-Formate.

👉 **Direkt nutzen:** [mrmartin0815.github.io/PPG-FlightPlan-Supporter](https://mrmartin0815.github.io/PPG-FlightPlan-Supporter/)

---

## 🌟 Hauptfunktionen

* **Interaktive Routenplanung:**
  * **Wegpunkte setzen:** Per Rechtsklick (am Smartphone: langes Drücken) Punkte direkt auf der Karte erstellen.
  * **Wegpunkte anpassen:** Punkte per Drag & Drop verschieben oder per Rechtsklick (langes Drücken) auf den Marker löschen.
  * **Zwischenpunkte einfügen:** Ein Klick auf ein Routensegment fügt genau dort einen neuen Wegpunkt zwischen den beiden benachbarten Punkten ein.
  * **Echtzeit-Distanzberechnung:** Laufende Anzeige der Gesamtlänge der Flugroute in Kilometern.

* **Umgebungs- & Gefahrenanalyse (via Overpass API):**
  * Ein Klick auf **„Berechnen“** lädt Live-Daten aus OpenStreetMap für das Gebiet um die Route:
    * **Route mit mehreren Punkten:** Korridor von 3 km beiderseits der Route
    * **Ein einzelner Punkt:** Umkreis von 4 km
    * **Ohne Punkte:** Umkreis von 3 km um die Kartenmitte

    Abgefragt wird jeweils das umschließende Rechteck dieses Gebiets.
  * Angezeigt werden:

    | Kategorie | Darstellung |
    | :--- | :--- |
    | Windkraftanlagen, Türme | rote Kreise |
    | Start- und Landebahnen | dicke lila Linien |
    | Wohngebiete, Friedhöfe, Campingplätze | dunkelbraune Flächen |
    | Industrie, Gewerbe, Einzelhandel, Hofflächen, Militärgebiete | hellbraune Flächen |
    | Obstplantagen, Weinberge | petrolfarbene Flächen |
    | Wälder, Bahngelände | grüne Flächen |

  * Kleine Flächen werden ausgeblendet, damit die Karte übersichtlich bleibt: Bebauung, Obst-/Weinbau und Campingplätze ab 1,5 ha, Wald ab 2 ha, Militär- und Bahngelände ab 30 ha.
  * ⚠️ **Nicht erfasst** werden u. a. Freileitungen/Stromleitungen, Masten (`man_made=mast`) und Seilbahnen. Die Analyse ersetzt keine eigene Flugvorbereitung – sie ist nur so vollständig wie die OpenStreetMap-Daten.

* **Vielseitige Kartenstile (Base Maps):**
  Über das Layer-Menü oben rechts umschaltbar:
  * **OpenStreetMap** (Server von OpenStreetMap Deutschland) – Standard-Straßen- und Landkarte
  * **OpenTopoMap** – Topografische Karte mit Höhenlinien und Relief
  * **esriSat** & **googleSat** – Satellitenbilder zur visuellen Terrainbeurteilung
  * **EsriStreet** & **Humanitarian** – weitere Straßenkarten

* **Export-Funktionen:**
  * **GPX Route** (`route.gpx` mit `<rte>`) – für den klassischen Import in Navigationsgeräte
  * **GPX Track** (`track.gpx` mit `<trk>`) – Pfad für Track-Anzeigen
  * **GPX Wegpunkte** (`waypoints.gpx` mit `<wpt>`, benannt „Punkt 1“, „Punkt 2“, …) – einzelne Wegpunkte für GPS-Geräte
  * **XCTrack Task** (`xctrack.xctsk`) – Aufgabe für **XCTrack**; jeder Wegpunkt wird ein Turnpoint („Punkt01“, „Punkt02“, …) mit festem Radius von 100 m

* **Mobile- & Desktop-Optimiert:**
  * Responsive Oberfläche mit größeren Bedienelementen und dickerer Routenlinie auf Smartphones und Tablets
  * Als App installierbar (PWA), siehe unten

---

## 🚀 Schnellstart & Nutzung

Es ist keine Installation und kein Backend-Server erforderlich. Das Tool läuft vollständig im Webbrowser (Client-Side HTML/JS).

**Am einfachsten:** die [GitHub-Pages-Version](https://mrmartin0815.github.io/PPG-FlightPlan-Supporter/) öffnen – funktioniert am PC und auf dem Smartphone.

**Lokal am PC:**

1. Repository klonen oder als ZIP herunterladen:
   ```bash
   git clone https://github.com/mrmartin0815/PPG-FlightPlan-Supporter.git
   ```
2. Die Datei [`index.html`](index.html) per Doppelklick in einem modernen Browser öffnen (Chrome, Firefox, Safari, Edge). Ein lokaler Webserver ist nicht nötig.
3. Optional: [`start.bat`](start.bat) startet einen lokalen Webserver (benötigt Python) und öffnet die App unter `http://localhost:8080`.

> Auf Android-Smartphones lassen sich lokale HTML-Dateien nicht sinnvoll öffnen – dort bitte die GitHub-Pages-Version verwenden.

### 📱 Als App auf dem Smartphone installieren

Die App ist eine PWA (Progressive Web App). Öffne die GitHub-Pages-Adresse in **Chrome auf Android** und wähle im Menü **„App installieren“** bzw. **„Zum Startbildschirm hinzufügen“**. Sie startet dann mit eigenem Icon im Vollbild. Auf dem iPhone geht das in Safari über **Teilen → „Zum Home-Bildschirm“**.

Die App selbst wird zwischengespeichert; für Karten und Geländedaten ist weiterhin eine Internetverbindung nötig.

> **Hinweis:** Die Geländedaten kommen von den öffentlichen Overpass-Servern, die häufig stark ausgelastet sind. Eine Abfrage kann daher 30–60 Sekunden dauern; die App probiert bei Überlastung automatisch mehrere Server und wiederholt die Anfrage.

---

## 🕹️ Bedienung

| Aktion | Desktop | Smartphone / Tablet |
| :--- | :--- | :--- |
| **Neuen Punkt setzen** | Rechtsklick auf die Karte | Langes Drücken auf die Karte |
| **Zwischenpunkt einfügen** | Klick auf die Routenlinie | Tippen auf die Routenlinie |
| **Punkt verschieben** | Marker ziehen | Marker gedrückt halten und ziehen |
| **Punkt löschen** | Rechtsklick auf den Marker | Langes Drücken auf den Marker |
| **Umgebung analysieren** | Button **„Berechnen“** | Button **„Berechnen“** |
| **Route exportieren** | Button **„GPX“** → Format wählen | Button **„GPX“** → Format wählen |
| **Alles zurücksetzen** | Button **„Reset“** | Button **„Reset“** |

---

## 🛠️ Verwendete Technologien & Bibliotheken

* **HTML5 / CSS3 / JavaScript (ES6)**, ohne Build-Schritt
* [Leaflet.js](https://leafletjs.com/) – interaktive Kartenansicht
* [Turf.js](https://turfjs.org/) – Korridor-Puffer, Bounding Box und Flächenberechnung
* [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) & [osmtogeojson](https://github.com/tyrasd/osmtogeojson) – Live-Abfrage der OpenStreetMap-Daten und Umwandlung in GeoJSON
* **Service Worker & Web App Manifest** – Installation als PWA

### 📁 Dateien

| Datei | Inhalt |
| :--- | :--- |
| `index.html` | Seitenstruktur, Einbindung der Bibliotheken |
| `script.js` | Gesamte App-Logik (Karte, Route, Overpass, Export) |
| `styles.css` | Layout und Darstellung, inkl. Mobile-Anpassungen |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: App-Name, Icons, Offline-Cache |
| `start.bat` | Optionaler lokaler Webserver für Windows |
| `TODO.md` | Offene Aufgaben und Ideen |
| `LICENSE` | MIT-Lizenz |

> **Für Änderungen:** Nach Änderungen an `script.js` die Versionsnummer `script.js?v=…` in `index.html` **und** `sw.js` hochzählen und in `sw.js` den Namen `CACHE` erhöhen – sonst laden Browser und installierte App weiter die alte Version.

---

## 📜 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE). Freie Nutzung und Anpassung für alle Pilotinnen und Piloten.

*Flieg vorsichtig und hab eine gute Landung! 🪂*
