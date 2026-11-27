/* 레벨업 길드 스모크 테스트
 * 실행: node quest/tests/smoke.js   (저장소 어디서든)
 * - 저장소 루트에서 python3 -m http.server 를 띄워 /quest/ 를 연다(서비스 워커 포함).
 * - iPhone 13 / Pixel 7 / 데스크톱 1280 에서 주요 흐름을 누르고 콘솔·페이지 에러 0 을 확인한다.
 * - SHOTS 환경변수(기본: quest/tests/shots)에 스크린샷 저장.
 */
const {chromium,devices}=require('playwright');
const {spawn}=require('child_process');
const path=require('path');const fs=require('fs');const net=require('net');

const ROOT=path.resolve(__dirname,'../..');
const SHOTS=process.env.SHOTS||path.join(__dirname,'shots');
fs.mkdirSync(SHOTS,{recursive:true});

const freePort=()=>new Promise(r=>{const s=net.createServer();s.listen(0,()=>{const p=s.address().port;s.close(()=>r(p));});});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;
function ok(cond,msg){if(cond)console.log('  ✓',msg);else{fails++;console.log('  ✗',msg);}}

async function waitServer(url){for(let i=0;i<50;i++){try{const r=await fetch(url);if(r.ok)return;}catch(e){}await sleep(100);}throw new Error('server not up');}

async function integrity(page){
  const r=await page.evaluate(()=>{
    const qs=Q.filter(q=>q.id), ids=qs.map(q=>q.id), set=new Set(ids);
    const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
    const missing=[], unreachable=[];
    for(const [k,c] of Object.entries(CLASSES)){
      const mine=new Set(qs.filter(q=>c.tracks.includes(q.track)).map(q=>q.id));
      c.ranks.forEach(rk=>rk[0].forEach(id=>{if(!set.has(id))missing.push(k+':'+id);}));
      const fin=c.ranks[c.ranks.length-1][0];
      if(!fin.every(id=>mine.has(id)))unreachable.push(k);
      const all={};mine.forEach(id=>all[id]=1);
      if(rankOf(k,all)[1]!==c.ranks[c.ranks.length-1][1])unreachable.push(k+'(rankOf)');
    }
    const unl=qs.filter(q=>q.unlock&&!SPRITES[q.unlock]).map(q=>q.id);
    const badSteps=qs.filter(q=>!Array.isArray(q.steps)||!q.steps.length).map(q=>q.id);
    return {dup,missing,unreachable,unl,badSteps};
  });
  ok(!r.dup.length,'퀘스트 id 중복 없음 '+(r.dup.join(',')));
  ok(!r.missing.length,'모든 전직 필수 퀘스트 id 존재 '+r.missing.join(','));
  ok(!r.unreachable.length,'모든 직업의 최종 전직 도달 가능 '+r.unreachable.join(','));
  ok(!r.unl.length,'모든 unlock 스프라이트 존재 '+r.unl.join(','));
  ok(!r.badSteps.length,'모든 퀘스트에 단계 있음');
}

async function clearOpenQuest(page,shot){
  await page.waitForSelector('#qSheet.on');
  const done=await page.$('#doneQ'); ok(!!done,'시트에 클리어 버튼');
  const n=await page.$$eval('#qBody .chk[aria-checked=false]',a=>a.length);
  if(n)ok(await page.$eval('#doneQ',b=>b.disabled),'단계 체크 전 클리어 비활성');
  for(const c of await page.$$('#qBody .chk[aria-checked=false]')){await c.click();}
  ok(!(await page.$eval('#doneQ',b=>b.disabled)),'모든 단계 체크 후 클리어 활성');
  if(shot)await page.screenshot({path:shot});
  await page.click('#doneQ');
  await page.waitForSelector('#resultCard.on',{timeout:5000});
}

