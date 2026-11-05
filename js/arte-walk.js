// Keep each private walk under its own key so a new outing cannot replace yesterday's.
const ArteWalk = (() => {
  const prefix='xcaret_arte_track_', legacy='xcaret_arte_walk_v1';
  const el=id=>document.getElementById(id);
  const walks=new Map();
  let selected=null, recording=false, lastTime=0, layer;
  function usable(p){
    return Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
      p[0]>=20.584 && p[0]<=20.592 && p[1]>=-87.115 && p[1]<=-87.104;
  }
  function persist(walk){
    try{localStorage.setItem(prefix+walk.id,JSON.stringify(walk));return true;}
    catch{recording=false;toast('Device storage unavailable. Download this walk as GPX before leaving.');return false;}
  }
  function draw(){
    if(layer){layer.remove();layer=null;}
    const walk=walks.get(selected);
    if(state.area==='arte' && walk){
      layer=L.layerGroup().addTo(map);
      for(const segment of walk.segments){
        const points=segment.map(p=>[p[0],p[1]]);
        L.polyline(points,{color:'#50215b',weight:6,interactive:false}).addTo(layer);
        L.polyline(points,{color:'#ffbdea',weight:3,interactive:false}).addTo(layer);
        L.circleMarker(points[0],{radius:3,color:'#50215b',fillColor:'#ffbdea',fillOpacity:1,interactive:false}).addTo(layer);
      }
    }
    const saved=[...walks.values()].filter(w=>w.segments.length);
    el('arteSaved').replaceChildren(...saved.map(w=>new Option(w.name,w.id)));
    el('arteSaved').value=selected||'';
    el('arteSavedLabel').hidden=recording || !saved.length;
    el('arteForget').hidden=el('arteExport').hidden=recording || !walk?.segments.length;
    el('arteRecord').textContent=recording?'Finish my walk':'Record my walk';
    el('arteWalkStatus').textContent=recording?'Recording · keep map open':'';
  }
  function fix(p){
    if(!recording || document.hidden || state.area!=='arte') return;
    const now=p.timestamp||Date.now(),point=[p.coords.latitude,p.coords.longitude,now];
    if(!usable(point) || !Number.isFinite(p.coords.accuracy) || p.coords.accuracy>25){
      lastTime=0;el('arteWalkStatus').textContent='Waiting for a clear GPS fix at Arte';return;
    }
    const walk=walks.get(selected), segment=walk.segments.at(-1), last=segment?.at(-1);
    const distance=last?map.distance(last.slice(0,2),point.slice(0,2)):0;
    if(!last || !lastTime || now-lastTime>45000 || distance>65) walk.segments.push([point]);
    else if(distance>=4) segment.push(point);
    else return;
    lastTime=now;persist(walk);draw();
  }
  function stop(){
    if(recording && !walks.get(selected)?.segments.length){walks.delete(selected);selected=[...walks.keys()].at(-1);}
    recording=false;lastTime=0;draw();
  }
  function start(name){
    if(recording){toast('Finish the current walk first');return false;}
    if(!navigator.geolocation){toast('GPS is unavailable in this browser');return false;}
    const id=crypto.randomUUID();
    walks.set(id,{id,name,segments:[]});selected=id;recording=true;lastTime=0;draw();startGPS(false);return true;
  }
  function exportWalk(){
    const walk=walks.get(selected);
    const segments=walk.segments.map(s=>'<trkseg>'+s.map(([lat,lon,time])=>
      '<trkpt lat="'+lat+'" lon="'+lon+'">'+(time?'<time>'+new Date(time).toISOString()+'</time>':'')+'</trkpt>').join('')+'</trkseg>').join('');
    const xml='<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Xcaret Map" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>'+esc(walk.name)+'</name>'+segments+'</trk></gpx>';
    const url=URL.createObjectURL(new Blob([xml],{type:'application/gpx+xml'}));
    const a=document.createElement('a');a.href=url;a.download=(walk.name.replace(/[^\p{L}\p{N}]+/gu,'-').slice(0,90)||'arte-walk')+'-'+walk.id.slice(0,8)+'.gpx';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function init(){
    try{
      for(const key of Object.keys(localStorage).filter(k=>k.startsWith(prefix))){
        const w=JSON.parse(localStorage.getItem(key));
        if(w && prefix+w.id===key && typeof w.name==='string' && w.segments?.length && w.segments.every(s=>s.length && s.every(usable))) walks.set(w.id,w);
      }
      const segments=JSON.parse(localStorage.getItem(legacy)||'[]');
      if(segments.length && segments.every(s=>s.length && s.every(usable))){
        const w={id:'previous',name:'Previously saved walk',segments};
        walks.set(w.id,w);if(persist(w)) localStorage.removeItem(legacy);
      }
    }catch{}
    selected=[...walks.keys()].at(-1);
    el('arteRecord').onclick=()=>{
      if(recording){stop();return;}
      const name=prompt('Name this walk (start → destination)','');
      if(name?.trim()) start(name.trim().slice(0,130));
    };
    el('arteSaved').onchange=()=>{
      selected=el('arteSaved').value;draw();
      const pts=walks.get(selected).segments.flat().map(p=>p.slice(0,2));
      map.fitBounds(pts,{maxZoom:19,paddingTopLeft:[30,el('topcard').offsetHeight+12],paddingBottomRight:[30,85]});
    };
    el('arteForget').onclick=()=>{
      if(confirm('Delete this walk from this device?')){
        try{localStorage.removeItem(prefix+selected);}catch{toast('Could not delete this walk');return;}
        walks.delete(selected);selected=[...walks.keys()].at(-1);draw();
      }
    };
    el('arteExport').onclick=exportWalk;
    document.addEventListener('visibilitychange',()=>{if(document.hidden) lastTime=0;});
    draw();
  }
  return {init,stop,draw,fix,start};
})();
