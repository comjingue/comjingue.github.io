/* 레벨업 길드 v1.0 — app */
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const RM=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ---------- 픽셀 렌더 ---------- */
const PAL = {k:'#111',s:'#f1c9a5',h:'#3a2a1e',w:'#fff',g:'#7fd6b2',o:'#F0703C',y:'#f5c542',b:'#5b8def',p:'#b07cf0',r:'#e85d5d',d:'#2b2b2b',n:'#8a6a48'};
function sprite(rows, map={}, scale=4){
  const h=rows.length,w=rows[0].length; let r='';
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(c!=='.'){ const col=map[c]||PAL[c]; r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${col}"/>`; }}));
  return `<svg class="spr" width="${w*scale}" height="${h*scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
/* 12×12 단색 아이콘 (x = currentColor) */
const ICONS={
  agent:['.....xx.....','.....xx.....','..xxxxxxxx..','..x......x..','.xx.xx.xx.xx','.xx.xx.xx.xx','..x......x..','..x.xxxx.x..','..xxxxxxxx..','....x..x....','...xxxxxx...','...x....x...'],
  finance:['....xxxx....','..xx....xx..','.x...xx...x.','.x..xxxx..x.','x...xx.....x','x....xxx...x','x......xx..x','x...xxxx...x','.x...xx...x.','.x........x.','..xx....xx..','....xxxx....'],
  founder:['............','xxxxxxxxxxxx','x.x.x.x.x.xx','xxxxxxxxxxxx','.x........x.','.x.xxx.xx.x.','.x.x.x.xx.x.','.x.x.x....x.','.x.x.x....x.','.x.x.x....x.','xxxxxxxxxxxx','............'],
  office:['.xxxxxxxxxx.','.x........x.','.x.xx..xx.x.','.x.xx..xx.x.','.x........x.','.x.xx..xx.x.','.x.xx..xx.x.','.x........x.','.x...xx...x.','.x...xx...x.','.x...xx...x.','xxxxxxxxxxxx'],
  menu:['............','............','.xxxxxxxxxx.','.xxxxxxxxxx.','............','.xxxxxxxxxx.','.xxxxxxxxxx.','............','.xxxxxxxxxx.','.xxxxxxxxxx.','............','............'],
  disk:['xxxxxxxxxxx.','xx.xxxxx.xx.','xx.xxxxx.xxx','xx.......xxx','xxxxxxxxxxxx','xx........xx','xx.xxxxxx.xx','xx........xx','xx.xxxxxx.xx','xx........xx','xxxxxxxxxxxx','............'],
  gear:['.....xx.....','.xx.xxxx.xx.','.xxxxxxxxxx.','..xxx..xxx..','.xxx....xxx.','xxx......xxx','xxx......xxx','.xxx....xxx.','..xxx..xxx..','.xxxxxxxxxx.','.xx.xxxx.xx.','.....xx.....'],
  sos:['....xxxx....','..xx....xx..','.x...xx...x.','.x...xx...x.','x....xx....x','x....xx....x','x....xx....x','x..........x','.x...xx...x.','.x...xx...x.','..xx....xx..','....xxxx....'],
  close:['xx........xx','xxx......xxx','.xxx....xxx.','..xxx..xxx..','...xxxxxx...','....xxxx....','....xxxx....','...xxxxxx...','..xxx..xxx..','.xxx....xxx.','xxx......xxx','xx........xx'],
  lock:['....xxxx....','...x....x...','..x......x..','..x......x..','..x......x..','.xxxxxxxxxx.','.xxxxxxxxxx.','.xxxx..xxxx.','.xxxx..xxxx.','.xxxxx.xxxx.','.xxxxxxxxxx.','.xxxxxxxxxx.'],
  skull:['...xxxxxx...','.xxxxxxxxxx.','.xxxxxxxxxx.','xx...xx...xx','xx...xx...xx','xxxxxxxxxxxx','.xxxxx.xxxx.','.xxxx...xxx.','..xxxxxxxx..','..x.x.x.x...','..xxxxxxxx..','............'],
  check:['............','...........x','..........xx','.........xx.','........xx..','x......xx...','xx....xx....','.xx..xx.....','..xxxx......','...xx.......','............','............'],
  bang:['.....xx.....','....xxxx....','....xxxx....','....xxxx....','.....xx.....','.....xx.....','.....xx.....','............','.....xx.....','.....xx.....','............','............'],
  back:['............','.....xx.....','....xx......','...xx.......','..xx........','.xxxxxxxxxx.','.xxxxxxxxxx.','..xx........','...xx.......','....xx......','.....xx.....','............'],
  copy:['............','.xxxxxxx....','.x.....x....','.x..xxxxxxx.','.x..x.....x.','.x..x.....x.','.x..x.....x.','.xxxx.....x.','....x.....x.','....xxxxxxx.','............','............'],
  home:['.....xx.....','....xxxx....','...xx..xx...','..xx....xx..','.xx......xx.','xxxxxxxxxxxx','.x........x.','.x..xx....x.','.x..xx..x.x.','.x..xx....x.','.xxxxxxxxxx.','............'],
  medal:['.xx......xx.','..xx....xx..','...xx..xx...','....xxxx....','...xxxxxx...','..xx....xx..','.xx..xx..xx.','.x..xxxx..x.','.xx..xx..xx.','..xx....xx..','...xxxxxx...','............'],
};
function icon(name,size=24){
  const rows=ICONS[name]; let r='';
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c==='x')r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}));
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 12 12" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
const PLANT=['..g..g..','.ggg.gg.','..gggg..','g..gg..g','.g.gg.g.','..nnnn..','..nnnn..','...nn...'];

/* ---------- 상태 ---------- */
const KEY='levelup-guild-v1';
const quests=()=>Q.filter(q=>q.id);
const QID=new Set(quests().map(q=>q.id));
const qById=id=>quests().find(q=>q.id===id);
function defaults(){return {v:2,nick:'',cls:'',os:'',done:{},badges:[],steps:{},verified:{},sos:{},seen:[],tab:null,t0:null,sfx:true,vibe:true};}
function isObj(o){return o&&typeof o==='object'&&!Array.isArray(o);}
function normalize(o){
  const d=defaults(); if(!isObj(o))o={};
  const S={...d};
  S.nick=typeof o.nick==='string'?o.nick.trim().slice(0,16):'';
  let cls=typeof o.cls==='string'?o.cls:''; if(LEGACY[cls])cls=LEGACY[cls];
  S.cls=Object.prototype.hasOwnProperty.call(CLASSES,cls)?cls:'';
  S.os=(o.os==='mac'||o.os==='win')?o.os:'';
  if(isObj(o.done))for(const k in o.done){if(QID.has(k)&&o.done[k]){const t=+o.done[k];S.done[k]=Number.isFinite(t)&&t>0?t:Date.now();}}
  if(Array.isArray(o.badges))S.badges=[...new Set(o.badges.filter(b=>typeof b==='string').map(b=>b.slice(0,40)))].slice(0,50);
  if(isObj(o.steps))for(const k in o.steps){
    const q=QID.has(k)&&qById(k); if(!q||!Array.isArray(o.steps[k]))continue;
    S.steps[k]=[...new Set(o.steps[k].filter(i=>Number.isInteger(i)&&i>=0&&i<q.steps.length))];
  }
  if(isObj(o.verified))for(const k in o.verified){if(QID.has(k)&&VERIFY[k]&&o.verified[k]===true)S.verified[k]=true;}
  if(isObj(o.sos))for(const k in o.sos){if(QID.has(k)&&o.sos[k])S.sos[k]=1;}
  if(Array.isArray(o.seen))S.seen=o.seen.filter(x=>typeof x==='string'&&SPRITES[x]);
  else S.seen=quests().filter(q=>S.done[q.id]&&q.unlock).map(q=>q.unlock); // 기존 세이브: 이미 출근한 동료는 본 것으로
  S.tab=(typeof o.tab==='string'&&(TRACK_NAME[o.tab]||o.tab==='office'))?o.tab:null;
  const t0=+o.t0; S.t0=Number.isFinite(t0)&&t0>0&&t0<=Date.now()+864e5?t0:null;
  S.sfx=typeof o.sfx==='boolean'?o.sfx:true;
  S.vibe=typeof o.vibe==='boolean'?o.vibe:true;
  return S;
}
function readStore(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
let storeWarned=false;
function save(){
  try{localStorage.setItem(KEY,JSON.stringify(S));}
  catch(e){if(!storeWarned){storeWarned=true;toast('이 브라우저에 저장할 수 없어요. 세이브 코드로 백업하세요');}}
}
const hasSave=o=>!!(o&&o.nick&&o.cls&&o.os);
let S=normalize(readStore());
if(hasSave(S)&&!S.t0){S.t0=Date.now();save();}   // 기존 세이브: 첫 로드 시각을 Day 1로
SFX.set({sfx:S.sfx,vibe:S.vibe});

/* ---------- 계산 ---------- */
const tracksOf=()=>CLASSES[S.cls].tracks;
const myQuests=()=>quests().filter(q=>tracksOf().includes(q.track));
const xpOf=q=>S.verified[q.id]?Math.round(q.xp*1.2):q.xp;
const xpTotal=()=>quests().filter(q=>S.done[q.id]).reduce((a,q)=>a+xpOf(q),0);
function level(xp){let l=1;LV.forEach((t,i)=>{if(xp>=t)l=i+1;});return Math.min(l,LV.length);}
function chapterQuests(track,chap){return quests().filter(q=>q.track===track&&q.chap===chap);}
function chapterDone(track,chap){return chapterQuests(track,chap).every(q=>S.done[q.id]);}
function chapterOpen(track,chap){return chap===0||chapterDone(track,chap-1);}
function questOpen(q){return chapterOpen(q.track,q.chap);}
function nextQuest(track){return quests().find(q=>q.track===track&&!S.done[q.id]&&questOpen(q));}
function nextAny(){
  const t=(S.tab&&S.tab!=='office')?S.tab:null;
  return (t&&nextQuest(t))||tracksOf().map(nextQuest).find(Boolean)||null;
}
function officeSlots(){
  const tr=tracksOf(); const ids=new Set(quests().filter(q=>q.unlock&&tr.includes(q.track)).map(q=>q.unlock));
  return OFFICE.filter(([k])=>ids.has(k));
}
function unlockedSet(){return new Set(quests().filter(q=>S.done[q.id]&&q.unlock).map(q=>q.unlock));}
function dayInfo(){
  const day=Math.max(1,Math.floor((Date.now()-(S.t0||Date.now()))/864e5)+1);
  const left=myQuests().filter(q=>!S.done[q.id]).length;
  if(day>14)return {day,label:`Day ${day}`,rec:null};
  return {day,label:`Day ${day}/14`,rec:left?Math.ceil(left/(14-day+1)):0};
}

/* ---------- 토스트(큐) ---------- */
const toastQ=[]; let toastBusy=false, fxBusy=false;
function toast(m,opt={}){toastQ.push({m,...opt});pumpToast();}
function pumpToast(){
  if(toastBusy||fxBusy||!toastQ.length)return;
  const t=toastQ.shift(), e=$('#toast'); toastBusy=true;
  e.textContent=t.m; e.classList.toggle('tapme',!!t.onTap); e.onclick=t.onTap||null;
  e.classList.add('on'); const gen=++toastGen;
  setTimeout(()=>{if(gen!==toastGen)return;e.classList.remove('on');setTimeout(()=>{if(gen!==toastGen)return;toastBusy=false;pumpToast();},280);},t.sticky?8000:2400);
}
let toastGen=0;
function clearToast(){toastQ.length=0;toastGen++;toastBusy=false;const e=$('#toast');e.classList.remove('on');e.onclick=null;}

/* ---------- 레이어(시트/카드) + 뒤로가기 ---------- */
const layers=[]; let skipPop=0; const onCloseHooks=new Map();
function syncScrim(){
  $('#scrim').classList.toggle('on',layers.length>0);
  document.body.classList.toggle('lock',layers.length>0);
}
function showEl(el){el.classList.add('on');}
function hideEl(el){el.classList.remove('on');}
function openLayer(el,onClose){
  if(layers.includes(el))return;
  layers.push(el);showEl(el);if(onClose)onCloseHooks.set(el,onClose);else onCloseHooks.delete(el);
  history.pushState({layer:layers.length},'');syncScrim();
}
function swapLayer(el,onClose){ // 같은 히스토리 칸을 재사용해 교체
  const top=layers.pop(); if(top){hideEl(top);onCloseHooks.delete(top);}
  if(!top){openLayer(el,onClose);return;}
  layers.push(el);showEl(el);if(onClose)onCloseHooks.set(el,onClose);else onCloseHooks.delete(el);syncScrim();
}
function popLayer(){
  const el=layers.pop(); if(!el)return; hideEl(el); syncScrim();
  const h=onCloseHooks.get(el); onCloseHooks.delete(el); if(h)h();
}
function closeLayer(){ if(!layers.length)return; skipPop++; history.back(); popLayer(); }
window.addEventListener('popstate',()=>{ if(skipPop>0){skipPop--;return;} popLayer(); });
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&layers.length)closeLayer();});
$('#scrim').onclick=()=>closeLayer();
// 시트 아래로 스와이프해서 닫기
$$('.sheet').forEach(sh=>{
  const g=sh.querySelector('.grab'); let y0=null;
  g.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;},{passive:true});
  g.addEventListener('touchmove',e=>{if(y0==null)return;const dy=e.touches[0].clientY-y0;if(dy>0)sh.style.transform=`translateY(${dy}px)`;},{passive:true});
  g.addEventListener('touchend',e=>{if(y0==null)return;const dy=(e.changedTouches[0].clientY-y0);sh.style.transform='';y0=null;if(dy>80&&layers[layers.length-1]===sh)closeLayer();});
});

/* ---------- 효과음: 모든 버튼 탭 ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&!b.dataset.nosfx)SFX.fx('tap');},true);

/* ---------- 화면 전환 ---------- */
function show(id){['title','wizard','app'].forEach(x=>$('#'+x).classList.toggle('hidden',x!==id));window.scrollTo(0,0);}

/* ---------- 타이틀 ---------- */
function renderTitle(){
  $('#titleHero').innerHTML=sprite(SPRITES.hero,{},8);
  const has=hasSave(S);
  $('#tapStart').classList.toggle('hidden',has);
  $('#titleActions').classList.toggle('hidden',!has);
  show('title');
}
$('#title').onclick=e=>{ if(hasSave(S))return; if(e.target.closest('button'))return; SFX.fx('tap'); startWizard(); };
$('#continueBtn').onclick=()=>enterApp();
$('#newBtn').onclick=()=>{ if(confirm('지금까지의 진행 상황이 지워지고 처음부터 시작합니다. 계속할까요?')){ const keep={sfx:S.sfx,vibe:S.vibe}; draft=normalize(keep); wzStep=0; renderWizard(); show('wizard'); } };

/* ---------- 캐릭터 생성 위저드 ---------- */
let draft=null, wzStep=0;
function startWizard(){draft=normalize({sfx:S.sfx,vibe:S.vibe});wzStep=0;renderWizard();show('wizard');}
const CLS_KEYS=()=>Object.keys(CLASSES).sort((a,b)=>(CLASSES[a].hidden?1:0)-(CLASSES[b].hidden?1:0));
function clsCard(k){
  const c=CLASSES[k];
  return `<div class="cls-card ${draft.cls===k?'on':''} ${c.hidden?'hid':''}" data-c="${k}">
    <div class="cls-top">${sprite(SPRITES[c.spr],{},6)}<div>${c.hidden?'<span class="px small muted">HIDDEN</span>':''}<b>${esc(c.name)}</b></div></div>
    <span class="motto">${esc(c.motto)}</span>
    ${Object.entries(c.stats).map(([n,v])=>`<span class="stat"><span style="width:44px">${esc(n)}</span><i style="--v:${v*20}%"></i></span>`).join('')}
    <div class="route">${c.ranks.map(r=>esc(r[1])).join(' → ')}</div>
    <details><summary>상세</summary>${esc(c.desc)}<br>주무기: ${esc(c.weapon)}<br>시작 장비: ${esc(c.item)}<br>추천: ${esc(c.fit)}</details>
  </div>`;
}
function renderWizard(){
  clearToast();
  $('#wzBack').innerHTML=icon('back',20);
  $$('#wzDots i').forEach((d,i)=>d.classList.toggle('on',i<=wzStep));
  const b=$('#wzBody'); const next=$('#wzNext');
  if(wzStep===0){
    b.innerHTML=`<div class="wz-step"><h2>1. 이름</h2><p class="muted small">길드에서 불릴 닉네임을 정하세요. (최대 16자)</p>
      <input id="nick" type="text" maxlength="16" placeholder="길드에서 불릴 닉네임" autocomplete="nickname" enterkeyhint="next" value="${esc(draft.nick)}"></div>`;
    const n=$('#nick'); n.oninput=()=>{draft.nick=n.value;}; n.onkeydown=e=>{if(e.key==='Enter')next.click();};
    next.textContent='다음 ▶';
  }else if(wzStep===1){
    const keys=CLS_KEYS(); if(!draft.cls)draft.cls=keys[0];
    b.innerHTML=`<div class="wz-step"><h2>2. 어떤 길을 걸을까?</h2><p class="muted small">옆으로 넘겨 보세요. 마일스톤 퀘스트를 깨면 전직합니다. 직업은 나중에 메뉴에서 바꿀 수 있어요.</p>
      <div class="cdots" id="cdots">${keys.map(k=>`<i class="${draft.cls===k?'on':''}"></i>`).join('')}</div>
      <div class="carousel" id="car">${keys.map(clsCard).join('')}</div></div>`;
    const car=$('#car');
    // 캐러셀 컨테이너 기준 좌표(offsetLeft 는 body 기준이라 가운데 여백만큼 어긋남)
    const mark=k=>{const best=keys.indexOf(k);draft.cls=k;[...car.children].forEach((c,i)=>c.classList.toggle('on',i===best));$$('#cdots i').forEach((d,i)=>d.classList.toggle('on',i===best));};
    let clickAt=0; // 카드 탭 후 부드러운 스크롤 동안만 자동 판정 보류. 사용자가 직접 넘기면 즉시 해제
    ['pointerdown','touchstart','wheel'].forEach(ev=>car.addEventListener(ev,()=>{clickAt=0;},{passive:true}));
    const pick=()=>{ if(Date.now()-clickAt<900)return;
      const cr=car.getBoundingClientRect(), mid=cr.left+car.clientLeft+car.clientWidth/2; let best=0,bd=1e9;
      [...car.children].forEach((c,i)=>{const r=c.getBoundingClientRect();const d=Math.abs(r.left+r.width/2-mid);if(d<bd){bd=d;best=i;}});
      mark(keys[best]);};
    let st; car.addEventListener('scroll',()=>{clearTimeout(st);st=setTimeout(pick,80);},{passive:true});
    const centerOn=(el,smooth)=>{const cr=car.getBoundingClientRect(),r=el.getBoundingClientRect();
      const left=car.scrollLeft+(r.left-cr.left-car.clientLeft)-(car.clientWidth-r.width)/2;
      car.scrollTo({left,behavior:smooth&&!RM()?'smooth':'auto'});};
    car.querySelectorAll('.cls-card').forEach(c=>c.onclick=e=>{if(e.target.closest('summary,details'))return;clickAt=Date.now();mark(c.dataset.c);centerOn(c,true);});
    requestAnimationFrame(()=>{const el=car.querySelector(`[data-c="${draft.cls}"]`);if(el){centerOn(el,false);mark(draft.cls);}});
    next.textContent='이 직업으로 ▶';
  }else{
    b.innerHTML=`<div class="wz-step"><h2>3. 내 컴퓨터</h2><p class="muted small">설치 명령어가 운영체제에 맞게 바뀝니다. 나중에 메뉴에서 바꿀 수 있어요.</p>
      <div class="os-pick" id="osPick"><button data-os="mac" class="${draft.os==='mac'?'on':''}">Mac</button><button data-os="win" class="${draft.os==='win'?'on':''}">Windows</button></div></div>`;
    $$('#osPick button').forEach(x=>x.onclick=()=>{draft.os=x.dataset.os;$$('#osPick button').forEach(y=>y.classList.toggle('on',y===x));});
    next.textContent='모험 시작 ▶';
  }
}
$('#wzBack').onclick=()=>{if(wzStep>0){wzStep--;renderWizard();}else renderTitle();};
$('#wzNext').onclick=()=>{
  if(wzStep===0){draft.nick=($('#nick').value||'').trim().slice(0,16);if(!draft.nick){toast('닉네임을 적어주세요');SFX.fx('error');return;}}
  if(wzStep===1&&!draft.cls){toast('직업을 골라주세요');return;}
  if(wzStep===2){
    if(!draft.os){toast('컴퓨터를 골라주세요');SFX.fx('error');return;}
    S=normalize({...draft,done:{},badges:[],steps:{},verified:{},sos:{},seen:[],t0:Date.now()});
    S.tab=CLASSES[S.cls].tracks[0]; save(); enterApp(); return;
  }
  wzStep++;renderWizard();
};

/* ---------- 앱 ---------- */
function enterApp(){
  if(!hasSave(S)){renderTitle();return;}
  if(!S.tab||(S.tab!=='office'&&!tracksOf().includes(S.tab)))S.tab=tracksOf()[0];
  show('app'); $('#menuBtn').innerHTML=icon('menu',22); refresh(); scrollToCurrent();
}
function refresh(){renderHUD();renderTabbar();renderView();renderCTA();}
function renderHUD(animate){
  const xp=xpTotal(),lv=level(xp),max=lv>=LV.length,lo=LV[lv-1]||0,hi=max?lo:LV[lv];
  $('#hudAvatar').innerHTML=sprite(SPRITES[CLASSES[S.cls].spr],{},4);
  $('#hudName').textContent=S.nick;
  $('#hudDay').textContent=dayInfo().label;
  const rk=rankOf(S.cls,S.done)[1], cn=CLASSES[S.cls].name;
  $('#hudCls').textContent=rk===cn?rk:rk+' · '+cn;
  $('#hudLv').textContent='Lv.'+lv;
  const bar=$('#xpBar'); if(!animate){bar.style.transition='none';}
  bar.style.width=(max?100:Math.min(100,(xp-lo)/(hi-lo)*100))+'%';
  if(!animate){void bar.offsetWidth;bar.style.transition='';}
  $('#xpTxt').textContent=max?`MAX · ${xp} XP`:`${xp} / ${hi} XP`;
}
function renderTabbar(){
  const tabs=[...tracksOf(),'office'];
  const unseen=officeSlots().some(([k])=>unlockedSet().has(k)&&!S.seen.includes(k));
  $('#tabbar').innerHTML=tabs.map(t=>`<button data-t="${t}" class="${S.tab===t?'on':''}" aria-label="${t==='office'?'사무실':esc(TRACK_NAME[t])}">${icon(t,22)}<span>${t==='office'?'사무실':esc(TRACK_SHORT[t])}</span>${t==='office'&&unseen?'<i class="dot"></i>':''}</button>`).join('');
  $$('#tabbar button').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;save();renderTabbar();renderView();renderCTA();window.scrollTo(0,0);scrollToCurrent();});
}
function renderCTA(){
  const c=$('#nextCta'), q=nextAny();
  if(!q){c.classList.add('hidden');return;}
  const di=dayInfo();
  c.classList.remove('hidden');
  c.innerHTML=`<span class="t">다음 ▶ ${esc(q.title)}</span>${di.rec?`<small>오늘 추천 ${di.rec}개 · ${esc(TRACK_SHORT[q.track])}</small>`:''}`;
  c.onclick=()=>openQuest(q.id);
}
function renderView(){ if(S.tab==='office')renderOffice(); else renderMap(S.tab); }

/* ---------- 퀘스트 맵 ---------- */
const OFFS=[0,60,0,-60];
function renderMap(t){
  let html='';
  const cur=nextQuest(t);
  Q.filter(c=>c.ch===t).forEach(c=>{
    const qs=chapterQuests(t,c.chap), open=chapterOpen(t,c.chap), n=qs.filter(q=>S.done[q.id]).length;
    const mates=qs.filter(q=>q.unlock).map(q=>(OFFICE.find(o=>o[0]===q.unlock)||[,''])[1]);
    const bdg=qs.filter(q=>q.badge).map(q=>q.badge);
    const reward=!open&&(mates.length||bdg.length)?`<div class="reward">${icon('lock',14)}<span>이 장을 깨면: ${[mates.join(', '),bdg.join(', ')].filter(Boolean).map(esc).join(' · ')}</span></div>`:'';
    html+=`<section class="chapter ${open?'':'locked'}"><div class="ch-banner"><div class="r1"><span class="ch-num">CH.${c.chap}</span><span class="ch-prog">${open?`${n}/${qs.length}`:'잠김'}</span></div>
      <div class="ch-title">${esc(c.chapName)}</div>${c.season2?'<span class="s2">시즌 2 · 등록증·첫 매출 이후</span>':''}${reward}</div>`;
    // 노드 배치
    let y=24; const pts=[]; let nodes='';
    qs.forEach((q,i)=>{
      const size=q.boss?72:56, x=OFFS[i%OFFS.length];
      const cy=y+size/2; pts.push([x,cy]);
      const d=S.done[q.id], isCur=cur&&cur.id===q.id;
      const cls=['node',q.boss?'boss':'',d?'done':'',open?'':'lockd',isCur?'cur':''].join(' ');
      const ic=!open?icon('lock',22):d?icon('check',24):q.boss?icon('skull',32):icon('bang',22);
      nodes+=`<button class="${cls}" data-q="${q.id}" style="top:${y}px;left:calc(50% + ${x}px)" aria-label="${esc(q.title)}${d?' (완료)':''}${open?'':' (잠김)'}">
        <span class="orb">${ic}${S.verified[q.id]?'<span class="vtag">검증</span>':''}</span><span class="nt">${esc(q.title)}</span><span class="nx">+${xpOf(q)} XP</span></button>`;
      y+=size+70;
    });
    const H=y-20;
    const poly=pts.map(([x,yy])=>`${x+120},${yy}`).join(' ');
    html+=`<div class="path" style="height:${H}px"><svg class="road" width="240" height="${H}" viewBox="0 0 240 ${H}" aria-hidden="true"><polyline points="${poly}" fill="none" stroke="#3a5a4e" stroke-width="4" stroke-dasharray="8 8"/></svg>${nodes}</div></section>`;
  });
  html+=`<footer>${t==='finance'?'재테크 트랙은 금융 교육용 체크리스트입니다. 특정 상품·종목 추천이나 투자 자문이 아니며, 최종 판단은 본인 몫입니다.<br>':''}진행 상황은 이 기기에 저장됩니다. 다른 기기로 옮길 땐 메뉴의 세이브 코드를 쓰세요.</footer>`;
  $('#view').innerHTML=html;
  $$('#view .node').forEach(b=>b.onclick=()=>{
    const q=qById(b.dataset.q);
    if(!questOpen(q)){toast('이전 장을 깨면 열려요');SFX.fx('error');return;}
    openQuest(q.id);
  });
}
function scrollToCurrent(){
  requestAnimationFrame(()=>{const el=$('#view .node.cur');if(!el)return;
    const r=el.getBoundingClientRect(); if(r.top>window.innerHeight*0.25&&r.bottom<window.innerHeight*0.7)return;
    el.scrollIntoView({block:'center',behavior:RM()?'auto':'smooth'});});
}

/* ---------- 사무실 ---------- */
function renderOffice(){
  const un=unlockedSet(), slots=officeSlots();
  const fresh=slots.filter(([k])=>un.has(k)&&!S.seen.includes(k)).map(([k])=>k);
  let html=`<p class="office-cap">내 사무실 — 동료 ${slots.filter(([k])=>un.has(k)).length}/${slots.length}명 출근</p><div class="office"><div class="wall"><span class="win"></span><span class="win"></span><span class="plant">${sprite(PLANT,{},4)}</span></div><div class="desks">`;
  html+=`<button class="desk" data-me="1" style="--d:${(Math.random()*.8).toFixed(2)}s">${sprite(SPRITES[CLASSES[S.cls].spr])}<div class="table"></div><div class="nm">${esc(S.nick)}</div></button>`;
  slots.forEach(([k,n])=>{
    const on=un.has(k);
    html+=`<button class="desk ${on?'':'empty'} ${fresh.includes(k)&&!RM()?'drop':''}" data-k="${k}" style="--d:${(Math.random()*.8).toFixed(2)}s">${sprite(SPRITES[k])}${on?'':`<span class="lk">${icon('lock',16)}</span>`}<div class="table"></div><div class="nm">${on?esc(n):'???'}</div></button>`;
  });
  html+='</div></div>';
  $('#view').innerHTML=html;
  if(fresh.length){S.seen=[...new Set([...S.seen,...fresh])];save();renderTabbar();}
  $$('#view .desk').forEach(d=>d.onclick=()=>{
    $$('#view .bubble').forEach(x=>x.remove());
    let txt;
    if(d.dataset.me)txt=`${esc(S.nick)} 대표. 오늘도 결재 대기 중.`;
    else{const k=d.dataset.k,q=quests().find(x=>x.unlock===k);
      txt=un.has(k)?`<b>${esc(q.title)}</b>에서 합류<br>첫 업무: ${esc(FIRSTJOB[k]||'')}`:`아직 빈자리. <b>${esc(q.title)}</b>를 깨면 출근한다.`;}
    const b=document.createElement('div');b.className='bubble';b.innerHTML=txt;d.appendChild(b);
    setTimeout(()=>b.remove(),3200);
  });
}

/* ---------- 퀘스트 시트 ---------- */
let curQ=null, copies=[];
const phMark=h=>h.replace(/\[[^\]\n]{1,40}\]/g,m=>`<mark class="ph" title="여기를 내 상황으로 바꾸세요">${m}</mark>`);
const cmdText=c=>typeof c==='string'?c:(c[S.os]||c.mac);
function stepsOf(id){return S.steps[id]||(S.steps[id]=[]);}
function openQuest(id,swap){
  const q=qById(id); if(!q)return; curQ=q; copies=[];
  const d=!!S.done[id], chk=new Set(d?q.steps.map((_,i)=>i):stepsOf(id));
  const cp=t=>{copies.push(t);return copies.length-1;};
  const steps=q.steps.map((s,i)=>{
    let body;
    if(typeof s==='string')body=`<span class="tx">${esc(s)}</span>`;
    else{
      body=`<span class="tx">${esc(s.t)}</span>`;
      if(s.keys)body+=`<div class="keys">${esc(cmdText(s.keys)).split(' → ').map(k=>`<kbd>${k}</kbd>`).join('<span class="arr">→</span>')}</div>`;
      if(s.cmd){const t=cmdText(s.cmd);body+=`<div class="cmd"><code>${phMark(esc(t))}</code><button data-ci="${cp(t)}">복사</button></div>`;}
      if(s.link)body+=`<div><a class="btn ghost linkbtn" href="${esc(s.link[1])}" target="_blank" rel="noopener">${esc(s.link[0])} ↗</a></div>`;
      if(s.file)body+=`<pre class="file">${esc(s.file)}</pre><button class="copyb" data-ci="${cp(s.file)}">내용 복사</button>`;
    }
    const on=chk.has(i);
    return `<li class="${on?'ok':''}"><button class="chk" role="checkbox" aria-checked="${on}" aria-label="${i+1}단계 완료" data-si="${i}" data-nosfx="1" ${d?'disabled':''}><i>${on?icon('check',18):''}</i></button><div class="st"><span class="no">${i+1}.</span>${body}</div></li>`;
  }).join('');
  const calc=q.calc?`<div class="calc">
    <label>목표 금액(만원)<input type="number" inputmode="decimal" id="cGoal" value="5000"></label>
    <label>기간(년)<input type="number" inputmode="decimal" id="cYears" value="3" min="1"></label>
    <label>지금 모아둔 돈(만원)<input type="number" inputmode="decimal" id="cNow" value="0"></label>
    <label>예상 연수익률(%)<input type="number" inputmode="decimal" id="cRate" value="3" step="0.5"></label>
    <div class="out" id="cOut"></div>
    <div class="small muted" style="grid-column:1/-1">수익률은 가정일 뿐이다. 보수적으로 잡을수록 안전하다. 입력한 숫자는 저장되지 않는다.</div></div>`:'';
  const ver=VERIFY[id]&&(!d||S.verified[id])?`<div class="verify"><b class="px small">결과 붙여넣기 (선택 · 검증 시 XP +20%)</b>
    ${S.verified[id]?'<div class="msg"><span class="stamp">✓ 검증됨</span></div>':`<div class="row"><input type="text" id="vIn" placeholder="터미널에 나온 결과를 붙여넣기" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn ghost" id="vBtn">확인</button></div><div class="msg" id="vMsg"></div>`}</div>`:'';
  const hp=q.boss?`<div class="hp" id="hp"><div class="lab"><span>BOSS HP</span><span id="hpTxt"></span></div><div class="track"><i id="hpBar"></i></div></div>`:'';
  $('#qBody').innerHTML=`
    <div class="px small muted">${esc(TRACK_NAME[q.track])} · CH.${q.chap}${q.boss?' · BOSS':''}</div>
    <h2>${esc(q.title)}</h2>${hp}
    <div class="story">${esc(q.story)}</div>
    <ol class="steps">${steps}</ol>
    ${calc}${ver}
    ${q.tip?`<div class="tip">💡 ${esc(q.tip)}</div>`:''}
    ${q.warn?`<div class="warn">⚠ ${esc(q.warn)}</div>`:''}
    <div class="clear"><b>클리어 조건</b><br>${esc(q.clear)}</div>`;
  $('#qBody').scrollTop=0;
  $$('#qBody [data-ci]').forEach(b=>b.onclick=()=>copy(copies[+b.dataset.ci],'복사했어요'));
  $$('#qBody .chk').forEach(b=>b.onclick=()=>toggleStep(q,+b.dataset.si,b));
  if(q.calc){['cGoal','cYears','cNow','cRate'].forEach(i=>$('#'+i).oninput=calcRun);calcRun();}
  if($('#vBtn')){const run=()=>verifyRun(q);$('#vBtn').onclick=run;$('#vIn').onkeydown=e=>{if(e.key==='Enter')run();};}
  renderBar(q); updateHP(q,false);
  const el=$('#qSheet'); if(swap)swapLayer(el); else if(layers[layers.length-1]===el){} else openLayer(el);
}
function remaining(q){return S.done[q.id]?0:q.steps.length-stepsOf(q.id).length;}
function renderBar(q){
  const d=!!S.done[q.id], left=remaining(q), xp=xpOf(q);
  $('#qBar').innerHTML=`<button class="iconbtn" id="closeQ" aria-label="닫기">${icon('close',18)}</button><button class="iconbtn sosb" id="sosBtn" aria-label="막혔어요 SOS">${icon('sos',18)}<span>SOS</span></button>`+
    (d?`<button class="btn ghost wide" id="undoQ">완료 취소</button>`:`<button class="btn mint wide" id="doneQ" ${left?'disabled':''}>${left?`남은 단계 ${left}개`:`클리어! +${xp} XP${S.verified[q.id]?' (검증 +20%)':''}`}</button>`);
  $('#closeQ').onclick=closeLayer;
  $('#sosBtn').onclick=()=>sos(q);
  if($('#doneQ'))$('#doneQ').onclick=()=>complete(q);
  if($('#undoQ'))$('#undoQ').onclick=()=>{delete S.done[q.id];save();refresh();openQuest(q.id,true);toast('완료를 취소했어요');};
}
function updateHP(q,hit){
  if(!q.boss)return; const tot=q.steps.length, left=remaining(q);
  $('#hpTxt').textContent=`${left}/${tot}`; $('#hpBar').style.width=(left/tot*100)+'%';
  if(hit&&!RM()){const h=$('#qSheet');h.classList.remove('hit');void h.offsetWidth;h.classList.add('hit');}
}
function toggleStep(q,i,btn){
  const arr=stepsOf(q.id), k=arr.indexOf(i);
  if(k>=0)arr.splice(k,1); else arr.push(i);
  save();
  const on=k<0; btn.setAttribute('aria-checked',on); btn.querySelector('i').innerHTML=on?icon('check',18):''; btn.closest('li').classList.toggle('ok',on);
  if(on){SFX.play('check');SFX.vibe('tap');}else SFX.fx('tap');
  renderBar(q); updateHP(q,on);
}
function verifyRun(q){
  const v=$('#vIn').value, m=$('#vMsg');
  if(!v.trim()){m.textContent='결과를 붙여넣어 주세요.';return;}
  if(VERIFY[q.id].test(v)){
    S.verified[q.id]=true; save(); SFX.play('check');
    m.innerHTML='<span class="stamp">✓ 검증됨</span>'; $('#vIn').closest('.row').remove();
    renderBar(q);
  }else{ m.textContent='출력이 예상과 달라요 — SOS를 눌러 그대로 보내주세요'; m.style.color='var(--red)'; SFX.fx('error'); }
}
function sos(q){
  const arr=S.steps[q.id]||[], last=arr.length?arr[arr.length-1]+1:null;
  S.sos[q.id]=1; save();
  copy(`[SOS] ${q.id} ${q.title} / ${S.os==='mac'?'Mac':'Windows'} / Lv.${level(xpTotal())} / 마지막 체크: ${last?last+'단계':'없음'}\n어느 단계에서: \n화면에 나온 메시지(복사 또는 캡처): \n`,'SOS 양식을 복사했어요. 길드 단톡방에 붙여넣고 캡처를 같이 올려주세요');
}
function calcRun(){
  const yrs=+$('#cYears').value;
  if(!(yrs>=1)){$('#cOut').textContent='기간은 1년 이상으로 입력해 주세요';return;}
  const goal=(+$('#cGoal').value||0)*1e4, n=Math.round(yrs*12), now=(+$('#cNow').value||0)*1e4, r=(+$('#cRate').value||0)/100/12;
  const fvNow=now*Math.pow(1+r,n), need=Math.max(0,goal-fvNow);
  const pmt=Math.abs(r)<1e-9?need/n:need*r/(Math.pow(1+r,n)-1);
  $('#cOut').textContent=Number.isFinite(pmt)&&pmt>=0?`매달 약 ${Math.ceil(pmt/1e4).toLocaleString()}만원`:'입력값을 확인해 주세요';
}

/* ---------- 클리어 + 연출 큐 ---------- */
let pendingJob=null;
function complete(q){
  if(S.done[q.id]||remaining(q))return;
  const xp0=xpTotal(), lv0=level(xp0), r0=rankOf(S.cls,S.done);
  S.done[q.id]=Date.now();
  const got=[];
  if(q.badge&&!S.badges.includes(q.badge)){S.badges.push(q.badge);got.push(q.badge);}
  if(S.sos[q.id]&&!S.badges.includes('구조 요청 성공')){S.badges.push('구조 요청 성공');got.push('구조 요청 성공');}
  save();
  const lv1=level(xpTotal()), r1=rankOf(S.cls,S.done);
  pendingJob=r0[1]!==r1[1]?[r0,r1]:null;
  // 1) 시트 숨김(히스토리 칸은 결과 카드가 이어 씀) 2) 플래시·스탬프·파티클 3) 결과 카드
  const sheet=$('#qSheet'); hideEl(sheet);
  fxBusy=true; SFX.fx(q.boss?'boss':'clear');
  const fx=$('#fx');
  if(!RM()){
    const cols=['#7fd6b2','#f5c542','#F0703C'];
    let p='<div class="flash"></div>';
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2,dist=90+Math.random()*50;p+=`<i class="pt" style="background:${cols[i%3]};--x:${Math.cos(a)*dist}px;--y:${Math.sin(a)*dist}px"></i>`;}
    fx.innerHTML=p+`<div class="fx-stamp">${q.boss?'BOSS DEFEATED':'QUEST CLEAR'}</div>`;
  }
  setTimeout(()=>{
    fx.innerHTML=''; fxBusy=false;
    showResult(q,got,lv1>lv0);
    renderHUD(true); renderTabbar(); renderView(); renderCTA();
    floatXP(xpOf(q));
    if(lv1>lv0){const b=$('#hudLv');b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse');setTimeout(()=>SFX.play('levelup'),250);}
    pumpToast();
  },RM()?0:700);
}
function floatXP(n){
  if(RM())return;
  const e=document.createElement('div'); e.className='floatxp'; e.textContent=`+${n} XP`;
  const t=$('#xpBar').getBoundingClientRect();
  e.style.left=(window.innerWidth/2-40)+'px'; e.style.top=(window.innerHeight*0.35)+'px';
  document.body.appendChild(e);
  const dx=t.left+20-(window.innerWidth/2-40), dy=t.top-window.innerHeight*0.35;
  const an=e.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx}px,${dy}px)`,opacity:.2}],{duration:800,easing:'steps(8)'});
  an.onfinish=()=>e.remove();
}
function showResult(q,got,lvUp){
  const nx=nextAny(), mate=q.unlock?OFFICE.find(o=>o[0]===q.unlock):null;
  const lv=level(xpTotal());
  $('#resultCard').innerHTML=`
    <div class="res-title">${q.boss?'BOSS DEFEATED':'QUEST CLEAR'}</div>
    <div class="muted small">${esc(q.title)}</div>
    <div class="res-xp">+${xpOf(q)} XP${S.verified[q.id]?`<small>검증 보너스 +${xpOf(q)-q.xp} XP 포함</small>`:''}</div>
    ${lvUp?`<div class="px" style="color:var(--gold)">LEVEL UP! Lv.${lv}</div>`:''}
    <div class="res-items">
      ${got.map(b=>`<span class="badge">${icon('medal',14)} ${esc(b)}</span>`).join('')}
      ${mate?`<div class="newmate">${sprite(SPRITES[mate[0]],{},5)}<div style="text-align:left"><b class="px" style="color:var(--mint)">새 동료 출근!</b><br>${esc(mate[1])}</div></div>`:''}
    </div>
    <div class="btnrow">
      ${nx?`<button class="btn mint" id="resNext">다음 퀘스트 ▶</button>`:''}
      <button class="btn ghost" id="resMap">맵으로</button>
    </div>`;
  const after=action=>{ // 전직이 있으면 결과 카드 뒤에 순차 재생
    if(pendingJob){const [a,b]=pendingJob;pendingJob=null;showJob(a,b,action);}
    else if(action==='next'&&nx)openQuest(nx.id,true);
    else closeLayer();
  };
  // 히스토리 칸은 시트가 쓰던 칸을 이어받는다
  const top=layers[layers.length-1];
  if(top===$('#qSheet')){layers.pop();layers.push($('#resultCard'));showEl($('#resultCard'));syncScrim();}
  else openLayer($('#resultCard'));
  onCloseHooks.set($('#resultCard'),()=>{ if(pendingJob){const [a,b]=pendingJob;pendingJob=null;setTimeout(()=>showJob(a,b,'map',true),50);} });
  if($('#resNext'))$('#resNext').onclick=()=>after('next');
  $('#resMap').onclick=()=>after('map');
}
function showJob(r0,r1,action,fresh){
  SFX.fx('jobup');
  $('#jobCard').innerHTML=`
    <div class="px small muted">JOB ADVANCEMENT</div>
    <div class="glow">${sprite(SPRITES[CLASSES[S.cls].spr],{},9)}</div>
    <div class="big">전직 완료!</div>
    <div class="muted">${esc(r0[1])} → <b style="color:var(--gold)">${esc(r1[1])}</b></div>
    <div class="story">${esc(r1[2])}</div>
    <div class="btnrow"><button class="btn" id="closeJob">계속하기 ▶</button></div>`;
  if(fresh)openLayer($('#jobCard')); else swapLayer($('#jobCard'));
  const nx=nextAny();
  $('#closeJob').onclick=()=>{ if(action==='next'&&nx)openQuest(nx.id,true); else closeLayer(); };
  renderHUD();
}

