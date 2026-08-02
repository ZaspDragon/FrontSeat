(()=>{
'use strict';
const DATA_KEY='frontseat-v3',PROFILE_KEY='frontseat-commercial-v1',ROLE_KEY='frontseat-role-v1';
const load=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>crypto.randomUUID?.()||`t-${Date.now()}-${Math.random()}`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=async value=>{const b=new TextEncoder().encode(value);const x=await crypto.subtle.digest('SHA-256',b);return[...new Uint8Array(x)].map(n=>n.toString(16).padStart(2,'0')).join('')};
let core=null,selected=null,drag=null,dirty=false;
const role=()=>sessionStorage.getItem(ROLE_KEY)||'host';
async function authorize(){
 if(['manager','owner'].includes(role()))return true;
 const profile=load(PROFILE_KEY);
 if(!profile?.pinHash){alert('Open Business first and complete restaurant setup before editing the floor plan.');return false}
 const pin=prompt('Enter the Manager PIN to edit the seating layout:');
 if(!pin||await hash(pin)!==profile.pinHash){alert('Incorrect Manager PIN.');return false}
 sessionStorage.setItem(ROLE_KEY,'manager');return true;
}
function normalize(){
 core=load(DATA_KEY,{settings:{restaurant:'FrontSeat'},tables:[],parties:[],reservations:[],servers:[],activity:[]});
 core.tables=(core.tables||[]).map((t,i)=>({...t,id:t.id||uid(),n:String(t.n||i+1),cap:Number(t.cap)||2,x:Number.isFinite(+t.x)?+t.x:30,y:Number.isFinite(+t.y)?+t.y:30,w:Number(t.w)||120,h:Number(t.h)||100,shape:['round','square','rectangle','booth','bar'].includes(t.shape)?t.shape:'square',section:t.section||'Main'}));
 core.layouts=core.layouts||{};core.activeLayout=core.activeLayout||'Current';
}
const snapshot=()=>core.tables.map(t=>({...t}));
function markDirty(){dirty=true;const e=document.querySelector('.layout-save-state');if(e)e.textContent='Unsaved changes'}
async function launch(){if(await authorize())openEditor()}
function openEditor(){
 document.getElementById('layout-editor-overlay')?.remove();normalize();selected=core.tables[0]?.id||null;dirty=false;
 const el=document.createElement('div');el.className='layout-editor-overlay';el.id='layout-editor-overlay';
 el.innerHTML=`<section class="layout-editor-shell" role="dialog" aria-modal="true" aria-label="Floor plan editor">
 <header class="layout-editor-head"><div><h2>Floor Plan Editor</h2><p>Drag tables into position, resize them, and set how many guests each one holds.</p></div><div class="layout-editor-head-actions"><span class="layout-save-state">Saved</span><button id="le-new-layout">Save as layout</button><button class="primary" id="le-save">Save floor plan</button><button id="le-close">Close</button></div></header>
 <div class="layout-editor-body"><aside class="layout-toolbox"><h3>Add furniture</h3><div class="layout-tools">${[['round','●','Round'],['square','■','Square'],['rectangle','▰','Rectangle'],['booth','▱','Booth'],['bar','▬','Bar']].map(x=>`<button data-add-shape="${x[0]}"><span>${x[1]}</span><small>${x[2]}</small></button>`).join('')}</div><div class="layout-help" style="margin-top:14px">Tap a shape to add it. Drag tables with one finger. Drag the green corner to resize. The dots represent seats.</div><h3 style="margin-top:18px">Saved layouts</h3><div class="layout-list" id="le-layout-list"></div></aside>
 <main class="layout-stage-wrap"><div class="layout-stage" id="le-stage"><span class="layout-zone-label" style="left:18px;top:14px">Restaurant floor</span></div></main><aside class="layout-properties" id="le-properties"></aside></div></section>`;
 document.body.append(el);
 document.getElementById('le-close').onclick=closeEditor;document.getElementById('le-save').onclick=saveAll;document.getElementById('le-new-layout').onclick=saveNamedLayout;
 document.querySelectorAll('[data-add-shape]').forEach(b=>b.onclick=()=>addTable(b.dataset.addShape));
 render();
}
function closeEditor(){if(dirty&&!confirm('Close without saving your floor-plan changes?'))return;drag=null;document.getElementById('layout-editor-overlay')?.remove()}
function addTable(shape){
 const count=core.tables.reduce((m,t)=>Math.max(m,parseInt(t.n)||0),0)+1;
 const dims=shape==='round'?[105,105]:shape==='rectangle'?[165,95]:shape==='booth'?[175,105]:shape==='bar'?[210,70]:[120,105];
 const t={id:uid(),n:String(count),cap:shape==='bar'||shape==='booth'?6:shape==='round'?2:4,x:45+(core.tables.length%5)*135,y:60+(Math.floor(core.tables.length/5)%4)*130,w:dims[0],h:dims[1],shape,section:'Main',status:'available'};
 core.tables.push(t);selected=t.id;markDirty();render();
}
function seats(t){const n=Math.max(1,Math.min(20,+t.cap||1)),out=[];for(let i=0;i<n;i++){const a=Math.PI*2*i/n-Math.PI/2,rx=t.w/2+8,ry=t.h/2+8,x=t.w/2+Math.cos(a)*rx-8.5,y=t.h/2+Math.sin(a)*ry-8.5;out.push(`<span class="layout-seat" style="left:${x}px;top:${y}px"></span>`)}return out.join('')}
function render(){
 const stage=document.getElementById('le-stage');if(!stage)return;stage.querySelectorAll('.layout-item').forEach(x=>x.remove());
 core.tables.forEach(t=>{const e=document.createElement('div');e.className=`layout-item ${t.shape} ${selected===t.id?'selected':''}`;e.dataset.id=t.id;e.style.cssText=`left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px`;e.innerHTML=`${seats(t)}<div><div class="layout-table-number">${esc(t.n)}</div><div class="layout-table-cap">${t.cap} seats · ${esc(t.section)}</div></div>${selected===t.id?'<span class="layout-resize" data-resize="1"></span>':''}`;
 e.addEventListener('pointerdown',startDrag,{passive:false});e.addEventListener('click',()=>{selected=t.id;render()});stage.append(e)});
 renderProperties();renderLayoutList();
}
function startDrag(ev){
 const t=core.tables.find(x=>x.id===ev.currentTarget.dataset.id);if(!t)return;selected=t.id;drag={id:t.id,startX:ev.clientX,startY:ev.clientY,x:t.x,y:t.y,w:t.w,h:t.h,resize:ev.target.dataset.resize==='1',pointerId:ev.pointerId};ev.preventDefault();ev.stopPropagation();renderProperties();
}
function moveDrag(ev){
 if(!drag||ev.pointerId!==drag.pointerId)return;const t=core.tables.find(x=>x.id===drag.id);if(!t)return;const dx=ev.clientX-drag.startX,dy=ev.clientY-drag.startY;
 if(drag.resize){t.w=Math.max(70,Math.min(320,drag.w+dx));t.h=Math.max(55,Math.min(230,drag.h+dy))}else{t.x=Math.max(0,Math.min(900-t.w,drag.x+dx));t.y=Math.max(0,Math.min(620-t.h,drag.y+dy))}
 markDirty();const e=document.querySelector(`.layout-item[data-id="${CSS.escape(t.id)}"]`);if(e)e.style.cssText=`left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px`;ev.preventDefault();
}
function endDrag(ev){if(!drag||ev.pointerId!==drag.pointerId)return;drag=null;render()}
window.addEventListener('pointermove',moveDrag,{passive:false});window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);
function renderProperties(){
 const box=document.getElementById('le-properties'),t=core.tables.find(x=>x.id===selected);if(!box)return;
 if(!t){box.innerHTML='<h3>Table settings</h3><p class="layout-help">Choose a table to edit it.</p>';return}
 box.innerHTML=`<h3>Table ${esc(t.n)}</h3><label class="layout-field">Table number<input id="lep-number" value="${esc(t.n)}"></label><label class="layout-field">Shape<select id="lep-shape">${['round','square','rectangle','booth','bar'].map(x=>`<option value="${x}" ${t.shape===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><label class="layout-field">People this table holds<input id="lep-cap" type="number" min="1" max="20" value="${t.cap}"></label><label class="layout-field">Section<input id="lep-section" value="${esc(t.section)}"></label><div class="layout-row"><label class="layout-field">Width<input id="lep-width" type="number" min="70" max="320" value="${Math.round(t.w)}"></label><label class="layout-field">Height<input id="lep-height" type="number" min="55" max="230" value="${Math.round(t.h)}"></label></div><div class="layout-row"><button id="lep-duplicate">Duplicate</button><button class="layout-danger" id="lep-delete">Delete</button></div>`;
 const sync=()=>{t.n=document.getElementById('lep-number').value.trim()||t.n;t.shape=document.getElementById('lep-shape').value;t.cap=Math.max(1,Math.min(20,+document.getElementById('lep-cap').value||1));t.section=document.getElementById('lep-section').value.trim()||'Main';t.w=Math.max(70,Math.min(320,+document.getElementById('lep-width').value||t.w));t.h=Math.max(55,Math.min(230,+document.getElementById('lep-height').value||t.h));markDirty();render()};
 ['lep-number','lep-shape','lep-cap','lep-section','lep-width','lep-height'].forEach(id=>document.getElementById(id).onchange=sync);
 document.getElementById('lep-duplicate').onclick=()=>{const c={...t,id:uid(),n:String(core.tables.reduce((m,x)=>Math.max(m,parseInt(x.n)||0),0)+1),x:Math.min(900-t.w,t.x+28),y:Math.min(620-t.h,t.y+28),partyId:undefined,seatedAt:undefined,server:undefined,status:'available'};core.tables.push(c);selected=c.id;markDirty();render()};
 document.getElementById('lep-delete').onclick=()=>{if(t.partyId){alert('Move or clear the seated party before deleting this table.');return}if(confirm(`Delete Table ${t.n}?`)){core.tables=core.tables.filter(x=>x.id!==t.id);selected=core.tables[0]?.id||null;markDirty();render()}};
}
function renderLayoutList(){const box=document.getElementById('le-layout-list');if(!box)return;const names=Object.keys(core.layouts||{});box.innerHTML=`<button data-layout="Current">Current working layout</button>${names.map(n=>`<button data-layout="${esc(n)}">${esc(n)}</button>`).join('')}`;box.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>loadLayout(b.dataset.layout))}
function loadLayout(name){if(dirty&&!confirm('Replace unsaved floor-plan changes?'))return;if(name==='Current')normalize();else{core.tables=(core.layouts[name]||[]).map(t=>({...t}));core.activeLayout=name}selected=core.tables[0]?.id||null;dirty=false;render()}
function saveNamedLayout(){const name=prompt('Layout name:',core.activeLayout==='Current'?'Dinner':core.activeLayout);if(!name?.trim())return;core.layouts[name.trim()]=snapshot();core.activeLayout=name.trim();saveAll()}
function saveAll(){if(core.activeLayout!=='Current')core.layouts[core.activeLayout]=snapshot();core.activity=core.activity||[];core.activity.unshift({m:`Floor plan saved (${core.activeLayout})`,at:Date.now()});core.activity=core.activity.slice(0,50);save(DATA_KEY,core);dirty=false;document.querySelector('.layout-save-state').textContent='Saved';setTimeout(()=>location.reload(),250)}
function decorateHostTables(){
 const data=load(DATA_KEY);if(!data?.tables)return;document.querySelectorAll('.table-card[data-table]').forEach(card=>{const t=data.tables.find(x=>x.id===card.dataset.table);if(!t)return;const n=Math.min(12,+t.cap||0),key=String(n);let map=card.querySelector('.host-seat-map');if(map?.dataset.count===key)return;map?.remove();map=document.createElement('span');map.className='host-seat-map';map.dataset.count=key;for(let i=0;i<n;i++){const d=document.createElement('span');d.className='host-seat-dot';const a=Math.PI*2*i/n-Math.PI/2;d.style.left=`calc(50% + ${Math.cos(a)*46}% - 4px)`;d.style.top=`calc(50% + ${Math.sin(a)*46}% - 4px)`;map.append(d)}card.append(map)})
}
function injectLaunchers(){
 if(!document.querySelector('.layout-editor-launch')){const b=document.createElement('button');b.className='layout-editor-launch';b.textContent='✏️ Edit Seating Layout';b.setAttribute('aria-label','Edit restaurant seating layout');b.onclick=launch;document.body.append(b)}
 const card=document.querySelector('#commercial-overlay .commercial-card');if(card&&!card.querySelector('#co-floor-plan')){const wrap=document.createElement('div');wrap.className='commercial-actions';wrap.style.marginTop='12px';wrap.innerHTML='<button class="primary" id="co-floor-plan">Edit seating layout</button>';card.append(wrap);wrap.querySelector('button').onclick=launch}
}
let scheduled=false;function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;injectLaunchers();decorateHostTables()})}
const mo=new MutationObserver(refresh);
function boot(){injectLaunchers();decorateHostTables();mo.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();