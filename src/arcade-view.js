(function(){
'use strict';
const {Game,GAMES,W,H,clamp}=XJKArcadeCore;
const $=id=>document.getElementById(id);
const canvas=$('playfield'),ctx=canvas.getContext('2d');
let current=null,selected=0,difficulty=2,muted=false,hostActive=true,wasHostActive=true,raf=0,last=0,acc=0,audio;
let padDevice=null,padPrevious=[],padDirectionAt=0,lastPauseAt=-999,lastBackAt=-999;
const keys=new Set(),touch=new Map(),pulse={},stats=load('xjk.arcade.v1',{});
const keyboard={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down',z:'a',' ':'a',x:'b',shift:'b'};
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch(e){return fallback;}}
function save(){try{localStorage.setItem('xjk.arcade.v1',JSON.stringify(stats));}catch(e){$('saveNote').textContent='本次成绩保留到关闭页面';}}
function tone(freq=440,length=.06){if(muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();let o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+length);}catch(e){}}
function clearInput(){keys.clear();touch.clear();Object.keys(pulse).forEach(k=>delete pulse[k]);}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();}
function text(c,str,x,y,color='#fbf2dc',size=8,align='left'){c.fillStyle=color;c.font='bold '+size+'px "Microsoft YaHei",sans-serif';c.textAlign=align;c.fillText(str,Math.round(x),Math.round(y));c.textAlign='left';}
function cube(c,x,y,w,h,depth,front,top,side){rect(c,x,y,w,h,front);poly(c,[[x,y],[x+depth,y-depth],[x+w+depth,y-depth],[x+w,y]],top);poly(c,[[x+w,y],[x+w+depth,y-depth],[x+w+depth,y+h-depth],[x+w,y+h]],side);}
function tree(c,x,y){poly(c,[[x-17,y],[x+17,y],[x+2,y-36]],'#41765a');poly(c,[[x+2,y-36],[x+17,y],[x+4,y-6]],'#244e42');rect(c,x-2,y,5,12,'#6b6854');}
function sprite(c,p,color='#a496dd',kind='duck',clock=0,role='worker',attacking=false){
 if(kind==='duck')RetroScene.duck(c,p,color,clock,role,attacking);
 else RetroScene.bag(c,p,clock,role==='ranger');
 return;
 const x=Math.round(p.x),y=Math.round(p.y),face=p.face||1,bob=p.ground&&Math.abs(p.vx)>0?Math.floor(clock*12)%2:0;
 if(p.inv>0&&Math.floor(clock*15)%2===0)return;
 rect(c,x+1,y+p.h-2,p.w,3,'#182d3640');
 if(kind==='duck'){
  rect(c,x+3,y+2,9,8,'#f4ebcd');rect(c,x+3,y,10,3,'#495572');rect(c,x+(face>0?10:-2),y+7,7,3,'#f7af55');
  rect(c,x+(face>0?9:4),y+4,2,2,'#262c3c');rect(c,x+2,y+11,11,7,color);rect(c,x+(face>0?11:0),y+12,3,5,'#f3dbad');
  rect(c,x+3,y+18,4,3+bob,'#2c3450');rect(c,x+10,y+18,4,4-bob,'#2c3450');
 }else if(kind==='bag'){
  poly(c,[[x+2,y+2],[x+14,y],[x+18,y+18],[x,y+18]],'#cca472');rect(c,x+3,y+1,10,3,'#a16d54');
  rect(c,x+3,y+7,3,4,'#3b3544');rect(c,x+12,y+7,3,4,'#3b3544');rect(c,x+5,y+14,8,2,'#f1d5ab');rect(c,x+2,y+18,4,5,'#583e51');rect(c,x+12,y+18,4,5,'#583e51');
 }
}
function skyline(c,camera,theme){
 rect(c,0,0,W,H,theme==='shoot'?'#252b4c':theme==='climb'?'#8ca7b2':'#8cbabe');
 const sky=theme==='shoot'?['#414367','#343956','#555571']:['#b7d2c9','#a5c3c3','#91b0b8'];
 for(let i=0;i<6;i++)poly(c,[[i*90-camera*.08%90,146],[i*90+50-camera*.08%90,38+i%3*17],[i*90+110-camera*.08%90,146]],sky[i%3]);
 const ox=-((camera*.25)%60);
 for(let i=-1;i<9;i++){
  const x=ox+i*60,y=95+(i+10)%3*14;
  RetroScene.building(c,x+20,153,40,150-y,theme==='shoot',i);
 }
 rect(c,0,150,W,106,theme==='shoot'?'#323247':'#60948e');
 rect(c,0,155,W,2,theme==='shoot'?'#6d4c64':'#86b3a0');
 if(theme==='shoot'){
  for(let i=0;i<17;i++)rect(c,(i*47+13)%W,12+(i*19)%57,1,1,'#d4bdce');
  rect(c,302,24,17,17,'#d8c9cb');rect(c,310,22,12,15,'#252b4c');
  for(let i=0;i<4;i++){const x=38+i*110-camera*.12%110;text(c,['夜市','新街口','不加班','24H'][i],x,115+i%2*12,['#dba5bd','#f2c791'][i%2],9);rect(c,x-4,118+i%2*12,32,2,'#c98bab');}
 }
}
function drawQuest(c,g){
 rect(c,0,0,W,H,'#7da488');
 c.save();c.translate(-Math.floor(g.camera.x),-Math.floor(g.camera.y));
 rect(c,28,391,700,47,'#baa782');rect(c,586,35,45,400,'#baa782');rect(c,90,181,540,43,'#b9aa88');
 for(let y=26;y<512;y+=31)for(let x=27;x<768;x+=29){if((x*3+y)%7<3){rect(c,x,y,2,3,'#507e66');rect(c,x+3,y-1,2,3,'#a0bd81');}}
 for(let x=31;x<720;x+=24){rect(c,x,397,18,1,'#d1bea0');rect(c,x+12,427,18,1,'#8d9577');}for(let y=44;y<420;y+=25)rect(c,594,y,29,1,'#d2bea0');
 [[66,466],[325,244],[680,420]].forEach(t=>{RetroScene.bench(c,...t);RetroScene.bin(c,t[0]+27,t[1]+3);});
 [[95,163],[230,76],[575,392],[710,151]].forEach(t=>RetroScene.planter(c,...t));
 RetroScene.chair(c,53,399,-.5);RetroScene.chair(c,104,404,.7);RetroScene.sign(c,655,460,'末班车 →');
 RetroScene.crate(c,188,356);RetroScene.cone(c,220,354);RetroScene.cone(c,239,360);RetroScene.pigeon(c,355,412,g.t);RetroScene.pigeon(c,371,422,g.t+.8);
 for(const w of g.walls){cube(c,w.x,w.y,w.w,w.h,7,'#6c7b87','#a6b1a6','#46566d');for(let x=w.x+8;x<w.x+w.w-5;x+=17)rect(c,x,w.y+9,8,8,'#455770');}
 [[51,58],[280,64],[409,447],[706,374],[295,270]].forEach(t=>tree(c,...t));
 RetroScene.stall(c,80,382,'鸭血粉丝');RetroScene.bench(c,366,467);RetroScene.lamp(c,286,376);RetroScene.lamp(c,630,122);
 RetroScene.metro(c,g.exit.x+22,g.exit.y+38);
 text(c,'末班车',g.exit.x+22,g.exit.y-12,'#fce3a0',9,'center');
 for(const i of g.items)if(i.active){rect(c,i.x-2,i.y+12,14,3,'#365c5640');cube(c,i.x,i.y+Math.sin(g.t*4)*2,i.w,i.h,2,'#f4d68a','#fff4c2','#d1a764');text(c,'M',i.x+2,i.y+9,'#7f665c',7);}
 drawTraps(c,g);
 const objects=[...g.enemies.filter(e=>e.hp>0),g.p].sort((a,b)=>a.y-b.y);
 for(const e of objects){if(e===g.p){sprite(c,e,'#9a96d9','duck',g.t,'hero',g.attack>0);if(g.attack>0){const x=e.x+(e.face>0?20:-12);rect(c,x,e.y+6,13,4,'#e0ebd6');rect(c,x+4,e.y+2,5,13,'#f7d5a1');}}
  else if(e.kind==='gate'){
   RetroScene.gateBoss(c,e,g.t);
   rect(c,e.x-3,e.y-12,34,3,'#38364b');rect(c,e.x-3,e.y-12,34*e.hp/e.maxHp,3,'#efa1a7');}
  else RetroScene.slime(c,e,g.t);}
 for(const e of g.enemies)if(e.hp>0&&e.telegraph)alertRing(c,e.x+e.w/2,e.y+e.h+2,16,'#ffdb8f');
 drawFx(c,g);c.restore();
}
function drawSide(c,g){
 skyline(c,g.camera.x,g.id);c.save();c.translate(-Math.floor(g.camera.x),0);
 for(const x of [95,455,1005,1308,1610])if(Math.abs(x-g.camera.x-W/2)<W){RetroScene.stall(c,x,214,g.id==='shoot'?'深夜加辣':'带薪摸鱼',g.id==='shoot');RetroScene.lamp(c,x+58,224,g.id==='shoot');}
 for(const [n,x] of [35,350,630,915,1200,1510].entries())if(x>g.camera.x-50&&x<g.camera.x+W+50){RetroScene.bench(c,x+9,221);RetroScene.bin(c,x+43,220);if(n%2===0){RetroScene.chair(c,x+64,221,-.3);RetroScene.planter(c,x+93,222);}else{RetroScene.cone(c,x+65,222);RetroScene.crate(c,x+88,221);}if(n%3===0)RetroScene.sign(c,x+120,215,n?'施工绕行':'夜市 →');}
 for(const p of g.platforms){if(p.gone)continue;cube(c,p.x,p.y,p.w,p.h,5,g.id==='shoot'?'#6f6577':'#b58b79',g.id==='shoot'?'#a6a1ac':'#d4bd8a','#594b68');rect(c,p.x,p.y,p.w,4,g.id==='shoot'?'#b3b9ad':'#9ebd87');for(let x=p.x+8;x<p.x+p.w-4;x+=19){rect(c,x,p.y+10,8,3,'#655c7040');if(p.h>15)rect(c,x+5,p.y+21,11,2,'#d3b8a535');}if(p.crumble){for(let x=p.x+7;x<p.x+p.w;x+=17)poly(c,[[x,p.y],[x+4,p.y+5],[x+1,p.y+10]],p.timer>=0?'#ffe1a7':'#615771');}}
 drawTraps(c,g);
 for(const i of g.items)if(i.active){let y=i.y+Math.sin(g.t*4+i.x)*2;rect(c,i.x+2,y,6,11,'#ffdf8b');rect(c,i.x,y+3,10,5,'#f4c977');rect(c,i.x+4,y+3,2,5,'#af8a65');}
 for(const e of g.enemies)if(e.hp>0){if(e.kind==='fort'){
  RetroScene.fortress(c,e,g.t);
  rect(c,e.x-5,e.y-13,50,4,'#343449');rect(c,e.x-5,e.y-13,50*e.hp/e.maxHp,4,'#f5b891');text(c,'收摊堡垒',e.x+18,e.y-19,'#ffe1bd',8,'center');
 }else{sprite(c,e,e.kind==='guard'?'#ae829d':'#d89691','bag',g.t,e.kind==='guard'?'ranger':'worker');if(e.kind==='guard')rect(c,e.x-7,e.y+11,10,4,'#30394e');if(e.shield){poly(c,[[e.x-3,e.y+2],[e.x-7,e.y+10],[e.x-4,e.y+21],[e.x-1,e.y+14]],'#b4ddeb');}if(e.telegraph)text(c,'!',e.x+8,e.y-9,'#ffe09f',12,'center');}}
 const exit=g.exit;rect(c,exit.x,exit.y,3,exit.h,'#dcd6b1');poly(c,[[exit.x+3,exit.y],[exit.x+29,exit.y+7],[exit.x+3,exit.y+17]],'#a6d3bb');text(c,'下班',exit.x+9,exit.y-6,'#fff2c9',8,'center');
 if(g.fakeExit){const f=g.fakeExit;rect(c,f.x,f.y,2,f.h,'#dcd6b1');poly(c,[[f.x+2,f.y],[f.x+21,f.y+5],[f.x+2,f.y+13]],'#e6b893');text(c,f.sprung?'骗你的':'提前下班',f.x+10,f.y-7,'#f9d2b1',8,'center');}
 sprite(c,g.p,g.id==='shoot'?'#b08cba':'#a796d5','duck',g.t,g.id==='shoot'?'ranger':'worker',g.attack>0);
 if(g.id==='shoot')rect(c,g.p.x+(g.p.face>0?10:-9),g.p.y+10,13,4,'#d7cebb');
 drawFx(c,g);c.restore();
}
function drawClimb(c,g){
 skyline(c,0,'climb');c.save();c.translate(0,-Math.floor(g.camera.y));
 rect(c,10,88,364,458,'#6a738c');for(let y=127;y<540;y+=84)for(let x=30;x<360;x+=46){rect(c,x,y,22,30,'#a2b2b8');rect(c,x+9,y,3,30,'#56697d');}
 for(let floor=0;floor<6;floor++){const yy=528-floor*84;RetroScene.bench(c,floor%2?132:238,yy-1);RetroScene.crate(c,floor%2?208:145,yy-2);if(floor%2)RetroScene.chair(c,257,yy-2);else RetroScene.bin(c,80,yy-1);rect(c,15,yy-49,16,15,'#3c5363');text(c,String(floor+1)+'F',18,yy-39,'#c3d3c2',8);for(let x=62;x<330;x+=55){rect(c,x,yy-61,15,9,'#677886');rect(c,x+2,yy-59,11,1,'#b0b9ab');}}
 RetroScene.sign(c,81,108,'禁止加班');RetroScene.planter(c,293,108);
 for(const p of g.platforms){cube(c,p.x,p.y,p.w,p.h,4,'#9b7e84','#d9b59a','#5b526c');rect(c,p.x,p.y+3,p.w,3,'#dac18a');}
 for(const l of g.ladders){const phase=(g.t+(l.phase||0))%6.4,hot=g.difficulty>0&&phase>4.9,warning=g.difficulty>0&&phase>4.1;
  rect(c,l.x-9,l.y,3,l.h,hot?'#b7ecfa':'#d3b58f');rect(c,l.x+7,l.y,3,l.h,hot?'#b7ecfa':'#d3b58f');for(let y=l.y+3;y<l.y+l.h;y+=9)rect(c,l.x-7,y,14,3,hot?'#72bfe2':'#f0d3a5');rect(c,l.x-3,l.y-6,6,3,warning?(hot?'#f6a7b9':Math.sin(g.t*20)>0?'#f2d18f':'#775671'):'#a8c8a3');if(hot)text(c,'⚡',l.x-3,l.y+l.h/2,'#ffffff',9);
 }
 // Original angular ape foreman, built entirely from flat-shaded polygons.
 RetroScene.ape(c,190,106,g.t);
 text(c,'需求又来了！',191,31,'#f4e3ce',10,'center');cube(c,g.exit.x,g.exit.y+8,22,22,4,'#d1b171','#f6dfa4','#9e7e64');text(c,'薪',g.exit.x+6,g.exit.y+24,'#5b526a',9);
 for(const b of g.hazards)RetroScene.barrel(c,b.x,b.y,g.t);
 sprite(c,g.p,'#a9d0b1','duck',g.t);if(g.attack>0)rect(c,g.p.x-9,g.p.y+8,34,6,'#ffe4b0');drawFx(c,g);c.restore();
}
function drawBrawl(c,g){
 rect(c,0,0,W,H,'#797ba7');poly(c,[[0,160],[75,58],[141,160]],'#b4b7c5');poly(c,[[75,58],[141,160],[100,138]],'#909aaf');poly(c,[[220,145],[320,18],[410,145]],'#a3b1bf');poly(c,[[320,18],[410,145],[340,123]],'#8890ad');
 rect(c,0,167,W,89,'#9bbdb5');for(let i=0;i<7;i++)rect(c,i*65+Math.floor(g.t*3)%35,184+i%3*13,38,2,'#c4d0c4');
 for(const p of g.platforms){cube(c,p.x,p.y,p.w,p.h,10,'#a58b8c','#d9ccad','#6e627e');rect(c,p.x,p.y,p.w,4,'#a9c6a5');}
 if(g.arenaWarning){rect(c,48,213,35,3,Math.sin(g.t*20)>0?'#ffdf96':'#d090a0');rect(c,286,213,50,3,Math.sin(g.t*20)>0?'#ffdf96':'#d090a0');}
 tree(c,186,86);RetroScene.lamp(c,70,145);RetroScene.bench(c,300,145);RetroScene.chair(c,47,144,-.4);RetroScene.planter(c,110,147);RetroScene.bin(c,328,146);RetroScene.sign(c,192,104,'请勿打架');sprite(c,g.p,'#b3a2dd','duck',g.t,'worker',g.attack>0);sprite(c,g.rival,'#cca472','bag',g.t);
 if(g.attack>0){const p=g.p;rect(c,p.x+(p.face>0?11:-14),p.y+8,20,7,'#f5d5a1');}
 if(g.rival.swing>0){const p=g.rival;rect(c,p.x+(p.face>0?11:-14),p.y+8,20,7,'#eca19b');}
 if(g.difficulty>0&&g.t%4.7<.42)alertRing(c,g.rival.x+8,g.rival.y+20,14,'#bde9e2');
 if(g.rival.telegraph)text(c,'!',g.rival.x+8,g.rival.y-9,'#ffe1a1',12,'center');
 text(c,'场外淘汰 · 伤害越高，飞得越远',192,17,'#f8efdd',8,'center');
 drawFx(c,g);
}
function drawFx(c,g){for(const b of g.bullets)rect(c,b.x,b.y,b.w,b.h,b.enemy?'#ff9da2':'#fff1ab');for(const p of g.particles)rect(c,p.x,p.y,2,2,p.color);}
function alertRing(c,x,y,r,color){c.strokeStyle=color;c.lineWidth=1;c.beginPath();for(let i=0;i<=10;i++){const a=i/10*Math.PI*2;if(i)c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.35);else c.moveTo(x+r,y);}c.stroke();}
function drawTraps(c,g){for(const t of g.traps){
 if(t.kind==='rune'){poly(c,[[t.x+t.w/2,t.y],[t.x+t.w,t.y+t.h/2],[t.x+t.w/2,t.y+t.h],[t.x,t.y+t.h/2]],t.hot?'#d887a0':t.warning?'#d9ba8c':'#7b887e');text(c,'×',t.x+t.w/2,t.y+t.h/2+3,t.hot?'#ffe8b9':'#b8b28b',11,'center');}
 else if(t.kind==='mine'){rect(c,t.x,t.y,t.w,t.h,t.hot?'#ffcda0':'#7b6b83');if(t.warning&&!t.hot)rect(c,t.x+6,t.y+1,4,2,Math.sin(g.t*20)>0?'#ffca8f':'#5c4d68');}
 else if(t.kind==='spike'){if(t.hot)for(let x=t.x;x<t.x+t.w;x+=7)poly(c,[[x,t.y+t.h],[x+3,t.y],[x+7,t.y+t.h]],'#dfc5bb');else {rect(c,t.x,t.y,t.w,3,t.warning?'#e4ae8d':'#8f7f82');rect(c,t.x+3,t.y+1,3,4,'#4e4b65');}}
}}
function drawGame(c,g){
 c.imageSmoothingEnabled=false;c.save();if(g.shake>0)c.translate(Math.sin(g.t*80)*2,Math.cos(g.t*90)*2);
 if(g.id==='quest')drawQuest(c,g);if(g.id==='jump'||g.id==='shoot')drawSide(c,g);if(g.id==='climb')drawClimb(c,g);if(g.id==='brawl')drawBrawl(c,g);
 c.restore();
 // A sparse 15-bit-style ordered dither, rather than a blur over the pixels.
 c.fillStyle='#342f5a08';for(let y=0;y<H;y+=4)for(let x=(y%8?2:0);x<W;x+=4)c.fillRect(x,y,1,1);
}
function previews(){document.querySelectorAll('[data-preview]').forEach(n=>{const g=new Game(n.dataset.preview,1,199);g.camera.x=g.id==='shoot'?1190:0;g.camera.y=g.id==='climb'?25:g.id==='quest'?220:0;if(g.id==='quest'){g.p.x=64;g.p.y=430;}if(g.id==='climb'){g.p.x=180;g.p.y=86;}drawGame(n.getContext('2d'),g);});}
function lobby(){
 clearInput();current=null;$('lobby').hidden=false;$('game').hidden=true;document.title='绷不住街机厅 · 新街口';
 $('cartridges').innerHTML=GAMES.map((g,i)=>'<button class="cartridge" data-game="'+g.id+'" style="--cart:'+g.color+'"><div class="art"><canvas data-preview="'+g.id+'" width="384" height="256"></canvas><span class="genre">'+g.genre+'</span></div><div class="cart-caption"><strong>'+g.name+'</strong><span>'+(stats[g.id]?stats[g.id].wins+' 次通关 · 最佳 '+stats[g.id].best:'未通关')+'</span></div></button>').join('');
 previews();requestAnimationFrame(()=>{const b=document.querySelectorAll('[data-game]')[selected];if(b)b.focus({preventScroll:true});});
}
function openGame(id,retry=false){
 current=new Game(id,difficulty,Date.now()%99991);selected=GAMES.findIndex(g=>g.id===id);clearInput();acc=0;
 $('lobby').hidden=true;$('game').hidden=false;$('gameName').textContent=current.def.name;$('goal').textContent=current.def.goal;$('actionA').textContent=current.def.a;$('actionB').textContent=current.def.b;
 $('buttonA').setAttribute('aria-label',current.def.a);$('buttonB').setAttribute('aria-label',current.def.b);$('keyboardHelp').textContent='方向键 / WASD 移动 · Z / 空格：'+current.def.a+' · X / Shift：'+current.def.b;
 document.title=current.def.name+' · 新街口';if(retry)current.start();overlay();hud();drawGame(ctx,current);
}
function begin(){if(!current)return;clearInput();if(current.phase==='ready')current.start();else if(current.phase==='paused')current.phase='running';else if(current.phase==='won'||current.phase==='lost'){openGame(current.id,true);}
 acc=0;last=performance.now();overlay();tone(660,.09);canvas.focus({preventScroll:true});}
