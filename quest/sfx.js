/* 레벨업 길드 — 효과음(WebAudio 합성, 파일 없음) + 진동 */
(function(){
  let ctx=null, master=null;
  const cfg={sfx:true,vibe:true};
  function ensure(){
    if(!ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return null;
      try{ctx=new AC();master=ctx.createGain();master.gain.value=0.15;master.connect(ctx.destination);}catch(e){ctx=null;return null;}
    }
    if(ctx.state==='suspended')ctx.resume().catch(()=>{});
    return ctx;
  }
  // 첫 사용자 입력에서 오디오 잠금 해제(iOS)
  const unlock=()=>{ if(cfg.sfx)ensure(); };
  window.addEventListener('pointerdown',unlock,{passive:true});
  window.addEventListener('keydown',unlock);

  function tone(freq,start,dur,type='square',vol=1,slideTo){
    const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime+start;
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol,t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);
  }
  const N={C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880,C6:1046.5,E6:1318.5,G6:1568,G4:392,C4:261.6,E4:329.6};
  const SOUNDS={
    tap(){tone(880,0,0.02,'square',0.5);},
    check(){tone(N.E5,0,0.05,'square',0.6);tone(N.A5,0.045,0.07,'square',0.6);},
    clear(){[N.C5,N.E5,N.G5,N.C6].forEach((f,i)=>tone(f,i*0.07,i===3?0.22:0.08,'square',0.8));},
    boss(){
      [[N.G4,0,.1],[N.C5,.1,.1],[N.E5,.2,.1],[N.G5,.3,.18],[N.E5,.5,.08],[N.G5,.58,.4]].forEach(([f,s,d])=>tone(f,s,d,'square',0.8));
      [[N.C4,0,.3],[N.E4,.3,.3],[N.C4*1.5,.6,.4]].forEach(([f,s,d])=>tone(f,s,d,'triangle',0.9));
    },
    levelup(){tone(N.C5,0,0.35,'square',0.6,N.C6*1.5);tone(N.G5,0.3,0.15,'square',0.6);},
    jobup(){
      const seq=[[N.C5,0,.12],[N.C5,.13,.12],[N.C5,.26,.12],[N.C5,.39,.3],[N.A5*0.9,.72,.3],[N.D5*1.12,1.04,.3],[N.C6,1.36,.7]];
      seq.forEach(([f,s,d])=>tone(f,s,d,'square',0.7));
      [[N.C4,0,.7],[N.E4,.72,.6],[N.G4,1.36,.8]].forEach(([f,s,d])=>tone(f,s,d,'triangle',0.9));
    },
    error(){tone(220,0,0.09,'square',0.7);tone(165,0.1,0.16,'square',0.7);},
  };
  const VIBE={tap:10,clear:[30,40,60],boss:[30,40,60],jobup:[60,60,120],error:[20,30,20]};
  window.SFX={
    set(o){Object.assign(cfg,o);},
    play(name){
      if(!cfg.sfx||!SOUNDS[name])return;
      if(!ensure())return;
      try{SOUNDS[name]();}catch(e){}
    },
    vibe(name){
      if(!cfg.vibe||!VIBE[name])return;
      try{navigator.vibrate&&navigator.vibrate(VIBE[name]);}catch(e){}
    },
    fx(name){this.play(name);this.vibe(name);},
  };
})();
