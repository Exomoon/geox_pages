const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('sv-SE', {maximumFractionDigits: 1});
const state = {catalog:null, scenario:null, frame:null, mode:'full', layers:new Map(), layerSettings:new Map(), resultId:null, timer:null, api:false, customDirty:false, lang:'sv', analysisBounds:null};

const translations = {
  en: {scenarioPlatform:'Geospatial scenario platform',methodSources:'Method & sources',headline:'Read coastal change layer by layer.',intro:'Compare sea-level change alone with a scenario where land motion, erosion and deposition also reshape terrain.',overview:'Overview planned',aegean:'Aegean Sea',ready:'Analysis data',nextRegion:'Next region',timeScenario:'Time & scenario',scenario:'Scenario',selectedTime:'Selected time',older:'Older',play:'Play timeline',pause:'Pause',comparison:'Map view',reconstruction:'Reconstruction',comparisonHelp:'The reconstruction updates directly with time. Difference shows only where land motion, erosion or deposition changes the class compared with the same sea level on present terrain.',full:'Landscape',seaOnly:'Sea level',swipe:'Swipe',difference:'Difference from sea level only',seaModel:'Control · sea level only',fullModel:'Reconstruction · all processes',processLayers:'Process layers',processTimeNote:'Shows change after the selected older time up to 0 BP (1950). The process value is therefore zero at 0 BP.',recalculate:'Advanced: recalculate model',recalcHint:'This changes model assumptions, not layer visibility. Disable a process and recalculate the selected time locally.',rateWarning:'Demo rates are synthetic and regionally generalised—not measured erosion or sedimentation rates.',landMotion:'Land motion',erosion:'Erosion',deposition:'Deposition',calculate:'Recalculate selected time',cellAnalysis:'Cell analysis',clickPrompt:'Click inside the Aegean model area to inspect a calculated cell.',todayTerrain:'Present terrain',laterUplift:'− later uplift / + later subsidence',laterErosion:'+ later erosion',laterDeposition:'− later deposition',reconstructedTerrain:'= reconstructed past terrain',seaSurface:'Selected sea surface',heightMargin:'Elevation margin',computedClass:'Calculated class',simpleClass:'Sea-only class',legend:'Legend',resolutionQuality:'Resolution & quality',basemapDetail:'Basemap',modelCell:'Model cell',terrainSource:'Terrain source',resolutionWarning:'Zoom enlarges cells but creates no new terrain information.',fitRegion:'Zoom to analysis coverage',drawAoi:'Draw analysis area',gotoCoordinates:'Go to coordinates',methodTitle:'What the model shows — and does not show',methodIntro:'The model reconstructs geometric elevation scenarios. It does not date settlements or model physical sediment transport, waves or ice-free conditions.',verifiedCandidates:'Verified candidates for local refinement',datumWarning:'These sources must not be merged without documented vertical-datum harmonisation. Finer resampling is not greater real accuracy.'},
  sv: {}
};
document.querySelectorAll('[data-i18n]').forEach(el => el.dataset.sv = el.textContent);

const map = L.map('map', {zoomControl:false, minZoom:3, worldCopyJump:false, maxBoundsViscosity:1}).setView([37.6,25.4],6);
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
  baseline:{name:'Kontroll · bara havsnivå',status:'KONTROLL: dagens terräng och illustrativ havsnivå. Ingen separat landrörelse, erosion eller sedimentpålagring.'},
  spatial_scenario:{name:'Test · havsnivå + landskapsprocesser',status:'HYPOTETISKT TEST: syntetisk landrörelse, erosion och sedimentpålagring – inte mätningar.'}
};

