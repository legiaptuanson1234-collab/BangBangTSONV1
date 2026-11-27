/* ================= M72 LOBBY UI (11/2026) =================
   Port giao diện sảnh chờ M72 gốc (Flash chrome 1000x600) chạy TĨNH trên game BangBang.
   Art: M8A.assets (assets/m8ui + assets/m8ext + assets/rez — PNG JPEXS M72 original).
   Data: MODES, DB.tanks, lobby, B, startBattle() từ engine index.html.
   Luồng: menu → hall (chế độ+bot) → room (sảnh 5v5) → selection (pick tank) → loading → trận → result. */
(function(){
'use strict';
if(!window.M8A || !window.M8A.assets) return;
var A = window.M8A.assets;

/* ---------- Helpers ---------- */
function art(k){ return A[k]||null; }
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }
function pos(node,x,y,w,h){ var s=node.style; s.position='absolute'; s.left=x+'px'; s.top=y+'px'; if(w!=null)s.width=w+'px'; if(h!=null)s.height=h+'px'; return node; }

function img(key,x,y,w,h,cls){
  var e=art(key); if(!e) return null;
  var i=document.createElement('img');
  i.className='m8i '+(cls||'');
  i.src='assets/'+e[0];
  pos(i,x,y,w||e[1],h||e[2]);
  i.style.objectFit='contain';
  return i;
}

function artBtn(key,x,y,w,h,label,cb,opts){
  var e=art(key);
  var b=document.createElement('button');
  b.className='m8artbtn';
  pos(b,x,y,w,h);
  if(e){
    var i=document.createElement('img');
    i.src='assets/'+e[0];
    i.style.width=(w||e[1])+'px';
    i.style.height=(h||e[2])+'px';
    b.appendChild(i);
  }
  if(label){
    var s=el('span','m8lbl',label);
    s.style.cssText='position:absolute;left:0;right:0;bottom:3px;text-align:center;font:bold 11px Tahoma;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none;';
    b.appendChild(s);
  }
  if(opts&&opts.disabled){ b.disabled=true; b.classList.add('off'); }
  if(cb) b.addEventListener('click',cb);
  return b;
}

function txtBtn(label,x,y,w,h,cb,primary){
  var b=document.createElement('button');
  b.className='m8btn'+(primary?' primary':'');
  pos(b,x,y,w,h);
  b.textContent=label;
  if(cb) b.addEventListener('click',cb);
  return b;
}

function lbl(text,x,y,w,cls){
  var s=el('span','m8lbl '+(cls||''),text);
  pos(s,x,y,w);
  return s;
}

function sel(x,y,w,options,defVal,ariaLabel){
  var s=document.createElement('select');
  s.className='m8sel';
  pos(s,x,y,w);
  s.style.height='auto';
  options.forEach(function(o){
    var op=document.createElement('option');
    op.value=(o.v!=null)?o.v:'';
    op.textContent=(o.l!=null)?o.l:o.v;
    s.appendChild(op);
  });
  if(defVal!=null) s.value=String(defVal);
  if(ariaLabel) s.setAttribute('aria-label',ariaLabel);
  return s;
}

/* MAPSLIST = array of {id,w,h,los} — lookup by id */
function mapName(id){
  if(typeof MAPSLIST==='undefined'||!Array.isArray(MAPSLIST)) return null;
  return MAPSLIST.find(function(x){return x.id===id;}||{});
}

/* ---------- Stage ---------- */
var root=document.createElement('div'); root.id='m8root';
var vp=document.createElement('div'); vp.className='m8v';
var stage=document.createElement('main'); stage.className='m8s';
vp.appendChild(stage); root.appendChild(vp);
document.body.appendChild(root);

var stageW=1000, stageH=600;
function setWH(w,h){ stageW=w; stageH=h; stage.style.width=w+'px'; stage.style.height=h+'px'; resize(); }
function resize(){
  var ww=innerWidth, wh=innerHeight;
  var scale=Math.min(ww/stageW, wh/stageH, 1.4);
  stage.style.transform='scale('+scale+')';
  vp.style.width=(stageW*scale)+'px';
  vp.style.height=(stageH*scale)+'px';
}
addEventListener('resize',resize);

/* ---------- Screen state ---------- */
var cur=null, timer=null, countdownTimer=null, _used=false;
function show(name,data){
  stage.replaceChildren();
  if(timer){clearInterval(timer);timer=null;}
  if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;}
  cur=name; _used=true;
  root.classList.add('on');
  // Hide old lobby when M72 UI is active
  var oldLobby=document.getElementById('lobby');
  if(oldLobby && (name==='menu'||name==='hall'||name==='room'||name==='selection')) oldLobby.style.display='none';
  switch(name){
    case 'menu': buildMenu(); break;
    case 'hall': buildHall(data); break;
    case 'room': buildRoom(data); break;
    case 'selection': buildSelection(data); break;
    case 'loading': buildLoading(data); break;
    case 'result': buildResult(data); break;
  }
}

