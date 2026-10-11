const $ = (id) => document.getElementById(id);
const fmt = {format: (n) => Number(n).toLocaleString(state.lang === 'en' ? 'en-US' : 'sv-SE', {maximumFractionDigits: 1})};
const state = {catalog:null, scenario:null, frame:null, regionId:'aegean', mode:'full', layers:new Map(), layerSettings:new Map(), resultId:null, timer:null, api:false, customDirty:false, lang:'sv', analysisBounds:null, searchMarker:null, lastGeocodeAt:0};

const localPlaces = [
  {name:'Aten', aliases:['Athens','Athína'], lat:37.9838, lon:23.7275},
  {name:'Santorini', aliases:['Thira','Thera'], lat:36.3932, lon:25.4615},
  {name:'Kreta', aliases:['Crete'], lat:35.2401, lon:24.8093},
  {name:'Heraklion', aliases:['Iraklio'], lat:35.3387, lon:25.1442},
  {name:'Chania', aliases:['Hania'], lat:35.5138, lon:24.0180},
  {name:'Rhodos', aliases:['Rhodes'], lat:36.4341, lon:28.2176},
  {name:'Naxos', aliases:[], lat:37.1036, lon:25.3760},
  {name:'Paros', aliases:[], lat:37.0856, lon:25.1489},
  {name:'Mykonos', aliases:[], lat:37.4467, lon:25.3289},
  {name:'Syros', aliases:['Ermoupoli'], lat:37.4446, lon:24.9429},
  {name:'Milos', aliases:[], lat:36.6914, lon:24.3936},
  {name:'Korinth', aliases:['Corinth','Korint'], lat:37.9386, lon:22.9322},
  {name:'Delos', aliases:['Dilos'], lat:37.3964, lon:25.2674},
  {name:'Samos', aliases:[], lat:37.7548, lon:26.9778},
  {name:'Kos', aliases:[], lat:36.8915, lon:27.2877},
  {name:'Mytilene', aliases:['Lesbos'], lat:39.1070, lon:26.5553},
  {name:'Troja', aliases:['Troy','Troia'], lat:39.9575, lon:26.2389},
  {name:'Thessaloniki', aliases:['Saloniki'], lat:40.6401, lon:22.9444},
  {name:'Doggerbanken', aliases:['Dogger Bank'], lat:55.1, lon:2.5},
  {name:'London', aliases:[], lat:51.5072, lon:-0.1276},
  {name:'Amsterdam', aliases:[], lat:52.3676, lon:4.9041},
  {name:'Hamburg', aliases:[], lat:53.5511, lon:9.9937},
  {name:'Köpenhamn', aliases:['Copenhagen'], lat:55.6761, lon:12.5683},
  {name:'Paris', aliases:[], lat:48.8566, lon:2.3522},
  {name:'Stockholm', aliases:[], lat:59.3293, lon:18.0686}
];
const geocoderEndpoint = 'https://nominatim.openstreetmap.org/search';

const translations = {
  en: {
    scenarioPlatform: 'Geospatial scenario platform',
    methodSources: 'Method & sources',
    headline: 'Read coastal change layer by layer.',
    intro: 'Compare sea-level change alone with a scenario where land motion, erosion and deposition also reshape terrain. Experimental, under development.',
    eyebrow: 'PALAEOCOAST · EUROPE · EXPERIMENTAL, UNDER DEVELOPMENT',
    regionEurope: 'Europe',
    overview: '5 km overview',
    aegean: 'Aegean Sea',
    ready: 'Analysis data',
    nextRegion: '450 m regional demo',
    timeScenario: 'Time & scenario',
    scenario: 'Scenario',
    selectedTime: 'Selected time',
    older: 'Older',
    play: 'Play timeline',
    pause: 'Pause',
    comparison: 'Map view',
    reconstruction: 'Reconstruction',
    comparisonHelp: 'The reconstruction updates directly with time. Difference shows only where land motion, erosion or deposition changes the class compared with the same sea level on present terrain.',
    full: 'Landscape',
    seaOnly: 'Sea level',
    swipe: 'Swipe',
    difference: 'Difference from sea level only',
    seaModel: 'Control · sea level only',
    fullModel: 'Reconstruction · all processes',
    processLayers: 'Process layers',
    processTimeNote: 'Older dates show cumulative change in metres. At 0 BP the layers show process extent and assumed rate in mm/year.',
    recalculate: 'Advanced: recalculate model',
    recalcHint: 'This changes model assumptions, not layer visibility. Disable a process and recalculate the selected time locally.',
    rateWarning: 'Demo rates are synthetic and regionally generalised—not measured erosion or sedimentation rates.',
    landMotion: 'Land motion',
    erosion: 'Erosion',
    deposition: 'Deposition',
    calculate: 'Recalculate selected time',
    cellAnalysis: 'Cell analysis',
    clickPrompt: 'Click inside the selected model area to inspect a calculated cell.',
    todayTerrain: 'Present terrain',
    laterUplift: '− later uplift / + later subsidence',
    laterErosion: '+ later erosion',
    laterDeposition: '− later deposition',
    reconstructedTerrain: '= reconstructed past terrain',
    seaSurface: 'Selected sea surface',
    heightMargin: 'Elevation margin',
    computedClass: 'Calculated class',
    simpleClass: 'Sea-only class',
    legend: 'Legend',
    resolutionQuality: 'Resolution & quality',
    basemapDetail: 'Basemap',
    modelCell: 'Model cell',
    terrainSource: 'Terrain source',
    resolutionWarning: 'Zoom enlarges cells but creates no new terrain information.',
    fitRegion: 'Zoom to analysis coverage',
    drawAoi: 'Draw analysis area',
    gotoCoordinates: 'Go to coordinates',
    methodTitle: 'What the model shows — and does not show',
    methodIntro: 'The model reconstructs geometric elevation scenarios. It does not date settlements or model physical sediment transport, waves or ice-free conditions.',
    verifiedCandidates: 'Verified candidates for local refinement',
    datumWarning: 'These sources must not be merged without documented vertical-datum harmonisation. Finer resampling is not greater real accuracy.',
    opacity: 'Opacity',
    lacksRegional: 'Lacks regional data in this scenario.',
    iceUnavailableAtTime: 'No integrated ice-extent source matches this selected time. This does not by itself mean ice-free conditions.',
    land: 'Land',
    connectedSea: 'Connected sea',
    closedBasin: 'Closed basin',
    closedBasinsSeparate: 'Closed depressions are displayed with the separate layer.',
    noProcessDiff: 'No process difference',
    noDiffZeroBP: 'No difference at 0 BP',
    baselineDiffHint: 'The control scenario contains no landscape processes at any epoch.',
    zeroBPDiffHint: 'Cumulative landscape processes are zero at the reference baseline.',
    upliftSubsidence: 'Uplift / subsidence',
    warmUplift: 'Warm = uplift',
    blueSubsidence: 'Blue = subsidence',
    diffFromSeaOnly: 'Difference from sea level only',
    zeroBPNote: 'At 0 BP the scenario shows assumed rate, not cumulative change or observations.',
    fixedSymbolNote: 'Fixed symbol scale across timeline. Symbols are regular samples from the 600 m grid; faint surface shows variation between them.',
    emptyLayerZeroNote: '0 m: there is no subsequent time interval from 0 BP to modern datum.',
    deltaEffect: 'Landscape process effect',
    changedCells: 'changed cells',
    modelGrid: 'Model grid',
    surface: 'Continuous surface',
    markers: 'Sample markers',
    both: 'Both',
    off: 'Off',
    searchPlaceholder: 'Search place or lat, lon',
    searching: 'Searching for place…',
    noPlaceFound: 'No place found within the current analysis area.',
    outsideCoverage: 'is outside current analysis coverage.',
    waitSearch: 'Please wait a second before next search.',
    geocoderDown: 'Place search unavailable right now.',
    searchAttribution: 'Search data © OpenStreetMap',
    close: 'Close',
    mobileLayers: 'Layers',
    mobileComparison: 'Compare',
    mobileAnalysis: 'Analysis',
    cellSplitRequiresApi: 'Cell breakdown requires local Python server. Static map still displays all precomputed layers.'
  },
  sv: {
    regionEurope: 'Europa',
    opacity: 'Opacitet',
    lacksRegional: 'Saknar regionalt underlag i detta scenario.',
    iceUnavailableAtTime: 'Ingen integrerad isutbredningskälla matchar den valda tiden. Det betyder inte i sig att området var isfritt.',
    land: 'Land',
    connectedSea: 'Hav med kontakt',
    closedBasin: 'Sluten sänka',
    closedBasinsSeparate: 'Slutna sänkor visas med det separata lagret.',
    noProcessDiff: 'Ingen processkillnad',
    noDiffZeroBP: 'Ingen skillnad vid 0 BP',
    baselineDiffHint: 'Kontrollen innehåller inga separata landskapsprocesser, oavsett vald tid.',
    zeroBPDiffHint: 'De kumulativa landskapsprocesserna är noll i referensläget.',
    upliftSubsidence: 'Landhöjning / landsänkning',
    warmUplift: 'Varm = landhöjning',
    blueSubsidence: 'Blå = landsänkning',
    diffFromSeaOnly: 'Skillnad mot bara havsnivå',
    zeroBPNote: 'Vid 0 BP visas scenariots antagna hastighet, inte kumulativ förändring eller mätdata.',
    fixedSymbolNote: 'Fast symbolskala för hela tidsserien. Symbolerna är regelbundna stickprov ur 600-metersgridden; den svaga ytan visar variationen mellan dem.',
    emptyLayerZeroNote: '0 m: det finns inget senare tidsintervall från 0 BP till referensläget.',
    deltaEffect: 'Landskapsprocessernas effekt',
    changedCells: 'ändrade celler',
    modelGrid: 'Modellgrid',
    surface: 'Sammanhängande yta',
    markers: 'Stickprovsmarkörer',
    both: 'Båda',
    off: 'Av',
    searchPlaceholder: 'Sök ort eller lat, lon',
    searching: 'Söker efter plats…',
    noPlaceFound: 'Ingen plats hittades inom det valda analysområdet.',
    outsideCoverage: 'ligger utanför nuvarande analystäckning.',
    waitSearch: 'Vänta en sekund innan nästa sökning.',
    geocoderDown: 'Ortsökningen svarar inte just nu.',
    searchAttribution: 'Sökdata © OpenStreetMap',
    close: 'Stäng',
    mobileLayers: 'Lager',
    mobileComparison: 'Jämför',
    mobileAnalysis: 'Analys',
    cellSplitRequiresApi: 'Celluppdelning kräver den lokala Pythonservern. Den statiska kartan visar fortfarande alla färdigberäknade lager.'
  }
};