async function run(name,ctxOpts,opts={}){
  console.log(`\n[${name}]`);
  const errors=[];
  const ctx=await browser.newContext({...ctxOpts,serviceWorkers:'allow'});
  const page=await ctx.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  const shot=n=>page.screenshot({path:path.join(SHOTS,`${name}-${n}.png`)});

  await page.goto(BASE);
  await page.waitForSelector('#title:not(.hidden)');
  if(opts.integrity)await integrity(page);
  await shot('01-title');
  await page.click('#title .logo');
  await page.waitForSelector('#wizard:not(.hidden)');
  await page.fill('#nick','테스터<b>');
  await shot('02-wizard-name');
  await page.click('#wzNext');
  await page.waitForSelector('#car');
  await sleep(250);
  await shot('03-wizard-class');
  ok(await page.$eval('#car .cls-card.on',e=>e.dataset.c)==='ceo','기본 선택 직업 ceo');
  await page.click('#wzNext');
  await page.click('#osPick [data-os=mac]');
  await page.click('#wzNext');
  await page.waitForSelector('#app:not(.hidden)');
  ok(await page.$eval('#hudName',e=>e.textContent)==='테스터<b>','닉네임 이스케이프 표시');
  ok(/Day 1\/14/.test(await page.$eval('#hudDay',e=>e.textContent)),'HUD Day 1/14');
  await sleep(400);
  await shot('04-map');

  // 첫 노드 열기 → 체크 → 클리어 → 결과 카드 → 다음 퀘스트
  await page.click('#view .node.cur');
  await clearOpenQuest(page,path.join(SHOTS,`${name}-05-sheet.png`));
  await sleep(300);
  await shot('06-result');
  await page.click('#resNext');
  await page.waitForSelector('#qSheet.on');

  // a-ag1(마일스톤)까지 진행 → 전직 모달
  let sawJob=false, guard=0;
  while(guard++<15){
    const qid=await page.evaluate(()=>curQ&&curQ.id);
    if(qid==='a-term'){
      await page.fill('#vIn','/Users/tester');await page.click('#vBtn');
      ok(!!(await page.$('#qBody .stamp')),'증거 입력 검증 스탬프');
    }
    if(qid==='a-boss0'){ok(!!(await page.$('#hp')),'보스 HP 바');}
    await clearOpenQuest(page);
    if(qid==='a-term')ok(/검증 보너스 \+10 XP/.test(await page.$eval('#resultCard',e=>e.textContent)),'검증 보너스 XP +20% 표시(50→60)');
    await page.click('#resNext');
    await sleep(150);
    if(await page.$('#jobCard.on')){
      sawJob=true; await sleep(300); await shot('07-jobup');
      ok(qid==='a-ag1','전직 모달은 a-ag1 클리어 뒤 '+qid);
      await page.click('#closeJob');
      await page.waitForSelector('#qSheet.on');
      break;
    }
    await page.waitForSelector('#qSheet.on');
  }
  ok(sawJob,'마일스톤 전직 모달 표시');
  ok(/1인 기업 대표/.test(await page.$eval('#hudCls',e=>e.textContent)),'칭호 1인 기업 대표');
  // 뒤로가기로 시트 닫힘
  await page.goBack();
  await sleep(300);
  ok(!(await page.$('#qSheet.on')),'뒤로가기로 시트 닫힘');
  ok(!(await page.$('#app.hidden')),'뒤로가기 후 앱 화면 유지');

  // 사무실
  await page.click('#tabbar [data-t=office]');
  await sleep(900);
  ok((await page.$$('#view .desk:not(.empty)')).length>=3,'사무실에 동료 출근(나+인턴+리서처…)');
  await shot('08-office');
  await page.click('#tabbar [data-t=agent]');

  // 세이브 코드 왕복 + 깨진 코드
  const before=await page.evaluate(()=>JSON.stringify(S.done));
  await page.click('#menuBtn');await page.waitForSelector('#menuSheet.on');
  await sleep(300);await shot('09-menu');
  const code=await page.$eval('#codeOut',e=>e.value);
  await page.fill('#codeIn',code.slice(0,20)+'\n  '+code.slice(20));
  await page.click('#loadCode');await sleep(200);
  ok(await page.evaluate(()=>JSON.stringify(S.done))===before,'세이브 코드 왕복(공백 섞인 코드)');
  for(const bad of ['abc','e30=','eyJuaWNrIjoiPGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPiJ9']){
    await page.click('#menuBtn');await page.waitForSelector('#menuSheet.on');
    await page.fill('#codeIn',bad);await page.click('#loadCode');await sleep(150);
    ok(await page.evaluate(()=>JSON.stringify(S.done))===before&&!!(await page.$('#app:not(.hidden)')),'깨진 코드 생존: '+bad);
    await page.keyboard.press('Escape');await sleep(150);
  }
  // 저장된 값 = 메모리 값
  ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-guild-v1')).nick)==='테스터<b>','localStorage 유지');

  // 새로고침 유지
  await page.reload();
  await page.waitForSelector('#continueBtn:not(.hidden)',{state:'attached'});
  ok(!!(await page.$('#titleActions:not(.hidden)')),'새로고침 후 이어하기 버튼');
  await page.click('#continueBtn');
  await page.waitForSelector('#app:not(.hidden)');
  ok(await page.evaluate(()=>JSON.stringify(S.done))===before,'새로고침 후 진행 유지');

  // 손상된 localStorage 생존
  await page.evaluate(()=>localStorage.setItem('levelup-guild-v1','{broken'));
  await page.reload();
  await page.waitForSelector('#title:not(.hidden)');
  ok(!!(await page.$('#tapStart:not(.hidden)')),'손상된 저장값에서도 타이틀 표시');
  // 구버전(v0.1) 세이브 마이그레이션
  await page.evaluate(()=>localStorage.setItem('levelup-guild-v1',JSON.stringify({nick:'옛날',cls:'finance',os:'win',done:{'f-net':1700000000000,'zzz':1},badges:['<i>x</i>'],tab:'finance',t0:1700000000000})));
  await page.reload();await page.click('#continueBtn');await page.waitForSelector('#app:not(.hidden)');
  const mig=await page.evaluate(()=>({cls:S.cls,done:Object.keys(S.done),v:S.v,b:S.badges}));
  ok(mig.cls==='investor'&&mig.done.join()==='f-net'&&mig.v===2,'v0.1 세이브 마이그레이션');
  await page.click('#menuBtn');await sleep(250);
  ok(!(await page.$('#menuBody i i')),'배지 HTML 이스케이프');
  await page.keyboard.press('Escape');
  await page.click('#tabbar [data-t=office]');await sleep(300);
  ok((await page.$$('#view .desk')).length===2,'investor 사무실: 나 + 재무 비서 자리');

  if(opts.sw){
    const ctl=await page.evaluate(async()=>{await navigator.serviceWorker.ready;return !!navigator.serviceWorker.controller;});
    ok(ctl,'서비스 워커 제어 중');
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector('#title:not(.hidden)',{timeout:5000}).catch(()=>{});
    ok(!!(await page.$('#title:not(.hidden)')),'오프라인 새로고침에서 타이틀 표시');
    ok(await page.evaluate(()=>document.fonts.check('16px Galmuri11')),'오프라인에서 픽셀 폰트 로드');
    await ctx.setOffline(false);
  }
  const real=errors.filter(e=>!/net::ERR_INTERNET_DISCONNECTED|Failed to fetch/.test(e));
  ok(real.length===0,'콘솔/페이지 에러 0 '+(real.length?JSON.stringify(real):''));
  await ctx.close();
}