/* ========== MENU ========== */
function buildMenu(){
  setWH(1000,600);
  addBg('lobby.background');
  addBg('lobby.platform');
  // tank portrait
  var tankId=(typeof lobby!=='undefined')?lobby.tankId:'10000001';
  var tname=lbl('',203,97,133,'m8mname');
  tname.textContent=((typeof DB!=='undefined'&&DB.tanks)?(DB.tanks.find(function(t){return t.id===tankId})||{}).name||'Tank':'Tank');
  stage.appendChild(tname);
  var lv=lbl('Cấp '+((typeof lobby!=='undefined')?lobby.level:1),165,100,80,'m8lvtext');
  stage.appendChild(lv);
  var port=document.createElement('div'); port.className='m8port'; pos(port,182,153,200,200);
  var pi=document.createElement('img'); pi.src='assets/thumb/'+tankId+'.png'; pi.style.cssText='width:200px;height:200px;object-fit:contain;';
  port.appendChild(pi); port.style.cursor='pointer';
  port.addEventListener('click',function(){ show('selection'); });
  stage.appendChild(port);
  // buttons
  addBtn('lobby.pvp',452,100,null,null,null,function(){ show('hall'); });
  addBtn('lobby.league',488,237,null,null,null,function(){ show('hall',{ranked:true}); });
  addBtn('lobby.pve',668,100,null,null,null,function(){ show('hall'); });
  addBtn('lobby.switchTank',342,96,null,null,null,function(){ show('selection'); });
  addBtn('lobby.shop',747,397,null,null,null,null,true);
  addBtn('lobby.rank',527,397,null,null,null,null,true);
  addBtn('lobby.guild',637,397,null,null,null,null,true);
  addBtn('lobby.watch',668,237,null,null,null,null,true);
}

function addBg(key){ var i=img(key,0,0,stageW,stageH,'m8bg'); if(i){i.style.objectFit='cover'; stage.appendChild(i);} }
function addBtn(key,x,y,w,h,label,cb,disabled){
  var b=artBtn(key,x,y,w,h,label,cb,{disabled:disabled});
  if(b) stage.appendChild(b);
}

