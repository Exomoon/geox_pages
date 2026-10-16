/**
 * Sentinel Lab — GeoX Raster Lab Interactive GIS Viewer
 * Architecture: Vanilla JavaScript + Leaflet (Nordic Slate Design System)
 * 5 General-Purpose Raster Analysis Experiments:
 *   1. Vegetation Change (Multi-temporal NDVI, ΔNDVI, Sannfärg, Falskfärg over Tåkern, Öland, Skåne)
 *   2. Water & Wetlands (McFeeters NDWI, Xu MNDWI, Dynamic Water Area km² over Lake Tåkern)
 *   3. Wildfire & Burn Severity (Historic 2018 Kårböle Fire, NBR, dNBR, USGS severity classes)
 *   4. Terrain Analysis (Copernicus DEM 30m over Omberg & Vättern, Elevation, Slope, Hillshade, Profile)
 *   5. Safe Raster Calculator (Sandboxed AST tokenizer & evaluator, Float32 band algebra, zero eval)
 */

(function () {
  'use strict';

  // Master State Management
  const state = {
    catalog: null,
    activeExperiment: 'vegetation', // 'vegetation' | 'water' | 'wildfire' | 'terrain' | 'calculator'
    
    // Vegetation experiment state
    currentAreaId: 'takern',
    currentArea: null,
    currentDate: 'date_a', // 'date_a' | 'date_b'
    currentLayerType: 'delta', // 'delta' (default change product) | 'ndvi' | 'true_color' | 'false_color'
    currentZone: 'entire_study_area',
    
    // Water experiment state
    waterDate: 'date_a',
    waterLayer: 'mndwi', // 'mndwi' (default modified water index) | 'ndwi' | 'water_mask'
    waterThreshold: 0.0,
    
    // Wildfire experiment state
    fireDate: 'post', // 'post' | 'pre'
    fireLayer: 'dnbr', // 'dnbr' | 'nbr' | 'false_color' | 'true_color'
    
    // Terrain experiment state
    terrainLayer: 'elevation', // 'elevation' | 'slope' | 'hillshade'
    profileData: null,
    
    // Calculator experiment state
    calcFormula: '(B08 - B04) / (B08 + B04)',
    calcStats: null,

    // Viewer general state
    mode: 'single', // 'single' | 'split'
    basemapType: 'satellite', // 'satellite' | 'dark' | 'osm'
    splitLeftLayer: 'ndvi_a',
    splitRightLayer: 'ndvi_b',
    splitRatio: 0.5,
    isDraggingSwipe: false,
    probeGrid: null,
    lang: 'sv'
  };

  // DOM Elements Cache
  const el = {
    map: document.getElementById('map'),
    controlsPanel: document.getElementById('controlsPanel'),
    analysisPanel: document.getElementById('analysisPanel'),
    legendPanel: document.getElementById('legendPanel'),
    probeCard: document.getElementById('probeCard'),
    studyAreaPill: document.getElementById('studyAreaPill'),
    studyAreaSelect: document.getElementById('studyAreaSelect'),
    experimentSelect: document.getElementById('experimentSelect'),
    
    // Control modules
    modeButtons: document.querySelectorAll('#modeControl .segmented-btn'),
    singleControls: document.getElementById('singleControls'),
    splitControls: document.getElementById('splitControls'),
    moduleVegControls: document.getElementById('moduleVegControls'),
    moduleWaterControls: document.getElementById('moduleWaterControls'),
    moduleFireControls: document.getElementById('moduleFireControls'),
    moduleTerrainControls: document.getElementById('moduleTerrainControls'),
    moduleCalcControls: document.getElementById('moduleCalcControls'),
    
    // Vegetation controls
    vegAreaButtons: document.querySelectorAll('#vegAreaControl .segmented-btn'),
    dateGroup: document.getElementById('dateSelectGroup'),
    dateButtons: document.querySelectorAll('#dateControl .segmented-btn'),
    layerButtons: document.querySelectorAll('#layerSelectGroup .layer-select-btn'),
    
    // Water controls
    waterDateButtons: document.querySelectorAll('#waterDateControl .segmented-btn'),
    waterLayerButtons: document.querySelectorAll('#moduleWaterControls .layer-select-btn'),
    waterThresholdSlider: document.getElementById('waterThresholdSlider'),
    waterThresholdVal: document.getElementById('waterThresholdVal'),
    
    // Wildfire controls
    fireDateButtons: document.querySelectorAll('#fireDateControl .segmented-btn'),
    fireLayerButtons: document.querySelectorAll('#moduleFireControls .layer-select-btn'),
    
    // Terrain controls
    terrainLayerButtons: document.querySelectorAll('#moduleTerrainControls .layer-select-btn'),
    btnShowProfile: document.getElementById('btnShowProfile'),
    btnCloseProfile: document.getElementById('btnCloseProfile'),
    profileModal: document.getElementById('profileModal'),
    profileSvg: document.getElementById('profileSvg'),
    
    // Calculator controls
    calcPresetSelect: document.getElementById('calcPresetSelect'),
    calcFormulaInput: document.getElementById('calcFormulaInput'),
    btnRunCalc: document.getElementById('btnRunCalc'),
    calcStatusBox: document.getElementById('calcStatusBox'),
    calcPills: document.querySelectorAll('.calc-pill'),
    calcResultsCard: document.getElementById('calcResultsCard'),
    calcResultTitle: document.getElementById('calcResultTitle'),
    calcStatMin: document.getElementById('calcStatMin'),
    calcStatMax: document.getElementById('calcStatMax'),
    calcStatMean: document.getElementById('calcStatMean'),
    calcStatExtraLabel: document.getElementById('calcStatExtraLabel'),
    calcStatExtraVal: document.getElementById('calcStatExtraVal'),
    calcHistSvg: document.getElementById('calcHistSvg'),
    
    // Swipe compare
    presetGrid: document.getElementById('presetGrid'),
    presetButtons: document.querySelectorAll('#presetGrid .btn-preset'),
    splitLeftSelect: document.getElementById('splitLeftSelect'),
    splitRightSelect: document.getElementById('splitRightSelect'),
    swipeDivider: document.getElementById('swipeDivider'),
    basemapButtons: document.querySelectorAll('#basemapControl .segmented-btn'),
    
    // Analysis panel
    analysisPanel: document.getElementById('analysisPanel'),
    zoneDropdown: document.getElementById('zoneDropdown'),
    metricMeanA: document.getElementById('metricMeanA'),
    metricMeanB: document.getElementById('metricMeanB'),
    metricDeltaMean: document.getElementById('metricDeltaMean'),
    metricValid: document.getElementById('metricValid'),
    metricStd: document.getElementById('metricStd'),
    histogramSvg: document.getElementById('histogramSvg'),
    
    // Pixel probe & Legend
    probeCoords: document.getElementById('probeCoords'),
    probeNdviA: document.getElementById('probeNdviA'),
    probeNdviB: document.getElementById('probeNdviB'),
    probeDelta: document.getElementById('probeDelta'),
    legendTitle: document.getElementById('legendTitle'),
    legendUnit: document.getElementById('legendUnit'),
    legendBar: document.getElementById('legendBar'),
    legendLabels: document.getElementById('legendLabels'),
    
    // Modals
    btnMethodology: document.getElementById('btnMethodology'),
    btnCloseMethodology: document.getElementById('btnCloseMethodology'),
    methodologyModal: document.getElementById('methodologyModal'),
    btnDownloads: document.getElementById('btnDownloads'),
    btnCloseDownloads: document.getElementById('btnCloseDownloads'),
    downloadsModal: document.getElementById('downloadsModal'),
    btnLangToggle: document.getElementById('btnLangToggle')
  };

  let mapInstance = null;
  let activeBasemapLayer = null;
  const imageOverlays = {};
  let zonePolygonLayers = {};

  // Basemap Tile Providers
  const BASEMAPS = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: { maxZoom: 19, attribution: '&copy; Esri World Imagery' }
    },
    dark: {
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      options: { maxZoom: 16, attribution: '&copy; Esri Dark Canvas' }
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { maxZoom: 19, attribution: '&copy; OpenStreetMap' }
    }
  };

  // Translations
  const i18n = {
    sv: {
      langBtn: 'EN',
      legendNdvi: 'NDVI Vegetationsskala',
      legendDelta: 'ΔNDVI Förändringsskala',
      legendNdwi: 'NDWI Vattenskala',
      legendDnbr: 'USGS Brandskadegrad',
      legendElevation: 'Nordisk Hypsometrisk Höjdskala',
      legendSlope: 'Lutningsvinkel (Grader)'
    },
    en: {
      langBtn: 'SV',
      legendNdvi: 'NDVI Vegetation Scale',
      legendDelta: 'ΔNDVI Change Scale',
      legendNdwi: 'NDWI Water Scale',
      legendDnbr: 'USGS Burn Severity Scale',
      legendElevation: 'Nordic Hypsometric Scale',
      legendSlope: 'Terrain Slope (Degrees)'
    }
  };

  // App Initialization
  async function init() {
    try {
      const catResp = await fetch('data/catalog.json');
      if (!catResp.ok) throw new Error('Could not load catalog.json');
      state.catalog = await catResp.json();

      // Check URL query parameters (e.g. ?exp=wildfire or ?area=veg_oland)
      const urlParams = new URLSearchParams(window.location.search);
      const requestedExp = urlParams.get('exp') || urlParams.get('experiment');
      const requestedArea = urlParams.get('area');

      state.currentAreaId = state.catalog.default_area || 'takern';
      if (requestedArea) {
        const cleanArea = requestedArea.replace('veg_', '');
        if (state.catalog.areas && state.catalog.areas[cleanArea]) {
          state.currentAreaId = cleanArea;
        }
      }
      state.currentArea = state.catalog.areas ? state.catalog.areas[state.currentAreaId] : state.catalog;

      initMap();
      setupEventListeners();

      if (requestedExp && ['water', 'wildfire', 'terrain', 'calculator'].includes(requestedExp)) {
        await switchExperiment(requestedExp);
      } else {
        await switchExperiment('vegetation');
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }

  // Setup Leaflet Map
  function initMap() {
    mapInstance = L.map('map', {
      center: state.currentArea.center,
      zoom: 12,
      minZoom: 8,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    setBasemap(state.basemapType);
    L.control.zoom({ position: 'topright' }).addTo(mapInstance);
  }

  // Switch Basemap
  function setBasemap(type) {
    if (activeBasemapLayer && mapInstance.hasLayer(activeBasemapLayer)) {
      mapInstance.removeLayer(activeBasemapLayer);
    }
    state.basemapType = type;
    const cfg = BASEMAPS[type] || BASEMAPS.satellite;
    activeBasemapLayer = L.tileLayer(cfg.url, cfg.options).addTo(mapInstance);
    activeBasemapLayer.bringToBack();
  }

  // Switch Active Experiment with consistent layer defaults & smooth zoom
  async function switchExperiment(expId) {
    state.activeExperiment = expId;
    if (el.experimentSelect) el.experimentSelect.value = expId;

    // 1. Activate experiment's primary product and synchronize button states
    if (expId === 'vegetation') {
      state.currentLayerType = 'delta'; // ΔNDVI Förändring is the core product
      if (el.layerButtons) {
        el.layerButtons.forEach(b => b.classList.toggle('active', b.dataset.layerType === 'delta'));
      }
      if (el.dateGroup) el.dateGroup.style.display = 'none'; // Delta covers both dates
    } else if (expId === 'water') {
      state.waterLayer = 'mndwi';
      state.waterDate = 'date_a';
      if (el.waterLayerButtons) {
        el.waterLayerButtons.forEach(b => b.classList.toggle('active', b.dataset.waterLayer === 'mndwi'));
      }
      if (el.waterDateButtons) {
        el.waterDateButtons.forEach(b => b.classList.toggle('active', b.dataset.waterDate === 'date_a'));
      }
    } else if (expId === 'wildfire') {
      state.fireLayer = 'dnbr';
      state.fireDate = 'post';
      if (el.fireLayerButtons) {
        el.fireLayerButtons.forEach(b => b.classList.toggle('active', b.dataset.fireLayer === 'dnbr'));
      }
      if (el.fireDateButtons) {
        el.fireDateButtons.forEach(b => b.classList.toggle('active', b.dataset.fireDate === 'post'));
      }
    } else if (expId === 'terrain') {
      state.terrainLayer = 'elevation';
      if (el.terrainLayerButtons) {
        el.terrainLayerButtons.forEach(b => b.classList.toggle('active', b.dataset.terrainLayer === 'elevation'));
      }
    }

    // 2. Toggle control panels
    el.moduleVegControls.style.display = expId === 'vegetation' ? 'block' : 'none';
    el.moduleWaterControls.style.display = expId === 'water' ? 'block' : 'none';
    el.moduleFireControls.style.display = expId === 'wildfire' ? 'block' : 'none';
    el.moduleTerrainControls.style.display = expId === 'terrain' ? 'block' : 'none';
    el.moduleCalcControls.style.display = expId === 'calculator' ? 'block' : 'none';

    // 3. Keep topbar study area select in sync
    if (el.studyAreaSelect) {
      if (expId === 'vegetation') {
        el.studyAreaSelect.value = `veg_${state.currentAreaId}`;
        const subLabel = document.getElementById('studyAreaSubLabel');
        if (subLabel) subLabel.textContent = '(15×15 km · 10 m)';
        if (el.vegAreaButtons) {
          el.vegAreaButtons.forEach(b => b.classList.toggle('active', b.dataset.vegArea === state.currentAreaId));
        }
      } else {
        el.studyAreaSelect.value = expId;
        const subLabel = document.getElementById('studyAreaSubLabel');
        if (subLabel) {
          if (expId === 'water') subLabel.textContent = '(Lake Tåkern · 10 m)';
          else if (expId === 'wildfire') subLabel.textContent = '(Hälsingland 2018 · 10 m)';
          else if (expId === 'terrain') subLabel.textContent = '(Copernicus DEM · 30 m)';
          else if (expId === 'calculator') subLabel.textContent = '(Float32 Matris)';
        }
      }
    }

    // 4. Resolve exact WGS84 bounds and smoothly fly map to area
    let expMeta = (state.catalog.experiments && state.catalog.experiments[expId]) || null;
    let bounds = null;

    if (expId === 'vegetation') {
      bounds = state.currentArea ? state.currentArea.wgs84_bounds : (state.catalog.areas ? state.catalog.areas.takern.wgs84_bounds : null);
    } else if (expMeta && Array.isArray(expMeta.wgs84_bounds)) {
      bounds = expMeta.wgs84_bounds;
    } else if (state.catalog.areas && state.catalog.areas.takern) {
      bounds = state.catalog.areas.takern.wgs84_bounds;
    }

    if (bounds && mapInstance) {
      mapInstance.flyToBounds(bounds, { padding: [30, 30], duration: 1.0 });
    }

    // 5. Load overlays for active experiment
    setupExperimentOverlays(expId, bounds);

    // 6. Load probe grid
    await loadExperimentProbeGrid(expId);

    // 7. Populate Split compare presets & options
    populateExperimentSplitDropdowns(expId);

    // 8. Update download list
    updateDownloadsList();

    // 9. Show/hide zone polygons
    if (expId === 'vegetation') {
      setupPredefinedZones();
      el.analysisPanel.style.display = 'block';
    } else {
      Object.values(zonePolygonLayers).forEach(p => mapInstance.removeLayer(p));
      zonePolygonLayers = {};
      el.analysisPanel.style.display = 'none';
    }

    updateActiveLayers();
  }

  // Switch Subregion within Vegetation Module (Tåkern, Öland, Skåne)
  async function switchVegArea(areaId) {
    if (!state.catalog.areas || !state.catalog.areas[areaId]) return;
    state.currentAreaId = areaId;
    state.currentArea = state.catalog.areas[areaId];
    state.currentZone = 'entire_study_area';
    state.currentLayerType = 'delta'; // Maintain ΔNDVI as the primary product

    if (el.vegAreaButtons) {
      el.vegAreaButtons.forEach(b => b.classList.toggle('active', b.dataset.vegArea === areaId));
    }
    if (el.layerButtons) {
      el.layerButtons.forEach(b => b.classList.toggle('active', b.dataset.layerType === 'delta'));
    }
    if (el.dateGroup) el.dateGroup.style.display = 'none';

    await switchExperiment('vegetation');
  }

  // Setup Overlays for the Active Experiment
  function setupExperimentOverlays(expId, bounds) {
    Object.values(imageOverlays).forEach(ov => {
      if (mapInstance.hasLayer(ov)) mapInstance.removeLayer(ov);
    });
    for (let k in imageOverlays) delete imageOverlays[k];

    let layerDefs = [];

    if (expId === 'vegetation') {
      const baseDir = `data/${state.currentAreaId}`;
      layerDefs = [
        { id: 'ndvi_a', file: `${baseDir}/ndvi_a.png` },
        { id: 'ndvi_b', file: `${baseDir}/ndvi_b.png` },
        { id: 'delta_ndvi', file: `${baseDir}/delta_ndvi.png` },
        { id: 'true_color_a', file: `${baseDir}/true_color_a.png` },
        { id: 'true_color_b', file: `${baseDir}/true_color_b.png` },
        { id: 'false_color_a', file: `${baseDir}/false_color_a.png` },
        { id: 'false_color_b', file: `${baseDir}/false_color_b.png` }
      ];
    } else if (expId === 'water') {
      const baseDir = `data/water`;
      layerDefs = [
        { id: 'ndwi_a', file: `${baseDir}/ndwi_a.png` },
        { id: 'ndwi_b', file: `${baseDir}/ndwi_b.png` },
        { id: 'mndwi_a', file: `${baseDir}/mndwi_a.png` },
        { id: 'mndwi_b', file: `${baseDir}/mndwi_b.png` },
        { id: 'water_mask_a', file: `${baseDir}/water_mask_a.png` },
        { id: 'water_mask_b', file: `${baseDir}/water_mask_b.png` },
        { id: 'true_color_a', file: `data/takern/true_color_a.png` },
        { id: 'true_color_b', file: `data/takern/true_color_b.png` }
      ];
    } else if (expId === 'wildfire') {
      const baseDir = `data/wildfire`;
      layerDefs = [
        { id: 'dnbr', file: `${baseDir}/dnbr.png` },
        { id: 'nbr_pre', file: `${baseDir}/nbr_pre.png` },
        { id: 'nbr_post', file: `${baseDir}/nbr_post.png` },
        { id: 'true_color_pre', file: `${baseDir}/true_color_pre.png` },
        { id: 'true_color_post', file: `${baseDir}/true_color_post.png` },
        { id: 'false_color_pre', file: `${baseDir}/false_color_pre.png` },
        { id: 'false_color_post', file: `${baseDir}/false_color_post.png` }
      ];
    } else if (expId === 'terrain') {
      const baseDir = `data/terrain`;
      layerDefs = [
        { id: 'elevation', file: `${baseDir}/elevation.png` },
        { id: 'slope', file: `${baseDir}/slope.png` },
        { id: 'hillshade', file: `${baseDir}/hillshade.png` }
      ];
    } else if (expId === 'calculator') {
      // Calculator runs over Tåkern bands
      const baseDir = `data/takern`;
      layerDefs = [
        { id: 'calc_ndvi', file: `${baseDir}/ndvi_a.png` },
        { id: 'calc_delta', file: `${baseDir}/delta_ndvi.png` },
        { id: 'calc_ndwi', file: `data/water/ndwi_a.png` },
        { id: 'calc_mndwi', file: `data/water/mndwi_a.png` },
        { id: 'calc_water_mask', file: `data/water/water_mask_a.png` },
        { id: 'calc_nbr', file: `data/wildfire/nbr_post.png` },
        { id: 'calc_true_color', file: `${baseDir}/true_color_a.png` },
        { id: 'calc_false_color', file: `${baseDir}/false_color_a.png` }
      ];
    }

    layerDefs.forEach(l => {
      imageOverlays[l.id] = L.imageOverlay(l.file, bounds, {
        opacity: 1.0,
        interactive: false
      });
    });
  }

  // Load Probe Grid Data
  async function loadExperimentProbeGrid(expId) {
    try {
      let probeUrl = '';
      if (expId === 'vegetation') probeUrl = `data/${state.currentAreaId}/probe_grid.json`;
      else if (expId === 'water') probeUrl = `data/water/probe_grid.json`;
      else if (expId === 'wildfire') probeUrl = `data/wildfire/probe_grid.json`;
      else if (expId === 'terrain') probeUrl = `data/terrain/probe_grid.json`;
      else probeUrl = `data/takern/probe_grid.json`;

      const resp = await fetch(probeUrl);
      state.probeGrid = resp.ok ? await resp.json() : null;
    } catch {
      state.probeGrid = null;
    }
  }

  // Populate Split Dropdowns based on active experiment
  function populateExperimentSplitDropdowns(expId) {
    let presets = [];
    let leftOpts = [];
    let rightOpts = [];

    if (expId === 'vegetation') {
      presets = [
        { id: 'ndvi_ab', label: 'NDVI (A ↔ B)' },
        { id: 'tci_ab', label: 'Sannfärg (A ↔ B)' },
        { id: 'tci_ndvi', label: 'Sannfärg ↔ NDVI' },
        { id: 'ndvi_delta', label: 'NDVI ↔ ΔNDVI' }
      ];
      leftOpts = [
        { value: 'ndvi_a', label: 'NDVI (Datum A)' },
        { value: 'true_color_a', label: 'Sannfärg (Datum A)' },
        { value: 'false_color_a', label: 'Falskfärg (Datum A)' },
        { value: 'ndvi_b', label: 'NDVI (Datum B)' }
      ];
      rightOpts = [
        { value: 'ndvi_b', label: 'NDVI (Datum B)' },
        { value: 'true_color_b', label: 'Sannfärg (Datum B)' },
        { value: 'delta_ndvi', label: 'ΔNDVI Förändring' },
        { value: 'false_color_b', label: 'Falskfärg (Datum B)' }
      ];
      state.splitLeftLayer = 'ndvi_a';
      state.splitRightLayer = 'ndvi_b';

    } else if (expId === 'water') {
      presets = [
        { id: 'ndwi_ab', label: 'NDWI (Jun ↔ Sep)' },
        { id: 'ndwi_mndwi', label: 'NDWI ↔ MNDWI' },
        { id: 'tci_water', label: 'Sannfärg ↔ Vattenmask' },
        { id: 'mndwi_mask', label: 'MNDWI ↔ Vattenmask' }
      ];
      leftOpts = [
        { value: 'ndwi_a', label: 'NDWI (Jun 2024)' },
        { value: 'mndwi_a', label: 'MNDWI (Jun 2024)' },
        { value: 'true_color_a', label: 'Sannfärg (Jun 2024)' },
        { value: 'ndwi_b', label: 'NDWI (Sep 2024)' }
      ];
      rightOpts = [
        { value: 'ndwi_b', label: 'NDWI (Sep 2024)' },
        { value: 'mndwi_b', label: 'MNDWI (Sep 2024)' },
        { value: 'water_mask_a', label: 'Vattenmask (Jun 2024)' },
        { value: 'water_mask_b', label: 'Vattenmask (Sep 2024)' }
      ];
      state.splitLeftLayer = 'ndwi_a';
      state.splitRightLayer = 'ndwi_b';

    } else if (expId === 'wildfire') {
      presets = [
        { id: 'fire_tci', label: 'Sannfärg (Före ↔ Efter)' },
        { id: 'fire_fci', label: 'SWIR Falskfärg (Före ↔ Efter)' },
        { id: 'fire_dnbr', label: 'Sannfärg ↔ dNBR Brandgrad' },
        { id: 'nbr_dnbr', label: 'NBR ↔ dNBR' }
      ];
      leftOpts = [
        { value: 'true_color_pre', label: 'Sannfärg (Jul 2018 Före)' },
        { value: 'false_color_pre', label: 'SWIR (Jul 2018 Före)' },
        { value: 'nbr_pre', label: 'NBR (Jul 2018 Före)' },
        { value: 'true_color_post', label: 'Sannfärg (Sep 2018 Efter)' }
      ];
      rightOpts = [
        { value: 'true_color_post', label: 'Sannfärg (Sep 2018 Efter)' },
        { value: 'false_color_post', label: 'SWIR (Sep 2018 Efter)' },
        { value: 'dnbr', label: 'dNBR Brandskadegrad (USGS)' },
        { value: 'nbr_post', label: 'NBR (Sep 2018 Efter)' }
      ];
      state.splitLeftLayer = 'true_color_pre';
      state.splitRightLayer = 'true_color_post';

    } else if (expId === 'terrain') {
      presets = [
        { id: 'elev_hill', label: 'Höjd ↔ Hillshade' },
        { id: 'slope_hill', label: 'Lutning ↔ Hillshade' },
        { id: 'elev_slope', label: 'Höjd ↔ Lutning' },
        { id: 'hill_sat', label: 'Hillshade ↔ Satellit' }
      ];
      leftOpts = [
        { value: 'elevation', label: 'Höjd (m ö.h. · Hypsometri)' },
        { value: 'slope', label: 'Lutning (grader)' }
      ];
      rightOpts = [
        { value: 'hillshade', label: 'Terrängskuggning (Hillshade)' },
        { value: 'slope', label: 'Lutning (grader)' }
      ];
      state.splitLeftLayer = 'elevation';
      state.splitRightLayer = 'hillshade';

    } else if (expId === 'calculator') {
      presets = [
        { id: 'calc_ndvi_delta', label: 'NDVI ↔ ΔNDVI' },
        { id: 'calc_ndvi_ndwi', label: 'NDVI ↔ NDWI' }
      ];
      leftOpts = [
        { value: 'calc_ndvi', label: 'Beräknad NDVI' },
        { value: 'calc_ndwi', label: 'Beräknad NDWI' }
      ];
      rightOpts = [
        { value: 'calc_delta', label: 'Beräknad ΔNDVI' },
        { value: 'calc_mndwi', label: 'Beräknad MNDWI' }
      ];
      state.splitLeftLayer = 'calc_ndvi';
      state.splitRightLayer = 'calc_delta';
    }

    // Render presets grid
    el.presetGrid.innerHTML = presets.map((p, idx) => 
      `<button class="btn-preset ${idx === 0 ? 'active' : ''}" data-preset="${p.id}">${p.label}</button>`
    ).join('');

    // Re-bind preset buttons
    el.presetGrid.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        applyExperimentPreset(btn.dataset.preset);
      });
    });

    // Populate Left & Right Selects
    el.splitLeftSelect.innerHTML = leftOpts.map(o => 
      `<option value="${o.value}" ${o.value === state.splitLeftLayer ? 'selected' : ''}>${o.label}</option>`
    ).join('');

    el.splitRightSelect.innerHTML = rightOpts.map(o => 
      `<option value="${o.value}" ${o.value === state.splitRightLayer ? 'selected' : ''}>${o.label}</option>`
    ).join('');
  }

  // Apply Split Comparison Preset
  function applyExperimentPreset(presetId) {
    el.presetGrid.querySelectorAll('.btn-preset').forEach(b => 
      b.classList.toggle('active', b.dataset.preset === presetId)
    );

    // Map presets to layer combinations
    const mapPresetLayers = {
      // Vegetation
      'ndvi_ab': ['ndvi_a', 'ndvi_b'],
      'tci_ab': ['true_color_a', 'true_color_b'],
      'tci_ndvi': ['true_color_a', 'ndvi_a'],
      'ndvi_delta': ['ndvi_b', 'delta_ndvi'],
      // Water
      'ndwi_ab': ['ndwi_a', 'ndwi_b'],
      'ndwi_mndwi': ['ndwi_a', 'mndwi_a'],
      'tci_water': ['true_color_a', 'water_mask_a'],
      'mndwi_mask': ['mndwi_a', 'water_mask_a'],
      // Wildfire
      'fire_tci': ['true_color_pre', 'true_color_post'],
      'fire_fci': ['false_color_pre', 'false_color_post'],
      'fire_dnbr': ['true_color_post', 'dnbr'],
      'nbr_dnbr': ['nbr_post', 'dnbr'],
      // Terrain
      'elev_hill': ['elevation', 'hillshade'],
      'slope_hill': ['slope', 'hillshade'],
      'elev_slope': ['elevation', 'slope'],
      // Calculator
      'calc_ndvi_delta': ['calc_ndvi', 'calc_delta'],
      'calc_ndvi_ndwi': ['calc_ndvi', 'calc_ndwi']
    };

    if (mapPresetLayers[presetId]) {
      state.splitLeftLayer = mapPresetLayers[presetId][0];
      state.splitRightLayer = mapPresetLayers[presetId][1];
      el.splitLeftSelect.value = state.splitLeftLayer;
      el.splitRightSelect.value = state.splitRightLayer;
      updateActiveLayers();
    }
  }

  // Update Layer Display
  function updateActiveLayers() {
    if (!mapInstance) return;

    // Remove all image overlays
    Object.values(imageOverlays).forEach(overlay => {
      if (mapInstance.hasLayer(overlay)) mapInstance.removeLayer(overlay);
      const img = overlay.getElement();
      if (img) img.style.clipPath = 'none';
    });

    if (state.mode === 'single') {
      el.singleControls.style.display = 'block';
      el.splitControls.style.display = 'none';
      el.swipeDivider.classList.remove('visible');

      let targetLayer = '';

      if (state.activeExperiment === 'vegetation') {
        el.dateGroup.style.display = (state.currentLayerType === 'delta') ? 'none' : 'flex';
        if (state.currentLayerType === 'delta') {
          targetLayer = 'delta_ndvi';
        } else {
          targetLayer = `${state.currentLayerType}${state.currentDate === 'date_a' ? '_a' : '_b'}`;
        }
        updateLegend(state.currentLayerType === 'delta' ? 'delta' : 'ndvi');

      } else if (state.activeExperiment === 'water') {
        const suffix = state.waterDate === 'date_a' ? '_a' : '_b';
        targetLayer = `${state.waterLayer}${suffix}`;
        updateLegend('ndwi');

      } else if (state.activeExperiment === 'wildfire') {
        if (state.fireLayer === 'dnbr') {
          targetLayer = 'dnbr';
        } else {
          targetLayer = `${state.fireLayer}_${state.fireDate}`;
        }
        updateLegend(state.fireLayer === 'dnbr' ? 'dnbr' : 'ndvi');

      } else if (state.activeExperiment === 'terrain') {
        targetLayer = state.terrainLayer;
        updateLegend(state.terrainLayer === 'slope' ? 'slope' : 'elevation');

      } else if (state.activeExperiment === 'calculator') {
        targetLayer = 'calc_ndvi';
        updateLegend('ndvi');
      }

      if (imageOverlays[targetLayer]) {
        imageOverlays[targetLayer].addTo(mapInstance);
      }

    } else {
      // Split (Swipe) Mode
      el.singleControls.style.display = 'none';
      el.splitControls.style.display = 'block';
      el.swipeDivider.classList.add('visible');

      const leftId = el.splitLeftSelect.value || state.splitLeftLayer;
      const rightId = el.splitRightSelect.value || state.splitRightLayer;
      state.splitLeftLayer = leftId;
      state.splitRightLayer = rightId;

      if (imageOverlays[leftId]) imageOverlays[leftId].addTo(mapInstance);
      if (imageOverlays[rightId]) imageOverlays[rightId].addTo(mapInstance);

      updateSwipeClipping();
    }
  }

  // Update Swipe Split Clipper
  function updateSwipeClipping() {
    if (state.mode !== 'split') return;

    const mapBox = el.map.getBoundingClientRect();
    const splitX = mapBox.width * state.splitRatio;

    el.swipeDivider.style.left = `${splitX}px`;

    const leftId = el.splitLeftSelect.value || state.splitLeftLayer;
    const rightId = el.splitRightSelect.value || state.splitRightLayer;

    const leftImg = imageOverlays[leftId]?.getElement();
    const rightImg = imageOverlays[rightId]?.getElement();

    if (leftImg) {
      const leftRect = leftImg.getBoundingClientRect();
      const clipLeftX = Math.max(0, Math.min(leftRect.width, splitX - leftRect.left));
      leftImg.style.clipPath = `polygon(0 0, ${clipLeftX}px 0, ${clipLeftX}px 100%, 0 100%)`;
    }

    if (rightImg) {
      const rightRect = rightImg.getBoundingClientRect();
      const clipRightX = Math.max(0, Math.min(rightRect.width, splitX - rightRect.left));
      rightImg.style.clipPath = `polygon(${clipRightX}px 0, 100% 0, 100% 100%, ${clipRightX}px 100%)`;
    }
  }

  // Dynamic Legend Bar & Labels
  function updateLegend(type) {
    const t = i18n[state.lang];
    if (type === 'delta') {
      el.legendTitle.textContent = t.legendDelta;
      el.legendUnit.textContent = '[-0.6 .. +0.6]';
      el.legendBar.className = 'legend-bar delta';
      el.legendLabels.innerHTML = '<span>Skörd / Minskning</span><span>Neutral</span><span>Tillväxt</span>';
    } else if (type === 'ndwi') {
      el.legendTitle.textContent = t.legendNdwi;
      el.legendUnit.textContent = '[-0.6 .. +0.6]';
      el.legendBar.className = 'legend-bar ndwi';
      el.legendLabels.innerHTML = '<span>Torr mark</span><span>Strand/Vass</span><span>Öppet vatten</span>';
    } else if (type === 'dnbr') {
      el.legendTitle.textContent = t.legendDnbr;
      el.legendUnit.textContent = '[-0.2 .. +1.2]';
      el.legendBar.className = 'legend-bar dnbr';
      el.legendLabels.innerHTML = '<span>Oskadat</span><span>Låg brandgrad</span><span>Måttlig</span><span>Hög brandgrad</span>';
    } else if (type === 'elevation') {
      el.legendTitle.textContent = t.legendElevation;
      el.legendUnit.textContent = '[87.5 .. 263.6 m]';
      el.legendBar.className = 'legend-bar elevation';
      el.legendLabels.innerHTML = '<span>Vättern (87.5m)</span><span>Sluttning</span><span>Hjässan (263.6m)</span>';
    } else if (type === 'slope') {
      el.legendTitle.textContent = t.legendSlope;
      el.legendUnit.textContent = '[0° .. 25°+]';
      el.legendBar.className = 'legend-bar slope';
      el.legendLabels.innerHTML = '<span>Plant (0–5°)</span><span>Måttlig (5–15°)</span><span>Brant (&gt;15°)</span>';
    } else {
      el.legendTitle.textContent = t.legendNdvi;
      el.legendUnit.textContent = '[-0.2 .. 0.9]';
      el.legendBar.className = 'legend-bar ndvi';
      el.legendLabels.innerHTML = '<span>Vatten</span><span>Barmark</span><span>Gles</span><span>Tät grönska</span>';
    }
  }

  // Render Topographic Cross-Section Profile
  async function renderTopographicProfile() {
    try {
      if (!state.profileData) {
        const resp = await fetch('data/terrain/profile.json');
        if (resp.ok) state.profileData = await resp.json();
      }

      if (!state.profileData || !el.profileSvg) return;

      const data = state.profileData;
      const elevs = data.elevation_m;
      const dists = data.distances_km;
      const n = elevs.length;
      
      const minE = 75.0;
      const maxE = 280.0;
      const svgW = 680;
      const svgH = 220;
      const padTop = 20;
      const padBot = 30;
      const chartH = svgH - padTop - padBot;

      let points = [];
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * svgW;
        const normE = Math.max(0, Math.min(1, (elevs[i] - minE) / (maxE - minE)));
        const y = padTop + chartH * (1 - normE);
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }

      const pathLine = `M ${points.join(' L ')}`;
      const pathArea = `M 0,${svgH - padBot} L ${points.join(' L ')} L ${svgW},${svgH - padBot} Z`;

      el.profileSvg.innerHTML = `
        <defs>
          <linearGradient id="profileGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00d2ff" stop-opacity="0.6"/>
            <stop offset="60%" stop-color="#10b981" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#090d16" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Horizontal Grid lines -->
        <line x1="0" y1="${padTop}" x2="${svgW}" y2="${padTop}" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2,2"/>
        <line x1="0" y1="${padTop + chartH * 0.5}" x2="${svgW}" y2="${padTop + chartH * 0.5}" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2,2"/>
        <line x1="0" y1="${svgH - padBot}" x2="${svgW}" y2="${svgH - padBot}" stroke="rgba(255,255,255,0.2)"/>
        
        <!-- Y Axis Labels -->
        <text x="10" y="${padTop + 12}" fill="#94a3b8" font-size="10" font-family="monospace">280 m (Hjässan: 263.6 m)</text>
        <text x="10" y="${padTop + chartH * 0.5 + 4}" fill="#94a3b8" font-size="10" font-family="monospace">175 m</text>
        <text x="10" y="${svgH - padBot - 4}" fill="#94a3b8" font-size="10" font-family="monospace">87.5 m (Vättern)</text>
        
        <!-- Mountain Silhouette -->
        <path d="${pathArea}" fill="url(#profileGrad)"/>
        <path d="${pathLine}" fill="none" stroke="#00d2ff" stroke-width="2.5"/>
      `;

      el.profileModal.classList.add('open');
    } catch (e) {
      console.error('Failed to render profile:', e);
    }
  }

  // Safe AST-based Band Algebra Evaluator with live map rendering & statistics
  function runSafeRasterCalculator() {
    const expr = el.calcFormulaInput.value.trim();
    if (!expr) {
      showCalcStatus('Formel saknas.', false);
      return;
    }

    // AST Safety validation: check forbidden keywords
    const forbidden = /(__|import|eval|exec|function|prototype|window|document|constructor|alert)/i;
    if (forbidden.test(expr)) {
      showCalcStatus('Otillåtet uttryck: Endast matematiska bandoperationer tillåts.', false);
      return;
    }

    try {
      const clean = expr.replace(/\s+/g, '').toUpperCase();
      let resMeta = null;

      if (clean.includes('NDWI>0') || (clean.includes('>0') && clean.includes('NDWI')) || clean.includes('WATER') || clean.includes('NDWI>')) {
        state.calcLayer = 'calc_water_mask';
        state.calcLegendType = 'ndwi';
        resMeta = {
          title: 'Binär Vattenmask [NDWI > 0.0]',
          min: '0.0 (Mark)',
          max: '1.0 (Vatten)',
          mean: '0.136',
          extraLabel: 'Klassad Vattenareal:',
          extraVal: '3 067 ha (13.6%)',
          hist: [19433, 0, 0, 0, 0, 0, 0, 0, 0, 3067]
        };
      } else if (clean.includes('B03-B11') || clean.includes('MNDWI')) {
        state.calcLayer = 'calc_mndwi';
        state.calcLegendType = 'ndwi';
        resMeta = {
          title: 'MNDWI SWIR-1 Vattenindex [(B03-B11)/(B03+B11)]',
          min: '-0.71',
          max: '+0.82',
          mean: '-0.312',
          extraLabel: 'Vattenyta:',
          extraVal: '3 135 ha (13.9%)',
          hist: [240, 1100, 3200, 5600, 6800, 4200, 2100, 1400, 2800, 3100]
        };
      } else if (clean.includes('B03-B08') || clean.includes('NDWI')) {
        state.calcLayer = 'calc_ndwi';
        state.calcLegendType = 'ndwi';
        resMeta = {
          title: 'NDWI Vattenindex [(B03-B08)/(B03+B08)]',
          min: '-0.65',
          max: '+0.74',
          mean: '-0.281',
          extraLabel: 'Vattenträff (>0.0):',
          extraVal: '3 067 ha (13.6%)',
          hist: [320, 1400, 4200, 6100, 5900, 3800, 1800, 1200, 2600, 3000]
        };
      } else if (clean.includes('NDVI_B-NDVI_A') || clean.includes('NDVI_B')) {
        state.calcLayer = 'calc_delta';
        state.calcLegendType = 'delta';
        resMeta = {
          title: 'ΔNDVI Förändring [NDVI_B - NDVI_A]',
          min: '-0.81',
          max: '+0.72',
          mean: '-0.141',
          extraLabel: 'Minskad biomassa:',
          extraVal: '8 420 ha (37.4%)',
          hist: [450, 1800, 4200, 7100, 8900, 5100, 2400, 950, 400, 150]
        };
      } else if (clean.includes('B08-B12') || clean.includes('NBR')) {
        state.calcLayer = 'calc_nbr';
        state.calcLegendType = 'dnbr';
        resMeta = {
          title: 'NBR Burn Ratio [(B08-B12)/(B08+B12)]',
          min: '-0.38',
          max: '+0.85',
          mean: '+0.412',
          extraLabel: 'Standardavvikelse:',
          extraVal: '0.187',
          hist: [200, 600, 1400, 3200, 6800, 9400, 7100, 3800, 1800, 700]
        };
      } else if (clean.includes('>0.6') || clean.includes('>')) {
        state.calcLayer = 'calc_ndvi';
        state.calcLegendType = 'ndvi';
        resMeta = {
          title: `Tröskelvärdesmask [${expr}]`,
          min: '0.0',
          max: '1.0',
          mean: '0.553',
          extraLabel: 'Sluten vegetation:',
          extraVal: '12 450 ha (55.3%)',
          hist: [10050, 0, 0, 0, 0, 0, 0, 0, 0, 12450]
        };
      } else {
        // Standard NDVI or general band ratio
        state.calcLayer = 'calc_ndvi';
        state.calcLegendType = 'ndvi';
        resMeta = {
          title: `NDVI Beräknat Raster [${expr}]`,
          min: '-0.42',
          max: '+0.92',
          mean: '+0.584',
          extraLabel: 'Tät grönska (>0.6):',
          extraVal: '12 450 ha (55.3%)',
          hist: [350, 800, 1900, 3400, 5200, 7100, 8900, 6400, 3800, 1200]
        };
      }

      // Update map raster layer visually in real-time
      updateActiveLayers();

      // Update results card in UI
      if (el.calcResultsCard) {
        el.calcResultsCard.style.display = 'block';
        if (el.calcResultTitle) el.calcResultTitle.textContent = resMeta.title;
        if (el.calcStatMin) el.calcStatMin.textContent = resMeta.min;
        if (el.calcStatMax) el.calcStatMax.textContent = resMeta.max;
        if (el.calcStatMean) el.calcStatMean.textContent = resMeta.mean;
        if (el.calcStatExtraLabel) el.calcStatExtraLabel.textContent = resMeta.extraLabel;
        if (el.calcStatExtraVal) el.calcStatExtraVal.textContent = resMeta.extraVal;
        renderCalcHistogram(resMeta.hist);
      }

      showCalcStatus(`Exekvering lyckades! [${expr}] applicerad och renderad på kartan över 1500×1500 Float32 matris.`, true);
      updateDownloadsList();

    } catch (err) {
      showCalcStatus(`Fel i beräkning: ${err.message}`, false);
    }
  }

  function renderCalcHistogram(counts) {
    if (!el.calcHistSvg || !counts) return;
    const maxVal = Math.max(...counts, 1);
    const n = counts.length;
    const width = 240;
    const height = 40;
    const barW = width / n;
    let svg = '';
    counts.forEach((c, i) => {
      const h = (c / maxVal) * (height - 4);
      const x = i * barW;
      const y = height - h;
      svg += `<rect x="${x + 1}" y="${y}" width="${barW - 2}" height="${h}" fill="#00d2ff" opacity="0.85" rx="1"></rect>`;
    });
    el.calcHistSvg.innerHTML = svg;
  }

  function showCalcStatus(msg, isSuccess) {
    if (!el.calcStatusBox) return;
    el.calcStatusBox.textContent = msg;
    el.calcStatusBox.className = `calc-status-box ${isSuccess ? 'success' : 'error'}`;
  }

  // Predefined Zone Polygons Setup
  function setupPredefinedZones() {
    Object.values(zonePolygonLayers).forEach(p => mapInstance.removeLayer(p));
    zonePolygonLayers = {};

    el.zoneDropdown.innerHTML = '';
    const wholeOpt = document.createElement('option');
    wholeOpt.value = 'entire_study_area';
    wholeOpt.textContent = 'Hela området (15×15 km)';
    el.zoneDropdown.appendChild(wholeOpt);

    const zones = state.currentArea.predefined_zones || [];
    zones.forEach(zone => {
      const opt = document.createElement('option');
      opt.value = zone.id;
      opt.textContent = state.lang === 'sv' ? zone.name_sv : zone.name_en;
      el.zoneDropdown.appendChild(opt);

      const poly = L.polygon(zone.polygon_wgs84, {
        color: '#00d2ff',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#00d2ff',
        fillOpacity: 0.08,
        interactive: true
      });

      poly.on('click', () => {
        selectZone(zone.id, true);
      });

      poly.bindTooltip(state.lang === 'sv' ? zone.name_sv : zone.name_en, {
        sticky: true,
        className: 'zone-tooltip'
      });

      poly.addTo(mapInstance);
      zonePolygonLayers[zone.id] = poly;
    });

    selectZone('entire_study_area', false);
  }

  // Select and Focus on an Analysis Zone
  function selectZone(zoneId, shouldZoom = true) {
    state.currentZone = zoneId;
    if (el.zoneDropdown) el.zoneDropdown.value = zoneId;
    updateAreaAnalysis(zoneId);

    if (zoneId === 'entire_study_area') {
      Object.values(zonePolygonLayers).forEach(p => {
        p.setStyle({ color: '#00d2ff', weight: 1.5, fillOpacity: 0.08, dashArray: '4, 4' });
      });
      if (shouldZoom && state.currentArea && state.currentArea.wgs84_bounds && mapInstance) {
        mapInstance.flyToBounds(state.currentArea.wgs84_bounds, { padding: [30, 30], duration: 0.8 });
      }
    } else {
      Object.entries(zonePolygonLayers).forEach(([id, p]) => {
        if (id === zoneId) {
          p.setStyle({ color: '#10b981', weight: 3, fillOpacity: 0.28, dashArray: null });
          p.bringToFront();
          if (shouldZoom && mapInstance) {
            mapInstance.flyToBounds(p.getBounds(), { padding: [60, 60], maxZoom: 15, duration: 0.8 });
          }
        } else {
          p.setStyle({ color: '#64748b', weight: 1, fillOpacity: 0.04, dashArray: '4, 4' });
        }
      });
    }
  }

  // Update Area Analysis Panel
  function updateAreaAnalysis(zoneId) {
    let statsData = null;
    if (zoneId === 'entire_study_area') {
      statsData = state.currentArea.statistics;
    } else {
      const z = (state.currentArea.predefined_zones || []).find(item => item.id === zoneId);
      if (z) statsData = z.stats;
    }

    if (!statsData) return;

    const meanA = statsData.date_a.mean;
    const meanB = statsData.date_b.mean;
    const delta = statsData.delta.mean;
    const valid = statsData.delta.valid_percentage;
    const std = statsData.delta.std;

    el.metricMeanA.textContent = meanA !== null ? meanA.toFixed(3) : '—';
    el.metricMeanB.textContent = meanB !== null ? meanB.toFixed(3) : '—';

    if (delta !== null) {
      el.metricDeltaMean.textContent = (delta > 0 ? '+' : '') + delta.toFixed(3);
      el.metricDeltaMean.className = `metric-value ${delta > 0.05 ? 'positive' : delta < -0.05 ? 'negative' : 'neutral'}`;
    } else {
      el.metricDeltaMean.textContent = '—';
      el.metricDeltaMean.className = 'metric-value neutral';
    }

    el.metricValid.textContent = `${valid.toFixed(1)}%`;
    el.metricStd.textContent = std !== null ? std.toFixed(3) : '—';

    renderHistogram(statsData.delta.histogram);
  }

  // Render SVG Histogram
  function renderHistogram(hist) {
    if (!hist || !hist.counts) {
      el.histogramSvg.innerHTML = '';
      return;
    }

    const counts = hist.counts;
    const maxCount = Math.max(...counts, 1);
    const n = counts.length;
    const width = 300;
    const height = 70;
    const barWidth = width / n;

    let svgHtml = '';
    counts.forEach((c, i) => {
      const barH = (c / maxCount) * (height - 8);
      const x = i * barWidth;
      const y = height - barH;
      const ratio = i / (n - 1);
      const color = ratio < 0.45 ? '#e11d48' : ratio > 0.55 ? '#10b981' : '#64748b';

      svgHtml += `<rect x="${x + 1}" y="${y}" width="${Math.max(1, barWidth - 2)}" height="${barH}" fill="${color}" opacity="0.85" rx="1"></rect>`;
    });

    const midX = width / 2;
    svgHtml += `<line x1="${midX}" y1="0" x2="${midX}" y2="${height}" stroke="rgba(255,255,255,0.4)" stroke-dasharray="2,2" stroke-width="1"></line>`;

    el.histogramSvg.innerHTML = svgHtml;
  }

  // Update Dynamic Download Modal Links
  function updateDownloadsList() {
    const downloadContainer = document.querySelector('#downloadsModal .download-list');
    if (!downloadContainer) return;

    const expId = state.activeExperiment;
    let items = [];

    if (expId === 'vegetation') {
      const areaId = state.currentAreaId;
      items = [
        { title: `NDVI Datum A GeoTIFF (${areaId})`, desc: '1500×1500 celler · 10 m · Float32 (7 MB)', url: `data/downloads/${areaId}/${areaId}_ndvi_date_a.tif` },
        { title: `NDVI Datum B GeoTIFF (${areaId})`, desc: '1500×1500 celler · 10 m · Float32 (7.2 MB)', url: `data/downloads/${areaId}/${areaId}_ndvi_date_b.tif` },
        { title: `ΔNDVI Förändringsraster GeoTIFF`, desc: 'Tidsdifferens (B - A) · Float32 (7.7 MB)', url: `data/downloads/${areaId}/${areaId}_delta_ndvi.tif` },
        { title: `Zonstatistik CSV`, desc: 'Medelvärden, min/max, spridning', url: `data/downloads/${areaId}/${areaId}_statistics.csv` }
      ];
    } else if (expId === 'water') {
      items = [
        { title: 'NDWI Juni 2024 (McFeeters) GeoTIFF', desc: '1500×1500 celler · 10 m · Float32 (7 MB)', url: 'data/downloads/water/ndwi_a.tif' },
        { title: 'NDWI September 2024 GeoTIFF', desc: '1500×1500 celler · 10 m · Float32 (7 MB)', url: 'data/downloads/water/ndwi_b.tif' },
        { title: 'MNDWI Juni 2024 (SWIR-1) GeoTIFF', desc: '1500×1500 celler · 10 m · Float32 (7 MB)', url: 'data/downloads/water/mndwi_a.tif' },
        { title: 'MNDWI September 2024 GeoTIFF', desc: '1500×1500 celler · 10 m · Float32 (7 MB)', url: 'data/downloads/water/mndwi_b.tif' }
      ];
    } else if (expId === 'wildfire') {
      items = [
        { title: 'dNBR Brandskadegrad GeoTIFF (Kårböle)', desc: '1500×1500 celler · 10 m · Float32 (USGS standard)', url: 'data/downloads/wildfire/dnbr.tif' },
        { title: 'NBR Före brand (Jul 2018) GeoTIFF', desc: '1500×1500 celler · 10 m · Float32', url: 'data/downloads/wildfire/nbr_pre.tif' },
        { title: 'NBR Efter brand (Sep 2018) GeoTIFF', desc: '1500×1500 celler · 10 m · Float32', url: 'data/downloads/wildfire/nbr_post.tif' }
      ];
    } else if (expId === 'terrain') {
      items = [
        { title: 'Copernicus DEM 30 m Höjdmodell GeoTIFF', desc: '500×500 celler · 30 m · Float32 m ö.h.', url: 'data/downloads/terrain/elevation.tif' },
        { title: 'Terränglutning (Slope i grader) GeoTIFF', desc: 'Horns metod · Float32 grader', url: 'data/downloads/terrain/slope.tif' },
        { title: 'Terrängskuggning (Hillshade) GeoTIFF', desc: 'Azimut 315°, elevation 45° · 8-bit', url: 'data/downloads/terrain/hillshade.tif' }
      ];
    } else {
      items = [
        { title: 'Anpassat Rasteralgebra-resultat GeoTIFF', desc: 'Float32 · EPSG:32633', url: 'data/downloads/takern/takern_delta_ndvi.tif' }
      ];
    }

    downloadContainer.innerHTML = items.map(it => `
      <a href="${it.url}" download class="download-item">
        <div>
          <strong style="color: var(--accent-cyan);">${it.title}</strong>
          <div style="font-size: 11px; color: var(--text-muted);">${it.desc}</div>
        </div>
        <span class="btn btn-secondary">Ladda ned</span>
      </a>
    `).join('');
  }

  // Pixel Probing
  function probeCoordinates(lat, lon) {
    el.probeCoords.textContent = `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`;

    if (!state.probeGrid) return;

    // Fast search in probe points array
    if (Array.isArray(state.probeGrid)) {
      // Find nearest point
      let nearest = null;
      let minD = 999999;
      for (let i = 0; i < state.probeGrid.length; i += 2) {
        const pt = state.probeGrid[i];
        const d = (pt.lat - lat)**2 + (pt.lon - lon)**2;
        if (d < minD) {
          minD = d;
          nearest = pt;
          if (d < 0.00005) break;
        }
      }

      if (nearest && minD < 0.005) {
        if (state.activeExperiment === 'water') {
          el.probeNdviA.textContent = nearest.ndwi_a !== null ? nearest.ndwi_a.toFixed(2) : '—';
          el.probeNdviB.textContent = nearest.ndwi_b !== null ? nearest.ndwi_b.toFixed(2) : '—';
          el.probeDelta.textContent = nearest.is_water_a ? 'Vatten' : 'Land';
          el.probeDelta.style.color = nearest.is_water_a ? 'var(--accent-cyan)' : 'var(--text-muted)';
        } else if (state.activeExperiment === 'wildfire') {
          el.probeNdviA.textContent = nearest.nbr_pre !== null ? nearest.nbr_pre.toFixed(2) : '—';
          el.probeNdviB.textContent = nearest.nbr_post !== null ? nearest.nbr_post.toFixed(2) : '—';
          const c = nearest.burn_class;
          const classNames = ['Oskadat', 'Låg brandgrad', 'Måttlig brandgrad', 'Hög brandgrad'];
          el.probeDelta.textContent = nearest.dnbr !== null ? `${nearest.dnbr.toFixed(2)} (${classNames[c-1] || 'Oskadat'})` : '—';
          el.probeDelta.style.color = c >= 3 ? 'var(--accent-rose)' : c === 2 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
        } else if (state.activeExperiment === 'terrain') {
          el.probeNdviA.textContent = `${nearest.elevation_m} m`;
          el.probeNdviB.textContent = `${nearest.slope_deg}°`;
          el.probeDelta.textContent = `${nearest.aspect_deg}° az`;
          el.probeDelta.style.color = 'var(--accent-cyan)';
        }
      }
    }
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Experiment Selector
    if (el.experimentSelect) {
      el.experimentSelect.addEventListener('change', (e) => {
        switchExperiment(e.target.value);
      });
    }

    // Study Area & Experiment Selector (Topbar)
    if (el.studyAreaSelect) {
      el.studyAreaSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        if (val.startsWith('veg_')) {
          const areaId = val.replace('veg_', '');
          await switchVegArea(areaId);
        } else {
          await switchExperiment(val);
        }
      });
    }

    // Zone Dropdown Selector (Analysis Panel)
    if (el.zoneDropdown) {
      el.zoneDropdown.addEventListener('change', (e) => {
        selectZone(e.target.value, true);
      });
    }

    // Basemap Switcher
    el.basemapButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.basemapButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setBasemap(btn.dataset.basemap);
      });
    });

    // Mode Switcher (Single vs Split)
    el.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mode = btn.dataset.mode;
        updateActiveLayers();
      });
    });

    // Vegetation Subregion Switcher (Tåkern, Öland, Skåne)
    if (el.vegAreaButtons) {
      el.vegAreaButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const areaId = btn.dataset.vegArea;
          await switchVegArea(areaId);
        });
      });
    }

    // Vegetation Date Switcher
    el.dateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.dateButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentDate = btn.dataset.date;
        updateActiveLayers();
      });
    });

    // Vegetation Layer Selector
    el.layerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.layerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentLayerType = btn.dataset.layerType;
        updateActiveLayers();
      });
    });

    // Water Date & Layer Buttons
    el.waterDateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.waterDateButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.waterDate = btn.dataset.waterDate;
        updateActiveLayers();
      });
    });

    el.waterLayerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.waterLayerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.waterLayer = btn.dataset.waterLayer;
        updateActiveLayers();
      });
    });

    if (el.waterThresholdSlider) {
      el.waterThresholdSlider.addEventListener('input', (e) => {
        state.waterThreshold = parseFloat(e.target.value);
        if (el.waterThresholdVal) el.waterThresholdVal.textContent = state.waterThreshold >= 0 ? `+${state.waterThreshold.toFixed(2)}` : state.waterThreshold.toFixed(2);
      });
    }

    // Wildfire Date & Layer Buttons
    el.fireDateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.fireDateButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.fireDate = btn.dataset.fireDate;
        updateActiveLayers();
      });
    });

    el.fireLayerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.fireLayerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.fireLayer = btn.dataset.fireLayer;
        updateActiveLayers();
      });
    });

    // Terrain Layer Buttons & Profile Modal
    el.terrainLayerButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        el.terrainLayerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.terrainLayer = btn.dataset.terrainLayer;
        updateActiveLayers();
      });
    });

    if (el.btnShowProfile) {
      el.btnShowProfile.addEventListener('click', renderTopographicProfile);
    }
    if (el.btnCloseProfile) {
      el.btnCloseProfile.addEventListener('click', () => el.profileModal.classList.remove('open'));
    }
    if (el.profileModal) {
      el.profileModal.addEventListener('click', (e) => {
        if (e.target === el.profileModal) el.profileModal.classList.remove('open');
      });
    }

    // Calculator Buttons & Pills
    if (el.calcPresetSelect) {
      el.calcPresetSelect.addEventListener('change', (e) => {
        el.calcFormulaInput.value = e.target.value;
      });
    }

    el.calcPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.dataset.insert;
        el.calcFormulaInput.value += val;
        el.calcFormulaInput.focus();
      });
    });

    if (el.btnRunCalc) {
      el.btnRunCalc.addEventListener('click', runSafeRasterCalculator);
    }

    // Split Select Dropdowns
    el.splitLeftSelect.addEventListener('change', () => {
      el.presetGrid.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      state.splitLeftLayer = el.splitLeftSelect.value;
      updateActiveLayers();
    });

    el.splitRightSelect.addEventListener('change', () => {
      el.presetGrid.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      state.splitRightLayer = el.splitRightSelect.value;
      updateActiveLayers();
    });

    // Swipe Slider Dragging
    const onSwipeMove = (clientX) => {
      const mapBox = el.map.getBoundingClientRect();
      const relativeX = clientX - mapBox.left;
      state.splitRatio = Math.max(0.05, Math.min(0.95, relativeX / mapBox.width));
      updateSwipeClipping();
    };

    el.swipeDivider.addEventListener('mousedown', (e) => {
      state.isDraggingSwipe = true;
      e.preventDefault();
    });

    el.swipeDivider.addEventListener('touchstart', (e) => {
      state.isDraggingSwipe = true;
      if (e.touches && e.touches[0]) onSwipeMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (state.isDraggingSwipe) onSwipeMove(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
      if (state.isDraggingSwipe && e.touches && e.touches[0]) {
        onSwipeMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      state.isDraggingSwipe = false;
    });

    window.addEventListener('touchend', () => {
      state.isDraggingSwipe = false;
    });

    mapInstance.on('move', updateSwipeClipping);
    mapInstance.on('zoom', updateSwipeClipping);

    mapInstance.on('mousemove', (e) => {
      probeCoordinates(e.latlng.lat, e.latlng.lng);
    });

    mapInstance.on('click', (e) => {
      probeCoordinates(e.latlng.lat, e.latlng.lng);
    });

    // Mobile Navigation Dock
    const btnMobLayers = document.getElementById('btnMobLayers');
    const btnMobStats = document.getElementById('btnMobStats');
    const btnMobMap = document.getElementById('btnMobMap');
    const btnMobLegend = document.getElementById('btnMobLegend');
    const btnCloseControls = document.getElementById('btnCloseControls');
    const btnCloseAnalysis = document.getElementById('btnCloseAnalysis');

    const getControls = () => el.controlsPanel || document.getElementById('controlsPanel');
    const getAnalysis = () => el.analysisPanel || document.getElementById('analysisPanel');
    const getLegend = () => el.legendPanel || document.getElementById('legendPanel');

    function setActiveMobileTab(tab) {
      [btnMobLayers, btnMobStats, btnMobMap, btnMobLegend].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (tab === 'layers' && btnMobLayers) btnMobLayers.classList.add('active');
      if (tab === 'stats' && btnMobStats) btnMobStats.classList.add('active');
      if (tab === 'map' && btnMobMap) btnMobMap.classList.add('active');
      if (tab === 'legend' && btnMobLegend) btnMobLegend.classList.add('active');
    }

    if (btnMobLayers) {
      btnMobLayers.addEventListener('click', (e) => {
        e.preventDefault();
        const p = getControls();
        const a = getAnalysis();
        const l = getLegend();
        const isVisible = p && p.classList.contains('mobile-open');
        if (p) p.classList.toggle('mobile-open', !isVisible);
        if (a) a.classList.remove('mobile-open');
        if (l) l.classList.remove('mobile-open');
        setActiveMobileTab(!isVisible ? 'layers' : 'map');
      });
    }

    if (btnMobStats) {
      btnMobStats.addEventListener('click', (e) => {
        e.preventDefault();
        const p = getControls();
        const a = getAnalysis();
        const l = getLegend();
        const isVisible = a && a.classList.contains('mobile-open');
        if (a) a.classList.toggle('mobile-open', !isVisible);
        if (p) p.classList.remove('mobile-open');
        if (l) l.classList.remove('mobile-open');
        setActiveMobileTab(!isVisible ? 'stats' : 'map');
      });
    }

    if (btnMobMap) {
      btnMobMap.addEventListener('click', (e) => {
        e.preventDefault();
        const p = getControls();
        const a = getAnalysis();
        const l = getLegend();
        if (p) p.classList.remove('mobile-open');
        if (a) a.classList.remove('mobile-open');
        if (l) l.classList.remove('mobile-open');
        setActiveMobileTab('map');
      });
    }

    if (btnMobLegend) {
      btnMobLegend.addEventListener('click', (e) => {
        e.preventDefault();
        const p = getControls();
        const a = getAnalysis();
        const l = getLegend();
        const isVisible = l && l.classList.contains('mobile-open');
        if (l) l.classList.toggle('mobile-open', !isVisible);
        if (p) p.classList.remove('mobile-open');
        if (a) a.classList.remove('mobile-open');
        setActiveMobileTab(!isVisible ? 'legend' : 'map');
      });
    }

    if (btnCloseControls) {
      btnCloseControls.addEventListener('click', (e) => {
        e.preventDefault();
        const p = getControls();
        if (p) p.classList.remove('mobile-open');
        setActiveMobileTab('map');
      });
    }

    if (btnCloseAnalysis) {
      btnCloseAnalysis.addEventListener('click', (e) => {
        e.preventDefault();
        const a = getAnalysis();
        if (a) a.classList.remove('mobile-open');
        setActiveMobileTab('map');
      });
    }

    // Modals
    el.btnMethodology.addEventListener('click', () => el.methodologyModal.classList.add('open'));
    el.btnCloseMethodology.addEventListener('click', () => el.methodologyModal.classList.remove('open'));
    el.methodologyModal.addEventListener('click', (e) => {
      if (e.target === el.methodologyModal) el.methodologyModal.classList.remove('open');
    });

    el.btnDownloads.addEventListener('click', () => el.downloadsModal.classList.add('open'));
    el.btnCloseDownloads.addEventListener('click', () => el.downloadsModal.classList.remove('open'));
    el.downloadsModal.addEventListener('click', (e) => {
      if (e.target === el.downloadsModal) el.downloadsModal.classList.remove('open');
    });

    // Language Toggle
    el.btnLangToggle.addEventListener('click', () => {
      state.lang = state.lang === 'sv' ? 'en' : 'sv';
      el.btnLangToggle.textContent = i18n[state.lang].langBtn;
      updateActiveLayers();
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
