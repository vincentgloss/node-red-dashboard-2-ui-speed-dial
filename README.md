# Speed Dial for FlowFuse Dashboard

A floating action button for [FlowFuse Dashboard 2.0](https://dashboard.flowfuse.com/). Click it and a small menu of actions opens. Every action sends a message into your flow – no template code needed.

*[Deutsche Version](README.de.md)*

## Features

- Floating button in any corner, at an edge or in the center of the screen – or inside a dashboard group
- Actions as a row, a full, half or quarter circle, or as a labelled menu
- Each action sends its own payload (text, number, true/false, JSON or `null`) and an optional topic
- Icons from [PrimeIcons](https://primevue.org/icons/), your own colors, sizes and light/dark theme
- Change actions and appearance at runtime with simple messages
- Works on phones and tablets and can be used with the keyboard
- Editor in English and German

## Requirements

- Node-RED 3.1 or newer
- FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) 1.23 or newer

## Installation

Install `node-red-dashboard-2-ui-speed-dial` with the **Manage palette** dialog in Node-RED, or run this in your Node-RED user directory (usually `~/.node-red`) and restart Node-RED:

```sh
npm install node-red-dashboard-2-ui-speed-dial
```

> If Node-RED runs as a service under its own user, install it in that user's directory. `systemctl show nodered -p User -p ExecStart` shows which one is used.

## Getting started

1. Drag **speed dial** from the *Dashboard 2* section of the palette into your flow.
2. Choose where it appears: on one page, on all pages or inside a group.
3. Add your actions on the **Actions** tab. Give each one a label, an icon and a payload.
4. Connect the output to the rest of your flow and deploy.

Clicking an action sends:

```json
{
  "payload": { "name": "evening", "brightness": 40 },
  "topic": "scene",
  "action": "evening-scene"
}
```

`msg.action` is the ID of the action, `msg.topic` is only set if you entered one.

## Settings

| Tab | What you set |
|---|---|
| General | Page, all pages or group |
| Button | Icon, label, colors, size, position on screen |
| Menu | Row, circle or labelled list, opening direction, animation, overlay |
| Actions | The list of actions – collapse, reorder and duplicate them |
| Theme | Light, dark or automatic, colors, corner radius |

Every field is explained in the help of the node (the book icon in the Node-RED sidebar).

## Changing the menu from your flow

Send a message to the node's input. Nothing is sent to the output when you do this.

```js
// Replace all actions
msg.payload = [
    { id: "on",  label: "On",  icon: "pi-power-off", payload: true },
    { id: "off", label: "Off", icon: "pi-ban",       payload: false }
];

// Change only some settings
msg.payload = { button: { icon: "pi-bolt", background: "#dc2626" }, menu: { shape: "circle" } };

// Change single actions
msg.command = "patch";
msg.payload = [{ id: "off", label: "Turn off", enabled: false }];

// Remove actions
msg.command = "remove";
msg.payload = ["off"];

// Back to the settings from the editor
msg.command = "reset";
```

Invalid messages are ignored as a whole and show a warning in the debug sidebar.

To change the menu for **one browser only**, send `msg._client` from a previous click of that browser along, and allow this node under *Client Data → Accept Client Data* in the dashboard settings.

Changes made by messages last until Node-RED restarts or the node is deployed again.

## Examples

Import them with **Menu → Import → Examples → node-red-dashboard-2-ui-speed-dial**:

- **speed-dial-demo** – several speed dials on different pages and in a group
- **speed-dial-input-reference** – a ready-made function node for every possible input message, from simple updates to error cases

## Languages

The editor and the node help are available in English and German. Any other language shows English.

## Building from source

```sh
npm install
npm run build   # or: npm pack
```

## License

[MIT](LICENSE). Includes [PrimeVue](https://primevue.org/) and [PrimeIcons](https://primevue.org/icons/), both MIT licensed.
