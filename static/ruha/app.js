/* RUHA — offline-first personal planner. Data stays in this browser unless exported. */
(() => {
  'use strict';
  const APP_NAME = 'RUHA';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const DAY = 86400000;
  const DB_NAME = 'ruha-local-v1';
  const DB_VERSION = 1;
  const categoryColors = ['#64748b','#0f766e','#b45309','#7c3aed','#be123c','#2563eb','#4d7c0f','#a16207','#0e7490'];
  const defaultCategories = [
    { id:'cat-personal', name:'شخصی', color:'#64748b', icon:'circle' },
    { id:'cat-study', name:'درس و یادگیری', color:'#7c3aed', icon:'book-open' },
    { id:'cat-work', name:'کار', color:'#2563eb', icon:'briefcase' },
    { id:'cat-health', name:'سلامتی', color:'#0f766e', icon:'heart-pulse' }
  ];
  const ICONS = {
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    'check-square':'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m7.5 12 3 3 6-6"/>',
    chart:'<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-2 -2) scale(1.16)"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    sparkle:'<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3M19 5l1.5 1.5"/>',
    play:'<path d="m8 5 12 7-12 7z"/>', pause:'<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    flame:'<path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-2-1-3-3-3-5-3 4-4 6-4 9a7 7 0 0 0 7 7Z"/><path d="M12 22a3 3 0 0 0 3-3c0-2-1-3-3-5-1 2-3 3-3 5a3 3 0 0 0 3 3Z"/>',
    'arrow-left':'<path d="M19 12H5m7 7-7-7 7-7"/>', 'arrow-right':'<path d="M5 12h14m-7-7 7 7-7 7"/>',
    'arrow-down-up':'<path d="m3 8 4-4 4 4M7 4v16m14-4-4 4-4-4m4 4V4"/>',
    'plus-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    inbox:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 13h5l2 3h4l2-3h5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/>',
    'chevron-right':'<path d="m15 18-6-6 6-6"/>', 'chevron-left':'<path d="m9 18 6-6-6-6"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    sliders:'<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4"/>',
    archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8m-9 4h4"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    'sun-moon':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4"/>',
    database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/>',
    x:'<path d="m18 6-12 12M6 6l12 12"/>', check:'<path d="m5 12 4 4L19 6"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
    'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8m-8 4h8"/>',
    'book-open':'<path d="M2 4h7a4 4 0 0 1 4 4v13a4 4 0 0 0-4-4H2zM22 4h-7a4 4 0 0 0-4 4v13a4 4 0 0 1 4-4h7z"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v2h4v-2"/>',
    'heart-pulse':'<path d="M20.8 8.6c0 5.4-8.8 11.4-8.8 11.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.2Z"/><path d="M3 12h5l2-3 3 6 2-3h6"/>',
    circle:'<circle cx="12" cy="12" r="7"/>', edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
    'more-horizontal':'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.4m-6.8 7 6.8 4.4"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/>',
    rotate:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    undo:'<path d="M3 7v6h6M3 13a9 9 0 1 0 3-6.7L3 12"/>',
    external:'<path d="M14 3h7v7m0-7-9 9"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    filter:'<path d="M4 4h16l-6 7v6l-4 3v-9z"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  };
  const icon = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.circle}</svg>`;
  function renderIcons(root=document) { $$('[data-icon]', root).forEach(el => { const n=el.dataset.icon; el.innerHTML=icon(n); }); }
  const uuid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'r-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,11));
  const pad = n => String(n).padStart(2,'0');
  const faNum = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const numberText = n => { const raw=String(n??0).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))); const value=Number(raw); const out=Number.isFinite(value)?String(Math.round(value)):raw; return state?.settings?.numbers==='en'?out:faNum(out); };
  const todayIso = (date=new Date()) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const dateFromIso = s => { if(!s)return null; const d=new Date(s); return Number.isNaN(d.getTime())?null:d; };
  const dayStart = d => new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const sameDay = (a,b) => !!a && !!b && a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const addDays = (d,n) => {const c=new Date(d);c.setDate(c.getDate()+n);return c;};
  const fmtTime = s => {const d=typeof s==='string'?dateFromIso(s):s;if(!d)return 'بدون ساعت';return new Intl.DateTimeFormat(state?.settings?.numbers==='en'?'en-GB':'fa-IR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d);};
  const fmtFullDate = (d, cal='jalali', opts={weekday:'long',year:'numeric',month:'long',day:'numeric'}) => { const locale=cal==='jalali'?'fa-IR-u-ca-persian':(state?.settings?.numbers==='en'?'en-GB-u-ca-gregory':'fa-IR-u-ca-gregory');return new Intl.DateTimeFormat(locale,opts).format(d);};
  const fmtShortDate = (d, cal='jalali') => new Intl.DateTimeFormat(cal==='jalali'?'fa-IR-u-ca-persian':(state?.settings?.numbers==='en'?'en-GB-u-ca-gregory':'fa-IR-u-ca-gregory'),{day:'numeric',month:'short'}).format(d);
  const calParts = (d, cal='jalali') => {
    const locale=cal==='jalali'?'fa-IR-u-ca-persian':(state?.settings?.numbers==='en'?'en-GB-u-ca-gregory':'fa-IR-u-ca-gregory');
    const ps=new Intl.DateTimeFormat(locale,{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d);
    const get=t=>ps.find(x=>x.type===t)?.value||'';
    return {year:get('year'),month:get('month'),day:get('day'),key:`${get('year')}-${get('month')}`};
  };
  const monthName = (d,cal) => new Intl.DateTimeFormat(cal==='jalali'?'fa-IR-u-ca-persian':(state?.settings?.numbers==='en'?'en-GB-u-ca-gregory':'fa-IR-u-ca-gregory'),{month:'long',year:'numeric'}).format(d);
  const parseLocalDateTime = value => {if(!value)return null;const d=new Date(value);return Number.isNaN(d.getTime())?null:d;};
  const toLocalInput = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtDistance = ms => {const mins=Math.max(0,Math.round(ms/60000));if(mins<60)return `${numberText(mins)} دقیقه`;const h=Math.floor(mins/60),m=mins%60;return `${numberText(h)} ساعت${m?` و ${numberText(m)} دقیقه`:''}`;};
  const getCategory = id => state.categories.find(c=>c.id===id) || state.categories[0] || {name:'بدون دسته',color:'#64748b'};
  const isItemVisible = item => !item.deletedAt && !item.archived;

  const defaultState = () => ({
    version:1,
    categories:structuredCloneSafe(defaultCategories),
    items:[],
    timeEntries:[],
    timer:{itemId:'',startedAt:null,elapsedBefore:0},
    settings:{theme:'system',calendar:'jalali',weekStart:6,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Tehran',notifications:false,quietHours:false,quietStart:'22:00',quietEnd:'08:00',numbers:'fa',weekend:'fri',showSecondaryDate:true},
    lastOpened:new Date().toISOString(),
    notified:{},
    archivedView:false,trashView:false,
  });
  function structuredCloneSafe(x){return JSON.parse(JSON.stringify(x));}
  let state = defaultState();
  let db = null;
  let saveChain = Promise.resolve();
  let saveQueued = false;
  let saveIndicatorTimer = null;
  let currentView='today';
  let todayFilter='all';
  let taskStatus='all';
  let queryText='';
  let listCategory='all', listDate='all', listPriority='all';
  let calendarCursor=dayStart(new Date()), selectedCalendarDate=dayStart(new Date()), calendarMode='month';
  let selectedItemType='task', draftAttachments=[], recorder=null, recordingChunks=[], recordingStarted=0, recordingTimer=null, recordingStream=null;
  let currentEditItem=null, pendingDeleteUndo=null, timerTicker=null, reminderTicker=null, timelineSortAsc=true;
  let settingsTab='appearance', selectedCategoryColor=categoryColors[0];
  let categoryFilter='all';
  let activeNotificationRegistration=null, deferredInstallPrompt=null;

  function openDB(){return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){resolve(null);return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('state'))d.createObjectStore('state');};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });}
  function dbRead(){return new Promise((resolve,reject)=>{if(!db){resolve(null);return;}const tx=db.transaction('state','readonly');const req=tx.objectStore('state').get('main');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
  function dbWrite(value){return new Promise((resolve,reject)=>{if(!db){resolve(false);return;}const tx=db.transaction('state','readwrite');tx.objectStore('state').put(value,'main');tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);});}
  async function loadState(){
    try{db=await openDB();}catch(err){console.warn('IndexedDB unavailable; using local fallback.',err);db=null;}
    let saved=null;try{saved=await dbRead();}catch(err){console.warn(err);}
    if(!saved){try{saved=JSON.parse(localStorage.getItem('ruha-state')||'null');}catch(_){saved=null;}}
    if(saved && typeof saved==='object'){
      const base=defaultState();state={...base,...saved,settings:{...base.settings,...(saved.settings||{})},categories:Array.isArray(saved.categories)?saved.categories:base.categories,items:Array.isArray(saved.items)?saved.items:[],timeEntries:Array.isArray(saved.timeEntries)?saved.timeEntries:[],timer:saved.timer||base.timer,notified:saved.notified||{}};
      if(!state.categories.length) state.categories=structuredCloneSafe(defaultCategories);
    }
    applyTheme();
    renderAll();
    updateTimerUI();
    updateNotificationBadge();
  }
  function saveState(){
    const snapshot=structuredCloneSafe(state); $('#last-saved-label').textContent='در حال ذخیره…';
    saveChain=saveChain.then(async()=>{try{if(db)await dbWrite(snapshot);else localStorage.setItem('ruha-state',JSON.stringify(snapshot));$('#last-saved-label').textContent='تغییرات ذخیره شد';$('#sync-label').textContent=db?'ذخیره‌ی محلی فعال':'ذخیره روی این دستگاه';}catch(err){console.error(err);toast('ذخیره انجام نشد؛ فضای دستگاه را بررسی کن.','error');$('#last-saved-label').textContent='خطا در ذخیره';}}).catch(err=>console.error(err));
    clearTimeout(saveIndicatorTimer);saveIndicatorTimer=setTimeout(()=>{$('#last-saved-label').textContent='ذخیره‌ی خودکار فعال است';},2300);
  }
  function applyTheme(){
    let dark=state.settings.theme==='dark';if(state.settings.theme==='system')dark=window.matchMedia?.('(prefers-color-scheme: dark)').matches||false;
    document.documentElement.dataset.theme=dark?'dark':'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#151613':'#f7f7f5');
    const t=$('#theme-toggle');if(t)t.innerHTML=icon(dark?'sun':'moon');
  }
  function updateWeekStart(){return Number(state.settings.weekStart??6);}
  function effectiveDue(item){return item.dueAt?new Date(item.dueAt):null;}
  function isOverdue(item){const d=effectiveDue(item);return !!d&&d.getTime()<Date.now()&&item.status!=='done'&&item.type!=='note'&&!item.deletedAt;}
  function itemToday(item){const d=effectiveDue(item);return d?sameDay(d,new Date()):item.type!=='note';}
  function todayItems(){return state.items.filter(i=>isItemVisible(i)&&itemToday(i));}
  function sortItems(items){return [...items].sort((a,b)=>{
    const da=effectiveDue(a),dbb=effectiveDue(b);if(da&&dbb&&da.getTime()!==dbb.getTime())return timelineSortAsc?da-dbb:dbb-da;if(da&&!dbb)return -1;if(!da&&dbb)return 1;const p={high:0,medium:1,low:2};return (p[a.priority]??1)-(p[b.priority]??1)||new Date(b.createdAt)-new Date(a.createdAt);
  });}
  function taskLine(item, compact=false){
    const cat=getCategory(item.categoryId);const done=item.status==='done';const d=effectiveDue(item);
    const statusBadge=item.status==='doing'?'<span class="task-badge">در حال انجام</span>':'';
    const typeBadge=item.type==='note'?`<span class="task-badge note">یادداشت</span>`:item.type==='reminder'?`<span class="task-badge">یادآور</span>`:'';
    const timeBadge=d?`<span class="task-time">${icon('clock')}${fmtTime(d)}${isOverdue(item)?' · عقب‌افتاده':''}</span>`:(item.type!=='note'?`<span class="task-time">${icon('clock')}بدون زمان</span>`:'');
    const categoryBadge=cat?`<span class="task-category-tag"><i class="mini-category-dot" style="--cat-color:${cat.color}"></i>${escapeHTML(cat.name)}</span>`:'';
    const priorityBadge=item.priority?`<span class="task-priority ${item.priority}">${({high:'زیاد',medium:'متوسط',low:'کم'})[item.priority]||''}</span>`:'';
    const attachmentBadge=item.attachments?.length?`<span class="task-category-tag">${icon(item.attachments.some(a=>a.kind==='audio')?'mic':'image')}${numberText(item.attachments.length)} پیوست</span>`:'';
    const check=(item.type==='note')?'':`<button class="task-check ${done?'checked':''}" data-action="complete" data-id="${item.id}" aria-label="${done?'بازگرداندن':'انجام شد'}: ${escapeHTML(item.title)}">${done?icon('check'):''}</button>`;
    return `<article class="task-row ${done?'completed':''}" data-item-row="${item.id}">${check}<div class="task-main" data-action="detail" data-id="${item.id}" ${!item.dueAt&&item.type!=='note'?'draggable="true"':''} tabindex="0" role="button" aria-label="جزئیات ${escapeHTML(item.title)}"><span class="task-title">${escapeHTML(item.title)}</span>${item.description&&!compact?`<div class="task-description">${escapeHTML(item.description)}</div>`:''}<div class="task-meta">${timeBadge}${categoryBadge}${priorityBadge}${typeBadge}${statusBadge}${attachmentBadge}</div></div><div class="task-row-actions"><button class="icon-btn" data-action="edit" data-id="${item.id}" aria-label="ویرایش"><span>${icon('edit')}</span></button><button class="icon-btn" data-action="more" data-id="${item.id}" aria-label="بیشتر"><span>${icon('more-horizontal')}</span></button></div></article>`;
  }
  function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function setView(view){
    currentView=view;
    $$('.view').forEach(el=>el.classList.toggle('active-view',el.id===`view-${view}`));
    $$('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    const names={today:'امروز',calendar:'تقویم',tasks:'همه‌ی کارها',insights:'آمار و عملکرد',settings:'تنظیمات'};
    $('#crumb-current').textContent=names[view]||'امروز';
    $('#sidebar').classList.remove('open');
    if(view==='calendar')renderCalendar();if(view==='tasks')renderTasks();if(view==='insights')renderInsights();if(view==='settings')renderSettings();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderCategories(){
    const list=$('#category-list');list.innerHTML=`<button class="category-entry ${categoryFilter==='all'?'selected':''}" data-category-filter="all"><i class="category-color" style="--cat-color:#a1a39d"></i><span>همه‌ی دسته‌ها</span><span class="cat-count">${numberText(state.items.filter(isItemVisible).length)}</span></button>`+state.categories.map(c=>`<button class="category-entry ${categoryFilter===c.id?'selected':''}" data-category-filter="${c.id}"><i class="category-color" style="--cat-color:${c.color}"></i><span>${escapeHTML(c.name)}</span><span class="cat-count">${numberText(state.items.filter(i=>isItemVisible(i)&&i.categoryId===c.id).length)}</span></button>`).join('');
    const selects=['#item-category','#list-category-filter'];selects.forEach(sel=>{const el=$(sel);if(!el)return;const prev=el.value;const allOpt=sel==='#list-category-filter'?'<option value="all">همه‌ی دسته‌ها</option>':'';el.innerHTML=allOpt+state.categories.map(c=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');if([...el.options].some(o=>o.value===prev))el.value=prev;else if(sel==='#item-category'&&state.categories[0])el.value=state.categories[0].id;});
    renderIcons(list);
  }
  function updateDateHero(){
    const now=new Date(),cal=state.settings.calendar;
    $('#today-weekday').textContent=new Intl.DateTimeFormat('fa-IR',{weekday:'long'}).format(now);
    $('#today-date-line').textContent=fmtFullDate(now,cal,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    const p=calParts(now,cal);$('#date-card-day').textContent=numberText(p.day);
    $('#date-card-month').textContent=monthName(now,cal).replace(/\s*\d+\s*$/,'');
    $('#date-card-gregorian').textContent=cal==='jalali'?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(now):new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric',month:'short',year:'numeric'}).format(now);
  }
  function renderToday(){
    updateDateHero();
    const list=todayItems();const visible=list.filter(i=>todayFilter==='all'||(todayFilter==='todo'&&i.status!=='done')||(todayFilter==='done'&&i.status==='done'));
    const tasks=list.filter(i=>i.type!=='note');const done=tasks.filter(i=>i.status==='done').length;const left=tasks.length-done;const overdue=list.filter(isOverdue).length;const ratio=tasks.length?Math.round(done/tasks.length*100):0;
    $('#progress-number').textContent=numberText(ratio)+'٪';$('#progress-ring').style.setProperty('--progress',ratio+'%');$('#done-count').textContent=numberText(done);$('#left-count').textContent=numberText(left);$('#overdue-count').textContent=numberText(overdue);
    $('#today-progress-title').textContent=ratio===100&&tasks.length?'عالی پیش رفتی!':ratio>=50?'از نیمه گذشتی':tasks.length?'قدم‌به‌قدم جلو می‌ری':'شروع آروم';
    $('#progress-footnote').textContent=tasks.length?`${numberText(done)} مورد از ${numberText(tasks.length)} کار امروز تکمیل شده.`:'هر کار کوچکی، شروع یک مسیر است.';
    $('#today-task-count').textContent=numberText(list.length);
    $('#today-task-list').innerHTML=sortItems(visible).map(i=>taskLine(i)).join('');
    $('#today-empty').classList.toggle('hidden',visible.length>0);
    $('#add-task-inline').classList.toggle('hidden',visible.length===0);
    const taskOptions=sortItems(state.items.filter(i=>isItemVisible(i)&&i.type!=='note'&&i.status!=='done')).map(i=>`<option value="${i.id}">${escapeHTML(i.title)}</option>`).join('');
    const select=$('#timer-task-select'),prev=select.value;select.innerHTML='<option value="">انتخاب کار…</option>'+taskOptions;if([...select.options].some(o=>o.value===prev))select.value=prev;else if(state.timer.itemId)select.value=state.timer.itemId;
    renderTimeline();renderStreak();updateTimerUI();
  }
  function getTimelineHours(){return {start:7,end:22};}
  function renderTimeline(){
    const hours=$('#timeline-hours'),track=$('#timeline-track'),events=$('#timeline-events');const {start,end}=getTimelineHours();hours.innerHTML='';
    for(let h=start;h<=end;h++){const el=document.createElement('span');el.className='timeline-hour';el.style.top=`${(h-start)/(end-start)*100}%`;el.textContent=numberText(h)+':۰۰';hours.appendChild(el);}
    const now=new Date(),minutes=(now.getHours()*60+now.getMinutes())-start*60;
    const nowLine=$('#now-line');nowLine.style.top=`${Math.max(0,Math.min(100,minutes/((end-start)*60)*100))}%`;nowLine.style.display=now.getHours()>=start&&now.getHours()<end?'block':'none';
    const scheduled=sortItems(todayItems().filter(i=>i.dueAt&&i.type!=='note'));
    events.innerHTML=scheduled.map(item=>{
      const d=effectiveDue(item),mins=d.getHours()*60+d.getMinutes(),dur=Math.max(15,Number(item.duration)||30),top=((mins-start*60)/((end-start)*60))*100,height=(dur/((end-start)*60))*100;const cat=getCategory(item.categoryId);const visibleTop=Math.max(0,Math.min(100,top));const visibleHeight=Math.max(3,Math.min(height,100-visibleTop));
      return `<div class="timeline-event ${item.status==='done'?'completed':''}" draggable="true" data-timeline-id="${item.id}" style="top:${visibleTop}%;height:${visibleHeight}%;--event-color:${cat.color}" title="برای جابه‌جایی بکش؛ برای جزئیات کلیک کن"><strong>${escapeHTML(item.title)}</strong><small>${fmtTime(d)} · ${numberText(dur)} دقیقه</small></div>`;
    }).join('');
    const total=scheduled.reduce((sum,i)=>sum+Math.max(15,Number(i.duration)||30),0);$('#timeline-free-time').textContent=scheduled.length?`${numberText(scheduled.length)} برنامه · ${fmtDistance(total*60000)} زمان‌بندی شده`:'زمان‌بندی هنوز خالیه.';
  }
  function renderStreak(){
    const dates=new Set(state.items.filter(i=>i.status==='done'&&i.completedAt&&!i.deletedAt).map(i=>todayIso(new Date(i.completedAt))));let streak=0;let c=dayStart(new Date());if(!dates.has(todayIso(c)))c=addDays(c,-1);while(dates.has(todayIso(c))&&streak<1000){streak++;c=addDays(c,-1);}
    $('#streak-count').textContent=numberText(streak);
    const now=new Date();let weekStart=dayStart(now);const offset=(weekStart.getDay()-1+7)%7;weekStart=addDays(weekStart,-offset);
    const names=['د','س','چ','پ','ج','ش','ی'];let html='';let doneCount=0;for(let i=0;i<7;i++){const d=addDays(weekStart,i);const key=todayIso(d);const done=dates.has(key);if(done)doneCount++;html+=`<div class="week-day ${done?'completed':''} ${sameDay(d,now)?'current':''}"><span>${names[i]}</span><i>${done?'✓':numberText(new Intl.DateTimeFormat('fa-IR',{day:'numeric'}).format(d))}</i></div>`;}
    $('#week-dots').innerHTML=html;$('#week-done-count').textContent=`${numberText(doneCount)} روز فعال`;
  }
  function renderCalendar(){
    const cal=state.settings.calendar;const startOfMonth=calendarMonthStart(calendarCursor,cal);const endParts=calParts(startOfMonth,cal);$('#calendar-month-title').textContent=monthName(startOfMonth,cal);$('#calendar-subtitle').textContent=cal==='jalali'?'نمایش تقویم شمسی':'Gregorian calendar';
    const startWeek=updateWeekStart();const weekNamesSunday=['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];const weekNames=Array.from({length:7},(_,i)=>weekNamesSunday[(startWeek+i)%7]);
    const grid=$('#calendar-grid');grid.innerHTML=weekNames.map(w=>`<div class="calendar-weekday">${w}</div>`).join('');
    let gridStart=addDays(startOfMonth,-((startOfMonth.getDay()-startWeek+7)%7));let days=calendarMode==='week'?Array.from({length:7},(_,i)=>addDays(selectedCalendarDate,-((selectedCalendarDate.getDay()-startWeek+7)%7)+i)):Array.from({length:42},(_,i)=>addDays(gridStart,i));
    const today=new Date();const dayItemsByKey=new Map();state.items.filter(i=>isItemVisible(i)&&i.dueAt).forEach(i=>{const d=effectiveDue(i),k=todayIso(d);if(!dayItemsByKey.has(k))dayItemsByKey.set(k,[]);dayItemsByKey.get(k).push(i);});
    const monthKey=calParts(startOfMonth,cal).key;
    for(const d of days){const p=calParts(d,cal),items=sortItems(dayItemsByKey.get(todayIso(d))||[]);const other=cal==='jalali'?new Intl.DateTimeFormat('en-GB',{day:'numeric'}).format(d):new Intl.DateTimeFormat('fa-IR-u-ca-persian',{day:'numeric'}).format(d);const cell=document.createElement('button');cell.type='button';cell.className='calendar-cell'+(p.key!==monthKey?' outside-month':'')+(sameDay(d,today)?' today':'')+(sameDay(d,selectedCalendarDate)?' selected':'');cell.dataset.calendarDate=todayIso(d);cell.innerHTML=`<span class="calendar-day-number">${numberText(p.day)}${state.settings.showSecondaryDate?`<small class="calendar-day-secondary">${other}</small>`:''}</span><div class="calendar-events">${items.slice(0,3).map(i=>`<span class="calendar-event-pill" style="--event-color:${getCategory(i.categoryId).color}">${escapeHTML(i.title)}</span>`).join('')}${items.length>3?`<span class="calendar-more">+${numberText(items.length-3)} مورد</span>`:''}</div>`;grid.appendChild(cell);}
    renderCalendarDay();
  }
  function calendarMonthStart(date,cal){let d=dayStart(date),key=calParts(d,cal).key;for(let i=0;i<34;i++){const prev=addDays(d,-1);if(calParts(prev,cal).key!==key)break;d=prev;}return d;}
  function renderCalendarDay(){
    const d=selectedCalendarDate;$('#selected-day-title').textContent=fmtFullDate(d,state.settings.calendar,{weekday:'long',day:'numeric',month:'long'});
    const items=sortItems(state.items.filter(i=>isItemVisible(i)&&i.dueAt&&sameDay(effectiveDue(i),d)));
    $('#calendar-day-list').innerHTML=items.length?items.map(i=>`<div class="calendar-day-item"><span class="calendar-day-time">${fmtTime(effectiveDue(i))}</span>${taskLine(i,true)}</div>`).join(''):'<div class="calendar-day-empty">برای این روز هنوز کاری ثبت نشده است.</div>';
  }
  function renderTasks(){
    const items=state.items.filter(i=>state.trashView?!!i.deletedAt:state.archivedView?!!i.archived&&!i.deletedAt: isItemVisible(i));
    const query=queryText.trim().toLocaleLowerCase();
    const filtered=items.filter(i=>{
      if(taskStatus!=='all'&&i.status!==taskStatus)return false;
      if(categoryFilter!=='all'&&i.categoryId!==categoryFilter)return false;
      if(listCategory!=='all'&&i.categoryId!==listCategory)return false;
      if(listPriority!=='all'&&i.priority!==listPriority)return false;
      const d=effectiveDue(i),now=dayStart(new Date());
      if(listDate==='today'&&(!d||!sameDay(d,new Date())))return false;
      if(listDate==='week'&&(!d||d<now||d>=addDays(now,7)))return false;
      if(listDate==='overdue'&&!isOverdue(i))return false;
      if(listDate==='none'&&d)return false;
      const normalizedQuery=normalizeFa(query);const hay=normalizeFa([i.title,i.description,...(i.tags||[]),getCategory(i.categoryId).name].join(' '));if(normalizedQuery&&!hay.includes(normalizedQuery))return false;
      return true;
    });
    $('#all-task-list').innerHTML=sortItems(filtered).map(i=>taskLine(i)).join('');
    $('#list-results-label').textContent=state.trashView?'سطل زباله':state.archivedView?'آرشیو':`${numberText(filtered.length)} آیتم`;
    const all=state.items.filter(i=>isItemVisible(i));$('#filter-all-count').textContent=numberText(all.length);$('#filter-todo-count').textContent=numberText(all.filter(i=>i.status==='todo').length);$('#filter-doing-count').textContent=numberText(all.filter(i=>i.status==='doing').length);$('#filter-done-count').textContent=numberText(all.filter(i=>i.status==='done').length);
    $('#toggle-archived').classList.toggle('active',state.archivedView);$('#toggle-trash').classList.toggle('active',state.trashView);
    renderCategories();
  }
  function normalizeFa(s){return String(s||'').toLowerCase().replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d));}
  function renderInsights(){
    const days=($('#insight-period').value==='month')?30:7;const start=dayStart(addDays(new Date(),-(days-1)));const items=state.items.filter(i=>!i.deletedAt&&new Date(i.createdAt)>=start);const inPeriodDone=state.items.filter(i=>i.status==='done'&&i.completedAt&&new Date(i.completedAt)>=start&&!i.deletedAt);const ratio=items.length?Math.round(inPeriodDone.length/items.length*100):0;
    const secs=state.timeEntries.filter(e=>new Date(e.startedAt)>=start).reduce((s,e)=>s+Math.max(0,(new Date(e.endedAt||Date.now())-new Date(e.startedAt))/60000),0);
    $('#insight-completed').textContent=numberText(inPeriodDone.length);$('#insight-completed-delta').textContent=`از ${numberText(items.length)} آیتم`;$('#insight-rate').textContent=numberText(ratio)+'٪';$('#insight-time').innerHTML=`${numberText(secs)}<span>دقیقه</span>`;
    let streak=0,c=dayStart(new Date());const set=new Set(state.items.filter(i=>i.status==='done'&&i.completedAt&&!i.deletedAt).map(i=>todayIso(new Date(i.completedAt))));if(!set.has(todayIso(c)))c=addDays(c,-1);while(set.has(todayIso(c))&&streak<1000){streak++;c=addDays(c,-1);}$('#insight-streak').textContent=numberText(streak);
    const span=days===7?7:30;const daily=[];for(let i=span-1;i>=0;i--){const d=dayStart(addDays(new Date(),-i));const count=state.items.filter(it=>it.status==='done'&&it.completedAt&&sameDay(new Date(it.completedAt),d)&&!it.deletedAt).length;daily.push({d,count});}
    const chartDays=days===7?daily:daily.filter((x,i)=>i%4===0||i===daily.length-1);const max=Math.max(1,...chartDays.map(x=>x.count));$('#completion-chart').innerHTML=chartDays.map(({d,count})=>`<div class="bar-chart-cell ${sameDay(d,new Date())?'current':''}"><span class="bar-chart-value">${numberText(count)}</span><div class="bar-chart-bar-wrap"><div class="bar-chart-bar"><span style="height:${count/max*100}%"></span></div></div><span class="bar-chart-label">${new Intl.DateTimeFormat('fa-IR',{weekday:days===7?'short':undefined,day:days===30?'numeric':undefined}).format(d)}</span></div>`).join('');
    const byCat=new Map();state.timeEntries.filter(e=>new Date(e.startedAt)>=start).forEach(e=>{const item=state.items.find(i=>i.id===e.itemId);const c=item?getCategory(item.categoryId):{id:'unknown',name:'بدون دسته',color:'#92958d'};const mins=Math.max(0,(new Date(e.endedAt||Date.now())-new Date(e.startedAt))/60000);byCat.set(c.id,{name:c.name,color:c.color,mins:(byCat.get(c.id)?.mins||0)+mins});});
    const arr=[...byCat.values()].sort((a,b)=>b.mins-a.mins).slice(0,6);const total=arr.reduce((s,x)=>s+x.mins,0);let cumulative=0;const colors=arr.map(x=>x.color);const gradient=arr.length?arr.map(x=>{const startP=cumulative/Math.max(1,total)*100;cumulative+=x.mins;return `${x.color} ${startP}% ${cumulative/Math.max(1,total)*100}%`;}).join(', '):'var(--soft-2) 0 100%';
    $('#category-chart').innerHTML=`<div class="donut" style="background:conic-gradient(${gradient})"><div class="donut-center"><strong>${numberText(Math.round(total))}</strong><small>دقیقه</small></div></div><div class="category-legend">${arr.length?arr.map(x=>`<div class="category-legend-row"><i style="--legend-color:${x.color}"></i><span>${escapeHTML(x.name)}</span><strong>${numberText(Math.round(x.mins))}</strong></div>`).join(''):'<span class="muted-small">با استفاده از زمان‌سنج، توزیع زمان نمایش داده می‌شود.</span>'}</div>`;
    const heat=[];for(let i=29;i>=0;i--){const d=addDays(new Date(),-i),n=state.items.filter(it=>it.status==='done'&&it.completedAt&&sameDay(new Date(it.completedAt),d)&&!it.deletedAt).length;heat.push({d,n});}
    const maxH=Math.max(1,...heat.map(x=>x.n));$('#activity-heatmap').innerHTML=heat.map(({d,n})=>{const level=n===0?0:Math.min(4,Math.ceil(n/maxH*4));return `<div class="heat-cell" data-level="${level}" title="${fmtFullDate(d,state.settings.calendar,{day:'numeric',month:'long'})}: ${numberText(n)} کار"></div>`;}).join('');
  }
  function settingRow(title,description,control){return `<div class="setting-row"><div class="setting-copy"><strong>${title}</strong><p>${description}</p></div><div class="setting-control">${control}</div></div>`;}
  function switchControl(id,checked){return `<label class="switch"><input type="checkbox" id="${id}" ${checked?'checked':''}><span></span></label>`;}
  function renderSettings(){
    const content=$('#settings-content');let html='';
    if(settingsTab==='appearance'){
      html=`<h2 class="settings-section-title">ظاهر و نمایش</h2><p class="settings-section-description">RUHA را با سلیقه و دستگاه خودت هماهنگ کن.</p>`+
      settingRow('حالت نمایش','تم خودکار، روشن یا تیره را انتخاب کن.',`<select id="setting-theme"><option value="system" ${state.settings.theme==='system'?'selected':''}>خودکار</option><option value="light" ${state.settings.theme==='light'?'selected':''}>روشن</option><option value="dark" ${state.settings.theme==='dark'?'selected':''}>تیره</option></select>`)+
      settingRow('تقویم پیش‌فرض','تاریخ‌ها در نمای تقویم بر اساس این گزینه نمایش داده می‌شوند.',`<select id="setting-calendar"><option value="jalali" ${state.settings.calendar==='jalali'?'selected':''}>شمسی</option><option value="gregorian" ${state.settings.calendar==='gregorian'?'selected':''}>میلادی</option></select>`)+
      settingRow('تاریخ دوم','تاریخ متناظر را کوچک‌تر کنار روزها نمایش بده.',switchControl('setting-secondary-date',state.settings.showSecondaryDate))+ 
      settingRow('نمایش اعداد','قالب اعداد در رابط برنامه.',`<select id="setting-numbers"><option value="fa" ${state.settings.numbers==='fa'?'selected':''}>فارسی</option><option value="en" ${state.settings.numbers==='en'?'selected':''}>انگلیسی</option></select>`)+
      settingRow('نصب روی دستگاه','RUHA را روی صفحه‌ی اصلی موبایل یا دسکتاپ اضافه کن.',`<button class="button button-quiet" id="install-app">${icon('download')} نصب RUHA</button>`)+
      `<div class="settings-notice" style="margin-top:17px">ظاهر RUHA عمداً ساده و کم‌رنگ طراحی شده تا توجه روی خود کارها بماند. تنظیمات نمایش روی همین دستگاه ذخیره می‌شود.</div>`;
    }else if(settingsTab==='calendar'){
      html=`<h2 class="settings-section-title">تقویم و زمان</h2><p class="settings-section-description">زمان‌ها بر اساس ساعت دستگاه نمایش داده می‌شوند.</p>`+
      settingRow('شروع هفته','اولین ستون تقویم را انتخاب کن.',`<select id="setting-week-start"><option value="6" ${Number(state.settings.weekStart)===6?'selected':''}>شنبه</option><option value="0" ${Number(state.settings.weekStart)===0?'selected':''}>یکشنبه</option><option value="1" ${Number(state.settings.weekStart)===1?'selected':''}>دوشنبه</option></select>`)+
      settingRow('منطقه‌ی زمانی دستگاه',`منطقه‌ی زمانی مرورگر: ${escapeHTML(Intl.DateTimeFormat().resolvedOptions().timeZone||'نامشخص')}`,`<span>${escapeHTML(state.settings.timeZone||'محلی')}</span>`)+
      settingRow('آخر هفته','برای گزارش و برنامه‌ریزی.',`<select id="setting-weekend"><option value="fri" ${state.settings.weekend==='fri'?'selected':''}>جمعه</option><option value="sat-sun" ${state.settings.weekend==='sat-sun'?'selected':''}>شنبه و یکشنبه</option></select>`)+
      `<div class="settings-notice" style="margin-top:17px"><strong>نکته درباره‌ی تاریخ:</strong> زمان دقیق در این نسخه به صورت ISO/میلادی در دستگاه ذخیره می‌شود و در تقویم با انتخاب شمسی یا میلادی نمایش داده می‌شود. انتخاب تاریخ در فرم سیستم‌عامل ممکن است میلادی باشد.</div>`;
    }else if(settingsTab==='notifications'){
      const permission=('Notification' in window)?Notification.permission:'unsupported';
      html=`<h2 class="settings-section-title">اعلان‌ها و یادآورها</h2><p class="settings-section-description">برای دریافت اعلان، اجازه‌ی مرورگر را فعال کن.</p>`+
      settingRow('اعلان‌های مرورگر','وقتی RUHA باز است، اعلان‌های زمان‌دار بررسی می‌شوند.',`<button class="button button-dark" id="settings-enable-notifications">${permission==='granted'?'اعلان‌ها فعال‌اند':'فعال‌سازی اعلان'}</button>`)+
      settingRow('ساعت سکوت','در این بازه اعلان محلی نمایش داده نشود.',switchControl('setting-quiet-hours',state.settings.quietHours))+ 
      settingRow('شروع ساعت سکوت','زمان شروع.',`<input type="time" id="setting-quiet-start" value="${state.settings.quietStart||'22:00'}">`)+
      settingRow('پایان ساعت سکوت','زمان پایان.',`<input type="time" id="setting-quiet-end" value="${state.settings.quietEnd||'08:00'}">`)+
      `<div class="settings-notice" style="margin-top:17px"><strong>محدودیت مهم:</strong> اعلان محلی داخل مرورگر فقط تا وقتی برنامه/تب اجازه‌ی اجرا داشته باشد قابل اتکاست. نمایش اعلان در زمان مقرر وقتی برنامه کاملاً بسته است، به استقرار HTTPS، اشتراک Web Push و سرویس سمت سرور نیاز دارد. این پروژه Service Worker و نقطه‌ی شروع Push سمت بک‌اند را دارد؛ در راهنمای نصب توضیح داده شده است.</div>`;
    }else if(settingsTab==='data'){
      html=`<h2 class="settings-section-title">داده‌ها و حریم خصوصی</h2><p class="settings-section-description">اطلاعات RUHA در حالت پیش‌فرض روی همین مرورگر باقی می‌ماند.</p>`+
      settingRow('پشتیبان‌گیری کامل','خروجی JSON شامل کارها، دسته‌ها و پیوست‌ها.',`<button class="button button-quiet" id="export-json">${icon('download')} خروجی JSON</button>`)+
      settingRow('خروجی CSV','لیست کارها برای صفحه‌گسترده.',`<button class="button button-quiet" id="export-csv">${icon('download')} خروجی CSV</button>`)+
      settingRow('خروجی تقویم','ساخت فایل ICS برای واردکردن رویدادها در تقویم‌های دیگر.',`<button class="button button-quiet" id="export-ics">${icon('calendar')} فایل ICS</button>`)+
      settingRow('بازیابی نسخه‌ی پشتیبان','فایل JSON قبلی RUHA را وارد کن.',`<button class="button button-quiet" id="import-json-button">انتخاب فایل</button><input type="file" id="import-json-input" accept="application/json,.json" hidden>`)+
      settingRow('حذف همه‌ی داده‌ها','این کار برگشت‌پذیر نیست؛ قبل از آن خروجی بگیر.',`<button class="button data-danger" id="clear-all-data">پاک‌کردن داده‌ها</button>`)+
      `<div class="settings-notice" style="margin-top:17px">RUHA به حساب کاربری یا سرویس تحلیلی خارجی وصل نیست. اگر حافظه‌ی مرورگر پاک شود یا از دستگاه دیگری استفاده کنی، داده‌ها خودکار منتقل نمی‌شوند؛ مرتب پشتیبان بگیر.</div>`;
    }else{
      html=`<div class="about-brand"><span class="brand-mark">${icon('check-square')}</span><div><h3>RUHA</h3><p>فضایی خلوت برای فکرهای مهم.</p></div></div><h2 class="settings-section-title">برنامه‌ریز شخصی، با اولویت حریم خصوصی</h2><p class="settings-section-description">نسخه‌ی آغازین RUHA به صورت PWA ساخته شده و برای صفحه‌ی کوچک و بزرگ طراحی واکنش‌گرا دارد.</p><div class="settings-notice"><strong>امکانات فعلی</strong><br>• کار، یادآور و یادداشت<br>• تقویم با نمایش شمسی و میلادی<br>• تایم‌لاین و زمان‌سنج تمرکز<br>• عکس و ضبط ویس در مرورگرهای سازگار<br>• اعلان مرورگر، خروجی JSON / CSV / ICS<br>• تم روشن و تیره، ذخیره‌ی محلی و دسترسی آفلاین</div><div class="settings-buttons"><button class="button button-quiet" id="export-json-about">پشتیبان‌گیری از داده‌ها</button><button class="button button-quiet" id="about-notifications">تنظیم اعلان‌ها</button></div>`;
    }
    content.innerHTML=html;renderIcons(content);
    $('#setting-theme')?.addEventListener('change',e=>{state.settings.theme=e.target.value;applyTheme();saveState();});
    $('#setting-calendar')?.addEventListener('change',e=>{state.settings.calendar=e.target.value;renderAll();saveState();});
    $('#setting-secondary-date')?.addEventListener('change',e=>{state.settings.showSecondaryDate=e.target.checked;renderCalendar();saveState();});
    $('#setting-numbers')?.addEventListener('change',e=>{state.settings.numbers=e.target.value;renderAll();saveState();});
    $('#setting-week-start')?.addEventListener('change',e=>{state.settings.weekStart=Number(e.target.value);renderCalendar();saveState();});
    $('#setting-weekend')?.addEventListener('change',e=>{state.settings.weekend=e.target.value;saveState();});
    $('#setting-quiet-hours')?.addEventListener('change',e=>{state.settings.quietHours=e.target.checked;saveState();});
    $('#setting-quiet-start')?.addEventListener('change',e=>{state.settings.quietStart=e.target.value;saveState();});
    $('#setting-quiet-end')?.addEventListener('change',e=>{state.settings.quietEnd=e.target.value;saveState();});
    $('#settings-enable-notifications')?.addEventListener('click',enableNotifications);
    $('#install-app')?.addEventListener('click',installApp);
    $('#export-json')?.addEventListener('click',exportJSON);$('#export-json-about')?.addEventListener('click',exportJSON);$('#export-csv')?.addEventListener('click',exportCSV);$('#export-ics')?.addEventListener('click',exportICS);
    $('#import-json-button')?.addEventListener('click',()=>$('#import-json-input').click());$('#import-json-input')?.addEventListener('change',importJSON);
    $('#clear-all-data')?.addEventListener('click',clearAllData);$('#about-notifications')?.addEventListener('click',()=>{settingsTab='notifications';renderSettings();});
  }
  function renderAll(){renderCategories();renderToday();if(currentView==='calendar')renderCalendar();if(currentView==='tasks')renderTasks();if(currentView==='insights')renderInsights();if(currentView==='settings')renderSettings();updateNotificationBadge();}

  function openItemDialog(type='task', item=null, date=null){
    currentEditItem=item;selectedItemType=item?.type||type;draftAttachments=item?structuredCloneSafe(item.attachments||[]):[];
    $('#item-form').reset();$('#item-id').value=item?.id||'';$('#item-title').value=item?.title||'';$('#item-description').value=item?.description||'';
    $('#item-due').value=item?.dueAt?toLocalInput(new Date(item.dueAt)):'';
    if(!item&&date){const d=new Date(date);d.setHours(9,0,0,0);$('#item-due').value=toLocalInput(d);}
    $('#item-duration').value=item?.duration??'';$('#item-priority').value=item?.priority||'medium';$('#item-remind').value=String(item?.remindMinutes??10);$('#item-repeat').value=item?.repeat||'none';
    $('#dialog-title').textContent=item?'ویرایش آیتم':'آیتم جدید';$('#dialog-eyebrow').textContent=item?'یک تغییر کوچک':'ثبت یک قدم تازه';$('#item-save-button').innerHTML=`${icon('check')} ${item?'ذخیره‌ی تغییرات':'ذخیره‌ی آیتم'}`;
    $$('#item-type-selector button').forEach(b=>b.classList.toggle('selected',b.dataset.type===selectedItemType));
    updateItemTypeFields();renderAttachmentDrafts();updateDatePreview();$('#recording-status').classList.add('hidden');
    $('#item-dialog').showModal();setTimeout(()=>$('#item-title').focus(),100);
  }
  function updateItemTypeFields(){
    $('#reminder-fields').style.display=selectedItemType==='note'?'none':'grid';
    $('#item-duration').disabled=selectedItemType==='note';
    $('#dialog-title').textContent=currentEditItem?'ویرایش آیتم':({task:'کار جدید',reminder:'یادآور جدید',note:'یادداشت جدید'})[selectedItemType];
  }
  function updateDatePreview(){const d=parseLocalDateTime($('#item-due').value);$('#date-preview').textContent=d?`${fmtFullDate(d,state.settings.calendar,{weekday:'long',year:'numeric',month:'long',day:'numeric'})} · ${fmtTime(d)}`:'';}
  function renderAttachmentDrafts(){
    $('#attachment-list').innerHTML=draftAttachments.map(a=>`<div class="attachment-chip">${a.kind==='image'&&a.dataUrl?`<img class="attachment-thumb" src="${a.dataUrl}" alt="">`:icon(a.kind==='audio'?'mic':'file')}<span>${escapeHTML(a.name||'پیوست')}</span><button type="button" data-remove-attachment="${a.id}" aria-label="حذف پیوست">${icon('x')}</button></div>`).join('');
  }
  function readFileAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});}
  async function compressImage(file){
    if(!file.type.startsWith('image/'))return await readFileAsDataURL(file);
    try{return await new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/jpeg',.82));};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image load failed'));};img.src=url;});}catch(_){return await readFileAsDataURL(file);}
  }
  async function addFiles(fileList){
    const files=[...fileList];for(const file of files){if(file.size>15*1024*1024){toast(`فایل ${file.name} بیشتر از ۱۵ مگابایت است.`,'error');continue;}try{const dataUrl=file.type.startsWith('image/')?await compressImage(file):await readFileAsDataURL(file);draftAttachments.push({id:uuid(),name:file.name,kind:file.type.startsWith('image/')?'image':file.type.startsWith('audio/')?'audio':'file',mime:file.type,size:file.size,dataUrl,createdAt:new Date().toISOString()});}catch(err){toast('خواندن یکی از پیوست‌ها انجام نشد.','error');}}
    renderAttachmentDrafts();saveState();
  }
  async function startRecording(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toast('ضبط صدا در این مرورگر پشتیبانی نمی‌شود یا به HTTPS نیاز دارد.','error');return;}
    try{recordingStream=await navigator.mediaDevices.getUserMedia({audio:true});recorder=new MediaRecorder(recordingStream);recordingChunks=[];recorder.ondataavailable=e=>{if(e.data.size)recordingChunks.push(e.data);};recorder.onstop=async()=>{const blob=new Blob(recordingChunks,{type:recorder.mimeType||'audio/webm'});if(blob.size){const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob);});const duration=Math.max(1,Math.round((Date.now()-recordingStarted)/1000));draftAttachments.push({id:uuid(),name:`ویس ${numberText(duration)} ثانیه`,kind:'audio',mime:blob.type,size:blob.size,duration,dataUrl,createdAt:new Date().toISOString()});renderAttachmentDrafts();toast('ویس به آیتم پیوست شد.');}recordingStream?.getTracks().forEach(t=>t.stop());recordingStream=null;recorder=null;clearInterval(recordingTimer);$('#recording-status').classList.add('hidden');$('#record-audio-label').textContent='ضبط ویس';$('#record-audio').disabled=false;};
      recordingStarted=Date.now();recorder.start();$('#recording-status').classList.remove('hidden');$('#record-audio-label').textContent='در حال ضبط';$('#record-audio').disabled=true;recordingTimer=setInterval(()=>{const elapsed=Date.now()-recordingStarted;$('#recording-timer').textContent=fmtClock(elapsed/1000);if(elapsed>=300000){stopRecording();toast('حداکثر مدت ضبط، ۵ دقیقه است.');}},250);
    }catch(err){console.error(err);toast('دسترسی به میکروفون داده نشد. مجوز مرورگر را بررسی کن.','error');}
  }
  function stopRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
  function fmtClock(sec){sec=Math.max(0,Math.floor(sec));return `${numberText(Math.floor(sec/60))}:${numberText(sec%60)}`;}
  function saveItemFromForm(e){
    e.preventDefault();const title=$('#item-title').value.trim();if(!title){$('#item-title').focus();return;}
    const oldId=$('#item-id').value;const due=parseLocalDateTime($('#item-due').value);const previous=state.items.find(i=>i.id===oldId);
    const item={...(previous||{}),id:oldId||uuid(),type:selectedItemType,title,description:$('#item-description').value.trim(),dueAt:due?due.toISOString():null,duration:$('#item-duration').value?Math.max(5,Math.min(1440,Number($('#item-duration').value))):null,categoryId:$('#item-category').value||state.categories[0]?.id||null,priority:$('#item-priority').value,status:previous?.status||'todo',remindMinutes:Number($('#item-remind').value||0),repeat:$('#item-repeat').value,attachments:structuredCloneSafe(draftAttachments),createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:previous?.completedAt||null,deletedAt:previous?.deletedAt||null,archived:previous?.archived||false,notifiedAt:previous?.notifiedAt||null};
    if(selectedItemType==='note'){item.dueAt=null;item.duration=null;item.remindMinutes=0;item.repeat='none';if(item.status==='done')item.status='todo';}
    if(oldId){state.items=state.items.map(i=>i.id===oldId?item:i);toast('تغییرات ذخیره شد.');}else{state.items.push(item);toast('آیتم با موفقیت ذخیره شد.');}
    $('#item-dialog').close();saveState();renderAll();
  }
  function completeItem(id){const item=state.items.find(i=>i.id===id);if(!item)return;const wasDone=item.status==='done';item.status=wasDone?'todo':'done';item.completedAt=wasDone?null:new Date().toISOString();item.updatedAt=new Date().toISOString();
    if(!wasDone&&item.repeat&&item.repeat!=='none'&&item.dueAt){const nextDue=nextRepeatDate(new Date(item.dueAt),item.repeat);if(nextDue){state.items.push({...structuredCloneSafe(item),id:uuid(),status:'todo',completedAt:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),dueAt:nextDue.toISOString(),notifiedAt:null,deletedAt:null,archived:false});toast('انجام شد؛ نوبت بعدی هم ساخته شد.');}else toast('کار انجام شد.');}else toast(wasDone?'وضعیت کار به باز تغییر کرد.':'آفرین، یک قدم جلو رفتی.');
    if(!wasDone&&state.timer.itemId===id)stopTimer();saveState();renderAll();
  }
  function nextRepeatDate(d,repeat){const next=new Date(d);if(repeat==='daily')next.setDate(next.getDate()+1);else if(repeat==='weekdays'){do{next.setDate(next.getDate()+1);}while(next.getDay()===5);}else if(repeat==='weekly')next.setDate(next.getDate()+7);else if(repeat==='monthly'){const day=next.getDate();next.setMonth(next.getMonth()+1,1);const max=new Date(next.getFullYear(),next.getMonth()+1,0).getDate();next.setDate(Math.min(day,max));}else if(repeat==='yearly'){const month=next.getMonth(),day=next.getDate();next.setFullYear(next.getFullYear()+1);if(next.getMonth()!==month)next.setDate(0);if(next.getDate()<day)next.setDate(Math.min(day,new Date(next.getFullYear(),month+1,0).getDate()));}else return null;return next;}
  function showDetail(id){const item=state.items.find(i=>i.id===id);if(!item)return;const cat=getCategory(item.categoryId);const due=effectiveDue(item);const attachments=(item.attachments||[]).map(a=>a.kind==='image'?`<img src="${a.dataUrl}" alt="${escapeHTML(a.name)}" loading="lazy">`:a.kind==='audio'?`<div class="attachment-audio"><small>${escapeHTML(a.name)}</small><audio controls preload="none" src="${a.dataUrl}"></audio></div>`:`<span>${escapeHTML(a.name)}</span>`).join('');
    $('#detail-content').innerHTML=`<div class="detail-header"><div><div class="eyebrow">${({task:'کار',reminder:'یادآور',note:'یادداشت'})[item.type]||'آیتم'} · ${escapeHTML(cat.name)}</div><h2>${escapeHTML(item.title)}</h2><div class="task-meta"><span class="task-priority ${item.priority}">اولویت ${({low:'کم',medium:'متوسط',high:'زیاد'})[item.priority]}</span><span class="task-badge">${({todo:'باز',doing:'در حال انجام',done:'انجام‌شده',cancelled:'لغوشده'})[item.status]||item.status}</span></div></div><button class="icon-btn" id="detail-close" aria-label="بستن">${icon('x')}</button></div><div class="detail-description">${escapeHTML(item.description||'توضیحی ثبت نشده است.')}</div><div class="detail-meta-grid">${due?`<div class="detail-meta"><small>زمان برنامه‌ریزی‌شده</small><strong>${fmtFullDate(due,state.settings.calendar,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</strong><strong>${fmtTime(due)}</strong></div>`:''}${item.duration?`<div class="detail-meta"><small>مدت تخمینی</small><strong>${numberText(item.duration)} دقیقه</strong></div>`:''}${item.repeat&&item.repeat!=='none'?`<div class="detail-meta"><small>تکرار</small><strong>${({daily:'هر روز',weekdays:'روزهای کاری',weekly:'هر هفته',monthly:'هر ماه',yearly:'هر سال'})[item.repeat]||item.repeat}</strong></div>`:''}<div class="detail-meta"><small>ساخته‌شده</small><strong>${fmtFullDate(new Date(item.createdAt),state.settings.calendar,{day:'numeric',month:'short',year:'numeric'})}</strong></div></div>${attachments?`<div class="detail-attachments">${attachments}</div>`:''}<div class="detail-actions"><div class="detail-actions-left"><button class="button button-quiet" id="detail-share">${icon('share')} اشتراک</button><button class="button button-quiet" id="detail-snooze">${icon('clock')} تعویق ۱۰ دقیقه</button></div><div class="detail-actions-right"><button class="button button-quiet" id="detail-edit">ویرایش</button>${item.type!=='note'?`<button class="button button-dark" id="detail-complete">${icon('check')} ${item.status==='done'?'بازگرداندن':'انجام شد'}</button>`:''}</div></div>`;
    $('#detail-dialog').showModal();$('#detail-close').addEventListener('click',()=>$('#detail-dialog').close());$('#detail-edit').addEventListener('click',()=>{$('#detail-dialog').close();openItemDialog(item.type,item);});$('#detail-complete')?.addEventListener('click',()=>{$('#detail-dialog').close();completeItem(id);});$('#detail-snooze').addEventListener('click',()=>{$('#detail-dialog').close();snoozeItem(id,10);});$('#detail-share').addEventListener('click',()=>shareItem(item));
  }
  async function shareItem(item){const d=item.dueAt?new Date(item.dueAt):null;const text=`${item.title}${item.description?'\n'+item.description:''}${d?'\n'+fmtFullDate(d,state.settings.calendar)+'، '+fmtTime(d):''}\n— ${APP_NAME}`;try{if(navigator.share)await navigator.share({title:item.title,text});else{await navigator.clipboard.writeText(text);toast('متن آیتم کپی شد.');}}catch(err){if(err.name!=='AbortError')toast('اشتراک‌گذاری در این دستگاه در دسترس نیست.','error');}}
  function snoozeItem(id,minutes=10){const item=state.items.find(i=>i.id===id);if(!item)return;const base=effectiveDue(item);item.dueAt=new Date(Date.now()+minutes*60000).toISOString();item.remindMinutes=0;item.notifiedAt=null;item.updatedAt=new Date().toISOString();saveState();renderAll();toast(`یادآور ${numberText(minutes)} دقیقه به تعویق افتاد.`);}
  function deleteItem(id){const item=state.items.find(i=>i.id===id);if(!item)return;const previous={...item};item.deletedAt=new Date().toISOString();item.updatedAt=new Date().toISOString();state.trashView=false;saveState();renderAll();toastWithUndo('به سطل زباله منتقل شد.',()=>{const current=state.items.find(i=>i.id===id);if(current){current.deletedAt=null;current.updatedAt=new Date().toISOString();saveState();renderAll();toast('آیتم بازیابی شد.');}});}
  function toast(message,type='success'){const el=document.createElement('div');el.className='toast';el.innerHTML=`${icon(type==='error'?'info':'check-circle')}<span>${escapeHTML(message)}</span>`;$('#toast-region').appendChild(el);setTimeout(()=>el.remove(),3800);}
  function toastWithUndo(message,undo){const el=document.createElement('div');el.className='toast';el.innerHTML=`${icon('check-circle')}<span>${escapeHTML(message)}</span><button type="button">بازگردانی</button>`;el.querySelector('button').addEventListener('click',()=>{undo();el.remove();});$('#toast-region').appendChild(el);setTimeout(()=>el.remove(),5500);}

  function startTimer(){const id=$('#timer-task-select').value;if(!id){toast('اول یک کار انتخاب کن.','error');return;}const item=state.items.find(i=>i.id===id);if(!item)return;if(state.timer.startedAt)stopTimer();state.timer={itemId:id,startedAt:Date.now(),elapsedBefore:0};if(item.status==='todo')item.status='doing';saveState();updateTimerUI();timerTicker=setInterval(updateTimerUI,1000);renderAll();}
  function stopTimer(){if(!state.timer.startedAt)return;const start=Number(state.timer.startedAt),end=Date.now();if(end>start)state.timeEntries.push({id:uuid(),itemId:state.timer.itemId,startedAt:new Date(start).toISOString(),endedAt:new Date(end).toISOString(),source:'timer'});state.timer={itemId:'',startedAt:null,elapsedBefore:0};clearInterval(timerTicker);timerTicker=null;saveState();renderAll();toast('زمان تمرکز ثبت شد.');}
  function timerElapsedMs(){return state.timer.startedAt?Date.now()-Number(state.timer.startedAt):0;}
  function updateTimerUI(){const active=!!state.timer.startedAt;const secs=Math.floor(timerElapsedMs()/1000);$('#focus-time').textContent=fmtClock(secs);const item=state.items.find(i=>i.id===state.timer.itemId);$('#focus-current').textContent=active&&item?`در حال تمرکز روی: ${item.title}`:'یک کار انتخاب کن و زمان‌سنج رو شروع کن.';$('#timer-toggle').innerHTML=active?`${icon('pause')} توقف و ثبت`:`${icon('play')} شروع تمرکز`;$('#timer-task-select').disabled=active;const totalToday=state.timeEntries.filter(e=>sameDay(new Date(e.startedAt),new Date())).reduce((s,e)=>s+(new Date(e.endedAt)-new Date(e.startedAt))/60000,0)+(active?secs/60:0);$('#focus-today-total').textContent=`${numberText(Math.round(totalToday))} دقیقه`;const max=Math.max(25,Number(item?.duration)||25);$('#focus-progress-fill').style.width=`${Math.min(100,secs/60/max*100)}%`;}

  async function enableNotifications(){
    if(!('Notification' in window)){toast('این مرورگر از اعلان‌های سیستم پشتیبانی نمی‌کند.','error');return;}
    try{const perm=await Notification.requestPermission();if(perm==='granted'){state.settings.notifications=true;try{if('serviceWorker' in navigator)activeNotificationRegistration=await navigator.serviceWorker.register('./sw.js');}catch(err){console.warn('SW registration failed',err);}toast('اعلان‌های مرورگر فعال شد.');}else{state.settings.notifications=false;toast('اجازه‌ی اعلان داده نشد. از تنظیمات مرورگر فعالش کن.','error');}saveState();updateNotificationBadge();if(currentView==='settings')renderSettings();}catch(err){console.error(err);toast('فعال‌سازی اعلان با خطا روبه‌رو شد.','error');}
  }
  function updateNotificationBadge(){const active=state.items.some(i=>isItemVisible(i)&&i.dueAt&&i.status!=='done'&&i.type!=='note');$('#enable-notifications').classList.toggle('has-reminders',active);$('#notification-dot').style.display=active?'block':'none';}
  function withinQuietHours(d=new Date()){
    if(!state.settings.quietHours)return false;const mins=d.getHours()*60+d.getMinutes();const parse=s=>{const [h,m]=String(s||'00:00').split(':').map(Number);return h*60+m;};const start=parse(state.settings.quietStart),end=parse(state.settings.quietEnd);return start===end?true:start<end?(mins>=start&&mins<end):(mins>=start||mins<end);
  }
  async function scheduleReminderSweep(){
    if(!state.settings.notifications||!('Notification' in window)||Notification.permission!=='granted')return;
    const now=Date.now();let changed=false;
    for(const item of state.items){if(!isItemVisible(item)||item.status==='done'||item.type==='note'||!item.dueAt||item.notifiedAt)continue;const due=new Date(item.dueAt).getTime()-(Number(item.remindMinutes)||0)*60000;if(due<=now&&now-due<12*60*60*1000){if(withinQuietHours())continue;await showReminder(item);item.notifiedAt=new Date().toISOString();changed=true;}}
    if(changed){saveState();updateNotificationBadge();}
  }
  async function showReminder(item){
    const options={body:item.title+(item.description?'\n'+item.description:''),tag:`ruha-${item.id}`,renotify:false,icon:'./static/ruha/icons/icon-192.svg',badge:'./static/ruha/icons/icon-192.svg',data:{itemId:item.id},actions:[{action:'done',title:'انجام شد'},{action:'snooze',title:'۱۰ دقیقه بعد'}]};
    try{if(activeNotificationRegistration?.showNotification)await activeNotificationRegistration.showNotification('یادآور RUHA',options);else if('Notification'in window)new Notification('یادآور RUHA',options);}catch(err){console.warn('notification failed',err);}
  }
  function setupServiceWorker(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register('./sw.js').then(reg=>{activeNotificationRegistration=reg;}).catch(err=>console.warn('PWA service worker unavailable',err));navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='RUHA_COMPLETE'&&d.id)completeItem(d.id);if(d.type==='RUHA_SNOOZE'&&d.id)snoozeItem(d.id,10);if(d.type==='RUHA_OPEN'&&d.id){setView('today');setTimeout(()=>showDetail(d.id),100);}});}
  function updateNotificationDotFromData(){scheduleReminderSweep();}

  function exportDownload(filename,content,mime='application/octet-stream'){const blob=content instanceof Blob?content:new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function exportJSON(){const data={app:APP_NAME,version:1,exportedAt:new Date().toISOString(),...structuredCloneSafe(state)};exportDownload(`RUHA-backup-${todayIso()}.json`,JSON.stringify(data,null,2),'application/json;charset=utf-8');toast('نسخه‌ی پشتیبان آماده شد.');}
  function csvEscape(value){const s=String(value??'');return '"'+s.replace(/"/g,'""')+'"';}
  function exportCSV(){const rows=[['id','type','title','description','due_at','status','priority','category','duration_minutes','repeat','created_at','completed_at']];state.items.forEach(i=>rows.push([i.id,i.type,i.title,i.description,i.dueAt||'',i.status,i.priority,getCategory(i.categoryId).name,i.duration||'',i.repeat||'none',i.createdAt,i.completedAt||'']));const csv='\uFEFF'+rows.map(r=>r.map(csvEscape).join(',')).join('\r\n');exportDownload(`RUHA-tasks-${todayIso()}.csv`,csv,'text/csv;charset=utf-8');toast('فایل CSV آماده شد.');}
  function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
  function exportICS(){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RUHA//FA','CALSCALE:GREGORIAN','METHOD:PUBLISH'];state.items.filter(i=>isItemVisible(i)&&i.dueAt&&i.type!=='note').forEach(i=>{const d=new Date(i.dueAt);const dt=utc=>utc.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const end=new Date(d.getTime()+(Number(i.duration)||30)*60000);lines.push('BEGIN:VEVENT',`UID:${i.id}@ruha.local`,`DTSTAMP:${dt(new Date())}`,`DTSTART:${dt(d)}`,`DTEND:${dt(end)}`,`SUMMARY:${icsEscape(i.title)}`,`DESCRIPTION:${icsEscape(i.description||'')}`,`STATUS:${i.status==='done'?'COMPLETED':'CONFIRMED'}`,'END:VEVENT');});lines.push('END:VCALENDAR');exportDownload(`RUHA-calendar-${todayIso()}.ics`,lines.join('\r\n'),'text/calendar;charset=utf-8');toast('فایل تقویم آماده شد.');}
  async function importJSON(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const obj=JSON.parse(await file.text());const incoming=obj.items;if(!Array.isArray(incoming)||!Array.isArray(obj.categories))throw new Error('invalid file');if(!confirm('داده‌های فایل به داده‌های موجود اضافه شوند؟ شناسه‌های تکراری نادیده گرفته می‌شوند.'))return;const ids=new Set(state.items.map(i=>i.id));incoming.forEach(i=>{if(!ids.has(i.id))state.items.push(i);});const cids=new Set(state.categories.map(c=>c.id));obj.categories.forEach(c=>{if(!cids.has(c.id))state.categories.push(c);});if(Array.isArray(obj.timeEntries))state.timeEntries.push(...obj.timeEntries);saveState();renderAll();toast('بازیابی پشتیبان کامل شد.');}catch(err){console.error(err);toast('این فایل، پشتیبان معتبر RUHA نیست.','error');}}
  function clearAllData(){if(!confirm('همه‌ی کارها، پیوست‌ها و تنظیمات محلی حذف شوند؟ این عملیات قابل بازگردانی نیست.'))return;state=defaultState();saveState();renderAll();renderSettings();toast('داده‌های محلی پاک شد.');}

  // Page interactions
  function attachEvents(){
    document.addEventListener('click',e=>{
      const viewBtn=e.target.closest('[data-view]');if(viewBtn){e.preventDefault();setView(viewBtn.dataset.view);return;}
      const categoryBtn=e.target.closest('[data-category-filter]');if(categoryBtn){categoryFilter=categoryBtn.dataset.categoryFilter;setView('tasks');renderCategories();renderTasks();return;}
      const actionBtn=e.target.closest('[data-action]');if(actionBtn){const id=actionBtn.dataset.id;const action=actionBtn.dataset.action;if(action==='complete')completeItem(id);else if(action==='edit'){const i=state.items.find(x=>x.id===id);if(i)openItemDialog(i.type,i);}else if(action==='detail')showDetail(id);else if(action==='more')showMoreMenu(id,actionBtn);return;}
      const day=e.target.closest('[data-calendar-date]');if(day){selectedCalendarDate=dayStart(new Date(day.dataset.calendarDate+'T12:00:00'));calendarCursor=selectedCalendarDate;renderCalendar();return;}
      const attachRemove=e.target.closest('[data-remove-attachment]');if(attachRemove){draftAttachments=draftAttachments.filter(a=>a.id!==attachRemove.dataset.removeAttachment);renderAttachmentDrafts();return;}
      const color=e.target.closest('[data-color]');if(color){selectedCategoryColor=color.dataset.color;$$('.color-choice').forEach(b=>b.classList.toggle('selected',b===color));return;}
      const settings=e.target.closest('[data-settings]');if(settings){settingsTab=settings.dataset.settings;$$('[data-settings]').forEach(b=>b.classList.toggle('selected',b===settings));renderSettings();return;}
      const close=e.target.closest('[data-close-dialog]');if(close){$('#'+close.dataset.closeDialog)?.close();return;}
    });
    $('#mobile-menu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
    document.addEventListener('click',e=>{if($('#sidebar').classList.contains('open')&&!e.target.closest('#sidebar')&&!e.target.closest('#mobile-menu'))$('#sidebar').classList.remove('open');});
    $('#theme-toggle').addEventListener('click',()=>{state.settings.theme=(document.documentElement.dataset.theme==='dark')?'light':'dark';applyTheme();saveState();});
    $('#quick-profile').addEventListener('click',()=>setView('settings'));
    $('#enable-notifications').addEventListener('click',enableNotifications);
    ['#fab-add','#add-task-top','#add-task-inline','#empty-add-task','#add-task-list'].forEach(s=>$(s)?.addEventListener('click',()=>openItemDialog('task')));
    $('#add-calendar-task').addEventListener('click',()=>openItemDialog('task',null,selectedCalendarDate));
    $('#dialog-close').addEventListener('click',()=>$('#item-dialog').close());$('#dialog-cancel').addEventListener('click',()=>$('#item-dialog').close());$('#item-form').addEventListener('submit',saveItemFromForm);
    $$('#item-type-selector button').forEach(b=>b.addEventListener('click',()=>{$$('#item-type-selector button').forEach(x=>x.classList.toggle('selected',x===b));selectedItemType=b.dataset.type;updateItemTypeFields();}));
    $('#item-due').addEventListener('change',updateDatePreview);$('#item-due').addEventListener('input',updateDatePreview);
    $('#attach-image').addEventListener('click',()=>$('#item-image-input').click());$('#item-image-input').addEventListener('change',async e=>{await addFiles(e.target.files);e.target.value='';});
    $('#record-audio').addEventListener('click',startRecording);$('#stop-recording').addEventListener('click',stopRecording);
    $('#add-category').addEventListener('click',()=>{$('#category-name').value='';selectedCategoryColor=categoryColors[0];$$('.color-choice').forEach((b,i)=>b.classList.toggle('selected',i===0));$('#category-dialog').showModal();setTimeout(()=>$('#category-name').focus(),100);});
    $('#category-form').addEventListener('submit',e=>{e.preventDefault();const name=$('#category-name').value.trim();if(!name)return;if(state.categories.some(c=>normalizeFa(c.name)===normalizeFa(name))){toast('این دسته قبلاً ساخته شده است.','error');return;}state.categories.push({id:uuid(),name,color:selectedCategoryColor});$('#category-dialog').close();saveState();renderAll();renderCategories();toast('دسته‌ی جدید ساخته شد.');});
    $('#today-filter').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;todayFilter=b.dataset.filter;$$('#today-filter button').forEach(x=>x.classList.toggle('selected',x===b));renderToday();});
    $('#today-sort').addEventListener('click',()=>{timelineSortAsc=!timelineSortAsc;renderToday();toast(timelineSortAsc?'مرتب‌سازی از زودترین زمان':'مرتب‌سازی معکوس');});$('#timeline-refresh').addEventListener('click',renderTimeline);
    $('#view-all-tasks').addEventListener('click',()=>setView('tasks'));
    $('#task-status-filter').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(!b)return;taskStatus=b.dataset.status;$$('#task-status-filter button').forEach(x=>x.classList.toggle('selected',x===b));renderTasks();});
    $('#list-category-filter').addEventListener('change',e=>{listCategory=e.target.value;renderTasks();});$('#list-date-filter').addEventListener('change',e=>{listDate=e.target.value;renderTasks();});$('#list-priority-filter').addEventListener('change',e=>{listPriority=e.target.value;renderTasks();});
    $('#toggle-archived').addEventListener('click',()=>{state.archivedView=!state.archivedView;if(state.archivedView)state.trashView=false;renderTasks();});$('#toggle-trash').addEventListener('click',()=>{state.trashView=!state.trashView;if(state.trashView)state.archivedView=false;renderTasks();});
    $('#global-search').addEventListener('input',e=>{queryText=e.target.value;if(queryText.trim()&&currentView!=='tasks')setView('tasks');else if(currentView==='tasks')renderTasks();});$('#global-search').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';queryText='';renderTasks();e.target.blur();}});
    $('#calendar-prev').addEventListener('click',()=>{calendarCursor=addDays(calendarMonthStart(calendarCursor,state.settings.calendar),-1);calendarCursor=calendarMonthStart(calendarCursor,state.settings.calendar);if(calendarMode==='week')selectedCalendarDate=addDays(selectedCalendarDate,-7);renderCalendar();});
    $('#calendar-next').addEventListener('click',()=>{calendarCursor=addDays(calendarMonthStart(calendarCursor,state.settings.calendar),35);calendarCursor=calendarMonthStart(calendarCursor,state.settings.calendar);if(calendarMode==='week')selectedCalendarDate=addDays(selectedCalendarDate,7);renderCalendar();});
    $('#calendar-today').addEventListener('click',()=>{calendarCursor=dayStart(new Date());selectedCalendarDate=dayStart(new Date());renderCalendar();});
    $('#calendar-mode').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;calendarMode=b.dataset.mode;$$('#calendar-mode button').forEach(x=>x.classList.toggle('selected',x===b));renderCalendar();});
    $('#calendar-pref').addEventListener('click',e=>{const b=e.target.closest('[data-cal]');if(!b)return;state.settings.calendar=b.dataset.cal;$$('#calendar-pref button').forEach(x=>x.classList.toggle('selected',x===b));calendarCursor=dayStart(new Date());renderAll();renderCalendar();saveState();});
    $('#insight-period').addEventListener('change',renderInsights);$('#timer-toggle').addEventListener('click',()=>state.timer.startedAt?stopTimer():startTimer());
    // Untimed tasks can be dragged from the list onto the timeline to give them a slot.
    document.addEventListener('dragstart',e=>{if(e.target.closest?.('[data-timeline-id]'))return;const main=e.target.closest?.('.task-main[draggable="true"]');if(!main)return;e.dataTransfer.setData('text/plain',main.dataset.id);e.dataTransfer.effectAllowed='move';});
    // Drag and drop of time blocks.
    $('#timeline-events').addEventListener('dragstart',e=>{const el=e.target.closest('[data-timeline-id]');if(!el)return;e.dataTransfer.setData('text/plain',el.dataset.timelineId);e.dataTransfer.effectAllowed='move';el.classList.add('dragging');});
    $('#timeline-events').addEventListener('dragend',e=>e.target.closest('[data-timeline-id]')?.classList.remove('dragging'));
    $('#timeline-track').addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';});
    $('#timeline-track').addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');const item=state.items.find(i=>i.id===id);if(!item)return;const rect=$('#timeline-track').getBoundingClientRect();const y=Math.max(0,Math.min(rect.height,e.clientY-rect.top));const start=7*60,end=22*60;const mins=Math.round((start+(y/rect.height)*(end-start))/5)*5;const d=dayStart(new Date());d.setMinutes(mins);item.dueAt=d.toISOString();item.updatedAt=new Date().toISOString();saveState();renderAll();toast('زمان کار جابه‌جا شد.');});
    document.addEventListener('keydown',e=>{const taskMain=e.target.closest?.('.task-main[data-action="detail"]');if(taskMain&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showDetail(taskMain.dataset.id);return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search').focus();return;}if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#global-search').focus();return;}if(e.key.toLowerCase()==='n'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#item-dialog').open){openItemDialog('task');}});
    window.addEventListener('online',()=>{$('#sync-label').textContent='آنلاین · داده‌ها محلی‌اند';toast('اتصال اینترنت برقرار شد.');});window.addEventListener('offline',()=>{$('#sync-label').textContent='آفلاین · داده‌ها در دسترس‌اند';toast('آفلاین هستی؛ RUHA همچنان کار می‌کند.');});
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(state.settings.theme==='system')applyTheme();});
    window.addEventListener('beforeunload',()=>{if(recorder&&recorder.state!=='inactive')recorder.stop();});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;showInstallToast();});
    window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;toast('RUHA روی دستگاه نصب شد.');});
  }
  function showMoreMenu(id, anchor){const item=state.items.find(i=>i.id===id);if(!item)return;const options=item.deletedAt?[['restore','بازیابی'],['deletePermanent','حذف دائمی']]:[['edit','ویرایش'],[item.archived?'unarchive':'archive',item.archived?'خروج از آرشیو':'انتقال به آرشیو'],['share','اشتراک'],['delete','انتقال به سطل زباله']];const msg=options.map((o,i)=>`${i+1}. ${o[1]}`).join('\n');const picked=prompt(`برای «${item.title}» شماره‌ی عملیات را وارد کن:\n${msg}`);const n=Number(picked);if(!n||!options[n-1])return;const op=options[n-1][0];if(op==='edit')openItemDialog(item.type,item);if(op==='delete')deleteItem(id);if(op==='archive'){item.archived=true;saveState();renderAll();toast('به آرشیو منتقل شد.');}if(op==='unarchive'){item.archived=false;saveState();renderAll();toast('از آرشیو خارج شد.');}if(op==='share')shareItem(item);if(op==='restore'){item.deletedAt=null;saveState();renderAll();toast('آیتم بازیابی شد.');}if(op==='deletePermanent'){if(confirm('این آیتم و پیوست‌هایش برای همیشه حذف شوند؟')){state.items=state.items.filter(i=>i.id!==id);saveState();renderAll();toast('آیتم حذف شد.');}}}

  async function installApp(){
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      try{const choice=await deferredInstallPrompt.userChoice;if(choice?.outcome==='accepted')toast('درخواست نصب پذیرفته شد.');else toast('می‌توانی هر زمان از منوی مرورگر نصب کنی.');}catch(_){/* browser may dismiss the prompt */}
      deferredInstallPrompt=null;
      return;
    }
    toast('از منوی مرورگر گزینه‌ی «Install app» یا «Add to Home Screen» را انتخاب کن.');
  }
  function showInstallToast(){
    const el=document.createElement('div');el.className='toast';el.innerHTML=`${icon('download')}<span>RUHA را روی دستگاه نصب کن تا سریع‌تر باز شود.</span><button type="button">نصب</button>`;
    el.querySelector('button').addEventListener('click',()=>{el.remove();installApp();});$('#toast-region').appendChild(el);setTimeout(()=>el.remove(),7000);
  }

  // service worker and reminder loop
  function startReminderLoop(){scheduleReminderSweep();reminderTicker=setInterval(()=>{scheduleReminderSweep();renderTimeline();},20000);}
  async function init(){renderIcons();attachEvents();try{await loadState();}catch(err){console.error(err);toast('بازیابی داده‌ها کامل نشد؛ حافظه‌ی مرورگر را بررسی کن.','error');}setupServiceWorker();startReminderLoop();
    $('#calendar-pref').querySelectorAll('[data-cal]').forEach(b=>b.classList.toggle('selected',b.dataset.cal===state.settings.calendar));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){scheduleReminderSweep();renderToday();}});
  }
  init();
})();
