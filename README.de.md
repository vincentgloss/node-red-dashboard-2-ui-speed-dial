# node-red-dashboard-2-ui-speed-dial

Ein dynamischer, schwebender Aktionsknopf für [FlowFuse Dashboard](https://dashboard.flowfuse.com/). Das Paket registriert den Node-RED-Node `ui-speed-dial`. Er zeigt PrimeIcons-Aktionen als Speed Dial oder Menü an und sendet beim Auswählen die auf dem Server konfigurierte Nutzlast aus.

*[English version](README.md)*

## Voraussetzungen und Installation

| Komponente | Unterstützt | Hinweise |
|---|---|---|
| Node-RED | **3.1 oder neuer** (geprüft: 3.1.15, 4.0.9, 4.1.x, 5.0.8) | Node-RED 5 selbst braucht Node.js 22.9 oder neuer |
| Node.js | **18 oder neuer** (geprüft: 18, 20, 22, 24) | je nachdem, was Ihre Node-RED-Version verlangt |
| FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) | **1.23.0 oder neuer, kleiner als 2.0** (geprüft: 1.23.0, 1.24.0, 1.33.0; serverseitig auch 1.25.0, 1.30.0) | Dashboard 2.0 wird noch nicht unterstützt |
| Vue | nichts zu installieren | das Widget nutzt die im Dashboard gebündelte Vue-Laufzeit (3.5 oder neuer, ab Dashboard 1.23 der Fall) |