const scenarioUi = {
  en: {
    baseline: { name: 'Sea level only · control', status: 'CONTROL: present terrain and illustrative sea level. No separate land motion, erosion or deposition.' },
    spatial_scenario: { name: 'Sea level + landscape', status: 'HYPOTHETICAL TEST: synthetic land motion, erosion and deposition—not measurements.' },
    europe_overview: { name: 'Europe overview (5 km)', status: 'ILLUSTRATIVE OVERVIEW: present terrain with a manually selected sea-level curve; no ICE-6G_C correction. DATED-1 ice extent is a separate overlay.' },
    doggerland_overview: { name: 'Doggerland regional (450 m)', status: 'REGIONAL: 450 m bathymetry and prehistoric landscape reconstruction.' },
    aegean_ice6g_c: { name: 'Aegean ICE-6G_C', status: 'SCIENTIFIC MODEL: combined change in ground height relative to past sea level affects the coastline calculation. This is not pure land uplift.' },
    europe_ice6g_c: { name: 'Europe ICE-6G_C', status: 'SCIENTIFIC MODEL: ICE-6G_C relative land–sea change affects terrain and coastline; it is not pure uplift or an ice outline. DATED-1 separately displays ice extent.' },
    doggerland_ice6g_c: { name: 'Doggerland ICE-6G_C', status: 'SCIENTIFIC MODEL: combined change in ground height relative to past sea level affects the coastline calculation. This is not pure land uplift.' }
  },
  sv: {
    baseline: { name: 'Bara havsnivå · kontroll', status: 'KONTROLL: dagens terräng och illustrativ havsnivå. Ingen separat landrörelse, erosion eller sedimentpålagring.' },
    spatial_scenario: { name: 'Havsnivå + landskap', status: 'HYPOTETISKT TEST: syntetisk landrörelse, erosion och sedimentpålagring – inte mätningar.' },
    europe_overview: { name: 'Europa översikt (5 km)', status: 'ILLUSTRATIV ÖVERSIKT: dagens terräng med manuellt vald havsnivåkurva; ingen ICE-6G_C-korrigering. DATED-1:s isutbredning är ett separat visningslager.' },
    doggerland_overview: { name: 'Doggerland regional (450 m)', status: 'REGIONAL: 450 m batymetri och forntida landskapsrekonstruktion.' },
    aegean_ice6g_c: { name: 'Egeiska havet ICE-6G_C', status: 'VETENSKAPLIG MODELL: kombinerad förändring av markhöjd relativt dåtidens hav påverkar kustberäkningen. Detta är inte ren landhöjning.' },
    europe_ice6g_c: { name: 'Europa ICE-6G_C', status: 'VETENSKAPLIG MODELL: ICE-6G_C:s relativa land–hav-förändring påverkar terräng och kust. Det är varken ren landhöjning eller en isgräns; DATED-1 visar isutbredningen separat.' },
    doggerland_ice6g_c: { name: 'Doggerland ICE-6G_C', status: 'VETENSKAPLIG MODELL: kombinerad förändring av markhöjd relativt dåtidens hav påverkar kustberäkningen. Detta är inte ren landhöjning.' }
  }
};

const processLabels = {
  en: {
    paleo_elevation: 'Terrain relief · background',
    land_motion: 'Assumed land motion after selected date → 1950',
    erosion: 'Assumed erosion after selected date → 1950',
    deposition: 'Assumed deposition after selected date → 1950'
  },
  sv: {
    paleo_elevation: 'Terrängrelief · bakgrund',
    land_motion: 'Antagen landrörelse efter vald tid → 1950',
    erosion: 'Antagen erosion efter vald tid → 1950',
    deposition: 'Antagen sedimentpålagring efter vald tid → 1950'
  }
};

const rateLabels = {
  en: {
    land_motion: 'Assumed land motion at 0 BP',
    erosion: 'Assumed erosion at 0 BP',
    deposition: 'Assumed deposition at 0 BP'
  },
  sv: {
    land_motion: 'Antagen landrörelse vid 0 BP',
    erosion: 'Antagen erosion vid 0 BP',
    deposition: 'Antagen sedimentpålagring vid 0 BP'
  }
};

