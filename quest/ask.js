/* 레벨업 길드 — "길드 마스터에게 묻기" (사진 찍어 Claude 에게 질문)
 * 서버 계약: POST `${askEndpoint}/ask` (JSON) → 200 text/plain 스트리밍 + X-Remaining
 *            실패 시 JSON {error, message} + 401/429/413/400/500
 * 대화 기록은 메모리에만 둔다(새로고침하면 사라짐). 참가 코드는 별도 키에 저장하고 세이브 코드에 넣지 않는다.
 */
'use strict';
const Ask=(()=>{
  const CODE_KEY='levelup-guild-askcode', INTRO_KEY='levelup-guild-askintro';
  const MAX_SIDE=1280, MAX_B64=1.5*1024*1024, MAX_MSGS=10, MAX_IMGS=2;
  const st={q:null,msgs:[],pending:null,busy:false,remaining:null,note:null,codeMsg:''};
  const ls={get:k=>{try{return localStorage.getItem(k)||'';}catch(e){return '';}},
            set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},
            del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
  const endpoint=()=>String((window.GUILD_CONFIG||{}).askEndpoint||'').trim().replace(/\/+$/,'');
  const sheet=()=>$('#askSheet');

  /* ---------- 렌더 ---------- */
  function inline(t){ // esc 후 **굵게** 와 줄바꿈만 처리
    return esc(t).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
  }
  function renderAnswer(el,text){
    const codes=[]; let html='', i=0;
    const re=/```[^\n`]*\n?([\s\S]*?)(```|$)/g; let m;
    while((m=re.exec(text))){
      if(m.index>i)html+=`<p>${inline(text.slice(i,m.index).replace(/^\n+|\n+$/g,''))}</p>`;
      const code=m[1].replace(/\n$/,'');
      if(code){codes.push(code);html+=`<div class="cmd"><code>${esc(code)}</code><button data-cc="${codes.length-1}">복사</button></div>`;}
      i=re.lastIndex; if(m[0]==='')break;
    }
    if(i<text.length)html+=`<p>${inline(text.slice(i).replace(/^\n+/,''))}</p>`;
    el.innerHTML=html.replace(/<p><\/p>/g,''); el._codes=codes;
  }
  function bubble(m){
    const d=document.createElement('div');
    d.className='msg '+(m.role==='user'?'me':'gm');
    if(m.role==='user'){
      if(m.thumb){const im=document.createElement('img');im.src=m.thumb;im.alt='보낸 사진';im.className='mthumb';d.appendChild(im);}
      if(m.text){const p=document.createElement('p');p.textContent=m.text;d.appendChild(p);}
    }else{
      d.innerHTML=`<span class="gav">${sprite(SPRITES.researcher,{b:'#7fd6b2',k:'#f5c542'},3)}</span><div class="gtx"></div>`;
      renderAnswer(d.querySelector('.gtx'),m.text||'');
    }
    return d;
  }
  function render(){
    const body=$('#askBody'), q=st.q;
    const head=`<div class="px small muted">길드 마스터에게 묻기 · ${esc(q.title)}</div>`;
    if(!endpoint()){
      body.innerHTML=head+`<div class="ask-note">AI 상담은 곧 열려요 — 지금은 SOS로 단톡방에 물어봐 주세요</div>
        <button class="btn ghost" id="askSos" style="width:100%">SOS 양식 복사</button>`;
      $('#askSos').onclick=()=>sos(q); $('#askInput').classList.add('hidden'); return;
    }
    if(!ls.get(CODE_KEY)){
      body.innerHTML=head+`<div class="ask-intro">${INTRO}</div>
        <label class="small" for="askCode"><b>길드 참가 코드</b> — 길드 마스터가 단톡방에 공지한 코드를 넣어 주세요.</label>
        <div class="row" style="display:flex;gap:8px;margin-top:6px"><input type="text" id="askCode" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="참가 코드"><button class="btn" id="askCodeOk">확인</button></div>
        ${st.codeMsg?`<div class="ask-err">${esc(st.codeMsg)}</div>`:''}`;
      $('#askInput').classList.add('hidden');
      const ok=()=>{const v=$('#askCode').value.trim();if(!v){toast('참가 코드를 넣어 주세요');return;}ls.set(CODE_KEY,v);ls.set(INTRO_KEY,'1');st.codeMsg='';render();};
      $('#askCodeOk').onclick=ok; $('#askCode').onkeydown=e=>{if(e.key==='Enter')ok();};
      return;
    }
    $('#askInput').classList.remove('hidden');
    body.innerHTML=head+(ls.get(INTRO_KEY)?'':`<div class="ask-intro">${INTRO}</div>`)+'<div id="askLog" class="ask-log"></div>';
    ls.set(INTRO_KEY,'1');
    const log=$('#askLog');
    if(!st.msgs.length)log.innerHTML='<div class="ask-hint">막힌 화면을 찍어 보내거나, 무엇이 안 되는지 적어 주세요.</div>';
    st.msgs.forEach(m=>log.appendChild(bubble(m)));
    if(st.busy){const t=document.createElement('div');t.className='msg gm typing';t.id='askTyping';t.innerHTML=`<span class="gav">${sprite(SPRITES.researcher,{b:'#7fd6b2',k:'#f5c542'},3)}</span><div class="gtx"><span class="dots3"><i></i><i></i><i></i></span></div>`;log.appendChild(t);}
    if(st.note){const n=document.createElement('div');n.className='ask-err';n.innerHTML=`${esc(st.note)}<div class="btnrow"><button class="btn ghost" id="askErrSos">SOS 양식 복사</button></div>`;log.appendChild(n);$('#askErrSos').onclick=()=>sos(q);}
    renderInput(); scrollEnd();
  }
  function renderInput(){
    const r=st.remaining;
    $('#askLeft').textContent=r==null?'':`오늘 남은 질문 ${r}개`;
    const pv=$('#askPreview');
    if(st.pending){pv.innerHTML=`<span class="pv"><img src="${st.pending.thumb}" alt="첨부한 사진"><button id="askPvDel" aria-label="사진 빼기">×</button></span>`;$('#askPvDel').onclick=()=>{st.pending=null;renderInput();};}
    else pv.innerHTML='';
    $('#askSend').disabled=st.busy; $('#askCam').disabled=st.busy;
  }
  function scrollEnd(){const b=$('#askBody');requestAnimationFrame(()=>{b.scrollTop=b.scrollHeight;});}
  const INTRO='막힌 화면을 찍어서 보내면 길드 마스터(AI)가 이 퀘스트 기준으로 답해요. 사진은 답변을 만들기 위해 Anthropic의 Claude API로 전송돼요. 비밀번호·API 키·계좌번호가 화면에 보이면 가리고 찍어 주세요.';

  /* ---------- 사진 줄이기 ---------- */
  function loadImg(file){
    return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const im=new Image();
      im.onload=()=>{URL.revokeObjectURL(u);res(im);};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'));};im.src=u;});
  }
  async function shrink(file){
    const im=await loadImg(file);
    let scale=Math.min(1,MAX_SIDE/Math.max(im.naturalWidth,im.naturalHeight)), q=0.8, url;
    for(let tries=0;tries<8;tries++){
      const w=Math.max(1,Math.round(im.naturalWidth*scale)), h=Math.max(1,Math.round(im.naturalHeight*scale));
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0,w,h);
      url=cv.toDataURL('image/jpeg',q);
      if(url.length-url.indexOf(',')-1<=MAX_B64)return {data:url.slice(url.indexOf(',')+1),thumb:url,w,h};
      if(q>0.45)q-=0.15; else scale*=0.75;
    }
    throw new Error('too_large');
  }

  /* ---------- 전송 ---------- */
  function stepText(s){
    if(typeof s==='string')return s;
    let t=s.t||'';
    if(s.keys)t+=' ('+cmdText(s.keys)+')';
    if(s.cmd)t+='\n명령: '+cmdText(s.cmd);
    if(s.link)t+='\n링크: '+s.link[1];
    if(s.file)t+='\n파일 내용:\n'+s.file;
    return t;
  }
  function payload(){
    let ms=st.msgs.slice(-MAX_MSGS);
    while(ms.length&&ms[0].role!=='user')ms=ms.slice(1);
    let imgLeft=MAX_IMGS; const out=[];
    for(let i=ms.length-1;i>=0;i--){
      const m=ms[i], o={role:m.role,text:m.text||''};
      if(m.image){ if(imgLeft>0){o.image={media_type:'image/jpeg',data:m.image};imgLeft--;} else o.text=(o.text?o.text+'\n':'')+'[이전에 보낸 사진]'; }
      out.unshift(o);
    }
    const q=st.q, chk=(S.steps[q.id]||[]).slice();
    return {code:ls.get(CODE_KEY),
      context:{questId:q.id,questTitle:q.title,track:q.track,os:S.os,steps:q.steps.map(stepText),checked:chk,lastStep:chk.length?chk[chk.length-1]:null,clear:q.clear},
      messages:out};
  }
  async function send(){
    if(st.busy)return;
    const inp=$('#askText'), text=inp.value.trim();
    if(!text&&!st.pending){toast('질문이나 사진을 넣어 주세요');return;}
    const um={role:'user',text,image:st.pending&&st.pending.data,thumb:st.pending&&st.pending.thumb};
    st.msgs.push(um); const keepPending=st.pending; st.pending=null; inp.value=''; st.busy=true; st.note=null; render();
    const q=st.q; let ans=null;
    const fail=msg=>{ // 실패: 질문을 기록에서 빼고 입력창에 되돌려 다시 보낼 수 있게
      st.msgs=st.msgs.filter(m=>m!==um&&m!==ans);
      inp.value=text; st.pending=keepPending; st.note=msg; SFX.fx('error');
    };
    const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),90000);
    try{
      const res=await fetch(endpoint()+'/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload()),signal:ctl.signal,cache:'no-store'});
      const rem=res.headers.get('X-Remaining'); if(rem!=null&&rem!==''&&!isNaN(+rem))st.remaining=+rem;
      if(!res.ok){
        let j={}; try{j=await res.json();}catch(e){}
        const msg=j.message||'잠시 후 다시 시도해 주세요. 급하면 SOS로 단톡방에 물어봐 주세요.';
        if(j.error==='bad_code'||res.status===401){ls.del(CODE_KEY);st.codeMsg=msg;}
        if(j.error==='limit'||res.status===429)st.remaining=0;
        fail(msg);
      }else{
        ans={role:'assistant',text:''}; st.msgs.push(ans);
        st.busy=false; render(); st.busy=true;
        const el=$('#askLog')&&[...$('#askLog').querySelectorAll('.msg.gm')].pop();
        const gtx=el&&el.querySelector('.gtx'); if(gtx)gtx.insertAdjacentHTML('afterend','<span class="dots3 inl"><i></i><i></i><i></i></span>');
        $('#askSend').disabled=true;
        const dec=new TextDecoder(); let pend=false;
        const paint=()=>{pend=false;const g=el&&el.isConnected?el.querySelector('.gtx'):null;if(g){renderAnswer(g,ans.text);scrollEnd();}};
        if(res.body&&res.body.getReader){
          const rd=res.body.getReader();
          for(;;){const {done,value}=await rd.read(); if(done)break; ans.text+=dec.decode(value,{stream:true}); if(!pend){pend=true;requestAnimationFrame(paint);}}
          ans.text+=dec.decode();
        }else ans.text=await res.text();
        if(!ans.text.trim()){fail('답을 받지 못했어요. 다시 시도하거나 SOS로 물어봐 주세요.');}
        else if(!S.sos[q.id]){S.sos[q.id]=1;save();} // 묻기로 답을 받은 퀘스트 → 클리어 시 '구조 요청 성공'
      }
    }catch(e){
      fail(e.name==='AbortError'?'답이 너무 오래 걸려요. 다시 시도하거나 SOS로 물어봐 주세요.':'네트워크에 연결할 수 없어요. 연결을 확인하거나 SOS로 물어봐 주세요.');
    }finally{
      clearTimeout(timer); st.busy=false;
      if(st.q===q&&sheet().classList.contains('on'))render();
    }
  }

  /* ---------- 열기 ---------- */
  function open(q){
    if(!st.q||st.q.id!==q.id){st.q=q;st.msgs=[];st.pending=null;st.note=null;$('#askText').value='';} // 다른 퀘스트면 대화 초기화
    render(); openLayer(sheet());
  }
  // 고정 요소 이벤트(한 번만)
  $('#askBody').addEventListener('click',e=>{const b=e.target.closest('[data-cc]');if(!b)return;const g=b.closest('.gtx');if(g&&g._codes)copy(g._codes[+b.dataset.cc],'복사했어요');});
  $('#askCam').innerHTML=icon('camera',22);
  $('#askCam').onclick=()=>$('#askFile').click();
  $('#askFile').onchange=async e=>{
    const f=e.target.files&&e.target.files[0]; e.target.value=''; if(!f)return;
    try{st.pending=await shrink(f);}catch(err){toast(err.message==='too_large'?'사진이 너무 커요. 화면 일부만 찍어 주세요':'사진을 읽을 수 없어요');SFX.fx('error');}
    renderInput();
  };
  $('#askSend').onclick=send;
  $('#askText').onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&!e.shiftKey){e.preventDefault();send();}};
  return {open,clearCode(){ls.del(CODE_KEY);},hasCode:()=>!!ls.get(CODE_KEY),_st:st,_payload:payload};
})();