/* 직업 선택이 캐러셀에서 정확히 저장되는지(데스크톱 폭에서 한 칸 어긋나던 버그) */
async function classPick(name,ctxOpts){
  console.log(`\n[${name} 직업 선택]`);
  const errors=[];
  const ctx=await browser.newContext({...ctxOpts,serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  for(const mode of ['click','swipe']){
    for(const k of ['ceo','investor','hybrid']){
      await page.goto(BASE);await page.evaluate(()=>localStorage.clear());await page.reload();
      await page.click('#title .logo');await page.fill('#nick','선택');await page.click('#wzNext');
      await page.waitForSelector('#car');await sleep(200);
      if(mode==='click')await page.click(`#car [data-c=${k}] .motto`);
      else await page.$eval('#car',(car,k)=>{const el=car.querySelector(`[data-c=${k}]`);const cr=car.getBoundingClientRect(),r=el.getBoundingClientRect();
        car.scrollLeft+= (r.left-cr.left)-(car.clientWidth-r.width)/2;},k);
      await sleep(1100);
      const hl=await page.$eval('#car .cls-card.on',e=>e.dataset.c);
      await page.click('#wzNext');await page.click('#osPick [data-os=win]');await page.click('#wzNext');
      await page.waitForSelector('#app:not(.hidden)');
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('levelup-guild-v1')).cls);
      ok(saved===k&&hl===k,`${mode}: ${k} 선택 → 저장 ${saved}, 강조 ${hl}`);
    }
  }
  ok(!errors.length,'페이지 에러 0 '+errors.join(','));
  await ctx.close();
}

