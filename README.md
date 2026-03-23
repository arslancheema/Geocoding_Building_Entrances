# Tokyo Geocoding Building Outline Demo

This is a lightweight side-by-side web demo for Google Maps Geocoding, focused on Tokyo.

The left map shows a normal geocode result.

The right map uses the Geocoding API v4 `SearchDestinations` flow and draws:

- building outline polygons from `buildings[]`
- entrance markers from `entrances[]`
- preferred entrances with a distinct color and size

## Run locally

This version uses a tiny local Node server because the enhanced building-outline flow should be proxied server-side.

### Start the server

```bash
node server.js
```

Then open [http://localhost:4173](http://localhost:4173).

## API setup

For local development, the app reads the key from `server-config.json`, which is gitignored.

For deployment, set the environment variable `GOOGLE_MAPS_API_KEY`.

Enable these APIs on that Google Cloud project:

- Maps JavaScript API
- Geocoding API
- Geocoding API v4 / SearchDestinations access for the project

## Notes

- The demo is focused on Tokyo by default and includes Tokyo presets.
- Google documents that building outline and entrance coverage varies by region and place type.
- The enhanced side uses the Geocoding API `SearchDestinations` endpoint at `v4beta`.
- If one preset returns no entrances, try a different Tokyo landmark or a precise street address.

## Deploy

The easiest path is Railway or Render.

Set these values in the hosting dashboard:

- Start command: `npm start`
- Environment variable: `GOOGLE_MAPS_API_KEY=AIzaSyDRS9N2tJyoBUVOUEklad-mBIIhWpZNBZw`

After deployment, restrict that production key to your deployed URL in Google Cloud.

## Reference

- [Google Maps Platform: Building outlines and entrances](https://developers.google.com/maps/documentation/geocoding/building-attributes)
