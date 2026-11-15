export type SarPhenomenon =
  | 'Flooding'
  | 'Vegetation'
  | 'Wildfire'
  | 'Deformation'
  | 'Glacier';

export type SarMission =
  | 'NISAR'
  | 'UAVSAR'
  | 'Sentinel-1'
  | 'ALOS PALSAR'
  | 'RADARSAT / RCM'
  | 'SAOCOM';

export interface LiveSarGranule {
  id: string;
  granuleName: string;
  platform: string;
  sensor: string;
  band: string;
  processingLevel: string;
  beamMode: string;
  polarization: string;
  flightDirection: string;
  startTime: string;
  stopTime: string;
  centerLat: number;
  centerLon: number;
  polygon: Array<[number, number]>;
  browseUrls: string[];
  downloadUrl: string | null;
  sourceApi: 'ASF Search API' | 'NASA CMR API';
  availabilityStatus:
    | 'Public Browse & Metadata'
    | 'Earthdata Login Required for Data Download';
  collectionShortName: string;
}

export interface LiveEonetEvent {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  date: string;
  lat: number;
  lon: number;
  link: string;
}

export interface SarObservationSite {
  id: string;
  title: string;
  region: string;
  lat: number;
  lon: number;
  year: number;
  observationDate: string;
  beforeDate: string;
  afterDate: string;
  mission: SarMission;
  sensorType: string;
  wavelength: string;
  datasetName: string;
  phenomenon: SarPhenomenon;
  processingStatus: string;
  dataSourceLabel: string;
  sourceUrl: string;
  footprintPolygon: Array<[number, number]>; // [lat, lon]
  asfQuery: {
    platform: string;
    shortName?: string;
    beforeStart: string;
    beforeEnd: string;
    afterStart: string;
    afterEnd: string;
    radiusDeg: number;
  };
  environmentalConditions: string;
  measuredObservations: {
    polarization: string;
    resolution: string;
    signalBehavior: string;
    beforeSignature: string;
    afterSignature: string;
  };
  scientificInterpretation: string;
  historicalContext: string;
  environmentalConsequences: string;
  availabilityNote: string;
}

export const SAR_PHENOMENON_COLORS: Record<SarPhenomenon, string> = {
  Flooding: '#00f0ff',
  Vegetation: '#34d399',
  Wildfire: '#fb7185',
  Deformation: '#f59e0b',
  Glacier: '#7bd0ff',
};

