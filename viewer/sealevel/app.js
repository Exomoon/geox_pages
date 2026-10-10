const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('sv-SE', {maximumFractionDigits: 1});
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
  {name:'Thessaloniki', aliases:['Saloniki'], lat:40.6401, lon:22.9444}
  ,{name:'Doggerbanken', aliases:['Dogger Bank'], lat:55.1, lon:2.5}
  ,{name:'London', aliases:[], lat:51.5072, lon:-0.1276}
  ,{name:'Amsterdam', aliases:[], lat:52.3676, lon:4.9041}
  ,{name:'Hamburg', aliases:[], lat:53.5511, lon:9.9937}
  ,{name:'Köpenhamn', aliases:['Copenhagen'], lat:55.6761, lon:12.5683}
  ,{name:'Paris', aliases:[], lat:48.8566, lon:2.3522}
  ,{name:'Stockholm', aliases:[], lat:59.3293, lon:18.0686}
];
const geocoderEndpoint='https://nominatim.openstreetmap.org/search';

const translations = {
  en: {scenarioPlatform:'Geospatial scenario platform',methodSources:'Method & sources',headline:'Read coastal change layer by layer.',intro:'Compare sea-level change alone with a scenario where land motion, erosion and deposition also reshape terrain.',overview:'5 km overview',aegean:'Aegean Sea',ready:'Analysis data',nextRegion:'450 m regional demo',timeScenario:'Time & scenario',scenario:'Scenario',selectedTime:'Selected time',older:'Older',play:'Play timeline',pause:'Pause',comparison:'Map view',reconstruction:'Reconstruction',comparisonHelp:'The reconstruction updates directly with time. Difference shows only where land motion, erosion or deposition changes the class compared with the same sea level on present terrain.',full:'Landscape',seaOnly:'Sea level',swipe:'Swipe',difference:'Difference from sea level only',seaModel:'Control · sea level only',fullModel:'Reconstruction · all processes',processLayers:'Process layers',processTimeNote:'Older dates show cumulative change in metres. At 0 BP the layers show process extent and assumed rate in mm/year.',recalculate:'Advanced: recalculate model',recalcHint:'This changes model assumptions, not layer visibility. Disable a process and recalculate the selected time locally.',rateWarning:'Demo rates are synthetic and regionally generalised—not measured erosion or sedimentation rates.',landMotion:'Land motion',erosion:'Erosion',deposition:'Deposition',calculate:'Recalculate selected time',cellAnalysis:'Cell analysis',clickPrompt:'Click inside the selected model area to inspect a calculated cell.',todayTerrain:'Present terrain',laterUplift:'− later uplift / + later subsidence',laterErosion:'+ later erosion',laterDeposition:'− later deposition',reconstructedTerrain:'= reconstructed past terrain',seaSurface:'Selected sea surface',heightMargin:'Elevation margin',computedClass:'Calculated class',simpleClass:'Sea-only class',legend:'Legend',resolutionQuality:'Resolution & quality',basemapDetail:'Basemap',modelCell:'Model cell',terrainSource:'Terrain source',resolutionWarning:'Zoom enlarges cells but creates no new terrain information.',fitRegion:'Zoom to analysis coverage',drawAoi:'Draw analysis area',gotoCoordinates:'Go to coordinates',methodTitle:'What the model shows — and does not show',methodIntro:'The model reconstructs geometric elevation scenarios. It does not date settlements or model physical sediment transport, waves or ice-free conditions.',verifiedCandidates:'Verified candidates for local refinement',datumWarning:'These sources must not be merged without documented vertical-datum harmonisation. Finer resampling is not greater real accuracy.'},
  sv: {}
};
document.querySelectorAll('[data-i18n]').forEach(el => el.dataset.sv = el.textContent);

const map = L.map('map', {
  zoomControl:false,
  minZoom:3,
  zoomSnap:.25,
  zoomDelta:.25,
  wheelPxPerZoomLevel:90,
  worldCopyJump:false,
  maxBoundsViscosity:1
}).setView([37.6,25.4],6);
L.control.zoom({position:'bottomright'}).addTo(map);
L.control.scale({imperial:false, position:'bottomleft'}).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'© OpenStreetMap contributors'}).addTo(map);
map.createPane('resultA'); map.getPane('resultA').style.zIndex=410;
map.createPane('resultB'); map.getPane('resultB').style.zIndex=420;
map.createPane('process'); map.getPane('process').style.zIndex=430;

