/**
 * GeoX — Projects & Data Model
 * Project architecture for GeoX Umbrella Ecosystem
 *
 * Order:
 * 1. Raster Lab:
 *    - Mars (GeoX Mars Explorer)
 *    - Paleo (PalaeoCoast / SeaLevelRize)
 *    - Sentinel (Sentinel Lab)
 * 2. Applications & Public Data Suite:
 *    - Restidsanalys
 *    - Valatlas
 *    - Områdesatlas
 *    - UtterIDE
 *    - KrisGIS
 */

export const products = [
  // ==========================================
  // RASTER LAB — Planetary & Earth Observation
  // ==========================================
  {
    id: "mars-explorer",
    category: "rasterlab",
    name: "GeoX Mars Explorer",
    eyebrow: "Raster Lab / Planetary Altimetry & 3D WebGL",
    tagline: "Planetary terrain and geospatial analysis laboratory for Mars.",
    description: "Interaktiv 3D WebGL-miljö för vetenskaplig utforskning av Mars topografi och landningsplatser med NASA MOLA höjddata (16 ppd), USGS/CTX-bilder och högupplösta HiRISE/CTX-terrängpaket. Inkluderar missionsdata för Perseverance- och Curiosity-rutter, interaktiva topografiska transekter och simulering av hypotetiska forntida oceaner.",
    url: "https://mars.geox.dev",
    previewPage: "mars.html",
    image: "assets/mars-explorer-preview.png",
    gallery: [
      {
        id: "jezero-3d",
        title: "3D Local Terrain — Jezero Crater",
        caption: "Perseverance route corridor med USGS CTX 5 m och HiRISE 20 m DTM höjdmodell.",
        src: "assets/mars-explorer-preview.png"
      },
      {
        id: "transect-marineris",
        title: "Topographic Transect — Valles Marineris",
        caption: "Vetenskaplig höjdprofil från Mars areoid (0 m) med NASA MOLA 16 ppd.",
        src: "assets/mars-transect-preview.png"
      },
      {
        id: "ocean-flooding",
        title: "Planetary Ocean Flooding — Northern Lowlands",
        caption: "Simulering av hypotetisk havsnivå och strandlinjer över Mars norra lågländer.",
        src: "assets/mars-ocean-preview.png"
      }
    ],
    status: "LIVE ON CLOUDFLARE PAGES",
    statusVariant: "staging",
    accentColor: "#F97316",
    accentGlow: "rgba(249, 115, 22, 0.20)",
    ctaText: "Starta Mars Explorer",
    ctaLink: "https://mars.geox.dev",
    repoUrl: "https://github.com/Exomoon/marsexplorer",
    isExternal: true,
    tags: ["3D WebGL Terrain", "NASA MOLA 16 PPD", "CTX 5m & HiRISE DTM", "Rover Traverses", "Topographic Transect", "Cloudflare Pages"],
    featured: true
  },
  {
    id: "palaeocoast",
    category: "rasterlab",
    name: "PalaeoCoast",
    eyebrow: "Raster Lab / Paleogeografi & Isostasi",
    tagline: "Utforska forntida kustlinjer och postglacial landhöjning i Östersjöregionen.",
    description: "Modellering och visualisering av Östersjöns och Fennoskandiens postglaciala strandlinjeförskjutning och landhöjning genom integrering av paleodata, digitala höjdmodeller och sedimentologiska lager.",
    url: "https://github.com/Exomoon/palaeocoast",
    image: "assets/paleocoast-preview.png",
    status: "LAB / RESEARCH",
    statusVariant: "lab",
    accentColor: "#06B6D4",
    accentGlow: "rgba(6, 182, 212, 0.16)",
    ctaText: "Utforska PalaeoCoast",
    ctaLink: "https://github.com/Exomoon/palaeocoast",
    isExternal: true,
    tags: ["Postglacial isostasi", "Paleokustlinjer", "Östersjöns utveckling", "Kvartärgeologi", "Höjdmodeller"],
    featured: true
  },
  {
    id: "sentinel-lab",
    category: "rasterlab",
    name: "Sentinel Lab",
    eyebrow: "Raster Lab / Satellitfjärranalys & Multispektral data",
    tagline: "Automatiserad analys av Copernicus Sentinel-2 MSI Level-2A data i 10 m upplösning.",
    description: "En högpresterande analys- och bearbetningspipeline för multispektrala satellitdata direkt från europeiska Copernicus. Automatiserad beräkning av vegetationsindex (NDVI), brandskador (dNBR) och vattenindex (MNDWI) baserat på botten-av-atmosfär (BOA) reflektans.",
    url: "https://github.com/Exomoon/rasterlab",
    image: "assets/sentinel-preview.png",
    status: "LAB / PIPELINE",
    statusVariant: "lab",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.16)",
    ctaText: "Utforska Sentinel Lab",
    ctaLink: "https://github.com/Exomoon/rasterlab",
    isExternal: true,
    tags: ["Copernicus Sentinel-2", "10m BOA multispektral", "NDVI & Vegetationshälsa", "dNBR Brandskador", "Rasterberäkningar"],
    featured: true
  },

  // ==========================================
  // APPLICATIONS & PUBLIC DATA SUITE
  // ==========================================
  {
    id: "restidsanalys",
    category: "applications",
    name: "Restidsanalys",
    eyebrow: "Beslutsstöd / Tillgänglighet / GIS",
    tagline: "Hur många invånare når viktig service inom 15 minuter?",
    description: "Restidsanalys hjälper organisationer att analysera verklig tillgänglighet till exempelvis vård, skolor och samhällsservice med gång, cykel, kollektivtrafik och bil — inklusive räckvidd, störningar och nya förbindelser.",
    url: "https://www.restidsanalys.se",
    image: "assets/restidsanalys-preview.png",
    logo: "assets/restidsanalys-logo.svg",
    status: "PILOT",
    statusVariant: "pilot",
    accentColor: "#0284C7",
    accentGlow: "rgba(2, 132, 199, 0.16)",
    ctaText: "Utforska Restidsanalys",
    ctaLink: "https://www.restidsanalys.se",
    isExternal: true,
    tags: ["Isokroner & räckvidd", "Multimodal analys", "Störningsscenarier", "Beslutsunderlag"],
    featured: true
  },
  {
    id: "valatlas",
    category: "applications",
    name: "Valatlas",
    eyebrow: "Samhällsdata / Valdata / Visualisering",
    tagline: "Utforska svensk politik från riksnivå till ditt eget valdistrikt.",
    description: "Kombinerar officiell valdata, kartor, partier, budgetar och kommunjämförelser för att göra svensk politik och demokratidata enklare att undersöka och förstå på djupet.",
    url: "https://www.valatlas.se",
    image: "assets/valatlas-preview.png",
    logo: "assets/valatlas-logo.svg",
    mark: "assets/valatlas-mark.svg",
    status: "LIVE / PUBLIC",
    statusVariant: "live",
    accentColor: "#6366F1",
    accentGlow: "rgba(99, 102, 241, 0.16)",
    ctaText: "Öppna Valatlas",
    ctaLink: "https://www.valatlas.se",
    isExternal: true,
    tags: ["Officiell valdata", "Valdistrikt & kommuner", "Interaktiva kartor", "Sakfrågor & budget"],
    featured: true
  },
  {
    id: "omradesatlas",
    category: "applications",
    name: "Områdesatlas",
    eyebrow: "Samhällsstatistik / Områdesdata / Demografi",
    tagline: "Utforska Sveriges samhälle, ekonomi och geografi genom data och kartor.",
    description: "Ett interaktivt atlasverktyg som sammanför demografi, socioekonomi, sysselsättning och regionala mönster i jämförbara geografiska områden över hela Sverige.",
    url: "https://omradesatlas.se",
    image: "assets/omradesatlas-preview.png",
    status: "LIVE",
    statusVariant: "live",
    accentColor: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.16)",
    ctaText: "Öppna Områdesatlas",
    ctaLink: "https://omradesatlas.se",
    isExternal: true,
    tags: ["Socioekonomi & demografi", "Kommunjämförelser", "Interaktiva kartor", "Offentlig statistik"],
    featured: true
  },
  {
    id: "utteride",
    category: "applications",
    name: "UtterIDE",
    eyebrow: "Developer tools / AI / Coding",
    tagline: "AI-kodagent med utvecklaren i kontroll.",
    description: "Ett experimentellt utvecklarverktyg som utforskar ett review-first arbetssätt för AI-assisterad utveckling med stöd för BYOK, flermodellskoppling (GPT, DeepSeek m.fl.), databaser och specialiserade verktyg.",
    url: "https://utteride.se",
    image: "assets/utteride-preview.jpg",
    logo: "assets/utteride-mark.svg",
    status: "IN DEVELOPMENT",
    statusVariant: "dev",
    accentColor: "#10B981",
    accentGlow: "rgba(16, 185, 129, 0.16)",
    ctaText: "Utforska UtterIDE",
    ctaLink: "https://utteride.se",
    isExternal: true,
    tags: ["Review-First", "BYOK", "Multi-Model", "Full kontroll"],
    featured: true
  },
  {
    id: "krisgis",
    category: "applications",
    name: "KrisGIS",
    eyebrow: "Krisberedskap / Lägesbild / Geodata",
    tagline: "Samlad geografisk lägesbild för kriser och samhällsstörningar.",
    description: "Samlar flera verifierbara och offentliga datakällor i en gemensam karta för att göra störningar och risker enklare att överblicka. KrisGIS är en oberoende informationstjänst och inte en myndighet eller officiell larmkanal.",
    url: "https://www.krisgis.se",
    image: "assets/krisgis-preview.png",
    logo: "assets/krisgis-logo.png",
    status: "LIVE",
    statusVariant: "live",
    accentColor: "#38BDF8",
    accentGlow: "rgba(56, 189, 248, 0.16)",
    ctaText: "Öppna KrisGIS",
    ctaLink: "https://www.krisgis.se",
    isExternal: true,
    tags: ["Realtidskarta", "Öppna myndighetsdata", "Samhällsstörningar", "Oberoende lägesbild"],
    featured: true
  }
];

