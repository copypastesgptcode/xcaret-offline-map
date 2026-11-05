'use strict';
/* Xcaret Map — offline PWA. Leaflet + bundled GeoJSON, no tile server. */

const CATS = {
  food:      {label:'Food',        ic:'🍴', color:'var(--c-food)'},
  bar:       {label:'Bars',        ic:'🍸', color:'var(--c-bar)'},
  pool:      {label:'Pools',       ic:'🏊', color:'var(--c-pool)'},
  restroom:  {label:'Restrooms',   ic:'🚻', color:'var(--c-restroom)'},
  towel:     {label:'Towels',      ic:'🧺', color:'var(--c-towel)'},
  locker:    {label:'Lockers',     ic:'🔒', color:'var(--c-locker)'},
  show:      {label:'Shows',       ic:'🎭', color:'var(--c-show)'},
  transport: {label:'Transport',   ic:'🚐', color:'var(--c-transport)'},
  attraction:{label:'Attractions', ic:'⭐', color:'var(--c-attraction)'},
  casa:      {label:'Casas',       ic:'🏠', color:'var(--c-casa)'},
  service:   {label:'Services',    ic:'ℹ️', color:'var(--c-service)'},
};
const CAT_ORDER = ['food','bar','pool','restroom','towel','locker','show','transport','attraction','casa','service'];

const EDIT_KEY = 'xcaret_edits_v1';
const THEME_KEY = 'xcaret_theme';
const THEMES = ['light','dark','sun'];

const state = {
  data:null, basemap:null, area:'arte',
  active:new Set(CAT_ORDER),
  openNow:false, q:'',
  selected:null,     // venue id
  navTarget:null,    // venue id for "point me there"
  edits:loadEdits(),
  pos:null, heading:null, watchId:null, editing:false,
};

let map, baseLayer, pathLayer, pinLayer, navLine, userMarker, userCone;

/* ---------------- storage ---------------- */
function loadEdits(){ try{ return JSON.parse(localStorage.getItem(EDIT_KEY)||'{}'); }catch(e){ return {}; } }
function saveEdits(){ try{ localStorage.setItem(EDIT_KEY, JSON.stringify(state.edits)); }catch(e){} }
function getTheme(){ try{ return localStorage.getItem(THEME_KEY)||'light'; }catch(e){ return 'light'; } }
function setTheme(t){ document.documentElement.dataset.theme=t; try{ localStorage.setItem(THEME_KEY,t);}catch(e){}
  const m=document.querySelector('meta[name=theme-color]'); if(m) m.content = t==='dark'?'#0f1718':'#1E2A2B'; }

/* merge a venue with any local edits */
function venueView(v){
  const e = state.edits[v.id];
  if(!e) return v;
  return Object.assign({}, v, e);
}
function allVenues(){ return state.data.venues.map(venueView); }

/* ---------------- time / status ---------------- */
function toMin(hhmm){ const [h,m]=hhmm.split(':').map(Number); return h*60+m; }
function statusOf(v, now){
  now = now||new Date();
  if((v.closed_days||[]).includes(now.getDay())) return {s:'closed', why:'Closed today'};
  if(!v.hours || !v.hours.length) return {s:'open', why:'No set hours'};
  const mins = now.getHours()*60+now.getMinutes();
  for(const w of v.hours){
    const o=toMin(w.open), c=toMin(w.close);
    const inside = c>o ? (mins>=o && mins<c) : (mins>=o || mins<c); // handle past-midnight
    if(inside) return {s:'open', why:w.label};
  }
  // find next opening today
  return {s:'closed', why:''};
}

