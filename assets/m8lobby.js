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

/* ========== HALL (SummerHallFrame M72 gốc — hall "Đấu trường") ========== */
// Dữ liệu catalog M72 gốc (m810_modes / m89_pk_maps / m811_death) — map + tên + tiêu chuẩn y hệt client M72.
var M72_PK_MAPS=[
  {mapId:19,mode:'pk_robo',name:'Robo – Star Wars',objective:''},
  {mapId:1,mode:'pk_maya',name:'Lời Tiên Tri Maya',objective:'Diệt đối thủ, hoàn thành nhiệm vụ Tù Trưởng'},
  {mapId:4,mode:'pk_snow',name:'Băng Thiên Tuyết Địa',objective:''},
  {mapId:17,mode:'pk_fastfood',name:'Quán Ăn Vui Vẻ',objective:'Diệt đối thủ, tận dụng trụ hồi phục'},
  {mapId:18,mode:'pk_totem',name:'Vật Tổ',objective:'Diệt đối thủ, tranh đoạt Vật Tổ'},
  {mapId:20,mode:'pk_cow',name:'Dắt Bò',objective:'Dẫn bò đối phương về chuồng đội mình'},
  {mapId:21,mode:'pk_lightning',name:'Điện Chớp Sấm Rền',objective:'Diệt đối thủ, kiểm soát trụ năng lượng'},
  {mapId:34,mode:'pk_polar',name:'Tiền Đồn Cực Địa',objective:''},
  {mapId:35,mode:'pk_fortress',name:'Pháo Đài Không Gian',objective:'Diệt đối thủ, tận dụng cổng dịch chuyển'},
  {mapId:36,mode:'pk_mine',name:'Khu Mỏ Phóng Xạ',objective:'Hộ tống xe mỏ về căn cứ'}
];
var M72_BASE_MAPS=[{mapId:12,name:'Tinh Khoáng'},{mapId:14,name:'Di Tích Maya'},{mapId:50,name:'Thị Trấn Ánh Dương'},{mapId:169,name:'Cực Địa'}];
var M72_OCCUPY_MAPS=[{mapId:7,name:'Việt Dã'},{mapId:9,name:'Cổ Mộ'},{mapId:10,name:'Trung Tâm Vận Chuyển'},{mapId:37,name:'Quân Khu Tử Thần'},{mapId:170,name:'Vùng Cát Lún'}];
var M72_ESCORT_MAPS=[{mapId:70,name:'Hộ Tống Xe Bom'}];
var M72_DEATH_MAPS=[{mapId:30,name:'Mỏ Khoáng Sụp Đổ'},{mapId:40,name:'Thành Tận Thế'}];
var M72_PRACTICE_MAPS=[{mapId:7,name:'Việt Dã luyện tập'}];
var M72_SPECIAL=[
  {mapId:9,name:'Ba Cờ Chiếm Điểm',kind:'m72flags',time:600,winScore:300,desc:'Chiếm 3 cờ M72: giữ vòng cờ để tích điểm · cờ giữa cần giữ lâu hơn, cho nhiều điểm hơn.'},
  {mapId:36,name:'Dẫn Bò Sữa',kind:'m72cow',time:600,winPoints:25,desc:'Dẫn xe bò của mình tới chuồng địch: xe chỉ chạy khi có đồng đội đi kèm · chặn xe địch.'},
  {mapId:70,name:'Đuổi Xe Bom',kind:'m72cart',time:900,winScore:1000,desc:'Hộ tống xe bom trên đường ray: càng nhiều người đi kèm càng nhanh · phá/đè xe địch.'},
  {mapId:170,name:'Lốc Xoái',kind:'m72flags',time:600,winScore:300,desc:'Chiếm 3 cờ giữa bão lốc M72: lốc di chuyển theo đường cố định, hất tung + làm chậm ai trúng.'}
];
var BOT_AI_OPTS=[{v:'legacy',l:'Bot gốc'},{v:'elite_v1',l:'ProV3'}];
var M72_ROOMS=[
  {id:1021,name:'Săn Boss tối Thứ 7',type:2,mapId:19,pc:7,px:10,st:0},
  {id:1104,name:'So tài Vật Tổ',type:2,mapId:18,pc:10,px:10,st:0},
  {id:1213,name:'Tự do · Cổ Mộ',type:1,mapId:9,pc:3,px:10,st:0},
  {id:1330,name:'Hội Quân · Mỏ Phóng Xạ',type:2,mapId:36,pc:9,px:10,st:2},
  {id:1402,name:'Sân tập Việt Dã',type:1,mapId:7,pc:2,px:10,st:0},
  {id:1511,name:'Tinh Khoáng · Team Rực',type:1,mapId:12,pc:6,px:10,st:0},
  {id:1624,name:'Cực Địa · Winter',type:2,mapId:169,pc:10,px:10,st:0},
  {id:1733,name:'Cát Lún · Thợ Săn',type:1,mapId:170,pc:4,px:10,st:2}
];
function m72MapGroup(id){
  if(M72_PK_MAPS.some(function(x){return x.mapId===id;})) return 'PK';
  if(M72_BASE_MAPS.some(function(x){return x.mapId===id;})) return 'Phá trụ';
  if(M72_OCCUPY_MAPS.some(function(x){return x.mapId===id;})) return 'Chiếm cứ điểm';
  if(M72_ESCORT_MAPS.some(function(x){return x.mapId===id;})) return 'Hộ tống';
  if(M72_DEATH_MAPS.some(function(x){return x.mapId===id;})) return 'Sinh Tử';
  if(M72_PRACTICE_MAPS.some(function(x){return x.mapId===id;})) return 'Luyện tập';
  return null;
}
function synthM72Mode(mapId){
  var pk=(M72_PK_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(pk) return { key:'pk'+mapId, name:'So tài PK · '+pk.name, desc:'So tài 5v5 '+pk.name+' · '+(pk.objective||'Tiêu diệt đối thủ, kiếm điểm')+' · hạ 25 mạng trước là thắng.', mapId:mapId, time:600, winKills:25, kind:'tdm', group:'PK' };
  var b=(M72_BASE_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(b) return { key:'base'+mapId, name:'Phá trụ · '+b.name, desc:'Phá trụ căn cứ địch ở đầu kia bản đồ '+b.name+' · trụ vỡ là thắng ngay.', mapId:mapId, time:600, kind:'base', group:'Phá trụ' };
  var o=(M72_OCCUPY_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(o){
    if(o.mapId===9)  return { key:'m72flags9',  name:'Ba Cờ Chiếm Điểm', desc:'Chiếm 3 cờ M72: giữ vòng cờ để tích điểm · cờ giữa cần giữ lâu hơn, cho nhiều điểm hơn.', mapId:9, time:600, winScore:300, kind:'m72flags', group:'Chiếm cứ điểm' };
    return { key:'occp'+mapId, name:'Chiếm cứ điểm · '+o.name, desc:'Giữ vòng cứ điểm giữa map '+o.name+' để tích điểm · chạm 1000 điểm trước là thắng.', mapId:mapId, time:600, winScore:1000, kind:'point', group:'Chiếm cứ điểm' };
  }
  var e=(M72_ESCORT_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(e) return { key:'m72cart70', name:'Đuổi Xe Bom', desc:'Hộ tống xe bom trên đường ray: càng nhiều người đi kèm càng nhanh · phá/đè xe địch.', mapId:70, time:900, winScore:1000, kind:'m72cart', group:'Hộ tống' };
  var d=(M72_DEATH_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(d) return { key:'elim'+mapId, name:'Sinh Tử · '+d.name, desc:'Không hồi sinh · đội còn người sống sót cuối cùng thắng hiệp, thắng 3 hiệp trước ('+d.name+').', mapId:mapId, time:300, kind:'elim', group:'Sinh Tử' };
  var p=(M72_PRACTICE_MAPS||[]).find(function(x){return x.mapId===mapId;});
  if(p) return { key:'practice'+mapId, name:'Luyện tập · '+p.name, desc:'Sân tập riêng: thử mọi chiêu của tank đang chọn · 5 tank Lv6 đứng yên, hồi sinh 5 giây.', mapId:mapId, time:0, kind:'practice', group:'Luyện tập' };
  return null;
}
var modalShade=null;
function closeModal(){ if(modalShade){ modalShade.remove(); modalShade=null; } }

function buildHall(data){
  setWH(1018,618);
  addBg('room.background');
  var sh=img('flow.pvpReadyRoom1000x600_shadow',18,47); if(sh) stage.appendChild(sh);
  var th=art('flow.title_hall_t'); if(th){ var ti=document.createElement('img'); ti.src='assets/'+th[0]; pos(ti,(1018-th[1])/2,21,th[1],th[2]); stage.appendChild(ti); }
  addBtn('public.close',979,15,24,24,null,function(){ show('menu'); });

  // 4 tab (gốc: Sự kiện / So tài PK / Xếp hạng / Giải Guild — chỉ So tài PK hoạt động trên máy chủ tĩnh)
  var tabs=[
    {icon:'flow.sort_title_happygame_t',text:'Sự kiện',en:false},
    {icon:'flow.sort_title_arena_selected_t',text:'So tài PK',en:true,sel:true},
    {icon:'flow.icon_ladder_unselect_t',text:'Xếp hạng',en:false},
    {icon:'flow.sort_title_teamcompetition_t',text:'Giải Guild',en:false}
  ];
  tabs.forEach(function(t,ix){
    var bg=art(t.sel?'flow.sort_selected':'flow.sort_bk');
    var b=document.createElement('button'); b.className='m8artbtn';
    pos(b,22+[0,113,226,339][ix],51,109,39);
    if(bg){ var bi=document.createElement('img'); bi.src='assets/'+bg[0]; bi.style.cssText='width:109px;height:39px;display:block;'; b.appendChild(bi); }
    if(!t.en) b.classList.add('off');
    var ic=art(t.icon);
    if(ic){ var ii=document.createElement('img'); ii.src='assets/'+ic[0]; ii.style.cssText='position:absolute;left:'+Math.max(0,(109-ic[1])/2)+'px;top:'+Math.max(0,(39-ic[2])/2)+'px;width:'+ic[1]+'px;height:'+ic[2]+'px;'; b.appendChild(ii); }
    b.title=t.en?'So tài PK':'chưa mở trên máy chủ hiện tại';
    stage.appendChild(b);
  });

  // Header danh sách phòng (6 tiêu đề cột)
  ['team','name','model','map','num','status'].forEach(function(nm,ix){
    var a=art('flow.roomlist_caption_'+nm+'_t'); if(!a) return;
    var im=document.createElement('img'); im.src='assets/'+a[0]; pos(im,[40,230,359,459,559,658][ix],92,a[1],a[2]); im.style.objectFit='contain'; stage.appendChild(im);
  });

  // Danh sách 8 phòng
  var listWrap=el('div',''); pos(listWrap,21,109,783,292); stage.appendChild(listWrap);
  for(var r=0;r<8;r++){
    var bk=art('flow.list_bk');
    if(bk){ var bi2=document.createElement('img'); bi2.src='assets/'+bk[0]; pos(bi2,0,r===7?251:36*r,781,38); listWrap.appendChild(bi2); }
  }
  var rooms=M72_ROOMS.slice();
  var hallList=el('div',''); pos(hallList,5,5,778,288); hallList.style.overflowY='auto'; hallList.style.scrollbarWidth='thin'; listWrap.appendChild(hallList);
  function renderRooms(){
    hallList.replaceChildren();
    rooms.slice(0,8).forEach(function(room){
      var waiting=(room.st!==2), full=room.pc>=room.px, row=document.createElement('article'); row.style.cssText='position:relative;height:36px;';
      var bgA=art(waiting?'flow.roomlisttitle_wait_bk':'flow.roomlisttitle_pairing_bk');
      if(bgA){ var rb=document.createElement('img'); rb.src='assets/'+bgA[0]; pos(rb,0,4,771,28); row.appendChild(rb); }
      var c1=el('span','',String(room.id)); pos(c1,3,3,110,22); c1.style.cssText+=';font:12px Tahoma;color:#cde9ff;overflow:hidden;white-space:nowrap;'; row.appendChild(c1);
      var c2=el('span','',room.name||''); pos(c2,144,3,171,22); c2.style.cssText+=';font:bold 13px Tahoma;color:#fff9bd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; row.appendChild(c2);
      var c3=el('span','',room.type===1?'Tự do':'So tài'); pos(c3,323,3,60,22); c3.style.cssText+=';font:11px Tahoma;color:#9fc4dc;'; row.appendChild(c3);
      var pk=m72MapGroup(room.mapId); var c4=el('span','',pk?(pk+' · '+room.mapId):('Map '+room.mapId)); pos(c4,391,3,120,22); c4.style.cssText+=';font:11px Tahoma;color:#cde9ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'; row.appendChild(c4);
      var c5=el('span','',room.pc+'/'+room.px); pos(c5,523,3,60,22); c5.style.cssText+=';font:bold 12px Tahoma;color:#fff;'; row.appendChild(c5);
      var stKey=full?'flow.list_status_waitting_disable_t':(room.st===2?'flow.list_status_pairing_t':'flow.list_status_waitting_t');
      var stA=art(stKey); if(stA){ var si=document.createElement('img'); si.src='assets/'+stA[0]; pos(si,385.5+259-stA[1]/2,2,stA[1],stA[2]); si.style.objectFit='contain'; row.appendChild(si); }
      var joinable=waiting&&!full;
      var jb=el('button','m8artbtn'); pos(jb,719,2,49,24);
      var jA=art('flow.roomlist_btn_join_t'); if(jA){ var ji=document.createElement('img'); ji.src='assets/'+jA[0]; ji.style.cssText='width:49px;height:24px;display:block;'; jb.appendChild(ji); }
      jb.title='Gia nhập đội '+room.id;
      if(!joinable) jb.classList.add('off');
      jb.addEventListener('click',function(){
        if(!joinable) return;
        var m=synthM72Mode(room.mapId); if(m) lobby.mode=m;
        show('room');
      });
      row.appendChild(jb);
      hallList.appendChild(row);
    });
  }
  renderRooms();

  var pager=img('flow.pager_bk',527,394); if(pager) stage.appendChild(pager);
  stage.appendChild(artBtn('flow.btn_s2_prev',605,399,null,null,null,function(){},null));
  stage.appendChild(artBtn('flow.btn_s2_next',648,399,null,null,null,function(){},null));
  var refresh=artBtn('flow.button_2_s_blue',714,398,86,25,'Làm mới',function(){
    M72_ROOMS.forEach(function(rm){ rm.pc=Math.min(rm.px,1+Math.floor(Math.random()*10)); rm.st=Math.random()<0.3?2:0; });
    rooms=M72_ROOMS.slice(); renderRooms();
  },{disabled:false}); if(refresh) stage.appendChild(refresh);

  // Quick play (gốc: nút đỏ "Gia nhập nhanh")
  var qbk=img('flow.quickplay_bk_4',534,429); if(qbk) stage.appendChild(qbk);
  var qj=artBtn('flow.button_red_m',546,442,198,48,null,function(){
    var first=rooms.find(function(rm){return rm.st!==2&&rm.pc<rm.px;});
    if(!first){ alert('Không có phòng trống để gia nhập nhanh.'); return; }
    var m=synthM72Mode(first.mapId); if(m) lobby.mode=m;
    show('room');
  },{disabled:false}); if(qj) stage.appendChild(qj);
  var qw=art('flow.word_quickplay_onlyfont_t'); if(qw){ var qwi=document.createElement('img'); qwi.src='assets/'+qw[0]; pos(qwi,546+69-12,442+12,qw[1],qw[2]); qwi.style.objectFit='contain'; qwi.style.pointerEvents='none'; stage.appendChild(qwi); }
  var ico=img('flow.ico_pvp',581,451,32,31); if(ico) ico.style.pointerEvents='none';

  // "Tạo đội PK" + "Tìm đội" (gốc: btn_create_team_t / btn_find_team_t)
  stage.appendChild(artBtn('flow.btn_create_team_t',527,499,null,null,'Tạo đội PK',function(){ openCreateRoomModal(); },null));
  stage.appendChild(artBtn('flow.btn_find_team_t',650,499,null,null,'Tìm đội',function(){ openFindRoomModal(); },null));

  // Chat (gốc: createChat(ui,false))
  buildChatPanel(false);
  // Sidebar online (gốc: roomplayerlist)
  buildSidebar();
}
function buildChatPanel(isRoom){
  var root=el('section',''); pos(root,10,407,464,202);
  var bk=art('flow.chatBk'); if(bk){ var b=document.createElement('img'); b.src='assets/'+bk[0]; pos(b,0,-6,bk[1],bk[2]); root.appendChild(b); }
  ['Tổng','Room','Team','Guild','Chat riêng'].forEach(function(txt,ix){
    var a=art(ix===0?'flow.chat_channel_select':'flow.chat_channel_item'); if(!a) return;
    var btn=document.createElement('button'); btn.className='m8artbtn off'; pos(btn,31+ix*71,1,69,25);
    var i=document.createElement('img'); i.src='assets/'+a[0]; i.style.cssText='width:69px;height:25px;display:block;'; btn.appendChild(i);
    var lb=el('span','',txt); pos(lb,0,1,69,24); lb.style.cssText+=';text-align:center;font:10px Tahoma;color:#e7f6ff;text-shadow:0 1px 1px #000;pointer-events:none;'; btn.appendChild(lb);
    btn.title='Kênh chat chưa được máy chủ hiện tại hỗ trợ'; root.appendChild(btn);
  });
  [['flow.chat_clear',53,'Xóa chat'],['flow.chat_up',77,'Cuộn lên'],['flow.chat_down',101,'Cuộn xuống'],['flow.chat_downend',125,'Cuối chat']].forEach(function(r){
    var a=art(r[0]); if(!a) return;
    var b=document.createElement('button'); b.className='m8artbtn off'; pos(b,10,r[1],20,20);
    var i=document.createElement('img'); i.src='assets/'+a[0]; i.style.cssText='width:20px;height:20px;display:block;'; b.appendChild(i);
    b.title=r[2]; root.appendChild(b);
  });
  var inpRow=el('div',''); pos(inpRow,0,159,239,40);
  function i2(a){ var n=document.createElement('img'); n.src='assets/'+a[0]; n.style.cssText='position:absolute;top:-3px;width:'+a[1]+'px;height:'+a[2]+'px;'; return n; }
  var hh=art('flow.chatbghead'); if(hh){ var n1=i2(hh); n1.style.left='6px'; inpRow.appendChild(n1); }
  var mm=art('flow.chatbgmid'); if(mm){ var n2=i2(mm); n2.style.left='116px'; inpRow.appendChild(n2); }
  var tt=art('flow.chatbgtail'); if(tt){ var n3=i2(tt); n3.style.left='214px'; inpRow.appendChild(n3); }
  var chLb=el('span','',isRoom?'Room':'Thế giới'); pos(chLb,31,10,70,19); chLb.style.cssText+=';font:13px Tahoma;color:#e7f6ff;text-shadow:0 1px 1px #000;'; inpRow.appendChild(chLb);
  var unav=el('span','','Chat chưa mở'); pos(unav,122,10,96,19); unav.style.cssText+=';font:12px Tahoma;color:#9fc4dc;white-space:nowrap;'; inpRow.appendChild(unav);
  root.appendChild(inpRow);
  stage.appendChild(root);
}
function buildSidebar(){
  var root=el('section',''); pos(root,813,45,194,521);
  var bk=art('flow.roomplayerlist_bk'); if(bk){ var b=document.createElement('img'); b.src='assets/'+bk[0]; pos(b,0,0,bk[1],bk[2]); root.appendChild(b); }
  for(var i=0;i<7;i++){ var it=art('flow.roomplayerlist_item'); if(it){ var ii=document.createElement('img'); ii.src='assets/'+it[0]; pos(ii,9,40+66*i,it[1],it[2]); root.appendChild(ii); } }
  [['team','Guild',15],['friend','Bạn',71],['hall','Online',127]].forEach(function(r){
    var key=r[2]===127?'flow.roomplayerlist_label_selected':'flow.roomplayerlist_label_bk';
    var a=art(key); if(!a) return;
    var btn=document.createElement('button'); btn.className='m8artbtn'+(r[2]!==127?' off':''); pos(btn,r[2],6,53,25);
    var im=document.createElement('img'); im.src='assets/'+a[0]; im.style.cssText='width:53px;height:25px;display:block;'; btn.appendChild(im);
    if(r[2]!==127){ var icA=art('flow.roomplayerlist_label_'+r[0]+'_t'); if(icA){ var ic=document.createElement('img'); ic.src='assets/'+icA[0]; ic.style.cssText='position:absolute;left:'+Math.max(0,(53-icA[1])/2)+'px;top:'+Math.max(0,(25-icA[2])/2)+'px;width:'+icA[1]+'px;height:'+icA[2]+'px;'; btn.appendChild(ic); } }
    else { var lb=el('span','','Online'); pos(lb,0,1,53,23); lb.style.cssText+=';text-align:center;font:bold 10px Tahoma;color:#fff;text-shadow:0 1px 2px #000;pointer-events:none;'; btn.appendChild(lb); }
    btn.title=r[0]==='hall'?'Người chơi online trong server':'chưa có danh sách từ máy chủ';
    root.appendChild(btn);
  });
  var self=el('div',''); pos(self,5,40,184,64);
  var av=document.createElement('img'); av.src='assets/thumb/'+lobby.tankId+'.png'; av.style.cssText='position:absolute;left:8px;top:4px;width:56px;height:56px;object-fit:contain;'; self.appendChild(av);
  var sv=el('span','','Ngài'); pos(sv,72,8,100,18); sv.style.cssText+=';font:bold 12px Tahoma;color:#fff9bd;overflow:hidden;white-space:nowrap;'; self.appendChild(sv);
  var sl=el('span','','Cấp '+((lobby&&lobby.level)||1)); pos(sl,72,30,100,16); sl.style.cssText+=';font:10px Tahoma;color:#9fc4dc;'; self.appendChild(sl);
  root.appendChild(self);
  var names=(typeof DB!=='undefined'&&DB.tanks)?DB.tanks:['','An','Bình','Chương','Đạt','Em'];
  for(var k=0;k<6;k++){
    var row2=el('div',''); pos(row2,5,106+66*k,184,64);
    var nm=(DB.tanks&&DB.tanks[k])?DB.tanks[k].name:names[k%names.length];
    var lv=1+(k%5);
    var nmEl=el('span','',nm||('Người chơi '+(k+1))); pos(nmEl,8,4,120,18); nmEl.style.cssText+=';font:bold 12px Tahoma;color:#e7f6ff;overflow:hidden;white-space:nowrap;text-shadow:0 1px 2px #000;'; row2.appendChild(nmEl);
    var lvImg2=art('chrome.tankLevel'+Math.min(6,lv)); if(lvImg2){ var lvN=document.createElement('img'); lvN.src='assets/'+lvImg2[0]; pos(lvN,8,26,lvImg2[1],lvImg2[2]); row2.appendChild(lvN); }
    root.appendChild(row2);
  }
  stage.appendChild(root);
}
function makeRange(a,b){ var r=[]; for(var i=a;i<=b;i++) r.push({v:String(i),l:String(i)}); return r; }
function rowLbl(text,y){ var s=el('span','',text); s.style.cssText='position:absolute;left:14px;top:'+(y)+'px;font:bold 12px Tahoma;color:#cde9ff;width:130px;'; return s; }

// (form modal "Tạo đội PK" — dạng xếp dọc, label trái / select phải, y hệt modal 472x538 gốc)
function openCreateRoomModal(){
  if(modalShade) return;
  modalShade=el('div','m8shade'); stage.appendChild(modalShade);
  var panel=el('div','m8panel m8modal'); pos(panel,273,40,472,538); panel.style.zIndex='30';
  modalShade.appendChild(panel);
  var ct=art('wizard.assets.hall.title_createroom_t');
  if(ct){ var ci=document.createElement('img'); ci.src='assets/'+ct[0]; pos(ci,(472-ct[1])/2,19,ct[1],ct[2]); ci.style.objectFit='contain'; panel.appendChild(ci); }
  var closeB=artBtn('public.close',418,15,24,24,null,closeModal,null); if(closeB) panel.appendChild(closeB);

  var form=el('div',''); pos(form,40,64,392,404); panel.appendChild(form);
  function rowLabel(t,yy){ var s=el('span','',t); s.style.cssText='position:absolute;left:0;top:'+yy+'px;font:bold 12px Tahoma;color:#cde9ff;width:392px;display:block;'; form.appendChild(s); }

  // Chế độ và bản đồ — nhóm "group · name" y hệt dropdown gốc
  var modeOpts=[];
  M72_PK_MAPS.forEach(function(m){ modeOpts.push({v:'pk'+m.mapId,l:'So tài PK · '+m.name}); });
  M72_BASE_MAPS.forEach(function(m){ modeOpts.push({v:'base'+m.mapId,l:'Phá trụ · '+m.name}); });
  M72_OCCUPY_MAPS.forEach(function(m){ modeOpts.push({v:'occp'+m.mapId,l:'Chiếm cứ điểm · '+m.name}); });
  M72_ESCORT_MAPS.forEach(function(m){ modeOpts.push({v:'m72cart'+m.mapId,l:'Hộ tống · '+m.name}); });
  M72_DEATH_MAPS.forEach(function(m){ modeOpts.push({v:'elim'+m.mapId,l:'Sinh Tử · '+m.name}); });
  M72_PRACTICE_MAPS.forEach(function(m){ modeOpts.push({v:'practice'+m.mapId,l:'Luyện tập · '+m.name}); });
  M72_SPECIAL.forEach(function(m){ modeOpts.push({v:'m72sp'+m.mapId,l:'M72 đặc biệt · '+m.name}); });
  rowLabel('Chế độ và bản đồ',0);
  var modeSel=sel(0,20,392,modeOpts,'pk19','Chế độ và bản đồ'); form.appendChild(modeSel);

  rowLabel('Số bot cùng đội',64);  var alliesSel=sel(0,84,392,makeRange(0,4),String((lobby&&lobby.botAllies!=null)?lobby.botAllies:4),'Số bot cùng đội'); form.appendChild(alliesSel);
  rowLabel('Số bot đối thủ',118); var enemiesSel=sel(0,138,392,makeRange(0,5),String((lobby&&lobby.botEnemies!=null)?lobby.botEnemies:5),'Số bot đối thủ'); form.appendChild(enemiesSel);
  rowLabel('Cấp tank của bot',172); var levelSel=sel(0,192,392,makeRange(1,6),String((lobby&&lobby.botLevel!=null)?lobby.botLevel:1),'Cấp tank của bot'); form.appendChild(levelSel);
  rowLabel('Loại bot cùng đội',226); var aiSel=sel(0,246,196,BOT_AI_OPTS,'legacy','Loại bot cùng đội'); form.appendChild(aiSel);
  rowLabel('Loại bot đối thủ',280); var aiESel=sel(0,300,196,BOT_AI_OPTS,'legacy','Loại bot đối thủ'); form.appendChild(aiESel);

  var note=el('span','', (modeSel.value==='practice'+M72_PRACTICE_MAPS[0].mapId)?'Luyện tập: 5 tank Lv6 đứng yên, hồi sinh sau 5 giây. Không giới hạn giờ.':'Chọn bot riêng cho mỗi phe. Để 0 bot cả hai bên nếu chơi toàn người.');
  note.style.cssText='position:absolute;left:0;top:336px;width:392px;font:11px Tahoma;color:#9fc4dc;line-height:1.45;'; form.appendChild(note);

  function syncNote(){
    var training=(modeSel.value==='practice'+M72_PRACTICE_MAPS[0].mapId);
    if(training){ alliesSel.value='0'; enemiesSel.value='5'; levelSel.value='6';
      [alliesSel,enemiesSel,levelSel,aiSel,aiESel].forEach(function(s){s.disabled=true;});
      note.textContent='Luyện tập: 5 tank Lv6 đứng yên, hồi sinh sau 5 giây. Không giới hạn giờ.';
    } else {
      [alliesSel,enemiesSel,levelSel,aiSel,aiESel].forEach(function(s){s.disabled=false;});
      note.textContent='Chọn bot riêng cho mỗi phe. Để 0 bot cả hai bên nếu chơi toàn người.';
    }
  }
  modeSel.addEventListener('change',syncNote);

  var confirmB=artBtn('flow.button_window_green',332,474,120,35,null,function(){
    var mkey=modeSel.value;
    var sp=M72_SPECIAL.find(function(x){return 'm72sp'+x.mapId===mkey;});
    var m;
    if(sp) m={ key:sp.kind+sp.mapId, name:sp.name, desc:sp.desc, mapId:sp.mapId, time:sp.time, kind:sp.kind, winScore:sp.winScore, winPoints:sp.winPoints, group:'M72' };
    else m=synthM72Mode(parseInt(mkey.slice(2),10));
    if(!m){ alert('Chế độ không khả dụng.'); return; }
    lobby.mode=m;
    lobby.botAllies=parseInt(alliesSel.value,10)||0;
    lobby.botEnemies=parseInt(enemiesSel.value,10)||0;
    lobby.botLevel=parseInt(levelSel.value,10)||1;
    lobby.botAI=(aiSel.value==='elite_v1'?'ProV3':'Bot gốc');
    closeModal();
    show('room');
  },{disabled:false});
  if(confirmB) panel.appendChild(confirmB);
  var w=art('flow.title_confirm_green_t'); if(w){ var wi=document.createElement('img'); wi.src='assets/'+w[0]; pos(wi,332+12,474+7,w[1],w[2]); wi.style.objectFit='contain'; wi.style.pointerEvents='none'; panel.appendChild(wi); }
}
function openFindRoomModal(){
  if(modalShade) return;
  modalShade=el('div','m8shade'); stage.appendChild(modalShade);
  var panel=el('div','m8panel m8modal'); pos(panel,330,180,358,258); panel.style.zIndex='30'; modalShade.appendChild(panel);
  var closeB2=artBtn('public.close',319,15,24,24,null,closeModal,null); if(closeB2) panel.appendChild(closeB2);
  var t2=art('wizard.assets.hall.title_createroom_t'); if(t2){ var ti2=document.createElement('img'); ti2.src='assets/'+t2[0]; pos(ti2,(358-t2[1])/2,19,t2[1],t2[2]); ti2.style.objectFit='contain'; panel.appendChild(ti2); }
  var lb2=el('span','','Nhập mã phòng'); pos(lb2,74,55,210,23); lb2.style.cssText+=';font:bold 13px Tahoma;color:#cde9ff;'; panel.appendChild(lb2);
  var inp=document.createElement('input'); inp.className='m8inp'; pos(inp,74,82,210,35); inp.maxLength=6; inp.inputMode='numeric'; inp.placeholder='Mã phòng 6 chữ số'; panel.appendChild(inp);
  var st=el('span','','Vào chỗ trống hoặc thay một bot. Mỗi phe tối đa 5 người.'); pos(st,34,125,290,60); st.style.cssText+=';font:11px Tahoma;color:#9fc4dc;line-height:1.4;'; panel.appendChild(st);
  var ok=artBtn('flow.button_window_green',119,206,120,35,null,function(){
    var code=(inp.value||'').trim();
    if(!/^[0-9]{6}$/.test(code)){ st.textContent='Nhập mã phòng gồm 6 chữ số.'; return; }
    var room=rooms.find(function(rm){return String(rm.id)===code.slice(0,4);});
    if(!room){ st.textContent='Không tìm thấy phòng '+code+' trên máy chủ hiện tại.'; return; }
    if(room.st===2||room.pc>=room.px){ st.textContent='Phòng '+room.id+' đang '+((room.st===2)?'gắp đôi':'đủ người')+' — không gia nhập được.'; return; }
    var m=synthM72Mode(room.mapId); if(m) lobby.mode=m;
    st.textContent='Đã vào phòng '+room.id+' ('+(room.pc+1)+'/'+room.px+' người).';
    setTimeout(closeModal,600); show('room');
  },{disabled:false}); panel.appendChild(ok);
  var w3=art('flow.title_confirm_green_t'); if(w3){ var wi3=document.createElement('img'); wi3.src='assets/'+w3[0]; pos(wi3,119+12,206+7,w3[1],w3[2]); wi3.style.objectFit='contain'; wi3.style.pointerEvents='none'; panel.appendChild(wi3); }
  try{ inp.focus(); }catch(e){}
}

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