/* iPhone SE 스크린샷 */
async function seShots(){
  console.log('\n[iPhone SE 스크린샷]');
  const ctx=await browser.newContext({...devices['iPhone SE'],serviceWorkers:'block'});
  const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const shot=n=>page.screenshot({path:path.join(SHOTS,`se-${n}.png`)});
  await page.goto(BASE);
  await page.click('#title .logo');await page.fill('#nick','SE유저');await page.click('#wzNext');
  await page.waitForSelector('#car');await sleep(400);await shot('wizard-class');
  const cta=await page.$eval('#wzNext',e=>e.getBoundingClientRect().top), dots=await page.$eval('#cdots',e=>e.getBoundingClientRect().bottom);
  ok(dots<=cta,'위저드 2단계 CTA가 캐러셀 점을 가리지 않음'+` dots ${dots|0} / cta ${cta|0}`);
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(150);
  const cardB=await page.$eval('#car .cls-card.on',e=>e.getBoundingClientRect().bottom), cta2=await page.$eval('#wzNext',e=>e.getBoundingClientRect().top);
  ok(cardB<=cta2,`스크롤 끝에서 직업 카드 전체가 CTA 위에 보임(${cardB|0} ≤ ${cta2|0})`);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.goto(BASE);
  await page.evaluate(()=>{const done={};['a-acc','a-term','a-git','a-code','a-boss0','a-install','a-first','a-rules','a-ag1','a-ag2','a-ag3'].forEach(i=>done[i]=1);
    localStorage.setItem('levelup-guild-v1',JSON.stringify({v:2,nick:'SE유저',cls:'ceo',os:'mac',done,t0:Date.now()-3*864e5}));});
  await page.reload();await page.click('#continueBtn');await page.waitForSelector('#app:not(.hidden)');
  await sleep(900);await shot('map');
  // 마지막 노드가 CTA에 가리지 않는지: 맨 아래로 스크롤 후 마지막 노드 하단 < CTA 상단
  await page.evaluate(()=>{const ns=[...document.querySelectorAll('#view .chapter')].filter(c=>!c.classList.contains('locked')).pop();ns.querySelector('.node:last-of-type').scrollIntoView({block:'end'});});
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await sleep(200);
  const last=await page.$$eval('#view .node',ns=>ns[ns.length-1].getBoundingClientRect().bottom), ctaTop=await page.$eval('#nextCta',e=>e.getBoundingClientRect().top);
  ok(last<=ctaTop,`맨 아래 노드가 CTA 위에 보임(${last|0} ≤ ${ctaTop|0})`);
  await page.evaluate(()=>openQuest('a-boss2'));await sleep(500);await shot('boss2-sheet');
  ok(!!(await page.$('#qBody mark.ph')),'자리표시 [..] 강조');
  ok(await page.$eval('#qBody .cmd code',e=>getComputedStyle(e).whiteSpace)==='pre-wrap','명령어 줄바꿈');
  ok(await page.$eval('#sosBtn',e=>e.textContent.includes('SOS')),'SOS 글자 라벨');
  ok(!errors.length,'페이지 에러 0 '+errors.join(','));
  await ctx.close();
}