/* ========== HALL ========== */
function buildHall(data){
  setWH(1018,618);
  addBg('room.background');
  var t=img('title_hall_t',(1018-(art('title_hall_t')||[0,200,0])[1])/2,21); if(t) stage.appendChild(t);
  addBtn('public.close',979,15,24,24,null,function(){ show('menu'); });
  
  // --- Mode panel (left) ---
  var mp=document.createElement('div'); mp.className='m8panel';
  pos(mp,30,55,470,500); mp.style.overflowY='auto'; mp.style.scrollbarWidth='thin';
  mp.appendChild(lbl('Chọn chế độ chơi',14,8,null,'m8mhead'));
  var modes=(typeof MODES!=='undefined')?MODES:[];
  var selMode=(typeof lobby!=='undefined')?lobby.mode:modes[0];
  modes.forEach(function(m){
    var card=document.createElement('div');
    card.style.cssText='position:relative;margin:6px 14px;padding:10px 12px;background:#141e2b;border:1px solid #303f54;border-radius:8px;cursor:pointer;min-height:52px;';
    card.appendChild(el('span','',m.name)).style.cssText='font:bold 14px Tahoma;color:#fff9bd;display:block;';
    if(m.desc){ var d=el('span','',m.desc); d.style.cssText='font:11px Tahoma;color:#9fb0c4;margin-top:3px;line-height:1.3;display:block;'; card.appendChild(d); }
    if(m.mapId){ var _mm=mapName(m.mapId); var mi=el('span','','Map: #'+m.mapId+(_mm?(' · '+_mm.w+'x'+_mm.h):'')); mi.style.cssText='font:10px Tahoma;color:#5f7586;margin-top:2px;display:block;'; card.appendChild(mi); }
    if(m.time){ var ti=el('span','','⏱ '+(m.time/60|0)+' phút'+(m.winKills?(' · '+(m.winKills)+' mạng'):'')+(m.winScore?(' · '+(m.winScore)+' điểm'):'')); ti.style.cssText='font:10px Tahoma;color:#5f7586;margin-top:2px;display:block;'; card.appendChild(ti); }
    if(selMode===m){ card.style.borderColor='#599b7f'; card.style.background='#19332c'; }
    card.addEventListener('click',function(){
      if(typeof lobby!=='undefined') lobby.mode=m;
      mp.querySelectorAll('div').forEach(function(c){ if(c!==card && c.style && c.style.position==='relative'){ c.style.borderColor='#303f54'; c.style.background='#141e2b'; } });
      card.style.borderColor='#599b7f'; card.style.background='#19332c';
      showModeDetail(m);
    });
    mp.appendChild(card);
  });
  stage.appendChild(mp);
  
  // --- Bot settings panel (right top) ---
  var bp=document.createElement('div'); bp.className='m8panel'; pos(bp,530,55,440,230);
  bp.appendChild(lbl('Thiết lập Bot',14,8,null,'m8mhead'));
  var alliesS=sel(150,40,80,makeRange(0,5),(lobby&&lobby.botAllies!=null)?lobby.botAllies:4,'Số bot cùng đội');
  var enemiesS=sel(150,70,80,makeRange(0,6),(lobby&&lobby.botEnemies!=null)?lobby.botEnemies:5,'Số bot đối thủ');
  var levelS=sel(150,100,80,makeRange(1,6),(lobby&&lobby.botLevel!=null)?lobby.botLevel:1,'Cấp bot');
  bp.appendChild(rowLbl('Bot cùng đội',38)).appendChild(alliesS);
  bp.appendChild(rowLbl('Bot đối thủ',68)).appendChild(enemiesS);
  bp.appendChild(rowLbl('Cấp bot',98)).appendChild(levelS);
  stage.appendChild(bp);
  
  // Save button
  var saveB=txtBtn('Lưu thiết lập',530,295,130,32,function(){
    if(typeof lobby!=='undefined'){
      lobby.botAllies=parseInt(alliesS.value,10);
      lobby.botEnemies=parseInt(enemiesS.value,10);
      lobby.botLevel=parseInt(levelS.value,10);
    }
    saveB.textContent='✓ Đã lưu';
    setTimeout(function(){ saveB.textContent='Lưu thiết lập'; },1200);
  });
  stage.appendChild(saveB);
  
  // Create room button
  var createB=txtBtn('Tạo phòng',680,295,130,32,function(){
    if(typeof lobby!=='undefined'){
      lobby.botAllies=parseInt(alliesS.value,10);
      lobby.botEnemies=parseInt(enemiesS.value,10);
      lobby.botLevel=parseInt(levelS.value,10);
    }
    show('room');
  },true);
  stage.appendChild(createB);
  
  // --- Mode detail panel (right bottom) ---
  var detail=document.createElement('div'); detail.id='m8modedetail'; detail.className='m8panel';
  pos(detail,530,340,440,210); detail.style.overflowY='auto'; detail.style.scrollbarWidth='thin';
  if(selMode) showModeDetail(selMode);
  stage.appendChild(detail);
  
  function showModeDetail(m){
    if(!m) return;
    detail.innerHTML='';
    detail.style.paddingTop='34px';
    detail.appendChild(lbl('Chi tiết: '+(m.name||''),14,8,null,'m8mhead'));
    if(m.desc){ var p=el('p','',m.desc); p.style.cssText='margin:8px 14px;font:12px Tahoma;color:#cde9ff;line-height:1.5;white-space:pre-line;'; detail.appendChild(p); }
    if(m.time){ var t2=el('p','','Thời gian: '+(m.time/60|0)+' phút'); t2.style.cssText='margin:4px 14px;font:11px Tahoma;color:#9fb0c4;'; detail.appendChild(t2); }
    if(m.mapId){ var _mn=mapName(m.mapId); var m2=el('p','','Bản đồ: #'+m.mapId+(_mn?(' · '+_mn.w+'x'+_mn.h):'')); m2.style.cssText='margin:4px 14px;font:11px Tahoma;color:#9fb0c4;'; detail.appendChild(m2); }
    if(m.kind){ var k=el('p','','Loại: '+m.kind); k.style.cssText='margin:4px 14px;font:11px Tahoma;color:#5f7586;'; detail.appendChild(k); }
  }
}

function makeRange(a,b){ var r=[]; for(var i=a;i<=b;i++) r.push({v:i,l:String(i)}); return r; }
function rowLbl(text,y){ var s=el('span','',text); s.style.cssText='position:absolute;left:14px;top:'+(y)+'px;font:bold 12px Tahoma;color:#cde9ff;width:130px;'; return s; }

