# Xcaret Map — offline PWA

A mobile-first, fully-offline replacement map for **Hotel Xcaret Arte**, **Xcaret**, **Xplor** and **Xenses**.
Open the link, add to home screen, and it works with no connection: map, pins, hours — everything is cached by a service worker on first load.

## Features
- Custom basemap hand-styled from **OpenStreetMap** data (bundled geometry) — jungle green, sand paths, turquoise water.
- Category pins (food, bars, pools, restrooms, towels, lockers, shows, transport, attractions, casas, services). Closed places fade to grey.
- “Open now” uses Cancún time. Places with unknown hours stay out of the filter. Search accepts accented or unaccented names.
- Import a GPSLogger GPX from **Path view → Import GPX**, give it a name, and view it offline. Track segments and available timestamps are retained. Saved walks stay in the browser where you import them.
- GPS dot with heading cone; straight-line bearing + distance to a selected place (not turn-by-turn).
- Bottom sheet: English/Spanish name, open/closed + hours, level badge, distance, "Compass bearing", "Edit pin".
- **Draggable pins and editable hours**, saved on your device (localStorage).
- Separate Arte, neighboring México, and park views. Light / dark / high-contrast "sun" themes.

## ⚠️ Data accuracy
Hours and positions were compiled from OpenStreetMap, the official Hotel Xcaret app, and official/third-party sites. **Treat anything flagged "approx" / "unverified" as a starting point and confirm on arrival** — the app lets you fix pins and hours on-device.
- **Verified** hours (from the app): Cosexa, Mercado de San Juan, Arenal, Xaak.
- **Xplor & Xenses pins are hand-placed** (OSM has almost nothing there) — drag to fix. Xenses is **closed Sundays**.
- **Floor levels and entrances** need location-specific verification. Use *Edit pin* to save a floor and your own arrival note on this device.

## Tech
Static site: HTML + CSS + vanilla JS + Leaflet (vendored) + bundled GeoJSON + Figtree (bundled). Service worker precaches everything. Hosted on GitHub Pages.

Map data © OpenStreetMap contributors (ODbL).
