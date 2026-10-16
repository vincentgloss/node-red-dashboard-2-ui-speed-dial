# Speed Dial for FlowFuse Dashboard

A floating action button for [FlowFuse Dashboard 2.0](https://dashboard.flowfuse.com/). Click it and a small menu of actions opens. Every action sends a message into your flow – no template code needed.

*[Deutsche Version](README.de.md)*

## Features

- Floating button in any corner, at an edge or in the center of the screen – or inside a dashboard group
- Actions as a row, a full, half or quarter circle, or as a labelled menu
- Each action sends its own payload (text, number, true/false, JSON or `null`) and an optional topic
- Follows the colors of your Dashboard theme automatically – or use your own colors and sizes
- Icons from [PrimeIcons](https://primevue.org/icons/), [Material Design Icons](https://pictogrammers.com/library/mdi/) (as in the other Dashboard widgets) or your own images (upload or URL)
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

At the top you choose where the button appears: in a group (size picked on the grid like other widgets), floating on one page or on all pages.

| Tab | What you set |
|---|---|
| Actions | The list of actions – icon, label and payload; ID, topic, colors and more under *More options*. IDs are created from the label automatically |
| Appearance | Expandable, clickable live preview that opens the menu with the current settings; position (click on a 3×3 grid), style (row, row with text, menu list, half/quarter/full circle), opening direction (arrows), icon and icon when open (searchable picker), color (inline swatches incl. transparent) and size (S/M/L) |
| Advanced | Fine-tuning: label and tooltip of the button, sizes in px, distances, animation, overlay, shadow, z-index |

Without custom colors the speed dial uses the primary color and surface colors of your Dashboard theme.

### Own icons

In the icon picker, the **Own image** tab lets you upload an SVG/PNG/WebP/GIF/JPG (stored in the flow, up to 16 KB) or link one by address – `https://…` or a path like `/icons/lamp.svg` from the folder configured as `httpStatic` in Node-RED's `settings.js`. Images are tinted in the icon color like the font icons, so single-color symbols with a transparent background (ideally SVG) work best.

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

All message types with examples, every field with its default and the most common mistakes are in the node help (book icon in the Node-RED sidebar), section **Input**.

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