function t(key){return translations[state.lang]?.[key] || document.querySelector(`[data-i18n="${key}"]`)?.dataset.sv || key}
function currentScenario(){return state.catalog.scenarios.find(s=>s.id===$('scenario').value)}
function currentFrame(){return currentScenario().frames[+$('time').value]}
function setText(id, value){$(id).textContent=value}
const scenarioUi={
  baseline:{name:'Bara havsnivå · kontroll',status:'KONTROLL: dagens terräng och illustrativ havsnivå. Ingen separat landrörelse, erosion eller sedimentpålagring.'},
  spatial_scenario:{name:'Havsnivå + landskap',status:'HYPOTETISKT TEST: syntetisk landrörelse, erosion och sedimentpålagring – inte mätningar.'}
};

function removeResultLayers(){
  for(const key of ['state_full','state_sea','class_difference']){
    const layer=state.layers.get(key); if(layer){map.removeLayer(layer);state.layers.delete(key)}
  }
}
function addImage(key, info, pane='process', opacity=.8){
  const old=state.layers.get(key); if(old) map.removeLayer(old);
  const layer=info.tiles
    ?L.tileLayer(info.tiles,{pane,opacity,interactive:false,noWrap:true,minNativeZoom:info.min_native_zoom,maxNativeZoom:info.max_native_zoom,maxZoom:14,className:'model-raster'})
    :L.imageOverlay(info.url, info.bounds, {pane,opacity,interactive:false,crossOrigin:false,className:'model-raster'});
  layer.addTo(map);
  state.layers.set(key,layer); return layer;
}
function removeMapLayer(key){const layer=state.layers.get(key);if(layer){map.removeLayer(layer);state.layers.delete(key)}}
const processRateLayers={land_motion:'uplift_rate',erosion:'erosion_rate',deposition:'deposition_rate'};
function processDisplay(name){
  const vector=state.frame.vector_layers?.[name];
  if(vector)return {info:vector,key:name,isRate:false,isVector:true};
  const cumulative=state.frame.layers[name],rateKey=processRateLayers[name],rate=rateKey?state.frame.layers[rateKey]:null;
  if(state.frame.age_bp===0&&rate&&!rate.empty)return {info:rate,key:rateKey,isRate:true};
  return {info:cumulative,key:name,isRate:false,isVector:false};
}
function motionScale(layerKey='land_motion'){
  const max=Math.max(.001,...state.scenario.frames.flatMap(frame=>[Math.abs(frame.layers[layerKey]?.min||0),Math.abs(frame.layers[layerKey]?.max||0)]));
  return {max,low:max/3,high:max*2/3};
}
function motionLevel(value,layerKey){const magnitude=Math.abs(value),scale=motionScale(layerKey);return magnitude>=scale.high?'high':magnitude>=scale.low?'medium':'low'}
function renderMotionSymbols(opacity=1){
  removeMapLayer('land_motion_symbols');
  const display=processDisplay('land_motion'),symbols=display.info?.symbols||[];
  if(!symbols.length)return;
  const maxAbs=Math.max(...symbols.map(symbol=>Math.abs(symbol.value)),.001);
  const stride=map.getZoom()<=5?2:1;
  const group=L.layerGroup();
  symbols.forEach((symbol,index)=>{
    if(index%stride)return;
    const positive=symbol.value>0;
    const magnitude=Math.abs(symbol.value);
    const level=motionLevel(symbol.value,display.key);
    const size=Math.round(18+Math.min(8,magnitude/maxAbs*8));
    const glyph='+';
    const valueSign=positive?'+':'−';
    const unit=display.isRate?'mm/år':'m';
    const valueLabel=`${valueSign}${fmt.format(magnitude)} ${unit}`;
    const icon=L.divIcon({
      className:'motion-marker',
      iconSize:[size, size], iconAnchor:[size/2,size/2],
      html:`<span class="motion-symbol ${positive?'uplift':'subsidence'} level-${level}" style="--symbol-size:${size}px;opacity:${opacity}" aria-hidden="true">${glyph}</span>`
    });
    L.marker([symbol.lat,symbol.lon],{icon,pane:'process',keyboard:false})
      .bindPopup(`<div class="motion-popup"><span class="motion-popup-symbol ${positive?'uplift':'subsidence'} level-${level}">${glyph}</span><div><small>${display.isRate?'Antagen hastighet vid 0 BP':'Kumulativ landrörelse'}</small><strong>${positive?'Landhöjning':'Landsänkning'} · ${valueLabel}</strong><p>${display.isRate?'Scenarioantagande vid referensläget 1950 – inte en mätning.':'Förändring från vald äldre tid till 1950.'} · ${level==='high'?'stor':level==='medium'?'medelstor':'liten'} magnitud.</p></div></div>`)
      .addTo(group);
  });
  group.addTo(map);state.layers.set('land_motion_symbols',group);
}
function refreshMotionSymbols(){
  const settings=state.layerSettings.get('land_motion');
  if(settings?.enabled&&!processDisplay('land_motion').info.empty)renderMotionSymbols(settings.opacity);
}
function renderResult(){
  const frame=state.frame;
  removeResultLayers();
  if(state.mode==='full') addImage('state_full',frame.layers.state_full,'resultB',.9);
  if(state.mode==='sea') addImage('state_sea',frame.layers.state_sea,'resultA',.9);
  if(state.mode==='difference'){
    addImage('state_full',frame.layers.state_full,'resultB',.48);
    if(frame.changed_cells>0)addImage('class_difference',frame.layers.class_difference,'process',.98);
  }
}
const processLabels={land_motion:'Antagen landrörelse efter vald tid → 1950',erosion:'Antagen erosion efter vald tid → 1950',deposition:'Antagen sedimentpålagring efter vald tid → 1950'};
const rateLabels={land_motion:'Antagen landrörelse vid 0 BP',erosion:'Antagen erosion vid 0 BP',deposition:'Antagen sedimentpålagring vid 0 BP'};
function layerLabel(name,display=processDisplay(name)){return display.isRate?rateLabels[name]:(processLabels[name]||display.info?.title||name)}
const processNames=['paleo_elevation','terrain_change','coastline','sensitivity','basins','land_motion','erosion','deposition'];
processNames.push('ice_extent','palaeodrainage');
const layerDescriptions={
  paleo_elevation:'Rekonstruerad höjd med tidsberoende terrängskuggning. Havsnivån avgör vad som översvämmas; landskapsprocesserna ändrar själva höjden.',
  terrain_change:'Rekonstruerad höjd minus dagens höjd, i meter. Visar bidraget från landrörelse, erosion och sedimentpålagring.',
  coastline:'Gränsen mellan beräknat land och hav med havskontakt.',
  sensitivity:'Celler vars klass kan ändras inom modellens illustrativa höjdmarginal.',
  basins:'Terräng under havsytan utan beräknad kontakt med öppet hav.',
  land_motion:'Kumulativ antagen rörelse till 1950. Varma plus visar höjning och blå plus visar sänkning; symbolerna är stickprov ur modellgridden.',
  erosion:'Kumulativ antagen höjd som eroderats bort efter vald äldre tid.',
  deposition:'Kumulativ antagen sedimenthöjd som lagrats efter vald äldre tid.',
  ice_extent:'Källbelagd empirisk isutbredning för just detta tidssteg. Saknat lager betyder inte automatiskt isfritt.',
  palaeodrainage:'Kartlagda palaeokanaler från EMODnet Geology. Inventariet är inte en samtidig eller komplett flodrekonstruktion.'
};
const rateDescriptions={
  land_motion:'Antagen landrörelsehastighet vid referensläget 0 BP (1950), i mm/år – inte mätdata.',
  erosion:'Område där scenariot antar erosion vid 0 BP (1950), visat som mm/år – inte mätdata.',
  deposition:'Område där scenariot antar sedimentpålagring vid 0 BP (1950), visat som mm/år – inte mätdata.'
};
function layerDescription(name,display=processDisplay(name)){return display.isRate?rateDescriptions[name]:(layerDescriptions[name]||'')}
for(const name of processNames)state.layerSettings.set(name,{enabled:name==='coastline'||name==='paleo_elevation',opacity:name==='coastline'?1:name==='paleo_elevation'?0.88:0.78});
const vectorCache=new Map();
function availableProcessNames(){return processNames.filter(name=>state.frame.layers[name]||state.frame.vector_layers?.[name])}
function vectorStyle(name,opacity){
  if(name==='ice_extent')return {color:'#a8d5e5',weight:1.5,opacity,fillColor:'#dff2f7',fillOpacity:opacity*.55};
  return {color:'#3aa6b7',weight:2,opacity,fillOpacity:0,dashArray:'6 4'};
}
async function addVector(name,info,opacity){
  const url=info.url;
  if(!vectorCache.has(url))vectorCache.set(url,fetch(url).then(response=>{if(!response.ok)throw Error(`Kunde inte läsa ${url}`);return response.json()}));
  try{
    const data=await vectorCache.get(url);
    if(state.frame.vector_layers?.[name]?.url!==url||!state.layerSettings.get(name)?.enabled)return;
    removeMapLayer(name);
    const layer=L.geoJSON(data,{pane:'process',interactive:true,style:vectorStyle(name,opacity),onEachFeature:(_,featureLayer)=>featureLayer.bindPopup(`<b>${info.title}</b><p>${info.detail||''}</p>`)}).addTo(map);
    state.layers.set(name,layer);
  }catch(error){showMapMessage(error.message)}
}
function setProcessOpacity(name,layer,opacity){
  if(name==='land_motion'){layer.setOpacity(opacity*.24);return}
  if(state.frame.vector_layers?.[name]){layer.setStyle(vectorStyle(name,opacity));return}
  layer.setOpacity(opacity);
}
function buildLayerControls(){
  $('layerControls').innerHTML='';
  for(const name of availableProcessNames()){
    const settings=state.layerSettings.get(name);
    const display=processDisplay(name),info=display.info;
    const description=info.empty?'Saknar regionalt underlag i detta scenario.':layerDescription(name,display);
    const row=document.createElement('div');row.className=`layer-row layer-${name}${info.empty?' is-empty':''}`;row.title=description;
    const available=!info.empty;
    const visual=name==='land_motion'?'<span class="layer-glyphs"><i>+</i><i>+</i></span>':`<span class="layer-swatch ${name}"></span>`;
    row.innerHTML=`<input type="checkbox" data-layer="${name}" ${settings.enabled?'checked':''} ${available?'':'disabled'}><div class="layer-copy"><label>${visual}<span>${layerLabel(name,display)}</span></label><small>${description}</small></div><div class="opacity-control"><span>Opacitet</span><input type="range" min="0" max="100" value="${Math.round(settings.opacity*100)}" aria-label="Transparens" title="Opacitet ${Math.round(settings.opacity*100)} %" ${settings.enabled&&available?'':'disabled'}></div>`;
    const toggle=row.children[0], opacity=row.querySelector('input[type=range]');
    toggle.onchange=()=>{settings.enabled=toggle.checked;opacity.disabled=!toggle.checked;toggleProcess(name,settings.enabled&&available,settings.opacity)};
    opacity.oninput=()=>{settings.opacity=+opacity.value/100;opacity.title=`Opacitet ${opacity.value} %`;const layer=state.layers.get(name);if(layer)setProcessOpacity(name,layer,settings.opacity);if(name==='land_motion')renderMotionSymbols(settings.opacity)};
    $('layerControls').append(row);
    if(settings.enabled&&available)toggleProcess(name,true,settings.opacity);
  }
}
function toggleProcess(name,on,opacity){
  removeMapLayer(name);if(name==='land_motion')removeMapLayer('land_motion_symbols');
  if(on){
    const display=processDisplay(name);
    if(display.isVector)addVector(name,display.info,opacity);
    else addImage(name,display.info,'process',name==='land_motion'?opacity*.24:opacity);
    if(name==='land_motion')renderMotionSymbols(opacity);
  }
  updateLegend(name,on);
}
function updateLegend(activeName,on=true){
  if(activeName&&on===false)activeName=availableProcessNames().find(name=>state.layerSettings.get(name)?.enabled&&!processDisplay(name).info.empty)||null;
  const display=activeName?processDisplay(activeName):null;
  const info=display?.info || state.frame.layers[state.mode==='difference'?'class_difference':state.mode==='sea'?'state_sea':'state_full'];
  if(!activeName&&state.mode==='difference'&&state.frame.changed_cells===0){
    const baseline=state.scenario.id==='baseline';
    $('legend').innerHTML=baseline?'<b>Ingen processkillnad</b><p class="hint">Kontrollen innehåller inga separata landskapsprocesser, oavsett vald tid.</p>':'<b>Ingen skillnad vid 0 BP</b><p class="hint">De kumulativa landskapsprocesserna är noll i referensläget.</p>';return
  }
  if(info.empty){$('legend').innerHTML=`<b>${activeName?layerLabel(activeName):info.title} · ${info.units}</b><p class="hint">0 m: det finns inget senare tidsintervall från 0 BP till referensläget.</p>`;return}
  if(activeName==='land_motion'){
    const scale=motionScale(display.key),low=fmt.format(scale.low),high=fmt.format(scale.high),max=fmt.format(scale.max);
    $('legend').innerHTML=`<b>Landhöjning / landsänkning · ${info.units}</b><div class="motion-symbol-explanation"><span><i class="motion-key uplift level-medium">+</i> Varm = landhöjning</span><span><i class="motion-key subsidence level-medium">+</i> Blå = landsänkning</span></div><div class="motion-legend"><span class="motion-key subsidence level-high">+</span><small>−${max} till −${high}</small><span class="motion-key subsidence level-medium">+</span><small>−${high} till −${low}</small><span class="motion-key subsidence level-low">+</span><small>−${low} till 0</small><span class="motion-key uplift level-low">+</span><small>0 till +${low}</small><span class="motion-key uplift level-medium">+</span><small>+${low} till +${high}</small><span class="motion-key uplift level-high">+</span><small>+${high} till +${max}</small></div><div class="gradient" style="background:linear-gradient(90deg,#344b89,#9cadd3,#f3efe1,#e5a08f,#8f382e)"></div><p class="legend-note">${display.isRate?'Vid 0 BP visas scenariots antagna hastighet, inte kumulativ förändring eller mätdata.':'Fast symbolskala för hela tidsserien. Symbolerna är regelbundna stickprov ur 600-metersgridden; den svaga ytan visar variationen mellan dem.'}</p>`;return
  }
  if(info.kind==='ice'||info.kind==='drainage'){
    const color=info.kind==='ice'?'#dff2f7':'#3aa6b7';
    $('legend').innerHTML=`<div class="legend-row"><i class="swatch" style="background:${color};border:1px solid #307a8b"></i>${info.title}</div><p class="legend-note">${info.detail||layerDescription(activeName,display)}</p>`;return
  }
  if(info.kind==='state') $('legend').innerHTML=`<div class="legend-row"><i class="swatch" style="background:#d3c091"></i>Land</div><div class="legend-row"><i class="swatch" style="background:#155870"></i>Hav med kontakt</div><div class="legend-row"><i class="swatch" style="background:#725982"></i>Sluten sänka</div>`;
  else if(['diverging','positive','terrain'].includes(info.kind)){
    const gradients={paleo_elevation:'linear-gradient(90deg,#10384b,#4f93a0,#d9c89e,#8da672,#8a725e,#e8e3d8)',terrain_change:'linear-gradient(90deg,#4a63a8,#f3efe1,#cb5b3e)',erosion:'linear-gradient(90deg,#fff4d5,#d04d2e)',deposition:'linear-gradient(90deg,#eef5c6,#30896f)',land_motion:'linear-gradient(90deg,#4a63a8,#f3efe1,#cb5b3e)'};
    $('legend').innerHTML=`<b>${activeName?layerLabel(activeName,display):info.title} · ${info.units}</b><div class="gradient" style="background:${gradients[activeName]||'linear-gradient(90deg,#133d59,#d8c89a,#6d5139)'}"></div><div class="legend-scale"><span>${info.min}</span><span>${info.kind==='diverging'?'0':''}</span><span>${info.max}</span></div><p class="legend-note">${activeName?layerDescription(activeName,display):''}</p>`;
  }
  else {const title=state.mode==='difference'&&!activeName?'Skillnad mot bara havsnivå':info.title;$('legend').innerHTML=`<div class="legend-row"><i class="swatch" style="background:${info.kind==='coast'?'#fff6db':info.kind==='basin'?'#725982':'#ee7c3f'}"></i>${title}</div>`}
}
function renderFrame(frameOverride=null){
  state.scenario=currentScenario(); state.frame=frameOverride || currentFrame(); state.resultId=frameOverride?.result_id || null;
  const differenceButton=document.querySelector('[data-mode="difference"]');
  differenceButton.disabled=!state.scenario.has_landscape_processes;
  $('comparisonSection').hidden=!state.scenario.has_landscape_processes;
  if(!state.scenario.has_landscape_processes&&state.mode==='difference'){
    state.mode='full';document.querySelectorAll('.segmented button').forEach(button=>button.classList.toggle('active',button.dataset.mode==='full'));
  }
  setText('age',`${fmt.format(state.frame.age_bp)} BP`); setText('scenarioStatus',scenarioUi[state.scenario.id]?.status||state.scenario.status);
  setText('seaLand',`${fmt.format(state.frame.sea_only.land_km2)} km² land`);
  setText('fullLand',`${fmt.format(state.frame.full.land_km2)} km² land`);
  const d=state.frame.delta;setText('deltaStats',`Landskapsprocessernas effekt: land ${signed(d.land_km2)} km² · hav ${signed(d.ocean_km2)} km² · sänkor ${signed(d.basin_km2)} km² · ${fmt.format(state.frame.changed_cells)} ändrade celler`);
  setText('modelResolution',`Modellcell · ${fmt.format(state.scenario.resolution_m)} m · ${state.scenario.source_resolution}`);
  setText('qualityModelCell',`${fmt.format(state.scenario.resolution_m)} × ${fmt.format(state.scenario.resolution_m)} m · EPSG:3035`);
  setText('qualityTerrainSource',state.scenario.source_resolution);
  for(const [key,layer] of state.layers){map.removeLayer(layer)} state.layers.clear();
  renderResult();buildLayerControls();
  const activeProcess=[...availableProcessNames()].reverse().find(name=>state.layerSettings.get(name)?.enabled&&!processDisplay(name).info.empty);
  updateLegend(activeProcess);clearCell();updateCalculationControls();
}
function signed(n){return `${n>=0?'+':'−'}${fmt.format(Math.abs(n))}`}
function normaliseSearch(value){return value.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()}
function localSearch(query){
  const needle=normaliseSearch(query);
  if(!needle)return [];
  return localPlaces.filter(place=>[place.name,...place.aliases].some(name=>normaliseSearch(name).includes(needle))).slice(0,6);
}
function hideSearchResults(){$('searchResults').hidden=true;$('searchResults').replaceChildren();$('goto').setAttribute('aria-expanded','false')}
function showSearchResults(results,{external=false}={}){
  const list=$('searchResults');list.replaceChildren();
  for(const result of results){
    const button=document.createElement('button');button.type='button';button.setAttribute('role','option');
    const title=document.createElement('strong');title.textContent=result.name;
    const meta=document.createElement('small');meta.textContent=result.detail||`${result.lat.toFixed(4)}°, ${result.lon.toFixed(4)}°`;
    button.append(title,meta);button.onclick=()=>goToPlace(result);list.append(button);
  }
  if(external){const attribution=document.createElement('a');attribution.href='https://www.openstreetmap.org/copyright';attribution.target='_blank';attribution.rel='noreferrer';attribution.className='search-attribution';attribution.textContent='Sökdata © OpenStreetMap';list.append(attribution)}
  list.hidden=!results.length;$('goto').setAttribute('aria-expanded',String(results.length>0));
}
function showMapMessage(message){$('aoiMessage').hidden=false;$('aoiMessage').textContent=message}
function goToPlace(place){
  const point=L.latLng(place.lat,place.lon);
  if(state.analysisBounds&&!state.analysisBounds.contains(point)){showMapMessage(`${place.name} ligger utanför nuvarande analystäckning.`);return}
  $('aoiMessage').hidden=true;hideSearchResults();$('goto').value=place.name;
  if(state.searchMarker)map.removeLayer(state.searchMarker);
  state.searchMarker=L.circleMarker(point,{radius:7,color:'#fff',weight:2,fillColor:'#ee7c3f',fillOpacity:1,pane:'markerPane'}).addTo(map).bindTooltip(place.name,{permanent:false,direction:'top'});
  map.flyTo(point,Math.max(map.getZoom(),9));
}
function parseCoordinates(value){
  const parts=value.trim().split(/[,; ]+/).map(Number).filter(Number.isFinite);
  return parts.length>=2&&Math.abs(parts[0])<=90&&Math.abs(parts[1])<=180?{name:`${parts[0].toFixed(5)}°, ${parts[1].toFixed(5)}°`,lat:parts[0],lon:parts[1]}:null;
}
async function geocodePlace(query){
  const cacheKey=`palaeocoast:geocode:${normaliseSearch(query)}`;
  try{const cached=JSON.parse(localStorage.getItem(cacheKey));if(Array.isArray(cached))return cached}catch{}
  if(Date.now()-state.lastGeocodeAt<1000)throw Error('Vänta en sekund innan nästa sökning.');
  state.lastGeocodeAt=Date.now();
  const bounds=state.analysisBounds;
  const params=new URLSearchParams({q:query,format:'jsonv2',limit:'5','accept-language':state.lang});
  if(bounds){params.set('viewbox',`${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}`);params.set('bounded','1')}
  const response=await fetch(`${geocoderEndpoint}?${params}`);
  if(!response.ok)throw Error('Ortsökningen svarar inte just nu.');
  const data=await response.json();
  const results=data.map(item=>({name:item.display_name.split(',')[0],detail:item.display_name,lat:Number(item.lat),lon:Number(item.lon)}));
  try{localStorage.setItem(cacheKey,JSON.stringify(results))}catch{}
  return results;
}
function configureAnalysisBounds(fit=true){
  const raw=state.scenario?.analysis_bounds;
  if(!raw)return;
  state.analysisBounds=L.latLngBounds(raw);
  // getBoundsZoom is itself limited by the current minZoom. Reset it before
  // calculating a new region, otherwise a small previous region leaves Europe
  // stuck at the previous region's much closer zoom level.
  map.setMinZoom(1);
  map.setMaxBounds(state.analysisBounds);
  const regionMinZoom=map.getBoundsZoom(state.analysisBounds,false,[8,8]);
  map.setMinZoom(regionMinZoom);
  if(fit)map.fitBounds(state.analysisBounds,{padding:[8,8],animate:false});
}
function scenariosForRegion(regionId){return state.catalog.scenarios.filter(scenario=>scenario.region_id===regionId)}
function setRegion(regionId,preferredScenario=null,fit=true){
  const scenarios=scenariosForRegion(regionId);
  if(!scenarios.length)return;
  state.regionId=regionId;
  document.querySelectorAll('[data-region]').forEach(button=>button.classList.toggle('active',button.dataset.region===regionId));
  $('scenario').innerHTML=scenarios.map(s=>`<option value="${s.id}">${scenarioUi[s.id]?.name||s.name}</option>`).join('');
  $('scenario').value=scenarios.some(s=>s.id===preferredScenario)?preferredScenario:scenarios[0].id;
  $('time').max=currentScenario().frames.length-1;$('time').value=0;
  state.scenario=currentScenario();configureAnalysisBounds(fit);$('aoiMessage').hidden=true;
}
function populate(){
  const params=new URLSearchParams(location.search), requestedScenario=params.get('scenario');
  const requestedScenarioEntry=state.catalog.scenarios.find(s=>s.id===requestedScenario);
  const requestedRegion=params.get('region')||requestedScenarioEntry?.region_id||'aegean';
  setRegion(requestedRegion,requestedScenario||'spatial_scenario',false);
  $('dataStatus').innerHTML=state.catalog.data_status.map(d=>`<article class="data-card"><b>${d.name}</b><span>${d.status}</span><p>${d.detail}</p></article>`).join('');
  const requested=params.get('compare');
  const requestedAgeValue=params.get('age'), requestedAge=Number(requestedAgeValue);
  if(requestedAgeValue!==null&&Number.isFinite(requestedAge)){
    const ageIndex=currentScenario().frames.findIndex(frame=>frame.age_bp===requestedAge);
    if(ageIndex>=0)$('time').value=ageIndex;
  }
  state.scenario=currentScenario();configureAnalysisBounds(true);
  for(const name of (params.get('layers')||'').split(','))if(processNames.includes(name))state.layerSettings.get(name).enabled=true;
  const viewLat=Number(params.get('lat')),viewLon=Number(params.get('lon')),viewZoom=Number(params.get('zoom'));
  if(params.has('lat')&&params.has('lon')&&params.has('zoom')&&Number.isFinite(viewLat)&&Number.isFinite(viewLon)&&Number.isFinite(viewZoom))map.setView([viewLat,viewLon],Math.min(14,Math.max(map.getMinZoom(),viewZoom)),{animate:false});
  if(['full','sea','difference'].includes(requested)){
    state.mode=requested;
    document.querySelectorAll('.segmented button').forEach(button=>button.classList.toggle('active',button.dataset.mode===requested));
  }
  renderFrame();
}
function clearCell(){$('emptyCell').hidden=false;$('cellDetails').hidden=true}
async function inspectCell(latlng){
  if(!state.api){$('emptyCell').innerHTML='<p>Celluppdelning kräver den lokala Pythonservern. Den statiska kartan visar fortfarande alla färdigberäknade lager.</p>';return}
  const q=new URLSearchParams({scenario:state.scenario.id,age:state.frame.age_bp,lat:latlng.lat,lon:latlng.lng});if(state.resultId)q.set('result',state.resultId);
  const response=await fetch(`/api/cell?${q}`);const data=await response.json();
  if(!response.ok){$('emptyCell').innerHTML=`<p>${data.error}</p>`;return}
  $('emptyCell').hidden=true;$('cellDetails').hidden=false;
  setText('cellCoordinates',`${data.lat.toFixed(5)}°, ${data.lon.toFixed(5)}° · rad ${data.row}, kolumn ${data.column}`);
  setText('todayHeight',`${fmt.format(data.today_m)} m`);setText('upliftValue',`${signed(-data.uplift_since_m)} m`);setText('erosionValue',`${signed(data.erosion_since_m)} m`);setText('depositionValue',`${signed(-data.deposition_since_m)} m`);setText('paleoHeight',`${fmt.format(data.paleo_m)} m`);
  setText('seaSurface',`${fmt.format(data.sea_surface_m)} m`);setText('margin',`${fmt.format(data.margin_m)} m`);setText('cellClass',data.full_class_name+(data.sensitive?' · känslig':''));setText('simpleClass',data.sea_only_class_name);
}
async function calculate(){
  const button=$('calculate');button.disabled=true;setText('calculationStatus','Beräknar och skapar kartlager…');
  const overrides={};
  try{const response=await fetch('/api/compute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario:state.scenario.id,age_bp:state.frame.age_bp,enabled:{uplift:$('enableUplift').checked,erosion:$('enableErosion').checked,deposition:$('enableDeposition').checked},overrides})});const result=await response.json();if(!response.ok)throw Error(result.error);renderFrame({...result,layers:result.layers});state.customDirty=false;button.disabled=true;const effect=result.custom_effect;if(effect?.class_changed_cells)setText('calculationStatus',`Klart · ${fmt.format(effect.class_changed_cells)} celler bytte klass jämfört med standardscenariot; största terrängskillnad ${fmt.format(effect.max_abs_terrain_change_m)} m.`);else if(effect)setText('calculationStatus',`Klart · terrängen ändrades upp till ${fmt.format(effect.max_abs_terrain_change_m)} m, men ingen cell bytte land/hav/sänka vid denna tid.`);else setText('calculationStatus',result.cache_hit?'Klart · identiskt resultat hämtat ur cache.':'Klart · nytt resultat beräknat och cachat.');}
  catch(error){setText('calculationStatus',`Kunde inte beräkna: ${error.message}`)}finally{button.disabled=!state.api||!state.customDirty}
}
function hasCustomAssumptions(){return !$('enableUplift').checked||!$('enableErosion').checked||!$('enableDeposition').checked}
function updateCalculationControls(){
  const present=state.frame?.age_bp===0;
  const hasProcesses=Boolean(state.scenario?.has_landscape_processes);
  $('customCalculation').closest('section').hidden=true;
  for(const id of ['enableUplift','enableErosion','enableDeposition'])$(id).disabled=present;
  $('calculate').disabled=present||!state.api||!state.customDirty;
  if(present)setText('calculationStatus','0 BP är referensläget: kumulativ förändring är 0 m; kartlagren visar i stället scenariots antagna hastigheter.');
  else if(!state.api)setText('calculationStatus','Statisk demo: färdiga resultat fungerar, men egen beräkning kräver Pythonservern.');
  else if(state.customDirty)setText('calculationStatus','Ändrade antaganden är redo att beräknas för vald tid.');
  else setText('calculationStatus','Stäng av en process om du vill göra en avancerad lokal omberäkning.');
}
function markCustomDirty(){state.customDirty=true;updateCalculationControls()}
function refreshCustomState(){if(hasCustomAssumptions()){markCustomDirty();return}state.customDirty=false;if(state.resultId)renderFrame();updateCalculationControls()}
async function detectApi(){try{const r=await fetch('/api/health');state.api=r.ok}catch{}updateCalculationControls()}

$('scenario').onchange=()=>{$('time').max=currentScenario().frames.length-1;$('time').value=0;state.scenario=currentScenario();state.regionId=state.scenario.region_id;configureAnalysisBounds(true);renderFrame();if(hasCustomAssumptions())markCustomDirty()};
$('time').oninput=()=>{renderFrame();if(hasCustomAssumptions())markCustomDirty()};
$('play').onclick=()=>{if(state.timer){clearInterval(state.timer);state.timer=null;$('play').lastElementChild.textContent=t('play');return}state.timer=setInterval(()=>{$('time').value=(+$('time').value+1)%currentScenario().frames.length;renderFrame()},1200);$('play').lastElementChild.textContent=t('pause')};
document.querySelectorAll('.segmented button').forEach(button=>button.onclick=()=>{document.querySelectorAll('.segmented button').forEach(b=>b.classList.remove('active'));button.classList.add('active');state.mode=button.dataset.mode;renderResult();updateLegend()});
$('calculate').onclick=calculate;
for(const id of ['enableUplift','enableErosion','enableDeposition'])$(id).addEventListener('input',refreshCustomState);
map.on('mousemove',e=>setText('cursorCoordinates',`${e.latlng.lat.toFixed(5)}°, ${e.latlng.lng.toFixed(5)}° · WGS84`));
map.on('zoomend',refreshMotionSymbols);
map.on('click',e=>inspectCell(e.latlng));
document.querySelectorAll('[data-region]').forEach(button=>button.onclick=()=>{
  const region=button.dataset.region;
  const preferred={aegean:'spatial_scenario',europe:'europe_overview',doggerland:'doggerland_overview'}[region];
  setRegion(region,preferred,true);renderFrame();
});
$('goto').oninput=()=>showSearchResults(localSearch($('goto').value));
$('goto').onkeydown=e=>{if(e.key==='Escape')hideSearchResults()};
$('gotoForm').onsubmit=async e=>{
  e.preventDefault();const query=$('goto').value.trim();if(!query)return;
  const coordinates=parseCoordinates(query);if(coordinates){goToPlace(coordinates);return}
  const local=localSearch(query);if(local.length&&(local.length===1||normaliseSearch(local[0].name)===normaliseSearch(query))){goToPlace(local[0]);return}
  showMapMessage('Söker efter plats…');
  try{const results=await geocodePlace(query);$('aoiMessage').hidden=true;if(!results.length){showMapMessage('Ingen plats hittades inom det valda analysområdet.');hideSearchResults();return}showSearchResults(results,{external:true})}
  catch(error){showMapMessage(error.message)}
};
document.addEventListener('pointerdown',event=>{if(!$('gotoForm').contains(event.target))hideSearchResults()});
$('methodButton').onclick=()=>$('methodDialog').showModal();$('closeMethod').onclick=()=>$('methodDialog').close();
$('language').onclick=()=>{state.lang=state.lang==='sv'?'en':'sv';$('language').textContent=state.lang==='sv'?'EN':'SV';document.documentElement.lang=state.lang;$('goto').placeholder=state.lang==='sv'?'Sök ort eller lat, lon':'Search place or lat, lon';document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;el.textContent=state.lang==='sv'?el.dataset.sv:(translations.en[key]||el.dataset.sv)})};

fetch('data/catalog.json').then(r=>r.json()).then(catalog=>{state.catalog=catalog;populate();detectApi()}).catch(error=>{document.body.innerHTML=`<main style="padding:3rem"><h1>PalaeoCoast kunde inte starta</h1><p>${error.message}</p><p>Kör <code>python web_server.py</code> och öppna den angivna adressen.</p></main>`});
