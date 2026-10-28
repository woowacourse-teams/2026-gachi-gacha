# Navigation tab icon notice

The navigation tab vector paths are from Google Material Design Icons and are
used under the Apache License 2.0.

- Upstream: https://github.com/google/material-design-icons
- License: https://www.apache.org/licenses/LICENSE-2.0.txt
- Style: Material Icons, baseline, 24px
- Trade/exchange: `src/action/cached/materialicons/24px.svg`
- Map: `src/maps/map/materialicons/24px.svg`
- Search: `src/action/search/materialicons/24px.svg`

The original 24x24 source SVG files and the runtime path geometry in
`tabIcons.ts` are kept locally. The Android app changes only size and
active/inactive color at render time and never loads icons from the network.
