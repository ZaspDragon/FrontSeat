import{getDoc,setDoc}from'./storage.js';
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
const seed=()=>({settings:{restaurant:'FrontSeat',turnMinutes:75,theme:'light',section:'All'},tables:[{id:uid(),number:'1',capacity:4,x:80,y:80,width:150,height:100,rotation:0,shape:'rectangle',section:'Main',status:'available'}],objects:[],parties:[],reservations:[],servers:[],activity:[],layouts:{},activeLayout:'Current',updatedAt:Date.now()});
let state=seed(),listeners=new Set(),undo=[],redo=[];
export async function initStore(){state={...seed(),...(await getDoc('restaurant',null)||{})};state.tables=(state.tables||[]).map((t,i)=>({id:t.id||uid(),number:String(t.number??t.n??i+1),capacity:Number(t.capacity??t.cap??2),x:Number(t.x)||40,y:Number(t.y)||40,width:Number(t.width??t.w??120),height:Number(t.height??t.h??90),rotation:Number(t.rotation)||0,shape:t.shape||'square',section:t.section||'Main',status:t.status||'available',partyId:t.partyId||null,seatedAt:t.seatedAt||null,server:t.server||null}));emit();return state}
export const getState=()=>state;
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
function emit(){listeners.forEach(fn=>fn(state))}
async function persist(){state.updatedAt=Date.now();await setDoc('restaurant',state)}
export async function update(mutator,{history=true,label='Update'}={}){if(history){undo.push(structuredClone(state));if(undo.length>60)undo.shift();redo=[]}const draft=structuredClone(state);mutator(draft);draft.activity=[{id:uid(),message:label,at:Date.now()},...(draft.activity||[])].slice(0,200);state=draft;emit();await persist();return state}
export async function undoAction(){if(!undo.length)return;redo.push(structuredClone(state));state=undo.pop();emit();await persist()}
export async function redoAction(){if(!redo.length)return;undo.push(structuredClone(state));state=redo.pop();emit();await persist()}
export const canUndo=()=>undo.length>0;export const canRedo=()=>redo.length>0;export{uid};