/* ---------------- geo ---------------- */
function haversine(a,b){
  const R=6371000, toR=x=>x*Math.PI/180;
  const dLat=toR(b[0]-a[0]), dLon=toR(b[1]-a[1]);
  const la1=toR(a[0]), la2=toR(b[0]);
  const h=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function bearing(a,b){
  const toR=x=>x*Math.PI/180, toD=x=>x*180/Math.PI;
  const dLon=toR(b[1]-a[1]), la1=toR(a[0]), la2=toR(b[0]);
  const y=Math.sin(dLon)*Math.cos(la2);
  const x=Math.cos(la1)*Math.sin(la2)-Math.sin(la1)*Math.cos(la2)*Math.cos(dLon);
  return (toD(Math.atan2(y,x))+360)%360;
}
function fmtDist(m){ return m<1000 ? Math.round(m)+' m' : (m/1000).toFixed(m<10000?1:0)+' km'; }

/* ---------------- map / basemap ---------------- */
const STYLE = {
  sea:      {fill:'--water', line:'--water', w:0, fo:1},
  water:    {fill:'--water', line:'--water-deep', w:1, fo:1},
  pool:     {fill:'--pool', line:'--water-deep', w:1, fo:1},
  waterway: {line:'--water-deep', w:3, fo:0},
  beach:    {fill:'--sand', line:'--sand-line', w:1, fo:1},
  veg:      {fill:'--jungle-deep', line:'--jungle-deep', w:0, fo:.55},
  building: {fill:'--building', line:'--building-line', w:1, fo:1},
  roof:     {fill:'--building-line', line:'--building-line', w:0, fo:.9},
  parking:  {fill:'--card-2', line:'--building-line', w:1, fo:.7},
  pitch:    {fill:'--jungle', line:'--jungle-deep', w:1, fo:.5},
  path:     {line:'--sand-line', w:3.5, fo:0, dash:null},
  service:  {line:'--sand-line', w:2, fo:0, dash:'1 5'},
  coastline:{line:'--water-deep', w:2, fo:0},
  wall:     {line:'--building-line', w:1.5, fo:0},
};
const CSS_FALLBACK = {
  '--path':'#FBF2DC','--path-casing':'#A98B55','--water':'#59C7D6','--water-deep':'#2FA8C0',
  '--pool':'#6FD3E0','--sand':'#E9DCC4','--sand-line':'#d8c7a6','--jungle':'#7FB27A',
  '--jungle-deep':'#5E9E67','--building':'#efe9df','--building-line':'#d8cdba','--ink':'#1E2A2B',
  '--card-2':'#f4f6f5','--line':'#e4e8e7'
};
// Never return empty (which would make Leaflet default to black/invisible) if a CSS var is missing.
function cssv(name){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || CSS_FALLBACK[name] || '#8a8a8a';
}
function styleFor(cls){
  const s = STYLE[cls] || {line:'--line', w:1, fo:0};
  const st = {weight:s.w, opacity:.9};
  if(s.fo){ st.fill=true; st.fillColor=cssv(s.fill); st.fillOpacity=s.fo; st.color=cssv(s.line||s.fill); }
  else { st.fill=false; st.color=cssv(s.line); }
  if(s.dash) st.dashArray=s.dash;
  if(s.w===0) st.stroke=false;
  return st;
}
function isPath(cls){ return cls==='path' || cls==='service'; }
function pathStyle(cls, which){
  const svc = cls==='service';
  if(which==='casing')
    return {color:cssv('--path-casing'), weight:svc?5:6.5, opacity:.95, lineCap:'round', lineJoin:'round', fill:false};
  return {color:cssv('--path'), weight:svc?2.5:3.6, opacity:1, lineCap:'round', lineJoin:'round', fill:false,
          dashArray: svc?'1 7':null};
}
function renderBasemap(){
  if(baseLayer) baseLayer.remove();
  if(pathLayer) pathLayer.remove();
  const feats = state.basemap.features.filter(f=> f.properties.area===state.area || f.properties.area==='other');
  const paths = feats.filter(f=> isPath(f.properties.cls));
  const rest  = feats.filter(f=> !isPath(f.properties.cls));
  const R = L.svg({padding:1});
  baseLayer = L.geoJSON({type:'FeatureCollection',features:rest}, {
    style:f=>styleFor(f.properties.cls), interactive:false, renderer:R,
  }).addTo(map);
  // Walkways: a dark casing pass, then a bright fill pass on top — crisp and readable.
  pathLayer = L.layerGroup().addTo(map);
  pathLayer.addLayer(L.geoJSON({type:'FeatureCollection',features:paths}, {
    style:f=>pathStyle(f.properties.cls,'casing'), interactive:false, renderer:R }));
  pathLayer.addLayer(L.geoJSON({type:'FeatureCollection',features:paths}, {
    style:f=>pathStyle(f.properties.cls,'top'), interactive:false, renderer:R }));
  baseLayer.bringToBack();
}

/* ---------------- pins ---------------- */
function pinIcon(v, sel){
  const st = statusOf(v);
  const closed = st.s==='closed';
  const c = CATS[v.cat] || CATS.service;
  const lvl = v.level ? `<div class="lvl">${esc(v.level)}</div>` : '';
  const html = `<div class="pin ${closed?'closed':''} ${sel?'sel':''}" style="background:${c.color}">`
             + `<span>${c.ic}</span>${lvl}</div>`;
  return L.divIcon({html, className:'', iconSize:[34,34], iconAnchor:[8,30], tooltipAnchor:[12,-12]});
}
function visibleVenues(){
  const q = state.q.trim().toLowerCase();
  return allVenues().filter(v=>{
    if(v.area!==state.area) return false;
    if(!state.active.has(v.cat)) return false;
    if(state.openNow && statusOf(v).s!=='open') return false;
    if(q && !((v.name_en||'').toLowerCase().includes(q) || (v.name_es||'').toLowerCase().includes(q))) return false;
    return true;
  });
}
function renderPins(){
  if(pinLayer) pinLayer.remove();
  pinLayer = L.layerGroup().addTo(map);
  for(const v of visibleVenues()){
    const sel = v.id===state.selected;
    const m = L.marker([v.lat,v.lon], {icon:pinIcon(v,sel), draggable:false, keyboard:false, riseOnHover:true});
    m._vid = v.id;
    m.bindTooltip(v.name_en, {permanent:true, direction:'right', className:'pinlabel', offset:[10,-10]});
    m.on('click', ()=> selectVenue(v.id, true));
    m.on('dragend', ev=>{
      const ll=ev.target.getLatLng();
      state.edits[v.id] = Object.assign({}, state.edits[v.id], {lat:+ll.lat.toFixed(6), lon:+ll.lng.toFixed(6)});
      saveEdits(); toast('Pin moved & saved'); if(state.selected===v.id) openSheet(v.id);
    });
    pinLayer.addLayer(m);
    if(state.editing && sel) m.dragging && m.dragging.enable();
  }
  updateNavLine();
}
function markerFor(id){ let r=null; if(pinLayer) pinLayer.eachLayer(l=>{ if(l._vid===id) r=l; }); return r; }

/* ---------------- selection + sheet ---------------- */
function selectVenue(id, pan){
  state.selected = id; state.editing=false;
  renderPins();
  const v = venueView(state.data.venues.find(x=>x.id===id));
  if(pan && v){ map.panTo([v.lat,v.lon], {animate:true}); }
  openSheet(id);
}
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function statusBadge(v){
  const st = statusOf(v);
  if(st.s==='open') return `<span class="badge open">● Open${st.why?' · '+esc(st.why):''}</span>`;
  return `<span class="badge closed">● Closed${st.why?' · '+esc(st.why):''}</span>`;
}
function confFlag(v){
  if(v.conf==='verified') return '';
  const txt = v.conf==='approx' ? 'Approximate — verify on arrival' : 'Unverified — check on arrival';
  return `<div class="flagline"><span class="flag">⚑ ${txt}</span></div>`;
}
function hoursHtml(v){
  if(!v.hours || !v.hours.length){
    return `<div class="notes">No set hours on file.</div>`;
  }
  return `<ul class="hours">` + v.hours.map(w=>
    `<li><span class="lab">${esc(w.label)}</span><span>${esc(w.open)} – ${esc(w.close)}</span></li>`).join('') + `</ul>`;
}
function distHtml(v){
  if(!state.pos) return '';
  const m = haversine([state.pos[0],state.pos[1]],[v.lat,v.lon]);
  let a = bearing([state.pos[0],state.pos[1]],[v.lat,v.lon]);
  if(state.heading!=null) a = a - state.heading;
  return `<div class="badge">↕ ${fmtDist(m)} <span class="arrow" style="transform:rotate(${a}deg)">↑</span></div>`;
}
function openSheet(id){
  const v = venueView(state.data.venues.find(x=>x.id===id));
  if(!v) return;
  const c = CATS[v.cat]||CATS.service;
  const sheet=document.getElementById('sheet'), body=document.getElementById('sheetbody');
  const levelBadge = v.level ? `<span class="badge lvl">${esc(v.level)}</span>` : '';
  const casaBadge = v.casa ? `<span class="badge">🏠 ${esc(v.casa)}</span>` : '';
  const sur = v.surcharge ? `<span class="badge">＄ Extra charge</span>` : '';
  body.innerHTML = `
    <h2>${c.ic} ${esc(v.name_en)}</h2>
    <p class="es">${esc(v.name_es||'')} · ${esc(c.label)}${v.notes&&/México side/.test(v.notes)?' · Hotel México side':''}</p>
    <div class="badges">${statusBadge(v)} ${levelBadge} ${casaBadge} ${sur} ${distHtml(v)}</div>
    ${hoursHtml(v)}
    ${confFlag(v)}
    ${v.notes?`<div class="notes">${esc(v.notes)}</div>`:''}
    <div class="sheetbtns">
      <button class="btn primary" id="navBtn">➤ Point me there</button>
      <button class="btn ghost" id="editBtn">✎ Edit pin</button>
    </div>
    <div id="editArea"></div>`;
  sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false');
  document.getElementById('navBtn').onclick=()=>{ state.navTarget=id; updateNavLine(); toast('Showing direction & distance'); openSheet(id); if(state.pos) fitUserAnd(v); };
  document.getElementById('editBtn').onclick=()=>toggleEdit(id);
  if(state.editing) renderEditForm(id);
  if(state.navTarget===id && state.pos){
    const extra=document.createElement('div'); extra.className='flagline';
    const m=haversine(state.pos,[v.lat,v.lon]);
    extra.innerHTML=`Straight-line distance: <b>${fmtDist(m)}</b> (not walking directions).`;
    body.querySelector('.badges').after(extra);
  }
}
function closeSheet(){ const s=document.getElementById('sheet'); s.classList.remove('open'); s.setAttribute('aria-hidden','true'); state.selected=null; state.editing=false; renderPins(); }

/* ---------------- edit ---------------- */
function toggleEdit(id){
  state.editing=!state.editing;
  const m=markerFor(id);
  if(m && m.dragging){ state.editing? m.dragging.enable() : m.dragging.disable(); }
  if(state.editing) toast('Drag the pin to move it');
  openSheet(id);
}
function renderEditForm(id){
  const v = venueView(state.data.venues.find(x=>x.id===id));
  const host=document.getElementById('editArea');
  const rows=(v.hours||[]).map((w,i)=>`
    <div class="hrow" data-i="${i}">
      <input class="lab" value="${esc(w.label)}" placeholder="Label">
      <input class="t" value="${esc(w.open)}" placeholder="07:00" inputmode="numeric">
      <input class="t" value="${esc(w.close)}" placeholder="22:00" inputmode="numeric">
      <button data-del="${i}" aria-label="Remove">×</button>
    </div>`).join('');
  host.innerHTML=`<div class="edit">
    <label>Floor level badge (e.g. L1, L3, L5)</label>
    <input id="ed-level" value="${esc(v.level||'')}" placeholder="e.g. L3">
    <label>Hours (24h). Drag the pin on the map to fix its position.</label>
    <div class="hoursedit" id="ed-hours">${rows}</div>
    <button class="addrow" id="ed-add">+ Add a time window</button>
    <div class="sheetbtns" style="margin-top:12px">
      <button class="btn primary" id="ed-save">Save</button>
      <button class="btn ghost" id="ed-reset">Reset to default</button>
    </div>
    <div class="hint">Edits are saved on this device only.</div>
  </div>`;
  host.querySelector('#ed-add').onclick=()=>{
    const d=document.createElement('div'); d.className='hrow';
    d.innerHTML=`<input class="lab" placeholder="Label"><input class="t" placeholder="07:00"><input class="t" placeholder="22:00"><button aria-label="Remove">×</button>`;
    d.querySelector('button').onclick=()=>d.remove();
    host.querySelector('#ed-hours').appendChild(d);
  };
  host.querySelectorAll('[data-del]').forEach(b=> b.onclick=()=> b.closest('.hrow').remove());
  host.querySelector('#ed-save').onclick=()=>{
    const level=host.querySelector('#ed-level').value.trim();
    const hours=[...host.querySelectorAll('#ed-hours .hrow')].map(r=>{
      const [lab,o,c]=r.querySelectorAll('input');
      return {label:lab.value.trim()||'Hours', open:o.value.trim(), close:c.value.trim()};
    }).filter(w=>/^\d{1,2}:\d{2}$/.test(w.open)&&/^\d{1,2}:\d{2}$/.test(w.close));
    state.edits[id]=Object.assign({}, state.edits[id], {level:level||null, hours});
    saveEdits(); state.editing=false; toast('Saved on this device'); selectVenue(id,false);
  };
  host.querySelector('#ed-reset').onclick=()=>{ delete state.edits[id]; saveEdits(); state.editing=false; toast('Reset'); selectVenue(id,false); };
}

/* ---------------- navigation line + user ---------------- */
function updateNavLine(){
  if(navLine){ navLine.remove(); navLine=null; }
  if(!state.navTarget || !state.pos) return;
  const v = venueView(state.data.venues.find(x=>x.id===state.navTarget));
  if(!v || v.area!==state.area) return;
  navLine = L.polyline([state.pos,[v.lat,v.lon]], {color:cssv('--ink'), weight:3, dashArray:'2 8', opacity:.9}).addTo(map);
}
function fitUserAnd(v){ try{ map.fitBounds([state.pos,[v.lat,v.lon]], {padding:[70,70], maxZoom:18}); }catch(e){} }

function ensureUser(){
  if(userMarker) return;
  const html=`<div style="position:relative">
    <div class="usercone" id="ucone"></div><div class="userdot"></div></div>`;
  userMarker = L.marker([0,0], {icon:L.divIcon({html, className:'', iconSize:[20,20], iconAnchor:[10,10]}), zIndexOffset:2000, interactive:false});
}
function drawCone(el){
  const hd = state.heading;
  if(hd==null){ el.innerHTML=''; return; }
  el.innerHTML = `<svg width="80" height="80" viewBox="-40 -40 80 80" style="position:absolute;left:-30px;top:-30px;transform:rotate(${hd}deg);transform-origin:center">
    <path d="M0,-6 L16,-34 A36,36 0 0 1 -16,-34 Z" fill="rgba(26,115,232,.35)" stroke="none"/></svg>`;
}
function onPos(p){
  state.pos=[p.coords.latitude, p.coords.longitude];
  ensureUser();
  if(!map.hasLayer(userMarker)) userMarker.addTo(map);
  userMarker.setLatLng(state.pos);
  const el=document.getElementById('ucone'); if(el) drawCone(el);
  updateNavLine();
  document.getElementById('locateBtn').classList.add('active');
  if(state.selected) openSheet(state.selected);
}
function onPosErr(e){ toast('Location unavailable: '+(e.message||e.code)); document.getElementById('locateBtn').classList.remove('active'); }
function startGPS(recenter){
  if(!('geolocation' in navigator)){ toast('No geolocation on this device'); return; }
  requestOrientation();
  if(state.watchId==null){
    state.watchId = navigator.geolocation.watchPosition(onPos, onPosErr, {enableHighAccuracy:true, maximumAge:2000, timeout:15000});
  }
  if(recenter){
    navigator.geolocation.getCurrentPosition(p=>{ onPos(p); map.panTo(state.pos,{animate:true}); if(map.getZoom()<17) map.setZoom(17);}, onPosErr, {enableHighAccuracy:true,timeout:15000});
  }
}
function onOrient(e){
  let hd=null;
  if(typeof e.webkitCompassHeading==='number') hd=e.webkitCompassHeading;       // iOS
  else if(e.absolute && typeof e.alpha==='number') hd=360-e.alpha;              // standard absolute
  else if(typeof e.alpha==='number') hd=360-e.alpha;
  if(hd!=null){ state.heading=hd; const el=document.getElementById('ucone'); if(el) drawCone(el); if(state.selected) { /* cheap: update arrow */ } }
}
function requestOrientation(){
  const DOE=window.DeviceOrientationEvent;
  if(DOE && typeof DOE.requestPermission==='function'){
    DOE.requestPermission().then(r=>{ if(r==='granted'){ window.addEventListener('deviceorientation', onOrient, true); } }).catch(()=>{});
  } else {
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  }
}

/* ---------------- UI build ---------------- */
function buildSwitcher(){
  const el=document.getElementById('switcher'); el.innerHTML='';
  for(const a of state.data.areas){
    const b=document.createElement('button');
    b.className='seg'+(a.id===state.area?' active':''); b.textContent=a.label; b.setAttribute('role','tab');
    b.onclick=()=>switchArea(a.id);
    el.appendChild(b);
  }
}
function buildChips(){
  const el=document.getElementById('chips'); el.innerHTML='';
  const on=document.createElement('button');
  on.className='chip opennow'+(state.openNow?' active':''); on.innerHTML='🕒 Open now';
  on.onclick=()=>{ state.openNow=!state.openNow; buildChips(); renderPins(); };
  el.appendChild(on);
  for(const k of CAT_ORDER){
    const c=CATS[k]; const b=document.createElement('button');
    b.className='chip'+(state.active.has(k)?' active':'');
    b.innerHTML=`<span class="swatch" style="background:${c.color}"></span><span class="ic">${c.ic}</span>${c.label}`;
    b.onclick=()=>{ state.active.has(k)?state.active.delete(k):state.active.add(k); buildChips(); renderPins(); };
    el.appendChild(b);
  }
}
function switchArea(id){
  state.area=id; state.selected=null; state.navTarget=null;
  closeSheet(); buildSwitcher(); renderBasemap(); renderPins();
  const a=state.data.areas.find(x=>x.id===id);
  document.getElementById('areaTitle').textContent=a.label;
  fitArea(a);
  toast(a.hours_note, 4200);
}
function fitArea(a){
  // fit to this area's venues + basemap features
  const pts=[];
  allVenues().forEach(v=>{ if(v.area===a.id) pts.push([v.lat,v.lon]); });
  if(pts.length>1){ map.fitBounds(pts, {padding:[60,60], maxZoom:18}); }
  else { map.setView(a.center, a.zoom); }
}

/* ---------------- offline indicator ---------------- */
async function updateOffline(){
  const el=document.getElementById('offline'), t=document.getElementById('offlineText');
  let cached=false;
  try{ const ks=await caches.keys(); cached = ks.some(k=>k.startsWith('xcaret-map')); }catch(e){}
  const controlled = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
  if(cached && controlled){ el.className='offline ok'; t.textContent='Saved for offline'; }
  else if(cached){ el.className='offline ok'; t.textContent='Saved for offline'; }
  else { el.className='offline wait'; t.textContent='Saving for offline…'; }
  if(!navigator.onLine){ t.textContent='Offline · using saved map'; el.className='offline ok'; }
}

/* ---------------- toast ---------------- */
let toastT;
function toast(msg, ms){ if(!msg) return; const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove('show'), ms||2200); }