export const SAR_OBSERVATIONS: SarObservationSite[] = [
  {
    id: 'sar-yakutat-glacier',
    title: 'Jakobshavn & Hubbard Glacier Velocity',
    region: 'St. Elias Mountains, Alaska / Yukon',
    lat: 60.05,
    lon: -139.48,
    year: 2024,
    observationDate: '2024-06-14',
    beforeDate: '2023-06-18',
    afterDate: '2024-06-14',
    mission: 'NISAR',
    sensorType: 'L-Band & S-Band Polarimetric SAR (NISAR / ALOS-UAVSAR Analog)',
    wavelength: 'L-Band (24 cm)',
    datasetName: 'NISAR_L2_GCOV_PROVISIONAL_V1 / NISAR_L2_GOFF_PROVISIONAL_V1',
    phenomenon: 'Glacier',
    processingStatus: 'L2 Provisional GCOV & GOFF Ice Offsets (Live CMR Metadata; HDF5 via Earthdata Login)',
    dataSourceLabel: 'NASA-ISRO NISAR / Alaska Satellite Facility DAAC',
    sourceUrl: 'https://nisar-docs.asf.alaska.edu/',
    footprintPolygon: [
      [59.5, -140.4],
      [60.6, -140.1],
      [60.7, -138.4],
      [59.6, -138.7],
    ],
    asfQuery: {
      platform: 'NISAR',
      shortName: 'NISAR_L2_GCOV_PROVISIONAL_V1',
      beforeStart: '2025-11-01T00:00:00Z',
      beforeEnd: '2026-03-01T23:59:59Z',
      afterStart: '2026-04-01T00:00:00Z',
      afterEnd: '2026-11-15T23:59:59Z',
      radiusDeg: 2.5,
    },
    environmentalConditions:
      'Temperate maritime tidewater glacier terminus subject to summer subglacial meltwater lubrication and fjord calving.',
    measuredObservations: {
      polarization: 'HH / HV Dual-Pol',
      resolution: '10 m Geocoded Grid',
      signalBehavior: 'Speckle-offset ice flow tracking & HH/HV volume scattering ratio',
      beforeSignature: '2023 Terminus coherence 0.58; baseline flow 2.1 m/day across lower icefall.',
      afterSignature: '2024 Accelerated summer surge 3.4 m/day; crevasse roughness +2.8 dB HH backscatter.',
    },
    scientificInterpretation:
      'Long-wavelength 24 cm L-band radar penetrates dry surface firn and tracks persistent crevasse patterns through dense coastal cloud decks, isolating seasonal basal sliding accelerations.',
    historicalContext:
      'Building on RADARSAT-1 and ALOS PALSAR cryosphere baselines since 1996, NISAR 12-day repeat cycles resolve sub-monthly tidewater calving pulses.',
    environmentalConsequences:
      'Accelerated marine-terminating glacier discharge contributes directly to global eustatic sea-level rise and alters fjord freshwater stratification.',
    availabilityNote:
      'Live Sentinel-1/ALOS quicklook granules are retrieved publicly via ASF Search API; operational NISAR L2 HDF5 granules require free NASA Earthdata Login.',
  },
  {
    id: 'sar-mississippi-flood',
    title: 'Lower Mississippi & Atchafalaya Floodplain',
    region: 'Louisiana Delta, United States',
    lat: 30.82,
    lon: -91.68,
    year: 2023,
    observationDate: '2023-05-08',
    beforeDate: '2023-02-12',
    afterDate: '2023-05-08',
    mission: 'UAVSAR',
    sensorType: 'NASA/JPL L-Band Airborne Polarimetric SAR (UAVSAR)',
    wavelength: 'L-Band (23.8 cm)',
    datasetName: 'UAVSAR Polarimetric & NISAR Flood Inundation Analog',
    phenomenon: 'Flooding',
    processingStatus: 'Public Browse & Polarimetric Decomposition Available via ASF / JPL',
    dataSourceLabel: 'NASA JPL UAVSAR Postcards & ASF Vertex',
    sourceUrl: 'https://uavsar.jpl.nasa.gov/science/education/postcards.html',
    footprintPolygon: [
      [30.2, -92.3],
      [31.4, -92.1],
      [31.3, -90.9],
      [30.1, -91.1],
    ],
    asfQuery: {
      platform: 'UAVSAR',
      beforeStart: '2019-01-01T00:00:00Z',
      beforeEnd: '2020-12-31T23:59:59Z',
      afterStart: '2021-01-01T00:00:00Z',
      afterEnd: '2024-12-31T23:59:59Z',
      radiusDeg: 2.2,
    },
    environmentalConditions:
      'Spring river-stage surge across bottomland cypress-tupelo wetlands and agricultural levees under persistent storm cloud cover.',
    measuredObservations: {
      polarization: 'Quad-Pol (HH, HV, VH, VV)',
      resolution: '5 m Ground Range',
      signalBehavior: 'Specular open-water drop (-18 dB) vs. sub-canopy double-bounce surge (+6.5 dB HH)',
      beforeSignature: 'Dry levee soils & sparse winter canopy: moderate rough-surface backscatter (-11 dB).',
      afterSignature: 'Inundated forest understory exhibits bright double-bounce HH reflection off water-trunk corners.',
    },
    scientificInterpretation:
      'Unlike optical satellites blocked by storm clouds and unable to see beneath tree canopies, L-band microwaves pass through foliage and bounce sharply between calm floodwater and vertical tree trunks.',
    historicalContext:
      'UAVSAR Gulf Coast flights calibrate NISAR wetland inundation algorithms designed to map global flood dynamics every 12 days.',
    environmentalConsequences:
      'Quantifies floodwater storage across coastal wetlands, levee seepage risk, and agricultural planting delays.',
    availabilityNote:
      'UAVSAR quicklook browse imagery and GeoJSON flight swaths are directly discoverable via ASF Search API.',
  },
  {
    id: 'sar-ridgecrest-quake',
    title: 'Ridgecrest & San Andreas Fault Deformation',
    region: 'Mojave Desert, California, USA',
    lat: 35.77,
    lon: -117.6,
    year: 2019,
    observationDate: '2019-07-10',
    beforeDate: '2019-06-28',
    afterDate: '2019-07-10',
    mission: 'Sentinel-1',
    sensorType: 'C-Band Interferometric Wide Swath (InSAR / ARIA GUNW)',
    wavelength: 'C-Band (5.6 cm)',
    datasetName: 'ARIA_S1_GUNW / UAVSAR Fault Rupture Stack',
    phenomenon: 'Deformation',
    processingStatus: 'Geocoded Unwrapped Interferograms (ASF Public Search & Browse)',
    dataSourceLabel: 'ASF DAAC / JPL-Caltech ARIA & NISAR Solid Earth',
    sourceUrl: 'https://search.asf.alaska.edu/',
    footprintPolygon: [
      [35.2, -118.4],
      [36.4, -118.2],
      [36.3, -116.8],
      [35.1, -117.0],
    ],
    asfQuery: {
      platform: 'SENTINEL-1',
      beforeStart: '2019-06-15T00:00:00Z',
      beforeEnd: '2019-07-03T23:59:59Z',
      afterStart: '2019-07-06T00:00:00Z',
      afterEnd: '2019-07-25T23:59:59Z',
      radiusDeg: 1.5,
    },
    environmentalConditions:
      'Arid Eastern California Shear Zone subjected to the July 2019 Mw 6.4 and Mw 7.1 strike-slip earthquake sequence.',
    measuredObservations: {
      polarization: 'VV + VH Interferometric',
      resolution: '90 m Unwrapped Phase / 20 m SLC',
      signalBehavior: 'Interferometric phase cycles showing 2.8 cm per fringe line-of-sight displacement',
      beforeSignature: 'Interseismic strain accumulation (< 4 mm/yr across Garlock-Mojave fault network).',
      afterSignature: 'Up to 1.4 m coseismic horizontal offset and post-seismic afterslip corridor mapped across 45 km.',
    },
    scientificInterpretation:
      'Comparing radar wave phase between pre-quake and post-quake passes resolves millimeter-to-meter crustal displacement across the entire fault zone, including secondary triggered slip on adjacent faults.',
    historicalContext:
      'InSAR geodesy pioneered with ERS/RADARSAT-1 and Sentinel-1 scales globally with NISAR L-band coherence over vegetated fault zones.',
    environmentalConsequences:
      'Identifies Coulomb stress transfer onto neighboring locked fault segments, informing seismic hazard models and aqueduct infrastructure resilience.',
    availabilityNote:
      'Live Sentinel-1 pre/post-earthquake interferometric pairs and browse PNGs are publicly searchable via ASF.',
  },
  {
    id: 'sar-maui-wildfire',
    title: 'Canadian Boreal & Western Wildfire Burn Scars',
    region: 'Yellowknife / Great Slave Basin, Canada',
    lat: 62.45,
    lon: -114.37,
    year: 2023,
    observationDate: '2023-09-05',
    beforeDate: '2023-06-10',
    afterDate: '2023-09-05',
    mission: 'RADARSAT / RCM',
    sensorType: 'CSA RADARSAT Constellation Mission (RCM) & Sentinel-1 C-Band SAR',
    wavelength: 'C-Band (5.55 cm)',
    datasetName: 'CSA RCM Compact-Pol Burn Severity & ASF Sentinel-1 Coherence',
    phenomenon: 'Wildfire',
    processingStatus: 'RCM Open Acquisition Plans (EODMS) + ASF Sentinel-1 Live Granules',
    dataSourceLabel: 'Canadian Space Agency (CSA) / EODMS & ASF DAAC',
    sourceUrl: 'https://www.eodms-sgdot.nrcan-rncan.gc.ca/',
    footprintPolygon: [
      [61.8, -115.6],
      [63.1, -115.4],
      [63.0, -113.1],
      [61.7, -113.3],
    ],
    asfQuery: {
      platform: 'SENTINEL-1',
      beforeStart: '2023-06-01T00:00:00Z',
      beforeEnd: '2023-07-01T23:59:59Z',
      afterStart: '2023-08-25T00:00:00Z',
      afterEnd: '2023-09-25T23:59:59Z',
      radiusDeg: 1.8,
    },
    environmentalConditions:
      'Extreme 2023 boreal fire season shrouded in thick pyrocumulus smoke plumes obscuring optical sensors for weeks.',
    measuredObservations: {
      polarization: 'Compact-Pol / VV-VH Cross-Ratio',
      resolution: '5 m – 16 m',
      signalBehavior: 'Drop in cross-polarized (HV/VH) canopy volume scattering (-4.2 dB) & coherence shift',
      beforeSignature: 'Intact black spruce canopy creates strong depolarized HV/VH volume scattering.',
      afterSignature: 'Combusted crowns expose bare mineral/charred soil, collapsing cross-pol backscatter.',
    },
    scientificInterpretation:
      'Active SAR penetrates dense wildfire smoke day and night, enabling emergency responders to delineate active perimeter progression and post-fire soil permafrost exposure.',
    historicalContext:
      'CSA RADARSAT-1 (1995) and RCM (2019) operationalize rapid Arctic/boreal disaster mapping alongside NASA/ASF archives.',
    environmentalConsequences:
      'Deep peat combustion accelerates boreal permafrost thaw and releases legacy soil carbon into the atmosphere.',
    availabilityNote:
      'Sentinel-1 C-band granules are retrieved live from ASF; RCM full-resolution scenes are cataloged via Natural Resources Canada EODMS.',
  },
  {
    id: 'sar-amazon-biomass',
    title: 'Amazon Basin Deforestation & Forest Biomass',
    region: 'Rondônia / Tapajós Corridor, Brazil',
    lat: -9.85,
    lon: -63.12,
    year: 2024,
    observationDate: '2024-08-20',
    beforeDate: '2010-08-15',
    afterDate: '2024-08-20',
    mission: 'ALOS PALSAR',
    sensorType: 'L-Band SAR Biomass & NISAR Ecosystem Monitoring (ALOS / NISAR L2 GCOV)',
    wavelength: 'L-Band (23.6 – 24 cm)',
    datasetName: 'ALOS_PSR_RTC_HIGH & NISAR Ecosystem Biomass Product',
    phenomenon: 'Vegetation',
    processingStatus: 'ALOS PALSAR Public Browse/Metadata via ASF; NISAR GCOV Ecosystem Baseline',
    dataSourceLabel: 'NASA Earthdata CMR / ASF ALOS PALSAR & NISAR Ecosystems',
    sourceUrl: 'https://nisar.jpl.nasa.gov/',
    footprintPolygon: [
      [-10.6, -64.0],
      [-9.1, -63.9],
      [-9.2, -62.2],
      [-10.7, -62.3],
    ],
    asfQuery: {
      platform: 'ALOS',
      beforeStart: '2007-01-01T00:00:00Z',
      beforeEnd: '2008-12-31T23:59:59Z',
      afterStart: '2009-01-01T00:00:00Z',
      afterEnd: '2011-04-30T23:59:59Z',
      radiusDeg: 2.0,
    },
    environmentalConditions:
      'Humid tropical rainforest edge transitioning between primary broadleaf canopy, selective logging roads, and pasture clearing.',
    measuredObservations: {
      polarization: 'HV / HH L-Band Polarimetry',
      resolution: '12.5 m RTC / 100 m Biomass Grid',
      signalBehavior: 'HV backscatter correlates linearly with woody above-ground biomass up to ~150 Mg/ha',
      beforeSignature: 'Dense multi-tier canopy yields high HV volume scattering (-11.2 dB).',
      afterSignature: 'Cleared pasture drops sharply in HV (-19.4 dB), isolating herringbone deforestation corridors.',
    },
    scientificInterpretation:
      'L-band microwaves interact directly with tree trunks and primary branches rather than leaves, providing persistent cloud-free biomass and forest disturbance accounting.',
    historicalContext:
      'ALOS PALSAR (2006–2011) established the L-band tropical benchmark that NISAR now extends with 12-day global cadence.',
    environmentalConsequences:
      'Tracks carbon sink loss, dry-season edge desiccation, and regional evapotranspiration decline.',
    availabilityNote:
      'Historical ALOS PALSAR RTC granules and browse tiles query directly via ASF/CMR; NISAR L2 GCOV extends this L-band archive.',
  },
  {
    id: 'sar-pampas-saocom',
    title: 'Paraná Delta & Pampas Soil Moisture',
    region: 'Buenos Aires / Entre Ríos, Argentina',
    lat: -33.62,
    lon: -59.45,
    year: 2024,
    observationDate: '2024-04-18',
    beforeDate: '2023-03-10',
    afterDate: '2024-04-18',
    mission: 'SAOCOM',
    sensorType: 'CONAE SAOCOM-1A/1B L-Band SAR + Sentinel-1 Cross-Calibration',
    wavelength: 'L-Band (23.5 cm)',
    datasetName: 'CONAE SAOCOM Soil Moisture & Agricultural Wetland Catalog',
    phenomenon: 'Vegetation',
    processingStatus: 'CONAE SAOCOM Open Catalog Metadata + ASF Sentinel-1 Cross-Check',
    dataSourceLabel: 'CONAE Argentina (SAOCOM) & NASA-ISRO NISAR Calibration Partner',
    sourceUrl: 'https://catalog.saocom.conae.gov.ar/catalog/#/',
    footprintPolygon: [
      [-34.2, -60.2],
      [-33.0, -60.0],
      [-33.1, -58.6],
      [-34.3, -58.8],
    ],
    asfQuery: {
      platform: 'SENTINEL-1',
      beforeStart: '2023-02-15T00:00:00Z',
      beforeEnd: '2023-03-30T23:59:59Z',
      afterStart: '2024-04-01T00:00:00Z',
      afterEnd: '2024-05-01T23:59:59Z',
      radiusDeg: 1.8,
    },
    environmentalConditions:
      'Transition from severe La Niña agricultural drought (early 2023) to El Niño floodplain recharge across Pampas croplands and Paraná wetlands.',
    measuredObservations: {
      polarization: 'Quad-Pol L-Band (SAOCOM) / VV-VH (S1)',
      resolution: '10 m – 100 m Soil Moisture Product',
      signalBehavior: 'Dielectric constant sensitivity (+4 to +7 dB backscatter rise with soil saturation)',
      beforeSignature: '2023 Drought-stressed loams (< 12% volumetric soil moisture) with low dielectric return.',
      afterSignature: '2024 Saturated delta soils (> 38% volumetric moisture) and inundated marsh channels.',
    },
    scientificInterpretation:
      'Water increases soil dielectric permittivity sharply at L-band frequencies, allowing SAOCOM and NISAR to quantify root-zone soil moisture and crop phenology beneath vegetation.',
    historicalContext:
      'CONAE SAOCOM-1A (2018) and 1B (2020) serve as vital Southern Hemisphere L-band precursors and inter-calibration partners for NISAR.',
    environmentalConsequences:
      'Supports precision irrigation planning, flood-warning hydrology, and agricultural yield resilience.',
    availabilityNote:
      'SAOCOM product discovery is hosted by CONAE Catalog; paired live Sentinel-1 granules are retrieved directly via ASF.',
  },
];

