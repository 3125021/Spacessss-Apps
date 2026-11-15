# Global Time

An interactive single-view planetary **Observatory** built for the **NASA Space Apps Challenge: Dancing with the SARs**. **Global Time** brings together live multi-agency Synthetic Aperture Radar (SAR) Earth observations and a deep-time planetary timeline (`4.543 Ga – Present`) on an interactive 3D spherical globe—while keeping modern satellite radar observations scientifically distinct from paleogeographic reconstructions.

---

## Key Features

- **Unified Observatory Workspace:** Opens directly into a three-column planetary console with an interactive 3D Earth globe, live telemetry & scientific dossiers, and a bottom Time Machine scrubber.
- **Interactive 3D Spherical Globe:**
  - Drag to rotate across latitude and longitude, toggle orbital auto-spin, cycle zoom, and inspect live cursor `(LAT, LON)` coordinates.
  - Toggle planetary layers: **Atmosphere**, **Grid** (graticule), **Plates** (tectonic arcs), **Thermal**, **Sites**, and **Modern Continents**.
- **Modern Continents (`ON / OFF`) Switch:**
  - Available in the modern era (**Satellite Observation Time** and **Holocene `0.000 Ga`**), rendering Natural Earth 110m coastlines directly onto the 3D sphere surface with distinct colors per continent (North America, South America, Europe, Africa, Asia, Oceania, Antarctica) and dark bathymetric oceans.
  - Defaults to `OFF` and automatically disengages in pre-Holocene epochs so paleogeographic reconstructions remain unmodified.
- **Dual-Mode Time Machine (Strictly Separated Data Domains):**
  - **Geological Time (`4.54 Ga – Present`):** Explore 9 epochs (*Hadean Magma Ocean* through *Holocene*), smooth `requestAnimationFrame` auto-sweep playback, interpolated physical parameters (temperature, pressure, day length, solar luminosity, sea-level offset, geodynamo strength), atmospheric composition (`O₂`, `CO₂`, `N₂`), 18 historical field sites, and the **Compare Epochs** side-by-side dual-globe modal.
  - **Satellite Observation Time (`1995 – Present`):** Inspect 6 multi-agency SAR case studies (*NISAR*, *UAVSAR*, *Sentinel-1*, *ALOS PALSAR*, *RADARSAT / RCM*, *SAOCOM*) across **Flooding**, **Vegetation**, **Wildfire**, **Deformation**, and **Glacier** phenomena, plus a **Satellite Observation Era (`1995 – 2026`)** milestone bar.
- **Live Regional SAR Scanning & EONET Hazards:**
  - Displays live open natural hazard pins from **NASA EONET v3** on the globe.
  - **Scan Viewport Region** queries live **ASF Search GeoJSON** and **NASA CMR** granules around the current globe center and projects returned orbital swath polygons onto the 3D sphere.
- **Before / After SAR Comparator Modal:**
  - Split-curtain quicklook comparator slider for pre-event vs. post-event radar imagery.
  - Custom latitude/longitude and SAR platform search (`SENTINEL-1`, `UAVSAR`, `ALOS`, `RADARSAT-1`, `NISAR`), EONET hazard quick-picks, optional session-only **NASA Earthdata Login** Bearer token verification, and direct **Project on 3D Globe** projection.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Motion
- **3D Globe & Geography:** Custom HTML5 Canvas per-pixel 3D spherical renderer + `world-atlas` (`countries-110m.json`) & `topojson-client`
- **Backend Proxy:** Node.js + Express (`server.ts`) running Vite middleware in development and static `dist/` in production

---

## Data Sources & APIs

### Actively Queried Live Endpoints
- **NASA Earthdata Common Metadata Repository (CMR):** Live granule and collection metadata queries (`cmr.earthdata.nasa.gov`), including provisional NISAR collections (`NISAR_L2_GCOV_PROVISIONAL_V1`, `NISAR_L2_GUNW_PROVISIONAL_V1`, `NISAR_L2_GOFF_PROVISIONAL_V1`, `NISAR_L3_SME2_PROVISIONAL_V1`), UAVSAR, ALOS PALSAR, and RADARSAT-1.
- **Alaska Satellite Facility (ASF DAAC) Search GeoJSON API:** Live swath polygons, acquisition metadata, and quicklook PNG browse imagery (`api.daac.asf.alaska.edu`) for Sentinel-1, ALOS PALSAR, UAVSAR, and RADARSAT-1.
- **NASA EONET v3 API:** Live rolling 180-day open natural hazard events (`eonet.gsfc.nasa.gov/api/v3/events`).
- **Natural Earth 110m (`world-atlas`):** Bundled local geographic boundaries for the **Modern Continents** spherical rendering mode.

### Scientific Case Studies & Partner Documentation
- **NASA-ISRO NISAR** (Data User Guide, StoryMaps & Applications White Papers)
- **NASA/JPL UAVSAR** (Airborne L-Band Portal & UAVSAR Postcards)
- **ESA Copernicus Sentinel-1** (via ASF DAAC)
- **JAXA ALOS PALSAR** (via ASF DAAC & NASA CMR)
- **Canadian Space Agency (CSA) RADARSAT-1 & RADARSAT Constellation Mission (RCM / EODMS)**
- **CONAE Argentina SAOCOM-1A / 1B Catalog**

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` if you want to customize runtime variables:
```env
# Optional: supply a NASA Earthdata Login Bearer token for protected L2/HDF5 product links.
# Public ASF GeoJSON search, NASA CMR metadata, and NASA EONET v3 work without a token.
EARTHDATA_TOKEN=""
```

### Running Locally
Start the full-stack Express + Vite server on port `3000`:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Scripts
- `npm run dev` — Start development server (`tsx server.ts`) on port `3000`
- `npm run build` — Build production frontend bundle (`vite build`)
- `npm start` — Run production server (`node server.ts`)
- `npm run lint` — Run TypeScript type check (`tsc --noEmit`)

---

## Backend API Routes

- `GET /api/sar/health` — Operational check and configured upstream endpoint list
- `GET /api/sar/search` — Queries ASF Search GeoJSON API and NASA CMR Granules API by coordinates, radius, platform, and date window
- `GET /api/sar/collections` — Lists live ASF-hosted NISAR and high-usage SAR collections from NASA CMR
- `GET /api/sar/events` — Fetches active natural hazard events from NASA EONET v3
- `GET /api/sar/browse` — SSRF-allowlisted proxy for official NASA/JPL/ASF browse quicklook imagery
- `POST /api/sar/verify-token` — Validates a session-only NASA Earthdata Login Bearer token against NASA CMR without persisting it to disk

---

## Note on AI Usage

All globe telemetry, geological epoch parameters, SAR swath footprints, and live satellite queries inside **Global Time** are deterministic and powered directly by local scientific datasets and official NASA/ASF REST APIs. No machine learning or LLM inference runs inside the application at runtime.
