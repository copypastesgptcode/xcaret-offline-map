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