/* ---------------- init ---------------- */
async function init(){
  setTheme(getTheme());
  const [d,b] = await Promise.all([
    fetch('data/data.json').then(r=>r.json()),
    fetch('data/basemap.geojson').then(r=>r.json()),
  ]);
  state.data=d; state.basemap=b;

  map = L.map('map', {zoomControl:true, attributionControl:true, minZoom:14, maxZoom:20, zoomSnap:.5, tap:true})
        .setView([20.5869,-87.1105], 17);
  map.attributionControl.setPrefix('');
  map.attributionControl.addAttribution('© OpenStreetMap contributors');
  map.on('zoomend', ()=>{ document.body.classList.toggle('labels-on', map.getZoom()>=17); });

  buildSwitcher(); buildChips();
  renderBasemap(); renderPins();
  const a=state.data.areas.find(x=>x.id===state.area);
  document.getElementById('areaTitle').textContent=a.label;
  document.body.classList.toggle('labels-on', map.getZoom()>=17);
  fitArea(a);

  // controls
  document.getElementById('themeBtn').onclick=()=>{
    const cur=getTheme(); const next=THEMES[(THEMES.indexOf(cur)+1)%THEMES.length];
    setTheme(next); renderBasemap(); renderPins(); toast('Theme: '+next);
  };
  document.getElementById('locateBtn').onclick=()=>startGPS(true);
  const s=document.getElementById('search'), sc=document.getElementById('searchClear');
  s.addEventListener('input', ()=>{ state.q=s.value; sc.hidden=!s.value; renderPins(); });
  sc.onclick=()=>{ s.value=''; state.q=''; sc.hidden=true; renderPins(); s.focus(); };
  document.getElementById('grabber').onclick=closeSheet;

  // start GPS passively (no recenter) so the dot appears when available
  startGPS(false);
  updateOffline();
  window.addEventListener('online', updateOffline);
  window.addEventListener('offline', updateOffline);
  if(navigator.serviceWorker){ navigator.serviceWorker.addEventListener('controllerchange', updateOffline); setTimeout(updateOffline, 1500); }
}
init().catch(e=>{ document.getElementById('offlineText').textContent='Load error'; console.error(e); alert('Failed to load map data: '+e.message); });
