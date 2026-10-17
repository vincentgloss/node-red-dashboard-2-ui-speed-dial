# Speed Dial – Floating Action Button für FlowFuse Dashboard

Ein schwebender Aktionsbutton (Floating Action Button, FAB) mit Speed-Dial-Menü für [FlowFuse Dashboard 2.0](https://dashboard.flowfuse.com/), das Dashboard für Node-RED. Ein Klick öffnet ein kompaktes Menü mit Aktionen – als Reihe, Menüliste oder Kreis –, und jede Aktion sendet eine Nachricht in deinen Flow.

Die Einrichtung geschieht vollständig im Node-RED-Editor, mit Live-Vorschau und ohne eine Zeile Code. Wer mehr braucht, kann zur Laufzeit jeden Teil aus dem Flow heraus ändern.

[English](README.md) | **Deutsch**

![Ein Dashboard mit dem Speed Dial: unten rechts eine geöffnete Reihe von Aktionen, neben dem Seitentitel eine Glocke mit Zähler](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/dashboard-home.png)

---

**Inhalt**

[Funktionen](#funktionen) ·
[Voraussetzungen](#voraussetzungen) ·
[Installation](#installation) ·
[Erste Schritte](#erste-schritte) ·
[Wo er erscheint](#wo-er-erscheint) ·
[Stile](#stile) ·
[Der Editor](#der-editor) ·
[Icons](#icons) ·
[Farben und Theme](#farben-und-theme) ·
[Zähler](#zähler) ·
[Steuerung aus dem Flow](#steuerung-aus-dem-flow) ·
[Ausgabe](#ausgabe) ·
[Beispiele](#beispiele) ·
[Fehlerbehebung](#fehlerbehebung) ·
[Entwicklung](#entwicklung) ·
[Lizenz](#lizenz)

---

## Funktionen

| Bereich | Was du bekommst |
|---|---|
| **Platzierung** | In einer Dashboard-Gruppe, schwebend über der Seite oder in der Kopfzeile des Dashboards – auf einer Seite, auf ausgewählten Seiten oder auf allen Seiten |
| **Stile** | Reihe, Reihe mit Text, Menüliste, Halbkreis, Viertelkreis, Vollkreis |
| **Aktionen** | Bis zu 100 pro Button. Jede sendet ihren eigenen Payload (Text, Zahl, true/false, JSON oder `null`) und optional ein Topic |
| **Icons** | 314 PrimeIcons, über 7.000 Material Design Icons (dieselben wie bei den anderen Dashboard-Widgets) oder eigene Bilder |
| **Aussehen** | Übernimmt automatisch das Dashboard-Theme. Eigene Farben, vollständige Transparenz, Größen, Eckenrundung, Schatten |
| **Zähler** | Eine kleine Zahl oder ein kurzer Text am Button, zum Beispiel die Anzahl offener Meldungen |
| **Steuerung zur Laufzeit** | Aktionen ersetzen, ändern oder entfernen und jede Einstellung per Nachricht ändern – für alle oder nur für einen Browser |
| **Editor** | Live-Vorschau, visuelle Auswahl, Icon-Auswahl mit Suche, verständliche Fehlermeldungen, Deutsch und Englisch |
| **Barrierefreiheit** | Tastaturbedienung, Beschriftungen für Screenreader, berücksichtigt „Bewegung reduzieren“ |

## Voraussetzungen

| Software | Version |
|---|---|
| Node-RED | 3.1 oder neuer |
| FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) | 1.23 oder neuer |

Entwickelt und getestet mit Node-RED 5.0 und FlowFuse Dashboard 1.33.

## Installation

**Im Node-RED-Editor (empfohlen)**

1. Das Menü oben rechts öffnen und **Palette verwalten** wählen.
2. In den Tab **Installation** wechseln und nach `@vincentgloss/node-red-dashboard-2-ui-speed-dial` suchen.
3. Auf **Installieren** klicken.

**Über die Kommandozeile**

Im Node-RED-Benutzerverzeichnis (meist `~/.node-red`) ausführen und Node-RED anschließend neu starten:

```sh
npm install @vincentgloss/node-red-dashboard-2-ui-speed-dial
```

> **Hinweis:** Läuft Node-RED als Dienst unter einem eigenen Benutzer, muss im Verzeichnis dieses Benutzers installiert werden. `systemctl show nodered -p User -p ExecStart` zeigt, welches verwendet wird.

## Erste Schritte

1. **speed dial** aus dem Bereich *Dashboard 2* der Palette in den Flow ziehen.
2. Öffnen und **Anzeigen** (in einer Gruppe, schwebend oder in der Kopfzeile) sowie **Auf** (einer Seite, ausgewählten Seiten oder allen Seiten) wählen.
3. Im Tab **Aktionen** auf **Aktion hinzufügen** klicken, eine Beschriftung eingeben, ein Icon wählen und den Payload eintragen.
4. Optional: Im Tab **Aussehen** Position, Stil, Icon, Farbe und Größe wählen. **Vorschau** aufklappen und auf den Button klicken, um es auszuprobieren.
5. Den Ausgang mit dem restlichen Flow verbinden und deployen.

Ein Klick auf eine Aktion sendet:

```json
{
  "payload": { "scene": "evening" },
  "topic": "scene",
  "action": "evening-scene"
}
```

`msg.action` ist die ID der Aktion – ideal für einen *Switch*-Node. `msg.topic` ist nur gesetzt, wenn die Aktion eines hat.

## Wo er erscheint

![Wo der Speed Dial erscheinen kann: in einer Gruppe, schwebend über der Seite oder in der Kopfzeile des Dashboards](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/placements.de.png)

Der Editor stellt zwei Fragen: **Anzeigen** und **Auf**.

| Anzeigen | Auf | Typischer Einsatz |
|---|---|---|
| **Im Layout einer Gruppe** | der Seite der Gruppe | Ein Button zwischen anderen Widgets. Die Größe wird wie bei jedem Widget über das Raster gewählt. |
| **Schwebend über der Seite** | einer, ausgewählten oder allen Seiten | Der klassische Aktionsbutton in einer Bildschirmecke. Neun Positionen, einstellbarer Randabstand. |
| **In der Kopfzeile** | einer, ausgewählten oder allen Seiten | Neben dem Seitentitel oder rechts in der Kopfzeile, zwischen deren übrigen Inhalten. Das Menü öffnet sich nach unten. |

- **Ausgewählte Seiten** zeigt den Button nur auf den angehakten Seiten, etwa auf *Start* und *Licht*, aber nicht auf *Einstellungen*.
- In der Kopfzeile passt ein kleiner, transparenter Button am besten. Der Editor bietet das mit einem Klick an.
- Ist die Kopfzeile in den Dashboard-Einstellungen ausgeblendet, schwebt ein Kopfzeilen-Button stattdessen in der passenden oberen Ecke.

![In der Kopfzeile: eine Glocke mit Zähler neben dem Seitentitel und rechts ein Kontomenü im Stil Menüliste](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/dashboard-header.png)

![In einer Gruppe: ein Button mit Beschriftung, der in der Gruppe eine Reihe beschrifteter Aktionen öffnet](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/dashboard-settings.png)

## Stile

![Die sechs Stile: Reihe, Reihe mit Text, Menüliste, Halbkreis, Viertelkreis, Kreis](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/styles.de.png)

| Stil | So sieht er aus | Geeignet für |
|---|---|---|
| **Reihe** | Runde Icon-Buttons in einer Linie | Wenige Aktionen mit eindeutigen Icons |
| **Reihe mit Text** | Einzelne Buttons mit Icon und Beschriftung | Aktionen, die ein Wort zur Erklärung brauchen |
| **Menüliste** | Ein gemeinsamer Kasten mit beschrifteten Zeilen, wie ein Dropdown-Menü | Längere Listen, Einstellungen, Kontomenüs |
| **Halbkreis** | Icon-Buttons im Bogen um den Button | Buttons am Rand oder in der Mitte |
| **Viertelkreis** | Icon-Buttons im Viertelbogen | Buttons in einer Ecke |
| **Kreis** | Icon-Buttons rund um den Button | Buttons in der Bildschirmmitte |

Die **Öffnungsrichtung** wird automatisch gewählt – weg vom nächsten Bildschirmrand. Sie lässt sich auch selbst festlegen. Passt eine Reihe nicht, weicht sie zur Seite mit dem meisten Platz aus.

![Ein Viertelkreis mit farbigen Aktionen; die Seite ist abgedunkelt, solange das Menü offen ist](https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/dashboard-lights.png)

## Der Editor

Der Einstellungsdialog hat drei Tabs. Jedes Feld ist zusätzlich in der Hilfe der Node erklärt (Buch-Symbol in der Node-RED-Seitenleiste).

<img src="https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/editor-appearance.de.png" width="430" alt="Der Tab Aussehen: Live-Vorschau mit geöffnetem Menü, Positionsraster, Stil-Karten und Öffnungsrichtung">

### Aktionen

Die Liste der Menüeinträge. Per Ziehen sortieren, mit der Kopier-Schaltfläche duplizieren.

| Feld | Bedeutung |
|---|---|
| **Icon** | Aus der Icon-Auswahl (siehe [Icons](#icons)) |
| **Beschriftung** | Text der Aktion. Je nach Stil neben dem Icon oder als Tooltip |
| **Payload** | Wert von `msg.payload` beim Klick: Text, Zahl, true/false oder JSON |
| *Weitere Optionen:* **ID** | Eindeutiger Name, wird als `msg.action` gesendet. Bei neuen Aktionen automatisch aus der Beschriftung erzeugt und danach stabil |
| *Weitere Optionen:* **Topic, Tooltip** | Optionales `msg.topic` und Hover-Text |
| *Weitere Optionen:* **Farbe, Icon-Farbe** | Eigene Farben für diese Aktion |
| *Weitere Optionen:* **Sichtbar, Aktiviert** | Ausgeblendete oder deaktivierte Aktionen senden nichts |

### Aussehen

| Feld | Bedeutung |
|---|---|
| **Vorschau** | Eine kleine Dashboard-Seite in den Farben des Themes. Ein Klick auf den Button öffnet das Menü mit allen aktuellen Einstellungen. Solange es keine Aktionen gibt, erscheinen fünf Beispiele. Die Vorschau sendet nie etwas. |
| **Position** | Feld im 3 × 3-Raster anklicken. Entfällt in der Kopfzeile. |
| **Stil** | Einer der sechs [Stile](#stile) |
| **Öffnungsrichtung** | Pfeile oder *Automatisch*. Angeboten werden nur Richtungen, die zu Stil und Position passen. |
| **Icon, Icon beim Öffnen** | Das Icon des Buttons und das Icon bei geöffnetem Menü (standardmäßig ein X, oder das normale Icon beibehalten) |
| **Farbe** | Dashboard-Farbe, transparent, zwölf Vorschläge oder eine beliebige Farbe |
| **Größe** | Klein, Mittel oder Groß |

### Erweitert

| Bereich | Einstellungen |
|---|---|
| **Haupt-Button** | Beschriftung neben dem Icon, Tooltip, Zähler und seine Farben, Icon- und Textfarbe, genaue Größe, Eckenrundung, Randabstand (ein Wert oder seitlich und oben/unten getrennt), sichtbar, aktiviert |
| **Menü** | Kreisradius, Abstand zwischen Aktionen, Größe der Aktionen, Animationsdauer, nach Auswahl schließen, Seite abdunkeln solange offen |
| **Darstellung** | Eckenrundung der Aktionen, Schatten, Z-Index |

## Icons

Die Icon-Auswahl hat drei Reiter:

| Quelle | Inhalt | Wert |
|---|---|---|
| **PrimeIcons** | 314 Icons, im Paket enthalten | `pi-…` |
| **Material Design** | Über 7.000 Icons, derselbe Satz, den das Dashboard selbst verwendet | `mdi-…` |
| **Eigenes Bild** | Eine SVG-, PNG-, WebP-, GIF- oder JPG-Datei – hochgeladen oder verlinkt | Bildadresse |

**Eigene Bilder** lassen sich

- **hochladen** – das Bild wird direkt im Flow gespeichert (höchstens 16 KB), kein Server-Ordner nötig, oder
- **per Adresse einbinden** – `https://…` oder ein Pfad wie `/icons/lampe.svg`, der auf den Ordner zeigt, der in der `settings.js` von Node-RED als `httpStatic` eingetragen ist.

Eigene Bilder werden genau wie die Schrift-Icons in der Icon-Farbe eingefärbt. Am besten eignen sich einfarbige Symbole mit transparentem Hintergrund, idealerweise als SVG. Ein Foto erschiene als einfarbige Fläche.

## Farben und Theme

Ohne eigene Farben folgt der Speed Dial dem Dashboard-Theme: Der Button nutzt die Primärfarbe, die Aktionen die Flächen- und Textfarbe der Gruppen. Wird das Theme geändert, ändert sich der Speed Dial mit.

Jedes Farbfeld bietet:

- **Theme-Farbe** – das erste Feld (*Dashboard*, *Standard* oder *Automatisch*)
- **Transparent** – das karierte Feld. Als Hintergrund bleibt nur das Icon: keine Fläche, kein Rahmen, kein Schatten.
- **Zwölf Vorschläge** und das **Pipetten-Feld** für jede beliebige Farbe
- **Ein Hex-Feld** zum Eintippen, auch für halbtransparente Farben wie `#2563eb80`

Die Icon- und Textfarbe passt sich automatisch an: dunkel auf hellen Farben, weiß auf dunklen.

## Zähler

Eine kleine Plakette oben rechts am Button, etwa für offene Meldungen oder ungelesene Nachrichten.

- Eine Zahl oder ein kurzer Text bis 6 Zeichen, zum Beispiel `3` oder `!`
- Leer oder `0` blendet ihn aus, Zahlen über 99 erscheinen als `99+`
- Standardmäßig rot (die Fehlerfarbe des Themes), auf Wunsch mit eigenen Farben

Ein Startwert lässt sich unter **Erweitert** eintragen, meist hält ihn aber der Flow aktuell:

```js
msg.payload = { button: { badge: 3 } };
return msg;
```

## Steuerung aus dem Flow

Nachrichten an den Eingang ändern den Speed Dial zur Laufzeit. Sie erzeugen keine Ausgabe. Änderungen per Nachricht gelten bis zum nächsten Deploy oder Neustart von Node-RED.

| Ziel | Nachricht |
|---|---|
| Alle Aktionen ersetzen | `msg.payload = [ {…}, {…} ]` |
| Aussehen oder Verhalten ändern | `msg.payload = { button: {…}, menu: {…}, theme: {…} }` |
| Beides in einer Nachricht | `msg.payload = { actions: [ … ], button: {…} }` |
| Einzelne Aktionen ändern | `msg.command = "patch"`, `msg.payload = [ { id: "…", … } ]` |
| Aktionen entfernen | `msg.command = "remove"`, `msg.payload = [ "id", … ]` |
| Zurück zum Editor-Stand | `msg.command = "reset"` |
| Nur für einen Browser | zusätzlich `msg._client` mitsenden |

```js
// Alle Aktionen ersetzen – Pflicht sind nur id und payload
msg.payload = [
    { id: "on",  label: "An",  icon: "mdi-lightbulb-on",  payload: true },
    { id: "off", label: "Aus", icon: "mdi-lightbulb-off", payload: false }
];

// Nur einzelne Einstellungen ändern – alles andere bleibt, wie es ist
msg.payload = { button: { icon: "mdi-bell", badge: 2 }, menu: { shape: "semi-circle", direction: "auto" } };

// Einzelne Aktionen ändern
msg.command = "patch";
msg.payload = [{ id: "off", label: "Ausschalten", enabled: false }];

// Aktionen entfernen
msg.command = "remove";
msg.payload = ["off"];

// Zurück zu den Einstellungen aus dem Editor
msg.command = "reset";
```

<details>
<summary><strong>Nur für einen Browser ändern</strong></summary>

<br>

Ohne `msg._client` gilt eine Änderung für alle Browser. Mit `msg._client` gilt sie nur für einen Browser-Tab (`socketId`) oder für alle Tabs eines Browsers (`clientId`). Das funktioniert mit allen Nachrichten oben, auch mit `patch`, `remove` und `reset`.

Dafür sind zwei Einstellungen im Bereich *Client Data* der Dashboard-Einstellungen nötig:

1. **Accept Client Data** – `ui-speed-dial` freigeben, sonst werden Nachrichten mit `_client` abgewiesen.
2. **Include Client Data** – damit ein Klick `msg._client` mitliefert und der Flow weiß, welchem Browser er antworten soll.

```js
// Genau dem Browser antworten, der gerade geklickt hat (msg kommt vom Ausgang des Speed Dial)
return {
    _client: msg._client,
    command: "patch",
    payload: [{ id: msg.action, enabled: false }]
};
```

Der Browser muss in diesem Moment verbunden sein. Eine spätere Nachricht ohne `_client` verwirft alle Einzeländerungen. Verlässt ein Browser die Seite, wird seine Änderung verworfen.

</details>

<details>
<summary><strong>Feldreferenz: Aktion</strong></summary>

<br>

| Feld | Typ | Standard | Hinweise |
|---|---|---|---|
| `id` | string | – | **Pflicht.** Eindeutig; Buchstaben, Ziffern und `_ . : -`, höchstens 64 Zeichen. Wird als `msg.action` gesendet |
| `payload` | beliebig | – | **Pflicht.** Wird als `msg.payload` gesendet. `null` ist erlaubt |
| `label` | string | `"Action"` | Reiner Text, kein HTML, höchstens 160 Zeichen |
| `icon` | string | `"pi-circle"` | Siehe [Icons](#icons) |
| `tooltip` | string | `""` | Hover-Text |
| `topic` | string | – | Wird als `msg.topic` gesendet, falls gesetzt |
| `background` | string | `""` | Hex-Farbe; `""` = Theme |
| `color` | string | `""` | Hex-Farbe; `""` = automatisch |
| `visible` | boolean | `true` | Ausgeblendete Aktionen erscheinen nicht und senden nichts |
| `enabled` | boolean | `true` | Deaktivierte Aktionen erscheinen ausgegraut und senden nichts |

</details>

<details>
<summary><strong>Feldreferenz: button</strong></summary>

<br>

| Feld | Typ | Standard | Hinweise |
|---|---|---|---|
| `icon` | string | `"pi-plus"` | Siehe [Icons](#icons); `""` für kein Icon |
| `closeIcon` | string | `"pi-times"` | Icon bei geöffnetem Menü; `""` behält das normale Icon |
| `label` | string | `""` | Text neben dem Icon |
| `tooltip` | string | `"Actions"` | Hover-Text und Name für Screenreader |
| `badge` | number oder string | `""` | Zähler; `""` und `0` blenden ihn aus, über 99 erscheint `99+`, Text bis 6 Zeichen |
| `badgeBackground` | string | `""` | `""` = Fehlerfarbe des Themes |
| `badgeColor` | string | `""` | `""` = automatisch |
| `background` | string | `""` | `""` = Primärfarbe des Themes; `"#00000000"` = transparent |
| `color` | string | `""` | `""` = automatisch |
| `size` | number | `56` | 11 – 96 px |
| `radius` | number | `48` | 0 – 48 px; 48 ist rund |
| `position` | string | `"bottom-right"` | `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `offsetX`, `offsetY` | number | `24` | Abstand zum Rand, 0 – 500 px |
| `visible` | boolean | `true` | |
| `enabled` | boolean | `true` | |

</details>

<details>
<summary><strong>Feldreferenz: menu</strong></summary>

<br>

| Feld | Typ | Standard | Hinweise |
|---|---|---|---|
| `mode` | string | `"speed-dial"` | `"menu"` = Stil Menüliste |
| `shape` | string | `"linear"` | `linear`, `semi-circle`, `quarter-circle`, `circle` |
| `showLabels` | boolean | `false` | Beschriftungen neben den Icons (Reihe mit Text) |
| `direction` | string | `"auto"` | `auto`; Reihen und Halbkreise `up`, `down`, `left`, `right`; Viertelkreise `up-left`, `up-right`, `down-left`, `down-right` |
| `gap` | number | `8` | Abstand zwischen Aktionen, 0 – 48 px |
| `actionSize` | number | `44` | 44 – 80 px |
| `radius` | number | `0` | Kreisradius, 0 – 500 px; `0` = automatisch |
| `duration` | number | `150` | Animation, 0 – 1000 ms |
| `closeOnSelect` | boolean | `true` | Menü nach einem Klick schließen |
| `overlay` | boolean | `false` | Seite abdunkeln, solange das Menü offen ist |

Die Stile des Editors entsprechen diesen Feldern: Reihe = `{ mode: "speed-dial", shape: "linear", showLabels: false }`, Reihe mit Text = dasselbe mit `showLabels: true`, Menüliste = `{ mode: "menu" }`, Kreise = `shape: "semi-circle"`, `"quarter-circle"` oder `"circle"`.

</details>

<details>
<summary><strong>Feldreferenz: theme</strong></summary>

<br>

| Feld | Typ | Standard | Hinweise |
|---|---|---|---|
| `mode` | string | `"auto"` | `auto` = Dashboard-Theme; `light` oder `dark` = feste Farben. Nur per Nachricht |
| `background` | string | `""` | Gemeinsamer Hintergrund aller Aktionen. Nur per Nachricht |
| `color` | string | `""` | Gemeinsame Textfarbe aller Aktionen. Nur per Nachricht |
| `radius` | number | `12` | Eckenrundung der Aktionen, 0 – 40 px |
| `shadow` | boolean | `true` | |
| `zIndex` | number | `2000` | 1 – 10000; erhöhen, wenn andere Elemente den Button verdecken |

**Wertformate**

- **Farben:** `#rgb`, `#rrggbb` oder `#rrggbbaa`. `""` = Theme-Farbe, `"#00000000"` = transparent. Farbnamen wie `"red"` werden nicht angenommen.
- **Icons:** `"pi-…"`, `"mdi-…"`, eine Bildadresse (`"/icons/lampe.svg"`, `"https://…"`), ein eingebettetes Bild (`"data:image/…;base64,…"`, höchstens 16 KB) oder `""`.

</details>

<details>
<summary><strong>Wenn eine Nachricht nicht wirkt</strong></summary>

<br>

Eine fehlerhafte Nachricht wird komplett verworfen – es ändert sich nichts – und die Debug-Seitenleiste zeigt eine Warnung mit dem Grund. Häufige Ursachen:

- Ein Tippfehler im Feldnamen, zum Beispiel `colour` statt `color`
- Zahlen als Text (`"56"` statt `56`) oder außerhalb des erlaubten Bereichs
- Farbnamen statt Hex-Werten; Icon-Namen ohne `pi-` oder `mdi-`
- `shape` geändert, aber die bisherige `direction` passt nicht – beides senden oder `direction: "auto"` verwenden
- `patch` oder `remove` mit einer ID, die es nicht gibt, oder doppelte IDs
- Eine Aktion ohne `payload` (`null` ist erlaubt, fehlen darf es nicht)
- `_client` ohne *Accept Client Data* oder für einen Browser, der nicht verbunden ist

</details>

## Ausgabe

Ein Klick auf eine sichtbare, aktivierte Aktion sendet eine Nachricht:

| Eigenschaft | Typ | Inhalt |
|---|---|---|
| `msg.payload` | beliebig | Der Payload der Aktion |
| `msg.action` | string | Die ID der Aktion |
| `msg.topic` | string | Das Topic der Aktion, falls gesetzt |
| `msg._client` | object | Der Browser, in dem geklickt wurde – nur mit aktivem *Include Client Data* im Dashboard |

## Beispiele

Import in Node-RED über **Menü → Import → Beispiele → @vincentgloss/node-red-dashboard-2-ui-speed-dial**.

| Beispiel | Was es zeigt |
|---|---|
| **speed-dial-showcase** | Drei Seiten – *Home*, *Lights* und *Settings* –, die zum Dashboard hinzugefügt werden: ein Kontomenü und eine Glocke mit laufendem Zähler in der Kopfzeile, ein klassischer schwebender Button mit eigenem Bild als Icon, ein Viertelkreis mit farbigen Aktionen und ein Button in einer Gruppe. Jede Seite erklärt, was man ausprobieren kann. |
| **speed-dial-demo** | Mehrere Speed Dials auf verschiedenen Seiten und in einer Gruppe, mit Nachrichten zum Ersetzen, Ändern, Entfernen und Zurücksetzen sowie für einzelne Browser |
| **speed-dial-input-reference** | Für jede mögliche Eingangsnachricht ein fertiger Function-Node, auch für Zähler, Icons, Transparenz und die Fehlerfälle |

## Verhalten und Barrierefreiheit

- Das Menü schließt bei Escape und bei einem Klick außerhalb.
- Tastatur: Tab setzt den Fokus auf den Button, Pfeiltasten, Pos1 und Ende wechseln zwischen den Aktionen, Enter oder Leertaste wählt aus.
- Die Buttons haben Namen für Screenreader; der Zähler ist Teil des Button-Namens.
- Bei der Systemeinstellung „Bewegung reduzieren“ wird nicht animiert.
- Beschriftungen und Tooltips werden immer als reiner Text angezeigt, nie als HTML.

<img src="https://raw.githubusercontent.com/vincentgloss/node-red-dashboard-2-ui-speed-dial/main/docs/dashboard-mobile.png" width="300" alt="Der Speed Dial auf dem Smartphone">

## Fehlerbehebung

<details>
<summary><strong>Der Button erscheint nicht</strong></summary>

<br>

- **Anzeigen** und **Auf** prüfen: Bei *Ausgewählten Seiten* erscheint der Button nur auf den angehakten Seiten.
- *Sichtbar* unter **Erweitert** prüfen – das kann auch eine Nachricht geändert haben.
- Verdecken andere Elemente den Button, den **Z-Index** unter **Erweitert** erhöhen.

</details>

<details>
<summary><strong>Der Kopfzeilen-Button schwebt stattdessen in einer Ecke</strong></summary>

<br>

Die Kopfzeile ist in den Dashboard-Einstellungen ausgeblendet. Ein Kopfzeilen-Button schwebt dann in der passenden oberen Ecke. Wird die Kopfzeile wieder eingeblendet, sitzt er wieder dort.

</details>

<details>
<summary><strong>Die Farben folgen nicht meinem Theme</strong></summary>

<br>

Es ist eine eigene Farbe gesetzt. Das erste Farbfeld (*Dashboard*, *Standard* oder *Automatisch*) wählen, um wieder die Theme-Farbe zu verwenden. Wurde die Node mit einer früheren Version angelegt oder stammt sie aus einem Beispiel-Flow, kann ein Hinweis unter **Erweitert** gespeicherte Design-Werte auflisten, die das Theme überschreiben – mit einer Schaltfläche zum Entfernen.

</details>

<details>
<summary><strong>Die ausgewählten Seiten fehlen nach dem Import eines Flows</strong></summary>

<br>

*Ausgewählte Seiten* speichert Seiten-IDs. Wird ein Flow als Kopie importiert, vergibt Node-RED den Seiten neue IDs. Den Speed Dial öffnen und die Seiten erneut anhaken.

</details>

## Entwicklung

```sh
npm install
npm run build   # baut das Dashboard-Widget nach resources/
npm pack        # baut und erzeugt das installierbare Paket
```

<details>
<summary><strong>Projektstruktur</strong></summary>

<br>

| Pfad | Inhalt |
|---|---|
| `nodes/ui-speed-dial.js` | Node-RED-Laufzeit: Anmeldung beim Dashboard, Eingangsnachrichten, Zustand pro Browser |
| `nodes/ui-speed-dial.html` | Editor: Dialog, Auswahlelemente, Vorschau, Prüfung |
| `nodes/locales/` | Editor-Texte und Hilfe der Node, Deutsch und Englisch |
| `lib/schema.json` | Alle Felder, Standardwerte und Grenzen – genutzt von Laufzeit und Editor |
| `lib/protocol.js` | Prüfung und Protokoll der Eingangsnachrichten |
| `lib/state.js` | Gemeinsamer Zustand und Zustand pro Browser |
| `ui/` | Dashboard-Widget (Vue 3, PrimeVue SpeedDial im Unstyled-Modus) |
| `scripts/assets.cjs` | Erzeugt die Icon-Listen und kopiert die Icon-Schrift für den Editor |
| `examples/` | Beispiel-Flows |

</details>

## Lizenz

[MIT](LICENSE). Enthält [PrimeVue](https://primevue.org/) und [PrimeIcons](https://primevue.org/icons/), beide unter MIT-Lizenz. Die Material Design Icons stellt das installierte FlowFuse Dashboard bereit.
