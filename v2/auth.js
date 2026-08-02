import{getDoc,setDoc}from'./storage.js';
const SESSION='frontseat-v2-session';
const digest=async v=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function initAuth(){let profile=await getDoc('auth',null);if(!profile){const restaurant=prompt('Restaurant name:','FrontSeat Restaurant')||'FrontSeat Restaurant';const pin=prompt('Create a 4–8 digit manager PIN:','1234')||'1234';profile={restaurant,pinHash:await digest(pin),users:[{id:'owner',name:'Owner',role:'owner'}]};await setDoc('auth',profile)}return profile}
export function currentRole(){return sessionStorage.getItem(SESSION)||'host'}
export async function unlock(role='manager'){if(role==='host'){sessionStorage.setItem(SESSION,'host');return true}const auth=await getDoc('auth');const pin=prompt('Manager PIN:');if(await digest(pin||'')!==auth.pinHash)return false;sessionStorage.setItem(SESSION,role);return true}
export function requireRole(roles){return roles.includes(currentRole())}
export async function setRestaurantName(name){const auth=await getDoc('auth');auth.restaurant=name;await setDoc('auth',auth)}