const layerDescriptions = {
  en: {
    paleo_elevation: 'Reconstructed elevation with epoch terrain shading. Sea level defines inundation; landscape processes alter topography.',
    terrain_change: 'Reconstructed elevation minus present elevation (m). Shows cumulative sum of land motion, erosion and deposition.',
    relative_height_anomaly: 'ICE-6G_C ground elevation anomaly relative to contemporaneous sea level compared to 0 ka. Combines crustal and sea-surface effects.',
    coastline: 'Boundary between computed land and hydraulically connected sea.',
    sensitivity: "Cells whose classification changes within the model's illustrative ±5 m elevation tolerance.",
    basins: 'Depressions below sea level lacking a topological open-sea connection.',
    land_motion: 'Cumulative assumed crustal movement to 1950. Warm pluses = uplift, blue = subsidence; symbols are grid samples.',
    erosion: 'Cumulative assumed material stripped away after selected epoch.',
    deposition: 'Cumulative assumed sediment accumulated after selected epoch.',
    ice_extent: 'Empirical ice sheet margin documented for this epoch. Absence of layer does not imply ice-free conditions.',
    palaeodrainage: 'Mapped palaeochannels from EMODnet Geology feature inventory.'
  },
  sv: {
    paleo_elevation: 'Rekonstruerad höjd med tidsberoende terrängskuggning. Havsnivån avgör vad som översvämmas; landskapsprocesserna ändrar själva höjden.',
    terrain_change: 'Rekonstruerad höjd minus dagens höjd, i meter. Visar bidraget från landrörelse, erosion och sedimentpålagring.',
    relative_height_anomaly: 'ICE-6G_C-markhöjd relativt samtidens hav jämfört med 0 ka. Innehåller både land- och havsyteeffekter och är inte ren landhöjning.',
    coastline: 'Gränsen mellan beräknat land och hav med havskontakt.',
    sensitivity: 'Celler vars klass kan ändras inom modellens illustrativa höjdmarginal.',
    basins: 'Terräng under havsytan utan beräknad kontakt med öppet hav.',
    land_motion: 'Kumulativ antagen rörelse till 1950. Varma plus visar höjning och blå plus visar sänkning; symbolerna är stickprov ur modellgridden.',
    erosion: 'Kumulativ antagen höjd som eroderats bort efter vald äldre tid.',
    deposition: 'Kumulativ antagen sedimenthöjd som lagrats efter vald äldre tid.',
    ice_extent: 'Källbelagd empirisk isutbredning för just detta tidssteg. Saknat lager betyder inte automatiskt isfritt.',
    palaeodrainage: 'Kartlagda palaeokanaler från EMODnet Geology. Inventariet är inte en samtidig eller komplett flodrekonstruktion.'
  }
};

const rateDescriptions = {
  en: {
    land_motion: 'Assumed land motion rate at 0 BP (1950), in mm/yr—not observational data.',
    erosion: 'Area where scenario assumes erosion at 0 BP (1950), shown as mm/yr—not observational data.',
    deposition: 'Area where scenario assumes deposition at 0 BP (1950), shown as mm/yr—not observational data.'
  },
  sv: {
    land_motion: 'Antagen landrörelsehastighet vid referensläget 0 BP (1950), i mm/år – inte mätdata.',
    erosion: 'Område där scenariot antar erosion vid 0 BP (1950), visat som mm/år – inte mätdata.',
    deposition: 'Område där scenariot antar sedimentpålagring vid 0 BP (1950), visat som mm/år – inte mätdata.'
  }
};

document.querySelectorAll('[data-i18n]').forEach(el => el.dataset.sv = el.textContent);

