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
    initGuides();
    map.on('zoomend',()=>{ if(state.area==='arte' && strokes) strokes(); });
    L.control.scale({position:'bottomleft',imperial:false,maxWidth:78}).addTo(map);
  }
  function initGuides(){
    const el=id=>document.getElementById(id);
    const dialog=el('arteGuide'), casa=el('guideCasa'), place=el('guidePlace');
    let reverse=false;
    try{casa.value=localStorage.getItem('arte_home_casa')==='piramide'?'piramide':'musica';}catch{}
    function render(){
      const home=casa.selectedOptions[0].textContent;
      const start='From '+home+', take the Casa elevator to level 3 and find the exit to the main pedestrian walkway.';
      const back='Follow the main walkway toward '+home+'. At the Casa, check the name at the entrance before taking the elevator to your floor.';
      const patron='Follow the main walkway toward Casa del Patrón, the dining building. Confirm the branch for Patrón at any unsigned junction.';
      const mercado='In the restaurant area, look toward the back near the outdoor tables and water features for the Mercado de San Juan entrance.';
      const routes={
        mercado:{name:'Mercado de San Juan',out:[start,patron,mercado],back:['From the Mercado entrance, exit Casa del Patrón onto the level 3 pedestrian walkway.',back]},
        lobby:{name:'Main lobby',out:[start,patron,'Find the elevators beside Mercado or between Tah-Xido and Chino Poblano. Go up to level 5 for the main concierge and resort entrance.'],back:['At the main concierge on level 5, ask for the elevator serving Mercado. Descend to the level 3 dining area.','Exit Casa del Patrón onto the main pedestrian walkway.',back]},
        cosexa:{name:'Cosexa',out:[start,'Use the guest walkway toward Casa de la Paz. Ask the Paz concierge for the Cosexa elevator.','At the adjacent elevator banks, confirm which serves Cosexa before going up. Follow the restaurant entrance signs on arrival.'],back:['Leave Cosexa by its guest elevator and ask for the Casa de la Paz exit to the main level 3 walkway.',back]},
        cayuco:{name:'Cayuco',out:[start,'Follow the pedestrian signs for Casa del Diseño. Confirm the next crossing with the Casa concierge if the signs split.','At Diseño, follow the Cayuco restaurant signs to the guest entrance.'],back:['From Cayuco, find the Casa del Diseño concierge and the level 3 exit onto the main walkway.',back]}
      };
      if(casa.value==='piramide') routes.xpiral={name:'Xpiral pyramid base',out:['In Casa de la Pirámide, follow the restaurant signs for Xaak.','Near Xaak, ask for the pedestrian bridge to Xpiral. A guest reports that this crossing leads to the base of the chapel pyramid. Confirm the destination before crossing.'],back:['From the base of Xpiral, identify the pedestrian bridge back toward Xaak.','Cross to the Xaak side and follow Casa de la Pirámide signs to the guest elevators.']};
      const old=place.value;
      place.replaceChildren(...Object.entries(routes).map(([k,r])=>new Option(r.name,k)));
      if(routes[old]) place.value=old;
      const route=routes[place.value];
      el('guideEvidence').textContent='Landmark guide · exact turns and entrances need a field check.';
      el('guideSteps').replaceChildren(...(reverse?route.back:route.out).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
      el('guideReverse').textContent=reverse?'Show outbound walk':'Show return walk';
      el('guideTitle').textContent=reverse?route.name+' → '+home:home+' → '+route.name;
    }
    casa.onchange=()=>{reverse=false;try{localStorage.setItem('arte_home_casa',casa.value);}catch{} render();};
    place.onchange=()=>{reverse=false;render();};
    el('guideReverse').onclick=()=>{reverse=!reverse;render();};
    el('arteGuides').onclick=()=>{render();dialog.showModal();};
    el('sheetbody').addEventListener('click',e=>{
      const button=e.target.closest('[data-walk-casa]');
      if(!button) return;
      closeSheet();casa.value=button.dataset.walkCasa;casa.onchange();dialog.showModal();
    });
    el('guideStart').onclick=()=>{
      if(!ArteWalk.start(el('guideTitle').textContent)) return;
      dialog.close();if(!pathView) el('artePaths').click();
    };
  }
  function sheet(v){
    const homes={'casa-casamusica':'musica','casa-casapiramide':'piramide'};
    if(homes[v.id]) return '<aside class="arte-directions"><button type="button" data-walk-casa="'+homes[v.id]+'">Walks from this Casa →</button></aside>';
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