Ältere Dashboard-Versionen funktionieren **nicht**: Bis 1.22.1 fehlt dem gebündelten Vue 3.4 `useId`, das PrimeVue 4 braucht, und bis 1.21.0 fehlt die Server-API für den Widget-Zustand. Die vollständige Testmatrix und das, was nicht geprüft wurde, stehen unter [Kompatibilität im Detail](#kompatibilität-im-detail). Das Paket deklariert diese Bereiche in der `package.json` (`node-red.version`, `peerDependencies`, `engines`): Node-RED lädt die Node auf einer nicht unterstützten Node-RED-Version nicht, und npm warnt bei einem nicht unterstützten Dashboard.

Im Node-RED-Benutzerverzeichnis (meist `~/.node-red`):

```sh
npm install node-red-dashboard-2-ui-speed-dial
```

Den Node-RED-Prozess neu starten und `ui-speed-dial` aus der Palettenkategorie „Dashboard 2“ im Editor auf eine Gruppe, Seite oder UI-Basis ziehen. Die Beispiele in [`examples/`](examples/) lassen sich über **Importieren → Zwischenablage** in Node-RED importieren.

Die Runtime bindet die vom Dashboard bereitgestellte Vue-Version ein. Das Paket bringt keine zweite globale Vue-Anwendung mit. PrimeVue 4.5.5 ist als isolierte, ungestylte Widget-Anwendung eingebunden; PrimeIcons 7.0.0 und die benötigten Dateien liegen lokal im Paket. Siehe [Funktionsweise](#funktionsweise).

## Editor-Konfiguration

Der Editor speichert `actions` sowie die drei Abschnitte `button`, `menu` und `theme`. Nicht angegebene Abschnittsfelder erhalten die Tabellen-Defaults. Jede Aktion braucht eine eindeutige `id` und eine `payload`; `null` ist eine gültige Payload. Nicht angegebene optionale Aktionsfelder erhalten ihre Defaults. Unbekannte Felder und doppelte IDs werden abgewiesen.

**Bedienung im Editor:** Zahlenfelder zeigen eine Reset-Schaltfläche (↺), sobald der Wert vom Standard abweicht. Aktionen lassen sich einzeln ein- und ausklappen (zusätzlich *Collapse all* / *Expand all*; der Zustand ist nur eine Editor-Ansicht und wird nicht gespeichert) und per Kopier-Schaltfläche direkt unter dem Original duplizieren; die Kopie erhält eine neue eindeutige ID (`<id>-copy`, `<id>-copy-2`, …). Neben jedem Farbfeld gibt es einen Farbwähler.

### Schaltfläche (`button`)

| Feld | Typ | Standard | Erlaubte Werte |
|---|---|---:|---|
| `icon` | Icon | `pi-plus` | Leerer String oder Name im Format `pi-…` |
| `label` | String | `""` | Höchstens 160 Zeichen |
| `tooltip` | String | `Actions` | Höchstens 240 Zeichen |
| `background` | Farbe | `#2563eb` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | Farbe | `#ffffff` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `size` | Zahl | `56` | 11 bis 96 (sehr kleine Werte sind per Touch schwer zu treffen) |
| `radius` | Zahl | `28` | 0 bis 48 |
| `visible` | Boolean | `true` | `true` oder `false` |
| `enabled` | Boolean | `true` | `true` oder `false` |
| `position` | Enum | `bottom-right` | `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `offsetX` | Zahl | `24` | 0 bis 500; wirkungslos, wenn die Position horizontal zentriert ist |
| `offsetY` | Zahl | `24` | 0 bis 500; wirkungslos, wenn die Position vertikal zentriert ist |

### Menü (`menu`)

| Feld | Typ | Standard | Erlaubte Werte |
|---|---|---:|---|
| `shape` | Enum | `linear` | `linear`, `circle`, `semi-circle`, `quarter-circle` (nur bei `mode: speed-dial`; `menu` ist immer linear) |
| `direction` | Enum | `up` | Je nach `shape`: `linear` und `semi-circle` → `up`, `down`, `left`, `right`; `quarter-circle` → `up-left`, `up-right`, `down-left`, `down-right`; `circle` ignoriert den Wert |
| `radius` | Zahl | `0` | 0 bis 500 px Abstand der Aktionen vom Button-Mittelpunkt (nur Kreisformen); `0` = kleinster Radius ohne Überlappung |
| `mode` | Enum | `speed-dial` | `speed-dial`, `menu` |
| `gap` | Zahl | `8` | 0 bis 48 |
| `duration` | Zahl | `150` | 0 bis 1000 Millisekunden |
| `closeOnSelect` | Boolean | `true` | `true` oder `false` |
| `overlay` | Boolean | `false` | `true` oder `false` |
| `showLabels` | Boolean | `false` | `true` oder `false` |
| `actionSize` | Zahl | `44` | 44 bis 80 |

### Theme (`theme`)

| Feld | Typ | Standard | Erlaubte Werte |
|---|---|---:|---|
| `mode` | Enum | `auto` | `light`, `dark`, `auto` |
| `background` | Farbe | `""` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | Farbe | `""` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `radius` | Zahl | `12` | 0 bis 40 |
| `shadow` | Boolean | `true` | `true` oder `false` |
| `zIndex` | Zahl | `2000` | 1 bis 10000 |

### Aktion (`actions[]`)

| Feld | Typ | Standard | Erlaubte Werte |
|---|---|---:|---|
| `id` | ID | erforderlich | 1–64 Zeichen, beginnt alphanumerisch; danach `A–Z`, `a–z`, `0–9`, `_`, `.`, `:`, `-`; pro Liste eindeutig |
| `label` | String | `Action` | Höchstens 160 Zeichen |
| `icon` | Icon | `pi-circle` | Leerer String oder Name im Format `pi-…` |
| `tooltip` | String | `""` | Höchstens 240 Zeichen |
| `background` | Farbe | `""` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | Farbe | `""` | Leerer String oder `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `topic` | String | nicht gesetzt | Höchstens 240 Zeichen |
| `payload` | JSON | erforderlich | Native JSON-Werte, einschließlich `null` |
| `visible` | Boolean | `true` | `true` oder `false` |
| `enabled` | Boolean | `true` | `true` oder `false` |

**Formen und Richtungen.** `shape` und `direction` müssen zusammenpassen; eine Nachricht, die nur `shape` ändert und eine unpassende `direction` zurücklässt, wird als Ganzes abgewiesen (beide Felder zusammen senden). Der Editor bietet bei `semi-circle` und `quarter-circle` nur die Richtungen an, die von der Bildschirmecke der Button-Position wegzeigen:

| `button.position` | `semi-circle` | `quarter-circle` |
|---|---|---|
| `bottom-right` | `up`, `left` | `up-left` |
| `bottom-left` | `up`, `right` | `up-right` |
| `top-right` | `down`, `left` | `down-left` |
| `top-left` | `down`, `right` | `down-right` |
| `bottom-center` | `up` | `up-left`, `up-right` |
| `top-center` | `down` | `down-left`, `down-right` |
| `center-left` | `right` | `up-right`, `down-right` |
| `center-right` | `left` | `up-left`, `down-left` |
| `center` | `up`, `down`, `left`, `right` | alle vier Diagonalen |

Ein Vollkreis (`circle`) funktioniert am besten mit `position: center`. Bei zentrierten Achsen bleibt der Abstand (`offsetX`/`offsetY`) unberücksichtigt.

Ein Viertelkreis passt in eine Bildschirmecke. Ein Halbkreis ragt auf der Querachse um den Radius auf beide Seiten über den Button hinaus: Bei `up`/`down` sollte `offsetX`, bei `left`/`right` `offsetY` mindestens dem Radius entsprechen. Ein Vollkreis braucht auf allen Seiten einen Radius Platz. Zur Laufzeit wird die Kombination aus Position und Richtung nicht erzwungen. Passt eine Kreisform nicht in den sichtbaren Bereich (z. B. `circle` am Rand), wird sie als Ganzes in den Bildschirm geschoben. Lineare Reihen drehen sich weiterhin automatisch. In Kreisformen werden keine Beschriftungen angezeigt (`showLabels` wirkt nur bei `linear`); der Tooltip bleibt. Bei nur einer sichtbaren Aktion fallen `semi-circle` und `quarter-circle` auf eine kurze lineare Reihe zurück.

**Farben.** Der Editor bietet neben jedem Farbfeld einen Farbwähler (ohne Transparenz) und eine Löschen-Schaltfläche an; Werte können weiterhin als Hex getippt werden, auch mit Alpha (`#rrggbbaa`). Farbnamen (CSS oder Vuetify-Palette) werden nicht akzeptiert, weil die Widget-Anwendung isoliert läuft und die Vuetify-Palette zur Laufzeit nicht zuverlässig verfügbar ist.

Icon-Namen werden auf das Namensformat `pi-` gefolgt von Kleinbuchstaben, Ziffern oder Bindestrichen geprüft. Die Farbe muss exakt eine der genannten Hex-Längen haben. Zahlen müssen endlich sein und innerhalb der inklusiven Grenzen liegen. Aktionslisten dürfen höchstens 100 Einträge enthalten; JSON-Nutzlasten dürfen höchstens 262144 UTF-8-Bytes und 32 Ebenen tief sein.

## Nachrichtenvertrag

Der Node verarbeitet eingehende Nachrichten als Konfigurationsupdates und sendet für sie keine Ausgabe. Metadaten wie `_msgid` und `_client` dürfen neben `payload` stehen. Die Konfiguration wird auf dem Server validiert; fehlerhafte Nachrichten werden als Warnung verworfen, ohne einen Teilzustand zu übernehmen.

### Ersetzen und Teilupdates

Ohne `command` gelten folgende Formen:

```js
// Vollständige Aktionsliste ersetzen; die übrigen Konfigurationswerte bleiben gleich.
msg.payload = [{ id: "start", label: "Start", payload: { run: true } }]

// Nur angegebene Abschnitte/Felder aktualisieren; Aktionen bleiben gleich.
msg.payload = {
  button: { visible: false },
  menu: { direction: "left" },
  theme: { mode: "dark" }
}

// Aktion und Button-Feld in einem Update ersetzen/mergen.
msg.payload = {
  actions: [{ id: "stop", payload: null }],
  button: { visible: true }
}
```

Eine Objekt-Payload merged angegebene Abschnittsfelder in die aktuelle Konfiguration. Eine angegebene `actions`-Liste ersetzt die ganze Aktionsliste. Nicht angegebene Abschnittsfelder und Abschnitte bleiben unverändert. Ein Abschnitt muss ein Objekt sein. Es gibt kein `command: "replace"`.

### Patch, Entfernen und Zurücksetzen

```js
msg.command = "patch"
msg.payload = [{ id: "start", label: "Los", visible: false }]

msg.command = "remove"
msg.payload = ["start"]

msg.command = "reset"
```

`patch` ändert ausschließlich die aufgeführten Felder bestehender Aktionen. Nicht aufgeführte Felder, einschließlich `payload`, bleiben erhalten. `remove` erwartet Action-IDs. Beide Befehle lehnen unbekannte oder doppelte IDs und unbekannte Felder ab. `reset` stellt die ursprüngliche Editor-Konfiguration wieder her; eine Payload wird dabei ignoriert. Ein vorhandenes, aber unbekanntes `command` wird nicht als normales Update interpretiert. Jede Validierung geschieht vor der Zustandsänderung; ein Fehler lässt den Zustand vollständig unverändert.

`payload` einer Aktion muss bei jeder vollständigen Aktion vorhanden sein. Sie wird als nativer JSON-Wert gespeichert und ausgegeben, nicht aus einem zur Laufzeit gelieferten String geraten: Strings, Zahlen, Booleans, `null`, Arrays und einfache Objekte sind möglich. Werte wie `undefined`, `NaN`, Funktionen, Zyklen oder Nicht-JSON-Objekte sind ungültig.

### Gemeinsame und gezielte Updates

Ohne `_client` aktualisiert eine Nachricht die gemeinsame Konfiguration. Der Server merged das Update dort nach den obigen Regeln, speichert den Snapshot im Dashboard-Datastore und löscht anschließend alle sitzungslokalen Überschreibungen.

Mit `_client.socketId`, `_client.clientId` oder beiden zielt ein Update auf bereits verbundene, vollständig geladene Widget-Sockets. Beide Angaben werden mit UND verknüpft. `clientId` trifft nur aktuell verbundene Sockets mit dieser Dashboard-Client-ID; nach einem Reload gilt die neue Socket-Sitzung wieder als eigener Zustand, auch wenn die stabile Client-ID gleich bleibt. Eine alleinige User-Angabe ist kein gültiges Ziel. Unbekannte oder getrennte Ziele werden abgewiesen. Für gezielte Updates muss `ui-speed-dial` in der Dashboard-Einstellung **Client Data → Accepts Client Data** freigeschaltet sein.

Gezielte Änderungen werden pro Socket im Arbeitsspeicher gehalten und bei Verbindungsabbruch verworfen. Ein Seitenwechsel auf derselben Socket-Verbindung behält den Zustand. `reset` stellt für die getroffenen Sockets die Editor-Konfiguration wieder her. Jede gemeinsame Aktualisierung ersetzt die gemeinsame Konfiguration und löscht alle gezielten Überschreibungen, auch wenn das gemeinsame Update nur ein Feld ändert.

### Ausgabe bei Aktionsauswahl

Eine gültige Auswahl gibt eine Nachricht mit der serverseitig gespeicherten Payload aus:

```js
{
  payload: /* natives JSON aus der gewählten Aktion */,
  action: "start",
  topic: "optional/topic" // nur wenn in der Aktion gesetzt
}
```

Die Browsernachricht liefert nur die Action-ID; Payload und `topic` werden aus der aktuellen serverseitigen Konfiguration genommen. `_client` wird der Ausgabe nur hinzugefügt, wenn Dashboard **Include Client Data** aktiviert hat und ein vertrauenswürdiger Client-Kontext vorliegt. Die Ausgabe enthält nie `speedDialConfig`. Unsichtbare oder deaktivierte Schaltflächen und Aktionen erzeugen keine Nachricht.

## Sprachen

Editor-Dialog (Beschriftungen, Feldhilfe, Fehlermeldungen) und die Hilfe in der Seitenleiste sind übersetzt in **Englisch** (`en-US`, Fallback) und **Deutsch** (`de`). Welche Sprache verwendet wird, bestimmt die Spracheinstellung von Node-RED beziehungsweise des Browsers. Die Texte liegen unter `nodes/locales/<Sprache>/ui-speed-dial.json` (Dialog) und `nodes/locales/<Sprache>/ui-speed-dial.html` (Hilfe). Für eine weitere Sprache beide Dateien aus `en-US` in einen neuen Ordner (z. B. `fr`) kopieren und übersetzen; fehlende Schlüssel fallen auf Englisch zurück. Nicht übersetzt werden Protokollwerte (`speed-dial`, `top-left`, …), Warnungen der Runtime im Node-RED-Log und diese README.

## Beispiel-Flows

| Datei | Inhalt |
|---|---|
| [`examples/speed-dial-demo.json`](examples/speed-dial-demo.json) | Kleine Demo mit mehreren Widget-Instanzen (Seite, Gruppe, ganze UI) |
| [`examples/speed-dial-input-reference.json`](examples/speed-dial-input-reference.json) | Referenz aller Eingaben: je ein Inject- und Function-Node pro Möglichkeit (87 Szenarien in 10 Gruppen, dazu ein Hilfs-Function-Node, der den Client des letzten Klicks merkt) |

Der Referenz-Flow ist nach dem Import unter `/speed-dial-reference/reference` erreichbar und deckt ab:

1. **Aktionsliste ersetzen**: alle Payload-Typen (String, leerer String, Zahl, Boolean, Objekt, Array, `null`), vollständige und minimale Aktionen, Topics, versteckte/deaktivierte Aktionen, Klartext-Labels, leere Liste.
2. **Konfiguration aktualisieren**: jedes Feld von `button` (Icon, Label, Farben, Größe 11/96, Rundung, Sichtbarkeit, Aktivierung, alle 9 Positionen, Abstände), `menu` (Modus, alle Form/Richtungs-Kombinationen, Radius, Abstand, Dauer, Schließen, Overlay, Labels) und `theme` (Modus, Farben, Rundung, Schatten, z-Index), kombinierte Nachrichten und Presets für Voll-, Halb- und Viertelkreis.
3. **Patch**: Label/Icon/Tooltip, jeder Payload-Typ, Farben und Topic, Sichtbarkeit, Aktivierung, mehrere Einträge atomar.
4. **Remove**: einzeln, mehrere, leere Liste.
5. **Reset**.
6. **Client-Targeting**: gezielt per `socketId`, `clientId` oder beidem, gezieltes Patch/Remove/Reset, Broadcast, der alle Overrides beendet. Vorher einmal auf eine Aktion klicken, damit der Flow den Client kennt.
7. **Ungültige Nachrichten** (26 Stück): Jede erzeugt nur eine Warnung in der Debug-Seitenleiste und lässt das Widget unverändert.

Die Function-Nodes enthalten Kommentare mit den jeweiligen Regeln. Teilweise wechseln sie bei jedem Auslösen den Wert (zum Beispiel Positionen oder Formen).

## Kompatibilität im Detail

Alle Zeilen liefen gegen die gepackte `.tgz` mit der echten Node-RED-Runtime; „voll“ heißt Runtime-Integrationstest und Browser-Test (Editor und Dashboard in Chrome). Getestet wurde unter Windows 10.

| Node.js | Node-RED | Dashboard | Ergebnis |
|---|---|---|---|
| 18.20.8 | 3.1.15, 4.0.9 | 1.33.0 | voll: OK |
| 20.20.2 | 4.1.16 | 1.23.0, 1.24.0, 1.33.0 | voll: OK |
| 22.23.3 | 4.1.16, 5.0.8 | 1.33.0 | voll: OK |
| 24.19.0 | 5.0.8 | 1.33.0 | voll: OK |
| 24.19.0 | 4.1.0 | 1.25.0, 1.30.0 | Runtime: OK (Browser nicht geprüft) |
| 18 / 20 / 24 | 4.1.x | 1.22.0, 1.22.1 | Runtime OK, **Browser schlägt fehl** (`useId is not a function`) |
| 24.19.0 | 4.1.0 | 1.0.0 – 1.21.0 | **schlägt fehl** (serverseitige Widget-Zustands-API fehlt) |

Nicht geprüft: Node-RED 3.0.x (startet in der Windows-Testumgebung nicht), Node.js 16 oder älter, Linux und macOS, andere Browser als Chrome, Dashboard 2.x. Versionen zwischen den geprüften wurden nicht einzeln getestet. Zum Bauen aus den Quellen ist Node.js 22.12 oder neuer nötig (Vite 8), zum Installieren nicht. Die Matrix lässt sich mit `node test/compat.cjs <node-red> <dashboard> --browser` nachstellen (`SD_NODE` auf ein anderes Node.js-Binary setzen, um Node-RED damit zu starten).

## Funktionsweise

- **Runtime:** `nodes/ui-speed-dial.js` registriert die Node bei der gewählten Dashboard-Gruppe, -Seite oder UI-Basis. `lib/protocol.js` validiert jede Konfiguration gegen `lib/schema.json`; `lib/state.js` hält den gemeinsamen Zustand und die Overrides pro Socket. Der gemeinsame Snapshot liegt im Dashboard-Datastore, gezielte Overrides nur im Arbeitsspeicher.
- **Browser:** Das Bundle nutzt die Vue-Laufzeit des Dashboards (Vue ist extern, keine zweite Kopie). Beim Mount erzeugt das Widget eine kleine Vue-Unteranwendung, installiert dort PrimeVue 4 im Unstyled-Modus und zeichnet den Dial mit eigenem, gekapseltem CSS; weder das Dashboard noch andere Widgets werden umgestylt. Beim Unmount werden Listener, teleportierte Elemente und die Unteranwendung entfernt.
- **Vertrauensgrenze:** Ein Klick sendet nur die Aktions-ID. Der Server liest Payload und Topic aus der für diesen Client gültigen Konfiguration und prüft Sichtbarkeit und Aktivierung erneut; ein manipulierter Browser kann keine beliebige Ausgabe einschleusen.
- **Lizenzen:** PrimeVue 4.5.5 und PrimeIcons 7.0.0 stehen unter MIT und sind mitgeliefert (siehe `resources/THIRD-PARTY-NOTICES.txt` im Paket). PrimeVue 5 wird nicht verwendet, weil dessen Lizenzbedingungen diese Art der Weiterverteilung nicht erlauben.

## Tests und Handprüfung

| Befehl | Prüft |
|---|---|
| `npm test` | Protokoll, Zustand, Runtime-Klicks, Client-Zustände und alle Function-Nodes des Referenz-Flows gegen das echte Protokoll (offline) |
| `npm run test:integration` | Echte Node-RED-Runtime mit dem gepackten Paket |
| `npm run test:browser` | Editor und Dashboard in Chrome (Playwright): Editor-Dialog, beide Menüvarianten, Kreisformen, Targeting mit zwei Clients, Seitenwechsel, mobile Ansicht, Aufräumen |
| `npm run test:examples` | Referenz-Flow in der isolierten Runtime: Deploy, Inject-Nodes ausführen, Ergebnis im Browser prüfen |
| `npm run test:i18n` | Editor-Dialog, Validierungsmeldungen und Node-Hilfe auf Englisch und Deutsch im echten Editor |

Die Browser-Tests benötigen Chrome unter `C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Quellen

- [Node-RED Dokumentation](https://nodered.org/docs/)
- [FlowFuse Dashboard Dokumentation](https://dashboard.flowfuse.com/)
- [FlowFuse Dashboard Widget-Entwicklung](https://dashboard.flowfuse.com/contributing/widgets/)
- [PrimeVue 4 Dokumentation](https://primevue.org/)
- [PrimeIcons](https://primefaces.org/primeicons/)
- [Node.js Release-Seite](https://nodejs.org/en/about/previous-releases)

Lizenz: [MIT](LICENSE).
