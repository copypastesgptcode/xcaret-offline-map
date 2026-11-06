# Handoff — 2026-11-05, Codex to Claude

Branch: `codex/arte-wayfinding`. Started from `6cd2c54`. Local review branch. GitHub Pages has not been deployed by this pass. Run `git log -1 --oneline` for the handoff commit.

## What changed

- Arte and México have separate venue views over shared geometry. Twenty identifiable México venues moved out of Arte; ambiguous generic bars/pools still need checking. Keep existing IDs even where their prefix is misleading.
- Fixed Casa associations, removed misleading México labels on Arte restaurants, and merged the former Apapachoa listing into Cosexa. The coordinate is from the old OSM pin and is explicitly approximate. Legacy saved edits merge on startup; existing Cosexa fields take precedence.
- The venue sheet labels direct compass bearings and approximate pins. Edit pin now saves a personal arrival note alongside floor and hours. GPS callbacks and drag completion preserve in-progress text.
- Offline readiness follows service-worker control. Cache v6 cleans up only prior map versions. No basemap paths changed.

## Evidence and limits

[Hotel Casa directory](https://www.hotelxcaretarte.com/en/casas/) for venue associations and Artistas access; [Mexico hotel directory](https://www.hotelxcaret.com/es/hotel-xcaret-mexico/) and [restaurant directory](https://www.hotelxcaret.com/es/restaurantes-hoteles-xcaret/) for correcting resort assignments; [April guest report](https://www.reddit.com/r/Xcaret/comments/1sdo7f9/xcaret_arte_long_review_and_tips_air_canada/) for the former name and elevator ambiguity. Reviewed November 5. A hotel listing establishes the Casa, not an exact coordinate or entrance.

The installed hotel base APK on the Pixel was recognized by REA as an Android archive. A filename scan found no obvious GeoJSON, KML, MBTiles or named floor/route files. This leaves runtime-delivered and encoded assets unexamined. No app assets were copied into this project.

## Next useful work

1. Map lobby to Mercado de San Juan; lobby to the Cosexa guest elevator; then the guest's Casa to Cayuco/pool. For each, record both ends, the floor at every crossing, pedestrian access and the source. Do not join intersecting lines solely because they cross in aerial imagery.
2. Start with the lobby and Mercado: their existing pins are about 257 m and 184 m from the nearest displayed pedestrian polyline, respectively (service roads excluded). Pin error and missing geometry both contribute. Verify the entrance before editing the path.
3. Verify Casa del Patrón's guest entrance before placing a building pin. Audit generic pools/bars and placeholder restroom/towel pins. Improve “Open now” separately: phone time and missing hours currently affect the result.
4. On the property, use Edit pin to capture elevator/entrance notes. These live on that browser origin and device. A future export would make field corrections easier to bring back into the repository.

## Verification

- JS syntax and Git whitespace checks passed.
- Pixel 7, Android Chrome, temporary localhost origin via USB: searched Apapachoa, opened Cosexa, checked Casa and approximation notice, saved an arrival note, delivered a simulated position callback mid-edit, and switched to México to verify pin filtering.
- Stopped the origin server and reloaded on the phone. Verified Arte geometry, lobby marker and persisted Cosexa note. Removed the test note and USB forwards. Real indoor GPS accuracy, compass orientation, on-property routes and an upgrade on the production Pages origin remain untested.
- To repeat locally, run `python -m http.server 8731 --bind 127.0.0.1` from the repo. For Android over USB use `adb reverse tcp:8731 tcp:8731` and open http://localhost:8731 in Chrome. Wait for Saved for offline, stop the server, reload, and check pins and notes before removing the forward.
## Arte map follow-up · 2026-11-05

Codex worked in the separate `codex/arte-visuals` worktree based on 3b88cdb. The previous handoff commit reached GitHub Pages before this pass. Park data and the shared basemap file were left alone. Arte-specific code and styling live in js/arte.js, js/arte-walk.js and css/arte.css. Release cache: xcaret-map-v8-arte.

### Map evidence and design
- data/arte-detail.geojson uses OpenStreetMap's map API for the box -87.1135,20.5850,-87.1065,20.5910 (west,south,east,north), retrieved November 5. The 61 ordinary footways, 13 tagged bridges, 42 stair ways and 15 open canal centerlines retain OSM way IDs. These counts include the shared surroundings. Selected canal culverts are omitted. OSM's mapped lines establish geometry; public access, floor and operating status still require guest verification.
- Aerial reference: Esri World Imagery, zoom 18, tiles x 67638–67642 / y 115745–115748. Three approximate patches of open water and three short potential crossing spans were interpreted from the imagery. The imagery acquisition date is unknown. Aerial pixels are not shipped. Rendered centerline width is an 8 m cartographic estimate where bank outlines are unavailable. Attribution: Esri and imagery providers. The dotted crossings are not routing edges.
- The Hotel Xcaret Arte wordmark is from the hotel's public virtual tour (https://hotel-xcaret-arte.firstview.us/en/amenities-facilities). Original asset: https://hotel-xcaret-arte.firstview.us/storage/app/uploads/public/622/9cf/92b/6229cf92b2794619539243.png.
- Lobby/Mercado directions are landmark-based and available from Path view or the relevant pin sheets. Source: https://www.reddit.com/r/Xcaret/comments/18u2y81/ . Casa associations and Cosexa elevator caveat use the sources above. No turn-by-turn graph connects these places.
- Path view reduces venue pins, explains line styles and can record one personal outdoor GPS walk. Storage is local to the browser origin. Recording skips poor fixes and breaks across time/distance gaps. Reload preserves the saved trail and ends recording. Verify battery use, GPS quality and elevator signage at the resort before promoting a recorded trace into a shared route.

### QA and next session
Desktop Edge at a 393 × 815 mobile viewport, simulated location, Arte/México/park switching, route cards, path symbols, cache and saved walk. Actual Pixel testing of this release is deferred until Dave reconnects it. On the phone, check day/sun contrast, try record → finish → offline reload, check the lobby/Mercado elevator, and compare the three dotted spans with guest-access signs. Claude can keep park edits in separate files and retain the new Arte assets when merging changes to the service-worker precache.

## Casa walks · 2026-11-05

Branch `codex/arte-visuals`, based on published e2a77e9. Release cache v10-walks. Path view and the two home Casa pins now open outbound and return landmark guides. Música and Pirámide each cover Mercado, the main lobby, Cayuco, and Cosexa. Pirámide also covers the Xaak-side bridge to the base of Xpiral. These are assembled itineraries, not surveyed polylines; do not join Casa centers or extrapolate bridge access. The approaches, intermediate forks and entrances still need verification with Dave's tracks and camera clips.

Evidence reviewed November 5:
- Hotel Casa/venue associations: https://www.hotelxcaretarte.com/en/casas/
- Level 3 pedestrian walkway, level 5 lobby and Mercado elevators: https://www.reddit.com/r/Xcaret/comments/18u2y81/ and https://www.atastefortravel.ca/24213-hotel-xcaret-arte-review/
- Mercado arrival landmark: https://mesanotes.com/hotel-xcaret-arte/restaurants/mercado-de-san-juan
- Xaak crossing to the chapel base: https://www.reddit.com/r/Xcaret/comments/1kngp3v/
- Cosexa guest elevator: https://www.reddit.com/r/Xcaret/comments/1sdo7f9/xcaret_arte_long_review_and_tips_air_canada/

Each recorded walk now has its own private localStorage key. Export a selected walk as GPX and pair it with the original camera clips. New points include timestamps. Legacy points retain geometry without invented timestamps. The saved trail from v8 migrates on the same browser origin. Keep the map visible during capture. The next geometry pass should reconcile each user-supplied GPX segment with camera evidence, especially floor transitions and canopy gaps.

QA: isolated mobile-sized desktop Edge, no phone. Tested Casa-pin entry, outbound and return guides, migration, multiple separate recordings with simulated fixes and a time gap, exported GPX XML/segments/timestamps, and saved walks and guides after stopping the server and reloading. On-site GPS, camera alignment and the actual resort junctions remain untested.

Shared Arte pins (v11): Diseño / Rooftop Bar & Snack and Pirámide / Wet Bar each share exact coordinates. Filter first, then show one marker with a place picker per shared coordinate. Keep the venue coordinates and device edits independent. Tested both pairs at zoom 20, individual bar selection, edit dragging, a single search result and offline reload in desktop Edge.

Arte UI v12: compact search header with Map options, one-tap Walks, collision-aware labels, and simplified Casa sheets. Desktop Edge 393 × 815: collapsed header measured 103 CSS pixels. Tested options, guides, Casa sheet with simulated distant location, sun mode, and offline guide reload. Physical Pixel check pending.

## Park data · 2026-11-05 (Claude)

Branch `claude/parks-info`, rebuilt on `505c860` (current main). Only `data/data.json` changed; Arte/México venues and all Arte code/assets left untouched. SW cache bumped `v12-arte-ui` → `v13-parks` (precached data.json changed); Codex's Arte assets retained in the precache list. Not deployed — awaiting Dave.

### What changed (parks only)
- Xcaret 15 → 30 pins: added Coral Reef Aquarium, Orchid/Mushroom farm, Jaguar Island, Sea Turtles, Scarlet Macaws, Caleta cove & beach, an underground-river entrance, Hill of the Chapel cemetery, Hacienda Henequenera, Folk Art Museum, two buffets (La Cocina, La Península), lockers, snorkel/life-jacket rental, first aid. Existing OSM-placed Xcaret pins kept (IDs and coords unchanged).
- Xplor 8 → 9: completed the seven attractions + El Troglodita buffet, lockers, restroom. `closed_days:[0]` (Mon–Sat).
- Xenses 7 → 10: corrected attraction names — the old guesses (Riviera, Lodoxpa, Tugit & Twister, Riverland) are not real Xenses attractions. New set: Rehilete (Pinwheel), El Pueblo, Xensatorium, Dwarfs & Giants, Edén, Lodork, Tobogán. Re-anchored to the satellite-located Pinwheel; the old placeholder cluster sat ~200 m NW of the real park center. `closed_days:[0]`. Dec 13 is a Sunday → Xplor and Xenses both closed.

### Evidence and limits
- Positions: new Xcaret/Xplor/Xenses pins are approximate (`loc:"approx"`, flagged in notes). OSM has almost no Xplor/Xenses geometry; Xcaret OSM has ~18 named attractions (kept), the rest placed by zone. Only the Xenses Rehilete is satellite-located (Esri World Imagery z18, ~20.584652, -87.125831, retrieved 2026-11-05). **No walking paths/routes were added or traced — pins only.**
- Names/hours from official park pages, blog.xcaret.com and general web (reviewed 2026-11-05). Park-level hours applied; "don't invent hours" respected — unverified items flagged.
- Venue IDs: existing Xcaret IDs preserved. Some Xenses IDs changed (xs-riviera/xs-lodoxpa/xs-twister replaced by xs-eden/xs-lodork/xs-tobogan + new xs-rehilete/xs-pueblo/xs-dwarfs) because the old names were wrong; no device-local edits existed on park pins, so no migration added. Add one (like apapachoa→cosexa) if park edits appear later.

### Verification / next
- Verified rendering in the desktop browser pane only (Dave disconnected the Pixel): 5-destination switcher, Xenses pins now over the real structures with correct names, Xcaret 30 pins land on park land (not sea), park-hours/Sunday logic works. Data-only change, JS untouched.
- Untested: on-device (Pixel) load + offline reload + GPS for the parks — deferred until Dave reconnects.
- `data/data.json` is network-first, so park edits propagate without a cache bump; the v13 bump also forces a full re-cache on next SW update.

## Park descriptions + Xplor zones · 2026-11-05 (Claude)

Branch `claude/parks-data`, continuing from `467d288`. Parks only; Arte/México venues and all Arte code/assets untouched. SW cache bumped `v13-parks` → `v14-parks`.

### What changed
- Every park venue (Xcaret/Xplor/Xenses, 49 total) gained a short plain-English `desc` field — one sentence saying what the attraction is, so the Spanish names are understandable at a tap. Rendered as a tinted `.desc` card in the venue sheet, just under the badges. Generic: Arte venues have no `desc`, so their sheet is unchanged.
- Xplor now shows three soft green **zone tints** so attractions read as grouped areas instead of a flat field of dots. Classes `xpzone-n/c/s` in `data/basemap.geojson` (area `xplor`), styled in `app.js` STYLE + `--xp-*` tokens (css + JS fallback). Zones are **schematic groupings of the approximate pins by proximity** (north = zip-lines/buggies, center = entrance/dining/splash, south = cave rivers), NOT surveyed boundaries. Drawn first → sit under buildings/paths/pins.

### Files / scripts
- `data/data.json` (desc on park venues), `data/basemap.geojson` (3 xpzone polygons prepended), `js/app.js` (desc render + STYLE/fallback), `css/styles.css` (`.desc` + `--xp-*` vars), `sw.js` (v14).
- Rerunnable builders in scratchpad: `parks/add_desc.py` (id→desc map) and `parks/xplor_zones.py` (strips old `xpzone*` then regenerates). Both idempotent; safe to rerun on a fresh main for a clean merge.

### Verification / next
- Verified in the desktop browser pane at mobile width: Xplor shows three distinct green zones; venue sheet shows the desc card (e.g. Stalactite River → "Paddle a raft by hand through a flooded cave of stalactites"). Data + parks-local JS/CSS only.
- **Verified on Pixel 7 (Android Chrome, localhost over USB `adb reverse`):** Xplor's three zone tints are distinguishable in both light and dark themes; the desc card renders and is readable in both. Offline test passed — removed the port forward, cold-killed Chrome, relaunched: the app loaded fully from the `v14` service-worker cache, switched to Xplor (zones present), and opened a venue with its description. Confirms the new data.json/basemap are cached and work offline. Theme + USB forward restored/removed after.
- Zone shapes/greens are decorative and easy to retune if Dave wants crisper separation or labels.

## Combined resort and park review — 2026-11-06
Based on the merged parks release 54c68ee. Verified 100 unique venue IDs across five destinations, all 49 park descriptions, and Xplor zone geometry. Use explicit base-layer drawing order across all areas so fills sit below buildings and paths.

Walks and Path view now accept GPSLogger GPX track files locally, including a practice walk away from the resort. The import retains track segments and valid timestamps; malformed coordinates create a break. Built-in recording still uses its Arte geofence. Unknown hours stay out of Open now. All five areas calculate hours and closed days in America/Cancun, including overnight windows. Search ignores accents.

Release v15 precaches data, scripts and markup together. Bump the service-worker cache for every asset/data release. The app reads the installed copies during normal navigation, including when the network is slow. Checked desktop Edge at phone width with Tokyo timezone, Saturday/Sunday in Cancun, overnight hours, all five map views, and a local-server-off reload. Imported a two-segment GPX fixture offline, checked the timestamp, rejected malformed XML, retained the practice walk after reload and opened an Xplor description offline. The Pixel was disconnected. Still needed: exercise the Android document picker with an actual GPSLogger export, and ground-check the route forks and approximate entrances.

## Find places and return home · 2026-11-06
Based on 5fb2ed0. Search now lists matching venues within the selected area and active filters. Tap a result to open its pin sheet. Empty results identify the area; changing areas clears the previous search. Mercado, the main lobby, Cosexa and Cayuco offer the existing return guide directly from their own sheets, using the Casa chosen in Walks. This release changes how to find directions; it adds no surveyed geometry. Record/import/export remain in Path view, leaving the walking guide focused on navigation. Dave intends to collect in GPSLogger and hand the GPX files to the agents when convenient.
QA in desktop Edge at phone width: alias and accent-insensitive searches, selection via keyboard, empty state, dismiss, Xplor search and descriptions, switching Casas while returning, and a Mercado-to-Pirámide guide opened after stopping the origin server. Physical Android check pending. Release cache v16-find-walk.