/* ========== ROOM ========== */
function buildRoom(data){
  setWH(1018,618);
  addBg('room.background');
  addBtn('public.close',978,15,24,24,null,function(){ show('hall'); });
  var mode=(typeof lobby!=='undefined'&&lobby.mode)?lobby.mode:{};
  stage.appendChild(lbl('Phòng Bot · '+(mode.name||'PK'),35,54,250,'m8rt'));
  var mapId=mode.mapId||4;
  // Map preview
  var mapImg=document.createElement('img');
  mapImg.src='assets/m/'+mapId+'/minimap.webp';
  pos(mapImg,509,433,168,100); mapImg.style.objectFit='cover'; mapImg.style.border='2px solid #a8ddeb'; mapImg.style.borderRadius='6px';
  mapImg.alt='Map '+mapId;
  stage.appendChild(mapImg);
  var sb=img('startgame_background_t',498,424); if(sb) stage.appendChild(sb);
  
  // 5v5 roster
  var cols=[20,177,334,491,648], rows=[81,239];
  var nA=(lobby&&lobby.botAllies!=null)?lobby.botAllies:4;
  var nE=(lobby&&lobby.botEnemies!=null)?lobby.botEnemies:5;
  var botLvl=(lobby&&lobby.botLevel)?lobby.botLevel:1;
  
  // Blue team (row 0)
  for(var i=0;i<5;i++){
    var x=cols[i], y=rows[0];
    var cardBg = i===0 ? img('pvp5v5_playerbox_blueteam',x,y,158,159) : img('pvp5v5_playerbox',x,y,158,159);
    if(cardBg) stage.appendChild(cardBg);
    if(i===0){
      // Player
      var head=document.createElement('img');
      head.src='assets/thumb/'+lobby.tankId+'.png';
      pos(head,x+29,y+51,100,100); head.style.objectFit='contain';
      stage.appendChild(head);
      stage.appendChild(lbl('Ngài',x+13,y+139,130,'m8pname'));
      var tn2=((typeof DB!=='undefined'&&DB.tanks)?(DB.tanks.find(function(t){return t.id===lobby.tankId})||{}).name:'');
      stage.appendChild(lbl(tn2,x+13,y+119,130,'m8tankname'));
      var rv=img('ready_s_t',x+19,y+114); if(rv) stage.appendChild(rv);
    } else if(i<=nA){
      // Bot ally
      var botId=(typeof DB!=='undefined'&&DB.tanks&&DB.tanks.length)?DB.tanks[(i+3)%DB.tanks.length]:null;
      if(botId){
        var bh=document.createElement('img'); bh.src='assets/thumb/'+botId.id+'.png';
        pos(bh,x+29,y+51,100,100); bh.style.objectFit='contain';
        stage.appendChild(bh);
      }
      stage.appendChild(lbl('Bot Đ'+i,x+13,y+139,130,'m8pname'));
      stage.appendChild(lbl('Cấp '+botLvl,x+13,y+119,130,'m8tankname'));
    } else {
      var w1=img('avatar_card_waitplayer_t',x+(158-115)/2,y+(159-119)/2); if(w1) stage.appendChild(w1);
    }
  }
  // Red team (row 1)
  for(var j=0;j<5;j++){
    var x2=cols[j], y2=rows[1];
    var rb=img('pvp5v5_playerbox_redteam',x2,y2,158,159); if(rb) stage.appendChild(rb);
    if(j<nE){
      var botId2=(typeof DB!=='undefined'&&DB.tanks&&DB.tanks.length)?DB.tanks[(j+7)%DB.tanks.length]:null;
      if(botId2){
        var rh=document.createElement('img'); rh.src='assets/thumb/'+botId2.id+'.png';
        pos(rh,x2+29,y2+51,100,100); rh.style.objectFit='contain';
        stage.appendChild(rh);
      }
      stage.appendChild(lbl('Bot Đ'+j,x2+13,y2+139,130,'m8pname'));
      stage.appendChild(lbl('Cấp '+botLvl,x2+13,y2+119,130,'m8tankname'));
    } else {
      var w2=img('avatar_card_waitplayer_t',x2+(158-115)/2,y2+(159-119)/2); if(w2) stage.appendChild(w2);
    }
  }
  
  // Ready button
  var readyB=artBtn('ready_button_t',688,440,84,84,null,function(){
    show('selection');
  });
  if(readyB) stage.appendChild(readyB);
  
  // Start button (hidden by default, shown when ready)
  var startB=artBtn('startgame_button_t',688,440,84,84,null,function(){
    show('selection');
  });
  if(startB){ startB.style.display='none'; stage.appendChild(startB); }
  
  // Change camp
  stage.appendChild(txtBtn('Đổi phe',595,500,86,24,function(){}));
  
  // Cancel ready
  var cancelB=txtBtn('Hủy sẵn sàng',687,528,100,24,function(){});
  cancelB.style.display='none';
  stage.appendChild(cancelB);
  
  // Back to hall
  stage.appendChild(txtBtn('← Về sảnh',30,570,100,24,function(){ show('hall'); }));
}