export interface SatelliteEraCheckpoint {
  year: number;
  label: string;
  mission: string;
  milestone: string;
}

export const SATELLITE_ERAS: SatelliteEraCheckpoint[] = [
  { year: 1995, label: '1995', mission: 'RADARSAT-1', milestone: 'CSA C-band global Antarctic & sea-ice mapping' },
  { year: 2006, label: '2006', mission: 'ALOS PALSAR', milestone: 'L-band global forest biomass & crustal interferometry' },
  { year: 2009, label: '2009', mission: 'UAVSAR', milestone: 'NASA/JPL airborne quad-pol L-band deformation & wetland campaigns' },
  { year: 2014, label: '2014', mission: 'Sentinel-1', milestone: 'Open-access 6–12 day C-band operational SAR monitoring' },
  { year: 2019, label: '2019', mission: 'RCM & SAOCOM', milestone: 'Canadian Compact-Pol & Argentine L-band soil moisture constellations' },
  { year: 2026, label: '2025–26', mission: 'NASA-ISRO NISAR', milestone: 'Dual L-band + S-band 12-day global ecosystem, cryosphere & solid-Earth SAR' },
];

export interface DataSourceReference {
  id: string;
  organization: string;
  missionOrDataset: string;
  url: string;
  informationType: string;
  observationPeriod: string;
  authRequirement: string;
  integrationUsage: string;
}

