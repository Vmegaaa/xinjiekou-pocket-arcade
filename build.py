from pathlib import Path
import base64,json
p=Path(__file__).resolve().parent
s=p/'src'
codes={k:'data:image/png;base64,'+base64.b64encode((p/'assets'/(k+'-collection.png')).read_bytes()).decode() for k in ['wechat','alipay']}
support=(s/'arcade-support.js').read_text(encoding='utf-8').replace('/* PAYMENT_IMAGES */',json.dumps(codes))
html=(s/'arcade-shell.html').read_text(encoding='utf-8').replace('/* ARCADE_BLACK */',(s/'arcade-black.css').read_text(encoding='utf-8')).replace('/* ARCADE_CORE */',(s/'arcade-core.js').read_text(encoding='utf-8')).replace('/* ARCADE_VIEW */',(s/'arcade-3d.js').read_text(encoding='utf-8')+'\n'+support+'\n'+(s/'arcade-view.js').read_text(encoding='utf-8'))
(p/'index.html').write_text(html,encoding='utf-8')
print('Built index.html')
