/* Tiny flat-shaded mesh renderer. Original models, projected in the canvas. */
(function(root){
'use strict';
const PI=Math.PI;
function tint(hex,k){const n=parseInt(hex.replace('#',''),16);return '#'+[n>>16&255,n>>8&255,n&255].map(v=>Math.max(0,Math.min(255,Math.round(v*k))).toString(16).padStart(2,'0')).join('');}
class Mesh {
 constructor(){this.faces=[];}
 face(v,c){this.faces.push({v,c});}
 box(x,y,z,w,h,d,c){
  const a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],cc=[x+w/2,y+h,z-d/2],dd=[x-w/2,y+h,z-d/2];
  const e=[x-w/2,y,z+d/2],f=[x+w/2,y,z+d/2],g=[x+w/2,y+h,z+d/2],j=[x-w/2,y+h,z+d/2];
  this.face([a,b,cc,dd],tint(c,.72));this.face([b,f,g,cc],tint(c,.83));this.face([f,e,j,g],c);this.face([e,a,dd,j],tint(c,.9));this.face([dd,cc,g,j],tint(c,1.17));this.face([a,e,f,b],tint(c,.63));return this;
 }
 sphere(x,y,z,rx,ry,rz,c,segments=7,rings=4){
  const pt=(i,j)=>{const a=i/rings*PI,b=j/segments*PI*2;return [x+Math.sin(a)*Math.cos(b)*rx,y+Math.cos(a)*ry,z+Math.sin(a)*Math.sin(b)*rz];};
  for(let i=0;i<rings;i++)for(let j=0;j<segments;j++){const a=pt(i,j),b=pt(i,j+1),cc=pt(i+1,j+1),d=pt(i+1,j);this.face([a,b,cc],tint(c,.8+.26*(1-i/rings)+.1*Math.cos(j/segments*PI*2)));this.face([a,cc,d],tint(c,.76+.26*(1-i/rings)+.1*Math.cos(j/segments*PI*2)));}return this;
 }
 cone(x,y,z,r,h,c,n=7){for(let i=0;i<n;i++){const a=i/n*PI*2,b=(i+1)/n*PI*2;this.face([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x,y+h,z],[x+Math.cos(b)*r,y,z+Math.sin(b)*r]],tint(c,.77+.23*Math.cos(a)));}return this;}
 draw(c,x,y,yaw=.4,scale=1){
  const co=Math.cos(yaw),si=Math.sin(yaw),convert=p=>{const xx=p[0]*co+p[2]*si,zz=-p[0]*si+p[2]*co,per=1+zz*.007;return {x:x+xx*scale*per,y:y-p[1]*scale+zz*.34*scale,z:zz-p[1]*.05};};
  const faces=this.faces.map(f=>{const v=f.v.map(convert);return {v,c:f.c,z:v.reduce((s,p)=>s+p.z,0)/v.length};}).sort((a,b)=>a.z-b.z);
  for(const f of faces){c.fillStyle=f.c;c.beginPath();f.v.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();}
 }
}
function shadow(c,x,y,w=18,h=5){c.fillStyle='#25314845';c.beginPath();for(let i=0;i<8;i++){const a=i/8*PI*2;const xx=x+Math.cos(a)*w/2,yy=y+Math.sin(a)*h/2;if(i)c.lineTo(xx,yy);else c.moveTo(xx,yy);}c.closePath();c.fill();}
function duck(c,p,color,clock,role='worker',attacking=false){
 if(p.inv>0&&Math.floor(clock*15)%2===0)return;
 const m=new Mesh(),walk=Math.abs(p.vx||0)>3?Math.sin(clock*12):0,bob=walk?Math.abs(walk)*.65:0;
 shadow(c,p.x+p.w/2,p.y+p.h+1,23,6);
 m.box(-3,1+Math.max(0,walk)*2,0,4,5,6,'#454261').box(3,1+Math.max(0,-walk)*2,0,4,5,6,'#454261');
 m.box(-3,.2+Math.max(0,walk)*2,1,5,2,8,'#e1ae6a').box(3,.2+Math.max(0,-walk)*2,1,5,2,8,'#e1ae6a');
 m.box(0,6,0,9,9,6,color).box(0,6.3,3.2,9,2,1,'#685b80');
 m.box(-2,10,3.6,2,3,1,'#ddc4a4').box(2,10,3.6,2,3,1,'#e9d6b6').box(0,8,3.7,1,1,1,'#d6c9b2');
 m.box(-3,13,-4.3,2,5,2,'#635c72').box(0,7,-5,7,7,3,'#918465').box(0,10,-6.7,6,1,1,'#d0b78c');
 m.sphere(0,20,0,5.3,5.5,4.6,'#f2ddbb',8,4);
 m.sphere(0,17,4.8,3.8,1.8,3.2,'#edaa65',6,2);
 const blink=Math.floor(clock*2.2)%13===0;
 m.box(-2.6,21,3.7,1.4,blink?.6:2.3,1.3,'#35354f').box(2.6,21,3.7,1.4,blink?.6:2.3,1.3,'#35354f');
 if(!blink)m.box(-2.8,22,4.4,.6,.6,.5,'#fff1cf').box(2.4,22,4.4,.6,.6,.5,'#fff1cf');
 if(role==='hero'){
  m.cone(0,24,0,5.8,6,'#709c9c',7);m.box(0,24,3.7,9,1.3,5,'#94bcaa');
  m.face([[-4,14,-3.5],[4,14,-3.5],[6,3,-5],[-6,3,-5]],'#698487');
 }else if(role==='ranger'){
 m.box(0,24,0,11,2.8,9,'#70778f').box(0,23,3,11,1.5,7,'#64667f');
 m.box(0,11,3.5,8,3,2,'#5b526e').box(-3,15,3.5,2,2,2,'#d7b982').box(3,15,3.5,2,2,2,'#d7b982');
 }else{
  m.sphere(0,24,0,5.8,2.8,5,'#6d638d',8,2);m.box(0,23,3,11,1.3,8,'#9a8baa');m.box(0,25.3,0,3,1,3,'#d4c19f');
 }
 const arm=attacking?3:0;m.box(-6,7+bob,walk,3,7,3,color).sphere(-6,6+bob,walk,2,2,2,'#e6cfad',6,3);
 m.box(6,8+arm,-walk+arm,3,7,3,color).sphere(6,7+arm,-walk+arm,2.1,2.1,2.1,'#e6cfad',6,3);
 if(role==='hero'){m.sphere(7,9+arm,3+arm,4.7,4.7,1.6,'#bac3b6',8,3);m.sphere(7,9+arm,5+arm,1.3,1.3,1,'#f0d7a0',6,2);}
 if(role==='ranger'){m.box(7,10,8,3,3,12,'#49495e').box(7,11,15,3,2,4,'#aaa3ae');m.box(7,12,8,3,2,4,'#c7bcab');}
 m.draw(c,p.x+p.w/2,p.y+p.h,(p.face||1)*.75,.97);
}
function bag(c,p,clock,guard=false){
 if(p.inv>0&&Math.floor(clock*15)%2===0)return;const m=new Mesh(),walk=Math.abs(p.vx||0)>0?Math.sin(clock*9):0;
 shadow(c,p.x+9,p.y+22,22,6);m.box(-4,0,0,5,4,6,'#6c4c66').box(4,1+walk,0,5,4,6,'#6c4c66');
 m.box(0,4,0,13,16,9,'#c39975').box(0,19,0,13,3,10,'#aa7c68');
 m.box(-3,13,4.7,2.5,3,1,'#493c56').box(3,13,4.7,2.5,3,1,'#493c56');m.box(0,8,5,5,1.5,1,'#eee1b4');
 m.box(-8,6,0,3,8,3,'#aa7c68').box(8,6,0,3,8,3,'#aa7c68');
 m.box(0,5,5,9,2,1,'#6c5366').box(0,5,5.7,2,2,1,'#deb68c');
 if(guard){m.box(0,21,0,15,3,11,'#7d647d');m.box(8,10,8,3,3,13,'#49455e').box(8,11,15,3,2,3,'#c6bcc0');m.box(-6,14,5,4,6,2,'#7b667c').box(6,14,5,4,6,2,'#7b667c');if(p.shield)m.box(-11,4,6,3,17,10,'#93b3be').box(-12,10,11,3,4,1,'#d3e1d4');}
 m.draw(c,p.x+9,p.y+p.h,(p.face||-1)*.38,1.05);
}
function ape(c,x,y,clock){
 const m=new Mesh();shadow(c,x,y+2,70,13);m.sphere(0,23,0,21,25,14,'#806277',7,4).sphere(0,41,3,15,14,12,'#a9808c',7,4);
 m.sphere(0,36,12,11,7,5,'#dab89c',7,3).box(-5,44,12,4,4,2,'#382e47').box(5,44,12,4,4,2,'#382e47');
 m.sphere(-23,22,0,9,19,9,'#806277',6,3).sphere(23,22,0,9,19,9,'#806277',6,3);
 m.box(-23,1,3,13,8,13,'#ad8590').box(23,1,3,13,8,13,'#ad8590').box(-11,0,0,12,11,13,'#674f69').box(11,0,0,12,11,13,'#674f69');
 m.box(0,27,13,12,5,2,'#b5cab1').box(0,54,0,28,4,24,'#c9a36d').sphere(0,57,0,14,6,12,'#dbb97d',8,3).box(0,55,14,7,3,2,'#f6dd9b');
 m.box(0,31,17,5,2,1,'#70505d').box(-25,9,9,13,20,3,'#8fa595').box(-25,12,11,9,13,1,'#e3d4b1');
 m.draw(c,x,y,Math.sin(clock)*.12,.9);
}
function barrel(c,x,y,clock=0){
 const m=new Mesh();m.sphere(0,7,0,8.5,8.5,6.5,'#b38970',8,4).box(0,6,6.2,13,2,1,'#d8b693').box(0,2,4.8,10,1,2,'#5a5268').box(0,11,4.8,10,1,2,'#5a5268');m.draw(c,x+7,y+14,clock*3,.95);
}
function lamp(c,x,y,night=false){const m=new Mesh();m.box(0,0,0,3,40,3,'#555b73').box(5,39,0,13,3,4,'#67758a').box(10,37,0,7,2,6,night?'#ffe1a0':'#c8cfbd').box(0,0,0,8,2,8,'#4d4c64').draw(c,x,y,.15,1);if(night){c.fillStyle='#ffe5a00b';c.beginPath();c.moveTo(x+5,y-36);c.lineTo(x-17,y);c.lineTo(x+36,y);c.lineTo(x+14,y-36);c.fill();}}
function stall(c,x,y,label,night=false){
 const m=new Mesh();m.box(0,0,0,40,18,20,'#8b6e7d').box(0,17,0,45,3,24,'#baa18a');m.box(-18,18,0,2,24,3,'#71607b').box(18,18,0,2,24,3,'#71607b');
 m.box(0,41,0,46,6,25,night?'#a66d85':'#8d9c9b');for(let i=-2;i<=2;i++)m.box(i*8,39,12,7,6,3,i%2?'#e1c6a1':'#a3748e');
 m.box(0,29,0,24,11,2,'#46465d').box(-10,20,3,4,6,4,'#d3b783').box(4,20,3,7,3,6,'#d9d1b3').sphere(9,22,2,3,3,3,'#bc7792',6,3);
 m.draw(c,x,y,.27,.9);c.fillStyle='#f0d5ad';c.font='bold 7px "Microsoft YaHei"';c.textAlign='center';c.fillText(label,x,y-28);c.textAlign='left';
}
function metro(c,x,y){
 const m=new Mesh();m.box(0,0,0,43,30,20,'#637e82').box(0,30,0,48,5,24,'#b7b2a7').box(0,5,10.4,27,21,1,'#3c435c');
 m.box(-12,33,0,2,19,2,'#535e77').box(12,33,0,2,19,2,'#535e77').box(0,45,0,34,8,7,'#a8b79e');
 for(let i=0;i<4;i++)m.box(0,i*2,13+i*3,23,2,5,'#aab3b0');m.draw(c,x,y,.23,1);
 c.fillStyle='#343e54';c.font='bold 7px "Microsoft YaHei"';c.textAlign='center';c.fillText('地 铁 M',x,y-46);c.textAlign='left';
}
function bench(c,x,y){const m=new Mesh();shadow(c,x,y+1,34,7);for(let i=0;i<3;i++)m.box(0,9,i*3-3,29,2,2,'#a18b77');for(let i=0;i<2;i++)m.box(0,15+i*4,-5,29,3,2,'#b19b83');for(const s of [-1,1])m.box(s*10,0,0,3,10,8,'#515d66').box(s*14,11,0,2,3,12,'#63717a').box(s*14,10,-5,2,8,2,'#63717a');m.draw(c,x,y,.2,1);}
function chair(c,x,y,yaw=.3){const m=new Mesh();shadow(c,x,y+1,16,5);m.box(0,10,0,14,2,13,'#ba9c7b').box(0,17,-5,14,8,2,'#c4ad87');for(const s of [-1,1])for(const z of [-4,4])m.box(s*5,0,z,2,11,2,'#596773');m.draw(c,x,y,yaw,1);}
function cone(c,x,y){new Mesh().box(0,0,0,11,2,11,'#7f6b72').cone(0,2,0,4,13,'#d69b72').cone(0,7,0,2.5,4,'#eee0bd').draw(c,x,y,.2,1);}
function bin(c,x,y){const m=new Mesh();m.box(0,0,0,13,20,13,'#597c78').box(0,19,0,15,3,15,'#869d89').box(0,17,7,8,3,1,'#273e49');for(let i=-1;i<2;i++)m.box(i*4,2,7,1,11,1,'#79948b');m.box(0,10,7.5,6,3,1,'#cad5b6').draw(c,x,y,.3,1);}
function planter(c,x,y){const m=new Mesh();m.box(0,0,0,20,12,17,'#878586').box(0,11,0,23,3,20,'#b6b2a5').box(0,13,0,18,1,14,'#645c60');for(const [xx,z] of [[-5,2],[4,3],[0,-3]])m.sphere(xx,18,z,6,7,5,'#6c967b',6,3);m.draw(c,x,y,.2,1);}
function crate(c,x,y){const m=new Mesh();m.box(0,0,0,20,17,17,'#af9276');for(const s of [-1,1])m.box(s*7,0,9,2,17,1,'#755c60');m.box(0,2,9,19,2,1,'#d0b58a').box(0,13,9,19,2,1,'#d0b58a').box(0,8,9,6,3,1,'#d4c6a3').draw(c,x,y,.4,1);}
function sign(c,x,y,label='新街口'){const m=new Mesh();m.box(0,0,0,3,39,3,'#596778').box(0,30,0,37,12,3,'#668d87').box(0,42,0,41,2,5,'#a7b8a0');m.draw(c,x,y,.1,1);c.fillStyle='#e4e1ba';c.font='bold 7px "Microsoft YaHei"';c.textAlign='center';c.fillText(label,x,y-33);c.textAlign='left';}
function slime(c,p,clock){const m=new Mesh(),squash=Math.sin(clock*4+p.x)*1.2;shadow(c,p.x+9,p.y+21,22,6);m.sphere(0,9,0,10,10+squash,8,'#bf8299',7,4).cone(-5,15,0,3,5,'#dfb696').cone(5,15,0,3,5,'#dfb696');m.box(-3,10,7,2.5,3,1,'#41394e').box(3,10,7,2.5,3,1,'#41394e').box(0,5,8,6,2,1,'#eee1b5').box(0,14,7,8,2,1,'#916b88');m.draw(c,p.x+9,p.y+21,(p.face||1)*.2,1);}
function gateBoss(c,p,clock){const m=new Mesh(),hot=p.phase2,col=hot?'#a37488':'#73878d',raise=p.telegraph?6:Math.sin(clock*3)*1.2;shadow(c,p.x+14,p.y+31,52,11);m.box(0,2,0,27,28,17,col).box(0,29,0,34,4,21,'#b5b9a9').box(0,14,10,24,10,2,'#4b4a62').box(0,17,12,18,3,1,hot?'#f3a398':'#c1d4b5');for(const s of [-1,1]){m.box(s*19,8+raise,0,9,20,11,col).box(s*19,6+raise,2,11,5,13,'#aa9b9a').box(s*8,0,0,9,4,19,'#555a6c').box(s*8,23,10,5,4,2,p.telegraph?'#fff0b3':'#edafa2').cone(s*12,32,0,4,9,'#c3cfb9');m.box(s*10,6,10,2,2,1,'#d1c5a0').box(s*10,27,10,2,2,1,'#d1c5a0');}m.box(0,36,0,13,3,14,hot?'#e8b27d':'#b9c5ae').box(0,3,12,8,2,3,'#ded7b5');m.draw(c,p.x+14,p.y+31,Math.sin(clock)*.15,.96);}
function fortress(c,p,clock){const m=new Mesh();m.box(0,0,0,39,59,27,p.phase2?'#7e6275':'#666477').box(0,58,0,45,5,31,'#a8a4a9').box(0,8,15,29,17,1,'#373e53');for(const s of [-1,1]){m.box(s*13,27,14,7,17,2,'#8f96a1').box(s*13,33,16,4,5,1,p.telegraph?'#ffe2a2':'#be879d').cone(s*15,64,0,5,11,'#979f9c');m.box(s*13,2,16,7,2,1,'#e3c28f');}m.box(-23,30,0,19,8,8,'#a49c9e').box(-32,31,0,4,6,10,'#4b475b').box(0,44,15,27,9,2,'#444255').box(0,47,17,19,2,1,p.phase2?'#f29b92':'#d3b48f');for(let i=0;i<4;i++)m.box(-12+i*8,61,0,3,8,3,'#9a98a4');m.draw(c,p.x+20,p.y+64,.19,1);}
function pigeon(c,x,y,clock){const m=new Mesh();m.sphere(0,4,0,4,3,3,'#a2a5ac',6,3).sphere(3,8,0,2.5,3,2,'#7b8f99',6,3).box(5,7,1,3,1,2,'#d3b081').box(-1,0,0,1,2,1,'#b89b8c').box(2,0,0,1,2,1,'#b89b8c');m.draw(c,x,y,Math.sin(clock)*.2,.85);}
function building(c,x,y,w,h,night=false,seed=0){
 const m=new Mesh();m.box(0,0,0,w,h,17,night?'#554b68':'#7a909d').box(0,h,0,w+4,4,20,night?'#7b6887':'#a8bbb8').box(4,h+4,0,w*.4,6,12,'#758397');
 for(let row=0;row<Math.floor(h/14);row++)for(let col=0;col<Math.floor(w/10);col++){const lit=(row*7+col*3+seed)%4;const c0=night?(lit?'#d6aa80':'#554763'):(lit?'#b9cecb':'#7c9aa6');m.box(-w/2+6+col*10,7+row*14,8.7,4,6,1,c0);}
 for(let i=0;i<Math.floor(h/28);i++)m.box(-w/2+2,12+i*28,10,2,2,3,'#5c7686');
 m.box(-w*.25,h+4,0,3,13,3,'#5f7086').box(-w*.25,h+15,0,14,1,2,'#798d99');
 m.draw(c,x,y,.15,1);
}
const spriteCache=new Map();
function cached(fn){return (c,x,y,...args)=>{const key=fn.name+JSON.stringify(args);let tile=spriteCache.get(key);if(!tile){tile=document.createElement('canvas');tile.width=256;tile.height=256;fn(tile.getContext('2d'),128,208,...args);spriteCache.set(key,tile);}c.drawImage(tile,Math.round(x)-128,Math.round(y)-208);};}
root.RetroScene={duck,bag,ape,barrel,slime,gateBoss,fortress,pigeon,Mesh,lamp:cached(lamp),stall:cached(stall),metro:cached(metro),bench:cached(bench),building:cached(building),chair:cached(chair),cone:cached(cone),bin:cached(bin),planter:cached(planter),crate:cached(crate),sign:cached(sign)};
})(window);
