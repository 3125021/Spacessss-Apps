export type EonName = 'Hadean' | 'Archean' | 'Proterozoic' | 'Phanerozoic';
export type EventCategory = 'Tectonic' | 'Atmospheric' | 'Biological' | 'Extinction';

export interface FieldSite {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  ageLabel: string;
  category: EventCategory;
  summary: string;
  isotopeSignature: string;
}

export interface EpochData {
  id: string;
  index: number;
  name: string;
  shortName: string;
  eon: EonName;
  era: string;
  ageGa: number; // Billions of years ago (4.54 to 0.0)
  ageSpanLabel: string;
  durationMyr: number;
  category: EventCategory;
  headline: string;
  summary: string;
  scientificContext: string;
  milestones: string[];
  telemetry: {
    meanTempC: number;
    pressureBar: number;
    dayLengthHours: number;
    solarLuminosityPct: number;
    seaLevelOffsetM: number;
    axialTiltDeg: number;
    magneticFieldPct: number;
    co2Ppm: number;
    o2Pct: number;
    n2Pct: number;
    ch4Ppm: number;
  };
  visuals: {
    oceanHex: string;
    deepOceanHex: string;
    landHex: string;
    highlandHex: string;
    iceColorHex: string;
    iceCoverage: number; // 0 to 1
    magmaGlow: number; // 0 to 1
    cloudCoverage: number; // 0 to 1
    atmosphereHex: string;
    atmosphereIntensity: number; // 0 to 1
    continentSpread: number; // 0 = fragmented/none, 1 = modern, -1 = supercontinent
    vegetationIntensity: number; // 0 to 1
  };
  fieldSites: FieldSite[];
}