/* ========== SELECTION ========== */
function buildSelection(data){
  setWH(1000,600);
  addBg('selection.background');
  
  var nA=(lobby&&lobby.botAllies!=null)?lobby.botAllies:4;
  var nE=(lobby&&lobby.botEnemies!=null)?lobby.botEnemies:5;
  var botLvl=(lobby&&lobby.botLevel)?lobby.botLevel:1;
  
  // Team labels
  stage.appendChild(lbl('Đội bạn',0,1,204,'m8teamlab'));
  stage.appendChild(lbl('Đội thủ',796,1,204,'m8teamlab'));
  var aa=img('selection.allyArrow',213,24); if(aa) stage.appendChild(aa);
  var ea=img('selection.enemyArrow',737,24); if(ea) stage.appendChild(ea);
  var allyClock=lbl('60',257,23,142,'m8clock'); stage.appendChild(allyClock);
  var enemyClock=lbl('60',604,22,142,'m8clock'); stage.appendChild(enemyClock);
  
  // Ally roster (left)
  var leftR=document.createElement('div'); pos(leftR,2,36,178,490);
  for(var i=0;i<Math.min(5,nA+1);i++){
    var ac=document.createElement('div'); ac.className='m8playercard';
    pos(ac,0,i*98,178,98); ac.style.backgroundSize='100% 100%'; ac.style.backgroundRepeat='no-repeat';
    var pkey=i===0?'selection.selfPlayer':'selection.bluePlayer';
    var pe=art(pkey); if(pe) ac.style.backgroundImage='url("assets/'+pe[0]+'")';
    if(i===0){
      var ph=document.createElement('img'); ph.className='ph'; ph.src='assets/thumb/'+lobby.tankId+'.png';
      ph.style.cssText='position:absolute;left:40px;top:0px;width:98px;height:98px;object-fit:contain;';
      ac.appendChild(ph);
    } else {
      var bI=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks[i%DB.tanks.length]:null;
      if(bI){ var bh2=document.createElement('img'); bh2.className='ph'; bh2.src='assets/thumb/'+bI.id+'.png';
        bh2.style.cssText='position:absolute;left:40px;top:0px;width:98px;height:98px;object-fit:contain;';
        ac.appendChild(bh2);
      }
    }
    var nmEl=document.createElement('strong');
    nmEl.textContent=(i===0?'Ngài':(DB.tanks?DB.tanks[i%DB.tanks.length].name:'Bot'));
    nmEl.style.cssText='position:absolute;left:79px;top:11px;right:7px;font:bold 13px Tahoma;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    ac.appendChild(nmEl);
    var allyName;
    if(i===0){
      var _ct=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks.find(function(t){return t.id===lobby.tankId}):null;
      allyName=_ct?_ct.name:'';
    } else {
      var _bt=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks[i%DB.tanks.length]:null;
      allyName=_bt?_bt.name:'Bot';
    }
    var _v1=el('small','',allyName); _v1.style.cssText='position:absolute;left:79px;top:35px;right:7px;font:10px Tahoma;color:#c2e5f8;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; ac.appendChild(_v1);
    leftR.appendChild(ac);
  }
  stage.appendChild(leftR);
  
  // Enemy roster (right)
  var rightR=document.createElement('div'); pos(rightR,820,36,178,490);
  for(var j=0;j<Math.min(5,nE);j++){
    var ec=document.createElement('div'); ec.className='m8playercard';
    pos(ec,0,j*98,178,98); ec.style.backgroundSize='100% 100%'; ec.style.backgroundRepeat='no-repeat';
    var re2=art('selection.redPlayer'); if(re2) ec.style.backgroundImage='url("assets/'+re2[0]+'")';
    var bI2=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks[(j+5)%DB.tanks.length]:null;
    if(bI2){ var rh2=document.createElement('img'); rh2.className='ph'; rh2.src='assets/thumb/'+bI2.id+'.png';
      rh2.style.cssText='position:absolute;left:40px;top:0px;width:98px;height:98px;object-fit:contain;';
      ec.appendChild(rh2);
    }
    var _v2=el('strong','',bI2?bI2.name:'Bot'); _v2.style.cssText='position:absolute;left:79px;top:11px;right:7px;font:bold 13px Tahoma;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;'; ec.appendChild(_v2);
    var _v3=el('small','','Cấp '+botLvl); _v3.style.cssText='position:absolute;left:79px;top:35px;right:7px;font:10px Tahoma;color:#c2e5f8;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; ec.appendChild(_v3);
    rightR.appendChild(ec);
  }
  stage.appendChild(rightR);
  
  // Category tabs
  var cats=[
    {key:'all',l:'Tất cả',n:'selection.all',a:'selection.allActive'},
    {key:'atk',l:'Tấn công',n:'selection.attack',a:'selection.attackActive'},
    {key:'pan',l:'Phòng thủ',n:'selection.panzer',a:'selection.panzerActive'},
    {key:'ast',l:'Hỗ trợ',n:'selection.assist',a:'selection.assistActive'}
  ];
  var selCat=0, catBtns=[];
  cats.forEach(function(c,idx){
    var b=document.createElement('button'); b.className='m8selcat';
    pos(b,234+idx*93,59,90,44);
    b.style.cssText+=';padding:0;border:0;background:none;cursor:pointer;';
    var ce=art(c.n);
    if(ce){ var ci=document.createElement('img'); ci.src='assets/'+ce[0]; ci.style.cssText='width:90px;height:44px;display:block;'; b.appendChild(ci); }
    var _v4=el('span','',c.l); _v4.style.cssText='position:absolute;left:0;right:0;bottom:2px;text-align:center;font:bold 10px Tahoma;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none;display:block;'; b.appendChild(_v4);
    b.addEventListener('click',function(){
      selCat=idx;
      catBtns.forEach(function(bb,ji){
        var be=art(ji===idx?cats[ji].a:cats[ji].n);
        if(be&&bb.querySelector('img')) bb.querySelector('img').src='assets/'+be[0];
      });
      buildGrid();
    });
    catBtns.push(b);
    stage.appendChild(b);
  });
  
  // Search
  var search=document.createElement('input'); search.className='m8inp';
  pos(search,610,61,154,27); search.placeholder='Tìm tank…'; search.maxLength=40;
  stage.appendChild(search);
  
  // Tank grid
  var grid=document.createElement('div'); grid.className='m8grid'; pos(grid,238,104,526,296);
  var gridWin=document.createElement('div'); gridWin.className='m8selwin'; grid.appendChild(gridWin);
  stage.appendChild(grid);
  var selTank=(typeof lobby!=='undefined')?lobby.tankId:'10000001';
  
  // Map preview
  var mapId=(lobby&&lobby.mode&&lobby.mode.mapId)?lobby.mode.mapId:4;
  var mc=img('selection.mapCover',222,430); if(mc) stage.appendChild(mc);
  var mi2=document.createElement('img'); mi2.src='assets/m/'+mapId+'/minimap.webp';
  pos(mi2,230,438,152,68); mi2.style.objectFit='cover'; mi2.alt='Map '+mapId;
  stage.appendChild(mi2);
  var ba=img('selection.battleAttributes',392,428); if(ba) stage.appendChild(ba);
  
  // Confirm
  addBtn('selection.confirm',641,442,136,58,null,function(){
    if(typeof lobby!=='undefined') lobby.tankId=selTank;
    show('loading');
  });
  // Cancel
  stage.appendChild(txtBtn('Về sảnh',640,516,136,32,function(){ show('room'); }));
  
  // Tank info panel
  var info=document.createElement('div'); info.className='m8info';
  pos(info,238,398,380,120); info.style.zIndex='10';
  stage.appendChild(info);
  
  function buildGrid(){
    gridWin.replaceChildren();
    var tanks=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks:[];
    var filtered=tanks;
    if(selCat===1) filtered=tanks.filter(function(t){return t.pos===1;});
    else if(selCat===2) filtered=tanks.filter(function(t){return t.pos===2;});
    else if(selCat===3) filtered=tanks.filter(function(t){return t.pos===3;});
    if(search.value){ var q=search.value.toLowerCase(); filtered=filtered.filter(function(t){return t.name.toLowerCase().indexOf(q)>=0;}); }
    filtered.forEach(function(t,idx){
      var col=idx%5, row=Math.floor(idx/5);
      var tile=document.createElement('button'); tile.className='m8tile'+(t.id===selTank?' sel':'');
      tile.style.cssText='left:'+(col*102)+'px;top:'+(row*102)+'px;position:absolute;';
      var un=art('selection.tileUnselected'); var un2=art('selection.tileSelected');
      tile.style.backgroundImage='url("assets/'+(t.id===selTank?(un2?un2[0]:un[0]):un[0])+'")';
      var ti=document.createElement('img'); ti.src='assets/thumb/'+t.id+'.png';
      ti.style.cssText='position:absolute;left:8px;top:8px;width:80px;height:80px;object-fit:contain;';
      tile.appendChild(ti);
      var lv=(lobby&&lobby.level)?lobby.level:1;
      var lvImg=art('chrome.tankLevel'+Math.min(6,lv));
      if(lvImg){ var lvi=document.createElement('img'); lvi.src='assets/'+lvImg[0]; lvi.style.cssText='position:absolute;left:'+((96-lvImg[1])/2)+'px;top:2px;width:'+lvImg[1]+'px;height:'+lvImg[2]+'px;'; tile.appendChild(lvi); }
      var _v5=el('span','',t.name); _v5.style.cssText='position:absolute;left:4px;right:4px;bottom:4px;font:11px Tahoma;color:#fff;text-shadow:0 1px 3px #00395d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;display:block;'; tile.appendChild(_v5);
      tile.addEventListener('click',function(){
        selTank=t.id;
        if(typeof lobby!=='undefined') lobby.tankId=t.id;
        buildGrid();
        updateInfo(t);
      });
      gridWin.appendChild(tile);
    });
    gridWin.style.height=Math.ceil(filtered.length/5)*102+'px';
  }
  
  function updateInfo(t){
    if(!t) return;
    var lv=(lobby&&lobby.level)?lobby.level:1;
    var st=t.levels?t.levels[Math.min(lv-1,t.levels.length-1)]:{};
    info.innerHTML='';
    var bgi=img('selection.tankInfoBackground',0,0,380,110);
    if(bgi){ bgi.style.position='absolute'; bgi.style.zIndex='-1'; info.appendChild(bgi); }
    var _v6=el('span','',t.name); _v6.style.cssText='position:absolute;left:10px;top:6px;right:10px;font:bold 15px Tahoma;color:#fff9bd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;'; info.appendChild(_v6);
    var rows=[['HP',st.hp],['Công',st.atk],['Giáp',st.armor],['Tốc',st.speed],['Tầm',st.range],['Tb',st.fire]];
    rows.forEach(function(r,ri){
      var rw=el('div','',r[0]+': '+(r[1]!=null?r[1]:'?'));
      rw.style.cssText='position:absolute;left:10px;top:'+(28+ri*17)+'px;font:11px Tahoma;color:#9fc4dc;display:block;width:calc(50% - 14px);';
      info.appendChild(rw);
    });
  }
  
  search.addEventListener('input',buildGrid);
  buildGrid();
  var ct=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks.find(function(t){return t.id===selTank}):null;
  if(ct) updateInfo(ct);
  
  // Countdown
  var remaining=60;
  countdownTimer=setInterval(function(){
    remaining--;
    if(remaining<=0){
      clearInterval(countdownTimer); countdownTimer=null;
      if(typeof lobby!=='undefined') lobby.tankId=selTank;
      show('loading');
      return;
    }
    allyClock.textContent=remaining;
    enemyClock.textContent=remaining;
  },1000);
}

