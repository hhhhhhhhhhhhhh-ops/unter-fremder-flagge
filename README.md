# Unter fremder Flagge — Browser-Spiel

**Release:** 2.0 (1. November 2026)

Ein spielbares 3D-U-Boot-Abenteuer mit einer zusammenhängenden Welt aus sechs Regionen, sechs Story-Kapiteln, fiktiver Handlung im Zweiten Weltkrieg, verschiedenen U-Boot-Typen, Feindschiffen, Torpedos, Geschützen, Festungen, Landgängen, Aufgaben, Handel, einer Flottille, Karte, Zielhilfe und browserlokalen Spielständen.

## Dateien

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Startseite, responsive Bedienoberfläche, Fehlermeldungen und Grafikbibliotheks-Lader |
| `game.js` | Spielmechaniken, Welt, Schiffe, Story, Eingabe und Menüs |
| `sw.js` | Cache für späteres Offline-Spielen (nach erfolgreicher Erstinstallation) |
| `manifest.webmanifest`, `icon.svg` | Installierbare Browser-App (PWA) |
| `tests/core.test.cjs` | Automatisierte Logik-, Speicher- und Strukturtests |

## Lokal starten

1. Entpacke **alle Dateien gemeinsam** in einen Ordner.
2. Öffne in diesem Ordner ein Terminal.
3. Starte `python -m http.server 8000` (Windows mit Python) oder `python3 -m http.server 8000` (Linux/macOS).
4. Öffne **http://localhost:8000** im aktuellen Chrome, Firefox oder Edge.

Beim ersten Aufruf muss die 3D-Bibliothek Three.js (fest auf `r128` / `0.128.0` gesetzt) von einem der drei CDN-Server geladen werden. Für moderne Grafikkarten wird WebGL benötigt. Wer Drittanbieter-CDNs blockiert, benötigt eine selbst gehostete Kopie der kompatiblen Three.js-Version.

**Steuerung:** Das Spiel hat unter „Steuerung“ eine vollständige Tastenübersicht. Zum Einstieg: `W/S` Gas, `A/D` Ruder, `E/Q` Tauchen/Auftauchen, `Tab` Ziel, `1` Torpedo, linke Maustaste Geschütz, `F` Aktion, `M` Weltkarte, `J` Logbuch, `Esc` Pause. Touch und Gamepads sind im ursprünglichen Projekt angelegt.

## Öffentlich über GitHub Pages veröffentlichen

1. Erstelle ein **neues öffentliches Repository** (z. B. `unter-fremder-flagge`) auf GitHub, damit andere Projekte nicht verändert werden.
2. Lade `index.html`, `game.js`, `sw.js`, `manifest.webmanifest` und `icon.svg` in das Wurzelverzeichnis der Standardbranch `main` hoch. Optional `README.md` und `tests/` hinzufügen.
3. Öffne GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save**.
4. Nach dem abgeschlossenen Pages-Deployment liegt die Seite normalerweise unter `https://<BENUTZERNAME>.github.io/unter-fremder-flagge/`.
5. **Teste den öffentlichen Link** auf Desktop und Mobilgerät: Neustart, Fortsetzen, Kartennavigation, Missionsziel, Spielstand sichern/einlesen.

Der Ablauf ist eine **Anleitung**, keine Behauptung, dass dieses Projekt bereits auf GitHub hochgeladen oder GitHub Pages eingeschaltet wurde.

## Technische Prüfungen

Automatisierte Tests ohne Zusatzpakete:

```sh
node --check game.js
node --check sw.js
node --test tests/core.test.cjs
```

Die Prüfungen decken die Initialisierung der Gameplay-Module, Kampagnendaten und Missionsreferenzen, Reset des Kartenfortschritts, Speichern und Laden, Export und Import, Validierung von Sicherungen, Rang/Fähigkeiten sowie PWA-Dateien ab. Sie ersetzen **keinen vollständigen WebGL-End-to-End-Test**. Auch die Grafik, tatsächliche Bildrate, Missionen über viele Spielstunden, Touch- und Gamepadsteuerung sowie Offline-Nutzung auf realen Geräten benötigen einen Browsertest.

## Spielstände und Daten

- Das Spiel speichert den Fortschritt in `localStorage` im jeweils verwendeten Browser. Es gibt derzeit **kein Online-Konto und keine serverseitige Spielstand-Synchronisierung**.
- Während des Spiels wird alle ca. 15 Sekunden gespeichert, zusätzlich beim Verlassen/Wechseln des Tabs, soweit der Browser die Ereignisse ausführt.
- Über **Spielstände** können JSON-Sicherungen exportiert und wieder eingelesen werden. Vor dem Start eines neuen Spiels erscheint bei vorhandenem Speicherstand eine Bestätigung.
- Browserdaten können gelöscht werden; für dauerhafte Sicherung die JSON-Datei regelmäßig exportieren.
- Fonts werden über Google Fonts und Three.js über externe CDNs geladen. Bei einer öffentlichen Website die rechtlichen Anforderungen (z. B. Anbieterkennzeichnung und Datenschutzinformationen, soweit anwendbar) und die Nutzung externer Dienste prüfen.

## Änderungen gegenüber der hochgeladenen HTML-Datei

- Reproduzierbaren Fehler behoben: **Neues Spiel** übernimmt nicht länger alte erkundete Kartenfelder.
- Rückgabewert der Speicherroutine durch alle Wrapper korrekt weitergereicht.
- Spielstand-Import, -Export und Basiskontrollen für beschädigte Dateien ergänzt.
- Automatisches Speichern des Navigationsfortschritts ergänzt.
- Schutz vor versehentlichem Überschreiben eines existierenden Spielstands.
- Ladebildschirm und Fallbacks für die Three.js-Bibliothek ergänzt.
- Mehrdateien-Struktur für Hosting, PWA-Metadaten und Basis-Offline-Cache ergänzt.
- Tests und Veröffentlichungsschritte dokumentiert.

## Rechte / Hinweis

Die Spiellogik und Texte basieren auf der vom Nutzer bereitgestellten Datei `Unter fremder Flagge.html`. Es wird **keine Lizenz für den Spielcode festgelegt**. Three.js ist ein separat lizenziertes Open-Source-Projekt (MIT-Lizenz); die Nutzungsbedingungen und Lizenzen aller Fremdressourcen müssen vor der öffentlichen Verteilung beachtet werden. Das Spiel ist eine **fiktionale** Geschichte, keine historische Darstellung und keine offizielle Verbindung zu einer der erwähnten Marineorganisationen.

## Steuerungs-Fixes (2.1)

Touch-Joystick und Gamepad sind getrennte Eingabequellen; aktive Touch-Eingabe hat Vorrang. Abgebrochene Pointer-Ereignisse feuern keinen Torpedo. Fokusverlust und geschlossene Menüs lösen gehaltene Tasten aus. Die Tests stehen in `tests/controls.test.cjs`.