export const EARTH_EPOCHS: EpochData[] = [
  {
    id: 'hadean',
    index: 1,
    name: 'Hadean Magma Ocean',
    shortName: 'Hadean',
    eon: 'Hadean',
    era: 'Early Planetary Differentiation',
    ageGa: 4.5,
    ageSpanLabel: '4.543 – 4.000 Ga',
    durationMyr: 543,
    category: 'Tectonic',
    headline: 'Molten silicate crust and the Giant Impact aftermath',
    summary:
      'Following accretion and the Theia moon-forming impact, Earth radiates intense primordial heat through a global silicate magma ocean beneath a dense steam and carbon dioxide envelope.',
    scientificContext:
      'Rapid iron-nickel core differentiation establishes the early geodynamo. By 4.40 Ga, localized cooling permits the first felsic protocrust and liquid hydrosphere pockets, recorded in detrital Jack Hills zircons.',
    milestones: [
      'Theia giant impact forms the Earth-Moon system (~4.51 Ga)',
      'Core-mantle differentiation and earliest geodynamo onset',
      'First liquid water oceans condense under high CO2 pressure (~4.40 Ga)',
      'Late Heavy Bombardment craters ancient basaltic basins'
    ],
    telemetry: {
      meanTempC: 230,
      pressureBar: 12.4,
      dayLengthHours: 6.2,
      solarLuminosityPct: 70.2,
      seaLevelOffsetM: -1800,
      axialTiltDeg: 24.8,
      magneticFieldPct: 45,
      co2Ppm: 840000,
      o2Pct: 0.0,
      n2Pct: 14.0,
      ch4Ppm: 1200
    },
    visuals: {
      oceanHex: '#2e1008',
      deepOceanHex: '#180704',
      landHex: '#3f2219',
      highlandHex: '#7c2d12',
      iceColorHex: '#94a3b8',
      iceCoverage: 0,
      magmaGlow: 0.92,
      cloudCoverage: 0.68,
      atmosphereHex: '#f59e0b',
      atmosphereIntensity: 0.85,
      continentSpread: 0.12,
      vegetationIntensity: 0
    },
    fieldSites: [
      {
        id: 'jack-hills',
        name: 'Jack Hills Metaconglomerate',
        region: 'Yilgarn Craton, Western Australia',
        lat: -26.1,
        lon: 117.2,
        ageLabel: '4.404 Ga',
        category: 'Tectonic',
        summary: 'Oldest terrestrial mineral grains (zircons) preserving oxygen-18 evidence of early liquid oceans.',
        isotopeSignature: 'd18O +7.4 permil · U-Pb 4404 ± 8 Ma'
      },
      {
        id: 'nuvvuagittuq',
        name: 'Nuvvuagittuq Greenstone Belt',
        region: 'Northern Quebec, Canada',
        lat: 58.3,
        lon: -77.6,
        ageLabel: '4.280 Ga',
        category: 'Tectonic',
        summary: 'Mafic amphibolite suite preserving early crustal subduction and hydrothermal vent signatures.',
        isotopeSignature: '142Nd anomaly -18 ppm'
      }
    ]
  },
  {
    id: 'archean',
    index: 2,
    name: 'Archean Oceanic World',
    shortName: 'Archean',
    eon: 'Archean',
    era: 'Eoarchean – Neoarchean',
    ageGa: 3.4,
    ageSpanLabel: '4.000 – 2.500 Ga',
    durationMyr: 1500,
    category: 'Biological',
    headline: 'An iron-rich emerald ocean births microbial life',
    summary:
      'Under a faint young Sun, dissolved ferrous iron turns the global ocean olive-green while an orange methane haze warms the planet and volcanic island arcs coalesce into the first continental cratons.',
    scientificContext:
      'Without an ozone shield, ultraviolet radiation bathes the surface. Around hydrothermal vents and shallow tidal flats, anoxygenic phototrophs and early cyanobacteria construct layered stromatolite reefs.',
    milestones: [
      'Earliest microfossils and biogenic carbon in Western Australia (~3.48 Ga)',
      'Submarine pillow basalts record active proto-plate tectonics',
      'Stromatolite carbonate platforms proliferate in shallow seas',
      'Evolution of oxygenic photosynthesis in ancestral cyanobacteria (~2.7 Ga)'
    ],
    telemetry: {
      meanTempC: 36,
      pressureBar: 1.65,
      dayLengthHours: 14.8,
      solarLuminosityPct: 77.4,
      seaLevelOffsetM: 420,
      axialTiltDeg: 23.9,
      magneticFieldPct: 72,
      co2Ppm: 45000,
      o2Pct: 0.002,
      n2Pct: 86.5,
      ch4Ppm: 9500
    },
    visuals: {
      oceanHex: '#0d4a42',
      deepOceanHex: '#062624',
      landHex: '#475569',
      highlandHex: '#64748b',
      iceColorHex: '#cbd5e1',
      iceCoverage: 0.02,
      magmaGlow: 0.14,
      cloudCoverage: 0.45,
      atmosphereHex: '#fb923c',
      atmosphereIntensity: 0.65,
      continentSpread: 0.25,
      vegetationIntensity: 0.02
    },
    fieldSites: [
      {
        id: 'strelley-pool',
        name: 'Strelley Pool Stromatolites',
        region: 'Pilbara Craton, Australia',
        lat: -21.2,
        lon: 119.1,
        ageLabel: '3.430 Ga',
        category: 'Biological',
        summary: 'Conical laminated microbial reefs formed in hypersaline volcanic coastal lagoons.',
        isotopeSignature: 'd13C -28.5 permil kerogen'
      },
      {
        id: 'barberton',
        name: 'Barberton Komatiite Sequence',
        region: 'Mpumalanga, South Africa',
        lat: -25.8,
        lon: 31.1,
        ageLabel: '3.470 Ga',
        category: 'Tectonic',
        summary: 'Ultramafic lava flows erupted at >1600 °C indicating a hotter Archean mantle.',
        isotopeSignature: 'MgO 29.4 wt% · Spinifex texture'
      }
    ]
  },
  {
    id: 'great-oxidation',
    index: 3,
    name: 'Great Oxidation Transition',
    shortName: 'Paleoproterozoic',
    eon: 'Proterozoic',
    era: 'Siderian – Rhyacian',
    ageGa: 2.3,
    ageSpanLabel: '2.450 – 2.050 Ga',
    durationMyr: 400,
    category: 'Atmospheric',
    headline: 'Free oxygen rusts the oceans and collapses the methane greenhouse',
    summary:
      'Photosynthetic oxygen overwhelms oceanic iron buffers, precipitating massive banded iron formations across continental shelves and destroying the atmospheric methane blanket.',
    scientificContext:
      'The loss of methane triggers the Huronian glaciation—Earth’s earliest global ice age. Survivors adapt to aerobic respiration, setting the energetic foundation for complex eukaryotic cells.',
    milestones: [
      'Mass-independent sulfur isotope fractionation vanishes (~2.42 Ga)',
      'Global deposition of Hamersley and Lake Superior Banded Iron Formations',
      'Huronian glaciation freezes low-latitude oceans',
      'Lomagundi-Jatuli positive carbon isotope excursion'
    ],
    telemetry: {
      meanTempC: 6,
      pressureBar: 1.08,
      dayLengthHours: 18.2,
      solarLuminosityPct: 83.6,
      seaLevelOffsetM: -60,
      axialTiltDeg: 23.6,
      magneticFieldPct: 88,
      co2Ppm: 8200,
      o2Pct: 2.4,
      n2Pct: 96.1,
      ch4Ppm: 45
    },
    visuals: {
      oceanHex: '#0c3b5e',
      deepOceanHex: '#051a30',
      landHex: '#7c4a3a',
      highlandHex: '#9a5b44',
      iceColorHex: '#e0f2fe',
      iceCoverage: 0.42,
      magmaGlow: 0.03,
      cloudCoverage: 0.42,
      atmosphereHex: '#38bdf8',
      atmosphereIntensity: 0.55,
      continentSpread: 0.42,
      vegetationIntensity: 0.04
    },
    fieldSites: [
      {
        id: 'hamersley',
        name: 'Hamersley Banded Iron Range',
        region: 'Western Australia',
        lat: -22.5,
        lon: 118.2,
        ageLabel: '2.460 Ga',
        category: 'Atmospheric',
        summary: 'Alternating hematite-magnetite and chert bands precipitated during ocean oxygenation.',
        isotopeSignature: 'd56Fe +0.45 permil · MIF-S 0.0'
      },
      {
        id: 'gowganda',
        name: 'Gowganda Diamictite',
        region: 'Ontario, Canada',
        lat: 47.6,
        lon: -80.8,
        ageLabel: '2.310 Ga',
        category: 'Atmospheric',
        summary: 'Glacial dropstones within marine varves proving equatorial sea-ice advance.',
        isotopeSignature: 'CIA weathering index 52'
      }
    ]
  },
  {
    id: 'cryogenian',
    index: 4,
    name: 'Cryogenian Snowball Earth',
    shortName: 'Cryogenian',
    eon: 'Proterozoic',
    era: 'Neoproterozoic',
    ageGa: 0.67,
    ageSpanLabel: '0.720 – 0.635 Ga',
    durationMyr: 85,
    category: 'Atmospheric',
    headline: 'Runaway ice albedo seals the planet in kilometer-thick glaciers',
    summary:
      'Breakup of the Rodinia supercontinent accelerates silicate weathering, drawing down CO₂ until runaway ice-albedo feedback locks Earth from poles to equator in shimmering sea ice.',
    scientificContext:
      'Only volcanic outgassing over millions of years accumulates enough CO₂ (~120,000 ppm) to breach the albedo lock, triggering an abrupt super-greenhouse melt and nutrient deluge into the Ediacaran seas.',
    milestones: [
      'Sturtian global glaciation (~717 – 659 Ma)',
      'Marinoan pan-glacial minimum reaches equatorial latitudes (~635 Ma)',
      'Subglacial geothermal refugia sustain eukaryotic algae and sponges',
      'Ultra-greenhouse deglaciation deposits worldwide cap carbonates'
    ],
    telemetry: {
      meanTempC: -42,
      pressureBar: 0.96,
      dayLengthHours: 20.9,
      solarLuminosityPct: 94.1,
      seaLevelOffsetM: -380,
      axialTiltDeg: 23.4,
      magneticFieldPct: 78,
      co2Ppm: 1400,
      o2Pct: 8.5,
      n2Pct: 91.2,
      ch4Ppm: 2.1
    },
    visuals: {
      oceanHex: '#93c5fd',
      deepOceanHex: '#3b82f6',
      landHex: '#cbd5e1',
      highlandHex: '#f1f5f9',
      iceColorHex: '#f8fafc',
      iceCoverage: 0.94,
      magmaGlow: 0.0,
      cloudCoverage: 0.25,
      atmosphereHex: '#7dd3fc',
      atmosphereIntensity: 0.72,
      continentSpread: 0.56,
      vegetationIntensity: 0
    },
    fieldSites: [
      {
        id: 'flinders',
        name: 'Elatina Cap Carbonate',
        region: 'Flinders Ranges, South Australia',
        lat: -31.3,
        lon: 138.6,
        ageLabel: '635 Ma',
        category: 'Atmospheric',
        summary: 'Sharp transition from glacial diamictite to warm-water dolostone within millennia.',
        isotopeSignature: 'd13C -4.8 permil · Paleolatitude 5°N'
      },
      {
        id: 'oman-salt',
        name: 'Huqf Supergroup Biomarkers',
        region: 'Al Wusta, Oman',
        lat: 20.4,
        lon: 56.8,
        ageLabel: '645 Ma',
        category: 'Biological',
        summary: 'Sterane molecular fossils confirming demosponge radiation between Snowball pulses.',
        isotopeSignature: '24-isopropylcholestane spike'
      }
    ]
  },
  {
    id: 'cambrian',
    index: 5,
    name: 'Cambrian Biosphere Explosion',
    shortName: 'Cambrian',
    eon: 'Phanerozoic',
    era: 'Early Paleozoic',
    ageGa: 0.51,
    ageSpanLabel: '0.539 – 0.485 Ga',
    durationMyr: 54,
    category: 'Biological',
    headline: 'Every major animal body plan emerges in sunlit shelf seas',
    summary:
      'Rising atmospheric oxygen and flooded continental interiors ignite an unprecedented evolutionary diversification of mineralized skeletons, compound eyes, and active predation.',
    scientificContext:
      'Gondwana dominates the southern hemisphere while Laurentia and Baltica straddle warm equatorial waters. Burrowing animals transform microbial seafloors into aerated modern marine ecosystems.',
    milestones: [
      'Agronomic revolution: vertical burrowing aerates seafloor sediments',
      'Rapid emergence of arthropods, chordates, mollusks, and brachiopods',
      'Apex marine predator Anomalocaris evolves compound visual optics',
      'Calcium carbonate biomineralization builds earliest shelly reefs'
    ],
    telemetry: {
      meanTempC: 22,
      pressureBar: 1.01,
      dayLengthHours: 21.4,
      solarLuminosityPct: 95.6,
      seaLevelOffsetM: 185,
      axialTiltDeg: 23.5,
      magneticFieldPct: 92,
      co2Ppm: 4500,
      o2Pct: 12.8,
      n2Pct: 86.7,
      ch4Ppm: 1.8
    },
    visuals: {
      oceanHex: '#0284c7',
      deepOceanHex: '#0c4a6e',
      landHex: '#a16207',
      highlandHex: '#ca8a04',
      iceColorHex: '#e2e8f0',
      iceCoverage: 0.04,
      magmaGlow: 0,
      cloudCoverage: 0.36,
      atmosphereHex: '#00f0ff',
      atmosphereIntensity: 0.62,
      continentSpread: 0.62,
      vegetationIntensity: 0.06
    },
    fieldSites: [
      {
        id: 'burgess-shale',
        name: 'Burgess Shale Lagerstätte',
        region: 'Yoho National Park, Canada',
        lat: 51.4,
        lon: -116.5,
        ageLabel: '508 Ma',
        category: 'Biological',
        summary: 'Exceptional soft-tissue preservation along a submarine carbonate escarpment.',
        isotopeSignature: 'Carbonaceous film · >65,000 specimens'
      },
      {
        id: 'chengjiang',
        name: 'Chengjiang Biota',
        region: 'Yunnan, China',
        lat: 24.6,
        lon: 102.9,
        ageLabel: '518 Ma',
        category: 'Biological',
        summary: 'Earliest known stem-group vertebrates (Myllokunmingia) in deltaic mudstones.',
        isotopeSignature: 'Pyritized neural traces'
      }
    ]
  },
  {
    id: 'carboniferous',
    index: 6,
    name: 'Carboniferous Coal Forests',
    shortName: 'Carboniferous',
    eon: 'Phanerozoic',
    era: 'Late Paleozoic',
    ageGa: 0.32,
    ageSpanLabel: '0.359 – 0.299 Ga',
    durationMyr: 60,
    category: 'Biological',
    headline: 'Hyper-oxygenated skies and towering lycophyte rainforests',
    summary:
      'Vast equatorial peat swamps bury unprecedented volumes of lignin carbon, driving atmospheric oxygen to 32%—fueling giant terrestrial arthropods and sweeping wildfire regimes.',
    scientificContext:
      'As Gondwana drifts across the South Pole, a major Gondwanan ice sheet waxes and wanes, driving rhythmic sea-level cyclothems across Euramerica.',
    milestones: [
      'Atmospheric oxygen reaches Phanerozoic maximum (~32.5% O₂)',
      'Lignin-rich scale trees sequester vast coal reserves before white-rot fungi diversify',
      'Amniote egg frees tetrapods from aquatic reproduction',
      'Meganeura dragonflies attain 70 cm wingspans in dense air'
    ],
    telemetry: {
      meanTempC: 14,
      pressureBar: 1.12,
      dayLengthHours: 22.4,
      solarLuminosityPct: 97.2,
      seaLevelOffsetM: 45,
      axialTiltDeg: 23.4,
      magneticFieldPct: 98,
      co2Ppm: 380,
      o2Pct: 32.5,
      n2Pct: 67.4,
      ch4Ppm: 0.9
    },
    visuals: {
      oceanHex: '#0369a1',
      deepOceanHex: '#082f49',
      landHex: '#15803d',
      highlandHex: '#166534',
      iceColorHex: '#f1f5f9',
      iceCoverage: 0.22,
      magmaGlow: 0,
      cloudCoverage: 0.44,
      atmosphereHex: '#22d3ee',
      atmosphereIntensity: 0.68,
      continentSpread: 0.78,
      vegetationIntensity: 0.92
    },
    fieldSites: [
      {
        id: 'joggins',
        name: 'Joggins Fossil Cliffs',
        region: 'Nova Scotia, Canada',
        lat: 45.7,
        lon: -64.4,
        ageLabel: '315 Ma',
        category: 'Biological',
        summary: 'Upright fossilized Sigillaria trunks entombing the earliest amniote Hylonomus.',
        isotopeSignature: 'Vitrinite reflectance Ro 0.72%'
      },
      {
        id: 'mazon-creek',
        name: 'Mazon Creek Siderite Concretions',
        region: 'Illinois, United States',
        lat: 41.3,
        lon: -88.4,
        ageLabel: '307 Ma',
        category: 'Biological',
        summary: 'Iron carbonate nodules preserving delicate ferns, horseshoe crabs, and Tully monsters.',
        isotopeSignature: 'FeCO3 early diagenetic nodules'
      }
    ]
  },
  {
    id: 'triassic-pangaea',
    index: 7,
    name: 'Triassic Pangaea Supercontinent',
    shortName: 'Triassic',
    eon: 'Phanerozoic',
    era: 'Early Mesozoic',
    ageGa: 0.23,
    ageSpanLabel: '0.252 – 0.201 Ga',
    durationMyr: 51,
    category: 'Extinction',
    headline: 'A pole-to-pole supercontinent recovers from the Great Dying',
    summary:
      'Following the Siberian Traps end-Permian extinction that eliminated 81% of marine species, Earth’s landmasses lock into Pangaea, creating hyper-arid megamonsoon interiors.',
    scientificContext:
      'Panthalassa spans 70% of the globe while the warm Tethys embayment cradles recovering coral reefs. Late Triassic rifting births the Central Atlantic Magmatic Province and clears ecological space for dinosaurs.',
    milestones: [
      'Recovery from the Permo-Triassic boundary crisis (~251.9 Ma)',
      'Extreme continentality drives megamonsoon deserts across central Pangaea',
      'First dinosaurs, pterosaurs, and stem-mammals radiate (~233 Ma)',
      'Carnian Pluvial Episode delivers 2 million years of global rainfall'
    ],
    telemetry: {
      meanTempC: 24,
      pressureBar: 1.02,
      dayLengthHours: 22.8,
      solarLuminosityPct: 98.1,
      seaLevelOffsetM: 20,
      axialTiltDeg: 23.5,
      magneticFieldPct: 86,
      co2Ppm: 2100,
      o2Pct: 15.8,
      n2Pct: 83.9,
      ch4Ppm: 2.4
    },
    visuals: {
      oceanHex: '#0284c7',
      deepOceanHex: '#0a2540',
      landHex: '#b45309',
      highlandHex: '#78350f',
      iceColorHex: '#e2e8f0',
      iceCoverage: 0.02,
      magmaGlow: 0.06,
      cloudCoverage: 0.34,
      atmosphereHex: '#38bdf8',
      atmosphereIntensity: 0.58,
      continentSpread: -0.9,
      vegetationIntensity: 0.38
    },
    fieldSites: [
      {
        id: 'ischigualasto',
        name: 'Ischigualasto Badlands',
        region: 'San Juan, Argentina',
        lat: -30.1,
        lon: -67.8,
        ageLabel: '231 Ma',
        category: 'Biological',
        summary: 'Continuous river-valley succession recording the earliest known dinosaur radiations.',
        isotopeSignature: '40Ar/39Ar 231.4 ± 0.3 Ma'
      },
      {
        id: 'meishan',
        name: 'Meishan GSSP Boundary',
        region: 'Zhejiang, China',
        lat: 31.1,
        lon: 119.7,
        ageLabel: '251.9 Ma',
        category: 'Extinction',
        summary: 'Global reference section for the End-Permian mass extinction and mercury spike.',
        isotopeSignature: 'd13C -6.0 permil · Hg/TOC 420 ppb/%'
      }
    ]
  },
  {
    id: 'cretaceous',
    index: 8,
    name: 'Cretaceous Greenhouse',
    shortName: 'Cretaceous',
    eon: 'Phanerozoic',
    era: 'Late Mesozoic',
    ageGa: 0.07,
    ageSpanLabel: '0.145 – 0.066 Ga',
    durationMyr: 79,
    category: 'Extinction',
    headline: 'Ice-free poles, epicontinental seaways, and the Chicxulub bolide',
    summary:
      'Accelerated seafloor spreading floods continental interiors with shallow chalk seas while flowering plants transform terrestrial biomes—culminating in the 66 Ma Chicxulub impact.',
    scientificContext:
      'Polar forests flourish at 75°S without permanent ice caps. At 66.0 Ma, a 10 km carbonaceous asteroid strikes Yucatán carbonate-evaporite platforms, ejecting global spherules and terminating the Mesozoic.',
    milestones: [
      'Atlantic Ocean widens as Gondwana fractures into modern continents',
      'Angiosperms (flowering plants) co-radiate with pollinating insects',
      'Western Interior Seaway bisects North America (+220 m sea level)',
      'Chicxulub impact vaporizes Yucatán shelf, creating global iridium layer (66.0 Ma)'
    ],
    telemetry: {
      meanTempC: 21,
      pressureBar: 1.04,
      dayLengthHours: 23.6,
      solarLuminosityPct: 99.4,
      seaLevelOffsetM: 210,
      axialTiltDeg: 23.5,
      magneticFieldPct: 105,
      co2Ppm: 1150,
      o2Pct: 24.2,
      n2Pct: 75.6,
      ch4Ppm: 1.6
    },
    visuals: {
      oceanHex: '#0ea5e9',
      deepOceanHex: '#082f49',
      landHex: '#16a34a',
      highlandHex: '#854d0e',
      iceColorHex: '#f1f5f9',
      iceCoverage: 0.03,
      magmaGlow: 0.04,
      cloudCoverage: 0.48,
      atmosphereHex: '#00f0ff',
      atmosphereIntensity: 0.64,
      continentSpread: 0.85,
      vegetationIntensity: 0.86
    },
    fieldSites: [
      {
        id: 'chicxulub',
        name: 'Chicxulub Peak Ring',
        region: 'Yucatán Shelf, Mexico',
        lat: 21.4,
        lon: -89.5,
        ageLabel: '66.02 Ma',
        category: 'Extinction',
        summary: '180 km multi-ring impact structure excavated in IODP Expedition 364.',
        isotopeSignature: 'Iridium 65 ppb · Shocked quartz'
      },
      {
        id: 'tanis',
        name: 'Tanis K-Pg Surge Deposit',
        region: 'North Dakota, United States',
        lat: 46.1,
        lon: -103.5,
        ageLabel: '66.00 Ma',
        category: 'Extinction',
        summary: 'Seiche surge deposit containing impact glass microtektites lodged in paddlefish gills.',
        isotopeSignature: 'd13C-impact ejecta spherules'
      }
    ]
  },
  {
    id: 'holocene',
    index: 9,
    name: 'Holocene & Modern Earth',
    shortName: 'Holocene',
    eon: 'Phanerozoic',
    era: 'Quaternary – Present',
    ageGa: 0.0,
    ageSpanLabel: '0.012 – 0.000 Ga',
    durationMyr: 0.012,
    category: 'Atmospheric',
    headline: 'Bipolar ice caps, stabilizing climate, and the orbital monitoring era',
    summary:
      'Emerging from the Pleistocene glacial cycles into a remarkably stable interglacial, Earth sustains complex biospheres, polar cryospheres, and a technologically observant civilization.',
    scientificContext:
      'Orbital Milankovitch cycles govern Quaternary ice sheets, while modern satellite spectroscopy tracks rapid anthropogenic carbon perturbation relative to 800,000-year Antarctic ice core baselines.',
    milestones: [
      'Retreat of Laurentide and Fennoscandian ice sheets (~11.7 ka)',
      'Stabilization of global sea level and coastal deltaic ecosystems',
      'Antarctic ice cores archive 800 kyr of atmospheric CO₂ and CH₄',
      'Satellite constellation monitors planetary radiation budget in real time'
    ],
    telemetry: {
      meanTempC: 14.9,
      pressureBar: 1.013,
      dayLengthHours: 23.934,
      solarLuminosityPct: 100.0,
      seaLevelOffsetM: 0,
      axialTiltDeg: 23.44,
      magneticFieldPct: 100,
      co2Ppm: 422,
      o2Pct: 20.95,
      n2Pct: 78.08,
      ch4Ppm: 1.92
    },
    visuals: {
      oceanHex: '#0284c7',
      deepOceanHex: '#071b36',
      landHex: '#15803d',
      highlandHex: '#713f12',
      iceColorHex: '#f8fafc',
      iceCoverage: 0.14,
      magmaGlow: 0,
      cloudCoverage: 0.42,
      atmosphereHex: '#38bdf8',
      atmosphereIntensity: 0.62,
      continentSpread: 1.0,
      vegetationIntensity: 0.78
    },
    fieldSites: [
      {
        id: 'vostok',
        name: 'Dome C / Vostok Ice Core',
        region: 'East Antarctic Plateau',
        lat: -75.1,
        lon: 123.3,
        ageLabel: '0.800 Ma – Present',
        category: 'Atmospheric',
        summary: '3,270 m ice core preserving trapped ancient air bubbles across eight glacial cycles.',
        isotopeSignature: 'dD -440 permil · CO2 180–280 ppm'
      },
      {
        id: 'mauna-loa',
        name: 'Mauna Loa Observatory',
        region: 'Hawaiʻi, Pacific Ocean',
        lat: 19.5,
        lon: -155.6,
        ageLabel: '1958 – Present',
        category: 'Atmospheric',
        summary: 'Primary mid-tropospheric baseline for continuous atmospheric carbon dioxide spectroscopy.',
        isotopeSignature: 'Keeling Curve · 422.4 ppm CO2'
      }
    ]
  }
];