const map = L.map('map', {
  zoomControl: false,
  minZoom: 2,
  zoomSnap: .25,
  zoomDelta: .25,
  wheelPxPerZoomLevel: 90,
  worldCopyJump: false,
  maxBoundsViscosity: 0.7
}).setView([37.6, 25.4], 6);
L.control.zoom({position: 'bottomright'}).addTo(map);
L.control.scale({imperial: false, position: 'bottomleft'}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© OpenStreetMap contributors'}).addTo(map);
map.createPane('resultA'); map.getPane('resultA').style.zIndex = 410;
map.createPane('resultB'); map.getPane('resultB').style.zIndex = 420;
map.createPane('process'); map.getPane('process').style.zIndex = 430;
map.createPane('terrain'); map.getPane('terrain').style.zIndex = 405;

function t(key) {
  return translations[state.lang]?.[key] || translations.sv?.[key] || document.querySelector(`[data-i18n="${key}"]`)?.dataset.sv || key;
}
function currentScenario() { return state.catalog.scenarios.find(s => s.id === $('scenario').value); }
function currentFrame() { return currentScenario().frames[+$('time').value]; }
function setText(id, value) { const el = $(id); if (el) el.textContent = value; }

const mobileMedia = window.matchMedia('(max-width: 900px)');
const mobilePanelOrigins = new Map();
let activeMobilePanel = null;
let activeMobileTrigger = null;

function syncMobileControls() {
  if (!state.catalog) return;
  const desktopScenario = $('scenario'), mobileScenario = $('mobileScenario');
  if (mobileScenario && desktopScenario) {
    mobileScenario.innerHTML = desktopScenario.innerHTML;
    mobileScenario.value = desktopScenario.value;
  }
  const desktopTime = $('time'), mobileTime = $('mobileTime');
  if (mobileTime && desktopTime) {
    mobileTime.max = desktopTime.max;
    mobileTime.value = desktopTime.value;
  }
  setText('mobileAge', state.frame ? `${fmt.format(state.frame.age_bp)} BP` : '—');
  const mobilePlay = $('mobilePlay');
  if (mobilePlay) {
    mobilePlay.lastElementChild.textContent = state.timer ? t('pause') : t('play');
    mobilePlay.firstElementChild.textContent = state.timer ? 'Ⅱ' : '▶';
  }
}

function closeMobileSheet({restoreFocus = false} = {}) {
  if (!activeMobilePanel) return;
  const target = $(activeMobilePanel), origin = mobilePanelOrigins.get(activeMobilePanel);
  if (target && origin) {
    target.classList.remove('in-mobile-sheet');
    if (origin.next && origin.next.parentNode === origin.parent) origin.parent.insertBefore(target, origin.next);
    else origin.parent.append(target);
  }
  $('mobileSheet').hidden = true;
  $('mobileSheetBackdrop').hidden = true;
  document.body.classList.remove('mobile-sheet-open');
  document.querySelectorAll('[data-mobile-panel]').forEach(button => button.classList.remove('active'));
  const trigger = activeMobileTrigger;
  activeMobilePanel = null;
  activeMobileTrigger = null;
  if (restoreFocus) trigger?.focus();
}

function openMobileSheet(panelId, trigger = null) {
  if (!mobileMedia.matches) return;
  if (activeMobilePanel === panelId) { closeMobileSheet({restoreFocus: true}); return; }
  closeMobileSheet();
  const target = $(panelId);
  if (!target || target.hidden) return;
  mobilePanelOrigins.set(panelId, {parent: target.parentNode, next: target.nextSibling});
  $('mobileSheetContent').append(target);
  target.classList.add('in-mobile-sheet');
  setText('mobileSheetTitle', target.querySelector('h2')?.textContent || 'Panel');
  $('mobileSheet').hidden = false;
  $('mobileSheetBackdrop').hidden = false;
  document.body.classList.add('mobile-sheet-open');
  trigger?.classList.add('active');
  activeMobilePanel = panelId;
  activeMobileTrigger = trigger;
  $('closeMobileSheet').focus({preventScroll: true});
}

function removeResultLayers() {
  for (const key of ['state_full', 'state_sea', 'class_difference']) {
    const layer = state.layers.get(key); if (layer) { map.removeLayer(layer); state.layers.delete(key); }
  }
}
function addImage(key, info, pane = 'process', opacity = .8) {
  const old = state.layers.get(key); if (old) map.removeLayer(old);
  const layer = info.tiles
    ? L.tileLayer(info.tiles, {pane, opacity, interactive: false, noWrap: true, minNativeZoom: info.min_native_zoom, maxNativeZoom: info.max_native_zoom, maxZoom: 14, className: 'model-raster'})
    : L.imageOverlay(info.url, info.bounds, {pane, opacity, interactive: false, crossOrigin: false, className: 'model-raster'});
  layer.addTo(map);
  state.layers.set(key, layer); return layer;
}
function removeMapLayer(key) { const layer = state.layers.get(key); if (layer) { map.removeLayer(layer); state.layers.delete(key); } }
const processRateLayers = {land_motion: 'uplift_rate', erosion: 'erosion_rate', deposition: 'deposition_rate'};
function processDisplay(name) {
  const vector = state.frame.vector_layers?.[name];
  if (vector) return {info: vector, key: name, isRate: false, isVector: true};
  const scenarioVector = state.scenario.frames.find(frame => frame.vector_layers?.[name])?.vector_layers?.[name];
  if (scenarioVector) return {info: {...scenarioVector, empty: true}, key: name, isRate: false, isVector: true};
  const cumulative = state.frame.layers[name], rateKey = processRateLayers[name], rate = rateKey ? state.frame.layers[rateKey] : null;
  if (state.frame.age_bp === 0 && rate && !rate.empty) return {info: rate, key: rateKey, isRate: true};
  return {info: cumulative, key: name, isRate: false, isVector: false};
}
function motionScale(layerKey = 'land_motion') {
  const max = Math.max(.001, ...state.scenario.frames.flatMap(frame => [Math.abs(frame.layers[layerKey]?.min || 0), Math.abs(frame.layers[layerKey]?.max || 0)]));
  return {max, low: max / 3, high: max * 2 / 3};
}
function motionLevel(value, layerKey) {
  const magnitude = Math.abs(value), scale = motionScale(layerKey);
  return magnitude >= scale.high ? 'high' : magnitude >= scale.low ? 'medium' : 'low';
}
function renderMotionSymbols(opacity = 1) {
  removeMapLayer('land_motion_symbols');
  const display = processDisplay('land_motion'), symbols = display.info?.symbols || [];
  if (!symbols.length) return;
  const maxAbs = Math.max(...symbols.map(symbol => Math.abs(symbol.value)), .001);
  const stride = map.getZoom() <= 5 ? 2 : 1;
  const group = L.layerGroup();
  symbols.forEach((symbol, index) => {
    if (index % stride) return;
    const positive = symbol.value > 0;
    const magnitude = Math.abs(symbol.value);
    const level = motionLevel(symbol.value, display.key);
    const size = Math.round(18 + Math.min(8, magnitude / maxAbs * 8));
    const glyph = '+';
    const valueSign = positive ? '+' : '−';
    const unit = display.isRate ? (state.lang === 'en' ? 'mm/yr' : 'mm/år') : 'm';
    const valueLabel = `${valueSign}${fmt.format(magnitude)} ${unit}`;
    const motionType = positive ? (state.lang === 'en' ? 'Uplift' : 'Landhöjning') : (state.lang === 'en' ? 'Subsidence' : 'Landsänkning');
    const subtitle = display.isRate ? (state.lang === 'en' ? 'Assumed rate at 0 BP' : 'Antagen hastighet vid 0 BP') : (state.lang === 'en' ? 'Cumulative land motion' : 'Kumulativ landrörelse');
    const explanation = display.isRate
      ? (state.lang === 'en' ? 'Scenario assumption at 1950 datum—not a measurement.' : 'Scenarioantagande vid referensläget 1950 – inte en mätning.')
      : (state.lang === 'en' ? 'Change from selected epoch to 1950.' : 'Förändring från vald äldre tid till 1950.');
    const magLabel = level === 'high' ? (state.lang === 'en' ? 'high' : 'stor') : level === 'medium' ? (state.lang === 'en' ? 'medium' : 'medelstor') : (state.lang === 'en' ? 'small' : 'liten');
    const icon = L.divIcon({
      className: 'motion-marker',
      iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      html: `<span class="motion-symbol ${positive ? 'uplift' : 'subsidence'} level-${level}" style="--symbol-size:${size}px;opacity:${opacity}" aria-hidden="true">${glyph}</span>`
    });
    L.marker([symbol.lat, symbol.lon], {icon, pane: 'process', keyboard: false})
      .bindPopup(`<div class="motion-popup"><span class="motion-popup-symbol ${positive ? 'uplift' : 'subsidence'} level-${level}">${glyph}</span><div><small>${subtitle}</small><strong>${motionType} · ${valueLabel}</strong><p>${explanation} · ${magLabel} ${state.lang === 'en' ? 'magnitude' : 'magnitud'}.</p></div></div>`)
      .addTo(group);
  });
  group.addTo(map); state.layers.set('land_motion_symbols', group);
}
function refreshMotionSymbols() {
  const settings = state.layerSettings.get('land_motion');
  if (settings?.enabled && !['surface', 'off'].includes(settings.visual) && !processDisplay('land_motion').info.empty) {
    renderMotionSymbols(settings.opacity);
  }
}
function renderResult() {
  const frame = state.frame;
  removeResultLayers();
  if (state.mode === 'full') addImage('state_full', frame.layers.state_full, 'resultB', .76);
  if (state.mode === 'sea') addImage('state_sea', frame.layers.state_sea, 'resultA', .76);
  if (state.mode === 'difference') {
    addImage('state_full', frame.layers.state_full, 'resultB', .48);
    if (frame.changed_cells > 0) addImage('class_difference', frame.layers.class_difference, 'process', .98);
  }
}

function layerLabel(name, display = processDisplay(name)) {
  const lang = state.lang || 'sv';
  const labels = display.isRate ? rateLabels[lang] : processLabels[lang];
  return labels?.[name] || display.info?.title || name;
}
function layerDescription(name, display = processDisplay(name)) {
  const lang = state.lang || 'sv';
  const descs = display.isRate ? rateDescriptions[lang] : layerDescriptions[lang];
  return descs?.[name] || '';
}

const processNames = ['paleo_elevation', 'terrain_change', 'relative_height_anomaly', 'coastline', 'sensitivity', 'basins', 'land_motion', 'erosion', 'deposition'];
processNames.push('ice_extent', 'palaeodrainage');

for (const name of processNames) state.layerSettings.set(name, {enabled: name === 'coastline' || name === 'paleo_elevation' || name === 'ice_extent', opacity: name === 'coastline' ? 1 : name === 'paleo_elevation' ? 0.88 : 0.78, visual: name === 'land_motion' ? 'both' : null});
const vectorCache = new Map();
function availableProcessNames() {
  return processNames.filter(name => state.frame.layers[name] || state.frame.vector_layers?.[name] || state.scenario.frames.some(frame => frame.vector_layers?.[name]));
}
function vectorStyle(name, opacity, feature = null) {
  if (name === 'ice_extent') {
    const extent = feature?.properties?.extent;
    if (extent === 'maximum') return {color: '#79adbf', weight: 1.4, opacity: opacity * .95, dashArray: '5 4', fillColor: '#dff2f7', fillOpacity: opacity * .03};
    if (extent === 'minimum') return {color: '#e6f7fa', weight: 1.3, opacity, fillColor: '#eefbff', fillOpacity: opacity * .07};
    return {color: '#9ed1df', weight: 1.7, opacity, fillColor: '#c8e9f1', fillOpacity: opacity * .22};
  }
  return {color: '#3aa6b7', weight: 2, opacity, fillOpacity: 0, dashArray: '6 4'};
}
async function addVector(name, info, opacity) {
  const url = info.url;
  if (!vectorCache.has(url)) vectorCache.set(url, fetch(url).then(response => { if (!response.ok) throw Error(`Kunde inte läsa ${url}`); return response.json(); }));
  try {
    const data = await vectorCache.get(url);
    if (state.frame.vector_layers?.[name]?.url !== url || !state.layerSettings.get(name)?.enabled) return;
    removeMapLayer(name);
    const layer = L.geoJSON(data, {
      pane: 'process', interactive: true,
      style: feature => vectorStyle(name, opacity, feature),
      onEachFeature: (feature, featureLayer) => {
        const extentLabels = state.lang === 'en'
          ? {maximum: 'Maximum published extent', most_credible: 'Most credible extent', minimum: 'Minimum published extent'}
          : {maximum: 'Största publicerade utbredning', most_credible: 'Mest trovärdig utbredning', minimum: 'Minsta publicerade utbredning'};
        const extent = extentLabels[feature.properties?.extent];
        featureLayer.bindPopup(`<b>${info.title}</b>${extent ? `<small>${extent}</small>` : ''}<p>${info.detail || ''}</p>`);
      },
    }).addTo(map);
    state.layers.set(name, layer);
  } catch (error) { showMapMessage(error.message); }
}
function setProcessOpacity(name, layer, opacity) {
  if (name === 'land_motion') { layer.setOpacity(opacity * .24); return; }
  if (state.frame.vector_layers?.[name]) { layer.setStyle(feature => vectorStyle(name, opacity, feature)); return; }
  layer.setOpacity(opacity);
}
function buildLayerControls() {
  $('layerControls').innerHTML = '';
  for (const name of availableProcessNames()) {
    const settings = state.layerSettings.get(name);
    const display = processDisplay(name), info = display.info;
    const description = info.empty ? (name === 'ice_extent' ? t('iceUnavailableAtTime') : t('lacksRegional')) : layerDescription(name, display);
    const row = document.createElement('div'); row.className = `layer-row layer-${name}${info.empty ? ' is-empty' : ''}`; row.title = description;
    const available = !info.empty;
    const visual = name === 'land_motion' ? '<span class="layer-glyphs"><i>+</i><i>+</i></span>' : `<span class="layer-swatch ${name}"></span>`;
    const motionMode = name === 'land_motion' ? `<select class="motion-display" aria-label="Visning av landrörelse"><option value="surface" ${settings.visual === 'surface' ? 'selected' : ''}>${t('surface')}</option><option value="markers" ${settings.visual === 'markers' ? 'selected' : ''}>${t('markers')}</option><option value="both" ${settings.visual === 'both' ? 'selected' : ''}>${t('both')}</option><option value="off" ${settings.visual === 'off' ? 'selected' : ''}>${t('off')}</option></select>` : '';
    row.innerHTML = `<input type="checkbox" data-layer="${name}" ${settings.enabled && available ? 'checked' : ''} ${available ? '' : 'disabled'}><div class="layer-copy"><label>${visual}<span>${layerLabel(name, display)}</span></label><small>${description}</small>${motionMode}</div><div class="opacity-control"><span>${t('opacity')}</span><input type="range" min="0" max="100" value="${Math.round(settings.opacity * 100)}" aria-label="${t('opacity')}" title="${t('opacity')} ${Math.round(settings.opacity * 100)} %" ${settings.enabled && available ? '' : 'disabled'}></div>`;
    const toggle = row.children[0], opacity = row.querySelector('input[type=range]');
    toggle.onchange = () => { settings.enabled = toggle.checked; opacity.disabled = !toggle.checked; toggleProcess(name, settings.enabled && available, settings.opacity); };
    opacity.oninput = () => {
      settings.opacity = +opacity.value / 100;
      opacity.title = `${t('opacity')} ${opacity.value} %`;
      const layer = state.layers.get(name);
      if (layer) setProcessOpacity(name, layer, settings.opacity);
      if (name === 'land_motion' && !['surface', 'off'].includes(settings.visual)) renderMotionSymbols(settings.opacity);
    };
    const motionSelect = row.querySelector('.motion-display');
    if (motionSelect) motionSelect.onchange = () => { settings.visual = motionSelect.value; toggleProcess(name, settings.enabled && available, settings.opacity); };
    $('layerControls').append(row);
    if (settings.enabled && available) toggleProcess(name, true, settings.opacity);
  }
}
function toggleProcess(name, on, opacity) {
  removeMapLayer(name); if (name === 'land_motion') removeMapLayer('land_motion_symbols');
  if (on) {
    const display = processDisplay(name);
    if (display.isVector) addVector(name, display.info, opacity);
    else if (name !== 'land_motion' || !['markers', 'off'].includes(state.layerSettings.get(name)?.visual)) addImage(name, display.info, 'process', name === 'land_motion' ? opacity * .24 : opacity);
    if (name === 'land_motion' && !['surface', 'off'].includes(state.layerSettings.get(name)?.visual)) renderMotionSymbols(opacity);
  }
  updateLegend(name, on);
}
function updateLegend(activeName, on = true) {
  if (activeName && on === false) activeName = availableProcessNames().find(name => state.layerSettings.get(name)?.enabled && !processDisplay(name).info.empty) || null;
  const display = activeName ? processDisplay(activeName) : null;
  const info = display?.info || state.frame.layers[state.mode === 'difference' ? 'class_difference' : state.mode === 'sea' ? 'state_sea' : 'state_full'];
  if (!activeName && state.mode === 'difference' && state.frame.changed_cells === 0) {
    const baseline = state.scenario.id === 'baseline';
    $('legend').innerHTML = baseline ? `<b>${t('noProcessDiff')}</b><p class="hint">${t('baselineDiffHint')}</p>` : `<b>${t('noDiffZeroBP')}</b><p class="hint">${t('zeroBPDiffHint')}</p>`;
    return;
  }
  if (info.empty) {
    $('legend').innerHTML = `<b>${activeName ? layerLabel(activeName) : info.title} · ${info.units}</b><p class="hint">${t('emptyLayerZeroNote')}</p>`;
    return;
  }
  if (activeName === 'land_motion') {
    const scale = motionScale(display.key), low = fmt.format(scale.low), high = fmt.format(scale.high), max = fmt.format(scale.max);
    $('legend').innerHTML = `<b>${t('upliftSubsidence')} · ${info.units}</b><div class="motion-symbol-explanation"><span><i class="motion-key uplift level-medium">+</i> ${t('warmUplift')}</span><span><i class="motion-key subsidence level-medium">+</i> ${t('blueSubsidence')}</span></div><div class="motion-legend"><span class="motion-key subsidence level-high">+</span><small>−${max} till −${high}</small><span class="motion-key subsidence level-medium">+</span><small>−${high} till −${low}</small><span class="motion-key subsidence level-low">+</span><small>−${low} till 0</small><span class="motion-key uplift level-low">+</span><small>0 till +${low}</small><span class="motion-key uplift level-medium">+</span><small>+${low} till +${high}</small><span class="motion-key uplift level-high">+</span><small>+${high} till +${max}</small></div><div class="gradient" style="background:linear-gradient(90deg,#344b89,#9cadd3,#f3efe1,#e5a08f,#8f382e)"></div><p class="legend-note">${display.isRate ? t('zeroBPNote') : t('fixedSymbolNote')}</p>`;
    return;
  }
  if (info.kind === 'ice' || info.kind === 'drainage') {
    if (info.kind === 'ice' && info.uncertainty) {
      const labels = state.lang === 'en'
        ? ['Maximum published extent', 'Most credible extent', 'Minimum published extent']
        : ['Största publicerade utbredning', 'Mest trovärdig utbredning', 'Minsta publicerade utbredning'];
      $('legend').innerHTML = `<b>${info.title}</b><div class="ice-uncertainty-legend"><span class="ice-key ice-max"></span><small>${labels[0]}</small><span class="ice-key ice-mc"></span><small>${labels[1]}</small><span class="ice-key ice-min"></span><small>${labels[2]}</small></div><p class="legend-note">${info.detail || layerDescription(activeName, display)}</p>`;
      return;
    }
    const color = info.kind === 'ice' ? '#dff2f7' : '#3aa6b7';
    $('legend').innerHTML = `<div class="legend-row"><i class="swatch" style="background:${color};border:1px solid #307a8b"></i>${info.title}</div><p class="legend-note">${info.detail || layerDescription(activeName, display)}</p>`;
    return;
  }
  if (info.kind === 'state') $('legend').innerHTML = `<div class="legend-row"><i class="swatch" style="background:#d3c091"></i>${t('land')}</div><div class="legend-row"><i class="swatch" style="background:#155870"></i>${t('connectedSea')}</div><p class="legend-note">${t('closedBasinsSeparate')}</p>`;
  else if (['diverging', 'positive', 'terrain'].includes(info.kind)) {
    const gradients = {paleo_elevation: 'linear-gradient(90deg,#10384b,#4f93a0,#d9c89e,#8da672,#8a725e,#e8e3d8)', terrain_change: 'linear-gradient(90deg,#4a63a8,#f3efe1,#cb5b3e)', erosion: 'linear-gradient(90deg,#fff4d5,#d04d2e)', deposition: 'linear-gradient(90deg,#eef5c6,#30896f)', land_motion: 'linear-gradient(90deg,#4a63a8,#f3efe1,#cb5b3e)'};
    $('legend').innerHTML = `<b>${activeName ? layerLabel(activeName, display) : info.title} · ${info.units}</b><div class="gradient" style="background:${gradients[activeName] || 'linear-gradient(90deg,#133d59,#d8c89a,#6d5139)'}"></div><div class="legend-scale"><span>${info.min}</span><span>${info.kind === 'diverging' ? '0' : ''}</span><span>${info.max}</span></div><p class="legend-note">${activeName ? layerDescription(activeName, display) : ''}</p>`;
  } else {
    const title = state.mode === 'difference' && !activeName ? t('diffFromSeaOnly') : info.title;
    $('legend').innerHTML = `<div class="legend-row"><i class="swatch" style="background:${info.kind === 'coast' ? '#fff6db' : info.kind === 'basin' ? '#725982' : '#ee7c3f'}"></i>${title}</div>`;
  }
}
function renderFrame(frameOverride = null) {
  state.scenario = currentScenario(); state.frame = frameOverride || currentFrame(); state.resultId = frameOverride?.result_id || null;
  const differenceButton = document.querySelector('[data-mode="difference"]');
  differenceButton.disabled = !state.scenario.has_landscape_processes || state.scenario.comparison_available === false;
  $('comparisonSection').hidden = !state.scenario.has_landscape_processes || state.scenario.comparison_available === false;
  $('mobileComparisonButton').hidden = $('comparisonSection').hidden;
  if ($('comparisonSection').hidden && activeMobilePanel === 'comparisonSection') closeMobileSheet();
  if ((!state.scenario.has_landscape_processes || state.scenario.comparison_available === false) && state.mode === 'difference') {
    state.mode = 'full'; document.querySelectorAll('.segmented button').forEach(button => button.classList.toggle('active', button.dataset.mode === 'full'));
  }
  setText('age', `${fmt.format(state.frame.age_bp)} BP`);
  setText('scenarioStatus', (scenarioUi[state.lang] || scenarioUi.sv)?.[state.scenario.id]?.status || state.scenario.status);
  setText('seaLand', `${fmt.format(state.frame.sea_only.land_km2)} km² ${t('land').toLowerCase()}`);
  setText('fullLand', `${fmt.format(state.frame.full.land_km2)} km² ${t('land').toLowerCase()}`);
  const d = state.frame.delta;
  setText('deltaStats', state.lang === 'en'
    ? `${t('deltaEffect')}: land ${signed(d.land_km2)} km² · sea ${signed(d.ocean_km2)} km² · basins ${signed(d.basin_km2)} km² · ${fmt.format(state.frame.changed_cells)} ${t('changedCells')}`
    : `${t('deltaEffect')}: land ${signed(d.land_km2)} km² · hav ${signed(d.ocean_km2)} km² · sänkor ${signed(d.basin_km2)} km² · ${fmt.format(state.frame.changed_cells)} ${t('changedCells')}`);
  setText('modelResolution', `${t('modelGrid')} · ${fmt.format(state.scenario.resolution_m)} m · ${state.scenario.source_resolution}`);
  setText('qualityModelCell', `${fmt.format(state.scenario.resolution_m)} × ${fmt.format(state.scenario.resolution_m)} m · EPSG:3035`);
  setText('qualityTerrainSource', state.scenario.source_resolution);
  for (const [key, layer] of state.layers) { map.removeLayer(layer); } state.layers.clear();
  renderResult(); buildLayerControls();
  const activeProcess = [...availableProcessNames()].reverse().find(name => state.layerSettings.get(name)?.enabled && !processDisplay(name).info.empty);
  updateLegend(activeProcess); clearCell(); updateCalculationControls(); syncMobileControls();
}
function signed(n) { return `${n >= 0 ? '+' : '−'}${fmt.format(Math.abs(n))}`; }
function normaliseSearch(value) { return value.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
function localSearch(query) {
  const needle = normaliseSearch(query);
  if (!needle) return [];
  return localPlaces.filter(place => [place.name, ...place.aliases].some(name => normaliseSearch(name).includes(needle))).slice(0, 6);
}
function hideSearchResults() { $('searchResults').hidden = true; $('searchResults').replaceChildren(); $('goto').setAttribute('aria-expanded', 'false'); }
function showSearchResults(results, {external = false} = {}) {
  const list = $('searchResults'); list.replaceChildren();
  for (const result of results) {
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'option');
    const title = document.createElement('strong'); title.textContent = result.name;
    const meta = document.createElement('small'); meta.textContent = result.detail || `${result.lat.toFixed(4)}°, ${result.lon.toFixed(4)}°`;
    button.append(title, meta); button.onclick = () => goToPlace(result); list.append(button);
  }
  if (external) { const attribution = document.createElement('a'); attribution.href = 'https://www.openstreetmap.org/copyright'; attribution.target = '_blank'; attribution.rel = 'noreferrer'; attribution.className = 'search-attribution'; attribution.textContent = t('searchAttribution'); list.append(attribution); }
  list.hidden = !results.length; $('goto').setAttribute('aria-expanded', String(results.length > 0));
}
function showMapMessage(message) { $('aoiMessage').hidden = false; $('aoiMessage').textContent = message; }
function goToPlace(place) {
  const point = L.latLng(place.lat, place.lon);
  if (state.analysisBounds && !state.analysisBounds.contains(point)) { showMapMessage(`${place.name} ${t('outsideCoverage')}`); return; }
  $('aoiMessage').hidden = true; hideSearchResults(); $('goto').value = place.name;
  if (state.searchMarker) map.removeLayer(state.searchMarker);
  state.searchMarker = L.circleMarker(point, {radius: 7, color: '#fff', weight: 2, fillColor: '#ee7c3f', fillOpacity: 1, pane: 'markerPane'}).addTo(map).bindTooltip(place.name, {permanent: false, direction: 'top'});
  map.flyTo(point, Math.max(map.getZoom(), 9));
}
function parseCoordinates(value) {
  const parts = value.trim().split(/[,; ]+/).map(Number).filter(Number.isFinite);
  return parts.length >= 2 && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180 ? {name: `${parts[0].toFixed(5)}°, ${parts[1].toFixed(5)}°`, lat: parts[0], lon: parts[1]} : null;
}
async function geocodePlace(query) {
  const cacheKey = `palaeocoast:geocode:${normaliseSearch(query)}`;
  try { const cached = JSON.parse(localStorage.getItem(cacheKey)); if (Array.isArray(cached)) return cached; } catch {}
  if (Date.now() - state.lastGeocodeAt < 1000) throw Error(t('waitSearch'));
  state.lastGeocodeAt = Date.now();
  const bounds = state.analysisBounds;
  const params = new URLSearchParams({q: query, format: 'jsonv2', limit: '5', 'accept-language': state.lang});
  if (bounds) { params.set('viewbox', `${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`); params.set('bounded', '1'); }
  const response = await fetch(`${geocoderEndpoint}?${params}`);
  if (!response.ok) throw Error(t('geocoderDown'));
  const data = await response.json();
  const results = data.map(item => ({name: item.display_name.split(',')[0], detail: item.display_name, lat: Number(item.lat), lon: Number(item.lon)}));
  try { localStorage.setItem(cacheKey, JSON.stringify(results)); } catch {}
  return results;
}
function configureAnalysisBounds(fit = true) {
  const raw = state.scenario?.analysis_bounds;
  if (!raw) return;
  state.analysisBounds = L.latLngBounds(raw);
  map.setMinZoom(1);
  map.setMaxBounds(state.analysisBounds.pad(0.12));
  const regionMinZoom = map.getBoundsZoom(state.analysisBounds, false, [8, 8]);
  map.setMinZoom(Math.max(1, regionMinZoom - 1));
  if (fit) map.fitBounds(state.analysisBounds, {padding: [8, 8], animate: false});
}
function scenariosForRegion(regionId) { return state.catalog.scenarios.filter(scenario => scenario.region_id === regionId); }
function setRegion(regionId, preferredScenario = null, fit = true) {
  const scenarios = scenariosForRegion(regionId);
  if (!scenarios.length) return;
  state.regionId = regionId;
  document.querySelectorAll('[data-region]').forEach(button => button.classList.toggle('active', button.dataset.region === regionId));
  $('scenario').innerHTML = scenarios.map(s => `<option value="${s.id}">${(scenarioUi[state.lang] || scenarioUi.sv)?.[s.id]?.name || s.name}</option>`).join('');
  $('scenario').value = scenarios.some(s => s.id === preferredScenario) ? preferredScenario : scenarios[0].id;
  $('time').max = currentScenario().frames.length - 1; $('time').value = 0;
  state.scenario = currentScenario(); configureAnalysisBounds(fit); $('aoiMessage').hidden = true;
  syncMobileControls();
}
function setLanguage(lang) {
  state.lang = lang === 'en' ? 'en' : 'sv';
  $('language').textContent = state.lang === 'sv' ? 'EN' : 'SV';
  document.documentElement.lang = state.lang;
  $('goto').placeholder = t('searchPlaceholder');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translations[state.lang]?.[key] || el.dataset.sv;
  });
  if (state.catalog) {
    const currentVal = $('scenario').value;
    const scenarios = scenariosForRegion(state.regionId);
    $('scenario').innerHTML = scenarios.map(s => `<option value="${s.id}">${(scenarioUi[state.lang] || scenarioUi.sv)?.[s.id]?.name || s.name}</option>`).join('');
    if (scenarios.some(s => s.id === currentVal)) $('scenario').value = currentVal;
    renderFrame();
    buildLayerControls();
    updateLegend();
    syncMobileControls();
  }
}
function populate() {
  const params = new URLSearchParams(location.search), requestedScenario = params.get('scenario');
  const requestedScenarioEntry = state.catalog.scenarios.find(s => s.id === requestedScenario);
  const requestedRegion = params.get('region') || requestedScenarioEntry?.region_id || 'aegean';
  setRegion(requestedRegion, requestedScenario || 'spatial_scenario', false);
  $('dataStatus').innerHTML = state.catalog.data_status.map(d => `<article class="data-card"><b>${d.name}</b><span>${d.status}</span><p>${d.detail}</p></article>`).join('');
  const requested = params.get('compare');
  const requestedAgeValue = params.get('age'), requestedAge = Number(requestedAgeValue);
  if (requestedAgeValue !== null && Number.isFinite(requestedAge)) {
    const ageIndex = currentScenario().frames.findIndex(frame => frame.age_bp === requestedAge);
    if (ageIndex >= 0) $('time').value = ageIndex;
  }
  state.scenario = currentScenario(); configureAnalysisBounds(true);
  for (const name of (params.get('layers') || '').split(',')) if (processNames.includes(name)) state.layerSettings.get(name).enabled = true;
  const viewLat = Number(params.get('lat')), viewLon = Number(params.get('lon')), viewZoom = Number(params.get('zoom'));
  if (params.has('lat') && params.has('lon') && params.has('zoom') && Number.isFinite(viewLat) && Number.isFinite(viewLon) && Number.isFinite(viewZoom)) map.setView([viewLat, viewLon], Math.min(14, Math.max(map.getMinZoom(), viewZoom)), {animate: false});
  if (['full', 'sea', 'difference'].includes(requested)) {
    state.mode = requested;
    document.querySelectorAll('.segmented button').forEach(button => button.classList.toggle('active', button.dataset.mode === requested));
  }
  const requestedLang = params.get('lang');
  if (requestedLang === 'en' || requestedLang === 'sv') {
    setLanguage(requestedLang);
  } else {
    renderFrame();
  }
}
function clearCell() { $('emptyCell').hidden = false; $('cellDetails').hidden = true; }
async function inspectCell(latlng) {
  const analysisTrigger = document.querySelector('[data-mobile-panel="cellSection"]');
  if (!state.api) { $('emptyCell').innerHTML = `<p>${t('cellSplitRequiresApi')}</p>`; if (activeMobilePanel !== 'cellSection') openMobileSheet('cellSection', analysisTrigger); return; }
  const q = new URLSearchParams({scenario: state.scenario.id, age: state.frame.age_bp, lat: latlng.lat, lon: latlng.lng}); if (state.resultId) q.set('result', state.resultId);
  const response = await fetch(`/api/cell?${q}`); const data = await response.json();
  if (!response.ok) { $('emptyCell').innerHTML = `<p>${data.error}</p>`; if (activeMobilePanel !== 'cellSection') openMobileSheet('cellSection', analysisTrigger); return; }
  $('emptyCell').hidden = true; $('cellDetails').hidden = false;
  setText('cellCoordinates', `${data.lat.toFixed(5)}°, ${data.lon.toFixed(5)}° · rad ${data.row}, kolumn ${data.column}`);
  setText('todayHeight', `${fmt.format(data.today_m)} m`); setText('upliftValue', `${signed(-data.uplift_since_m)} m`); setText('erosionValue', `${signed(data.erosion_since_m)} m`); setText('depositionValue', `${signed(-data.deposition_since_m)} m`); setText('paleoHeight', `${fmt.format(data.paleo_m)} m`);
  const relRow = $('relativeHeightRow'); if (relRow) { relRow.hidden = Math.abs(data.relative_height_anomaly_m || 0) < 1e-9; setText('relativeHeightValue', `${signed(data.relative_height_anomaly_m || 0)} m`); }
  setText('seaSurface', `${fmt.format(data.sea_surface_m)} m`); setText('margin', `${fmt.format(data.margin_m)} m`); setText('cellClass', data.full_class_name + (data.sensitive ? ' · känslig' : '')); setText('simpleClass', data.sea_only_class_name);
  if (activeMobilePanel !== 'cellSection') openMobileSheet('cellSection', analysisTrigger);
}
async function calculate() {
  const button = $('calculate'); button.disabled = true; setText('calculationStatus', 'Beräknar och skapar kartlager…');
  const overrides = {};
  try {
    const response = await fetch('/api/compute', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({scenario: state.scenario.id, age_bp: state.frame.age_bp, enabled: {uplift: $('enableUplift').checked, erosion: $('enableErosion').checked, deposition: $('enableDeposition').checked}, overrides})});
    const result = await response.json(); if (!response.ok) throw Error(result.error);
    renderFrame({...result, layers: result.layers}); state.customDirty = false; button.disabled = true;
    const effect = result.custom_effect;
    if (effect?.class_changed_cells) setText('calculationStatus', `Klart · ${fmt.format(effect.class_changed_cells)} celler bytte klass jämfört med standardscenariot; största terrängskillnad ${fmt.format(effect.max_abs_terrain_change_m)} m.`);
    else if (effect) setText('calculationStatus', `Klart · terrängen ändrades upp till ${fmt.format(effect.max_abs_terrain_change_m)} m, men ingen cell bytte land/hav/sänka vid denna tid.`);
    else setText('calculationStatus', result.cache_hit ? 'Klart · identiskt resultat hämtat ur cache.' : 'Klart · nytt resultat beräknat och cachat.');
  } catch (error) { setText('calculationStatus', `Kunde inte beräkna: ${error.message}`); } finally { button.disabled = !state.api || !state.customDirty; }
}
function hasCustomAssumptions() { return !$('enableUplift').checked || !$('enableErosion').checked || !$('enableDeposition').checked; }
function updateCalculationControls() {
  const present = state.frame?.age_bp === 0;
  $('customCalculation').closest('section').hidden = true;
  for (const id of ['enableUplift', 'enableErosion', 'enableDeposition']) $(id).disabled = present;
  $('calculate').disabled = present || !state.api || !state.customDirty;
  if (present) setText('calculationStatus', '0 BP är referensläget: kumulativ förändring är 0 m; kartlagren visar i stället scenariots antagna hastigheter.');
  else if (!state.api) setText('calculationStatus', 'Statisk demo: färdiga resultat fungerar, men egen beräkning kräver Pythonservern.');
  else if (state.customDirty) setText('calculationStatus', 'Ändrade antaganden är redo att beräknas för vald tid.');
  else setText('calculationStatus', 'Stäng av en process om du vill göra en avancerad lokal omberäkning.');
}
function markCustomDirty() { state.customDirty = true; updateCalculationControls(); }
function refreshCustomState() { if (hasCustomAssumptions()) { markCustomDirty(); return; } state.customDirty = false; if (state.resultId) renderFrame(); updateCalculationControls(); }
async function detectApi() { try { const r = await fetch('/api/health'); state.api = r.ok; } catch {} updateCalculationControls(); }

