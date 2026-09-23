const API_BASE='https://beauty-studio-api.haochen05024.workers.dev';
const LOCAL_KEY='beautyStudioAdminV3Local';
let adminToken='';

const seed={
  content:{studioName:'Beauty Studio',studioNameZh:'',studioNameMy:'',tagline:'NAILS & BEAUTY',taglineZh:'',taglineMy:'',city:'Your City',cityZh:'',cityMy:'',address:'Studio address coming soon',addressZh:'',addressMy:'',phone:'+00 000 000 000',hours:'By appointment',hoursZh:'',hoursMy:'',tiktok:'',whatsapp:'',telegram:'',bookingMessage:'Appointments are confirmed after your request is reviewed.',bookingMessageZh:'',bookingMessageMy:''},
  services:[
    {id:'gel',name:'Gel Manicure',price:'From 00 MMK',duration:60,description:'Clean, glossy and effortless.'},
    {id:'art',name:'Custom Nail Art',price:'From 00 MMK',duration:90,description:'Personal details made for you.'},
    {id:'extensions',name:'Extensions',price:'From 00 MMK',duration:120,description:'Length with a polished finish.'}
  ],
  gallery:[
    {id:1,title:'Soft Pearl',category:'Elegant',description:'Soft, clean pearl glow.',image:''},
    {id:2,title:'Milky Nude',category:'Simple',description:'Quiet and wearable.',image:''},
    {id:3,title:'Rose Chrome',category:'Trendy',description:'A polished rose-metal finish.',image:''},
    {id:4,title:'Little Hearts',category:'Cute',description:'Tiny details with a playful mood.',image:''},
    {id:5,title:'Quiet Luxury',category:'Elegant',description:'Minimal, refined and timeless.',image:''}
  ],
  booking:{openingTime:'10:00',closingTime:'18:00',slotMinutes:30,advanceDays:30,minLeadMinutes:60,status:'open'},
  media:{}
};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let data=loadLocal();
let apiState='connecting';

function clone(v){return JSON.parse(JSON.stringify(v))}
function loadLocal(){
  try{
    const saved=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null');
    if(saved)return {...clone(seed),...saved,content:{...seed.content,...saved.content},booking:{...seed.booking,...saved.booking},media:saved.media||{}};
  }catch(e){}
  return clone(seed);
}
function cacheLocal(){
  try{
    // Keep the existing local media and a local fallback copy, but D1 remains the source of truth.
    localStorage.setItem(LOCAL_KEY,JSON.stringify(data));
  }catch(e){toast('Local cache is full · media stays local only')}
}
function token(){return adminToken}
function setToken(v){adminToken=v||''}
function clearToken(){adminToken=''}

function setAdminLocked(locked){
  document.documentElement.classList.toggle('admin-locked',locked);
  const shell=$('.app-shell');
  if(shell){
    shell.setAttribute('aria-hidden',locked?'true':'false');
    shell.style.visibility=locked?'hidden':'visible';
  }
}
function installAdminLockStyle(){
  if($('#adminLockStyle'))return;
  const s=document.createElement('style');
  s.id='adminLockStyle';
  s.textContent='.admin-locked .app-shell{visibility:hidden;pointer-events:none}.admin-locked body{background:#2b2421}';
  document.head.appendChild(s);
}
installAdminLockStyle();
setAdminLocked(true);

function toast(t){
  const x=$('#toast'); x.textContent=t; x.classList.add('show');
  clearTimeout(window._t); window._t=setTimeout(()=>x.classList.remove('show'),2600);
}

function setApiStatus(ok,text){
  apiState=ok?'connected':'offline';
  const foot=$('.sidebar-foot');
  if(foot){
    foot.innerHTML=`<span class="status-dot" style="background:${ok?'#9db48d':'#c9897f'}"></span>${text}<button id="apiSessionBtn" style="display:block;margin-top:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#c9bdb6;border-radius:10px;padding:8px 10px;font-size:11px;width:100%;cursor:pointer">${token()?'Sign out':'Connect Admin'}</button>`;
    $('#apiSessionBtn').onclick=()=>token()?logoutAdmin():openLogin();
  }
}