export interface SpectroscopyPoint {
  ageGa: number;
  label: string;
  o2Pct: number;
  co2Ppm: number;
  tempC: number;
  solarPct: number;
  biodiversityIdx: number;
  epochId: string;
}

export const SPECTROSCOPY_SERIES: SpectroscopyPoint[] = [
  { ageGa: 4.5, label: '4.50 Ga', o2Pct: 0.0, co2Ppm: 840000, tempC: 230, solarPct: 70.2, biodiversityIdx: 0, epochId: 'hadean' },
  { ageGa: 4.2, label: '4.20 Ga', o2Pct: 0.0, co2Ppm: 320000, tempC: 95, solarPct: 72.1, biodiversityIdx: 0, epochId: 'hadean' },
  { ageGa: 3.8, label: '3.80 Ga', o2Pct: 0.001, co2Ppm: 95000, tempC: 58, solarPct: 74.8, biodiversityIdx: 8, epochId: 'archean' },
  { ageGa: 3.4, label: '3.40 Ga', o2Pct: 0.002, co2Ppm: 45000, tempC: 36, solarPct: 77.4, biodiversityIdx: 14, epochId: 'archean' },
  { ageGa: 2.8, label: '2.80 Ga', o2Pct: 0.01, co2Ppm: 24000, tempC: 29, solarPct: 80.5, biodiversityIdx: 21, epochId: 'archean' },
  { ageGa: 2.4, label: '2.40 Ga', o2Pct: 1.8, co2Ppm: 11000, tempC: 8, solarPct: 83.2, biodiversityIdx: 24, epochId: 'great-oxidation' },
  { ageGa: 2.2, label: '2.20 Ga', o2Pct: 2.9, co2Ppm: 7800, tempC: 5, solarPct: 84.4, biodiversityIdx: 26, epochId: 'great-oxidation' },
  { ageGa: 1.6, label: '1.60 Ga', o2Pct: 1.4, co2Ppm: 5400, tempC: 21, solarPct: 88.2, biodiversityIdx: 30, epochId: 'great-oxidation' },
  { ageGa: 1.0, label: '1.00 Ga', o2Pct: 3.2, co2Ppm: 3800, tempC: 19, solarPct: 91.8, biodiversityIdx: 35, epochId: 'cryogenian' },
  { ageGa: 0.7, label: '0.70 Ga', o2Pct: 6.4, co2Ppm: 1200, tempC: -44, solarPct: 93.8, biodiversityIdx: 29, epochId: 'cryogenian' },
  { ageGa: 0.635, label: '0.64 Ga', o2Pct: 9.8, co2Ppm: 95000, tempC: 38, solarPct: 94.3, biodiversityIdx: 42, epochId: 'cryogenian' },
  { ageGa: 0.52, label: '0.52 Ga', o2Pct: 12.8, co2Ppm: 4500, tempC: 22, solarPct: 95.6, biodiversityIdx: 68, epochId: 'cambrian' },
  { ageGa: 0.44, label: '0.44 Ga', o2Pct: 15.2, co2Ppm: 3900, tempC: 16, solarPct: 96.3, biodiversityIdx: 54, epochId: 'cambrian' },
  { ageGa: 0.36, label: '0.36 Ga', o2Pct: 24.5, co2Ppm: 1600, tempC: 19, solarPct: 96.9, biodiversityIdx: 66, epochId: 'carboniferous' },
  { ageGa: 0.31, label: '0.31 Ga', o2Pct: 32.5, co2Ppm: 380, tempC: 14, solarPct: 97.3, biodiversityIdx: 79, epochId: 'carboniferous' },
  { ageGa: 0.252, label: '0.25 Ga', o2Pct: 14.5, co2Ppm: 3400, tempC: 31, solarPct: 97.9, biodiversityIdx: 32, epochId: 'triassic-pangaea' },
  { ageGa: 0.22, label: '0.22 Ga', o2Pct: 15.8, co2Ppm: 2100, tempC: 24, solarPct: 98.1, biodiversityIdx: 58, epochId: 'triassic-pangaea' },
  { ageGa: 0.145, label: '0.15 Ga', o2Pct: 21.2, co2Ppm: 1450, tempC: 20, solarPct: 98.7, biodiversityIdx: 81, epochId: 'cretaceous' },
  { ageGa: 0.09, label: '0.09 Ga', o2Pct: 24.8, co2Ppm: 1300, tempC: 25, solarPct: 99.2, biodiversityIdx: 91, epochId: 'cretaceous' },
  { ageGa: 0.066, label: '0.066 Ga', o2Pct: 23.6, co2Ppm: 1050, tempC: 11, solarPct: 99.4, biodiversityIdx: 51, epochId: 'cretaceous' },
  { ageGa: 0.05, label: '0.050 Ga', o2Pct: 21.8, co2Ppm: 1100, tempC: 23, solarPct: 99.6, biodiversityIdx: 84, epochId: 'holocene' },
  { ageGa: 0.0, label: '0.000 Ga', o2Pct: 20.95, co2Ppm: 422, tempC: 14.9, solarPct: 100.0, biodiversityIdx: 96, epochId: 'holocene' }
];

