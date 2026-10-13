# Speed Dial für FlowFuse Dashboard

Ein schwebender Aktionsbutton für [FlowFuse Dashboard 2.0](https://dashboard.flowfuse.com/). Ein Klick öffnet ein kleines Menü mit Aktionen. Jede Aktion sendet eine Nachricht in deinen Flow – ganz ohne Template-Code.

*[English version](README.md)*

## Funktionen

- Schwebender Button in einer Ecke, an einem Rand oder in der Bildschirmmitte – oder innerhalb einer Dashboard-Gruppe
- Aktionen als Reihe, als Voll-, Halb- oder Viertelkreis oder als beschriftetes Menü
- Jede Aktion sendet ihren eigenen Payload (Text, Zahl, true/false, JSON oder `null`) und optional ein Topic
- Icons aus [PrimeIcons](https://primevue.org/icons/), eigene Farben, Größen und helles/dunkles Design
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
2. Festlegen, wo er erscheint: auf einer Seite, auf allen Seiten oder in einer Gruppe.
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

| Tab | Was eingestellt wird |
|---|---|
| Allgemein | Seite, alle Seiten oder Gruppe |
| Schaltfläche | Icon, Beschriftung, Farben, Größe, Position auf dem Bildschirm |
| Menü | Reihe, Kreis oder beschriftete Liste, Öffnungsrichtung, Animation, Overlay |
| Aktionen | Die Liste der Aktionen – einklappen, sortieren und duplizieren |
| Design | Hell, dunkel oder automatisch, Farben, Eckenrundung |

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