function pause(){if(!current)return;if(current.phase==='running'){current.phase='paused';clearInput();overlay();}else if(current.phase==='paused')begin();}
function overlay(){
 const g=current;if(!g)return;const el=$('overlay');el.hidden=g.phase==='running';
 if(el.hidden)return;
 const phase=g.phase;$('overlayTitle').textContent=phase==='ready'?'准备好挨生活的打了吗？':phase==='paused'?'先歇一口气':phase==='won'?'这把，绷住了！':'这把，没绷住。';
 $('overlayText').textContent=phase==='ready'?g.def.goal:phase==='paused'?'已经暂停。回来继续，别让老板发现。':g.reason;
 $('overlayTag').textContent=phase==='ready'?['轻松','硬核','地狱'][difficulty]+' · '+g.def.genre:phase==='paused'?'暂停中':'本局 '+g.score+' 分';
 $('begin').textContent=phase==='ready'?'开整':phase==='paused'?'继续':'再来一把';$('begin').focus({preventScroll:true});
 $('pause').textContent=phase==='paused'?'继续':'暂停';
}
let previousHud='';
function hud(){if(!current)return;const g=current,life=g.id==='brawl'?g.p.lives:g.p.hp;
 const state=[Math.ceil(g.time),g.score,life,g.objective(),Math.floor(g.stamina),Math.floor(g.heat),g.warningTime>0?g.warning:''].join('|');if(state===previousHud)return;previousHud=state;
 $('health').textContent='♥'.repeat(Math.max(0,life));$('time').textContent=Math.max(0,Math.ceil(g.time))+' 秒';$('score').textContent=String(g.score).padStart(5,'0');$('objective').textContent=g.objective();
 $('staminaFill').style.width=g.stamina+'%';$('staminaFill').style.background=g.stamina<25?'#efb1bc':'#b4d9bb';$('meterName').textContent=g.id==='shoot'?'枪温 '+Math.floor(g.heat)+'%':'体力 '+Math.floor(g.stamina)+'%';
 if(g.id==='shoot'){$('staminaFill').style.width=(100-g.heat)+'%';$('staminaFill').style.background=g.heat>75?'#efb1bc':'#b4d9bb';}
 $('danger').textContent=g.warningTime>0?g.warning:g.difficulty===2?'地狱难度：看前摇、留退路，贪一下就得重来。':'';
}
function input(){
 const now=performance.now(),result={};for(const k of keys)result[k]=true;for(const k of touch.values())result[k]=true;Object.keys(pulse).forEach(k=>{if(pulse[k]>now)result[k]=true;});
 if(nativePad&&now-nativeTime<300)Object.keys(nativePad).forEach(k=>{if(nativePad[k])result[k]=true;});
 try{const p=padDevice;if(p){const b=i=>!!p.buttons[i]&&p.buttons[i].pressed;result.left=result.left||b(14)||p.axes[0]<-.28;result.right=result.right||b(15)||p.axes[0]>.28;result.up=result.up||b(12)||p.axes[1]<-.28;result.down=result.down||b(13)||p.axes[1]>.28;result.a=result.a||b(0);result.b=result.b||b(2)||b(5);}}
 catch(e){}return result;
}
function pollGamepad(now){
 try{padDevice=Array.from(navigator.getGamepads?navigator.getGamepads():[]).find(Boolean)||null;}catch(e){padDevice=null;}
 if(!padDevice){padPrevious=[];return;}
 const buttons=padDevice.buttons.map(b=>!!b.pressed),edge=i=>buttons[i]&&!padPrevious[i];
 if(hostActive){
  if(edge(9))pad('pause',true);
  if(edge(1))back();
  if(!current||current.phase!=='running'){
   if(edge(0))pad('accept',true);
   const x=padDevice.axes[0]||0,y=padDevice.axes[1]||0;
   const dir=buttons[14]||x<-.28?'left':buttons[15]||x>.28?'right':buttons[12]||y<-.28?'up':buttons[13]||y>.28?'down':null;
   if(dir&&now>padDirectionAt){pad(dir,true);padDirectionAt=now+180;}
   if(!dir)padDirectionAt=0;
  }
 }
 padPrevious=buttons;
}
function completed(){
 const g=current;if(!g||!['won','lost'].includes(g.phase)||g.recorded)return;g.recorded=true;
 const s=stats[g.id]||{best:0,wins:0,plays:0};s.plays++;s.best=Math.max(s.best,g.score);if(g.phase==='won')s.wins++;stats[g.id]=s;save();tone(g.phase==='won'?880:165,.18);clearInput();overlay();
 $('announcer').textContent=g.phase==='won'?'通关成功。'+g.reason:'挑战失败。'+g.reason;
}
function frame(now){
 const elapsed=last?Math.min((now-last)/1000,.08):0;last=now;
 pollGamepad(now);
 if(current&&hostActive){
  if(current.phase==='running'){
   acc+=elapsed;const k=input();const oldScore=current.score,oldHp=current.p.hp;
   while(acc>=1/120){current.step(1/120,k);acc-=1/120;}
   if(current.score>oldScore)tone(740,.035);if(current.p.hp<oldHp)tone(110,.09);completed();
  }else acc=0;
  drawGame(ctx,current);hud();
 }
 raf=requestAnimationFrame(frame);
}
document.addEventListener('click',e=>{
 const cart=e.target.closest('[data-game]');if(cart){openGame(cart.dataset.game);tone(520);return;}
 const diff=e.target.closest('[data-difficulty]');if(diff){difficulty=Number(diff.dataset.difficulty);document.querySelectorAll('[data-difficulty]').forEach(b=>{b.classList.toggle('active',b===diff);b.setAttribute('aria-pressed',b===diff?'true':'false');});}
});
$('begin').addEventListener('click',begin);$('pause').addEventListener('click',pause);$('leave').addEventListener('click',lobby);$('overlayLobby').addEventListener('click',lobby);
$('sound').addEventListener('click',()=>{muted=!muted;$('sound').textContent=muted?'音效 关':'音效 开';$('sound').setAttribute('aria-pressed',!muted?'true':'false');if(!muted)tone();});
if(parent===window)$('phoneHome').textContent='全屏';
$('phoneHome').addEventListener('click',()=>{if(parent!==window)parent.postMessage({type:'CITY_ARCADE_HOME'},'*');else if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>{});});
document.querySelectorAll('[data-control]').forEach(b=>{
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,b.dataset.control);b.classList.add('pressed');if(audio&&audio.state==='suspended')audio.resume();});
 const release=e=>{touch.delete(e.pointerId);b.classList.remove('pressed');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
});
window.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(current){if(current.phase==='running')pause();else lobby();}else if(parent!==window)parent.postMessage({type:'CITY_ARCADE_HOME'},'*');return;}
 if(current){const k=keyboard[e.key.toLowerCase()];if(k){e.preventDefault();if((current.phase==='ready'||current.phase==='paused')&&k==='a'&&!e.repeat)begin();else keys.add(k);}
  if(e.key.toLowerCase()==='p'&&!e.repeat){e.preventDefault();pause();}if(e.key.toLowerCase()==='r'&&!e.repeat){e.preventDefault();openGame(current.id,true);}}
});
window.addEventListener('keyup',e=>{const k=keyboard[e.key.toLowerCase()];if(k)keys.delete(k);});
function deactivate(){clearInput();if(current&&current.phase==='running'){current.phase='paused';overlay();}if(audio&&audio.state==='running')audio.suspend();}
window.addEventListener('blur',deactivate);document.addEventListener('visibilitychange',()=>{if(document.hidden)deactivate();});
let nativePad=null,nativeTime=0,nativeMask=0;
function hostInput(mask){
 nativePad={left:!!(mask&1),right:!!(mask&2),up:!!(mask&4),down:!!(mask&8),a:!!(mask&16),b:!!(mask&32)};nativeTime=performance.now();
 if((mask&64)&&!(nativeMask&64))pad('pause',true);nativeMask=mask;
}
function pad(action,direct=false){
 if(window.ArcadeSupport?.open)return ArcadeSupport.pad(action);
 if(action==='pause'){const now=performance.now();if(now-lastPauseAt>180){lastPauseAt=now;pause();}return true;}
 if(action==='back')return back();if(action==='home'){lobby();return true;}
 if(padDevice&&!direct)return true;
 if(!current){
  if(action==='accept'){openGame(GAMES[selected].id);return true;}
  selected=(selected+(action==='left'||action==='up'?-1:1)+GAMES.length)%GAMES.length;const b=document.querySelectorAll('[data-game]')[selected];if(b){b.focus();b.scrollIntoView({block:'nearest'});}return true;
 }
 if(current.phase==='running'&&performance.now()-nativeTime<300&&nativePad)return true;
 if(action==='accept'){if(current.phase!=='running')begin();else pulse.a=performance.now()+110;return true;}
 if(action==='attack'){pulse.b=performance.now()+180;return true;}
 if(['left','right','up','down'].includes(action))pulse[action]=performance.now()+180;return true;
}
function back(){if(window.ArcadeSupport?.close())return true;const now=performance.now();if(now-lastBackAt<180)return true;lastBackAt=now;if(!current)return false;if(current.phase==='running'){pause();return true;}lobby();return true;}
window.cityArcadeHost={
 active(v){hostActive=!!v;nativePad=null;if(!v)deactivate();else{last=performance.now();if(audio&&audio.state==='suspended'&&!muted)audio.resume();}},
 back,pad,input:hostInput,
 inspect(){return {game:current&&current.id,phase:current&&current.phase,score:current&&current.score,hp:current&&current.p.hp,objective:current&&current.objective(),active:hostActive,games:GAMES.length,overflow:document.documentElement.scrollWidth>innerWidth};}
};
// Read-only state and deterministic stepping support local gameplay acceptance checks.
window.XJKArcade={get game(){return current;},open:openGame,draw:()=>{if(current)drawGame(ctx,current);},inspect:window.cityArcadeHost.inspect};
lobby();raf=requestAnimationFrame(frame);
})();