/* 길드 마스터에게 묻기: 가짜 엔드포인트(https://ask.test/ask)로 스트리밍·429·401 흉내 */
async function askTest(){
  console.log('\n[묻기(iPhone 13)]');
  const ctx=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'});
  const page=await ctx.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/status of (429|401)/.test(m.text()))errors.push('console: '+m.text());});
  const shot=n=>page.screenshot({path:path.join(SHOTS,`ask-${n}.png`)});
  let mode='ok'; const bodies=[];
  const CORS={'access-control-allow-origin':'*','access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS','access-control-expose-headers':'X-Remaining'};
  await page.route('https://ask.test/**',async route=>{
    const r=route.request();
    if(r.method()==='OPTIONS')return route.fulfill({status:204,headers:CORS});
    bodies.push(JSON.parse(r.postData()));
    if(mode==='ok')return route.fulfill({status:200,headers:{...CORS,'content-type':'text/plain; charset=utf-8','X-Remaining':String(10-bodies.length)},
      body:'**터미널**을 껐다 켠 뒤 아래를 실행해 보세요.\n```bash\nclaude --version\n```\n<img src=x onerror=alert(1)> 버전이 나오면 성공!'});
    if(mode==='429')return route.fulfill({status:429,headers:{...CORS,'content-type':'application/json'},body:JSON.stringify({error:'limit',message:'오늘 질문을 모두 썼어요. 내일 다시 물어봐 주세요.'})});
    if(mode==='401')return route.fulfill({status:401,headers:{...CORS,'content-type':'application/json'},body:JSON.stringify({error:'bad_code',message:'참가 코드가 맞지 않아요.'})});
  });
  await page.goto(BASE);
  await page.evaluate(()=>localStorage.setItem('levelup-guild-v1',JSON.stringify({v:2,nick:'묻기',cls:'ceo',os:'mac',done:{},t0:Date.now()})));
  await page.reload();await page.click('#continueBtn');await page.waitForSelector('#app:not(.hidden)');
  await page.evaluate(()=>openQuest('a-install'));await page.waitForSelector('#qSheet.on');
  await page.click('#qBody .chk');
  // 1) 엔드포인트 비어 있음
  await page.click('#askBtn');await page.waitForSelector('#askSheet.on');
  ok(/AI 상담은 곧 열려요/.test(await page.$eval('#askBody',e=>e.textContent)),'엔드포인트 없음 → 안내');
  ok(!!(await page.$('#askSos')),'엔드포인트 없음 → SOS 버튼');
  await page.goBack();await sleep(300);
  ok(!(await page.$('#askSheet.on'))&&!!(await page.$('#qSheet.on')),'뒤로가기 → 묻기 시트만 닫힘');
  // 2) 코드 입력
  await page.evaluate(()=>{window.GUILD_CONFIG.askEndpoint='https://ask.test';});
  await page.click('#askBtn');await page.waitForSelector('#askCode');
  ok(/Anthropic의 Claude API/.test(await page.$eval('#askBody',e=>e.textContent)),'첫 안내문(전송 고지)');
  await sleep(300);await shot('code');
  await page.fill('#askCode','GUILD-2026');await page.click('#askCodeOk');
  await page.waitForSelector('#askText:visible');
  // 3) 텍스트 질문 → 스트리밍 답
  await page.fill('#askText','claude 명령이 없대요');await page.click('#askSend');
  await page.waitForFunction(()=>/버전이 나오면 성공/.test(document.querySelector('#askLog').textContent)&&!document.querySelector('#askSend').disabled);
  ok(!!(await page.$('#askLog .msg.gm .cmd code')),'답변 코드블록 → .cmd 렌더');
  ok(!(await page.$('#askLog img[src=x]')),'답변 원문 HTML 이스케이프');
  ok(!!(await page.$('#askLog .gtx b')),'**굵게** 처리');
  ok(/오늘 남은 질문 9개/.test(await page.$eval('#askLeft',e=>e.textContent)),'남은 질문 수 표시');
  const b0=bodies[0];
  ok(b0.code==='GUILD-2026'&&b0.context.questId==='a-install'&&b0.context.os==='mac'&&b0.context.checked.join()==='0'&&b0.context.lastStep===0&&b0.context.steps.length===2&&/claude --version/.test(b0.context.steps[1]),'요청 context 계약');
  ok(b0.messages.length===1&&b0.messages[0].role==='user','요청 messages 계약');
  // 4) 사진 첨부(큰 PNG → 1280 이하 JPEG)
  const png=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=2400;c.height=1600;const g=c.getContext('2d');g.fillStyle='#345';g.fillRect(0,0,2400,1600);g.fillStyle='#fc0';g.fillRect(100,100,800,400);return c.toDataURL('image/png').split(',')[1];}),'base64');
  await page.setInputFiles('#askFile',{name:'screen.png',mimeType:'image/png',buffer:png});
  await page.waitForSelector('#askPreview img');
  await page.fill('#askText','이 화면이에요');await page.click('#askSend');
  await page.waitForFunction(()=>document.querySelectorAll('#askLog .msg.gm').length===2&&!document.querySelector('#askSend').disabled);
  const b1=bodies[1], last=b1.messages[b1.messages.length-1];
  ok(!!(last.image&&last.image.data)&&last.image.media_type==='image/jpeg'&&!/^data:/.test(last.image.data),'요청에 image.data(base64, 헤더 없음)');
  const dim=await page.evaluate(d=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);i.src='data:image/jpeg;base64,'+d;}),last.image.data);
  ok(Math.max(...dim)<=1280,'사진 긴 변 1280 이하: '+dim.join('×'));
  ok(b1.messages.length===3&&b1.messages[1].role==='assistant','이전 대화 포함');
  ok(!!(await page.$('#askLog .msg.me img')),'보낸 사진 썸네일');
  await sleep(300);await shot('chat');
  // 5) 429
  mode='429';await page.fill('#askText','하나 더');await page.click('#askSend');
  await page.waitForSelector('#askErrSos');
  ok(/오늘 질문을 모두 썼어요/.test(await page.$eval('#askLog',e=>e.textContent)),'429 → 서버 안내 그대로');
  ok(await page.$eval('#askText',e=>e.value)==='하나 더','실패한 질문은 입력창으로 복귀');
  // 6) 401 → 코드 다시 입력
  mode='401';await page.click('#askSend');
  await page.waitForSelector('#askCode');
  ok(/참가 코드가 맞지 않아요/.test(await page.$eval('#askBody',e=>e.textContent)),'401 → 코드 재입력 + 안내');
  ok(await page.evaluate(()=>localStorage.getItem('levelup-guild-askcode'))===null,'잘못된 코드 삭제');
  await page.fill('#askCode','GUILD-2026');await page.click('#askCodeOk');
  // 이미지 최근 2장만, 최근 10개 메시지만
  const pl=await page.evaluate(()=>{const st=Ask._st,keep=st.msgs;st.msgs=[];for(let i=0;i<14;i++)st.msgs.push(i%2?{role:'assistant',text:'a'+i}:{role:'user',text:'u'+i,image:'IMG'+i});const p=Ask._payload();st.msgs=keep;return p.messages;});
  ok(pl.length<=10&&pl[0].role==='user','최근 10개 이하, user로 시작: '+pl.length);
  ok(pl.filter(m=>m.image).length===2&&pl.filter(m=>/\[이전에 보낸 사진\]/.test(m.text)).length===pl.filter(m=>m.role==='user').length-2,'이미지는 최근 2장만, 이전은 [이전에 보낸 사진]');
  // 7) 세이브 코드에 참가 코드 없음
  const sc=await page.evaluate(()=>decodeURIComponent(escape(atob(saveCode()))));
  ok(!/GUILD-2026|askcode/.test(sc),'세이브 코드에 참가 코드 없음');
  // 8) 답을 받은 퀘스트 클리어 → 구조 요청 성공
  await page.keyboard.press('Escape');await sleep(250);
  for(const c of await page.$$('#qBody .chk[aria-checked=false]'))await c.click();
  await page.click('#doneQ');await page.waitForSelector('#resultCard.on');
  ok(/구조 요청 성공/.test(await page.$eval('#resultCard',e=>e.textContent)),'묻기 후 클리어 → 구조 요청 성공 배지');
  ok(!errors.length,'콘솔/페이지 에러 0 '+JSON.stringify(errors));
  await ctx.close();
}

let browser, BASE, server;
(async()=>{
  const port=await freePort();
  server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
  BASE=`http://127.0.0.1:${port}/quest/`;
  try{
    await waitServer(BASE);
    browser=await chromium.launch();
    await run('iphone13',{...devices['iPhone 13']},{integrity:true});
    await run('pixel7',{...devices['Pixel 7']},{sw:true});
    await run('desktop',{viewport:{width:1280,height:800}});
    await classPick('desktop1280',{viewport:{width:1280,height:800}});
    await classPick('iphone13',{...devices['iPhone 13']});
    await seShots();
    await askTest();
  }catch(e){fails++;console.error(e);}
  finally{if(browser)await browser.close();server.kill();}
  console.log(fails?`\nFAIL (${fails})`:'\nPASS');
  process.exit(fails?1:0);
})();
