# Changelog

## 1.0.0 (unreleased)

Initial version.

- `ui-speed-dial` node for FlowFuse Dashboard 2.0 based on PrimeVue 4 (unstyled mode, scoped styles, local PrimeIcons).
- Configurable main button (9 positions), linear / circle / semi-circle / quarter-circle speed dial and labelled menu.
- Static and dynamic actions with typed payloads; replace, update, patch, remove and reset via input messages.
- Shared state and per-client targeting (`msg._client`).
- Editor in three tabs (Actions, Appearance, Advanced) with a size grid for groups, visual position and style pickers, a searchable icon picker, S/M/L sizes, IDs and payloads derived from the label, and plain-language errors at the field; English and German.
- Menu list style (`menu.mode: "menu"`) is a single panel with full-width rows in reading order, distinct from separate labelled buttons.
- Node help with a complete input reference: overview of all message types, copy-ready examples, every field with defaults and ranges, client targeting step by step, common mistakes.
- Configurable icon while the menu is open (`button.closeIcon`, default `pi-times`; empty keeps the normal icon).
- Transparent background option (`#00000000`); the icon then uses the theme primary (button) or text color (actions).
- Interactive, collapsible preview in the Appearance tab: a mock dashboard page in the theme colors where the button opens the menu with the current settings and actions (five examples while there are none).
- Inline color swatches (theme color, 12 suggestions, custom color via the browser dialog, hex field with transparency).
- Follows the Dashboard theme by default (primary color for the button, surface colors for the actions); text and icon colors adapt to custom colors automatically.
- Opening direction `auto` (new default) opens away from the nearest screen edge.
- Icons from PrimeIcons, Material Design Icons (the Dashboard's own set) or own images (upload as data URL up to 16 KB, or `https://…` / root-relative URL), tinted in the icon color.
- Editor reads the schema and icon list from the node settings, no extra request needed.
- Reference flows in `examples/`.
