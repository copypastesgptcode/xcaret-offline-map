/* Arte-only cartography. Widths are approximate ground metres, with small
   minimum strokes so that crossings remain legible at the overview zoom. */
const ArteMap = (() => {
  const notes = {
    'arte-lobby': ['Walk to Mercado de San Juan', 'From the main entrance and concierge level, ask for the elevators serving Mercado in Casa del Patrón. Descend to the restaurant level and follow the Mercado signs.', 'arte-mercado-sj'],
    'arte-mercado-sj': ['Return to the main lobby', 'Look for the elevators beside Mercado, or between Tah-Xido and Chino Poblano. Guests report these connect to the main concierge and resort entrance.', 'arte-lobby'],
    'arte-cosexa': ['Find the guest elevator', 'In Casa de la Paz, confirm the restaurant elevator before going up. The adjacent elevator serves guest rooms.']
  };
  let detail, waterLayer, strokes, pathView = false;
  function width(metres, minimum){
    const metresPerPixel = 156543.03392 * Math.cos(20.588 * Math.PI / 180) / 2 ** map.getZoom();
    return Math.max(minimum, metres / metresPerPixel);
  }
  function style(feature){
    const kind = feature.properties.kind;
    const water = cssv('--water-deep');
    if(kind === 'lagoon') return {fill:true,fillColor:water,fillOpacity:1,color:water,weight:1};
    if(kind === 'channel') return {color:water,weight:width(8,3),opacity:1};
    if(kind === 'candidate') return {color:cssv('--arte-crossing'),weight:width(2,3),dashArray:'2 5',lineCap:'round'};
    const bridge = kind === 'bridge';
    return {color:kind==='steps' ? cssv('--arte-step') : cssv('--path'),weight:width(bridge?3:2,bridge?4:2.3),
      dashArray:kind==='steps'?'2 3':null,lineCap:'round',opacity:1};
  }
  function draw(collection, renderer, group){
    const add=(features,styleFn,interactive=false)=>L.geoJSON(features,{style:styleFn,renderer,interactive}).addTo(group);
    const walks=collection.features.filter(f=>!['channel','lagoon'].includes(f.properties.kind));
    const casing=f=>({color:cssv('--path-casing'),weight:style(f).weight+2,opacity:1});
    const outlines=add(walks.filter(f=>f.properties.kind!=='candidate'),casing);
    const lines=add(walks,style,true);
    const names={candidate:'Aerial crossing · guest access and level unconfirmed',bridge:'Mapped footbridge',steps:'Mapped steps',walk:'Mapped footpath'};
    lines.eachLayer(l=>l.bindPopup(names[l.feature.properties.kind]));
    strokes=()=>{waterLayer.setStyle(style);outlines.setStyle(casing);lines.setStyle(style);};
  }
  function init(collection){
    detail=collection;
    ArteWalk.init();
    const button=document.querySelector('#artePaths');
    button.onclick=()=>{
      pathView=!pathView;
      button.setAttribute('aria-pressed',String(pathView));
      document.querySelector('#arteKey').hidden=!pathView;
      renderPins();
    };
    document.querySelector('#arteMercado').onclick=()=>selectVenue('arte-mercado-sj',true);
    map.on('zoomend',()=>{ if(state.area==='arte' && strokes) strokes(); });
    L.control.scale({position:'bottomleft',imperial:false,maxWidth:78}).addTo(map);
  }
  function sheet(v){
    const n=notes[v.id];
    if(!n) return '';
    return `<aside class="arte-directions"><strong>${n[0]}</strong><p>${n[1]}</p><small>Guest-reported landmarks</small>${n[2] ? '<button type="button" data-arte-destination="'+n[2]+'">Show destination ↗</button>' : ''}</aside>`;
  }
  const order={sea:0,veg:1,beach:2,water:3,waterway:4,coastline:5,parking:6,pitch:7,building:8,roof:9,pool:10};
  function drawWater(renderer,group){
    waterLayer=L.geoJSON(detail.features.filter(f=>['channel','lagoon'].includes(f.properties.kind)),{renderer,interactive:false,style}).addTo(group);
    // Roofs, buildings and pools mask channels passing under structures.
    group.eachLayer(l=>{
      if(['building','roof','pool'].includes(l.feature?.properties.cls)) l.bringToFront();
    });
  }
  function sync(){
    const active=state.area==='arte';
    const wasActive=document.body.classList.contains('arte');
    if(active!==wasActive){
      const credit='Aerial reference: Esri and imagery providers';
      if(active) map.attributionControl.addAttribution(credit);
      else map.attributionControl.removeAttribution(credit);
    }
    document.body.classList.toggle('arte',active);
  }
  return {init,sheet,drawWater,drawOrder:f=>order[f.properties.cls]??6,draw:(r,g)=>draw(detail,r,g),replaces:f=>['waterway','path'].includes(f.properties.cls) && f.geometry.type==='LineString' && f.geometry.coordinates.some(([x,y])=>x>=-87.1135 && x<=-87.1065 && y>=20.585 && y<=20.591),
    hidePin:v=>pathView && !state.q.trim() && v.id!==state.selected && v.cat!=='casa' && v.id!=='arte-lobby',
    sync};
})();