function installLoginUI(){
  if($('#apiLoginModal'))return;
  const wrap=document.createElement('div');
  wrap.id='apiLoginModal';
  wrap.innerHTML=`
  <div style="position:fixed;inset:0;background:rgba(38,29,25,.52);backdrop-filter:blur(7px);z-index:9999;display:grid;place-items:center;padding:20px">
    <div style="width:min(440px,100%);background:#fffaf6;border:1px solid #dfd1c8;border-radius:24px;padding:28px;box-shadow:0 24px 80px rgba(40,25,20,.22)">
      <p style="font-size:10px;letter-spacing:.22em;color:#9b6c69;font-weight:700;margin:0 0 8px">ADMIN CONNECTION</p>
      <h2 style="font:500 30px Georgia,serif;margin:0 0 8px;color:#302621">Connect your studio</h2>
      <p style="color:#81746d;font-size:13px;line-height:1.65;margin:0 0 18px">Enter the Cloudflare Worker ADMIN_TOKEN. It is kept only for this browser session and is never written into the site files.</p>
      <input id="apiTokenInput" type="password" autocomplete="off" placeholder="ADMIN_TOKEN" style="width:100%;border:1px solid #dfd1c8;background:#fff;border-radius:13px;padding:13px 14px;outline:0">
      <div id="apiLoginError" style="display:none;color:#a34f4f;font-size:12px;margin-top:9px"></div>
      <div style="display:flex;gap:9px;margin-top:14px">
        <button id="apiLoginBtn" style="flex:1;border:0;border-radius:999px;padding:12px 16px;background:#9b6c69;color:white;font-weight:600;cursor:pointer">Connect</button>
        <button id="apiLoginCancel" style="border:1px solid #dfd1c8;border-radius:999px;padding:12px 16px;background:#f0e6df;color:#302621;cursor:pointer">Cancel</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(wrap);
  $('#apiLoginBtn').onclick=async()=>{
    const v=$('#apiTokenInput').value.trim();
    if(!v){$('#apiLoginError').textContent='Please enter the ADMIN_TOKEN.';$('#apiLoginError').style.display='block';return}
    setToken(v);
    $('#apiLoginError').style.display='none';
    const ok=await testAdminToken();
    if(ok){wrap.remove();setAdminLocked(false);setApiStatus(true,'D1 connected · Admin session');showView('overview');await loadRemote();showView('overview');await loadDashboard();toast('Admin connected');}
    else{clearToken();$('#apiLoginError').textContent='Token rejected. Please check the Cloudflare Secret and try again.';$('#apiLoginError').style.display='block';}
  };
  $('#apiLoginCancel').onclick=()=>wrap.remove();
  $('#apiTokenInput').onkeydown=e=>{if(e.key==='Enter')$('#apiLoginBtn').click()};
}
function openLogin(){setAdminLocked(true);installLoginUI();const i=$('#apiTokenInput');if(i){i.value='';i.focus()}}
function logoutAdmin(){clearToken();setAdminLocked(true);setApiStatus(false,'D1 connected · Reconnect required');toast('Admin session ended');openLogin()}
async function testAdminToken(){
  try{
    // The settings PUT is the first authenticated operation. We use the current
    // studio content as the initial D1 record, so no dummy/test value is written.
    const r=await apiFetch('/api/content/settings',{method:'PUT',body:JSON.stringify(data.content)});
    return r.ok;
  }catch(e){return false}
}

async function apiFetch(path,options={}){
  const headers={'Accept':'application/json',...(options.headers||{})};
  const t=token();
  if(t)headers['x-admin-token']=t;
  if(options.body!==undefined)headers['Content-Type']='application/json';
  const res=await fetch(API_BASE+path,{...options,headers});
  const text=await res.text();
  let body;try{body=JSON.parse(text)}catch{body={raw:text}};
  if(res.status===401){clearToken();setAdminLocked(true);setApiStatus(false,'D1 connected · Reconnect required');setTimeout(openLogin,0)}
  return {ok:res.ok,status:res.status,body};
}

async function apiGet(path){
  return apiFetch(path,{method:'GET'});
}
async function apiPut(path,payload){
  if(!token()){openLogin();return {ok:false,needsAuth:true}}
  return apiFetch(path,{method:'PUT',body:JSON.stringify(payload)});
}

async function saveRemote(kind, overridePayload){
  const map={
    content:['/api/content/settings',overridePayload ?? data.content],
    services:['/api/content/services',data.services],
    gallery:['/api/content/gallery',data.gallery.map(({image,...g})=>g)],
    booking:['/api/content/booking-rules',data.booking]
  };
  const [path,payload]=map[kind];
  if(!token()){openLogin();return false}
  try{
    const r=await apiPut(path,payload);
    if(r.ok){cacheLocal();setApiStatus(true,'D1 connected · Admin session');toast('Saved to D1');return true}
    if(r.status===401)toast('ADMIN_TOKEN rejected');
    else toast('D1 save failed · check Worker');
  }catch(e){toast('Network error · Worker unavailable')}
  return false;
}

async function loadRemote(){
  setApiStatus(false,'Connecting to D1…');
  try{
    const results=await Promise.allSettled([
      apiGet('/api/content/settings'),
      apiGet('/api/content/services'),
      apiGet('/api/content/gallery'),
      apiGet('/api/content/booking-rules')
    ]);
    const [cR,sR,gR,bR]=results;
    const c=cR.status==='fulfilled'?cR.value:null;
    const ss=sR.status==='fulfilled'?sR.value:null;
    const g=gR.status==='fulfilled'?gR.value:null;
    const b=bR.status==='fulfilled'?bR.value:null;
    if(c?.ok && c.body?.data) data.content={...data.content,...c.body.data};
    if(ss?.ok && Array.isArray(ss.body?.data)) data.services=ss.body.data;
    if(g?.ok && Array.isArray(g.body?.data)){
      const oldImages=new Map(data.gallery.map(x=>[String(x.id),x.image||'']));
      data.gallery=g.body.data.map(x=>({...x,image:oldImages.get(String(x.id))||''}));
    }
    if(b?.ok && b.body?.data) data.booking={...data.booking,...b.body.data};
    const okCount=[c,ss,g,b].filter(x=>x?.ok).length;
    if(okCount>0){
      cacheLocal();
      setApiStatus(true,token()?'D1 connected · Admin session':'D1 connected · Read-only');
      fillContent();fillBooking();renderServices();renderGallery();updateStats();loadDashboard();
      if(okCount<4)toast(`D1 connected · ${okCount}/4 content areas loaded`);
    }else{
      throw new Error('No D1 content endpoint responded successfully');
    }
    if(!token()) openLogin();
  }catch(e){
    setApiStatus(false,'D1 unavailable · Local fallback');
    toast('D1 could not be reached · using local fallback');
    renderServices();renderGallery();updateStats();
    if(!token()) openLogin();
  }
}

function showView(v){
  $$('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+v));
  $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  $('#pageTitle').textContent=v==='overview'?'Overview':v.replace('-', ' ').replace(/\b\w/g,m=>m.toUpperCase());
  $('#sidebar').classList.remove('open');
  if(v==='services')renderServices();
  if(v==='gallery')renderGallery();
  if(v==='media')renderMedia();
  if(v==='content')fillContent();
  if(v==='booking')fillBooking();
  if(v==='bookings')loadBookings();
  if(v==='support')loadSupportConversations();
  if(v==='overview')loadDashboard();
}
$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$$('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));
$('#menu').onclick=()=>$('#sidebar').classList.toggle('open');
document.addEventListener('click',e=>{if(!e.target.closest('#sidebar')&&!e.target.closest('#menu'))$('#sidebar').classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#sidebar').classList.remove('open')});
const CUSTOMER_SITE_URL='https://haochen05024.github.io/beauty-studio/';
$('#preview').onclick=()=>window.open(CUSTOMER_SITE_URL,'_blank','noopener,noreferrer');
$('#preview').setAttribute('aria-label','Open customer website in a new tab');

function fillContent(){
  const f=$('#contentForm');
  Object.entries(data.content).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v});
}
function readForm(f,obj){
  if(!f) return obj;
  const formData=new FormData(f);
  for(const [key,value] of formData.entries()){
    const field=f.elements[key];
    obj[key]=field?.type==='checkbox' ? field.checked : String(value);
  }
  // Checkboxes are omitted from FormData when unchecked.
  [...f.elements].forEach(field=>{
    if(field.name && field.type==='checkbox' && !formData.has(field.name)){
      obj[field.name]=false;
    }
  });
  return obj;
}
fillContent();
$('#contentForm').oninput=()=>readForm($('#contentForm'),data.content);
$$('.save').forEach(b=>b.onclick=async()=>{
  if(b.closest('#view-content')){
    readForm($('#contentForm'),data.content);
    const payload={...data.content};
    const saved=await saveRemote('content', payload);
    if(saved){
      const fresh=await apiGet('/api/content/settings?t='+Date.now());
      if(fresh.ok && fresh.body?.data){
        data.content={...data.content,...fresh.body.data};
        fillContent();
      } else {
        toast('Saved locally, but D1 could not be re-read');
      }
    }
  } else if(b.closest('#view-booking')){
    readForm($('#bookingForm'),data.booking);
    await saveRemote('booking');
  }
});

/* v78 — full customer-content editor
   Services and Our Work are now editable field-by-field, including EN / 中文 /
   မြန်မာ content used by the customer's live language switcher. */
function ensureRichEditorStyles(){
  if($('#richEditorStyles'))return;
  const st=document.createElement('style');st.id='richEditorStyles';st.textContent=`
  .rich-editor-backdrop{position:fixed;inset:0;z-index:10020;background:rgba(38,29,25,.55);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}
  .rich-editor{width:min(920px,100%);max-height:min(900px,94vh);overflow:auto;background:#fffaf6;border:1px solid #dfd1c8;border-radius:26px;box-shadow:0 30px 100px rgba(40,25,20,.28);padding:24px}
  .rich-editor-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.rich-editor-head h3{font:500 30px Georgia,serif;color:#302621;margin:4px 0 5px}.rich-editor-head p{margin:0;color:#81746d;font-size:12px;line-height:1.6}
  .rich-editor-close{border:1px solid #dfd1c8;background:#f2e7e0;color:#302621;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer}
  .rich-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.rich-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.rich-field{display:grid;gap:6px}.rich-field.wide{grid-column:1/-1}.rich-field label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9b6c69;font-weight:700}.rich-field input,.rich-field textarea,.rich-field select{width:100%;box-sizing:border-box;border:1px solid #dfd1c8;background:#fff;border-radius:12px;padding:11px 12px;outline:0;color:#302621;font:inherit;font-size:12px}.rich-field textarea{min-height:76px;resize:vertical;line-height:1.55}
  .rich-section{margin-top:18px;padding-top:18px;border-top:1px solid rgba(125,91,79,.12)}.rich-section h4{margin:0 0 10px;font:500 18px Georgia,serif;color:#302621}.rich-hint{margin:0 0 12px;color:#8b7b73;font-size:11px;line-height:1.55}
  .rich-list{display:grid;gap:9px}.rich-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.rich-row b{display:block;grid-column:1/-1;font-size:9px;color:#a08e85;letter-spacing:.08em}.rich-row input{min-width:0;border:1px solid #dfd1c8;background:#fff;border-radius:10px;padding:9px 10px;font-size:11px}
  .rich-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid rgba(125,91,79,.12)}.rich-actions button{border:0;border-radius:999px;padding:11px 18px;cursor:pointer;font-weight:700}.rich-actions .save{background:#302621;color:#fff}.rich-actions .cancel{background:#f0e6df;color:#302621}
  .rich-editor-note{padding:10px 12px;border-radius:12px;background:#f5e9e3;color:#7f6c63;font-size:10px;line-height:1.5;margin-top:12px}
  .translation-tools{display:grid;grid-template-columns:minmax(180px,220px) auto;gap:10px;align-items:end;padding:14px;border:1px solid #e1d2c9;background:#f7eee9;border-radius:16px;margin-bottom:18px}.translation-tool-main{display:grid;gap:6px}.translation-tool-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9b6c69;font-weight:700}.translation-tool-main select{width:100%;box-sizing:border-box;border:1px solid #dfd1c8;background:#fff;border-radius:12px;padding:11px 12px;outline:0;color:#302621;font:inherit;font-size:12px}.auto-translate{border:0;border-radius:999px;background:#302621;color:#fff;padding:11px 16px;cursor:pointer;font-weight:700;white-space:nowrap}.auto-translate:disabled{opacity:.55;cursor:wait}.translation-tool-note{grid-column:1/-1;margin:0;color:#806f67;font-size:10px;line-height:1.5}
  @media(max-width:760px){.rich-grid,.rich-grid.two,.rich-row{grid-template-columns:1fr}.rich-editor{padding:18px;border-radius:20px}.rich-field.wide{grid-column:auto}}
  `;document.head.appendChild(st);
}
function escAttr(v){return esc(v).replace(/`/g,'&#96;')}
function richInput(label,key,value='',type='input',cls=''){
  return `<div class="rich-field ${cls}"><label>${esc(label)}</label>${type==='textarea'?`<textarea data-rich-key="${escAttr(key)}">${esc(value)}</textarea>`:`<input data-rich-key="${escAttr(key)}" value="${escAttr(value)}">`}</div>`;
}
function langField(label,base,obj,cls=''){
  return `<div class="rich-section"><h4>${esc(label)}</h4><div class="rich-grid">
    ${richInput('English',base,obj?.[base]||'', 'textarea',cls)}
    ${richInput('中文',base+'Zh',obj?.[base+'Zh']||'', 'textarea',cls)}
    ${richInput('မြန်မာ',base+'My',obj?.[base+'My']||'', 'textarea',cls)}
  </div></div>`;
}
function readRichObject(d, obj){
  d.querySelectorAll('[data-rich-key]').forEach(el=>{
    const k=el.dataset.richKey; const v=el.value.trim();
    if(v)obj[k]=v; else delete obj[k];
  });
}
function showRichEditor(title, subtitle, html, onSave){
  ensureRichEditorStyles();
  return new Promise(resolve=>{
    const d=document.createElement('div');d.className='rich-editor-backdrop';
    d.innerHTML=`<div class="rich-editor"><div class="rich-editor-head"><div><p class="eyebrow">CONTENT EDITOR</p><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><button class="rich-editor-close" type="button">×</button></div><div class="rich-editor-body">${html}</div><div class="rich-actions"><button type="button" class="cancel">Cancel</button><button type="button" class="save">Save changes</button></div></div>`;
    document.body.appendChild(d);
    const close=()=>{d.remove();resolve(false)};
    d.querySelector('.rich-editor-close').onclick=close;
    d.querySelector('.cancel').onclick=close;
    d.querySelector('.save').onclick=async()=>{await onSave(d);d.remove();resolve(true)};
    const autoBtn=d.querySelector('[data-auto-translate]');
    if(autoBtn)autoBtn.onclick=()=>autoTranslateServiceEditor(d,autoBtn);
    const galleryAutoBtn=d.querySelector('[data-auto-translate-gallery]');
    if(galleryAutoBtn)galleryAutoBtn.onclick=()=>autoTranslateGalleryEditor(d,galleryAutoBtn);
    d.addEventListener('click',e=>{if(e.target===d)close()});
  });
}

const TRANSLATION_LANGS={en:{label:'English',code:'en'},zh:{label:'中文',code:'zh'},my:{label:'မြန်မာ',code:'my'}};
function translationProperty(base,lang){return lang==='en'?base:lang==='zh'?base+'Zh':base+'My'}
function getRichValue(d,key){const el=d.querySelector(`[data-rich-key="${CSS.escape(key)}"]`);return el?String(el.value||'').trim():''}
function setRichValue(d,key,value){const el=d.querySelector(`[data-rich-key="${CSS.escape(key)}"]`);if(el)el.value=String(value||'').trim()}
async function translateFreeText(text,from,to){
  const q=String(text||'').trim(); if(!q||from===to)return q;
  const url='https://api.mymemory.translated.net/get?'+new URLSearchParams({q,langpair:`${from}|${to}`}).toString();
  const res=await fetch(url,{headers:{Accept:'application/json'}});
  if(!res.ok)throw new Error(`Translation service ${res.status}`);
  const body=await res.json();
  const out=body?.responseData?.translatedText;
  if(!out)throw new Error('No translation returned');
  return String(out).replace(/\s+$/,'').trim();
}
async function autoTranslateServiceEditor(d,button){
  const source=d.querySelector('[data-source-language]')?.value||'en';
  const fields=['title','description','kicker','caption','idealFor','tags','points','highlights'];
  const original={};
  fields.forEach(base=>original[base]=getRichValue(d,translationProperty(base,source)));
  const filled=fields.filter(base=>original[base]);
  if(!filled.length){toast(`Enter the ${TRANSLATION_LANGS[source].label} original text first`);return}
  const targets=Object.keys(TRANSLATION_LANGS).filter(x=>x!==source);
  const old=button.textContent;button.disabled=true;button.textContent='Translating…';
  let done=0,failed=0;
  try{
    for(const target of targets){
      for(const base of filled){
        const sourceText=original[base];
        const targetKey=translationProperty(base,target);
        try{
          const translated=await translateFreeText(sourceText,source,target);
          setRichValue(d,targetKey,translated);done++;
          await new Promise(r=>setTimeout(r,120));
        }catch(err){failed++;}
      }
    }
    if(failed){toast(`Generated ${done} translations · ${failed} failed`)}else{toast(`Generated ${done} translations for ${targets.length} languages`)}
  }finally{button.disabled=false;button.textContent=old}
}
async function autoTranslateGalleryEditor(d,button){
  const source=d.querySelector('[data-source-language]')?.value||'en';
  const fields=['title','style','description','mood','note'];
  const original={};
  fields.forEach(base=>original[base]=getRichValue(d,translationProperty(base,source)));
  const filled=fields.filter(base=>original[base]);
  if(!filled.length){toast(`Enter the ${TRANSLATION_LANGS[source].label} original text first`);return}
  const targets=Object.keys(TRANSLATION_LANGS).filter(x=>x!==source);
  const old=button.textContent;button.disabled=true;button.textContent='Translating…';
  let done=0,failed=0;
  try{
    for(const target of targets){
      for(const base of filled){
        try{
          const translated=await translateFreeText(original[base],source,target);
          setRichValue(d,translationProperty(base,target),translated);done++;
          await new Promise(r=>setTimeout(r,120));
        }catch(err){failed++;}
      }
    }
    if(failed){toast(`Generated ${done} translations · ${failed} failed`)}else{toast(`Generated ${done} translations for ${targets.length} languages`)}
  }finally{button.disabled=false;button.textContent=old}
}
function csvLines(value){return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function listEditor(title, values){
  const arr=Array.isArray(values)?values:[];
  return `<div class="rich-section"><h4>${esc(title)}</h4><p class="rich-hint">One item per line. Keep the same number of lines across languages when possible.</p><div class="rich-grid"><div class="rich-field"><label>English</label><textarea data-list-key="en">${esc(arr.join('\n'))}</textarea></div><div class="rich-field"><label>中文</label><textarea data-list-key="zh">${esc(values.zh?.join('\n')||'')}</textarea></div><div class="rich-field"><label>မြန်မာ</label><textarea data-list-key="my">${esc(values.my?.join('\n')||'')}</textarea></div></div></div>`;
}
$('#addService').onclick=async()=>{
  data.services.push({id:'service-'+Date.now(),number:String(data.services.length+1).padStart(2,'0'),name:'New Service',title:'New Service',titleZh:'',titleMy:'',price:'From 00 MMK',duration:60,durationShort:'60 MIN',description:'Add a short description.',descriptionZh:'',descriptionMy:'',kicker:'Service',kickerZh:'',kickerMy:'',tags:'Service, Detail, Personalized',tagsZh:'',tagsMy:'',caption:'Made with care.',captionZh:'',captionMy:'',idealFor:'Personalized care',idealForZh:'',idealForMy:'',points:['Studio preparation and finish','Estimated time: 60 minutes'],pointsZh:[],pointsMy:[],highlights:[['Service','Tailored studio service'],['60 min','Estimated appointment time'],['Detail','Personalized finish']],highlightsZh:[],highlightsMy:[]});
  renderServices();updateStats();await saveRemote('services');
};

function renderServices(){
  const el=$('#serviceList');
  if(!el)return;
  if(!Array.isArray(data.services)||!data.services.length){
    el.innerHTML='<div class="notice">No services yet. Click “Add service” to create the first service.</div>';
    return;
  }
  el.innerHTML=data.services.map((sv,i)=>{
    const title=sv.title||sv.name||'Untitled service';
    const desc=sv.description||sv.descriptionZh||sv.descriptionMy||'';
    const duration=sv.durationShort||((sv.duration||0)+' MIN');
    const price=sv.price||'Price not set';
    return `<article class="service-row">
      <div><p class="eyebrow">${esc(sv.number||String(i+1).padStart(2,'0'))} · ${esc(sv.kicker||'SERVICE')}</p><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>
      <div class="service-meta"><strong>${esc(price)}</strong><br>${esc(duration)}</div>
      <div class="service-meta">${esc((sv.tags||'').split(',').slice(0,2).join(' · ')||'Studio service')}</div>
      <div class="card-actions"><button class="mini" data-edit-service="${i}">Edit</button><button class="mini" data-delete-service="${i}">Delete</button></div>
    </article>`;
  }).join('');
  $$('[data-edit-service]').forEach(b=>b.onclick=()=>editService(+b.dataset.editService));
  $$('[data-delete-service]').forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.deleteService;
    if(await confirmUI('Delete this service?','This removes the service from the customer website.')){
      data.services.splice(i,1);
      renderServices();updateStats();await saveRemote('services');
    }
  });
}

async function editService(i){
  const sv=data.services[i]; if(!sv)return;
  const points=Array.isArray(sv.points)?sv.points:[];
  const pointsZh=Array.isArray(sv.pointsZh)?sv.pointsZh:[];
  const pointsMy=Array.isArray(sv.pointsMy)?sv.pointsMy:[];
  const h=Array.isArray(sv.highlights)?sv.highlights:[];
  const hz=Array.isArray(sv.highlightsZh)?sv.highlightsZh:[];
  const hm=Array.isArray(sv.highlightsMy)?sv.highlightsMy:[];
  const html=`
    <div class="translation-tools">
      <div class="translation-tool-main">
        <div class="translation-tool-label">Original language</div>
        <select data-source-language>
          <option value="en" ${sv.title||sv.description?'selected':''}>English</option>
          <option value="zh" ${!sv.title&&!sv.description&&(sv.titleZh||sv.descriptionZh)?'selected':''}>中文</option>
          <option value="my" ${!sv.title&&!sv.description&&!sv.titleZh&&!sv.descriptionZh&&(sv.titleMy||sv.descriptionMy)?'selected':''}>မြန်မာ</option>
        </select>
      </div>
      <button type="button" class="auto-translate" data-auto-translate>✨ Auto translate other 2 languages</button>
      <p class="translation-tool-note">Choose one source language, then generate the other two from it. This will replace the other-language fields.</p>
    </div>
    <div class="rich-grid">
      ${richInput('Service ID','id',sv.id||'')}
      ${richInput('Number','number',sv.number||String(i+1).padStart(2,'0'))}
      ${richInput('Price','price',sv.price||'')}
      ${richInput('Duration (minutes)','duration',sv.duration||60)}
      ${richInput('Duration label','durationShort',sv.durationShort||'')}
      ${richInput('Image URL (optional)','image',sv.image||'','input','wide')}
      ${richInput('Alt text','alt',sv.alt||sv.title||'Beauty Studio service','input','wide')}
    </div>
    ${langField('Title','title',sv)}
    ${langField('Short description','description',sv)}
    ${langField('Kicker / category','kicker',sv)}
    ${langField('Photo caption','caption',sv)}
    ${langField('Ideal for','idealFor',sv)}
    ${langField('Tags','tags',sv)}
    <div class="rich-section"><h4>Included points</h4><div class="rich-grid">
      ${richInput('English','points',points.join('\\n'),'textarea')}
      ${richInput('中文','pointsZh',pointsZh.join('\\n'),'textarea')}
      ${richInput('မြန်မာ','pointsMy',pointsMy.join('\\n'),'textarea')}
    </div></div>
    <div class="rich-section"><h4>Highlights</h4><p class="rich-hint">Use one “label | detail” pair per line, up to 3 lines.</p><div class="rich-grid">
      ${richInput('English','highlights',h.map(x=>Array.isArray(x)?x.join(' | '):x).join('\\n'),'textarea')}
      ${richInput('中文','highlightsZh',hz.map(x=>Array.isArray(x)?x.join(' | '):x).join('\\n'),'textarea')}
      ${richInput('မြန်မာ','highlightsMy',hm.map(x=>Array.isArray(x)?x.join(' | '):x).join('\\n'),'textarea')}
    </div></div>`;
  await showRichEditor('Edit service','Manage everything shown in the customer service menu and service detail.',html,async d=>{
    readRichObject(d,sv);
    sv.duration=Math.max(0,parseInt(sv.duration||60,10)||60);
    if(!sv.durationShort)sv.durationShort=`${sv.duration} MIN`;
    const parseLines=(key)=>String(sv[key]||'').split(/\\n+/).map(x=>x.trim()).filter(Boolean);
    ['points','pointsZh','pointsMy'].forEach(k=>sv[k]=parseLines(k));
    ['highlights','highlightsZh','highlightsMy'].forEach(k=>sv[k]=parseLines(k).slice(0,3).map(x=>{const p=x.split('|');return [String(p.shift()||'').trim(),String(p.join('|')||'').trim()]}));
    sv.name=sv.title||sv.name||'New Service';
    renderServices();updateStats();await saveRemote('services');
  });
}

function renderGallery(){
  $('#galleryGrid').innerHTML=data.gallery.map((g,i)=>`
  <article class="gallery-card">
    <div class="gallery-img" style="${g.image?`background-image:url('${g.image}')`:''}">
      <span class="image-badge">${g.image?'PHOTO':'NO PHOTO'}</span>
    </div>
    <div class="gallery-body">
      <h3>${esc(g.title)}</h3><p>${esc(g.category)} · ${esc(g.description||'')}</p>
      <div class="card-actions">
        <button class="mini" data-image-gallery="${i}">Photo</button>
        <button class="mini" data-edit-gallery="${i}">Edit</button>
        <button class="mini" data-delete-gallery="${i}">Delete</button>
      </div>
    </div>
  </article>`).join('');
  $$('[data-edit-gallery]').forEach(b=>b.onclick=()=>editGallery(+b.dataset.editGallery));
  $$('[data-image-gallery]').forEach(b=>b.onclick=()=>pickImageForGallery(+b.dataset.imageGallery));
  $$('[data-delete-gallery]').forEach(b=>b.onclick=async()=>{
    if(await confirmUI('Delete this look?','This removes the gallery item from D1. The local preview photo will also be removed.')){data.gallery.splice(+b.dataset.deleteGallery,1);renderGallery();updateStats();await saveRemote('gallery')}
  });
}
async function editGallery(i){
  const g=data.gallery[i]; if(!g)return;
  const html=`
    <div class="translation-tools">
      <div class="translation-tool-main">
        <div class="translation-tool-label">Original language</div>
        <select data-source-language>
          <option value="en" ${g.title||g.description?'selected':''}>English</option>
          <option value="zh" ${!g.title&&!g.description&&(g.titleZh||g.descriptionZh)?'selected':''}>中文</option>
          <option value="my" ${!g.title&&!g.description&&!g.titleZh&&!g.descriptionZh&&(g.titleMy||g.descriptionMy)?'selected':''}>မြန်မာ</option>
        </select>
      </div>
      <button type="button" class="auto-translate" data-auto-translate-gallery>✨ Auto translate other 2 languages</button>
      <p class="translation-tool-note">Choose one source language, then generate the other two from it. This will replace the other-language fields.</p>
    </div>
    <div class="rich-grid">
      ${richInput('Work number','number',g.number||String(i+1).padStart(2,'0'))}
      ${richInput('Category','category',g.category||'simple')}
      ${richInput('Recommended service ID','recommendedService',g.recommendedService||'')}
      ${richInput('Style name','styleName',g.styleName||g.title||'')}
      ${richInput('Price note','priceNote',g.priceNote||'')}
      ${richInput('Image URL (optional)','image',g.image&&String(g.image).startsWith('data:')?'':(g.image||''),'input','wide')}
      ${richInput('Alt text','alt',g.alt||g.title||'Beauty Studio nail design','input','wide')}
    </div>
    ${langField('Title','title',{title:g.title||'',titleZh:g.titleZh||'',titleMy:g.titleMy||''})}
    ${langField('Style / category label','style',{style:g.style||'',styleZh:g.styleZh||'',styleMy:g.styleMy||''})}
    ${langField('Description','description',{description:g.description||'',descriptionZh:g.descriptionZh||'',descriptionMy:g.descriptionMy||''})}
    ${langField('Mood','mood',{mood:g.mood||'',moodZh:g.moodZh||'',moodMy:g.moodMy||''})}
    ${langField('Inspiration note','note',{note:g.note||'Love this look? Bring it as inspiration and the studio can fine-tune the details for you.',noteZh:g.noteZh||'喜欢这个款式？预约时可以把它作为灵感参考，工作室会根据你的需求微调细节。',noteMy:g.noteMy||'ဒီဒီဇိုင်းကို ကြိုက်ပါသလား။ လာရောက်ချိန်းဆိုချိန်တွင် နမူနာအဖြစ် ပြသနိုင်ပြီး အသေးစိတ်ကို သင့်စိတ်ကြိုက် ပြင်ဆင်ပေးနိုင်ပါသည်။'})}
    <div class="rich-editor-note">The gallery photo file selected with the old Photo button is still browser-local. For a persistent D1 image, enter an image URL here. R2 upload can replace this later without changing the editor.</div>`;
  await showRichEditor('Edit work','Everything shown in the work card and detail modal can be managed here.',html,async d=>{
    readRichObject(d,g);
    ['number','category','recommendedService','styleName','priceNote','image','alt'].forEach(k=>{const el=d.querySelector(`[data-rich-key="${k}"]`);if(el)g[k]=el.value.trim()});
    if(!g.title)g.title='New Look';
    renderGallery();updateStats();await saveRemote('gallery');
  });
}
$('#addGallery').onclick=async()=>{
  data.gallery.push({id:Date.now(),number:String(data.gallery.length+1).padStart(2,'0'),title:'New Look',titleZh:'新款式',titleMy:'ဒီဇိုင်းအသစ်',style:'Simple · Gel',styleZh:'简约 · 凝胶',styleMy:'ရိုးရှင်း · ဂျယ်လ်',category:'simple',description:'A beautiful new studio look.',descriptionZh:'新的精致美甲款式。',descriptionMy:'စတူဒီယိုအတွက် လှပသော ဒီဇိုင်းအသစ်။',mood:'Soft & polished',moodZh:'柔和精致',moodMy:'နူးညံ့သပ်ရပ်',recommendedService:'gel',styleName:'New Look',priceNote:'Gel Manicure',note:'Love this look? Bring it as inspiration and the studio can fine-tune the details for you.',noteZh:'喜欢这个款式？预约时可以把它作为灵感参考。',noteMy:'ဒီဒီဇိုင်းကို ကြိုက်ပါသလား။ ချိန်းဆိုချိန်တွင် နမူနာအဖြစ် ပြသနိုင်ပါသည်။',image:'',alt:'Beauty Studio nail design'});
  renderGallery();updateStats();await saveRemote('gallery');
};

const media=[['Hero','hero'],['Studio','studio'],['Owner portrait','ownerPortrait'],['Contact','contact'],['Social preview','socialPreview'],['TikTok','tiktok'],['WhatsApp','whatsapp'],['Telegram','telegram']];
function renderMedia(){
  $('#mediaGrid').innerHTML=media.map(([name,k])=>{
    const img=data.media[k]||'';
    return `<div class="media-card ${img?'has-image':''}">
      <div class="media-preview" style="${img?`background-image:url('${img}')`:''}"><span>${img?'READY':'EMPTY'}</span></div>
      <strong>${name}</strong><small>Slot: ${k}</small>
      <div class="media-actions"><button class="mini" data-media-upload="${k}">Upload</button>${img?`<button class="mini" data-media-clear="${k}">Clear</button>`:''}</div>
    </div>`;
  }).join('');
  $$('[data-media-upload]').forEach(b=>b.onclick=()=>openFilePicker('media',b.dataset.mediaUpload));
  $$('[data-media-clear]').forEach(b=>b.onclick=async()=>{
    const key=b.dataset.mediaClear;
    if(await confirmUI('Remove this media?',`Clear the ${key} image from this browser's local media slot?`)){
      delete data.media[key];cacheLocal();renderMedia();toast('Local media cleared');
    }
  });
}
function pickImageForGallery(i){openFilePicker('gallery',i)}
function openFilePicker(type,target){
  const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/avif';
  input.onchange=()=>{
    const file=input.files[0];if(!file)return;
    if(file.size>2.5*1024*1024){toast('Please choose an image under 2.5 MB');return}
    const reader=new FileReader();
    reader.onload=()=>{
      if(type==='gallery')data.gallery[target].image=reader.result;else data.media[target]=reader.result;
      cacheLocal();type==='gallery'?renderGallery():renderMedia();toast('Photo saved locally · R2 will be added later');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function fillBooking(){
  const f=$('#bookingForm');
  Object.entries(data.booking).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v});
  f.oninput=()=>readForm(f,data.booking);
}
fillBooking();
function updateStats(){
  const s=$('#statServices'); if(s)s.textContent=data.services.length;
  const g=$('#statGallery'); if(g)g.textContent=data.gallery.length;
  const b=$('#statBooking'); if(b)b.textContent=data.booking.status==='open'?'Open':'Paused';
}

/* v74 — Admin dashboard */
let dashboardLoaded=false;
function dashboardDateKey(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function dashboardGreeting(){
  const h=new Date().getHours();
  return h<12?'Good morning.':h<18?'Good afternoon.':'Good evening.';
}
function dashboardDateLabel(){
  return new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
}
function renderDashboardRows(bookings,supports){
  const today=dashboardDateKey();
  const todayRows=bookings.filter(b=>b.bookingDate===today).sort((a,b)=>String(a.bookingTime).localeCompare(String(b.bookingTime)));
  const todayBox=$('#dashboardTodayList');
  if(todayBox){
    todayBox.innerHTML=todayRows.length?todayRows.map(b=>`<button class=\"dash-row\" data-dash-booking=\"${esc(b.id)}\"><span class=\"dash-time\">${esc(b.bookingTime||'—')}</span><span class=\"dash-main\"><strong>${esc(b.customerName||'Unnamed customer')}</strong><small>${esc(b.service||'Service')} · Customer ${esc(b.customerNumber||'—')}</small></span><span class=\"dash-status ${esc(b.status)}\">${esc(bookingStatusLabel(b.status))}</span></button>`).join(''):`<div class=\"dashboard-empty\">No bookings scheduled for today.</div>`;
  }
  const msgBox=$('#dashboardMessageList');
  const recentMessages=[...supports].sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0)).slice(0,5);
  if(msgBox){
    msgBox.innerHTML=recentMessages.length?recentMessages.map(c=>`<button class=\"dash-row message\" data-dash-support=\"${esc(c.id)}\"><span class=\"dash-avatar\">${esc(String(c.customer_number||'—').slice(-2))}</span><span class=\"dash-main\"><strong>Customer ${esc(c.customer_number||'—')}</strong><small>${esc(c.last_message||'No messages yet')}</small></span>${Number(c.unread_admin||0)>0?`<span class=\"dash-unread\">${Number(c.unread_admin)>99?'99+':c.unread_admin}</span>`:`<span class=\"dash-time-small\">${esc(supportTime(c.updated_at))}</span>`}</button>`).join(''):`<div class=\"dashboard-empty\">No customer messages yet.</div>`;
  }
  const recentBox=$('#dashboardRecentBookings');
  const recent=[...bookings].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  if(recentBox){
    recentBox.innerHTML=recent.length?recent.map(b=>`<button class=\"dash-row\" data-dash-booking=\"${esc(b.id)}\"><span class=\"dash-main\"><strong>${esc(b.customerName||'Unnamed customer')}</strong><small>${esc(formatBookingDate(b.bookingDate))} · ${esc(b.bookingTime||'—')} · ${esc(b.service||'Service')}</small></span><span class=\"dash-status ${esc(b.status)}\">${esc(bookingStatusLabel(b.status))}</span></button>`).join(''):`<div class=\"dashboard-empty\">No booking requests yet.</div>`;
  }
  $$('[data-dash-booking]').forEach(x=>x.onclick=()=>{showView('bookings');setTimeout(()=>showBookingDetail(x.dataset.dashBooking),120)});
  $$('[data-dash-support]').forEach(x=>x.onclick=()=>{showView('support');setTimeout(()=>openSupportConversation(Number(x.dataset.dashSupport)),120)});
}
async function loadDashboard(){
  if(!token())return;
  const g=$('#dashboardGreeting'),d=$('#dashboardDate');
  if(g)g.textContent=dashboardGreeting();
  if(d)d.textContent=dashboardDateLabel();
  const today=dashboardDateKey();
  try{
    const [br,sr]=await Promise.all([apiGet('/api/bookings?limit=100&t='+Date.now()),apiGet('/api/support/conversations?limit=100&t='+Date.now())]);
    const bookings=br.ok&&Array.isArray(br.body?.data)?br.body.data.map(normalizeBooking):[];
    const supports=sr.ok&&Array.isArray(sr.body?.conversations)?sr.body.conversations:[];
    const todayRows=bookings.filter(b=>b.bookingDate===today);
    const pending=bookings.filter(b=>b.status==='pending').length;
    const unread=supports.reduce((n,c)=>n+Number(c.unread_admin||0),0);
    const customers=new Set();
    bookings.forEach(b=>{if(b.customerNumber)customers.add(String(b.customerNumber));else if(b.phone)customers.add('phone:'+b.phone)});
    supports.forEach(c=>{if(c.customer_number)customers.add(String(c.customer_number));});
    const a=$('#dashTodayBookings');if(a)a.textContent=todayRows.length;
    const am=$('#dashTodayMeta');if(am)am.textContent=todayRows.length===1?'1 appointment today':`${todayRows.length} appointments today`;
    const p=$('#dashPending');if(p)p.textContent=pending;
    const u=$('#dashUnread');if(u)u.textContent=unread>99?'99+':unread;
    const c=$('#dashCustomers');if(c)c.textContent=customers.size;
    renderDashboardRows(bookings,supports);
    dashboardLoaded=true;
  }catch(e){
    const ids=['dashTodayBookings','dashPending','dashUnread','dashCustomers'];ids.forEach(id=>{const x=$('#'+id);if(x)x.textContent='—'});
  }
}
function ensureDashboardStyles(){
  if($('#dashboardStyles'))return;
  const s=document.createElement('style');s.id='dashboardStyles';s.textContent=`
  .dashboard-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:28px 30px;background:linear-gradient(135deg,#fffaf6,#f3e5de);border:1px solid #dfd1c8;border-radius:24px;margin-bottom:16px}.dashboard-hero h2{font:500 clamp(28px,4vw,42px)/1.05 Georgia,serif;color:#302621;margin:5px 0 8px}.dashboard-hero p:not(.eyebrow){margin:0;color:#81746d;font-size:13px}.dashboard-date{padding:9px 13px;border:1px solid #dfd1c8;border-radius:999px;background:#fffaf6;color:#6f5e56;font-size:11px;white-space:nowrap}.dashboard-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.dashboard-stat{border:1px solid #dfd1c8;border-radius:20px;background:#fffaf6;padding:18px;text-align:left;cursor:pointer;display:grid;gap:7px;transition:transform .16s ease,box-shadow .16s ease}.dashboard-stat:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(48,38,33,.08)}.dashboard-stat span{font-size:11px;color:#81746d}.dashboard-stat strong{font:500 30px Georgia,serif;color:#302621}.dashboard-stat small{font-size:10px;color:#a08e85}.dashboard-columns,.dashboard-bottom{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.dashboard-panel{background:#fffaf6;border:1px solid #dfd1c8;border-radius:22px;overflow:hidden}.dashboard-panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:19px 20px 14px;border-bottom:1px solid rgba(125,91,79,.1)}.dashboard-panel-head h3{margin:3px 0 0;font:500 22px Georgia,serif;color:#302621}.text-action{border:0;background:transparent;color:#9b6c69;font-size:11px;font-weight:700;cursor:pointer;padding:5px 0}.dashboard-list{display:flex;flex-direction:column}.dash-row{width:100%;border:0;border-bottom:1px solid rgba(125,91,79,.08);background:transparent;padding:13px 18px;text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer;color:inherit}.dash-row:last-child{border-bottom:0}.dash-row:hover{background:#f8eee8}.dash-time{min-width:50px;font-size:12px;font-weight:700;color:#6e5c54}.dash-main{min-width:0;flex:1;display:grid;gap:4px}.dash-main strong{font-size:12px;color:#302621;font-weight:650}.dash-main small{font-size:10px;color:#8a7971;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dash-status{font-size:9px;padding:6px 8px;border-radius:999px;background:#f0e5df;color:#6e5c54;white-space:nowrap}.dash-status.confirmed{background:#e7eee3;color:#5e7656}.dash-status.pending{background:#f4eadc;color:#8a6847}.dash-status.cancelled{background:#f2e1df;color:#945f5b}.dash-status.completed{background:#e8e4ed;color:#665b75}.dash-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#eadbd3;color:#6e5c54;font:700 10px Arial,sans-serif;flex:none}.dash-unread{min-width:20px;height:20px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#9b6c69;color:#fff;font:700 9px Arial,sans-serif}.dash-time-small{font-size:9px;color:#9a8980;white-space:nowrap}.dashboard-empty{padding:28px 18px;text-align:center;color:#9a8980;font-size:11px}.dashboard-bottom .dashboard-panel{min-height:230px}.dashboard-actions .quick-grid{padding:14px}.dashboard-actions .quick-grid button{min-height:88px}@media(max-width:900px){.dashboard-stats{grid-template-columns:repeat(2,1fr)}.dashboard-columns,.dashboard-bottom{grid-template-columns:1fr}.dashboard-hero{padding:22px 20px}.dashboard-date{display:none}}@media(max-width:560px){.dashboard-stats{gap:8px}.dashboard-stat{padding:14px;border-radius:16px}.dashboard-stat strong{font-size:25px}.dashboard-panel-head{padding:16px}.dash-row{padding:12px 14px}.dash-status{font-size:8px}.dashboard-hero h2{font-size:30px}}
  `;document.head.appendChild(s);
}
ensureDashboardStyles();
$$('[data-dashboard-go]').forEach(b=>b.onclick=()=>showView(b.dataset.dashboardGo));
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function ensureDialogStyles(){
  if($('#v3DialogStyles'))return;
  const s=document.createElement('style');s.id='v3DialogStyles';s.textContent=`
  .v3-dialog-backdrop{position:fixed;inset:0;background:rgba(38,29,25,.5);backdrop-filter:blur(6px);z-index:10000;display:grid;place-items:center;padding:20px}
  .v3-dialog{width:min(440px,100%);background:#fffaf6;border:1px solid #dfd1c8;border-radius:22px;padding:24px;box-shadow:0 24px 80px rgba(40,25,20,.2)}
  .v3-dialog h3{font:500 25px Georgia,serif;margin:0 0 8px}.v3-dialog p{color:#81746d;font-size:12px;line-height:1.6;margin:0 0 16px}
  .v3-dialog input{width:100%;border:1px solid #dfd1c8;background:#fff;border-radius:12px;padding:12px 13px}
  .v3-dialog-actions{display:flex;gap:8px;margin-top:14px}.v3-dialog-actions button{border:0;border-radius:999px;padding:10px 15px;cursor:pointer}
  .v3-dialog-actions .ok{background:#9b6c69;color:#fff}.v3-dialog-actions .cancel{background:#f0e6df;color:#302621}
  `;document.head.appendChild(s);
}
function customField(title,label,value){
  ensureDialogStyles();
  return new Promise(resolve=>{
    const d=document.createElement('div');d.className='v3-dialog-backdrop';
    d.innerHTML=`<div class="v3-dialog"><h3>${esc(title)}</h3><p>${esc(label)}</p><input id="v3Field" value="${esc(value)}"><div class="v3-dialog-actions"><button class="ok">Save</button><button class="cancel">Cancel</button></div></div>`;
    document.body.appendChild(d);const i=d.querySelector('#v3Field');i.focus();i.select();
    d.querySelector('.ok').onclick=()=>{const v=i.value.trim();d.remove();resolve(v)};
    d.querySelector('.cancel').onclick=()=>{d.remove();resolve(null)};
    i.onkeydown=e=>{if(e.key==='Enter')d.querySelector('.ok').click();if(e.key==='Escape')d.querySelector('.cancel').click()};
  });
}
function confirmUI(title,message){
  ensureDialogStyles();
  return new Promise(resolve=>{
    const d=document.createElement('div');d.className='v3-dialog-backdrop';
    d.innerHTML=`<div class="v3-dialog"><h3>${esc(title)}</h3><p>${esc(message)}</p><div class="v3-dialog-actions"><button class="ok">Delete</button><button class="cancel">Cancel</button></div></div>`;
    document.body.appendChild(d);d.querySelector('.ok').onclick=()=>{d.remove();resolve(true)};d.querySelector('.cancel').onclick=()=>{d.remove();resolve(false)};
  });
}



/* Bookings v71: D1-backed admin inbox */
let bookingFilter='all';
let bookingRows=[];

function normalizeBooking(row){
  return {
    id: row.id || '',
    customerNumber: row.customer_number ?? row.customerNumber ?? '',
    customerName: row.customer_name ?? row.customerName ?? '',
    phone: row.phone ?? '',
    service: row.service ?? '',
    price: row.price ?? '',
    duration: row.duration ?? '',
    bookingDate: row.booking_date ?? row.bookingDate ?? '',
    bookingTime: row.booking_time ?? row.bookingTime ?? '',
    inspiration: row.inspiration ?? '',
    customerNote: row.customer_note ?? row.customerNote ?? '',
    status: String(row.status || 'pending').toLowerCase(),
    createdAt: row.created_at ?? row.createdAt ?? '',
    updatedAt: row.updated_at ?? row.updatedAt ?? ''
  };
}

function formatBookingDate(value){
  if(!value)return '—';
  const d=new Date(`${value}T12:00:00`);
  if(Number.isNaN(d.getTime()))return value;
  return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
function formatBookingDateTime(value){
  if(!value)return '—';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return value;
  return d.toLocaleString(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function bookingStatusLabel(v){
  return String(v||'pending').charAt(0).toUpperCase()+String(v||'pending').slice(1);
}

function ensureBookingStyles(){
  if($('#bookingV71Styles'))return;
  const s=document.createElement('style');s.id='bookingV71Styles';s.textContent=`
  #view-bookings .booking-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0 14px;flex-wrap:wrap}
  #view-bookings .booking-filters{display:flex;gap:7px;flex-wrap:wrap}
  #view-bookings .booking-filters button{border:1px solid #dfd1c8;background:#fffaf6;color:#5f514b;border-radius:999px;padding:8px 13px;cursor:pointer;font-size:12px}
  #view-bookings .booking-filters button.active{background:#302621;color:#fff;border-color:#302621}
  #view-bookings .booking-count{color:#81746d;font-size:12px}
  .booking-admin-list{display:grid;gap:12px}
  .booking-admin-card{background:#fffaf6;border:1px solid #dfd1c8;border-radius:18px;padding:16px 18px;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(150px,.8fr) minmax(160px,.9fr) auto;gap:14px;align-items:center;box-shadow:0 8px 28px rgba(55,35,28,.05)}
  .booking-admin-card h3{margin:0 0 5px;font:500 19px Georgia,serif;color:#302621}.booking-admin-card p{margin:0;color:#81746d;font-size:12px;line-height:1.6}.booking-admin-card .booking-main{min-width:0}.booking-admin-card .booking-main .booking-id{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#a17870;margin-bottom:7px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.booking-admin-card .booking-time strong{display:block;font-size:14px;color:#302621}.booking-admin-card .booking-time small{display:block;color:#81746d;margin-top:4px}.booking-admin-card .booking-contact strong{display:block;color:#302621;font-size:13px}.booking-admin-card .booking-contact small{display:block;color:#81746d;margin-top:4px}.booking-admin-card .booking-actions{display:flex;gap:7px;justify-content:flex-end;flex-wrap:wrap}.booking-admin-card .mini{border:1px solid #dfd1c8;background:#f3e9e3;color:#302621;border-radius:999px;padding:8px 11px;cursor:pointer;font-size:11px}.booking-admin-card .mini.primary{background:#302621;color:#fff;border-color:#302621}.booking-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-top:7px}.booking-status.pending{background:#f2e7d9;color:#8c654f}.booking-status.confirmed{background:#e4eee1;color:#59714f}.booking-status.completed{background:#e6e8ed;color:#59606d}.booking-status.cancelled{background:#f2dfdc;color:#975e58}
  .booking-empty{border:1px dashed #d8c9c0;background:#fffaf6;border-radius:18px;padding:34px;text-align:center;color:#81746d;font-size:13px}
  .booking-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.booking-detail-grid>div{background:#f5ece7;border-radius:12px;padding:11px 12px}.booking-detail-grid small{display:block;color:#9a8981;font-size:9px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:5px}.booking-detail-grid strong{display:block;color:#302621;font-size:13px;word-break:break-word}.booking-detail-wide{grid-column:1/-1}
  @media(max-width:900px){.booking-admin-card{grid-template-columns:1fr 1fr}.booking-admin-card .booking-actions{grid-column:1/-1;justify-content:flex-start}.booking-detail-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}

function renderBookings(){
  ensureBookingStyles();
  const list=$('#bookingList'), count=$('#bookingCount');
  if(!list||!count)return;
  const filtered=bookingFilter==='all'?bookingRows:bookingRows.filter(x=>x.status===bookingFilter);
  count.textContent=`${filtered.length} request${filtered.length===1?'':'s'}`;
  if(!filtered.length){
    list.innerHTML=`<div class="booking-empty">${bookingRows.length?'No bookings match this filter.':'No booking requests yet.'}</div>`;
    return;
  }
  list.innerHTML=filtered.map(b=>`
    <article class="booking-admin-card">
      <div class="booking-main">
        <span class="booking-id">${esc(b.id)}</span>
        <h3>${esc(b.customerName||'Unnamed customer')}</h3>
        <p>${b.customerNumber ? `Customer ${esc(b.customerNumber)} · ` : ''}${esc(b.service||'Service')} · ${esc(b.duration||'—')} min</p>
        <span class="booking-status ${esc(b.status)}">${esc(bookingStatusLabel(b.status))}</span>
      </div>
      <div class="booking-time"><strong>${esc(formatBookingDate(b.bookingDate))}</strong><small>${esc(b.bookingTime||'—')}</small></div>
      <div class="booking-contact"><strong>${esc(b.phone||'No phone')}</strong><small>${esc(b.price||'Price on request')}</small></div>
      <div class="booking-actions"><button class="mini primary" data-booking-view="${esc(b.id)}">View</button><button class="mini" data-booking-status="${esc(b.id)}">Status</button></div>
    </article>`).join('');
  $$('[data-booking-view]').forEach(btn=>btn.onclick=()=>showBookingDetail(btn.dataset.bookingView));
  $$('[data-booking-status]').forEach(btn=>btn.onclick=()=>changeBookingStatus(btn.dataset.bookingStatus));
}

async function loadBookings(){
  const list=$('#bookingList'),count=$('#bookingCount');
  if(!list||!count)return;
  ensureBookingStyles();
  list.innerHTML='<div class="booking-empty">Loading booking requests…</div>';
  try{
    const r=await apiGet('/api/bookings?limit=100&t='+Date.now());
    if(!r.ok){list.innerHTML=`<div class="booking-empty">Unable to load bookings · HTTP ${r.status}</div>`;count.textContent='0 requests';return;}
    bookingRows=Array.isArray(r.body?.data)?r.body.data.map(normalizeBooking):[];
    renderBookings();
  }catch(e){list.innerHTML='<div class="booking-empty">Unable to load bookings. Please refresh.</div>';count.textContent='0 requests'}
}

async function showBookingDetail(id){
  const b=bookingRows.find(x=>x.id===id);
  if(!b)return;
  ensureDialogStyles();
  const d=document.createElement('div');d.className='v3-dialog-backdrop';
  d.innerHTML=`<div class="v3-dialog" style="width:min(680px,100%);max-height:90vh;overflow:auto">
    <p style="font-size:10px;letter-spacing:.18em;color:#9b6c69;font-weight:700;margin:0 0 7px">APPOINTMENT REQUEST</p>
    <h3>${esc(b.customerName||'Unnamed customer')}</h3>
    <p>${esc(b.id)} · ${esc(bookingStatusLabel(b.status))}</p>
    <div class="booking-detail-grid">
      <div><small>Customer ID</small><strong>${esc(b.customerNumber||'—')}</strong></div>
      <div><small>Service</small><strong>${esc(b.service||'—')}</strong></div>
      <div><small>Price</small><strong>${esc(b.price||'Price on request')}</strong></div>
      <div><small>Date</small><strong>${esc(formatBookingDate(b.bookingDate))}</strong></div>
      <div><small>Time</small><strong>${esc(b.bookingTime||'—')}</strong></div>
      <div><small>Duration</small><strong>${esc(b.duration||'—')} min</strong></div>
      <div><small>Phone</small><strong>${esc(b.phone||'—')}</strong></div>
      <div><small>Inspiration</small><strong>${esc(b.inspiration||'—')}</strong></div>
      <div><small>Submitted</small><strong>${esc(formatBookingDateTime(b.createdAt))}</strong></div>
      <div class="booking-detail-wide"><small>Customer note</small><strong>${esc(b.customerNote||'—')}</strong></div>
    </div>
    <div class="v3-dialog-actions"><button class="ok" data-detail-status>Change status</button><button class="cancel">Close</button></div>
  </div>`;
  document.body.appendChild(d);
  d.querySelector('.cancel').onclick=()=>d.remove();
  d.querySelector('[data-detail-status]').onclick=async()=>{d.remove();await changeBookingStatus(id)};
}

async function changeBookingStatus(id){
  const b=bookingRows.find(x=>x.id===id);if(!b)return;
  ensureDialogStyles();
  const d=document.createElement('div');d.className='v3-dialog-backdrop';
  d.innerHTML=`<div class="v3-dialog"><h3>Update booking</h3><p>${esc(b.customerName)} · ${esc(b.bookingDate)} ${esc(b.bookingTime)}</p><select id="bookingStatusSelect" style="width:100%;border:1px solid #dfd1c8;background:#fff;border-radius:12px;padding:12px 13px"><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><div class="v3-dialog-actions"><button class="ok">Save</button><button class="cancel">Cancel</button></div></div>`;
  document.body.appendChild(d);
  const select=d.querySelector('#bookingStatusSelect');select.value=b.status;
  d.querySelector('.cancel').onclick=()=>d.remove();
  d.querySelector('.ok').onclick=async()=>{
    const status=select.value;
    d.remove();
    try{
      const r=await apiPut('/api/bookings/'+encodeURIComponent(id),{status});
      if(r.ok){const updated=normalizeBooking(r.body.booking||{});const i=bookingRows.findIndex(x=>x.id===id);if(i>=0)bookingRows[i]={...bookingRows[i],...updated};renderBookings();toast('Booking status updated');}
      else toast(r.status===401?'ADMIN_TOKEN rejected':'Could not update booking');
    }catch(e){toast('Network error · Worker unavailable')}
  };
}


/* v74 — Admin Need Help inbox */
let supportConversations=[];
let activeSupportId=null;
let supportPollTimer=null;

function ensureSupportAdminStyles(){
  if($('#supportAdminStyles'))return;
  const s=document.createElement('style');s.id='supportAdminStyles';s.textContent=`
    .nav-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#9b6c69;color:#fff;font:700 9px Arial,sans-serif;margin-left:6px}.support-admin-layout{display:grid;grid-template-columns:minmax(260px,.8fr) minmax(0,1.7fr);gap:14px;min-height:560px}.support-conversation-list,.support-thread{background:#fffaf6;border:1px solid #dfd1c8;border-radius:20px;overflow:hidden}.support-conversation-list{display:flex;flex-direction:column;overflow:auto}.support-admin-item{border:0;border-bottom:1px solid rgba(125,91,79,.1);background:transparent;padding:15px 16px;text-align:left;cursor:pointer;display:grid;gap:5px}.support-admin-item:hover,.support-admin-item.active{background:#f6ece6}.support-admin-item strong{font:500 17px Georgia,serif;color:#302621}.support-admin-item small{color:#8b7b73;font-size:10px}.support-admin-item p{margin:0;color:#75675f;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.support-admin-item .unread{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:999px;background:#9b6c69;color:#fff;font:700 9px Arial,sans-serif;padding:0 5px}.support-thread{display:flex;flex-direction:column}.support-thread-head{padding:18px 20px;border-bottom:1px solid rgba(125,91,79,.1);display:flex;justify-content:space-between;gap:15px}.support-thread-head h3{margin:0;font:500 23px Georgia,serif;color:#302621}.support-thread-head p{margin:4px 0 0;color:#81746d;font-size:11px}.support-thread-head .status{border:1px solid #dfd1c8;border-radius:999px;background:#f3e9e3;padding:7px 10px;font-size:10px;color:#6e5c54}.support-thread-messages{flex:1;overflow:auto;padding:18px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#fffaf6,#fbf4ef)}.support-admin-msg{max-width:76%;padding:11px 13px;border-radius:16px;display:grid;gap:4px}.support-admin-msg.customer{align-self:flex-start;background:#f0e3dc;color:#302621;border-bottom-left-radius:5px}.support-admin-msg.admin{align-self:flex-end;background:#302621;color:#fffaf6;border-bottom-right-radius:5px}.support-admin-msg small{font-size:9px;opacity:.65}.support-admin-msg p{margin:0;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.support-thread-compose{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(125,91,79,.1)}.support-thread-compose textarea{flex:1;resize:none;border:1px solid #dfd1c8;border-radius:14px;padding:11px 12px;background:#fff;outline:0;font:inherit;font-size:12px}.support-thread-compose button{border:0;border-radius:14px;background:#302621;color:#fff;padding:0 16px;font-weight:700;cursor:pointer}.support-admin-empty{display:grid;place-items:center;min-height:220px;padding:30px;text-align:center;color:#81746d;font-size:12px}.support-thread .support-admin-empty{flex:1}@media(max-width:900px){.support-admin-layout{grid-template-columns:1fr;min-height:auto}.support-conversation-list{max-height:280px}.support-thread{min-height:540px}}
  `;document.head.appendChild(s);
}
function supportTime(v){try{return new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return v||''}}
function renderSupportConversations(){
  ensureSupportAdminStyles();const list=$('#supportConversationList');if(!list)return;
  if(!supportConversations.length){list.innerHTML='<div class="support-admin-empty">No customer conversations yet.<br>Messages from Need Help will appear here.</div>';return}
  list.innerHTML=supportConversations.map(c=>`<button class="support-admin-item ${Number(c.id)===Number(activeSupportId)?'active':''}" data-support-id="${esc(c.id)}"><strong>Customer ${esc(c.customer_number||'—')}</strong><small>${esc(c.customer_name||'Unnamed')} · ${esc(c.customer_phone||'No phone')}</small><p>${esc(c.last_message||'No messages yet')}</p>${Number(c.unread_admin)>0?`<span class="unread">${Number(c.unread_admin)>99?'99+':c.unread_admin}</span>`:''}</button>`).join('');
  $$('#supportConversationList [data-support-id]').forEach(b=>b.onclick=()=>openSupportConversation(Number(b.dataset.supportId)));
}
async function loadSupportConversations(){
  ensureSupportAdminStyles();const list=$('#supportConversationList');if(!list)return;list.innerHTML='<div class="support-admin-empty">Loading conversations…</div>';
  try{const r=await apiGet('/api/support/conversations?limit=100&t='+Date.now());if(!r.ok){list.innerHTML=`<div class="support-admin-empty">Unable to load messages · HTTP ${r.status}</div>`;return}supportConversations=Array.isArray(r.body?.conversations)?r.body.conversations:[];const unread=supportConversations.reduce((n,c)=>n+Number(c.unread_admin||0),0);const nb=$('#supportNavBadge');if(nb){nb.textContent=unread>99?'99+':String(unread);nb.hidden=unread<=0}renderSupportConversations();if(activeSupportId){const found=supportConversations.find(c=>Number(c.id)===Number(activeSupportId));if(found)await openSupportConversation(activeSupportId,true)}}catch(e){list.innerHTML='<div class="support-admin-empty">Unable to load messages. Please refresh.</div>'}
}
async function openSupportConversation(id,silent=false){
  activeSupportId=id;renderSupportConversations();const thread=$('#supportThread');if(!thread)return;if(!silent)thread.innerHTML='<div class="support-admin-empty">Loading conversation…</div>';
  try{const r=await apiGet('/api/support/conversations/'+encodeURIComponent(id)+'?t='+Date.now());if(!r.ok){thread.innerHTML='<div class="support-admin-empty">Conversation unavailable.</div>';return}const c=r.body.conversation||{};const msgs=r.body.messages||[];thread.innerHTML=`<div class="support-thread-head"><div><h3>Customer ${esc(c.customer_number||'—')}</h3><p>${esc(c.customer_name||'Unnamed')} · ${esc(c.customer_phone||'No phone')}</p></div><span class="status">${esc(c.status||'open')}</span></div><div class="support-thread-messages" id="activeSupportMessages">${msgs.length?msgs.map(m=>`<article class="support-admin-msg ${m.sender_type==='admin'?'admin':'customer'}"><small>${m.sender_type==='admin'?'Beauty Studio':'Customer'} · ${esc(supportTime(m.created_at))}</small><p>${esc(m.message)}</p></article>`).join(''):'<div class="support-admin-empty">No messages yet.</div>'}</div><form class="support-thread-compose" id="supportReplyForm"><textarea id="supportReplyInput" rows="2" maxlength="2000" placeholder="Reply to Customer ${esc(c.customer_number||'—')}…"></textarea><button type="submit">Reply →</button></form>`;
    const box=$('#activeSupportMessages');if(box)box.scrollTop=box.scrollHeight;const f=$('#supportReplyForm');const inp=$('#supportReplyInput');f?.addEventListener('submit',async e=>{e.preventDefault();const message=inp.value.trim();if(!message)return;inp.disabled=true;try{const x=await apiFetch('/api/support/conversations/'+encodeURIComponent(id)+'/messages',{method:'POST',body:JSON.stringify({message})});if(x.ok){inp.value='';await openSupportConversation(id,true);await loadSupportConversations()}else toast(x.status===401?'ADMIN_TOKEN rejected':'Could not send reply')}catch{toast('Network error · Worker unavailable')}finally{inp.disabled=false;inp.focus()}});
  }catch{thread.innerHTML='<div class="support-admin-empty">Unable to load conversation.</div>'}
}
$('#refreshSupport')?.addEventListener('click',loadSupportConversations);
ensureSupportAdminStyles();

/* v84 — Admin interface language switcher */
const ADMIN_LANG_KEY='beauty_studio_admin_language';
const ADMIN_I18N={
  en:{
    'Overview':'Overview','Studio Content':'Studio Content','Services':'Services','Gallery':'Gallery','Media':'Media','Bookings':'Bookings','Messages':'Messages','Booking Rules':'Booking Rules','Open customer site ↗':'Open customer site ↗','Language':'Language',
    'CONTROL CENTER':'CONTROL CENTER','Good morning.':'Good morning.','Everything happening in your studio, at a glance.':'Everything happening in your studio, at a glance.','Today':'Today',"Today's bookings":"Today's bookings",'Pending requests':'Pending requests','Unread messages':'Unread messages','Customers':'Customers','Need your review':'Need your review','From Need Help':'From Need Help','Seen in bookings & messages':'Seen in bookings & messages','TODAY':'TODAY',"Today's schedule":"Today's schedule",'View all →':'View all →','Loading today\'s bookings…':"Loading today's bookings…",'CUSTOMER CARE':'CUSTOMER CARE','Recent messages':'Recent messages','Open inbox →':'Open inbox →','Loading messages…':'Loading messages…','RECENT ACTIVITY':'RECENT ACTIVITY','Latest booking requests':'Latest booking requests','Manage →':'Manage →','Loading activity…':'Loading activity…','QUICK ACTIONS':'QUICK ACTIONS','Keep the studio fresh.':'Keep the studio fresh.','Add a new look':'Add a new look','Update a service':'Update a service','Replace a photo':'Replace a photo','Adjust availability':'Adjust availability','Pricing & timing':'Pricing & timing','Media library':'Media library','Booking rules':'Booking rules',
    'STUDIO PROFILE':'STUDIO PROFILE','These details are stored in D1 and become the single source of truth.':'These details are stored in D1 and become the single source of truth.','Save changes':'Save changes','Studio name':'Studio name','City':'City','Address':'Address','Phone':'Phone','Hours':'Hours','Booking message':'Booking message','BRAND & LANGUAGE':'BRAND & LANGUAGE','Studio identity':'Studio identity','Set the customer-facing studio name and contact content for English, 中文 and မြန်မာ. The customer site switches these values with its language selector.':'Set the customer-facing studio name and contact content for English, 中文 and မြန်မာ. The customer site switches these values with its language selector.','Studio name · English':'Studio name · English','Tagline · English':'Tagline · English','Tagline · 中文':'Tagline · 中文','Tagline · မြန်မာ':'Tagline · မြန်မာ','Studio name · 中文':'Studio name · 中文','Studio name · မြန်မာ':'Studio name · မြန်မာ','City · English':'City · English','City · 中文':'City · 中文','City · မြန်မာ':'City · မြန်မာ','Address · English':'Address · English','Address · 中文':'Address · 中文','Address · မြန်မာ':'Address · မြန်မာ','Hours · English':'Hours · English','Hours · 中文':'Hours · 中文','Hours · မြန်မာ':'Hours · မြန်မာ','BOOKING COPY':'BOOKING COPY','This message follows the customer language selector.':'This message follows the customer language selector.','English':'English','中文':'中文','မြန်မာ':'မြန်မာ','SERVICE MENU':'SERVICE MENU','Edit the menu shown on the customer website.':'Edit the menu shown on the customer website.','＋ Add service':'＋ Add service','PORTFOLIO':'PORTFOLIO','Manage looks, categories and descriptions. Photos remain local until R2 is available.':'Manage looks, categories and descriptions. Photos remain local until R2 is available.','＋ Add look':'＋ Add look','MEDIA LIBRARY':'MEDIA LIBRARY','Media slots':'Media slots','Temporary media stays in this browser. Cloudflare R2 can be connected later without changing these slots.':'Temporary media stays in this browser. Cloudflare R2 can be connected later without changing these slots.','APPOINTMENTS':'APPOINTMENTS','Customer requests received from the website.':'Customer requests received from the website.','Refresh':'Refresh','All':'All','Pending':'Pending','Confirmed':'Confirmed','Completed':'Completed','Cancelled':'Cancelled','Private conversations from the Need Help button. Each conversation stays linked to the customer\'s ID.':"Private conversations from the Need Help button. Each conversation stays linked to the customer's ID.",'Select a conversation to reply.':'Select a conversation to reply.','Control when customers can request appointments.':'Control when customers can request appointments.','Opening time':'Opening time','Closing time':'Closing time','Slot interval':'Slot interval','15 minutes':'15 minutes','30 minutes':'30 minutes','60 minutes':'60 minutes','Advance days':'Advance days','Minimum lead time':'Minimum lead time','Booking status':'Booking status','Open':'Open','Paused':'Paused','Customer website remains independent. Studio content, services, gallery metadata and booking rules now use D1 when saved.':'Customer website remains independent. Studio content, services, gallery metadata and booking rules now use D1 when saved.','Sign out':'Sign out','Connect Admin':'Connect Admin','Connecting to D1…':'Connecting to D1…','D1 connected · Admin session':'D1 connected · Admin session','D1 unavailable · Local fallback':'D1 unavailable · Local fallback','Edit':'Edit','Delete':'Delete','Studio service':'Studio service','Service · Detail':'Service · Detail','No services yet. Click “Add service” to create the first service.':'No services yet. Click “Add service” to create the first service.','No customer conversations yet.':'No customer conversations yet.','Messages from Need Help will appear here.':'Messages from Need Help will appear here.','Loading conversations…':'Loading conversations…','Conversation unavailable.':'Conversation unavailable.','No messages yet.':'No messages yet.','Reply →':'Reply →','Beauty Studio':'Beauty Studio','Customer':'Customer','Unnamed':'Unnamed','No phone':'No phone','open':'open','closed':'closed','Content Editor':'Content Editor','Edit service':'Edit service','Edit work':'Edit work','Original language':'Original language','✨ Auto translate other 2 languages':'✨ Auto translate other 2 languages','Cancel':'Cancel','Translating…':'Translating…','Save':'Save','Update booking':'Update booking','Booking status updated':'Booking status updated','Could not update booking':'Could not update booking'
  },
  zh:{
    'Overview':'概览','Studio Content':'工作室内容','Services':'服务项目','Gallery':'作品集','Media':'媒体','Bookings':'预约','Messages':'消息','Booking Rules':'预约规则','Open customer site ↗':'打开客户网站 ↗','Language':'语言','CONTROL CENTER':'控制中心','Good morning.':'早上好。','Everything happening in your studio, at a glance.':'一眼查看工作室的所有动态。','Today':'今天',"Today's bookings":'今日预约','Pending requests':'待处理预约','Unread messages':'未读消息','Customers':'客户','Need your review':'等待你审核','From Need Help':'来自 Need Help','Seen in bookings & messages':'来自预约和消息','TODAY':'今日',"Today's schedule":'今日安排','View all →':'查看全部 →','Loading today\'s bookings…':'正在加载今日预约…','CUSTOMER CARE':'客户服务','Recent messages':'最近消息','Open inbox →':'打开收件箱 →','Loading messages…':'正在加载消息…','RECENT ACTIVITY':'最近动态','Latest booking requests':'最新预约请求','Manage →':'管理 →','Loading activity…':'正在加载动态…','QUICK ACTIONS':'快捷操作','Keep the studio fresh.':'保持工作室内容焕新。','Add a new look':'添加新作品','Update a service':'更新服务','Replace a photo':'更换照片','Adjust availability':'调整可预约时间','Pricing & timing':'价格与时长','Media library':'媒体库','Booking rules':'预约规则','STUDIO PROFILE':'工作室资料','These details are stored in D1 and become the single source of truth.':'这些信息保存在 D1，并作为统一的数据来源。','Save changes':'保存更改','Studio name':'工作室名称','City':'城市','Address':'地址','Phone':'电话','Hours':'营业时间','Booking message':'预约提示','BRAND & LANGUAGE':'品牌与语言','Studio identity':'工作室名称与身份','Set the customer-facing studio name and contact content for English, 中文 and မြန်မာ. The customer site switches these values with its language selector.':'设置客户网站使用的工作室名称和联系内容，客户切换语言后会同步切换。','Studio name · English':'工作室名称 · English','Tagline · English':'副标题 · English','Tagline · 中文':'副标题 · 中文','Tagline · မြန်မာ':'副标题 · မြန်မာ','Studio name · 中文':'工作室名称 · 中文','Studio name · မြန်မာ':'工作室名称 · မြန်မာ','City · English':'城市 · English','City · 中文':'城市 · 中文','City · မြန်မာ':'城市 · မြန်မာ','Address · English':'地址 · English','Address · 中文':'地址 · 中文','Address · မြန်မာ':'地址 · မြန်မာ','Hours · English':'营业时间 · English','Hours · 中文':'营业时间 · 中文','Hours · မြန်မာ':'营业时间 · မြန်မာ','BOOKING COPY':'预约文案','This message follows the customer language selector.':'这段提示会跟随客户网站的语言切换。','English':'English','中文':'中文','မြန်မာ':'မြန်မာ','SERVICE MENU':'服务菜单','Edit the menu shown on the customer website.':'编辑客户网站上显示的服务菜单。','＋ Add service':'＋ 添加服务','PORTFOLIO':'作品集','Manage looks, categories and descriptions. Photos remain local until R2 is available.':'管理作品、分类和描述。R2 接入前，图片暂存在本地。','＋ Add look':'＋ 添加作品','MEDIA LIBRARY':'媒体库','Media slots':'媒体位','Temporary media stays in this browser. Cloudflare R2 can be connected later without changing these slots.':'临时媒体保存在此浏览器中，之后接入 Cloudflare R2 无需更改这些位置。','APPOINTMENTS':'预约','Customer requests received from the website.':'来自客户网站的预约请求。','Refresh':'刷新','All':'全部','Pending':'待确认','Confirmed':'已确认','Completed':'已完成','Cancelled':'已取消','Private conversations from the Need Help button. Each conversation stays linked to the customer\'s ID.':'来自 Need Help 的私密对话，每个对话都会关联客户 ID。','Select a conversation to reply.':'选择一个对话开始回复。','Control when customers can request appointments.':'控制客户什么时候可以提交预约。','Opening time':'开始时间','Closing time':'结束时间','Slot interval':'时间间隔','15 minutes':'15 分钟','30 minutes':'30 分钟','60 minutes':'60 分钟','Advance days':'可提前预约天数','Minimum lead time':'最少提前时间','Booking status':'预约状态','Open':'开放','Paused':'暂停','Customer website remains independent. Studio content, services, gallery metadata and booking rules now use D1 when saved.':'客户网站保持独立。保存后，工作室内容、服务、作品信息和预约规则都会使用 D1。','Sign out':'退出登录','Connect Admin':'连接 Admin','Connecting to D1…':'正在连接 D1…','D1 connected · Admin session':'D1 已连接 · Admin 会话','D1 unavailable · Local fallback':'D1 不可用 · 本地模式','Edit':'编辑','Delete':'删除','Studio service':'工作室服务','Service · Detail':'服务 · 详情','No services yet. Click “Add service” to create the first service.':'还没有服务。点击“添加服务”创建第一个服务。','No customer conversations yet.':'还没有客户对话。','Messages from Need Help will appear here.':'来自 Need Help 的消息会显示在这里。','Loading conversations…':'正在加载对话…','Conversation unavailable.':'无法获取此对话。','No messages yet.':'还没有消息。','Reply →':'回复 →','Beauty Studio':'Beauty Studio','Customer':'客户','Unnamed':'未命名','No phone':'没有电话','open':'开放','closed':'已关闭','Content Editor':'内容编辑器','Edit service':'编辑服务','Edit work':'编辑作品','Original language':'原始语言','✨ Auto translate other 2 languages':'✨ 自动翻译另外两种语言','Cancel':'取消','Translating…':'翻译中…','Save':'保存','Update booking':'更新预约','Booking status updated':'预约状态已更新','Could not update booking':'无法更新预约'
  },
  my:{
    'Overview':'အနှစ်ချုပ်','Studio Content':'စတူဒီယိုအချက်အလက်','Services':'ဝန်ဆောင်မှုများ','Gallery':'လက်ရာများ','Media':'မီဒီယာ','Bookings':'ဘွတ်ကင်များ','Messages':'မက်ဆေ့ချ်များ','Booking Rules':'ဘွတ်ကင်စည်းမျဉ်းများ','Open customer site ↗':'ဖောက်သည်ဝဘ်ဆိုဒ်ဖွင့်ရန် ↗','Language':'ဘာသာစကား','CONTROL CENTER':'ထိန်းချုပ်မှုစင်တာ','Good morning.':'မင်္ဂလာနံနက်ခင်းပါ။','Everything happening in your studio, at a glance.':'စတူဒီယိုအတွင်း ဖြစ်ပျက်နေသမျှကို တစ်နေရာတည်းမှာ ကြည့်နိုင်ပါတယ်။','Today':'ဒီနေ့',"Today's bookings":'ဒီနေ့ဘွတ်ကင်များ','Pending requests':'စောင့်ဆိုင်းနေသော တောင်းဆိုမှုများ','Unread messages':'မဖတ်ရသေးသော မက်ဆေ့ချ်များ','Customers':'ဖောက်သည်များ','Need your review':'သင့်စစ်ဆေးမှုလိုအပ်သည်','From Need Help':'Need Help မှ','Seen in bookings & messages':'ဘွတ်ကင်နှင့် မက်ဆေ့ချ်များမှ','TODAY':'ဒီနေ့',"Today's schedule":'ဒီနေ့အစီအစဉ်','View all →':'အားလုံးကြည့်ရန် →','Loading today\'s bookings…':'ဒီနေ့ဘွတ်ကင်များကို ဖွင့်နေသည်…','CUSTOMER CARE':'ဖောက်သည်ဝန်ဆောင်မှု','Recent messages':'မကြာသေးမီ မက်ဆေ့ချ်များ','Open inbox →':'မက်ဆေ့ချ်များဖွင့်ရန် →','Loading messages…':'မက်ဆေ့ချ်များကို ဖွင့်နေသည်…','RECENT ACTIVITY':'မကြာသေးမီလုပ်ဆောင်ချက်','Latest booking requests':'နောက်ဆုံးဘွတ်ကင်တောင်းဆိုမှုများ','Manage →':'စီမံရန် →','Loading activity…':'လုပ်ဆောင်ချက်များကို ဖွင့်နေသည်…','QUICK ACTIONS':'အမြန်လုပ်ဆောင်ချက်များ','Keep the studio fresh.':'စတူဒီယိုအကြောင်းအရာများကို လတ်ဆတ်နေအောင်ထားပါ။','Add a new look':'လက်ရာအသစ်ထည့်ရန်','Update a service':'ဝန်ဆောင်မှုပြင်ရန်','Replace a photo':'ဓာတ်ပုံပြောင်းရန်','Adjust availability':'ဘွတ်ကင်အချိန်ညှိရန်','Pricing & timing':'စျေးနှုန်းနှင့်ကြာချိန်','Media library':'မီဒီယာစာကြည့်တိုက်','Booking rules':'ဘွတ်ကင်စည်းမျဉ်းများ','STUDIO PROFILE':'စတူဒီယိုအချက်အလက်','These details are stored in D1 and become the single source of truth.':'ဤအချက်အလက်များကို D1 တွင်သိမ်းဆည်းထားပြီး အဓိကဒေတာအဖြစ်အသုံးပြုပါမည်။','Save changes':'ပြောင်းလဲမှုများသိမ်းရန်','Studio name':'စတူဒီယိုအမည်','City':'မြို့','Address':'လိပ်စာ','Phone':'ဖုန်း','Hours':'ဖွင့်ချိန်','Booking message':'ဘွတ်ကင်မက်ဆေ့ချ်','BRAND & LANGUAGE':'အမှတ်တံဆိပ်နှင့် ဘာသာစကား','Studio identity':'စတူဒီယိုအမည်နှင့် အချက်အလက်','Set the customer-facing studio name and contact content for English, 中文 and မြန်မာ. The customer site switches these values with its language selector.':'ဖောက်သည်ဝဘ်ဆိုဒ်တွင်ပြသမည့် စတူဒီယိုအမည်နှင့် ဆက်သွယ်ရန်အချက်အလက်များကို ဘာသာစကား ၃ မျိုးဖြင့် သတ်မှတ်နိုင်ပါသည်။','Studio name · English':'စတူဒီယိုအမည် · English','Tagline · English':'အောက်စာသား · English','Tagline · 中文':'အောက်စာသား · 中文','Tagline · မြန်မာ':'အောက်စာသား · မြန်မာ','Studio name · 中文':'စတူဒီယိုအမည် · 中文','Studio name · မြန်မာ':'စတူဒီယိုအမည် · မြန်မာ','City · English':'မြို့ · English','City · 中文':'မြို့ · 中文','City · မြန်မာ':'မြို့ · မြန်မာ','Address · English':'လိပ်စာ · English','Address · 中文':'လိပ်စာ · 中文','Address · မြန်မာ':'လိပ်စာ · မြန်မာ','Hours · English':'ဖွင့်ချိန် · English','Hours · 中文':'ဖွင့်ချိန် · 中文','Hours · မြန်မာ':'ဖွင့်ချိန် · မြန်မာ','BOOKING COPY':'ဘွတ်ကင်စာသား','This message follows the customer language selector.':'ဤစာသားသည် ဖောက်သည်ဝဘ်ဆိုဒ် ဘာသာစကားရွေးချယ်မှုနှင့်အတူ ပြောင်းလဲပါမည်။','English':'English','中文':'中文','မြန်မာ':'မြန်မာ','SERVICE MENU':'ဝန်ဆောင်မှုမီနူး','Edit the menu shown on the customer website.':'ဖောက်သည်ဝဘ်ဆိုဒ်တွင်ပြသမည့် ဝန်ဆောင်မှုမီနူးကို ပြင်ဆင်ပါ။','＋ Add service':'＋ ဝန်ဆောင်မှုထည့်ရန်','PORTFOLIO':'လက်ရာစုစည်းမှု','Manage looks, categories and descriptions. Photos remain local until R2 is available.':'လက်ရာ၊ အမျိုးအစားနှင့်ဖော်ပြချက်များကို စီမံပါ။ R2 မရသေးခင် ဓာတ်ပုံများကို ဒီဘရောက်ဆာတွင်ထားပါမည်။','＋ Add look':'＋ လက်ရာထည့်ရန်','MEDIA LIBRARY':'မီဒီယာစာကြည့်တိုက်','Media slots':'မီဒီယာနေရာများ','Temporary media stays in this browser. Cloudflare R2 can be connected later without changing these slots.':'ယာယီမီဒီယာများကို ဒီဘရောက်ဆာတွင်ထားမည်ဖြစ်ပြီး နောက်ပိုင်း Cloudflare R2 ချိတ်ဆက်လည်း နေရာများကိုပြောင်းရန်မလိုပါ။','APPOINTMENTS':'ချိန်းဆိုမှုများ','Customer requests received from the website.':'ဝဘ်ဆိုဒ်မှ ရရှိသော ဖောက်သည်ဘွတ်ကင်တောင်းဆိုမှုများ။','Refresh':'ပြန်လည်ဖွင့်ရန်','All':'အားလုံး','Pending':'စောင့်ဆိုင်းနေသည်','Confirmed':'အတည်ပြုပြီး','Completed':'ပြီးစီးပြီ','Cancelled':'ပယ်ဖျက်ပြီး','Private conversations from the Need Help button. Each conversation stays linked to the customer\'s ID.':'Need Help ခလုတ်မှ သီးသန့်စကားဝိုင်းများဖြစ်ပြီး ဖောက်သည် ID နှင့်ချိတ်ဆက်ထားပါမည်။','Select a conversation to reply.':'ပြန်စာပို့ရန် စကားဝိုင်းတစ်ခုရွေးပါ။','Control when customers can request appointments.':'ဖောက်သည်များ ဘွတ်ကင်တောင်းဆိုနိုင်သည့် အချိန်များကို ထိန်းချုပ်ပါ။','Opening time':'ဖွင့်ချိန်','Closing time':'ပိတ်ချိန်','Slot interval':'အချိန်ကွာဟချက်','15 minutes':'၁၅ မိနစ်','30 minutes':'၃၀ မိနစ်','60 minutes':'၆၀ မိနစ်','Advance days':'ကြိုတင်ဘွတ်ကင်ရက်','Minimum lead time':'အနည်းဆုံးကြိုတင်အချိန်','Booking status':'ဘွတ်ကင်အခြေအနေ','Open':'ဖွင့်ထားသည်','Paused':'ခဏရပ်ထားသည်','Customer website remains independent. Studio content, services, gallery metadata and booking rules now use D1 when saved.':'ဖောက်သည်ဝဘ်ဆိုဒ်သည် သီးခြားဖြစ်သည်။ သိမ်းဆည်းပြီးနောက် စတူဒီယိုအချက်အလက်၊ ဝန်ဆောင်မှု၊ လက်ရာနှင့် ဘွတ်ကင်စည်းမျဉ်းများကို D1 မှအသုံးပြုမည်။','Sign out':'ထွက်ရန်','Connect Admin':'Admin ချိတ်ရန်','Connecting to D1…':'D1 ချိတ်ဆက်နေသည်…','D1 connected · Admin session':'D1 ချိတ်ဆက်ပြီး · Admin session','D1 unavailable · Local fallback':'D1 မရနိုင်ပါ · Local mode','Edit':'ပြင်ရန်','Delete':'ဖျက်ရန်','Studio service':'စတူဒီယိုဝန်ဆောင်မှု','Service · Detail':'ဝန်ဆောင်မှု · အသေးစိတ်','No services yet. Click “Add service” to create the first service.':'ဝန်ဆောင်မှုမရှိသေးပါ။ “ဝန်ဆောင်မှုထည့်ရန်” ကိုနှိပ်ပါ။','No customer conversations yet.':'ဖောက်သည်စကားဝိုင်းမရှိသေးပါ။','Messages from Need Help will appear here.':'Need Help မှ မက်ဆေ့ချ်များကို ဤနေရာတွင်ပြပါမည်။','Loading conversations…':'စကားဝိုင်းများကို ဖွင့်နေသည်…','Conversation unavailable.':'စကားဝိုင်းကို မရနိုင်ပါ။','No messages yet.':'မက်ဆေ့ချ်မရှိသေးပါ။','Reply →':'ပြန်စာ →','Beauty Studio':'Beauty Studio','Customer':'ဖောက်သည်','Unnamed':'အမည်မသိ','No phone':'ဖုန်းမရှိ','open':'ဖွင့်ထား','closed':'ပိတ်ထား','Content Editor':'အကြောင်းအရာတည်းဖြတ်သူ','Edit service':'ဝန်ဆောင်မှုတည်းဖြတ်ရန်','Edit work':'လက်ရာတည်းဖြတ်ရန်','Original language':'မူရင်းဘာသာစကား','✨ Auto translate other 2 languages':'✨ ကျန်ဘာသာ ၂ မျိုးကို အလိုအလျောက်ဘာသာပြန်ရန်','Cancel':'ပယ်ဖျက်','Translating…':'ဘာသာပြန်နေသည်…','Save':'သိမ်းရန်','Update booking':'ဘွတ်ကင်ပြင်ရန်','Booking status updated':'ဘွတ်ကင်အခြေအနေပြင်ပြီး','Could not update booking':'ဘွတ်ကင်ပြင်၍မရပါ'
  }
};
function adminLanguage(){return localStorage.getItem(ADMIN_LANG_KEY)||'en'}
function resolveAdminKey(value){const v=value.trim();if(!v)return null;for(const key of Object.keys(ADMIN_I18N.en)){if(v===key||ADMIN_I18N.zh[key]===v||ADMIN_I18N.my[key]===v)return key}return null}
function translateTextNode(node,map){const raw=node.nodeValue;const key=resolveAdminKey(raw);if(!key||raw!==raw.trim())return;node.nodeValue=map[key]??key}
function applyAdminLanguage(){const lang=adminLanguage(),map=ADMIN_I18N[lang]||ADMIN_I18N.en;document.documentElement.lang=lang==='zh'?'zh-CN':lang==='my'?'my-MM':'en';const select=document.querySelector('#adminLanguage');if(select)select.value=lang;const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{if(!n.parentElement?.closest('script,style,option'))translateTextNode(n,map)})}
function initAdminLanguage(){const select=document.querySelector('#adminLanguage');if(!select)return;select.value=adminLanguage();select.addEventListener('change',()=>{localStorage.setItem(ADMIN_LANG_KEY,select.value);applyAdminLanguage()});applyAdminLanguage();if(!window.__adminLanguageObserver){window.__adminLanguageObserver=new MutationObserver(()=>applyAdminLanguage());window.__adminLanguageObserver.observe(document.body,{childList:true,subtree:true})}}

function bindBookingUI(){
  $('#refreshBookings')?.addEventListener('click',loadBookings);
  $$('#bookingFilters [data-booking-filter]').forEach(btn=>btn.onclick=()=>{
    bookingFilter=btn.dataset.bookingFilter;
    $$('#bookingFilters [data-booking-filter]').forEach(x=>x.classList.toggle('active',x===btn));
    renderBookings();
  });
}
bindBookingUI();

initAdminLanguage();
openLogin();
renderServices();renderGallery();renderMedia();updateStats();loadDashboard();loadRemote();