export const rasterLabProjects = [
  {
    id: "palaeocoast",
    projectNumber: "01",
    name: "PalaeoCoast – Historical Coastline Explorer",
    nameSv: "PalaeoCoast – Historisk kustlinjeutforskare",
    eyebrow: "GeoX Raster Lab · Project 01",
    tagline: "Experimental Geospatial Modelling & Visualisation Sandbox",
    description: "Experimental modelling sandbox investigating European prehistoric coastlines from 22 000 BP through present day by coupling bathymetry (GEBCO & EMODnet) with relative sea-level curves and topological ocean connectivity. Land uplift, GIA, erosion and sedimentation are treated as distinct physical processes.",
    descriptionSv: "Experimentell modelleringssandlåda som utforskar forntida europeiska kustlinjer från 22 000 BP till nutid genom att koppla batymetri till havsnivåkurvor och topologisk havskontakt. Landhöjning, GIA, erosion och sedimentation behandlas som distinkta fysiska processer.",
    url: "sealevel.html",
    urlSv: "sealevel-sv.html",
    viewerUrl: "viewer/sealevel/index.html",
    image: "assets/sealevel-preview-en.png",
    imageSv: "assets/sealevel-preview.png",
    status: "EXPERIMENTAL SANDBOX",
    statusVariant: "sandbox",
    accentColor: "#ee7c3f",
    accentGlow: "rgba(238, 124, 63, 0.16)",
    tags: ["22 000 BP → 1950", "Topologisk havskontakt", "GEBCO & EMODnet", "GIA under utveckling"]
  },
  {
    id: "sentinel-lab",
    projectNumber: "02",
    name: "Sentinel Lab",
    nameSv: "Sentinel Lab",
    eyebrow: "GeoX Raster Lab · Project 02",
    tagline: "Multispectral satellite analytics, terrain modeling & band algebra",
    description: "High-resolution multi-temporal satellite imagery analysis across Copernicus Sentinel-2 Level-2A and Copernicus DEM GLO-30. Includes 5 analytical modules: vegetation phenology, wetland dynamics, wildfire burn severity, terrain topography, and AST band algebra.",
    descriptionSv: "Multitemporal satellit- och rasteranalys i 10 m upplösning med Copernicus Sentinel-2 Level-2A och Copernicus DEM GLO-30. Innehåller 5 analysmoduler: vegetationsdynamik, våtmarksförändring, brandskadegrad, terrängtopografi och sandlådad AST-rasterkalkylator.",
    url: "sentinel.html",
    urlSv: "sentinel-sv.html",
    viewerUrl: "viewer/sentinel/index.html",
    image: "assets/sentinel-viewer-preview.png",
    status: "EXPERIMENTAL SANDBOX",
    statusVariant: "sandbox",
    accentColor: "#00d2ff",
    accentGlow: "rgba(0, 210, 255, 0.18)",
    tags: ["Sentinel-2 Level-2A", "Copernicus DEM (10m/30m)", "5 Analysmoduler", "Under utveckling"]
  }
];


