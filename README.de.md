# Speed Dial für FlowFuse Dashboard

Ein schwebender Aktionsbutton für [FlowFuse Dashboard 2.0](https://dashboard.flowfuse.com/). Ein Klick öffnet ein kleines Menü mit Aktionen. Jede Aktion sendet eine Nachricht in deinen Flow – ganz ohne Template-Code.

*[English version](README.md)*

## Funktionen

- Schwebender Button in einer Ecke, an einem Rand oder in der Bildschirmmitte – in einer Dashboard-Gruppe oder in der Kopfzeile; auf einer, ausgewählten oder allen Seiten
- Aktionen als Reihe, als Voll-, Halb- oder Viertelkreis oder als beschriftetes Menü
- Jede Aktion sendet ihren eigenen Payload (Text, Zahl, true/false, JSON oder `null`) und optional ein Topic
- Übernimmt automatisch die Farben des Dashboard-Themes – oder eigene Farben und Größen
- Icons aus [PrimeIcons](https://primevue.org/icons/), [Material Design Icons](https://pictogrammers.com/library/mdi/) (wie bei den anderen Dashboard-Widgets) oder eigene Bilder (Upload oder URL)
- Aktionen und Aussehen lassen sich zur Laufzeit per Nachricht ändern
- Funktioniert auf Smartphone und Tablet und lässt sich mit der Tastatur bedienen
- Editor auf Deutsch und Englisch

## Voraussetzungen

- Node-RED 3.1 oder neuer
- FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) 1.23 oder neuer

## Installation

`node-red-dashboard-2-ui-speed-dial` über **Palette verwalten** in Node-RED installieren – oder im Node-RED-Benutzerverzeichnis (meist `~/.node-red`) ausführen und Node-RED neu starten:

```sh
npm install node-red-dashboard-2-ui-speed-dial
```

> Läuft Node-RED als Dienst unter einem eigenen Benutzer, muss im Verzeichnis dieses Benutzers installiert werden. `systemctl show nodered -p User -p ExecStart` zeigt, welches verwendet wird.

## Erste Schritte

1. **speed dial** aus dem Bereich *Dashboard 2* der Palette in den Flow ziehen.
2. Festlegen, wo er erscheint: in einer Gruppe, schwebend über der Seite oder in der Kopfzeile – und auf welchen Seiten (einer, ausgewählten oder allen).
3. Im Tab **Aktionen** die Aktionen anlegen – jeweils mit Beschriftung, Icon und Payload.
4. Den Ausgang mit dem restlichen Flow verbinden und deployen.

Ein Klick auf eine Aktion sendet:

```json
{
  "payload": { "name": "evening", "brightness": 40 },
  "topic": "scene",
  "action": "evening-scene"
}
```

`msg.action` ist die ID der Aktion, `msg.topic` ist nur gesetzt, wenn eines eingetragen wurde.

## Einstellungen

Oben wird festgelegt, wo der Button erscheint: in einer Gruppe (Größe wie bei anderen Widgets über das Raster), schwebend über der Seite oder rechts in der Kopfzeile des Dashboards – jeweils auf einer Seite, auf ausgewählten Seiten oder auf allen Seiten.

| Tab | Was eingestellt wird |
|---|---|
| Aktionen | Die Liste der Aktionen – Icon, Beschriftung und Payload; ID, Topic, Farben und mehr unter *Weitere Optionen*. IDs werden automatisch aus der Beschriftung erzeugt |
| Aussehen | Aufklappbare, klickbare Live-Vorschau, die das Menü mit den aktuellen Einstellungen öffnet; Position (Klick ins 3×3-Raster), Stil (Reihe, Reihe mit Text, Menüliste, Halb-/Viertel-/Vollkreis), Öffnungsrichtung (Pfeile), Icon und Icon beim Öffnen (Auswahl mit Suche), Farbe (Farbfelder inkl. transparent) und Größe (S/M/L) |
| Erweitert | Feineinstellungen: Beschriftung und Tooltip des Buttons, Größen in px, Abstände, Animation, Overlay, Schatten, Z-Index |

Ohne eigene Farben verwendet der Speed Dial die Primär- und Flächenfarben des Dashboard-Themes.

### Eigene Icons

Im Icon-Picker kann man im Reiter **Eigenes Bild** eine SVG/PNG/WebP/GIF/JPG-Datei hochladen (wird im Flow gespeichert, bis 16 KB) oder per Adresse einbinden – `https://…` oder ein Pfad wie `/icons/lampe.svg` aus dem Ordner, der in der `settings.js` von Node-RED als `httpStatic` eingetragen ist. Bilder werden wie die Schrift-Icons in der Icon-Farbe eingefärbt; am besten eignen sich einfarbige Symbole mit transparentem Hintergrund (idealerweise SVG).

Jedes Feld ist in der Hilfe der Node erklärt (das Buch-Symbol in der Node-RED-Seitenleiste).

## Das Menü aus dem Flow ändern

Eine Nachricht an den Eingang der Node senden. Dabei wird nichts am Ausgang ausgegeben.

```js
// Alle Aktionen ersetzen
msg.payload = [
    { id: "on",  label: "An",  icon: "pi-power-off", payload: true },
    { id: "off", label: "Aus", icon: "pi-ban",       payload: false }
];

// Nur einzelne Einstellungen ändern
msg.payload = { button: { icon: "pi-bolt", background: "#dc2626" }, menu: { shape: "circle" } };

// Einzelne Aktionen ändern
msg.command = "patch";
msg.payload = [{ id: "off", label: "Ausschalten", enabled: false }];

// Aktionen entfernen
msg.command = "remove";
msg.payload = ["off"];

// Zurück zu den Einstellungen aus dem Editor
msg.command = "reset";
```

Ungültige Nachrichten werden komplett ignoriert und erzeugen eine Warnung in der Debug-Seitenleiste.

Alle Nachrichtenarten mit Beispielen, sämtliche Felder mit Standardwerten und die häufigsten Fehler stehen in der Hilfe der Node (Buch-Symbol in der Node-RED-Seitenleiste) im Abschnitt **Eingang**.

Um das Menü **nur für einen Browser** zu ändern, `msg._client` aus einem vorherigen Klick dieses Browsers mitsenden und die Node in den Dashboard-Einstellungen unter *Client Data → Accept Client Data* freigeben.

Änderungen per Nachricht gelten, bis Node-RED neu startet oder die Node erneut deployt wird.

## Beispiele

Import über **Menü → Import → Beispiele → node-red-dashboard-2-ui-speed-dial**:

- **speed-dial-demo** – mehrere Speed Dials auf verschiedenen Seiten und in einer Gruppe
- **speed-dial-input-reference** – für jede mögliche Eingangsnachricht ein fertiger Function-Node, von einfachen Änderungen bis zu Fehlerfällen

## Sprachen

Editor und Node-Hilfe gibt es auf Deutsch und Englisch. Bei jeder anderen Sprache wird Englisch angezeigt.

## Aus dem Quellcode bauen

```sh
npm install
npm run build   # oder: npm pack
```

## Lizenz

[MIT](LICENSE). Enthält [PrimeVue](https://primevue.org/) und [PrimeIcons](https://primevue.org/icons/), beide unter MIT-Lizenz.
