@echo off
echo Starte lokalen Webserver...
echo Seite wird geoeffnet unter: http://localhost:8080
echo Zum Beenden dieses Fenster schliessen.
echo.

REM Kurz warten, dann Browser oeffnen
start "" "http://localhost:8080"

REM Python 3 HTTP-Server starten
python -m http.server 8080

pause
