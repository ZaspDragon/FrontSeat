(()=>{
'use strict';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const fireChange=input=>input.dispatchEvent(new Event('change',{bubbles:true}));
const byId=id=>document.getElementById(id);

function setSeats(next){
  const input=byId('lep-cap');
  if(!input)return;
  input.value=String(clamp(Number(next)||1,1,20));
  fireChange(input);
}

function rotateSelected(direction){
  const width=byId('lep-width');
  const height=byId('lep-height');
  if(!width||!height)return;
  const oldWidth=clamp(Number(width.value)||120,70,320);
  const oldHeight=clamp(Number(height.value)||105,55,230);
  width.value=String(clamp(oldHeight,70,320));
  height.value=String(clamp(oldWidth,55,230));
  width.dataset.lastRotation=direction;
  fireChange(width);
}

function makeButton(label,className,onClick,ariaLabel=label){
  const el=document.createElement('button');
  el.type='button';
  el.className=className;
  el.textContent=label;
  el.setAttribute('aria-label',ariaLabel);
  el.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();onClick()});
  return el;
}

function moveIntoAdvanced(panel){
  if(panel.querySelector('.layout-advanced-details'))return;
  const details=document.createElement('details');
  details.className='layout-advanced-details';
  details.innerHTML='<summary>More table settings</summary><div class="layout-advanced-body"></div>';
  const body=details.querySelector('.layout-advanced-body');
  const number=byId('lep-number')?.closest('.layout-field');
  const shape=byId('lep-shape')?.closest('.layout-field');
  const section=byId('lep-section')?.closest('.layout-field');
  const size=byId('lep-width')?.closest('.layout-row');
  [number,shape,section,size].filter(Boolean).forEach(node=>body.append(node));
  const actions=[...panel.querySelectorAll('.layout-row')].find(row=>row.querySelector('#lep-duplicate'));
  panel.append(details);
  if(actions)panel.append(actions);
}

function enhanceProperties(){
  const panel=byId('le-properties');
  const cap=byId('lep-cap');
  if(!panel||!cap||panel.dataset.mobileEnhanced==='1')return;
  panel.dataset.mobileEnhanced='1';
  panel.classList.add('layout-compact-inspector');

  const header=panel.querySelector('h3');
  if(header){
    const top=document.createElement('div');
    top.className='layout-inspector-top';
    header.replaceWith(top);
    top.append(header);
    const close=makeButton('Hide','layout-inspector-hide',()=>panel.classList.toggle('is-hidden'),'Hide or show table controls');
    top.append(close);
  }

  const capLabel=cap.closest('.layout-field');
  if(capLabel){
    capLabel.classList.add('layout-capacity-field');
    const controls=document.createElement('div');
    controls.className='layout-seat-stepper';
    controls.append(
      makeButton('−','layout-step-button',()=>setSeats((Number(byId('lep-cap')?.value)||1)-1),'Remove one seat'),
      makeButton('+','layout-step-button',()=>setSeats((Number(byId('lep-cap')?.value)||1)+1),'Add one seat')
    );
    capLabel.append(controls);
    const presets=document.createElement('div');
    presets.className='layout-seat-presets';
    [1,2,4,6,8,10,12].forEach(value=>presets.append(
      makeButton(String(value),'layout-seat-preset',()=>setSeats(value),`Set table capacity to ${value}`)
    ));
    capLabel.append(presets);
  }

  const rotation=document.createElement('section');
  rotation.className='layout-rotation-controls';
  rotation.innerHTML='<strong>Rotate table</strong>';
  const actions=document.createElement('div');
  actions.className='layout-rotation-actions';
  actions.append(
    makeButton('↶ Left','layout-rotate-button',()=>rotateSelected('left'),'Rotate selected table 90 degrees left'),
    makeButton('Right ↷','layout-rotate-button',()=>rotateSelected('right'),'Rotate selected table 90 degrees right')
  );
  rotation.append(actions);
  capLabel?.insertAdjacentElement('afterend',rotation);

  moveIntoAdvanced(panel);
}

let queued=false;
function queueEnhance(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;enhanceProperties()});
}

const observer=new MutationObserver(queueEnhance);
function boot(){observer.observe(document.body,{childList:true,subtree:true});queueEnhance()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();