/* ---------- 메뉴 ---------- */
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function saveCode(){return btoa(unescape(encodeURIComponent(JSON.stringify(S))));}
function progressCard(){
  const lv=level(xpTotal()), my=myQuests(), x=my.filter(q=>S.done[q.id]).length, un=unlockedSet();
  const n=officeSlots().filter(([k])=>un.has(k)).length, nx=nextAny();
  return `[레벨업 길드] ${S.nick} · ${rankOf(S.cls,S.done)[1]} · Lv.${lv} · 완료 ${x}/${my.length} · 사무실 ${n}명 출근 · 다음: ${nx?nx.title:'모두 완료'}`;
}
function openMenu(){
  const my=myQuests(), x=my.filter(q=>S.done[q.id]).length;
  const install=isStandalone()?'<p class="small muted">이미 홈 화면 앱으로 실행 중이에요.</p>':
    deferredInstall?'<button class="btn mint" id="installBtn" style="width:100%">홈 화면에 추가</button>':
    isIOS()?'<p class="small">Safari 아래쪽 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 누르면 앱처럼 쓸 수 있어요. 오프라인에서도 열립니다.</p>':
    '<p class="small">브라우저 메뉴(⋮)에서 <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 누르세요.</p>';
  $('#menuBody').innerHTML=`
    <div class="menu-sec"><h3>${icon('disk',16)} 세이브 코드</h3>
      <p class="small muted">다른 기기에서 이어하거나 길드 마스터에게 진행 상황을 보낼 때 씁니다. (${x}/${my.length} 퀘스트, ${xpTotal()} XP)</p>
      <textarea id="codeOut" rows="3" readonly>${esc(saveCode())}</textarea>
      <div class="btnrow"><button class="btn ghost" id="cpCode">코드 복사</button></div>
      <textarea id="codeIn" rows="2" placeholder="세이브 코드 붙여넣기" style="margin-top:10px" autocapitalize="off" spellcheck="false"></textarea>
      <div class="btnrow"><button class="btn" id="loadCode">불러오기</button></div></div>
    <div class="menu-sec"><h3>${icon('medal',16)} 진행 카드</h3>
      <p class="small muted" id="pcard">${esc(progressCard())}</p>
      <div class="btnrow"><button class="btn ghost" id="cpCard">진행 카드 복사</button></div>
      ${S.badges.length?`<div class="btnrow" style="gap:6px">${S.badges.map(b=>`<span class="badge">${esc(b)}</span>`).join('')}</div>`:''}</div>
    <div class="menu-sec"><h3>${icon('gear',16)} 설정</h3>
      <div class="mrow"><span>효과음</span><button class="toggle" role="switch" id="tgSfx" aria-checked="${S.sfx}" aria-label="효과음"></button></div>
      <div class="mrow"><span>진동</span><button class="toggle" role="switch" id="tgVibe" aria-checked="${S.vibe}" aria-label="진동"></button></div>
      <div class="mrow"><span>컴퓨터</span><select id="setOs"><option value="mac">Mac</option><option value="win">Windows</option></select></div>
      <div class="mrow"><span>직업</span><select id="setCls">${Object.entries(CLASSES).map(([k,c])=>`<option value="${k}">${esc(c.name)}</option>`).join('')}</select></div></div>
    <div class="menu-sec"><h3>${icon('home',16)} 홈 화면에 추가</h3>${install}</div>
    <div class="menu-sec"><div class="btnrow"><button class="btn ghost" id="closeM">닫기</button><button class="btn danger" id="resetAll">처음부터</button></div>
      <p class="small muted" style="text-align:center;margin-top:12px">레벨업 길드 · SEASON 1</p></div>`;
  $('#setOs').value=S.os; $('#setCls').value=S.cls;
  $('#cpCode').onclick=()=>copy(saveCode(),'세이브 코드를 복사했어요');
  $('#cpCard').onclick=()=>copy(progressCard(),'진행 카드를 복사했어요');
  $('#loadCode').onclick=loadCode;
  $('#tgSfx').onclick=e=>{S.sfx=!S.sfx;e.currentTarget.setAttribute('aria-checked',S.sfx);SFX.set({sfx:S.sfx});save();};
  $('#tgVibe').onclick=e=>{S.vibe=!S.vibe;e.currentTarget.setAttribute('aria-checked',S.vibe);SFX.set({vibe:S.vibe});save();if(S.vibe)SFX.vibe('tap');};
  $('#setOs').onchange=e=>{S.os=e.target.value;save();refresh();toast('명령어를 '+(S.os==='mac'?'Mac':'Windows')+'용으로 바꿨어요');};
  $('#setCls').onchange=e=>{S.cls=e.target.value;if(S.tab!=='office'&&!tracksOf().includes(S.tab))S.tab=tracksOf()[0];save();refresh();$('#pcard').textContent=progressCard();toast('직업을 바꿨어요: '+CLASSES[S.cls].name);};
  if($('#installBtn'))$('#installBtn').onclick=async()=>{const p=deferredInstall;deferredInstall=null;p.prompt();try{await p.userChoice;}catch(e){}closeLayer();};
  $('#closeM').onclick=closeLayer;
  $('#resetAll').onclick=()=>{if(confirm('진행 상황이 모두 지워집니다. 계속할까요?')){try{localStorage.removeItem(KEY);}catch(e){}location.reload();}};
  $('#menuBody').scrollTop=0;
  openLayer($('#menuSheet'));
}
$('#menuBtn').onclick=openMenu;
function decodeCode(raw){
  const s=String(raw||'').replace(/\s/g,''); if(!s)throw new Error('empty');
  const o=JSON.parse(decodeURIComponent(escape(atob(s))));
  if(!isObj(o))throw new Error('shape');
  const n=normalize(o); if(!hasSave(n))throw new Error('incomplete');
  if(!n.t0)n.t0=Date.now();
  return n;
}
function loadCode(){
  let n; try{n=decodeCode($('#codeIn').value);}catch(e){toast('코드가 올바르지 않아요');SFX.fx('error');return;}
  S=n; SFX.set({sfx:S.sfx,vibe:S.vibe}); save(); closeLayer();
  enterApp(); toast('불러왔어요');
}

/* ---------- 공통 ---------- */
function copy(t,msg){
  const fb=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.position='fixed';a.style.opacity='0';document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);document.execCommand('copy');a.remove();}catch(e){}toast(msg);};
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(()=>toast(msg),fb); else fb();
}
// 다른 탭에서 바뀐 진행 상황 반영
window.addEventListener('storage',e=>{
  if(e.key!==KEY)return;
  S=normalize(readStore()); SFX.set({sfx:S.sfx,vibe:S.vibe});
  if(!$('#app').classList.contains('hidden')){ if(hasSave(S)){refresh(); if(layers[layers.length-1]===$('#qSheet')&&curQ)openQuest(curQ.id,true);} else location.reload(); }
});

/* ---------- 서비스 워커 ---------- */
let wantReload=false;
if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      const ask=w=>toast('업데이트가 있어요 — 탭해서 새로고침',{sticky:true,onTap:()=>{wantReload=true;w.postMessage('skipWaiting');}});
      if(reg.waiting&&navigator.serviceWorker.controller)ask(reg.waiting);
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;
        w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)ask(w);});});
    }).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!wantReload)return;wantReload=false;location.reload();});
  });
}

/* ---------- 시작 ---------- */
renderTitle();