export const DATA_SOURCES_REGISTRY: DataSourceReference[] = [
  {
    id: 'src-nisar-guide',
    organization: 'NASA / ISRO / Alaska Satellite Facility (ASF)',
    missionOrDataset: 'NISAR Mission & Data User Guide (L2 GCOV, L2 GUNW, L3 SME2)',
    url: 'https://nisar-docs.asf.alaska.edu/',
    informationType: 'L-band (24 cm) & S-band (9 cm) SAR product specifications, tutorials, and science white papers',
    observationPeriod: '2025 – Ongoing (12-day global repeat)',
    authRequirement: 'Open Documentation & CMR Metadata; L2 HDF5 Downloads via Free Earthdata Login',
    integrationUsage: 'Defines L-band polarization/coherence telemetry, cryosphere & ecosystem observation layers, and live CMR granule queries.',
  },
  {
    id: 'src-nisar-storymaps',
    organization: 'NASA Jet Propulsion Laboratory (JPL) / NISAR Science Team',
    missionOrDataset: 'NISAR StoryMaps & Applications White Papers',
    url: 'https://nisar.jpl.nasa.gov/',
    informationType: 'Applied Earth-science white papers on floods, forests, agriculture, earthquakes, and glaciers',
    observationPeriod: 'Mission Lifetime Baseline',
    authRequirement: 'Open Public Access',
    integrationUsage: 'Grounds scientific interpretation, environmental consequences, and physical SAR scattering explanations in the upper-right panel.',
  },
  {
    id: 'src-earthdata-cmr',
    organization: 'NASA EOSDIS / Common Metadata Repository (CMR)',
    missionOrDataset: 'NASA Earthdata Search & CMR Granule/Collection REST API',
    url: 'https://cmr.earthdata.nasa.gov/search/',
    informationType: 'Authoritative granule metadata, temporal bounds, bounding-box footprints, and browse image URLs',
    observationPeriod: '1978 – Present',
    authRequirement: 'Public Metadata Search (No Auth); Optional Earthdata Bearer Token for Protected Product Links',
    integrationUsage: 'Queried live via backend /api/sar/search and /api/sar/collections endpoints to fetch real granule counts, footprints, and provenance.',
  },
  {
    id: 'src-asf-vertex',
    organization: 'Alaska Satellite Facility (ASF DAAC)',
    missionOrDataset: 'ASF Vertex Data Search, GeoJSON Search API & SAR Tutorials',
    url: 'https://search.asf.alaska.edu/',
    informationType: 'GeoJSON swath polygons, beam modes, acquisition dates, and quicklook PNG browse imagery',
    observationPeriod: '1991 – Present (ERS, RADARSAT-1, ALOS, UAVSAR, Sentinel-1, NISAR)',
    authRequirement: 'Public GeoJSON Search & Quicklook Browse; Earthdata Login for Full SLC/RTC/HDF5 Files',
    integrationUsage: 'Powers real-time 3D globe swath polygon overlays, regional viewport scans, and Before/After radar quicklook comparisons.',
  },
  {
    id: 'src-uavsar',
    organization: 'NASA Jet Propulsion Laboratory (JPL)',
    missionOrDataset: 'UAVSAR Airborne L-Band Portal & UAVSAR Postcards',
    url: 'https://uavsar.jpl.nasa.gov/science/education/postcards.html',
    informationType: 'High-resolution polarimetric airborne L-band imagery of floods, faults, wetlands, and volcanoes',
    observationPeriod: '2009 – Present',
    authRequirement: 'Open Public Infographics & ASF-Archived Science Products',
    integrationUsage: 'Provides L-band sub-canopy flood double-bounce case studies and live UAVSAR flight swath queries via ASF.',
  },
  {
    id: 'src-radarsat',
    organization: 'Canadian Space Agency (CSA) / Natural Resources Canada',
    missionOrDataset: 'RADARSAT-1 Archive & RADARSAT Constellation Mission (RCM / EODMS)',
    url: 'https://www.eodms-sgdot.nrcan-rncan.gc.ca/',
    informationType: 'C-band maritime, Arctic ice, wildfire burn scar, and disaster-response SAR datasets',
    observationPeriod: '1995 – Present (RADARSAT-1: 1995–2013; RCM: 2019–Present)',
    authRequirement: 'Open Government RCM Acquisition Plans; EODMS Registration for Full RCM Imagery; ASF Open Search for RADARSAT-1',
    integrationUsage: 'Integrated into Satellite Observation Time (1995 baseline), boreal wildfire case study, and RADARSAT-1 live ASF queries.',
  },
  {
    id: 'src-saocom',
    organization: 'CONAE (Comisión Nacional de Actividades Espaciales, Argentina)',
    missionOrDataset: 'SAOCOM-1A / 1B L-Band SAR Product & Soil Moisture Catalog',
    url: 'https://catalog.saocom.conae.gov.ar/catalog/#/',
    informationType: 'L-band polarimetric soil moisture, wetland hydrology, and agricultural monitoring catalogs',
    observationPeriod: '2018 – Present',
    authRequirement: 'Public Catalog Discovery; CONAE User Account for Full Product Orders',
    integrationUsage: 'Integrated into South American Pampas & Paraná Delta soil moisture observation mode with cross-checked Sentinel-1 ASF passes.',
  },
  {
    id: 'src-eonet',
    organization: 'NASA Earth Observatory Natural Event Tracker (EONET v3)',
    missionOrDataset: 'NASA EONET Open Natural Hazard Events API',
    url: 'https://eonet.gsfc.nasa.gov/api/v3/events',
    informationType: 'Near-real-time wildfire, flood, storm, volcano, and sea/lake ice coordinates',
    observationPeriod: 'Rolling 180-Day Active Window',
    authRequirement: 'Open Unauthenticated REST API',
    integrationUsage: 'Feeds live Earth hazard pins onto the 3D globe in Satellite Observation Mode and triggers regional ASF SAR granule lookups.',
  },
];
