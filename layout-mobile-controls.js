(()=>{
'use strict';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const fireChange=input=>input.dispatchEvent(new Event('change',{bubbles:true}));

function numberInput(id){return document.getElementById(id)}

function setSeats(next){
  const input=numberInput('lep-cap');
  if(!input)return;
  input.value=String(clamp(Number(next)||1,1,20));
  fireChange(input);
}

function rotateSelected(direction){
  const width=numberInput('lep-width');
  const height=numberInput('lep-height');
  if(!width||!height)return;

  const oldWidth=clamp(Number(width.value)||120,70,320);
  const oldHeight=clamp(Number(height.value)||105,55,230);

  // FrontSeat layouts are axis-aligned. Swapping dimensions turns rectangular,
  // booth, and bar furniture 90 degrees while preserving drag and resize logic.
  width.value=String(clamp(oldHeight,70,320));
  height.value=String(clamp(oldWidth,55,230));
  width.dataset.lastRotation=direction;
  fireChange(width);
}

function button(label,className,onClick,ariaLabel=label){
  const el=document.createElement('button');
  el.type='button';
  el.className=className;
  el.textContent=label;
  el.setAttribute('aria-label',ariaLabel);
  el.addEventListener('click',onClick);
  return el;
}

function enhanceProperties(){
  const panel=document.getElementById('le-properties');
  const cap=numberInput('lep-cap');
  if(!panel||!cap||panel.querySelector('.layout-seat-stepper'))return;

  const capLabel=cap.closest('.layout-field');
  if(capLabel){
    capLabel.classList.add('layout-capacity-field');
    const controls=document.createElement('div');
    controls.className='layout-seat-stepper';
    controls.append(
      button('−','layout-step-button',()=>setSeats((Number(numberInput('lep-cap')?.value)||1)-1),'Remove one seat'),
      button('+','layout-step-button',()=>setSeats((Number(numberInput('lep-cap')?.value)||1)+1),'Add one seat')
    );
    capLabel.append(controls);

    const presets=document.createElement('div');
    presets.className='layout-seat-presets';
    [1,2,4,6,8,10,12].forEach(value=>presets.append(
      button(String(value),'layout-seat-preset',()=>setSeats(value),`Set table capacity to ${value}`)
    ));
    capLabel.append(presets);
  }

  const rotation=document.createElement('section');
  rotation.className='layout-rotation-controls';
  rotation.innerHTML='<strong>Table direction</strong><span>Turn the selected table sideways without re-entering its size.</span>';
  const actions=document.createElement('div');
  actions.className='layout-rotation-actions';
  actions.append(
    button('↶ Rotate left','layout-rotate-button',()=>rotateSelected('left'),'Rotate selected table 90 degrees left'),
    button('Rotate right ↷','layout-rotate-button',()=>rotateSelected('right'),'Rotate selected table 90 degrees right')
  );
  rotation.append(actions);

  const width=numberInput('lep-width');
  const sizeRow=width?.closest('.layout-row');
  if(sizeRow)sizeRow.insertAdjacentElement('afterend',rotation);
  else panel.append(rotation);
}

let queued=false;
function queueEnhance(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    enhanceProperties();
  });
}

const observer=new MutationObserver(queueEnhance);
function boot(){
  observer.observe(document.body,{childList:true,subtree:true});
  queueEnhance();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})();