$('scenario').onchange = () => { closeMobileSheet(); $('time').max = currentScenario().frames.length - 1; $('time').value = 0; state.scenario = currentScenario(); state.regionId = state.scenario.region_id; configureAnalysisBounds(true); renderFrame(); if (hasCustomAssumptions()) markCustomDirty(); };
$('time').oninput = () => { renderFrame(); if (hasCustomAssumptions()) markCustomDirty(); };
$('play').onclick = () => {
  if (state.timer) {
    clearInterval(state.timer); state.timer = null;
    $('play').lastElementChild.textContent = t('play'); syncMobileControls(); return;
  }
  state.timer = setInterval(() => { $('time').value = (+$('time').value + 1) % currentScenario().frames.length; renderFrame(); }, 1200);
  $('play').lastElementChild.textContent = t('pause'); syncMobileControls();
};
$('mobileScenario').onchange = () => { $('scenario').value = $('mobileScenario').value; $('scenario').dispatchEvent(new Event('change')); };
$('mobileTime').oninput = () => { $('time').value = $('mobileTime').value; $('time').dispatchEvent(new Event('input')); };
$('mobilePlay').onclick = () => $('play').click();
document.querySelectorAll('[data-mobile-panel]').forEach(button => button.onclick = () => openMobileSheet(button.dataset.mobilePanel, button));
$('closeMobileSheet').onclick = () => closeMobileSheet({restoreFocus: true});
$('mobileSheetBackdrop').onclick = () => closeMobileSheet({restoreFocus: true});
mobileMedia.addEventListener('change', event => { if (!event.matches) closeMobileSheet(); setTimeout(() => map.invalidateSize(), 0); });
document.querySelectorAll('.segmented button').forEach(button => button.onclick = () => { document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('active')); button.classList.add('active'); state.mode = button.dataset.mode; renderResult(); updateLegend(); });
$('calculate').onclick = calculate;
for (const id of ['enableUplift', 'enableErosion', 'enableDeposition']) $(id).addEventListener('input', refreshCustomState);
map.on('mousemove', e => setText('cursorCoordinates', `${e.latlng.lat.toFixed(5)}°, ${e.latlng.lng.toFixed(5)}° · WGS84`));
map.on('zoomend', refreshMotionSymbols);
map.on('click', e => inspectCell(e.latlng));
document.querySelectorAll('[data-region]').forEach(button => button.onclick = () => {
  const region = button.dataset.region;
  const preferred = {aegean: 'spatial_scenario', europe: 'europe_overview', doggerland: 'doggerland_overview'}[region];
  setRegion(region, preferred, true); renderFrame();
});
$('goto').oninput = () => showSearchResults(localSearch($('goto').value));
$('goto').onkeydown = e => { if (e.key === 'Escape') hideSearchResults(); };
$('gotoForm').onsubmit = async e => {
  e.preventDefault(); const query = $('goto').value.trim(); if (!query) return;
  const coordinates = parseCoordinates(query); if (coordinates) { goToPlace(coordinates); return; }
  const local = localSearch(query); if (local.length && (local.length === 1 || normaliseSearch(local[0].name) === normaliseSearch(query))) { goToPlace(local[0]); return; }
  showMapMessage(t('searching'));
  try { const results = await geocodePlace(query); $('aoiMessage').hidden = true; if (!results.length) { showMapMessage(t('noPlaceFound')); hideSearchResults(); return; } showSearchResults(results, {external: true}); }
  catch (error) { showMapMessage(error.message); }
};
document.addEventListener('pointerdown', event => { if (!$('gotoForm').contains(event.target)) hideSearchResults(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && activeMobilePanel) closeMobileSheet({restoreFocus: true}); });
$('methodButton').onclick = () => $('methodDialog').showModal(); $('closeMethod').onclick = () => $('methodDialog').close();
$('language').onclick = () => setLanguage(state.lang === 'sv' ? 'en' : 'sv');

fetch('data/catalog.json?v=20261011-5', {cache: 'no-store'}).then(r => r.json()).then(catalog => { state.catalog = catalog; populate(); detectApi(); }).catch(error => { document.body.innerHTML = `<main style="padding:3rem"><h1>PalaeoCoast kunde inte starta</h1><p>${error.message}</p><p>Kör <code>python web_server.py</code> och öppna den angivna adressen.</p></main>`; });