/* ========== LOADING ========== */
function buildLoading(data){
  setWH(1000,618);
  addBg('loading.background');
  var vs=art('loading.versus');
  if(vs){ var vi=document.createElement('img'); vi.src='assets/'+vs[0];
    pos(vi,(1000-vs[1])/2,(618-vs[2])/2,vs[1],vs[2]); stage.appendChild(vi); }
  
  // Map preview
  var mapId=(lobby&&lobby.mode&&lobby.mode.mapId)?lobby.mode.mapId:4;
  var mi=document.createElement('img'); mi.src='assets/m/'+mapId+'/minimap.webp';
  pos(mi,432,14,136,136); mi.style.objectFit='cover'; mi.style.border='3px solid #0077d3';
  mi.alt='Map '+mapId; stage.appendChild(mi);
  var _mnp=mapName(mapId);
  stage.appendChild(lbl(_mnp?('#'+_mnp.id+' · '+_mnp.w+'x'+_mnp.h):('Map '+mapId),370,153,260,'m8lmapname'));
  
  // Player cards
  var positions={1:[[-10,205],[190,101],[190,308],[-10,0],[-10,409]],2:[[778,205],[575,101],[575,308],[778,0],[778,409]]};
  var nA=(lobby&&lobby.botAllies!=null)?lobby.botAllies:4;
  var nE=(lobby&&lobby.botEnemies!=null)?lobby.botEnemies:5;
  var fills=[],pcts=[];
  
  for(var camp=1;camp<=2;camp++){
    var count=camp===1?Math.min(5,nA+1):Math.min(5,nE);
    for(var i=0;i<count;i++){
      var p=positions[camp][i];
      if(!p||p[0]<0||p[0]+235>1000) continue;
      var card=document.createElement('div'); card.className='m8lcard'; pos(card,p[0],p[1],235,190);
      var hex=art('loading.hexagon');
      if(hex){ var hi=document.createElement('img'); hi.src='assets/'+hex[0]; pos(hi,0,0,hex[1],hex[2]); card.appendChild(hi); }
      var isPlayer=(camp===1&&i===0);
      if(isPlayer){ var sh=art('loading.selfHexagon'); if(sh){ var si=document.createElement('img'); si.src='assets/'+sh[0]; pos(si,-3,-3,sh[1],sh[2]); card.appendChild(si); } }
      var headSrc;
      if(isPlayer) headSrc='assets/thumb/'+lobby.tankId+'.png';
      else { var bI=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks[(camp===1?i:i+5)%DB.tanks.length]:null; headSrc=bI?'assets/thumb/'+bI.id+'.png':''; }
      if(headSrc){ var hd=document.createElement('img'); hd.src=headSrc; pos(hd,38,4,160,160); hd.style.objectFit='contain'; card.appendChild(hd); }
      var nm=isPlayer?'Ngài':((DB.tanks?DB.tanks[(camp===1?i:i+5)%DB.tanks.length]:null)||{}).name||'Bot';
      card.appendChild(lbl(nm,78,143,145,'m8lname'));
      var track=art('loading.progressTrack');
      if(track){ var tix=document.createElement('img'); tix.src='assets/'+track[0]; pos(tix,51,166,130,14); card.appendChild(tix); }
      var fill=document.createElement('div'); fill.className='m8lfill'; pos(fill,52,167,0,14);
      var fimg=art('loading.progress');
      if(fimg){ var fi=document.createElement('img'); fi.src='assets/'+fimg[0]; fi.style.cssText='position:absolute;left:0;top:0;width:130px;'; fill.appendChild(fi); }
      card.appendChild(fill); fills.push(fill);
      var pct=document.createElement('span'); pct.className='m8lpct'; pos(pct,52,164,130); pct.textContent='0%'; card.appendChild(pct); pcts.push(pct);
      stage.appendChild(card);
    }
  }
  
  // Status
  var status=lbl('Đang tải trận…',385,411,230,'m8status');
  stage.appendChild(status);
  
  // Exit
  stage.appendChild(txtBtn('Về sảnh',454,527,92,27,function(){
    if(typeof B!=='undefined') B=null;
    show('menu');
  }));
  
  // Simulate loading then call startBattle
  var progress=0;
  timer=setInterval(function(){
    progress+=Math.random()*12+4;
    if(progress>=100){
      progress=100;
      clearInterval(timer); timer=null;
      status.textContent='Sẵn sàng!';
      setTimeout(function(){
        status.textContent='Đang vào trận…';
        if(typeof startBattle==='function') startBattle();
      },500);
    }
    fills.forEach(function(f){ f.style.width=(130*progress/100)+'px'; });
    pcts.forEach(function(p){ p.textContent=Math.floor(progress)+'%'; });
  },300);
}