export interface MassExtinctionEvent {
  id: string;
  name: string;
  ageMa: number;
  generaLostPct: number;
  primaryDriver: string;
  epochId: string;
  description: string;
}

export const MASS_EXTINCTIONS: MassExtinctionEvent[] = [
  {
    id: 'end-ordovician',
    name: 'End-Ordovician Crisis',
    ageMa: 444,
    generaLostPct: 57,
    primaryDriver: 'Gondwanan glaciation & rapid sea-level drop',
    epochId: 'cambrian',
    description: 'Two-pulse marine extinction eliminating 85% of shallow-shelf species during Hirnantian cooling.'
  },
  {
    id: 'late-devonian',
    name: 'Late Devonian Kellwasser',
    ageMa: 372,
    generaLostPct: 50,
    primaryDriver: 'Vascular plant root weathering & oceanic anoxia',
    epochId: 'carboniferous',
    description: 'Collapse of giant stromatoporoid-coral reef ecosystems under widespread marine eutrophication.'
  },
  {
    id: 'end-permian',
    name: 'End-Permian Great Dying',
    ageMa: 251.9,
    generaLostPct: 81,
    primaryDriver: 'Siberian Traps flood basalts & ocean acidification',
    epochId: 'triassic-pangaea',
    description: 'Earth’s severest biotic crisis: +10 °C marine warming and hydrogen sulfide shoaling.'
  },
  {
    id: 'end-triassic',
    name: 'End-Triassic Rifting Crisis',
    ageMa: 201.3,
    generaLostPct: 52,
    primaryDriver: 'Central Atlantic Magmatic Province volcanism',
    epochId: 'triassic-pangaea',
    description: 'Pangean breakup CO₂ pulse clears non-dinosaurian archosaurs, enabling Jurassic dominance.'
  },
  {
    id: 'end-cretaceous',
    name: 'End-Cretaceous K-Pg Impact',
    ageMa: 66.0,
    generaLostPct: 47,
    primaryDriver: 'Chicxulub asteroid impact & sulfate aerosol winter',
    epochId: 'cretaceous',
    description: 'Global impact winter extinguishes non-avian dinosaurs, ammonites, and marine reptiles.'
  }
];

