import{migrateLegacy,storageMode}from'./storage.js';import{initStore}from'./store.js';import{initAuth}from'./auth.js';import{mountApp}from'./ui.js';import{startSync}from'./sync.js';
const withTimeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timed out`)),ms))]);
function recovery(root,error){console.error(error);root.innerHTML=`<div class="fatal"><div><h1>FrontSeat could not start</h1><p>${String(error?.message||error||'Unknown startup error')}</p><button id="fs-retry">Try again</button><button id="fs-clear-cache">Repair app cache</button><button id="fs-reset-db">Reset local database</button></div></div>`;document.getElementById('fs-retry').onclick=()=>location.reload();document.getElementById('fs-clear-cache').onclick=async()=>{try{const regs=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(regs.map(r=>r.unregister()));const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)))}finally{location.reload()}};document.getElementById('fs-reset-db').onclick=()=>{const r=indexedDB.deleteDatabase('frontseat-v2');r.onsuccess=r.onerror=r.onblocked=()=>location.reload()}}
async function boot(){
 const root=document.getElementById('app');root.innerHTML='<div class="boot">Loading FrontSeat…</div>';
 const watchdog=setTimeout(()=>recovery(root,new Error('Startup took too long. FrontSeat switched to recovery mode.')),9000);
 try{
  await withTimeout(migrateLegacy(),5000,'Data migration');
  await withTimeout(initAuth(),5000,'Authentication');
  await withTimeout(initStore(),5000,'Application data');
  mountApp(root);clearTimeout(watchdog);
  document.body.dataset.storage=storageMode();
  startSync(status=>{document.body.dataset.sync=status.status||'unknown'});
  if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw-v2.js').catch(console.warn);
 }catch(error){clearTimeout(watchdog);recovery(root,error)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();