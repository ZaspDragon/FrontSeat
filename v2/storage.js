const DB='frontseat-v2',VERSION=2,STORE='documents',FALLBACK_KEY='frontseat-v2-fallback';
let dbPromise=null,useFallback=false;
const readFallback=()=>{try{return JSON.parse(localStorage.getItem(FALLBACK_KEY)||'{}')}catch{return{}}};
const writeFallback=data=>{try{localStorage.setItem(FALLBACK_KEY,JSON.stringify(data))}catch{}};
function timeout(ms,message){return new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms))}
export function openDB(){
 if(useFallback)return Promise.resolve(null);
 if(dbPromise)return dbPromise;
 dbPromise=Promise.race([
  new Promise((resolve,reject)=>{
   let settled=false;
   const r=indexedDB.open(DB,VERSION);
   r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};
   r.onsuccess=()=>{settled=true;const db=r.result;db.onversionchange=()=>db.close();resolve(db)};
   r.onerror=()=>{settled=true;reject(r.error||new Error('IndexedDB failed to open'))};
   r.onblocked=()=>{if(!settled)reject(new Error('IndexedDB is blocked by another FrontSeat tab'))};
  }),
  timeout(2500,'IndexedDB startup timed out')
 ]).catch(error=>{console.warn('FrontSeat storage fallback enabled:',error);useFallback=true;dbPromise=null;return null});
 return dbPromise;
}
export async function getDoc(key,fallback=null){
 const db=await openDB();
 if(!db){const data=readFallback();return data[key]??fallback}
 return Promise.race([new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result?.value??fallback);q.onerror=()=>reject(q.error);tx.onabort=()=>reject(tx.error||new Error('Read aborted'))}),timeout(2500,'Database read timed out')]).catch(()=>{useFallback=true;return readFallback()[key]??fallback});
}
export async function setDoc(key,value){
 const db=await openDB();
 if(!db){const data=readFallback();data[key]=value;writeFallback(data);return value}
 return Promise.race([new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({key,value,updatedAt:Date.now()});tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Write aborted'))}),timeout(3000,'Database write timed out')]).catch(error=>{console.warn(error);useFallback=true;const data=readFallback();data[key]=value;writeFallback(data);return value});
}
export async function exportAll(){
 const db=await openDB();if(!db)return readFallback();
 return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const q=tx.objectStore(STORE).getAll();q.onsuccess=()=>resolve(Object.fromEntries(q.result.map(x=>[x.key,x.value])));q.onerror=()=>reject(q.error)}).catch(()=>readFallback());
}
export async function importAll(data){for(const [k,v] of Object.entries(data||{}))await setDoc(k,v)}
export async function migrateLegacy(){
 const done=await getDoc('migration-v1',false);if(done)return;
 let legacy=null;try{legacy=JSON.parse(localStorage.getItem('frontseat-v3')||'null')}catch{}
 if(legacy){const normalized={settings:legacy.settings||{},tables:legacy.tables||[],objects:legacy.objects||[],parties:legacy.parties||[],reservations:legacy.reservations||[],servers:legacy.servers||[],activity:legacy.activity||[],layouts:legacy.layouts||{},activeLayout:legacy.activeLayout||'Current'};await setDoc('restaurant',normalized)}
 await setDoc('migration-v1',true);
}
export function storageMode(){return useFallback?'local-fallback':'indexeddb'}