function removeResultLayers(){
  for(const key of ['state_full','state_sea','class_difference']){
    const layer=state.layers.get(key); if(layer){map.removeLayer(layer);state.layers.delete(key)}
  }
}
function addImage(key, info, pane='process', opacity=.8){
  const old=state.layers.get(key); if(old) map.removeLayer(old);
  const layer=L.imageOverlay(info.url, info.bounds, {pane,opacity,interactive:false,crossOrigin:false,className:'model-raster'}).addTo(map);
  layer.on('load',()=>{if(state.mode==='swipe')applySwipe()});
  state.layers.set(key,layer); return layer;
}
function applySwipe(){
  const pct=+$('swipe').value;
  $('swipeDivider').style.left=`${pct}%`;
  const a=state.layers.get('state_sea')?.getElement(), b=state.layers.get('state_full')?.getElement();
  const mapRect=map.getContainer().getBoundingClientRect();
  const splitX=mapRect.left+mapRect.width*pct/100;
  for(const [element,leftSide] of [[a,true],[b,false]]){
    if(!element)continue;
    const rect=element.getBoundingClientRect();
    if(!rect.width)continue;
    const cut=Math.max(0,Math.min(100,(splitX-rect.left)/rect.width*100));
    element.style.clipPath=leftSide?`inset(0 ${100-cut}% 0 0)`:`inset(0 0 0 ${cut}%)`;
  }
}
function renderResult(){
  const frame=state.frame;
  removeResultLayers();
  $('swipeControl').hidden=state.mode!=='swipe'; $('swipeDivider').hidden=state.mode!=='swipe';
  if(state.mode==='full') addImage('state_full',frame.layers.state_full,'resultB',.9);
  if(state.mode==='sea') addImage('state_sea',frame.layers.state_sea,'resultA',.9);
  if(state.mode==='difference'){
    addImage('state_full',frame.layers.state_full,'resultB',.48);
    if(frame.changed_cells>0)addImage('class_difference',frame.layers.class_difference,'process',.98);
  }
  if(state.mode==='swipe'){
    addImage('state_sea',frame.layers.state_sea,'resultA',.9);
    addImage('state_full',frame.layers.state_full,'resultB',.9);
    requestAnimationFrame(applySwipe);
  }
}
const processLabels={land_motion:'Landrörelse efter vald tid → 1950',erosion:'Erosion efter vald tid → 1950',deposition:'Sedimentpålagring efter vald tid → 1950'};
function layerLabel(name){return processLabels[name]||state.frame.layers[name]?.title||name}
const processNames=['coastline','sensitivity','basins','land_motion','erosion','deposition'];
const layerDescriptions={
  coastline:'Gränsen mellan beräknat land och hav med havskontakt.',
  sensitivity:'Celler vars klass kan ändras inom modellens illustrativa höjdmarginal.',
  basins:'Terräng under havsytan utan beräknad kontakt med öppet hav.',
  land_motion:'Kumulativ rörelse från vald äldre tid till 1950: blått är sänkning, rött är höjning.',
  erosion:'Kumulativ angiven höjd som eroderats bort efter vald äldre tid.',
  deposition:'Kumulativ angiven sedimenthöjd som lagrats efter vald äldre tid.'
};
for(const name of processNames)state.layerSettings.set(name,{enabled:name==='coastline',opacity:name==='coastline'?1:.78});
function buildLayerControls(){
  $('layerControls').innerHTML='';
  for(const name of processNames){
    const settings=state.layerSettings.get(name);
    const info=state.frame.layers[name];
    const row=document.createElement('div');row.className=`layer-row${info.empty?' is-empty':''}`;row.title=layerDescriptions[name]||'';
    const available=!info.empty;
    row.innerHTML=`<input type="checkbox" data-layer="${name}" ${settings.enabled?'checked':''}><label>${layerLabel(name)}</label><input type="range" min="0" max="100" value="${Math.round(settings.opacity*100)}" aria-label="Transparens" title="Opacitet ${Math.round(settings.opacity*100)} %">`;
    const toggle=row.children[0], opacity=row.children[2];
    toggle.onchange=()=>{settings.enabled=toggle.checked;toggleProcess(name,settings.enabled&&available,settings.opacity)};
    opacity.oninput=()=>{settings.opacity=+opacity.value/100;opacity.title=`Opacitet ${opacity.value} %`;const layer=state.layers.get(name);if(layer)layer.setOpacity(settings.opacity)};
    $('layerControls').append(row);
    if(settings.enabled&&available)toggleProcess(name,true,settings.opacity);
  }
}
function toggleProcess(name,on,opacity){
  const old=state.layers.get(name);if(old){map.removeLayer(old);state.layers.delete(name)}
  if(on)addImage(name,state.frame.layers[name],'process',opacity);
  updateLegend(name,on);
}
function updateLegend(activeName){
  const info=state.frame.layers[activeName] || state.frame.layers[state.mode==='difference'?'class_difference':state.mode==='sea'?'state_sea':'state_full'];
  if(!activeName&&state.mode==='difference'&&state.frame.changed_cells===0){
    const baseline=state.scenario.id==='baseline';
    $('legend').innerHTML=baseline?'<b>Ingen processkillnad</b><p class="hint">Kontrollen innehåller inga separata landskapsprocesser, oavsett vald tid.</p>':'<b>Ingen skillnad vid 0 BP</b><p class="hint">De kumulativa landskapsprocesserna är noll i referensläget.</p>';return
  }
  if(info.empty){$('legend').innerHTML=`<b>${activeName?layerLabel(activeName):info.title} · ${info.units}</b><p class="hint">0 m: det finns inget senare tidsintervall från 0 BP till referensläget.</p>`;return}
  if(info.kind==='state') $('legend').innerHTML=`<div class="legend-row"><i class="swatch" style="background:#d3c091"></i>Land</div><div class="legend-row"><i class="swatch" style="background:#155870"></i>Hav med kontakt</div><div class="legend-row"><i class="swatch" style="background:#725982"></i>Sluten sänka</div>`;
  else if(['diverging','positive','terrain'].includes(info.kind)){
    const gradients={erosion:'linear-gradient(90deg,#fff4d5,#d04d2e)',deposition:'linear-gradient(90deg,#eef5c6,#30896f)',land_motion:'linear-gradient(90deg,#4a63a8,#f3efe1,#cb5b3e)'};
    $('legend').innerHTML=`<b>${activeName?layerLabel(activeName):info.title} · ${info.units}</b><div class="gradient" style="background:${gradients[activeName]||'linear-gradient(90deg,#133d59,#d8c89a,#6d5139)'}"></div><div class="legend-scale"><span>${info.min}</span><span>${info.kind==='diverging'?'0':''}</span><span>${info.max}</span></div><p class="legend-note">${layerDescriptions[activeName]||''}</p>`;
  }
  else {const title=state.mode==='difference'&&!activeName?'Skillnad mot bara havsnivå':info.title;$('legend').innerHTML=`<div class="legend-row"><i class="swatch" style="background:${info.kind==='coast'?'#fff6db':info.kind==='basin'?'#725982':'#ee7c3f'}"></i>${title}</div>`}
}
function renderFrame(frameOverride=null){
  state.scenario=currentScenario(); state.frame=frameOverride || currentFrame(); state.resultId=frameOverride?.result_id || null;
  setText('age',`${fmt.format(state.frame.age_bp)} BP`); setText('scenarioStatus',scenarioUi[state.scenario.id]?.status||state.scenario.status);
  setText('seaLand',`${fmt.format(state.frame.sea_only.land_km2)} km² land`);
  setText('fullLand',`${fmt.format(state.frame.full.land_km2)} km² land`);
  const d=state.frame.delta;setText('deltaStats',`Landskapsprocessernas effekt: land ${signed(d.land_km2)} km² · hav ${signed(d.ocean_km2)} km² · sänkor ${signed(d.basin_km2)} km² · ${fmt.format(state.frame.changed_cells)} ändrade celler`);
  setText('modelResolution',`Modellcell · ${state.scenario.resolution_m} m · källa ≈740 × 925 m`);
  for(const [key,layer] of state.layers){map.removeLayer(layer)} state.layers.clear();
  renderResult();buildLayerControls();updateLegend();clearCell();updateCalculationControls();
}
function signed(n){return `${n>=0?'+':'−'}${fmt.format(Math.abs(n))}`}
function configureAnalysisBounds(fit=true){
  const raw=state.scenario?.analysis_bounds;
  if(!raw)return;
  state.analysisBounds=L.latLngBounds(raw);
  map.setMaxBounds(state.analysisBounds.pad(.08));
  map.setMinZoom(map.getBoundsZoom(state.analysisBounds,false));
  if(fit)map.fitBounds(state.analysisBounds,{padding:[18,18],animate:false});
}
function populate(){
  $('scenario').innerHTML=state.catalog.scenarios.map(s=>`<option value="${s.id}">${scenarioUi[s.id]?.name||s.name}</option>`).join('');
  const params=new URLSearchParams(location.search), requestedScenario=params.get('scenario');
  $('scenario').value=state.catalog.scenarios.some(s=>s.id===requestedScenario)?requestedScenario:'spatial_scenario'; $('time').max=currentScenario().frames.length-1;
  $('dataStatus').innerHTML=state.catalog.data_status.map(d=>`<article class="data-card"><b>${d.name}</b><span>${d.status}</span><p>${d.detail}</p></article>`).join('');
  const requested=params.get('compare');
  const requestedAgeValue=params.get('age'), requestedAge=Number(requestedAgeValue);
  if(requestedAgeValue!==null&&Number.isFinite(requestedAge)){
    const ageIndex=currentScenario().frames.findIndex(frame=>frame.age_bp===requestedAge);
    if(ageIndex>=0)$('time').value=ageIndex;
  }
  state.scenario=currentScenario();configureAnalysisBounds(true);
  const viewLat=Number(params.get('lat')),viewLon=Number(params.get('lon')),viewZoom=Number(params.get('zoom'));
  if(params.has('lat')&&params.has('lon')&&params.has('zoom')&&Number.isFinite(viewLat)&&Number.isFinite(viewLon)&&Number.isFinite(viewZoom))map.setView([viewLat,viewLon],Math.min(14,Math.max(map.getMinZoom(),viewZoom)),{animate:false});
  if(['full','sea','swipe','difference'].includes(requested)){
    state.mode=requested;
    document.querySelectorAll('.segmented button').forEach(button=>button.classList.toggle('active',button.dataset.mode===requested));
  }
  const split=Number(params.get('split'));if(Number.isFinite(split)&&split>=0&&split<=100)$('swipe').value=split;
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
  const hasProcesses=state.scenario?.id!=='baseline';
  $('customCalculation').closest('section').hidden=!state.api||!hasProcesses;
  for(const id of ['enableUplift','enableErosion','enableDeposition'])$(id).disabled=present;
  $('calculate').disabled=present||!state.api||!state.customDirty;
  if(present)setText('calculationStatus','0 BP är referensläget: kumulativa processer är noll och behöver inte räknas om.');
  else if(!state.api)setText('calculationStatus','Statisk demo: färdiga resultat fungerar, men egen beräkning kräver Pythonservern.');
  else if(state.customDirty)setText('calculationStatus','Ändrade antaganden är redo att beräknas för vald tid.');
  else setText('calculationStatus','Stäng av en process om du vill göra en avancerad lokal omberäkning.');
}
function markCustomDirty(){state.customDirty=true;updateCalculationControls()}
function refreshCustomState(){if(hasCustomAssumptions()){markCustomDirty();return}state.customDirty=false;if(state.resultId)renderFrame();updateCalculationControls()}
async function detectApi(){try{const r=await fetch('/api/health');state.api=r.ok}catch{}updateCalculationControls()}

