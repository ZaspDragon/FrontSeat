(()=>{
'use strict';
const PROFILE_KEY='frontseat-commercial-v1';
const DATA_KEY='frontseat-v3';
const ERROR_KEY='frontseat-errors-v1';
const BACKUP_KEY='frontseat-daily-backup-v1';
const SESSION_KEY='frontseat-role-v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
const today=()=>new Date().toISOString().slice(0,10);
const load=(k,fallback=null)=>{try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const hash=async value=>{const bytes=new TextEncoder().encode(value);const buf=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')};
let profile=load(PROFILE_KEY);
let role=sessionStorage.getItem(SESSION_KEY)||'host';
let installEvent=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e});
window.addEventListener('error',e=>recordError(e.message,e.filename,e.lineno));
window.addEventListener('unhandledrejection',e=>recordError(String(e.reason||'Unhandled promise rejection')));
function recordError(message,file='',line=''){
 const errors=load(ERROR_KEY,[]);errors.unshift({id:uid(),at:new Date().toISOString(),message,file,line});save(ERROR_KEY,errors.slice(0,50));
}
function ensureDailyBackup(){
 const last=load(BACKUP_KEY);if(last?.date===today())return;
 const data=localStorage.getItem(DATA_KEY);if(data)save(BACKUP_KEY,{date:today(),createdAt:new Date().toISOString(),data});
}
function download(name,text,type='application/json'){
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function getCore(){return load(DATA_KEY,{settings:{restaurant:profile?.business||'FrontSeat'},tables:[],parties:[],reservations:[],servers:[],activity:[]})}
function auditCsv(){
 const rows=[['Time','Action']];(getCore().activity||[]).forEach(x=>rows.push([new Date(x.at).toLocaleString(),x.m]));
 return rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
}
function overlay(html){
 closeOverlay();const el=document.createElement('div');el.className='commercial-overlay';el.id='commercial-overlay';el.innerHTML=`<section class="commercial-card" role="dialog" aria-modal="true">${html}</section>`;document.body.append(el);return el;
}
function closeOverlay(){$('#commercial-overlay')?.remove()}
function addChrome(){
 if(!$('.commercial-fab')){const b=document.createElement('button');b.className='commercial-fab';b.textContent='Business';b.setAttribute('aria-label','Open FrontSeat business controls');b.onclick=openBusiness;document.body.append(b)}
 if(!$('.commercial-footer')){const f=document.createElement('div');f.className='commercial-footer';f.innerHTML=`FrontSeat v1.0 · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a>`;document.body.append(f)}
}
function onboarding(){
 const el=overlay(`<div class="commercial-toolbar"><div><span class="commercial-badge">Commercial v1.0</span><h1>Set up FrontSeat</h1><p>Prepare this device for a restaurant host stand.</p></div></div>
 <div class="commercial-note">This edition securely stores operations data on this device. Use Export Backup daily. Cloud accounts and payment processing require a separate hosted backend.</div>
 <div class="commercial-grid" style="margin-top:18px">
  <label class="commercial-field">Restaurant name<input id="co-business" autocomplete="organization" placeholder="Copper & Oak"></label>
  <label class="commercial-field">Location name<input id="co-location" placeholder="Downtown"></label>
  <label class="commercial-field">Owner email<input id="co-email" type="email" autocomplete="email" placeholder="owner@restaurant.com"></label>
  <label class="commercial-field">Manager PIN<input id="co-pin" type="password" inputmode="numeric" maxlength="8" placeholder="4–8 digits"></label>
  <label class="commercial-field commercial-span"><span><input id="co-consent" type="checkbox"> I understand this self-hosted edition stores data locally and I will maintain backups.</span></label>
 </div><div id="co-error" class="commercial-error"></div>
 <div class="commercial-actions"><button class="primary" id="co-start">Start using FrontSeat</button><a href="privacy.html"><button type="button">Privacy</button></a><a href="terms.html"><button type="button">Terms</button></a></div>`);
 $('#co-start',el).onclick=async()=>{
  const business=$('#co-business',el).value.trim(),location=$('#co-location',el).value.trim(),email=$('#co-email',el).value.trim(),pin=$('#co-pin',el).value.trim();
  if(!business||!location||!/^\S+@\S+\.\S+$/.test(email)||!/^[0-9]{4,8}$/.test(pin)||!$('#co-consent',el).checked){$('#co-error',el).textContent='Complete every field, use a valid email and 4–8 digit PIN, and accept the local-storage notice.';return}
  profile={id:uid(),business,location,email,pinHash:await hash(pin),createdAt:new Date().toISOString(),plan:'Pilot',licenseStatus:'active',licenseKey:`FS-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,team:[{id:uid(),name:'Restaurant Owner',role:'owner'}]};
  save(PROFILE_KEY,profile);const core=getCore();core.settings={...(core.settings||{}),restaurant:business};save(DATA_KEY,core);closeOverlay();location.reload();
 };
}
function openBusiness(){
 if(!profile){onboarding();return}
 const el=overlay(`<div class="commercial-toolbar"><div><span class="commercial-badge">${esc(profile.licenseStatus||'active')} · ${esc(profile.plan||'Pilot')}</span><h2>${esc(profile.business)}</h2><p>${esc(profile.location)} · Device role: <strong>${esc(role)}</strong></p></div><button id="co-close">Close</button></div>
 <div class="commercial-grid">
  <div class="commercial-stat"><strong>License</strong><p>${esc(profile.licenseKey)}</p><span class="commercial-small">Local pilot license</span></div>
  <div class="commercial-stat"><strong>Data health</strong><p>${localStorage.getItem(DATA_KEY)?'Saved on this device':'No operational data found'}</p><span class="commercial-small">Last daily backup: ${esc(load(BACKUP_KEY)?.createdAt||'Not created')}</span></div>
  <div class="commercial-stat"><strong>Restaurant</strong><p>${esc(profile.business)}</p><span class="commercial-small">${esc(profile.email)}</span></div>
  <div class="commercial-stat"><strong>Release</strong><p>FrontSeat v1.0</p><span class="commercial-small">Self-hosted commercial pilot</span></div>
 </div>
 <div class="commercial-separator"></div><h3>Device access</h3>
 <div class="commercial-grid"><label class="commercial-field">Switch role<select id="co-role"><option value="host">Host</option><option value="manager">Manager</option><option value="owner">Owner</option></select></label><label class="commercial-field">Manager PIN<input id="co-role-pin" type="password" inputmode="numeric"></label></div><div id="co-role-error" class="commercial-error"></div><div class="commercial-actions"><button id="co-switch">Unlock role</button><button id="co-lock">Lock to Host</button></div>
 <div class="commercial-separator"></div><h3>Operations & protection</h3>
 <div class="commercial-actions"><button id="co-backup">Export full backup</button><button id="co-audit">Export audit CSV</button><button id="co-print">Print shift view</button><button id="co-restore-daily">Restore daily backup</button><button id="co-install">Install on device</button></div>
 <div class="commercial-separator"></div><h3>Owner tools</h3><p class="commercial-small">Manager/Owner access is required.</p>
 <div class="commercial-actions"><button id="co-edit">Edit business profile</button><button id="co-errors">View error log</button><button id="co-support">Support package</button><button class="danger" id="co-reset-profile">Remove business setup</button></div>
 <div class="commercial-note" style="margin-top:18px">Do not use this static edition for card payments, protected health information, or sensitive identity documents. It is designed for host-stand operations and local restaurant pilots.</div>`);
 $('#co-close',el).onclick=closeOverlay;$('#co-role',el).value=role;
 $('#co-switch',el).onclick=async()=>{const requested=$('#co-role',el).value;if(requested==='host'){setRole('host');return}const ok=await hash($('#co-role-pin',el).value)===profile.pinHash;if(!ok){$('#co-role-error',el).textContent='Incorrect manager PIN.';return}setRole(requested)};
 $('#co-lock',el).onclick=()=>setRole('host');
 $('#co-backup',el).onclick=()=>download(`frontseat-${today()}.json`,JSON.stringify({version:1,profile:{...profile,pinHash:undefined},frontseat:getCore(),errors:load(ERROR_KEY,[])},null,2));
 $('#co-audit',el).onclick=()=>download(`frontseat-audit-${today()}.csv`,auditCsv(),'text/csv');
 $('#co-print',el).onclick=()=>window.print();
 $('#co-restore-daily',el).onclick=()=>{const b=load(BACKUP_KEY);if(!b?.data)return alert('No daily backup is available.');if(confirm(`Restore backup from ${b.createdAt}? Current device data will be replaced.`)){localStorage.setItem(DATA_KEY,b.data);location.reload()}};
 $('#co-install',el).onclick=async()=>{if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null}else alert('Use your browser menu and choose Add to Home Screen or Install App.')};
 $('#co-edit',el).onclick=()=>requireManager(editProfile);
 $('#co-errors',el).onclick=()=>requireManager(showErrors);
 $('#co-support',el).onclick=()=>requireManager(()=>download(`frontseat-support-${today()}.json`,JSON.stringify({profile:{id:profile.id,business:profile.business,location:profile.location,plan:profile.plan,licenseStatus:profile.licenseStatus},errors:load(ERROR_KEY,[]),userAgent:navigator.userAgent,online:navigator.onLine,createdAt:new Date().toISOString()},null,2)));
 $('#co-reset-profile',el).onclick=()=>requireManager(()=>{if(confirm('Remove this restaurant profile from the device? Operational data will remain.')){localStorage.removeItem(PROFILE_KEY);sessionStorage.removeItem(SESSION_KEY);location.reload()}});
}
function setRole(next){role=next;sessionStorage.setItem(SESSION_KEY,next);closeOverlay();openBusiness()}
function requireManager(fn){if(!['manager','owner'].includes(role)){alert('Unlock Manager or Owner access first.');return}fn()}
function editProfile(){
 const el=overlay(`<h2>Edit restaurant profile</h2><div class="commercial-grid"><label class="commercial-field">Restaurant<input id="ep-business" value="${esc(profile.business)}"></label><label class="commercial-field">Location<input id="ep-location" value="${esc(profile.location)}"></label><label class="commercial-field commercial-span">Owner email<input id="ep-email" type="email" value="${esc(profile.email)}"></label></div><div class="commercial-actions"><button class="primary" id="ep-save">Save</button><button id="ep-cancel">Cancel</button></div>`);
 $('#ep-cancel',el).onclick=closeOverlay;$('#ep-save',el).onclick=()=>{profile={...profile,business:$('#ep-business',el).value.trim()||profile.business,location:$('#ep-location',el).value.trim()||profile.location,email:$('#ep-email',el).value.trim()||profile.email};save(PROFILE_KEY,profile);const core=getCore();core.settings={...(core.settings||{}),restaurant:profile.business};save(DATA_KEY,core);location.reload()};
}
function showErrors(){
 const errors=load(ERROR_KEY,[]);const el=overlay(`<div class="commercial-toolbar"><h2>Error log</h2><button id="er-close">Close</button></div>${errors.length?`<table class="commercial-table"><thead><tr><th>Time</th><th>Message</th></tr></thead><tbody>${errors.map(x=>`<tr><td>${esc(new Date(x.at).toLocaleString())}</td><td>${esc(x.message)}</td></tr>`).join('')}</tbody></table>`:'<p>No client errors have been recorded.</p>'}<div class="commercial-actions"><button id="er-export">Export</button><button class="danger" id="er-clear">Clear log</button></div>`);
 $('#er-close',el).onclick=closeOverlay;$('#er-export',el).onclick=()=>download(`frontseat-errors-${today()}.json`,JSON.stringify(errors,null,2));$('#er-clear',el).onclick=()=>{localStorage.removeItem(ERROR_KEY);showErrors()};
}
function boot(){ensureDailyBackup();addChrome();if(!profile)onboarding()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();