/* Original characters and geometry. Simulation uses seconds and a fixed timestep. */
(function(root){
'use strict';
const W=384,H=256;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const mid=o=>({x:o.x+o.w/2,y:o.y+o.h/2});
const distance=(a,b)=>Math.hypot(mid(a).x-mid(b).x,mid(a).y-mid(b).y);
const GAMES=[
 {id:'quest',name:'地铁口勇者',genre:'俯视探索',tag:'青铜锅盖，也能拯救地铁口。',goal:'找齐 3 张地铁卡，击败闸机魔王，赶上末班车。',a:'锅盖斩',b:'翻滚',color:'#9ed6a2',time:150},
 {id:'jump',name:'牛马蹦班',genre:'横版跳跃',tag:'别救公主了，先救你的全勤奖。',goal:'跨过施工断层、踩扁加班怪，收集 8 枚工钱后到达下班站。',a:'跳跃',b:'冲刺',color:'#ffb37f',time:115},
 {id:'shoot',name:'鸭血突击队',genre:'跑跳射击',tag:'双枪没有，双倍辣油管够。',goal:'穿越夜市弹幕，跳过坑洞，打掉收摊堡垒。',a:'跳跃',b:'发射',color:'#f28eaa',time:115},
 {id:'climb',name:'猿工大楼',genre:'攀登躲避',tag:'老板往下扔的，全是需求。',goal:'沿梯子向上爬，跨过滚动的需求桶，拿回楼顶的工资袋。',a:'跳跃',b:'砸桶',color:'#e9ca71',time:100},
 {id:'brawl',name:'街口大乱斗',genre:'平台乱斗',tag:'鸭嘴打工人大战外卖纸袋怪。',goal:'用攻击累积对手伤害并将其击出场外。双方各 3 条命。',a:'跳跃 / 二段跳',b:'出拳',color:'#c2acf5',time:150}
];
class Game {
 constructor(id,difficulty=1,seed=719){
  this.def=GAMES.find(g=>g.id===id)||GAMES[0];this.id=this.def.id;this.difficulty=clamp(difficulty,0,2);
  this.factor=[0.8,1,1.3][this.difficulty];this.seed=seed;this.time=this.def.time*[1.25,1,.9][this.difficulty];
  this.phase='ready';this.t=0;this.score=0;this.reason='';this.camera={x:0,y:0};this.width=W;this.height=H;
  this.previous={};this.p={x:28,y:180,w:14,h:22,vx:0,vy:0,hp:[5,3,2][this.difficulty],face:1,ground:false,inv:0,jumps:0};
  this.enemies=[];this.platforms=[];this.walls=[];this.items=[];this.bullets=[];this.particles=[];this.hazards=[];
  this.cooldown=0;this.attack=0;this.dash=0;this.shake=0;this.collected=0;this.timer=0;this.message='';
  this.stamina=100;this.recover=0;this.traps=[];this.warning='';this.warningTime=0;this.heat=0;this.parry=0;
  this.setup();
  this.setupAmbushes();
 }
 rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 platform(x,y,w,h=14){const p={x,y,w,h};this.platforms.push(p);return p;}
 enemy(x,y,kind='walker',hp=2){const e={x,y,w:18,h:20,vx:-22,vy:0,hp,maxHp:hp,kind,cd:.8+this.rand(),inv:0,face:-1};this.enemies.push(e);return e;}
 item(x,y,kind='coin'){this.items.push({x,y,w:10,h:12,kind,active:true});}
 setup(){
  if(this.id==='quest'){
   this.width=768;this.height=512;Object.assign(this.p,{x:48,y:430});
   this.walls=[{x:0,y:0,w:768,h:18},{x:0,y:494,w:768,h:18},{x:0,y:0,w:18,h:512},{x:750,y:0,w:18,h:512},
    {x:148,y:285,w:120,h:38},{x:320,y:170,w:38,h:160},{x:442,y:340,w:140,h:40},{x:75,y:95,w:140,h:52},{x:485,y:125,w:74,h:100}];
   [[300,430],[110,220],[610,280]].forEach(p=>this.item(...p,'card'));
   [[235,400],[96,265],[390,200],[624,200],[500,450]].forEach(p=>this.enemy(...p,'blob',2));
   this.enemy(644,52,'gate',12);this.exit={x:680,y:30,w:44,h:38};
  } else if(this.id==='jump'||this.id==='shoot'){
   this.width=this.id==='jump'?1770:1510;Object.assign(this.p,{x:28,y:194});
   [[0,224,260],[310,224,230],[590,224,245],[890,224,220],[1160,224,250],[1465,224,305]].forEach(p=>this.platform(...p,40));
   [[152,179,65],[370,172,68],[670,172,68],[950,172,68],[1240,170,70],[1530,171,72]].forEach(p=>this.platform(...p,12));
   if(this.id==='jump'){
    [[132,204],[178,156],[330,203],[398,149],[490,203],[611,203],[699,149],[788,203],[926,203],[978,149],[1080,203],[1198,203],[1262,147],[1370,203],[1480,203],[1553,149],[1660,203]].forEach(p=>this.item(...p));
    [205,425,700,1000,1280,1570].forEach(x=>this.enemy(x,204,'overtime',1));this.exit={x:1704,y:176,w:35,h:48};
   }else{
    [210,390,648,930,1180].forEach(x=>this.enemy(x,204,'guard',3));
    this.enemy(1414,160,'fort',24);this.exit={x:1460,y:180,w:30,h:44};
    this.platforms=this.platforms.filter(p=>p.x<1510);this.platforms.forEach(p=>p.w=Math.min(p.w,1510-p.x));
   }
  }else if(this.id==='climb'){
   this.height=560;Object.assign(this.p,{x:28,y:506});
   for(let i=0;i<6;i++)this.platform(12,528-i*84,360,10);
   this.ladders=[{x:318,y:444,h:84},{x:48,y:360,h:84},{x:318,y:276,h:84},{x:48,y:192,h:84},{x:318,y:108,h:84}];
   this.exit={x:42,y:74,w:22,h:34};this.timer=1.6;
  }else{
   Object.assign(this.p,{x:82,y:174,hp:3});
   this.platform(48,216,288,24);this.platform(38,148,76,10);this.platform(266,148,76,10);this.platform(156,106,72,10);
   this.rival={x:285,y:174,w:16,h:24,vx:0,vy:0,ground:false,jumps:0,face:-1,damage:0,lives:3,inv:0,cd:1.4};
   this.p.damage=0;this.p.lives=3;
  }
 }
 start(){this.phase='running';this.previous={};}
 spend(amount){if(this.stamina<amount){this.warn('体力见底！停手，喘口气。');return false;}this.stamina-=amount;this.recover=.6;return true;}
 warn(message){this.warning=message;this.warningTime=2;}
 setupAmbushes(){
  if(this.difficulty===0)return;
  if(this.id==='quest'){
   this.traps=[{x:260,y:402,w:32,h:30,kind:'rune',phase:0},{x:560,y:245,w:34,h:30,kind:'rune',phase:1.3},{x:630,y:118,w:35,h:24,kind:'rune',phase:2.1}];
   this.items.push({x:407,y:365,w:10,h:12,kind:'mimic',active:true});
  }
  if(this.id==='jump'){
   this.platforms.filter(p=>p.h===12&&[370,950,1530].includes(p.x)).forEach(p=>{p.crumble=true;p.timer=-1;});
   this.traps=[{x:465,y:215,w:20,h:9,kind:'spike',timer:-1},{x:1020,y:215,w:24,h:9,kind:'spike',timer:-1},{x:1350,y:215,w:24,h:9,kind:'spike',timer:-1}];
   this.fakeExit={x:1090,y:190,w:20,h:34};
  }
  if(this.id==='shoot'){
   this.traps=[{x:470,y:211,w:16,h:13,kind:'mine',timer:-1},{x:1040,y:211,w:16,h:13,kind:'mine',timer:-1}];
  }
  if(this.id==='climb')this.ladders.forEach((l,i)=>l.phase=i*1.1);
 }
 finish(win,reason){if(this.phase!=='running')return;this.phase=win?'won':'lost';this.reason=reason;this.previous={};if(win)this.score+=Math.max(0,Math.floor(this.time))*10+500;}
 burst(x,y,color,n=10){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(this.rand()-.5)*100,vy:-this.rand()*90,life:.35+this.rand()*.3,color});}
 hurt(amount=1,fromX=this.p.x-10){
  if(this.p.inv>0||this.phase!=='running')return;
  this.p.hp-=amount;this.p.inv=1.1;this.shake=.18;this.burst(this.p.x,this.p.y,'#fff0ad');
  if(this.id==='quest')this.moveTop(this.p,fromX<this.p.x?14:-14,0);
  if(this.p.hp<=0)this.finish(false,'全勤奖被扣光了。重来一把，别硬接伤害。');
 }
 moveTop(body,dx,dy){
  body.x+=dx;for(const w of this.walls)if(hit(body,w))body.x=dx>0?w.x-body.w:w.x+w.w;
  body.y+=dy;for(const w of this.walls)if(hit(body,w))body.y=dy>0?w.y-body.h:w.y+w.h;
 }
 physics(body,dt,oneWay=true){
  const bottom=body.y+body.h;body.vy+=500*dt;body.x+=body.vx*dt;body.y+=body.vy*dt;body.ground=false;
  for(const p of this.platforms)if(!p.gone&&body.vy>=0&&bottom<=p.y+2&&body.y+body.h>=p.y&&body.x+body.w>p.x&&body.x<p.x+p.w){body.y=p.y-body.h;body.vy=0;body.ground=true;body.jumps=0;if(body===this.p&&p.crumble&&p.timer<0){p.timer=.55;this.warn('空心平台：听到开裂就该走了。');}}
  if(this.id!=='brawl')body.x=clamp(body.x,0,this.width-body.w);
 }
 step(dt,input={}){
  if(this.phase!=='running'){this.previous={...input};return;}
  dt=clamp(dt,0,.0334);this.t+=dt;this.time-=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.attack=Math.max(0,this.attack-dt);this.dash=Math.max(0,this.dash-dt);this.shake=Math.max(0,this.shake-dt);this.p.inv=Math.max(0,this.p.inv-dt);
  this.warningTime=Math.max(0,this.warningTime-dt);this.recover=Math.max(0,this.recover-dt);if(!this.recover)this.stamina=Math.min(100,this.stamina+27*dt);this.heat=Math.max(0,this.heat-dt*18);
  this.edgeA=!!input.a&&!this.previous.a;this.edgeB=!!input.b&&!this.previous.b;
  if(this.time<=0){this.finish(false,this.id==='brawl'?'加时赛结束，没能打败纸袋怪。':'末班车走了。注意计时，别在原地和生活对线。');return;}
  if(this.id==='quest')this.updateQuest(dt,input);
  if(this.id==='jump'||this.id==='shoot')this.updateSide(dt,input);
  if(this.id==='climb')this.updateClimb(dt,input);
  if(this.id==='brawl')this.updateBrawl(dt,input);
  this.updateTraps(dt);
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt;}
  this.particles=this.particles.filter(p=>p.life>0);
  this.camera.x=clamp(this.p.x-W*.38,0,this.width-W);this.camera.y=clamp(this.p.y-H*.58,0,this.height-H);
  this.previous={...input};
 }
 updateQuest(dt,k){
  const p=this.p;let dx=Number(!!k.right)-Number(!!k.left),dy=Number(!!k.down)-Number(!!k.up);let length=Math.hypot(dx,dy)||1;
  if(dx)p.face=dx;
  if(this.edgeB&&this.cooldown<=0&&this.spend(23)){this.dash=.19;this.cooldown=.48;p.inv=.27;this.burst(p.x,p.y,'#b7efaa',5);}
  const speed=this.dash>0?240:92;this.moveTop(p,dx/length*speed*dt,dy/length*speed*dt);
  if(this.edgeA&&this.cooldown<=.3&&this.spend(19)){this.attack=.18;this.cooldown=.35;this.enemies.forEach(e=>{if(e.hp>0&&distance(p,e)<43){e.hp-=2;this.burst(e.x,e.y,'#ffe8a0');if(e.hp<=0)this.score+=100;}});}
  for(const item of this.items)if(item.active&&hit(p,item)){item.active=false;
   if(item.kind==='mimic'){const e=this.enemy(item.x+24,item.y-6,'blob',4);e.cd=1;this.warn('假地铁卡长出了牙齿！');continue;}
   this.collected++;this.score+=150;this.burst(item.x,item.y,'#ffdc75');
   if(this.difficulty===2){this.enemy(item.x+30,item.y-45,'blob',2);this.warn('卡片到手，追兵也到站了。');}}
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.cd-=dt;
   if(e.kind==='gate'){
    if(e.hp<=6&&!e.phase2){e.phase2=true;e.cd=1.3;this.warn('闸机进入晚高峰！第二阶段，别贪刀。');this.burst(e.x,e.y,'#ffbdaf',24);}
    e.telegraph=e.cd<.55;
    if(e.cd<=0){e.cd=(e.phase2?1.35:1.9)/this.factor;const a=Math.atan2(p.y-e.y,p.x-e.x);for(let n=-1;n<=1;n++)this.bullets.push({x:e.x+9,y:e.y+15,w:5,h:5,vx:Math.cos(a+n*(e.phase2?.4:.24))*95*this.factor,vy:Math.sin(a+n*(e.phase2?.4:.24))*95*this.factor,enemy:true,life:6});
     if(e.phase2&&this.difficulty>0)for(let n=0;n<8;n++){const a=n/8*Math.PI*2;this.bullets.push({x:e.x+10,y:e.y+10,w:4,h:4,vx:Math.cos(a)*68,vy:Math.sin(a)*68,enemy:true,life:4});}}
   }else{
    const dx=p.x-e.x,dy=p.y-e.y,l=Math.hypot(dx,dy)||1;
    if(e.cd<.45&&l<90){e.telegraph=true;if(e.cd<0){e.charge={x:dx/l,y:dy/l};e.cd=2.3;e.rush=.35;e.telegraph=false;}}
    if(e.rush>0){e.rush-=dt;this.moveTop(e,e.charge.x*145*dt,e.charge.y*145*dt);}else this.moveTop(e,dx/l*23*this.factor*dt,dy/l*23*this.factor*dt);
   }
   if(hit(p,e))this.hurt(1,e.x);
  }
  this.updateBullets(dt);
  const boss=this.enemies.find(e=>e.kind==='gate');
  if(this.collected===3&&boss.hp<=0&&hit(p,this.exit))this.finish(true,'三张地铁卡都齐了。末班车为你多等了一站。');
 }
 updateSide(dt,k){
  const p=this.p;const prevBottom=p.y+p.h;const speed=this.id==='jump'?(k.b?138:102):100;
  p.vx=(Number(!!k.right)-Number(!!k.left))*speed;if(p.vx)p.face=Math.sign(p.vx);
  // Coyote time and a small input buffer keep narrow jumps demanding but fair.
  this.coyote=p.ground?.095:Math.max(0,(this.coyote||0)-dt);
  this.jumpBuffer=this.edgeA?.12:Math.max(0,(this.jumpBuffer||0)-dt);
  if(this.jumpBuffer>0&&this.coyote>0){p.vy=-235;p.ground=false;this.coyote=0;this.jumpBuffer=0;}
  this.physics(p,dt);
  if(p.y>H+24){this.finish(false,'掉进施工坑了。边缘起跳，冲刺能跨得更远。');return;}
  if(this.id==='shoot'&&k.b&&this.cooldown<=0&&this.heat<94){this.cooldown=.15;this.heat+=6;this.bullets.push({x:p.x+(p.face>0?p.w:-5),y:p.y+8,w:7,h:3,vx:p.face*265,vy:k.up?-95:0,enemy:false,life:2.1});this.burst(p.x+p.w/2,p.y+9,'#ffe4a0',2);if(this.heat>=94){this.cooldown=1.45;this.warn('辣油枪过热！换位躲弹，等它冷却。');}}
  for(const item of this.items)if(item.active&&hit(p,item)){item.active=false;this.collected++;this.score+=50;this.burst(item.x,item.y,'#ffe094',6);}
  for(const e of this.enemies){
   if(e.hp<=0)continue;e.cd-=dt;e.inv=Math.max(0,e.inv-dt);
   if(e.kind==='overtime'){
    if(e.origin===undefined)e.origin=e.x;
    e.x+=e.vx*this.factor*dt;if(Math.abs(e.x-e.origin)>32)e.vx*=-1;
    if(hit(p,e)){
     if(p.vy>20&&prevBottom<=e.y+7){e.hp=0;p.vy=-170;this.score+=100;this.burst(e.x,e.y,'#f99da2');}
     else this.hurt(1,e.x);
    }
   }else{
    if(e.kind==='fort'){e.w=40;e.h=64;e.y=160;}
    if(e.kind==='fort'&&e.hp<=12&&!e.phase2){e.phase2=true;e.cd=.95;this.warn('堡垒掀桌！低位回旋弹来了。');this.burst(e.x,e.y,'#ffbc8b',24);}
    e.telegraph=e.cd<.5;e.shield=e.kind==='guard'&&this.difficulty>0&&(this.t+e.x*.01)%4<.9;
    if(e.cd<=0&&Math.abs(e.x-p.x)<430){
     e.cd=(e.kind==='fort'?1.1:1.75)/this.factor;
     const center=mid(e),target=mid(p),a=Math.atan2(target.y-center.y,target.x-center.x);
     const angles=e.kind==='fort'?[-.18,0,.18]:[0];for(const da of angles)this.bullets.push({x:center.x,y:center.y,w:5,h:5,vx:Math.cos(a+da)*100*this.factor,vy:Math.sin(a+da)*100*this.factor,enemy:true,life:4,returning:e.phase2,age:0});
    }
    if(hit(p,e))this.hurt(1,e.x);
   }
  }
  this.updateBullets(dt);
  if(hit(p,this.exit)){
   if(this.id==='jump'&&this.collected>=8)this.finish(true,'全勤奖保住了。老板说：明天能不能早点来？');
   if(this.id==='shoot'&&this.enemies.find(e=>e.kind==='fort').hp<=0)this.finish(true,'收摊堡垒已拆。鸭血粉丝汤，今天加蛋。');
  }
 }
 updateBullets(dt){
  for(const b of this.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.age=(b.age||0)+dt;if(b.returning&&b.age>1.4&&!b.turned){b.vx*=-1;b.turned=true;}
   if(this.walls.some(w=>hit(b,w))){b.life=0;continue;}
   if(b.enemy){if(hit(b,this.p)){this.hurt(1,b.x);b.life=0;}}
   else for(const e of this.enemies)if(e.hp>0&&hit(b,e)){b.life=0;if(e.shield){this.burst(b.x,b.y,'#b8e4f1',4);break;}e.hp--;this.score+=10;this.burst(b.x,b.y,'#ffcf88',4);if(e.hp<=0){this.score+=150;this.burst(e.x,e.y,'#ff8f72',16);}break;}
  }
  this.bullets=this.bullets.filter(b=>b.life>0);
 }
 updateClimb(dt,k){
  const p=this.p;p.vx=(Number(!!k.right)-Number(!!k.left))*88;if(p.vx)p.face=Math.sign(p.vx);
  const ladder=this.ladders.find(l=>Math.abs(p.x+p.w/2-l.x)<15&&p.y+p.h>=l.y-3&&p.y<=l.y+l.h+5);
  if(ladder&&(k.up||k.down)){
   p.x=ladder.x-p.w/2;p.y+=(k.up?-1:1)*65*dt;p.vy=0;p.ground=false;
   if(p.y+p.h<ladder.y+2){p.y=ladder.y-p.h;p.ground=true;}
   if(this.difficulty>0&&(this.t+ladder.phase)%6.4>4.9){this.hurt(1,ladder.x);this.warn('梯子通电了！看闪灯，等断电再爬。');}
  }else{
   if(this.edgeA&&p.ground){p.vy=-210;p.ground=false;}
   this.physics(p,dt);
  }
  p.x=clamp(p.x,12,358);
  if(this.edgeB&&this.cooldown<=0&&this.spend(38)){this.cooldown=.7;this.attack=.23;
   for(const b of this.hazards)if(distance(p,b)<40){b.dead=true;this.score+=60;this.burst(b.x,b.y,'#e9c26c');}}
  this.timer-=dt;
  if(this.timer<=0){this.timer=2.2/this.factor;const level=this.rand()<.7?this.platforms.length-1:Math.floor(this.rand()*5);const shelf=this.platforms[level];this.hazards.push({x:this.rand()<.5?18:348,y:shelf.y-15,w:14,h:14,vx:0,vy:0,level,age:0});const b=this.hazards[this.hazards.length-1];b.vx=b.x<100?65*this.factor:-65*this.factor;}
  for(const b of this.hazards){b.x+=b.vx*dt;b.age+=dt;if(b.x<12||b.x>356){b.vx*=-1;b.level--;if(b.level>=0)b.y=this.platforms[b.level].y-15;else b.dead=true;}
   if(!b.dead&&hit(b,p)){this.hurt(1,b.x);b.dead=true;}}
  this.hazards=this.hazards.filter(b=>!b.dead&&b.age<35);
  if(p.y>this.height+25)this.finish(false,'一不留神，又回到一楼打卡了。');
  if(hit(p,this.exit))this.finish(true,'拿到工资袋！这次不接受“下个月一起发”。');
 }
 knock(target,from,strength){
  if(target.inv>0)return;target.damage+=strength;target.vx=(from.x<target.x?1:-1)*(96+target.damage*2.6);target.vy=-(115+target.damage*.55);target.stun=.27;target.inv=.32;target.ground=false;this.shake=.12;this.burst(target.x,target.y,'#f4d4ff',8);this.score+=target===this.rival?20:0;
 }
 updateBrawl(dt,k){
  const p=this.p,r=this.rival;
  for(const b of [p,r]){b.inv=Math.max(0,b.inv-dt);b.stun=Math.max(0,(b.stun||0)-dt);}
  if(!p.stun)p.vx=(Number(!!k.right)-Number(!!k.left))*112;if(p.vx)p.face=Math.sign(p.vx);
  if(this.edgeA&&p.jumps<2){p.vy=-226;p.jumps++;p.ground=false;}
  if(k.up&&this.edgeB&&this.cooldown<=0&&this.spend(24)){this.cooldown=.38;p.inv=.23;p.vx=p.face*195;p.stun=.14;this.dash=.2;}
  else if(this.edgeB&&this.cooldown<=0&&this.spend(21)){this.cooldown=.34;this.attack=.17;const box={x:p.face>0?p.x:p.x-27,y:p.y-5,w:41,h:32};
   if(hit(box,r)){if(this.difficulty>0&&(this.t%4.7)<.42){this.warn('纸袋怪弹反！它抱臂时别乱按。');this.knock(p,r,22);}else this.knock(r,p,18);}}
  r.cd-=dt;const dx=p.x-r.x;if(!r.stun){r.face=Math.sign(dx)||-1;r.vx=Math.abs(dx)>26?r.face*(64+this.difficulty*12):0;
   if(((p.y<r.y-32&&r.ground)||(!r.ground&&r.y>188))&&r.jumps<2){r.vy=-218;r.jumps++;r.ground=false;}
   if(r.ground&&(r.x<60||r.x>305)){r.vy=-205;r.vx=r.x<60?95:-95;r.jumps++;}
  }
  r.telegraph=r.cd<.28&&Math.abs(dx)<65;
  if(r.cd<=0&&Math.abs(dx)<43&&Math.abs(p.y-r.y)<30){r.cd=.95/this.factor;this.knock(p,r,15);r.swing=.17;}
  r.swing=Math.max(0,(r.swing||0)-dt);
  for(const b of [p,r]){
   this.physics(b,dt);
   if(b.x<-70||b.x>W+70||b.y>H+55){
    b.lives--;this.burst(clamp(b.x,10,W-10),220,'#ffffff',18);b.damage=0;
    Object.assign(b,{x:b===p?90:278,y:44,vx:0,vy:0,jumps:0,inv:1.6,stun:0});
    if(b.lives<=0)this.finish(b===r,b===r?'纸袋怪被打下班了。你是今晚的街口擂主。':'被生活击飞了。二段跳能救场，伤害越高越容易出界。');
   }
  }
 }
 updateTraps(dt){
  const p=this.p;
  for(const platform of this.platforms)if(platform.crumble&&platform.timer>=0){platform.timer-=dt;if(platform.timer<=0&&!platform.gone){platform.gone=true;platform.timer=3.5;this.burst(platform.x+platform.w/2,platform.y,'#d5b8a0',12);}else if(platform.gone&&platform.timer<=0){platform.gone=false;platform.timer=-1;}}
  for(const trap of this.traps){
   if(trap.kind==='rune'){const phase=(this.t+trap.phase)%4.2;trap.hot=phase>3.2;trap.warning=phase>2.55;if(trap.hot&&hit(p,trap))this.hurt(1,trap.x);}
   else if(trap.kind==='spike'||trap.kind==='mine'){
    if(trap.timer<0&&Math.abs(p.x-trap.x)<65){trap.timer=.65;trap.warning=true;this.warn(trap.kind==='mine'?'地雷亮了。别站着讨论，跳！':'地板在抖，马上有东西出来！');}
    if(trap.timer>=0&&!trap.spent){trap.timer-=dt;if(trap.timer<=0){trap.hot=true;trap.spent=true;trap.life=trap.kind==='mine'?.45:2.8;if(trap.kind==='mine'){trap.x-=20;trap.y-=26;trap.w=56;trap.h=40;}else{trap.y-=14;trap.h=23;}}}
    if(trap.hot){trap.life-=dt;if(hit(p,trap))this.hurt(1,trap.x);if(trap.life<=0)trap.hot=false;}
   }
  }
  if(this.id==='jump'&&this.fakeExit&&!this.fakeExit.sprung&&Math.abs(p.x-this.fakeExit.x)<22){this.fakeExit.sprung=true;this.enemy(p.x+45,180,'overtime',1);this.warn('假下班站。真正的出口还在后面。');this.score+=20;}
  if(this.id==='brawl'&&this.difficulty>0){
   this.arenaWarning=this.t%15>11.5;const hot=this.t%15>13;
   if(hot&&p.ground&&(p.x<82||p.x>286)){this.knock(p,{x:192},12);this.warn('擂台两端漏电，中间才安全。');}
  }
 }
 objective(){
  if(this.id==='quest')return '地铁卡 '+this.collected+'/3 · 闸机 '+Math.max(0,this.enemies.find(e=>e.kind==='gate').hp)+'/12';
  if(this.id==='jump')return '工钱 '+this.collected+'/8 · 路程 '+Math.min(100,Math.floor(this.p.x/17))+'%';
  if(this.id==='shoot')return '堡垒 '+Math.max(0,this.enemies.find(e=>e.kind==='fort').hp)+'/24 · 自动连射按住 B';
  if(this.id==='climb')return '楼层 '+clamp(Math.floor((528-this.p.y)/84)+1,1,6)+'/6 · 工资在楼顶';
  return '你 '+this.p.lives+' 命 '+Math.floor(this.p.damage)+'% · 纸袋怪 '+this.rival.lives+' 命 '+Math.floor(this.rival.damage)+'%';
 }
}
root.XJKArcadeCore={Game,GAMES,W,H,hit,clamp};
if(typeof module!=='undefined')module.exports=root.XJKArcadeCore;
})(typeof window!=='undefined'?window:globalThis);
