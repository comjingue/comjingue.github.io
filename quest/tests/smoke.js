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
  }catch(e){fails++;console.error(e);}
  finally{if(browser)await browser.close();server.kill();}
  console.log(fails?`\nFAIL (${fails})`:'\nPASS');
  process.exit(fails?1:0);
})();
