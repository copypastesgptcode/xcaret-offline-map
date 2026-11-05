/* One personal Arte walk, kept on this device. Each segment contains only
   consecutive, reasonably accurate fixes captured while the page is visible. */
const ArteWalk = (() => {
  const key='xcaret_arte_walk_v1';
  let segments=[], recording=false, replaceOnFix=false, lastTime=0, layer;
  function distance(a,b){ return map.distance(a,b); }
  function usable(p){
    return Array.isArray(p) && p.length===2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
      p[0]>=20.584 && p[0]<=20.592 && p[1]>=-87.115 && p[1]<=-87.104;
  }
  function persist(){
    try{localStorage.setItem(key,JSON.stringify(segments));}
    catch{recording=false;toast('Could not save this walk on your device');}
  }
  function draw(){
    if(layer){layer.remove();layer=null;}
    if(state.area==='arte' && segments.length){
      layer=L.layerGroup().addTo(map);
      for(const s of segments){
        L.polyline(s,{color:'#50215b',weight:6,interactive:false}).addTo(layer);
        L.polyline(s,{color:'#ffbdea',weight:3,interactive:false}).addTo(layer);
        L.circleMarker(s[0],{radius:3,color:'#50215b',fillColor:'#ffbdea',fillOpacity:1,interactive:false}).addTo(layer);
      }
    }
    document.querySelector('#arteRecord').textContent=recording?'Finish my walk':segments.length?'Replace saved walk':'Record my walk';
    document.querySelector('#arteForget').hidden=recording || !segments.length;
    document.querySelector('#arteWalkStatus').textContent=recording?'Recording Â· keep map open':segments.length?'My saved walk':'';
  }
  function fix(p){
    if(!recording || document.hidden || state.area!=='arte') return;
    const point=[p.coords.latitude,p.coords.longitude], now=p.timestamp || Date.now();
    if(!usable(point) || !Number.isFinite(p.coords.accuracy) || p.coords.accuracy>25){
      document.querySelector('#arteWalkStatus').textContent='Waiting for a clear GPS fix at Arte';return;
    }
    if(replaceOnFix){ segments=[]; replaceOnFix=false; }
    const seg=segments.at(-1), last=seg?.at(-1);
    if(!last || !lastTime || now-lastTime>45000 || distance(last,point)>65) segments.push([point]);
    else if(distance(last,point)>=4) seg.push(point);
    else return;
    lastTime=now;persist();draw();
  }
  function stop(){ recording=false;lastTime=0;draw(); }
  function init(){
    try{
      const saved=JSON.parse(localStorage.getItem(key)||'[]');
      if(Array.isArray(saved) && saved.every(s=>Array.isArray(s) && s.length && s.every(usable))) segments=saved;
    }catch{}
    document.querySelector('#arteRecord').onclick=()=>{
      if(recording){stop();return;}
      if(!navigator.geolocation){toast('GPS is unavailable in this browser');return;}
      if(segments.length && !confirm('Replace your saved walk when the first new GPS point arrives?')) return;
      // Keep the previous walk until a usable new fix is available.
      replaceOnFix=true;
      recording=true;lastTime=0;draw();startGPS(false);
    };
    document.querySelector('#arteForget').onclick=()=>{
      if(confirm('Clear this saved walk from this device?')){segments=[];persist();draw();}
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden) lastTime=0;});
    draw();
  }
  return {init,stop,draw,fix};
})();
