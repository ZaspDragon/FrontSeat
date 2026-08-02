(()=>{
'use strict';
const DATA_KEY='frontseat-v3';
const ROLE_KEY='frontseat-role-v1';
const PROFILE_KEY='frontseat-commercial-v1';
const safeId=()=>{try{return crypto.randomUUID()}catch{return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`}};
const defaults=[
 {id:'recovery-t1',n:'1',cap:2,x:45,y:45,w:110,h:110,shape:'round',section:'Main',status:'available'},
 {id:'recovery-t2',n:'2',cap:4,x:190,y:45,w:140,h:110,shape:'square',section:'Main',status:'available'}
];
function number(v,fallback){const n=Number(v);return Number.isFinite(n)?n:fallback}
function normalizeTable(t,i){
 const shape=['round','square','rectangle','booth','bar'].includes(t?.shape)?t.shape:'square';
 return {
  ...t,
  id:t?.id||safeId(),
  n:String(t?.n??t?.number??i+1),
  cap:Math.max(1,Math.min(30,number(t?.cap??t?.capacity,2))),
  x:number(t?.x,45+(i%4)*150),
  y:number(t?.y,45+Math.floor(i/4)*140),
  w:Math.max(70,number(t?.w??t?.width,shape==='round'?110:140)),
  h:Math.max(55,number(t?.h??t?.height,110)),
  shape,
  section:t?.section||'Main',
  status:['available','seated','reserved','dirty','blocked'].includes(t?.status)?t.status:'available'
 };
}
function repairData(){
 let data=null;
 try{data=JSON.parse(localStorage.getItem(DATA_KEY)||'null')}catch{}
 if(!data||typeof data!=='object')data={};
 data.settings={restaurant:'FrontSeat',turn:75,theme:'light',contrast:false,large:false,section:'All',...(data.settings||{})};
 ['parties','reservations','servers','activity'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
 let tables=Array.isArray(data.tables)?data.tables.map(normalizeTable):[];
 if(tables.length===0)tables=defaults.map(x=>({...x}));
 if(tables.length===1)tables.push({...defaults[1],id:safeId(),n:String(Math.max(1,parseInt(tables[0].n)||1)+1)});
 data.tables=tables;
 try{localStorage.setItem(DATA_KEY,JSON.stringify(data))}catch{}
}
function logout(){
 sessionStorage.removeItem(ROLE_KEY);
 sessionStorage.removeItem('frontseat-v2-session');
 sessionStorage.removeItem('frontseat-session');
 document.documentElement.classList.remove('manager-session','owner-session');
 location.href=location.pathname+'?loggedout='+Date.now();
}
function addLogout(){
 if(document.querySelector('[data-frontseat-logout]'))return;
 const top=document.querySelector('.toprow,.topbar');
 if(!top)return;
 const button=document.createElement('button');
 button.type='button';
 button.className='small frontseat-logout';
 button.dataset.frontseatLogout='1';
 button.textContent='Log out';
 button.setAttribute('aria-label','Log out of manager access');
 button.addEventListener('click',()=>{if(confirm('Log out of FrontSeat on this device? Restaurant data will stay saved.'))logout()});
 top.appendChild(button);
}
function monitor(){
 const app=document.getElementById('app');
 if(!app)return;
 let lastGood=Date.now();
 const observer=new MutationObserver(()=>{
  if(app.children.length){lastGood=Date.now();addLogout();document.body.classList.add('frontseat-ready')}
 });
 observer.observe(app,{childList:true,subtree:true});
 setInterval(()=>{
  addLogout();
  if(Date.now()-lastGood>5000&&!app.children.length){
   document.querySelector('.layout-editor-launch')?.remove();
   app.innerHTML='<div class="startup-recovery"><h1>FrontSeat needs a quick repair</h1><p>The saved layout was incomplete. Your restaurant data is still on this device.</p><button id="fs-safe-reload">Repair and reload</button></div>';
   document.getElementById('fs-safe-reload').onclick=()=>{repairData();location.reload()};
  }
 },1200);
}
repairData();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',monitor,{once:true});else monitor();
})();