export interface Specimen {
  id: string;
  accessionNumber: string;
  name: string;
  category: 'Mineral' | 'Fossil' | 'Impactite' | 'Ice & Core';
  ageLabel: string;
  epochId: string;
  formation: string;
  coordinates: string;
  dimensions: string;
  composition: string;
  isotopeNote: string;
  description: string;
  accentHex: string;
  diagramType: 'zircon' | 'bif' | 'stromatolite' | 'fossil' | 'boundary' | 'impact' | 'icecore' | 'amber';
}

export const GEOLOGICAL_SPECIMENS: Specimen[] = [
  {
    id: 'spec-zircon',
    accessionNumber: 'ETT-MIN-4404',
    name: 'Jack Hills Detrital Zircon W74/2-36',
    category: 'Mineral',
    ageLabel: '4.404 Ga ± 8 Ma',
    epochId: 'hadean',
    formation: 'Jack Hills Metaconglomerate, Western Australia',
    coordinates: '26.17° S, 117.21° E',
    dimensions: '210 × 140 × 115 μm',
    composition: 'ZrSiO₄ with trace U, Th, Hf, and REE inclusions',
    isotopeNote: 'δ¹⁸O = +7.4 ‰ VSMOW · Ti-in-zircon Temp 690 °C',
    description:
      'A microscopic zirconium silicate crystal containing elevated heavy oxygen isotopes—direct geochemical proof that liquid water interacted with Earth’s earliest granitic crust barely 140 million years after planetary accretion.',
    accentHex: '#f59e0b',
    diagramType: 'zircon'
  },
  {
    id: 'spec-bif',
    accessionNumber: 'ETT-MIN-2460',
    name: 'Brockman Banded Iron Formation',
    category: 'Mineral',
    ageLabel: '2.463 Ga',
    epochId: 'great-oxidation',
    formation: 'Hamersley Group, Pilbara, Australia',
    coordinates: '22.52° S, 118.21° E',
    dimensions: '34.2 × 21.8 × 14.0 cm',
    composition: 'Alternating Hematite (Fe₂O₃), Magnetite, & Jasper Chert (SiO₂)',
    isotopeNote: 'Δ³³S = 0.00 ‰ transition · Fe³⁺/ΣFe 0.89',
    description:
      'Micro-laminated chemical sediment precipitated as early cyanobacterial oxygen combined with dissolved oceanic ferrous iron. Each millimeter-scale couplet records seasonal oxygenation pulses during the Great Oxidation Event.',
    accentHex: '#fb7185',
    diagramType: 'bif'
  },
  {
    id: 'spec-stromatolite',
    accessionNumber: 'ETT-FOS-3430',
    name: 'Conophyton Microbial Reef Core',
    category: 'Fossil',
    ageLabel: '3.430 Ga',
    epochId: 'archean',
    formation: 'Strelley Pool Formation, Pilbara Craton',
    coordinates: '21.19° S, 119.12° E',
    dimensions: '28.5 × 16.0 × 15.5 cm',
    composition: 'Silicified Dolostone & Kerogen Laminae',
    isotopeNote: 'δ¹³C_org = -28.5 ‰ · δ¹³C_carb = +1.8 ‰',
    description:
      'Conical organosedimentary structure built upward toward sunlit shallow waters by ancient microbial mats trapping carbonate silt. Preserves morphological symmetry incompatible with abiotic mineral precipitation.',
    accentHex: '#38bdf8',
    diagramType: 'stromatolite'
  },
  {
    id: 'spec-anomalocaris',
    accessionNumber: 'ETT-FOS-0508',
    name: 'Anomalocaris canadensis Frontal Appendage',
    category: 'Fossil',
    ageLabel: '508.0 Ma',
    epochId: 'cambrian',
    formation: 'Walcott Quarry, Burgess Shale, British Columbia',
    coordinates: '51.44° N, 116.47° W',
    dimensions: '18.4 × 9.2 × 1.8 cm',
    composition: 'Aluminosilicate & Carbonaceous Compression Film',
    isotopeNote: 'Authigenic clay mineral replication',
    description:
      'Articulated raptorial appendage of the Cambrian marine apex predator, preserved in fine-grained turbidite mudstones with micron-scale preservation of spines and cuticle segmentation.',
    accentHex: '#00f0ff',
    diagramType: 'fossil'
  },
  {
    id: 'spec-lepidodendron',
    accessionNumber: 'ETT-FOS-0312',
    name: 'Lepidodendron Bark Compression',
    category: 'Fossil',
    ageLabel: '312.5 Ma',
    epochId: 'carboniferous',
    formation: 'Joggins Coal Measures, Nova Scotia',
    coordinates: '45.70° N, 64.44° W',
    dimensions: '42.0 × 27.5 × 6.2 cm',
    composition: 'Vitrinitic Carbon & Fine Siltstone Matrix',
    isotopeNote: 'C/N Ratio 94 · Atmospheric O₂ proxy ~32%',
    description:
      'Diamond-patterned leaf cushion impression from a 40-meter Paleozoic lycophyte tree. Rapid burial of undecayed lignin biomass in anoxic peat swamps drove Earth’s highest Phanerozoic oxygen levels.',
    accentHex: '#34d399',
    diagramType: 'fossil'
  },
  {
    id: 'spec-pt-clay',
    accessionNumber: 'ETT-MIN-0252',
    name: 'Meishan Bed 25 Boundary Clay',
    category: 'Impactite',
    ageLabel: '251.902 Ma ± 0.024 Ma',
    epochId: 'triassic-pangaea',
    formation: 'Yinkeng / Changxing Boundary, Zhejiang, China',
    coordinates: '31.08° N, 119.70° E',
    dimensions: '14.0 × 11.2 × 4.5 cm',
    composition: 'Illite-Montmorillonite Volcanic Ash & Pyrite Framboids',
    isotopeNote: 'δ¹³C excursion -6.0 ‰ · Hg spike 420 ppb',
    description:
      'White volcanic bentonite horizon marking the exact Permo-Triassic boundary. Contains high-precision U-Pb datable zircons and pyrite framboids documenting sudden marine euxinia during the Great Dying.',
    accentHex: '#f59e0b',
    diagramType: 'boundary'
  },
  {
    id: 'spec-chicxulub',
    accessionNumber: 'ETT-IMP-0066',
    name: 'Chicxulub Impact Melt & Iridium Clay',
    category: 'Impactite',
    ageLabel: '66.02 Ma',
    epochId: 'cretaceous',
    formation: 'IODP Core M0077A, Yucatán Shelf / Gubbio Horizon',
    coordinates: '21.45° N, 89.52° W',
    dimensions: '19.5 × 8.8 × 8.8 cm (Core Half)',
    composition: 'Suevite Melt Breccia, Shocked Quartz, & Platinum-Group Clays',
    isotopeNote: 'Iridium 65.4 ppb · Planar Deformation Features (PDFs)',
    description:
      'Drilled directly from the Chicxulub crater peak ring, preserving shocked granitic basement fused with vaporized Yucatán anhydrite—overlain by globally distributed iridium-enriched fallout clay.',
    accentHex: '#a78bfa',
    diagramType: 'impact'
  },
  {
    id: 'spec-vostok',
    accessionNumber: 'ETT-ICE-0001',
    name: 'EPICA Dome C Glacial Air Core Section',
    category: 'Ice & Core',
    ageLabel: '142.0 ka BP',
    epochId: 'holocene',
    formation: 'East Antarctic Ice Sheet (Depth 1,810 m)',
    coordinates: '75.10° S, 123.35° E',
    dimensions: '50.0 × 10.0 × 10.0 cm (Cryogenic)',
    composition: 'Hexagonal Ice (H₂O) with Trapped Paleoatmospheric Bubbles',
    isotopeNote: 'δD = -438 ‰ · Trapped CO₂ = 192 ppm · CH₄ = 410 ppb',
    description:
      'Crystal-clear glacial ice preserving micro-bubbles of pristine Pleistocene air from the penultimate ice age. Direct mass-spectrometric extraction links greenhouse gas forcing to polar temperature.',
    accentHex: '#7bd0ff',
    diagramType: 'icecore'
  }
];
