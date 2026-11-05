# Xcaret Map — offline PWA

A mobile-first, fully-offline replacement map for **Hotel Xcaret Arte**, **Xcaret**, **Xplor** and **Xenses**.
Open the link, add to home screen, and it works with no connection: map, pins, hours — everything is cached by a service worker on first load.

## Features
- Custom basemap hand-styled from **OpenStreetMap** data (no tile server, no Xcaret artwork) — jungle green, sand paths, turquoise water.
- 82 category pins (food, bars, pools, restrooms, towels, lockers, shows, transport, attractions, casas, services). Closed places fade to grey.
- "Open now" filter, category chips, and search.
- GPS dot with heading cone; straight-line bearing + distance to a selected place (not turn-by-turn).
- Bottom sheet: English/Spanish name, open/closed + hours, level badge, distance, "Point me there", "Edit pin".
- **Draggable pins and editable hours**, saved on your device (localStorage).
- Resort ↔ park switcher. Light / dark / high-contrast "sun" themes.

## ⚠️ Data accuracy
Hours and positions were compiled from OpenStreetMap, the official Hotel Xcaret app, and official/third-party sites. **Treat anything flagged "approx" / "unverified" as a starting point and confirm on arrival** — the app lets you fix pins and hours on-device.
- **Verified** hours (from the app): Cosexa, Mercado de San Juan, Arenal, Xaak.
- **Xplor & Xenses pins are hand-placed** (OSM has almost nothing there) — drag to fix. Xenses is **closed Sundays**.
- **Floor levels (L1/L3/L5)** aren't in any public source — fill them in on-site via *Edit pin*.

## Tech
Static site: HTML + CSS + vanilla JS + Leaflet (vendored) + bundled GeoJSON + Figtree (bundled). Service worker precaches everything. Hosted on GitHub Pages.

Map data © OpenStreetMap contributors (ODbL).