$('scenario').onchange=()=>{$('time').max=currentScenario().frames.length-1;$('time').value=0;state.scenario=currentScenario();configureAnalysisBounds(true);renderFrame();if(hasCustomAssumptions())markCustomDirty()};
$('time').oninput=()=>{renderFrame();if(hasCustomAssumptions())markCustomDirty()};
$('play').onclick=()=>{if(state.timer){clearInterval(state.timer);state.timer=null;$('play').lastElementChild.textContent=t('play');return}state.timer=setInterval(()=>{$('time').value=(+$('time').value+1)%currentScenario().frames.length;renderFrame()},1200);$('play').lastElementChild.textContent=t('pause')};
document.querySelectorAll('.segmented button').forEach(button=>button.onclick=()=>{document.querySelectorAll('.segmented button').forEach(b=>b.classList.remove('active'));button.classList.add('active');state.mode=button.dataset.mode;renderResult();updateLegend()});
$('swipe').oninput=applySwipe;$('calculate').onclick=calculate;
for(const id of ['enableUplift','enableErosion','enableDeposition'])$(id).addEventListener('input',refreshCustomState);
map.on('mousemove',e=>setText('cursorCoordinates',`${e.latlng.lat.toFixed(5)}°, ${e.latlng.lng.toFixed(5)}° · WGS84`));
map.on('move zoom resize',()=>{if(state.mode==='swipe')requestAnimationFrame(applySwipe)});
map.on('click',e=>inspectCell(e.latlng));
document.querySelectorAll('[data-region]').forEach(button=>button.onclick=()=>{
  const region=button.dataset.region;
  if(region==='aegean'){
    document.querySelectorAll('[data-region]').forEach(b=>b.classList.toggle('active',b===button));
    $('aoiMessage').hidden=true;configureAnalysisBounds(true);return;
  }
  $('aoiMessage').hidden=false;
  $('aoiMessage').textContent=region==='europe'?'Europaöversikten är planerad men saknar ännu analysdata. Kartan är begränsad till Egeiska modellens täckning.':'Doggerland är nästa fördjupningsområde och saknar ännu analysdata.';
});
$('fitRegion').onclick=()=>{if(state.analysisBounds)map.fitBounds(state.analysisBounds,{padding:[18,18]})};
$('gotoForm').onsubmit=e=>{e.preventDefault();const parts=$('goto').value.split(/[,; ]+/).map(Number).filter(Number.isFinite);if(parts.length<2)return;const point=L.latLng(parts[0],parts[1]);if(state.analysisBounds&&!state.analysisBounds.contains(point)){$('aoiMessage').hidden=false;$('aoiMessage').textContent='Koordinaten ligger utanför nuvarande analystäckning (Egeiska havet).';return}$('aoiMessage').hidden=true;map.flyTo(point,Math.max(map.getZoom(),9))};
$('methodButton').onclick=()=>$('methodDialog').showModal();$('closeMethod').onclick=()=>$('methodDialog').close();
$('language').onclick=()=>{state.lang=state.lang==='sv'?'en':'sv';$('language').textContent=state.lang==='sv'?'EN':'SV';document.documentElement.lang=state.lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;el.textContent=state.lang==='sv'?el.dataset.sv:(translations.en[key]||el.dataset.sv)})};

fetch('data/catalog.json').then(r=>r.json()).then(catalog=>{state.catalog=catalog;populate();detectApi()}).catch(error=>{document.body.innerHTML=`<main style="padding:3rem"><h1>PalaeoCoast kunde inte starta</h1><p>${error.message}</p><p>Kör <code>python web_server.py</code> och öppna den angivna adressen.</p></main>`});
