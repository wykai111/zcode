#!/usr/bin/env node
/**
 * Clean standalone packer — reuses the proven Mintegral adapter mechanism
 * (pako → __adapter_resource__ → __adapter_js__ → hijack → Cocos)
 * but strips ALL ad/tracking scripts. Only resource-loading adapter remains.
 *
 * Output: bitcoin-miner-standalone.html
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;
const ASSETS_DIR = path.join(ROOT, 'assets');
const JS_DIR = path.join(ROOT, 'js');
const OUT = path.join(ROOT, 'bitcoin-miner-standalone.html');

// ─── Read essential adapter scripts ─────────────────────────────
const pakoJs     = fs.readFileSync(path.join(JS_DIR, '7762983d7824aeabeebe3d27582fd397.js'), 'utf8');
const hijackJs   = fs.readFileSync(path.join(JS_DIR, '8b8953935e3deda0f9d12805e8427dbe.js'), 'utf8');
const unzipperJs = fs.readFileSync(path.join(JS_DIR, 'aec1e69a441269c92349918e79720868.js'), 'utf8');

// ─── 每行矿石图 + 攻击动画精灵图 (data URI) ─────────────────────
function embed(name) {
  const p = path.join(ROOT, name);
  if (fs.existsSync(p)) {
    const uri = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
    console.error('[pack] embedded ' + name + ' (' + (uri.length / 1024).toFixed(0) + ' KB)');
    return uri;
  }
  console.error('[pack] ' + name + ' not found');
  return '';
}
const oreUris = [embed('icon_kuangshi1.png'), embed('icon_kuangshi2.png'), embed('icon_kuangshi3.png')];
const attackUris = [embed('attack1.png'), embed('attack2.png'), embed('attack3.png')];
const bgUri = embed('bg_main.png');
const icon256DataUri = embed('icon_256.png');
const mupaiDataUri = embed('icon_mupai.png');

// ─── 1. Collect assets ──────────────────────────────────────────
const SKIP = new Set(['.DS_Store', 'Thumbs.db']);
const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wave', m4a: 'audio/mp4',
  mp4: 'video/mp4', ttf: 'font/ttf', otf: 'font/otf',
  woff: 'font/woff', woff2: 'font/woff2',
  json: 'application/json', js: 'text/javascript',
  astc: 'image/astc', pkm: 'image/pkm', pvr: 'image/pvr',
  cconb: 'application/octet-stream', bin: 'application/octet-stream',
};
const TEXT_EXT = new Set(['js','json','txt','fnt','atlas','vsh','fsh','xml','css','html']);
const resources = {};
let totalFiles = 0;

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(ASSETS_DIR, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) { walk(full); continue; }
    const ext = (name.match(/\.([^.]+)$/) || [, ''])[1].toLowerCase();
    const buf = fs.readFileSync(full);
    if (TEXT_EXT.has(ext)) {
      resources[rel] = buf.toString('utf8');
    } else {
      const mime = MIME[ext] || 'application/octet-stream';
      resources[rel] = 'data:' + mime + ';base64,' + buf.toString('base64');
    }
    totalFiles++;
  }
}
walk(ASSETS_DIR);
console.error('[pack] collected ' + totalFiles + ' files');

// ─── 2. Compress & chunk ────────────────────────────────────────
const json = JSON.stringify(resources);
const deflated = zlib.deflateSync(json, { level: 9 });
const b64 = deflated.toString('base64');
console.error('[pack] json=' + (json.length/1024).toFixed(0) + 'KB  deflated=' + (deflated.length/1024).toFixed(0) + 'KB  b64=' + (b64.length/1024).toFixed(0) + 'KB');

// Split into two parts (like original)
const CHUNK = Math.ceil(b64.length / 2);
const part1 = b64.slice(0, CHUNK);
const part2 = b64.slice(CHUNK);
console.error('[pack] 2 parts: ' + part1.length + ' + ' + part2.length);

// ─── 3. Import map from resource map ────────────────────────────
// Use the same format as source.html original
const importMapJson = resources['src/import-map.json'] || '{"imports":{"cc":"./../cocos-js/cc.js"}}';
// We need to adjust the import map cc path for our flat structure
const importMap = '{"imports":{"cc":"./cocos-js/cc.js"}}';

// ─── 4. Emit HTML ────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,minimal-ui=true">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<meta name="msapplication-tap-highlight" content="no">
<meta name="full-screen" content="yes">
<meta name="x5-fullscreen" content="true">
<meta name="360-fullscreen" content="true">
<title>Bitcoin Miner</title>
<style>
  html { -ms-touch-action: none; }
  body, canvas, div {
    display: block; outline: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
    user-select: none; -webkit-user-select: none;
  }
  body {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    padding: 0; border: 0; margin: 0;
    cursor: default; color: #888; background-color: #333;
    text-align: center;
    font-family: Helvetica, Verdana, Arial, sans-serif;
    display: flex; flex-direction: column;
  }
  canvas { background-color: rgba(0,0,0,0); }
  #GameDiv, #Cocos3dGameContainer, #GameCanvas { width: 100%; height: 100%; }
  :root {
    --safe-top: env(safe-area-inset-top);
    --safe-right: env(safe-area-inset-right);
    --safe-bottom: env(safe-area-inset-bottom);
    --safe-left: env(safe-area-inset-left);
  }
</style>
</head>
<body>
<!-- IMPORTANT: import map MUST be in DOM before system.js loads -->
<script type="systemjs-importmap">${importMap}</script>

<!-- ===== 1. pako (zlib inflate) ===== -->
<script>${pakoJs}</script>

<!-- ===== 2-3. resource blob (zlib-deflated base64 JSON) ===== -->
<script>window.__adapter_zip__=${JSON.stringify(part1)}</script>
<script>window.__adapter_zip__+=${JSON.stringify(part2)}</script>

<!-- ===== 4. hijack: defines __adapter_init (MUST come before unzipper) ===== -->
<script>${hijackJs}</script>

<!-- ===== 5. unzipper: inflate blob -> JSON -> __adapter_resource__ -> __adapter_js__ -> calls __adapter_init() ===== -->
<script>${unzipperJs}</script>

<!-- ===== 6. 每个矿工后面放金山 + 强制挖矿动画 (运行时注入) ===== -->
<script>
(function(){
  var ORE_URIS=${JSON.stringify(oreUris)};
  var ATK_URIS=${JSON.stringify(attackUris)};
  var ICON256_URI=${JSON.stringify(icon256DataUri)};
  var MUPAI_URI=${JSON.stringify(mupaiDataUri)};
  // 预加载木牌图 (防闪现)
  var mupaiImg=new Image(); mupaiImg.src=MUPAI_URI||'';
  var BG_URI=${JSON.stringify(bgUri)};
  function ready(){ return typeof window.cc!=='undefined' && window.cc.director; }
  var started=false;
  // 场景启动瞬间: 先隐藏原始绿色标题区(换木牌前防闪现) + 彻底销毁左上角 EARN REAL 徽章
  function hideHeaderNow(){
    try{
      window.cc.director.getScene().walk(function(n){
        if(n.name==='Header Overlay'){ try{ n.active=false; }catch(e){} }
        if(n.name==='Game Logo' && n.parent && n.parent.name==='UI'){
          try{ n.active=false; }catch(e){}                  // 立即隐藏 (当帧生效, 防闪现)
          try{ n.destroy(); }catch(e){}                     // 帧末永久销毁
        }
        if(/T_Hills_Tree/i.test(n.name||'')){ try{ n.active=false; }catch(e){} }   // ★ 启动瞬间即隐藏树 (place() 之前防闪现)
      });
    }catch(e){}
  }
  function waitInject(){
    if(!ready()){ setTimeout(waitInject,120); return; }
    var cc=window.cc;
    var fire=function(){ if(!started && cc.director.getScene()){ started=true; hideHeaderNow(); setTimeout(setup, 200); } };
    cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, fire);
    setTimeout(fire, 4000); // 兜底：若事件已错过则直接尝试
  }
  function setup(){
    var cc=window.cc;
    // BTC 产出值统一缩小 10 倍: 从场景实例反查真实 Label 类, 劫持 string setter
    try{
      var scene0=cc.director.getScene();
      var realLabelCls=null;
      scene0.walk(function(n){ if(realLabelCls) return; try{ var lb=n.getComponent('cc.Label'); if(lb) realLabelCls=lb.constructor; }catch(e){} });
      if(realLabelCls && !realLabelCls.__btcScaled){
        var d=Object.getOwnPropertyDescriptor(realLabelCls.prototype,'string');
        if(d && d.set){
          var origSet=d.set;
          var decOf=function(s){ return (String(s).split('.')[1]||'').length; };
          var scale=function(v){
            var m;
            if(typeof v==='number') return v*0.1;
            if(typeof v!=='string') return v;
            var s=v.trim();
            if(/^-?\\d+(\\.\\d+)?$/.test(s)) return (parseFloat(s)*0.1).toFixed(Math.min(decOf(s)+1,8));
            if((m=s.match(/^(-?\\d+(?:\\.\\d+)?)\\s*\\/\\s*(coin.*)$/))) return (parseFloat(m[1])*0.1).toFixed(Math.min(decOf(m[1])+1,8))+' / '+m[2];
            if((m=s.match(/^(.*?=\\s*)(-?\\d+(?:\\.\\d+)?)$/))) return m[1]+(parseFloat(m[2])*0.1).toFixed(Math.min(decOf(m[2])+1,8));
            return v;
          };
          Object.defineProperty(realLabelCls.prototype,'string',{
            get:d.get,
            set:function(v){ try{ var nv=scale(v); if(nv!==undefined) v=nv; }catch(e){} return origSet.call(this,v); },
            configurable:true
          });
          realLabelCls.__btcScaled=true;
          // 已存在的初始值重写一遍, 让补丁生效 (初始 "0.1 / coin" -> "0.01 / coin")
          var reApplied=0;
          scene0.walk(function(n){
            try{ var lb=n.getComponent('cc.Label'); if(lb && lb.string) { lb.string=lb.string; reApplied++; } }catch(e){}
          });
          console.log('[inject] BTC 产出 ÷10 已生效 (真实Label类, 初始刷新:'+reApplied+')');
        }
      }
    }catch(e){ console.error('[inject] label patch',e); }
        // 行映射: 矿工帧名 -> 行号 (1/2/3)
    var ROW_BY_FRAME={'T_Miner_01_01':1,'T_Miner_04_01':2,'T_Miner_05_01':3};
    var COLS=8, ROWS=4, FRAME_MS=80;   // attack 精灵图 8x4=32帧, 每帧80ms

    // 预加载: 矿石图(3) + 攻击精灵图(3), 全部就绪后布置
    var loaded={ore:[null,null,null], atk:[null,null,null]}, pending=0;
    function uriToImg(uri, cb){
      var im=new Image(); im.onload=function(){cb(im);}; im.onerror=function(){cb(null);}; im.src=uri;
    }
    ORE_URIS.forEach(function(u,i){ pending++; uriToImg(u,function(im){ loaded.ore[i]=im; if(--pending===0) place(); }); });
    ATK_URIS.forEach(function(u,i){ pending++; uriToImg(u,function(im){ loaded.atk[i]=im; if(--pending===0) place(); }); });

    // 把精灵图切成帧 SpriteFrame (自动跳过全透明空帧, 避免播放时闪现)
    function sliceSheet(sheetImg){
      var out=[], fw=Math.floor((sheetImg.naturalWidth||sheetImg.width)/COLS), fh=Math.floor((sheetImg.naturalHeight||sheetImg.height)/ROWS);
      for(var r=0;r<ROWS;r++) for(var c=0;c<COLS;c++){
        try{
          var cv=document.createElement('canvas'); cv.width=fw; cv.height=fh;
          var ctx=cv.getContext('2d');
          ctx.drawImage(sheetImg, c*fw, r*fh, fw, fh, 0, 0, fw, fh);
          // 检测空帧: 全像素 alpha<=15 视为空, 跳过
          try{
            var data=ctx.getImageData(0,0,fw,fh).data, has=false;
            for(var p=3;p<data.length;p+=4){ if(data[p]>15){ has=true; break; } }
            if(!has) continue;   // 空帧不进循环 (闪现根源)
          }catch(e){}
          var tex=new cc.Texture2D(); tex.image=new cc.ImageAsset(cv);
          var sf=new cc.SpriteFrame(); sf.texture=tex; sf.rect=cc.rect(0,0,fw,fh);
          out.push(sf);
        }catch(e){}
      }
      return out;
    }
    function frameFromImg(im){
      var tex=new cc.Texture2D(); tex.image=new cc.ImageAsset(im);
      var sf=new cc.SpriteFrame(); sf.texture=tex;
      sf.rect=cc.rect(0,0,im.naturalWidth||im.width,im.naturalHeight||im.height);
      return sf;
    }

    function place(){
      try{
        var scene=cc.director.getScene();
        // 删除所有的树
        var treeCount=0;
        scene.walk(function(n){
          if(/T_Hills_Tree/i.test(n.name||"")){ try{ n.active=false; treeCount++; }catch(e){} }
        });
        // 左上角 EARN REAL 徽章已在启动时彻底销毁 (hideHeaderNow)
        // 标题文字已随顶部区域一起删除
        // 攻击帧切片
        var atkFrames=[[],[],[]];
        for(var i=0;i<3;i++){ if(loaded.atk[i]) atkFrames[i]=sliceSheet(loaded.atk[i]); }
        var oreSFs=[null,null,null];
        for(var k=0;k<3;k++){ if(loaded.ore[k]) oreSFs[k]=frameFromImg(loaded.ore[k]); }

        var miners=[], oreCount=0, animCount=0;
        scene.walk(function(n){
          try{
            var sp=n.getComponent('cc.Sprite');
            if(sp&&sp.spriteFrame&&ROW_BY_FRAME[sp.spriteFrame.name]) miners.push(n);
          }catch(e){}
        });
        // 矿层高度 = 相邻矿工世界Y间距 (三行约190), 矿石高度=行高×75%
        var wys=miners.map(function(mm){ try{ mm.updateWorldTransform(); return mm.getWorldPosition().y; }catch(e){ return 0; } }).sort(function(a,b){return b-a;});
        var spSum=0, spCnt=0;
        for(var wi=1; wi<wys.length; wi++){ var d=wys[wi-1]-wys[wi]; if(d>0){ spSum+=d; spCnt++; } }
        var rowH = spCnt? (spSum/spCnt) : 190;
        var oreWorldH = 160;                                   // 固定矿石世界高度 160
        miners.forEach(function(m){
          try{
            var sp=m.getComponent('cc.Sprite');
            var ut=m.getComponent('cc.UITransform');
            var row=ROW_BY_FRAME[sp.spriteFrame.name]-1;          // 0/1/2
            var mh=(ut&&ut.contentSize.height)||49;
            var origW=(ut&&ut.contentSize.width)||63, origH=mh;
            // 矿工右移 15px (沿用之前调整)
            m.setPosition(m.position.x+15, m.position.y, m.position.z||0);
            // 该行的矿石图: 按矿层高度等比缩小, 世界坐标 x=650
            var parent=m.parent;
            if(parent && oreSFs[row]){
              var oim=loaded.ore[row];
              var oW=oim.naturalWidth||oim.width, oH=oim.naturalHeight||oim.height;
              var mws=m.getWorldScale();
              var gH=oreWorldH/(mws.y||1);                        // 本地高度 = 目标世界高 / 世界缩放
              var gW=gH*oW/oH;                                    // 等比
              var ore=new cc.Node('OreRock');
              ore.addComponent('cc.UITransform');
              var osp=ore.addComponent('cc.Sprite');
              try{ osp.sizeMode=cc.Sprite.SizeMode.CUSTOM; }catch(e){}
              osp.spriteFrame=oreSFs[row];
              ore.getComponent('cc.UITransform').setContentSize(gW,gH);
              ore.setPosition(m.position.x, m.position.y+mh*0.18-10, m.position.z||0); // 先放矿工行基线
              ore.setScale(m.scale);
              parent.addChild(ore);
              try{ ore.setSiblingIndex(m.getSiblingIndex()); }catch(e){}
              // 世界坐标校正: x=700 (650+50), y 上移 31 (15+20-4)
              try{
                ore.updateWorldTransform();
                var wp=ore.getWorldPosition();
                var pws=parent.getWorldScale();
                var dx=(700-wp.x)/(pws.x||1);
                var dy=31/(pws.y||1);
                ore.setPosition(ore.position.x+dx, ore.position.y+dy, ore.position.z||0);
              }catch(e){}
              oreCount++;
            }
            // 矿工镜像朝右 (水平翻转, 放在矿石放置之后避免矿石跟着翻)
            try{ m.setScale(-Math.abs(m.scale.x||1), m.scale.y, m.scale.z||0); }catch(e){}
            // 停掉游戏自带动画组件(含父/子节点), 防止开矿交互后抢写 spriteFrame 造成闪现
            try{
              var nodesToCheck=[m, m.parent];
              for(var ci=0; ci<(m.children||[]).length; ci++) nodesToCheck.push(m.children[ci]);
              nodesToCheck.forEach(function(n){
                if(!n) return;
                var a=n.getComponent('cc.Animation');
                if(a){ try{ a.stop && a.stop(); }catch(e){} try{ a.enabled=false; }catch(e){} }
              });
            }catch(e){}
            // 该行的攻击动画: 循环切片帧 (空帧已剔除)
            if(atkFrames[row] && atkFrames[row].length){
              var frames=atkFrames[row], fi=0;
              sp.spriteFrame=frames[0];
              ut.setContentSize(origW,origH);
              setInterval(function(){
                try{ fi=(fi+1)%frames.length; sp.spriteFrame=frames[fi]; ut.setContentSize(origW,origH); }catch(e){}
              },FRAME_MS);
              animCount++;
            }
          }catch(e){ console.error('[inject] miner',e); }
        });
        // 行级标签定制: 第2行 Lv2 + 0.04/coin, 第3行 Lv3 + 0.08/coin
        // 注意: BTC ÷10 补丁会拦截标签写入, 产出率需写预缩放值 (0.4->显示0.04, 0.8->显示0.08)
        try{
          var rowOverrides={ 2:{level:'Lvl 2', rate:'0.4 / coin'}, 3:{level:'Lvl 3', rate:'0.8 / coin'} };
          var lvlLabels=[], rateLabels=[];
          scene.walk(function(n){
            if(n.name==='Row Level Label') lvlLabels.push(n);
            if(n.name==='Row Coins Per Second Label') rateLabels.push(n);
          });
          function rowOf(node){                        // 沿祖先找 "Row N" 确定行号
            var p=node, depth=0;
            while(p && depth<12){
              var m=(p.name||'').match(/Row\s*(\d)/);
              if(m) return parseInt(m[1],10);
              p=p.parent; depth++;
            }
            return 0;
          }
          var lvlDone=0, rateDone=0;
          lvlLabels.forEach(function(n,i){
            var r=rowOf(n) || (i+1);                   // 兜底: walk 顺序即行序
            if(rowOverrides[r]){ try{ n.getComponent('cc.Label').string=rowOverrides[r].level; lvlDone++; }catch(e){} }
          });
          rateLabels.forEach(function(n,i){
            var r=rowOf(n) || (i+1);
            if(rowOverrides[r]){ try{ n.getComponent('cc.Label').string=rowOverrides[r].rate; rateDone++; }catch(e){} }
          });
          console.log('[inject] 行级定制: Lv标签'+lvlDone+' 产出率'+rateDone);
        }catch(e){ console.error('[inject] rowlvl',e); }
        console.log('[inject] 矿工:'+miners.length+' 矿石:'+oreCount+' 攻击动画:'+animCount+' 删树:'+treeCount);
      }catch(e){ console.error('[inject]',e); }
    }

    // ⑤ 顶部标题区: 换木牌 + 黑色标题 (启动先隐藏防闪现, 换好再显示)
    if(MUPAI_URI){
      var applyMupai=function(){
        try{
          var mtex=new cc.Texture2D(); mtex.image=new cc.ImageAsset(mupaiImg);
          var msf=new cc.SpriteFrame(); msf.texture=mtex;
          msf.rect=cc.rect(0,0,mupaiImg.naturalWidth||mupaiImg.width,mupaiImg.naturalHeight||mupaiImg.height);
          var fixed=0;
          var mW=mupaiImg.naturalWidth||mupaiImg.width, mH=mupaiImg.naturalHeight||mupaiImg.height;
          var mAspect=mW/mH;
          cc.director.getScene().walk(function(n){
            if(n.name==='Header Overlay'){
              try{
                var sp=n.getComponent('cc.Sprite');
                sp.spriteFrame=msf;
                try{ sp.color=cc.Color.WHITE; }catch(e){}
                try{ n.color=cc.Color.WHITE; }catch(e){}
                var hut=n.getComponent('cc.UITransform');
                if(hut){
                  var hh=hut.contentSize.height;                       // 205
                  hut.setContentSize(Math.round(hh*mAspect), hh);      // ~795 等比不拉伸
                }
            n.setPosition(n.position.x, 800, n.position.z||0);    // 先移到屏幕外顶部 (木板底边~1337 > 视口顶1280, 防闪现)
            try{ n.active=true; }catch(e){}                        // 从屏幕顶外显示
            // ── 木板从顶部滑入动画 (easeOutCubic: 快进缓停, 无回弹) ──
            try{
              var DROP_FROM=800, DROP_TO=600, DROP_MS=400, DROP_T0=performance.now();
              var dropIv=setInterval(function(){
                try{
                  var t=Math.min(1,(performance.now()-DROP_T0)/DROP_MS);
                  var p=1-Math.pow(1-t,3);                         // easeOutCubic
                  n.setPosition(n.position.x, DROP_FROM+(DROP_TO-DROP_FROM)*p, n.position.z||0);
                  if(t>=1){ clearInterval(dropIv); n.setPosition(n.position.x, DROP_TO, n.position.z||0); }
                }catch(e){ clearInterval(dropIv); n.setPosition(n.position.x, DROP_TO, n.position.z||0); }
              },16);
            }catch(e){ n.setPosition(n.position.x, 600, n.position.z||0); }
                (n.children||[]).forEach(function(c){                  // 标题黑色字体
                  try{
                    var lb=c.getComponent('cc.Label');
                    if(lb){
                      lb.string='Bitcoin Master Mining';
                      try{ lb.color=cc.Color.BLACK; }catch(e){}
                      // 标题以木板底边为基准, 底边向上 35px: 标签带 Widget(底边对齐, 会覆盖直接 setPosition),
                      // 直接设 Widget.bottom=35; 对应位置 y = -102.7(板底) + 35 + 标签半高25.2 ≈ -42.5
                      try{
                        var wg=c.getComponent('cc.Widget');
                        if(wg){ wg.bottom=35; }
                      }catch(e){}
                      c.setPosition(c.position.x, -42.5, c.position.z||0);
                    }
                  }catch(e){}
                });
                fixed++;
              }catch(e){}
            }
          });
          console.log('[inject] 木牌+标题: '+fixed);
        }catch(e){ console.error('[inject] mupai',e); }
      };
      if(mupaiImg.complete && mupaiImg.naturalWidth) applyMupai();
      else mupaiImg.onload=applyMupai;
    }

    // ⑥ 上半部分背景 (Hills Background) 用 bg_main 按中心缩放适配铺满
    if(BG_URI){
      var bimg=new Image(); bimg.src=BG_URI;
      bimg.onload=function(){
        try{
          var btex=new cc.Texture2D(); btex.image=new cc.ImageAsset(bimg);
          var bsf=new cc.SpriteFrame(); bsf.texture=btex;
          bsf.rect=cc.rect(0,0,bimg.naturalWidth||bimg.width,bimg.naturalHeight||bimg.height);
          var bfixed=0;
          cc.director.getScene().walk(function(n){
            if(n.name==='Hills Background'){
              try{
                var bsp=n.getComponent('cc.Sprite');
                bsp.spriteFrame=bsf;
                try{ bsp.type=cc.Sprite.Type.SIMPLE; }catch(e){}  // 普通模式
                try{ bsp.sizeMode=cc.Sprite.SizeMode.CUSTOM; }catch(e){} // 锁定节点尺寸
                var but=n.getComponent('cc.UITransform');
                if(but) but.setContentSize(800,550);              // 铺满整个上半区域 (锚点居中=中心缩放)
                try{ bsp.color=cc.Color.WHITE; n.color=cc.Color.WHITE; }catch(e){}
                bfixed++;
              }catch(e){}
            }
          });
          console.log('[inject] 上半背景适配: '+bfixed);
        }catch(e){ console.error('[inject] bg',e); }
      };
      bimg.onerror=function(){ console.error('[inject] bg img load failed'); };
    }

    // ⑦ icon_256: 结算页金币logo等比替换 (左上角 Logo 见 ⑧ HTML 覆盖层)
    if(ICON256_URI){
      var iimg=new Image(); iimg.src=ICON256_URI;
      iimg.onload=function(){
        try{
          var itex=new cc.Texture2D(); itex.image=new cc.ImageAsset(iimg);
          var isf=new cc.SpriteFrame(); isf.texture=itex;
          isf.rect=cc.rect(0,0,iimg.naturalWidth||iimg.width,iimg.naturalHeight||iimg.height);
          var iAsp=(iimg.naturalWidth||iimg.width)/(iimg.naturalHeight||iimg.height);
          var ifixed=0;
          var sceneNow=cc.director.getScene();
          sceneNow.walk(function(n){
            if(n.name==='Game Logo' && n.parent && n.parent.name==='Container'){   // 结算页的 logo
              try{
                var isp=n.getComponent('cc.Sprite');
                isp.spriteFrame=isf;
                try{ isp.sizeMode=cc.Sprite.SizeMode.CUSTOM; }catch(e){}
                try{ isp.color=cc.Color.WHITE; n.color=cc.Color.WHITE; }catch(e){}
                var iut=n.getComponent('cc.UITransform');
                if(iut){
                  var ih=iut.contentSize.height;                 // 250 (高度保持)
                  iut.setContentSize(Math.round(ih*iAsp), ih);   // 宽度按图片比例 = 等比
                }
                ifixed++;
              }catch(e){}
            }
          });
          console.log('[inject] 结算页logo:'+ifixed);
        }catch(e){ console.error('[inject] icon256',e); }
      };
      iimg.onerror=function(){ console.error('[inject] icon256 img load failed'); };
    }

    // ⑧ 左上角 Logo (HTML 覆盖层): 锚定"游戏画面"左上角, 游戏开始 (首次点击 / intro 遮罩消失) 1 秒后淡入
    // 注: 引擎内运行时新建/换图的精灵在本项目渲染管线中不显示, 故用 DOM 覆盖层实现, 100% 可靠
    //     宽窗口下游戏画面只是 canvas 中居中的一块, 必须按引擎视口矩形定位, 不能用浏览器窗口坐标
    if(ICON256_URI){
      var logoEl=document.createElement('img');
      logoEl.src=ICON256_URI;
      logoEl.alt='';
      logoEl.style.cssText='position:fixed;z-index:2147483000;pointer-events:none;'
        +'opacity:0;transition:opacity .4s ease;';
      (document.body||document.documentElement).appendChild(logoEl);
      // 把 Logo 钉在游戏画面 (引擎视口) 的左上角: 引擎视口矩形 -> 换算成页面 CSS 坐标
      function logoPlace(){
        try{
          var cv=document.getElementById('GameCanvas')||(window.cc&&cc.game&&cc.game.canvas);
          if(!cv) return;
          var r=cv.getBoundingClientRect();
          var vp=null;
          try{ if(window.cc&&cc.view&&cc.view.getViewportRect) vp=cc.view.getViewportRect(); }catch(e){}
          var left,top,w,h;
          if(vp && vp.width>0 && vp.height>0 && cv.width && cv.height){
            var kx=r.width/cv.width, ky=r.height/cv.height;        // 设备像素 -> CSS 像素
            w=vp.width*kx;   h=vp.height*ky;
            left=r.left+vp.x*kx;
            top=r.top+(cv.height-vp.y-vp.height)*ky;               // 视口 y 轴自下而上
          }else{
            // 兜底: 按 720x1280 设计比例推算画面区域
            var ar=720/1280;
            if(r.width/r.height>ar){ h=r.height; w=h*ar; left=r.left+(r.width-w)/2; top=r.top; }
            else{ w=r.width; h=w/ar; left=r.left; top=r.top+(r.height-h)/2; }
          }
          var m=Math.max(8, Math.round(w*0.033));                  // 边距 ≈ 设计分辨率 24
          var DROP=30;                                             // 在画面左上角基础上额外下移 30px
          var s=Math.round(w*0.208);                               // 尺寸 ≈ 设计分辨率 150/720
          logoEl.style.left=(left+m)+'px';
          logoEl.style.top=(top+m+DROP)+'px';
          logoEl.style.width=s+'px';
          logoEl.style.height=s+'px';
        }catch(e){}
      }
      logoPlace();
      window.addEventListener('resize', logoPlace);
      setTimeout(logoPlace, 1000);                                 // 引擎初始化后再校一次
      var logoStarted=false;
      function logoShow(){
        if(logoStarted) return;
        logoStarted=true;
        setTimeout(function(){ logoPlace(); try{ logoEl.style.opacity='1'; }catch(e){} }, 1000);   // 首次点击 Open Mine 1 秒后显示
      }
      // ── 触发信号: 第一次点击 "Open Mine" 按钮 ──
      // 包装每个 MineOpenButton 实例的 onButtonPressed (游戏自己的按钮回调), 按下即触发
      var logoMobCount=0, logoMobPoll=null;
      function logoHookMineButtons(){
        try{
          var cc2=window.cc;
          if(!cc2 || !cc2.director || !cc2.director.getScene()) return;
          cc2.director.getScene().walk(function(n){
            try{
              var mob=n.getComponent('MineOpenButton');
              if(!mob || mob.__logoHooked) return;
              mob.__logoHooked=true;
              logoMobCount++;
              var orig=mob.onButtonPressed;
              if(typeof orig==='function'){
                mob.onButtonPressed=function(){
                  try{ logoShow(); }catch(e){}
                  return orig.apply(this,arguments);
                };
                console.log('[inject] Logo 已挂接 OpenMine 按钮');
              }
            }catch(e){}
          });
        }catch(e){}
      }
      logoHookMineButtons();
      logoMobPoll=setInterval(function(){
        logoHookMineButtons();
        if(logoMobCount>0) clearInterval(logoMobPoll);
      },400);
      // ── 游戏结束弹框 (提现/结算/下载页) 出现前隐藏 Logo ──
      // 弹框由 AdManager.changeAdState 触发 (ShowCashOut=3 / ShowDownload=4 / Completed=5),
      // 劫持该静态方法: 在状态生效 (弹框弹出) 之前同步隐藏 Logo
      var logoHidden=false;
      function logoHideNow(){
        if(logoHidden) return;
        logoHidden=true;
        try{ logoEl.style.transition='opacity .15s ease'; }catch(e){}
        try{ logoEl.style.opacity='0'; }catch(e){}
      }
      var logoAdmPatched=false, logoAdmPoll=null;
      logoAdmPoll=setInterval(function(){
        try{
          if(logoAdmPatched) return;
          var cc3=window.cc;
          if(!cc3 || !cc3.director || !cc3.director.getScene()) return;
          cc3.director.getScene().walk(function(n){
            if(logoAdmPatched) return;
            try{
              var adm=n.getComponent('AdManager');
              if(!adm) return;
              logoAdmPatched=true;
              var cls=adm.constructor;
              if(cls && typeof cls.changeAdState==='function' && !cls.__logoHidePatched){
                var origCAS=cls.changeAdState;
                cls.changeAdState=function(st){
                  try{ if(st>=3) logoHideNow(); }catch(e){}         // 结束态弹框前隐藏
                  try{                                                     // PlayTurbo 规范3: 出结束画面(ShowDownload=4/Completed=5)即调 gameEnd
                    if(st>=4 && !window.__ptGameEndFired){ window.__ptGameEndFired=true; window.gameEnd && window.gameEnd(); }
                  }catch(e){}
                  return origCAS.apply(this, arguments);
                };
                cls.__logoHidePatched=true;
                console.log('[inject] Logo 结束隐藏已挂接');
              }
              try{ if(typeof adm.currentState==='number' && adm.currentState>=3) logoHideNow(); }catch(e){}
            }catch(e){}
          });
          if(logoAdmPatched) clearInterval(logoAdmPoll);
        }catch(e){}
      },400);
    }
  }
  // ── ⑨ PlayTurbo/Mintegral 平台规范接口 (https://www.playturbo.cn/review/doc) ──
  // 已合规(原游戏自带): window.gameReady (MraidManager.initialize), window.gameEnd (AdManager.endAd),
  //                     window.install (MraidManager.open Dummy 模式), 无自动跳转, 全资源内联, utf-8
  // 本块补充规范5/7: 全局 gameStart/gameClose 方法 (平台在开始/关闭试玩时主动调用)
  try{
    if(typeof window.gameStart!=='function'){
      window.gameStart=function(){                          // 规范5: 试玩开始 -> 开始背景音乐
        try{
          window.cc.director.getScene().walk(function(n){
            try{
              var am=n.getComponent('AudioManager');
              if(am){ var inst=(am.constructor&&am.constructor.instance)||am; inst.playClip&&inst.playClip('Music_Background'); }
            }catch(e){}
          });
        }catch(e){}
        console.log('[inject] gameStart');
      };
    }
    if(typeof window.gameClose!=='function'){
      window.gameClose=function(){                          // 规范7: 试玩关闭 -> 停止全部音频
        try{
          window.cc.director.getScene().walk(function(n){
            try{
              var am=n.getComponent('AudioManager');
              if(am){ var inst=(am.constructor&&am.constructor.instance)||am; inst.killAll&&inst.killAll(); }
            }catch(e){}
          });
        }catch(e){}
        console.log('[inject] gameClose');
      };
    }
  }catch(e){}

  // ── ⑩ PlayTurbo 规范2: DOM 下载按钮 (真实 button 元素, 检测工具可点击) ──
  // 纯 canvas 游戏没有可被网页检测工具识别的按钮 -> 加一个贯穿始终的 DOM CTA,
  // 点击统一调用 window.install(); 游戏内 canvas CTA 仍走 MraidManager.open -> install
  try{
    var ctaBtn=document.createElement('button');
    ctaBtn.type='button';
    ctaBtn.textContent='DOWNLOAD';
    ctaBtn.style.cssText='position:fixed;z-index:2147483000;cursor:pointer;'
      +'padding:0;margin:0;border:none;outline:none;'
      +'font:bold 18px Helvetica,Arial,sans-serif;color:#fff;letter-spacing:1px;'
      +'background:linear-gradient(180deg,#67d24b 0%,#3fa62c 55%,#2f8a20 100%);'
      +'border-radius:24px;box-shadow:0 3px 0 #1f5e12,0 4px 10px rgba(0,0,0,.35);'
      +'text-shadow:0 1px 2px rgba(0,0,0,.4);'
      +'-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:manipulation;';
    (document.body||document.documentElement).appendChild(ctaBtn);
    ctaBtn.addEventListener('click', function(ev){
      try{ ev.stopPropagation(); }catch(e){}
      window.install && window.install();                     // 规范写法
      try{                                                     // 点击下载 = 素材结束 (与游戏 canvas CTA 的 endAd 行为一致)
        if(!window.__ptGameEndFired){ window.__ptGameEndFired=true; window.gameEnd && window.gameEnd(); }
      }catch(e){}
    });
    // 钉在游戏画面底部居中 (与 Logo 同一套视口换算)
    function ctaPlace(){
      try{
        var cv=document.getElementById('GameCanvas')||(window.cc&&cc.game&&cc.game.canvas);
        if(!cv) return;
        var r=cv.getBoundingClientRect();
        var vp=null;
        try{ if(window.cc&&cc.view&&cc.view.getViewportRect) vp=cc.view.getViewportRect(); }catch(e){}
        var left,top,w,h;
        if(vp && vp.width>0 && vp.height>0 && cv.width && cv.height){
          var kx=r.width/cv.width, ky=r.height/cv.height;
          w=vp.width*kx; h=vp.height*ky; left=r.left+vp.x*kx; top=r.top+(cv.height-vp.y-vp.height)*ky;
        }else{
          var ar=720/1280;
          if(r.width/r.height>ar){ h=r.height; w=h*ar; left=r.left+(r.width-w)/2; top=r.top; }
          else{ w=r.width; h=w/ar; left=r.left; top=r.top+(r.height-h)/2; }
        }
        var bw=Math.round(w*0.52), bh=Math.round(Math.max(34, w*0.104));
        ctaBtn.style.width=bw+'px';
        ctaBtn.style.height=bh+'px';
        ctaBtn.style.left=Math.round(left+(w-bw)/2)+'px';                    // 画面底部居中
        ctaBtn.style.top=Math.round(top+h-bh-Math.max(8,Math.round(w*0.028)))+'px';
        ctaBtn.style.fontSize=Math.max(13,Math.round(bh*0.42))+'px';
      }catch(e){}
    }
    ctaPlace();
    window.addEventListener('resize', ctaPlace);
    setTimeout(ctaPlace, 1000);
  }catch(e){}

  waitInject();
})();
</script>

<div id="GameDiv" cc_exact_fit_screen="true">
  <div id="Cocos3dGameContainer">
    <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="99"></canvas>
  </div>
</div>
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.error('[pack] wrote ' + path.relative(ROOT, OUT) + ' (' + (html.length/1024).toFixed(0) + ' KB, ' + (html.length/1024/1024).toFixed(2) + ' MB)');
