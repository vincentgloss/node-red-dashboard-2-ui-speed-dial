# node-red-dashboard-2-ui-speed-dial

A dynamic floating action button for [FlowFuse Dashboard](https://dashboard.flowfuse.com/) (Dashboard 2.0). The package adds the Node-RED node `ui-speed-dial`. It shows PrimeIcons actions as a speed dial or a labelled menu and sends the payload configured on the server when an action is selected.

*[Deutsche Version](README.de.md)*

## Requirements

| Component | Supported | Notes |
|---|---|---|
| Node-RED | **3.1 or newer** (verified: 3.1.15, 4.0.9, 4.1.x, 5.0.8) | Node-RED 5 itself needs Node.js 22.9 or newer |
| Node.js | **18 or newer** (verified: 18, 20, 22, 24) | whatever your Node-RED version requires |
| FlowFuse Dashboard (`@flowfuse/node-red-dashboard`) | **1.23.0 or newer, below 2.0** (verified: 1.23.0, 1.24.0, 1.33.0; server side also 1.25.0, 1.30.0) | Dashboard 2.0 is not supported yet |
| Vue | nothing to install | the widget uses the Vue runtime bundled with the Dashboard (3.5 or newer, which is the case from Dashboard 1.23) |

Older Dashboard versions do **not** work: up to 1.22.1 the bundled Vue 3.4 lacks `useId`, which PrimeVue 4 needs, and up to 1.21.0 the server API for widget state is missing. The full test matrix and what was not verified are listed under [Compatibility details](#compatibility-details). The package declares these ranges in `package.json` (`node-red.version`, `peerDependencies`, `engines`), so Node-RED refuses to load the node on an unsupported Node-RED version and npm warns about an unsupported Dashboard.

## Installation

In your Node-RED user directory (usually `~/.node-red`):

```sh
npm install node-red-dashboard-2-ui-speed-dial
```

Restart Node-RED and drag `ui-speed-dial` from the palette category "Dashboard 2" onto a group, page or UI base. The flows in [`examples/`](examples/) can be imported with **Import → Clipboard**.

To install a locally built package instead (for example for testing), build a tarball with `npm pack` and install that file:

```sh
npm install /path/to/node-red-dashboard-2-ui-speed-dial-1.0.0.tgz
```

The widget uses the Vue runtime provided by the Dashboard; the package does not bring a second global Vue application. PrimeVue 4.5.5 is embedded as an isolated, unstyled widget application with its own scoped styles; PrimeIcons 7.0.0 and all required files ship inside the package (no CDN requests at runtime). See [How it works](#how-it-works).

## Editor configuration

The editor stores `actions` and the three sections `button`, `menu` and `theme`. Section fields that are not given get the defaults from the tables below. Every action needs a unique `id` and a `payload`; `null` is a valid payload. Optional action fields that are not given get their defaults. Unknown fields and duplicate IDs are rejected.

**Using the editor:** number fields show a reset button (↺) as soon as the value differs from the default. Actions can be collapsed and expanded individually (plus *Collapse all* / *Expand all*; this is only an editor view and is not saved) and duplicated with the copy button directly below the original; the copy gets a new unique ID (`<id>-copy`, `<id>-copy-2`, …). Every color field has a color picker. Field help is available in every tab.

### Button (`button`)

| Field | Type | Default | Allowed values |
|---|---|---:|---|
| `icon` | icon | `pi-plus` | empty string or a name of the form `pi-…` |
| `label` | string | `""` | up to 160 characters |
| `tooltip` | string | `Actions` | up to 240 characters |
| `background` | color | `#2563eb` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | color | `#ffffff` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `size` | number | `56` | 11 to 96 (very small values are hard to hit on touch screens) |
| `radius` | number | `28` | 0 to 48 |
| `visible` | boolean | `true` | `true` or `false` |
| `enabled` | boolean | `true` | `true` or `false` |
| `position` | enum | `bottom-right` | `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `offsetX` | number | `24` | 0 to 500; ignored when the position is centered horizontally |
| `offsetY` | number | `24` | 0 to 500; ignored when the position is centered vertically |

### Menu (`menu`)

| Field | Type | Default | Allowed values |
|---|---|---:|---|
| `shape` | enum | `linear` | `linear`, `circle`, `semi-circle`, `quarter-circle` (only with `mode: speed-dial`; `menu` is always linear) |
| `direction` | enum | `up` | depends on `shape`: `linear` and `semi-circle` → `up`, `down`, `left`, `right`; `quarter-circle` → `up-left`, `up-right`, `down-left`, `down-right`; `circle` ignores the value |
| `radius` | number | `0` | 0 to 500 px distance of the actions from the button center (circle shapes only); `0` = smallest radius without overlap |
| `mode` | enum | `speed-dial` | `speed-dial`, `menu` |
| `gap` | number | `8` | 0 to 48 |
| `duration` | number | `150` | 0 to 1000 milliseconds |
| `closeOnSelect` | boolean | `true` | `true` or `false` |
| `overlay` | boolean | `false` | `true` or `false` |
| `showLabels` | boolean | `false` | `true` or `false` |
| `actionSize` | number | `44` | 44 to 80 |

### Theme (`theme`)

| Field | Type | Default | Allowed values |
|---|---|---:|---|
| `mode` | enum | `auto` | `light`, `dark`, `auto` |
| `background` | color | `""` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | color | `""` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `radius` | number | `12` | 0 to 40 |
| `shadow` | boolean | `true` | `true` or `false` |
| `zIndex` | number | `2000` | 1 to 10000 |

### Action (`actions[]`)

| Field | Type | Default | Allowed values |
|---|---|---:|---|
| `id` | id | required | 1–64 characters, starts alphanumeric; then `A–Z`, `a–z`, `0–9`, `_`, `.`, `:`, `-`; unique per list |
| `label` | string | `Action` | up to 160 characters |
| `icon` | icon | `pi-circle` | empty string or a name of the form `pi-…` |
| `tooltip` | string | `""` | up to 240 characters |
| `background` | color | `""` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `color` | color | `""` | empty string or `#rgb`, `#rrggbb`, `#rrggbbaa` |
| `topic` | string | not set | up to 240 characters |
| `payload` | JSON | required | native JSON values, including `null` |
| `visible` | boolean | `true` | `true` or `false` |
| `enabled` | boolean | `true` | `true` or `false` |

**Shapes and directions.** `shape` and `direction` have to fit together. A message that only changes `shape` and leaves an incompatible `direction` behind is rejected as a whole (send both fields together). For `semi-circle` and `quarter-circle` the editor only offers the directions that point away from the screen edge or corner of the button position:

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
| `center` | `up`, `down`, `left`, `right` | all four diagonals |

A full circle (`circle`) works best with `position: center`. On a centered axis the offset (`offsetX` / `offsetY`) is ignored.

A quarter circle fits into a screen corner. A semi circle reaches one radius to both sides of the button on the cross axis: with `up`/`down`, `offsetX` should be at least the radius; with `left`/`right`, `offsetY`. A full circle needs one radius of free space on all sides. At runtime the combination of position and direction is not enforced: if a circle shape does not fit into the visible area (for example `circle` at an edge) it is shifted into view as a whole. Linear rows still flip automatically near screen edges. Circle shapes show no labels (`showLabels` only applies to `linear`); the tooltip remains. With only one visible action, `semi-circle` and `quarter-circle` fall back to a short linear row.

**Colors.** Next to every color field the editor offers a color picker (without transparency) and a clear button; values can also be typed as hex, including alpha (`#rrggbbaa`). Color names (CSS or the Vuetify palette) are not accepted because the widget application runs isolated and the Vuetify palette is not reliably available at runtime.

Icon names must be `pi-` followed by lowercase letters, digits or hyphens. A color must have exactly one of the hex lengths above. Numbers must be finite and within the inclusive limits. Action lists may contain at most 100 entries; JSON payloads may be at most 262144 UTF-8 bytes and 32 levels deep.

## Message protocol

The node treats incoming messages as configuration updates and sends no output for them. Metadata such as `_msgid` and `_client` may accompany `payload`. The configuration is validated on the server; invalid messages are discarded with a warning without taking over any partial state.

### Replace and partial updates

Without `command` these forms apply:

```js
// Replace the complete action list; all other configuration values stay the same.
msg.payload = [{ id: "start", label: "Start", payload: { run: true } }]

// Update only the given sections/fields; actions stay the same.
msg.payload = {
  button: { visible: false },
  menu: { direction: "left" },
  theme: { mode: "dark" }
}

// Replace the actions and merge a button field in one update.
msg.payload = {
  actions: [{ id: "stop", payload: null }],
  button: { visible: true }
}
```

An object payload merges the given section fields into the current configuration. A given `actions` list replaces the whole action list. Sections and section fields that are not given stay unchanged. A section has to be an object. There is no `command: "replace"`.

### Patch, remove and reset

```js
msg.command = "patch"
msg.payload = [{ id: "start", label: "Go", visible: false }]

msg.command = "remove"
msg.payload = ["start"]

msg.command = "reset"
```

`patch` changes only the listed fields of existing actions. Fields that are not listed, including `payload`, are kept. `remove` expects action IDs. Both commands reject unknown or duplicate IDs and unknown fields. `reset` restores the original editor configuration; a payload is ignored. A present but unknown `command` is not interpreted as a normal update. All validation happens before the state changes; an error leaves the state completely unchanged.

The `payload` of an action must be present on every complete action. It is stored and sent as a native JSON value and is never guessed from a string at runtime: strings, numbers, booleans, `null`, arrays and plain objects are possible. Values such as `undefined`, `NaN`, functions, cycles or non-JSON objects are invalid. A missing `payload` is an error; `payload: null` is a valid value.

### Shared and targeted updates

Without `_client` a message updates the shared configuration. The server merges the update there according to the rules above, stores the snapshot in the Dashboard datastore and then clears all session-local overrides.

With `_client.socketId`, `_client.clientId` or both, an update targets already connected, fully loaded widget sockets. Both values are combined with AND. `clientId` only matches currently connected sockets with that Dashboard client ID; after a reload the new socket session counts as its own state again, even if the stable client ID stays the same. A user alone is not a valid target. Unknown or disconnected targets are rejected. For targeted updates `ui-speed-dial` has to be enabled in the Dashboard setting **Client Data → Accepts Client Data**.

Targeted changes are kept in memory per socket and discarded when the connection drops. Navigating to another page on the same socket connection keeps the state. `reset` restores the editor configuration for the targeted sockets. Every shared update replaces the shared configuration and clears all targeted overrides, even if the shared update changes only one field.

### Output when an action is selected

A valid selection sends one message with the payload stored on the server:

```js
{
  payload: /* native JSON of the selected action */,
  action: "start",
  topic: "optional/topic" // only if set on the action
}
```

The browser only reports the action ID; payload and `topic` come from the current server-side configuration. `_client` is only added to the output if the Dashboard has **Include Client Data** enabled and a trusted client context exists. The output never contains `speedDialConfig`. Invisible or disabled buttons and actions produce no message.

## Languages

The editor dialog (labels, field help, error messages) and the help in the sidebar are translated into **English** (`en-US`, fallback) and **German** (`de`). The language follows the Node-RED / browser language setting. The texts live in `nodes/locales/<language>/ui-speed-dial.json` (dialog) and `nodes/locales/<language>/ui-speed-dial.html` (help). To add a language, copy both files from `en-US` into a new folder (for example `fr`) and translate them; missing keys fall back to English. Protocol values (`speed-dial`, `top-left`, …), runtime warnings in the Node-RED log and this README are not translated.

## Example flows

| File | Content |
|---|---|
| [`examples/speed-dial-demo.json`](examples/speed-dial-demo.json) | Small demo with several widget instances (page, group, whole UI) |
| [`examples/speed-dial-input-reference.json`](examples/speed-dial-input-reference.json) | Reference of all inputs: one inject and one function node per possibility (87 scenarios in 10 groups, plus a helper function node that remembers the client of the last click) |

After import the reference flow is available at `/speed-dial-reference/reference` and covers:

1. **Replace the action list**: all payload types (string, empty string, number, boolean, object, array, `null`), complete and minimal actions, topics, hidden/disabled actions, plain-text labels, empty list.
2. **Update the configuration**: every field of `button` (icon, label, colors, size 11/96, radius, visibility, enabled, all 9 positions, offsets), `menu` (mode, all shape/direction combinations, radius, gap, duration, close, overlay, labels) and `theme` (mode, colors, radius, shadow, z-index), combined messages and presets for full, half and quarter circles.
3. **Patch**: label/icon/tooltip, every payload type, colors and topic, visibility, enabled, several entries atomically.
4. **Remove**: single, several, empty list.
5. **Reset**.
6. **Client targeting**: by `socketId`, `clientId` or both, targeted patch/remove/reset, broadcast that ends all overrides. Click an action once first so the flow knows the client.
7. **Invalid messages** (26): each only produces a warning in the debug sidebar and leaves the widget unchanged.

The function nodes contain comments with the respective rules. Some of them change the value on every trigger (for example positions or shapes).

## Compatibility details

All rows ran against the packed `.tgz` with the real Node-RED runtime; "full" means the runtime integration test and the browser test (editor and dashboard in Chrome). Tests ran on Windows 10.

| Node.js | Node-RED | Dashboard | Result |
|---|---|---|---|
| 18.20.8 | 3.1.15, 4.0.9 | 1.33.0 | full: OK |
| 20.20.2 | 4.1.16 | 1.23.0, 1.24.0, 1.33.0 | full: OK |
| 22.23.3 | 4.1.16, 5.0.8 | 1.33.0 | full: OK |
| 24.19.0 | 5.0.8 | 1.33.0 | full: OK |
| 24.19.0 | 4.1.0 | 1.25.0, 1.30.0 | runtime: OK (browser not run) |
| 18 / 20 / 24 | 4.1.x | 1.22.0, 1.22.1 | runtime OK, **browser fails** (`useId is not a function`) |
| 24.19.0 | 4.1.0 | 1.0.0 – 1.21.0 | **fails** (server-side widget state API missing) |

Not tested: Node-RED 3.0.x (does not start in the Windows test environment), Node.js 16 or older, Linux and macOS, browsers other than Chrome, Dashboard 2.x. Versions between the verified ones were not run individually. Building from source needs Node.js 22.12 or newer (Vite 8); installing the package does not. The matrix can be reproduced with `node test/compat.cjs <node-red> <dashboard> --browser` (set `SD_NODE` to another Node.js binary to run Node-RED with it).

## How it works

- **Runtime:** `nodes/ui-speed-dial.js` registers the node with the selected Dashboard group, page or UI base. `lib/protocol.js` validates every configuration against `lib/schema.json`; `lib/state.js` holds the shared state and the per-socket overrides. The shared snapshot is stored in the Dashboard datastore, targeted overrides only in memory.
- **Browser:** the bundle uses the Dashboard's Vue runtime (Vue is external, no second copy). On mount the widget creates a small Vue sub-application, installs PrimeVue 4 there in unstyled mode and renders the dial with its own namespaced CSS, so neither the Dashboard nor other widgets are restyled. Unmounting removes listeners, teleported elements and the sub-application.
- **Trust boundary:** a click only sends the action ID. The server looks up payload and topic in the configuration that is valid for that client and checks visibility and enabled state again, so a manipulated browser cannot inject arbitrary output.
- **Licenses:** PrimeVue 4.5.5 and PrimeIcons 7.0.0 are MIT licensed and bundled (see `resources/THIRD-PARTY-NOTICES.txt` in the package). PrimeVue 5 is not used because its license conditions do not allow this kind of redistribution.

## Development, build and tests

```sh
npm install        # installs the build tooling (Node.js 22.12 or newer is required for the build)
npm run build      # builds resources/ui-speed-dial.umd.js and the third-party notices
npm test           # unit tests
npm pack           # builds the package (runs the build via prepack)
```

| Command | Checks |
|---|---|
| `npm test` | protocol, state, runtime clicks, client state and all function nodes of the reference flow against the real protocol (offline) |
| `npm run test:integration` | real Node-RED runtime with the packed package |
| `npm run test:browser` | editor and dashboard in Chrome (Playwright): editor dialog, both menu variants, circle shapes, targeting with two clients, page changes, mobile view, cleanup |
| `npm run test:examples` | reference flow in the isolated runtime: deploy, run inject nodes, verify the result in the browser |
| `npm run test:i18n` | editor dialog, validation messages and node help in English and German in the real editor |
| `node test/compat.cjs <node-red> <dashboard> [--browser]` | compatibility check against a specific Node-RED / Dashboard pair in an isolated directory |

The browser tests need Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Sources

- [Node-RED documentation](https://nodered.org/docs/)
- [FlowFuse Dashboard documentation](https://dashboard.flowfuse.com/)
- [FlowFuse Dashboard widget development](https://dashboard.flowfuse.com/contributing/widgets/)
- [PrimeVue 4 documentation](https://primevue.org/)
- [PrimeIcons](https://primefaces.org/primeicons/)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)

License: [MIT](LICENSE).
