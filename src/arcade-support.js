(function(){
'use strict';
const codes=/* PAYMENT_IMAGES */;
const dialog=document.getElementById('supportDialog');
const image=document.getElementById('payImage');
const tabs=[document.getElementById('payWechat'),document.getElementById('payAlipay')];
let method=0;
function select(i){
 method=i;const name=i?'支付宝':'微信';
 image.src=codes[i?'alipay':'wechat'];image.alt='作者提供的'+name+'个人收款码';
 tabs.forEach((tab,n)=>{tab.setAttribute('aria-selected',String(n===i));tab.tabIndex=n===i?0:-1;});
 document.getElementById('payPanel').setAttribute('aria-labelledby',tabs[i].id);
 document.getElementById('payInstructions').textContent='长按保存收款码，打开'+name+'扫一扫，从相册识别，输入 ¥1 并核对收款人。';
}
function close(){if(dialog.open){dialog.close();document.getElementById('supportOpen').focus({preventScroll:true});return true;}return false;}
document.getElementById('supportOpen').onclick=()=>{select(0);dialog.showModal();};
document.getElementById('supportClose').onclick=close;
tabs.forEach((tab,i)=>tab.onclick=()=>select(i));
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
document.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();select(1-method);tabs[method].focus();}},true);
window.ArcadeSupport={get open(){return dialog.open;},close,pad(action){if(action==='back'||action==='pause'||action==='home')close();else if(['up','down','left','right'].includes(action)){select(1-method);tabs[method].focus();}return true;}};
})();