/* ========== RESULT ========== */
function buildResult(data){
  setWH(1000,618);
  addBg('results.background');
  // Hide old end-of-battle overlay + battle canvas so M72 result is the only visible screen
  try{var _eo=document.getElementById('endov');if(_eo)_eo.style.display='none';var _bc=document.getElementById('battle');if(_bc)_bc.style.display='none';}catch(e){}
  var win=data&&data.win;
  // Title
  var titleKey=win?'title.win':'title.lose';
  var te=art(titleKey);
  if(te){
    var tw=Math.min(400,te[1]*0.4), th=te[2]*0.4;
    var timg=document.createElement('img');
    timg.src='assets/'+te[0];
    pos(timg,(1000-tw)/2,30,tw,th);
    stage.appendChild(timg);
  }
  // Score
  var scoreEl=lbl(win?'THẮNG!':'THUA',380,140,240,'m8rescore');
  scoreEl.style.fontSize='48px';
  scoreEl.style.color=win?'#ffd34d':'#ff5347';
  scoreEl.style.textShadow='0 3px 8px #000';
  stage.appendChild(scoreEl);
  if(data&&data.sub){
    var subEl=lbl(data.sub,300,195,400,'m8rescore');
    subEl.style.fontSize='13px'; subEl.style.color='#c2e5f8';
    stage.appendChild(subEl);
  }
  
  // KDA table
  var kda=document.createElement('div'); kda.className='m8kda'; pos(kda,140,210,720);
  var table=document.createElement('table');
  var thead='<tr><th style="width:35%">Đội Xanh (Bạn)</th><th style="width:5%">H</th><th style="width:5%">C</th><th style="width:5%">Đ</th><th style="width:35%">Đội Đỏ (Địch)</th><th style="width:5%">H</th><th style="width:5%">C</th><th style="width:5%">Đ</th></tr>';
  var rows=[];
  if(typeof B!=='undefined'&&B&&B.ents){
    var blue=B.ents.filter(function(e){return e.team===1;}).sort(function(a,b){return (b.kills||0)-(a.kills||0);});
    var red=B.ents.filter(function(e){return e.team===2;}).sort(function(a,b){return (b.kills||0)-(a.kills||0);});
    var maxR=Math.max(blue.length,red.length);
    for(var i=0;i<maxR;i++){
      var be=blue[i],re=red[i];
      var bc=be?'<td class="'+(be.isPlayer?'me':'')+'">'+(be.isPlayer?'⭐ ':'')+be.name+'</td><td class="n">'+(be.kills||0)+'</td><td class="n">'+(be.deaths||0)+'</td><td class="n">'+(be.dmg?Math.round(be.dmg).toLocaleString('vi-VN'):'0')+'</td>':'<td>–</td><td></td><td></td><td></td>';
      var rc=re?'<td>'+re.name+'</td><td class="n">'+(re.kills||0)+'</td><td class="n">'+(re.deaths||0)+'</td><td class="n">'+(re.dmg?Math.round(re.dmg).toLocaleString('vi-VN'):'0')+'</td>':'<td>–</td><td></td><td></td><td></td>';
      rows.push('<tr>'+bc+rc+'</tr>');
    }
  }
  table.innerHTML=thead+'<tbody>'+(rows.length?rows.join(''):'<tr><td colspan="8" style="text-align:center;padding:20px">Không có dữ liệu</td></tr>')+'</tbody>';
  kda.appendChild(table);
  stage.appendChild(kda);
  
  // Buttons
  stage.appendChild(txtBtn('CHƠI LẠI',300,530,180,40,function(){
    if(typeof B!=='undefined') B=null;
    show('loading');
  },true));
  stage.appendChild(txtBtn('VỀ SẢNH',520,530,180,40,function(){
    if(typeof B!=='undefined') B=null;
    show('menu');
  }));
}