export const focusAreas = [
  {
    id: "rasterlab",
    title: "Raster Lab & Altimetry",
    description: "Planetära digitala höjdmodeller (DEM), 3D WebGL terrängrendering, multispektral satellitbearbetning och geovetenskaplig modellering."
  },
  {
    id: "geospatial",
    title: "Geospatial Engineering",
    description: "Isokroner, koordinattransformationer, spatial indexering, multimodal tillgänglighet och vektor-tiles."
  },
  {
    id: "data-software",
    title: "Data Pipelines & Web Apps",
    description: "Offentliga API:er, automatiserad ETL, visualisering och högpresterande interaktiva kartapplikationer."
  }
];

export const geoxPrinciples = [
  {
    step: "01",
    label: "Useful over impressive",
    title: "Teknik är bara värdefull när den går att använda",
    description: "Vi bygger inte lösningar för att visa upp teknik. Resultatet ska lösa ett verkligt problem och vara intuitivt i praktiken."
  },
  {
    step: "02",
    label: "Real data",
    title: "Verkliga och spårbara datakällor",
    description: "När det är möjligt bygger produkterna på officiella, öppna och verifierbara källor utan godtyckliga approximationer."
  },
  {
    step: "03",
    label: "Complexity underneath",
    title: "Det avancerade ligger bakom gränssnittet",
    description: "Komplexa beräkningar, GIS-analyser och AI-modeller ska arbeta i bakgrunden — aldrig stå i vägen för användaren."
  }
];
