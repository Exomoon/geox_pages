/**
 * GeoX Product Studio - Data Model
 * Reusable product architecture for GeoX Umbrella Ecosystem
 */

export const products = [
  {
    id: "valatlas",
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
    id: "krisgis",
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
  },
  {
    id: "restidsanalys",
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
    id: "utteride",
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
  }
];

export const focusAreas = [
  {
    id: "geospatial",
    title: "Geospatial",
    description: "Kartor, tillgänglighet, geografiska relationer och rumslig analys."
  },
  {
    id: "data",
    title: "Data",
    description: "Offentliga data, API:er, visualisering och beslutsunderlag."
  },
  {
    id: "software",
    title: "Software",
    description: "Webbprodukter, analysverktyg och AI-assisterad utveckling."
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