/* ---------- API ---------- */
window.M8Lobby={
  showMenu:function(){ show('menu'); },
  showHall:function(d){ show('hall',d||{}); },
  showRoom:function(d){ show('room',d||{}); },
  showSelection:function(d){ show('selection',d||{}); },
  showLoading:function(d){ show('loading',d||{}); },
  showResult:function(d){ show('result',d||{}); },
  hide:function(){ root.classList.remove('on'); cur=null; if(timer){clearInterval(timer);timer=null;} if(countdownTimer){clearInterval(countdownTimer);countdownTimer=null;} },
  // Khi vào trận thật (startBattle chạy, #battle hiện): giấu màn loading M72, game engine tự vẽ trận
  hideOnBattleStart:function(){ if(_used){ root.classList.remove('on'); cur=null; if(timer){clearInterval(timer);timer=null;} } },
  // Về sảnh M72 sau trận
  backToMenu:function(){ if(typeof B!=='undefined') B=null; try{var _eo=document.getElementById('endov');if(_eo)_eo.style.display='none';var _bc=document.getElementById('battle');if(_bc)_bc.style.display='none';}catch(e){} show('menu'); },
  backToHall:function(){ if(typeof B!=='undefined') B=null; try{var _eo=document.getElementById('endov');if(_eo)_eo.style.display='none';var _bc=document.getElementById('battle');if(_bc)_bc.style.display='none';}catch(e){} show('hall'); },
  get used(){ return _used; },
  get current(){ return cur; },
  stage:stage,
  root:root
};

console.log('[M8Lobby] M72 lobby UI ready — art keys:',Object.keys(A).length);
})();
