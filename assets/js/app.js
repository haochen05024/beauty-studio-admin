const API_BASE='https://beauty-studio-api.haochen05024.workers.dev';
const LOCAL_KEY='beautyStudioAdminV3Local';
let adminToken='';

const seed={
  content:{studioName:'Beauty Studio',city:'Your City',address:'Studio address coming soon',phone:'+00 000 000 000',hours:'By appointment',tiktok:'',whatsapp:'',telegram:'',bookingMessage:'Appointments are confirmed after your request is reviewed.'},
  services:[
    {id:'gel',name:'Gel Manicure',nameZh:'凝胶美甲',nameMy:'ဂျယ်လ် လက်သည်းအလှပြင်',price:'From 00 MMK',duration:60,description:'Clean, glossy and effortless.',descriptionZh:'干净、精致且持久的日常美甲。',descriptionMy:'နေ့စဉ်အတွက် သန့်ရှင်းသပ်ရပ်ပြီး ကြာရှည်ခံတဲ့ လက်သည်းအလှပြင်။'},
    {id:'art',name:'Custom Nail Art',nameZh:'定制美甲',nameMy:'စိတ်ကြိုက် လက်သည်းအလှဒီဇိုင်း',price:'From 00 MMK',duration:90,description:'Personal details made for you.',descriptionZh:'为你定制的颜色、设计与细节。',descriptionMy:'သင့်အတွက် စိတ်ကြိုက်အရောင်၊ ဒီဇိုင်းနဲ့ အသေးစိတ်များ။'},
    {id:'extensions',name:'Extensions',nameZh:'延长甲',nameMy:'လက်သည်းတိုးချဲ့ခြင်း',price:'From 00 MMK',duration:120,description:'Length with a polished finish.',descriptionZh:'围绕你的自然风格打造漂亮的长度与甲型。',descriptionMy:'သင့်စတိုင်နဲ့လိုက်ဖက်တဲ့ လှပတဲ့အရှည်နဲ့ ပုံစံကို ဖန်တီးပေးပါတယ်。'}
  ],
  gallery:[
    {id:1,title:'Soft Pearl',titleZh:'柔光珍珠',titleMy:'ပျော့ပျောင်း ပုလဲအလင်း',category:'Elegant',categoryZh:'优雅',categoryMy:'လှပသပ်ရပ်',description:'Soft, clean pearl glow.',image:''},
    {id:2,title:'Milky Nude',titleZh:'奶油裸色',titleMy:'နို့ရောင် Nude',category:'Simple',categoryZh:'简约',categoryMy:'ရိုးရှင်း',description:'Quiet and wearable.',image:''},
    {id:3,title:'Rose Chrome',titleZh:'玫瑰镜面',titleMy:'Rose Chrome',category:'Trendy',categoryZh:'潮流',categoryMy:'ခေတ်မီ',description:'A polished rose-metal finish.',image:''},
    {id:4,title:'Little Hearts',titleZh:'小心心',titleMy:'နှလုံးသားလေးများ',category:'Cute',categoryZh:'可爱',categoryMy:'ချစ်စရာ',description:'Tiny details with a playful mood.',image:''},
    {id:5,title:'Quiet Luxury',titleZh:'静奢',titleMy:'အေးချမ်းခမ်းနားမှု',category:'Elegant',categoryZh:'优雅',categoryMy:'လှပသပ်ရပ်',description:'Minimal, refined and timeless.',image:''}
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
    if(ok){wrap.remove();setAdminLocked(false);setApiStatus(true,'D1 connected · Admin session');toast('Admin connected');}
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
    const [c,s,g,b]=await Promise.all([
      apiGet('/api/content/settings'),
      apiGet('/api/content/services'),
      apiGet('/api/content/gallery'),
      apiGet('/api/content/booking-rules')
    ]);
    if(c.ok && c.body.data) data.content={...data.content,...c.body.data};
    if(s.ok && Array.isArray(s.body.data)) data.services=s.body.data;
    if(g.ok && Array.isArray(g.body.data)){
      const oldImages=new Map(data.gallery.map(x=>[String(x.id),x.image||'']));
      data.gallery=g.body.data.map(x=>({...x,image:oldImages.get(String(x.id))||''}));
    }
    if(b.ok && b.body.data) data.booking={...data.booking,...b.body.data};
    cacheLocal();
    setApiStatus(true,token()?'D1 connected · Admin session':'D1 connected · Read-only');
    fillContent();fillBooking();renderServices();renderGallery();updateStats();
    if(!token()) openLogin();
  }catch(e){
    setApiStatus(false,'D1 unavailable · Local fallback');
    toast('D1 could not be reached · using local fallback');
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
}
$$('.nav-item').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$$('[data-go]').forEach(b=>b.onclick=()=>showView(b.dataset.go));
$('#menu').onclick=()=>$('#sidebar').classList.toggle('open');
$('#preview').onclick=()=>toast('Customer site preview will be connected next.');

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

function renderServices(){
  $('#serviceList').innerHTML=data.services.map((s,i)=>`
  <div class="service-row">
    <div><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p></div>
    <div class="service-meta">${esc(s.price)}</div>
    <div class="service-meta">${s.duration} min</div>
    <button class="mini" data-edit-service="${i}">Edit</button>
    <button class="mini danger" data-delete-service="${i}">Delete</button>
  </div>`).join('');
  $$('[data-edit-service]').forEach(b=>b.onclick=()=>editService(+b.dataset.editService));
  $$('[data-delete-service]').forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.deleteService, s=data.services[i];
    if(await confirmUI('Delete service?',`Delete "${s.name}" from the service menu? This change will be saved to D1.`)){
      data.services.splice(i,1);renderServices();updateStats();await saveRemote('services');
    }
  });
}
async function editService(i){
  const s=data.services[i];
  const values=await localizedEditor('Edit service',[['name','English name',s.name||''],['nameZh','中文名称',s.nameZh||''],['nameMy','မြန်မာအမည်',s.nameMy||''],['description','English description',s.description||''],['descriptionZh','中文描述',s.descriptionZh||''],['descriptionMy','မြန်မာဖော်ပြချက်',s.descriptionMy||'']]); if(!values)return;
  const price=await customField('Edit service','Price',s.price);if(price===null)return;
  const duration=Number(await customField('Edit service','Duration (minutes)',s.duration));if(!Number.isFinite(duration)||duration<=0){toast('Duration must be a positive number');return}
  Object.assign(s,values,{price,duration});renderServices();updateStats();await saveRemote('services');
}
$('#addService').onclick=async()=>{
  const values=await localizedEditor('Add service',[['name','English name','New Service'],['nameZh','中文名称','新服务'],['nameMy','မြန်မာအမည်','ဝန်ဆောင်မှုအသစ်'],['description','English description','Add a short description.'],['descriptionZh','中文描述','添加简短描述。'],['descriptionMy','မြန်မာဖော်ပြချက်','အတိုချုံးဖော်ပြချက် ထည့်ပါ။']]); if(!values)return;
  const price=await customField('Add service','Price','From 00 MMK');if(price===null)return;const duration=Number(await customField('Add service','Duration (minutes)',60));if(!Number.isFinite(duration)||duration<=0){toast('Duration must be a positive number');return}
  data.services.push({id:'service-'+Date.now(),...values,price,duration});renderServices();updateStats();await saveRemote('services');
};

function renderGallery(){
  $('#galleryGrid').innerHTML=data.gallery.map((g,i)=>`
  <article class="gallery-card">
    <div class="gallery-img" style="${g.image?`background-image:url('${g.image}')`:''}">
      <span class="image-badge">${g.image?'PHOTO':'NO PHOTO'}</span>
    </div>
    <div class="gallery-body">
      <h3>${esc(g.title)}</h3><p>${esc(g.category)} · ${esc(g.description)}</p>
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
  const g=data.gallery[i];
  const values=await localizedEditor('Edit look',[['title','English title',g.title||''],['titleZh','中文标题',g.titleZh||''],['titleMy','မြန်မာခေါင်းစဉ်',g.titleMy||''],['category','English category',g.category||'Simple'],['categoryZh','中文分类',g.categoryZh||''],['categoryMy','မြန်မာအမျိုးအစား',g.categoryMy||''],['description','English description',g.description||''],['descriptionZh','中文描述',g.descriptionZh||''],['descriptionMy','မြန်မာဖော်ပြချက်',g.descriptionMy||'']]); if(!values)return;
  Object.assign(g,values);renderGallery();await saveRemote('gallery');
}
$('#addGallery').onclick=async()=>{
  const values=await localizedEditor('Add look',[['title','English title','New Look'],['titleZh','中文标题','新作品'],['titleMy','မြန်မာခေါင်းစဉ်','လက်ရာအသစ်'],['category','English category','Simple'],['categoryZh','中文分类','简约'],['categoryMy','မြန်မာအမျိုးအစား','ရိုးရှင်း'],['description','English description','Add a description.'],['descriptionZh','中文描述','添加作品描述。'],['descriptionMy','မြန်မာဖော်ပြချက်','လက်ရာဖော်ပြချက် ထည့်ပါ။']]); if(!values)return;
  data.gallery.push({id:Date.now(),...values,image:''});renderGallery();updateStats();await saveRemote('gallery');
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
  $('#statServices').textContent=data.services.length;
  $('#statGallery').textContent=data.gallery.length;
  $('#statBooking').textContent=data.booking.status==='open'?'Open':'Paused';
}
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
function localizedEditor(title,fields){
  ensureDialogStyles();
  return new Promise(resolve=>{

    const st=document.createElement('style');st.textContent='.v3-localized-dialog{width:min(720px,calc(100vw - 32px))}.v3-localized-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;text-align:left}.v3-localized-grid label{display:flex;flex-direction:column;gap:6px;font-size:11px;color:#806b62}.v3-localized-grid input{width:100%;box-sizing:border-box;border:1px solid #ddd0c8;border-radius:10px;padding:10px;background:#fffaf7;color:#342722}@media(max-width:700px){.v3-localized-grid{grid-template-columns:1fr}}';document.head.appendChild(st);
    const d=document.createElement('div');d.className='v3-dialog-backdrop';
    d.innerHTML=`<div class="v3-dialog v3-localized-dialog"><h3>${esc(title)}</h3><p>Prepare English, 中文 and မြန်မာ text for the customer website.</p><div class="v3-localized-grid">${fields.map(([key,label,value])=>`<label><span>${esc(label)}</span><input data-local-key="${esc(key)}" value="${esc(value)}"></label>`).join('')}</div><div class="v3-dialog-actions"><button class="ok">Save</button><button class="cancel">Cancel</button></div></div>`;
    document.body.appendChild(d);d.querySelector('input')?.focus();
    d.querySelector('.ok').onclick=()=>{const out={};d.querySelectorAll('[data-local-key]').forEach(i=>out[i.dataset.localKey]=i.value.trim());d.remove();resolve(out)};
    d.querySelector('.cancel').onclick=()=>{d.remove();resolve(null)};
    d.addEventListener('keydown',e=>{if(e.key==='Escape')d.querySelector('.cancel')?.click()});
  });
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

function bindBookingUI(){
  $('#refreshBookings')?.addEventListener('click',loadBookings);
  $$('#bookingFilters [data-booking-filter]').forEach(btn=>btn.onclick=()=>{
    bookingFilter=btn.dataset.bookingFilter;
    $$('#bookingFilters [data-booking-filter]').forEach(x=>x.classList.toggle('active',x===btn));
    renderBookings();
  });
}
bindBookingUI();

installLoginUI;
renderServices();renderGallery();renderMedia();updateStats();loadRemote();

/* v73 — Customer Center + Need Help admin inbox */
(() => {
  let customerRows = [];
  let selectedCustomerKey = '';
  let customerFilter = 'all';
  let selectedConversation = null;

  const escC = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtC = t => { try { return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(t)); } catch { return t || '—'; } };

  function customerStyles(){
    if($('#customerCenterStyles')) return;
    const s=document.createElement('style');s.id='customerCenterStyles';s.textContent=`
      #view-customers .customer-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0 14px;flex-wrap:wrap}
      #view-customers .customer-filters{display:flex;gap:7px;flex-wrap:wrap}
      #view-customers .customer-filters button{border:1px solid #dfd1c8;background:#fffaf6;color:#5f514b;border-radius:999px;padding:8px 13px;cursor:pointer;font-size:12px}
      #view-customers .customer-filters button.active{background:#302621;color:#fff;border-color:#302621}
      .customer-admin-layout{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(360px,1.35fr);gap:16px;align-items:start}
      .customer-admin-list{display:grid;gap:10px}
      .customer-card{border:1px solid #dfd1c8;background:#fffaf6;border-radius:18px;padding:15px 16px;cursor:pointer;transition:.18s ease;box-shadow:0 7px 24px rgba(55,35,28,.04)}
      .customer-card:hover,.customer-card.active{border-color:#b88b80;transform:translateY(-1px);box-shadow:0 12px 30px rgba(55,35,28,.08)}
      .customer-card-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.customer-card h3{margin:0;font:500 18px Georgia,serif;color:#302621}.customer-card-id{font-size:9px;letter-spacing:.14em;color:#9b6c69;font-weight:700}.customer-card p{margin:6px 0 0;color:#81746d;font-size:11px;line-height:1.55}.customer-card-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.customer-pill{font-size:9px;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:5px 8px;background:#f2e7df;color:#725b53}.customer-pill.unread{background:#9b6c69;color:#fff}.customer-pill.open{background:#e5eee1;color:#5e7555}.customer-pill.closed{background:#ece9e7;color:#756b66}
      .customer-detail-panel{position:sticky;top:16px;border:1px solid #dfd1c8;background:#fffaf6;border-radius:22px;min-height:520px;overflow:hidden;box-shadow:0 10px 35px rgba(55,35,28,.05)}
      .customer-detail-empty{min-height:520px;display:grid;place-items:center;text-align:center;padding:30px;color:#81746d;font-size:12px}
      .customer-detail-head{padding:19px 20px 15px;border-bottom:1px solid #eaded7;display:flex;justify-content:space-between;gap:12px}.customer-detail-head h3{margin:2px 0 3px;font:500 24px Georgia,serif;color:#302621}.customer-detail-head p{margin:0;color:#81746d;font-size:11px}.customer-detail-close{width:32px;height:32px;border:1px solid #dfd1c8;border-radius:50%;background:#f3e9e3;color:#5f514b;cursor:pointer}
      .customer-detail-tabs{display:flex;gap:7px;padding:12px 18px;border-bottom:1px solid #eaded7}.customer-detail-tabs button{border:1px solid #dfd1c8;background:#fff;color:#665851;border-radius:999px;padding:7px 11px;font-size:10px;cursor:pointer}.customer-detail-tabs button.active{background:#302621;color:#fff;border-color:#302621}
      .customer-detail-body{padding:16px}.customer-booking-row{padding:12px;border:1px solid #e5d8d1;border-radius:14px;background:#fff;margin-bottom:8px}.customer-booking-row strong{display:block;color:#302621;font-size:13px}.customer-booking-row small{display:block;color:#81746d;font-size:10px;margin-top:4px}.customer-booking-status{display:inline-block;margin-top:7px;padding:4px 7px;border-radius:999px;font-size:8px;text-transform:uppercase;letter-spacing:.08em}.customer-booking-status.pending{background:#f2e7d9;color:#8c654f}.customer-booking-status.confirmed{background:#e4eee1;color:#59714f}.customer-booking-status.completed{background:#e6e8ed;color:#59606d}.customer-booking-status.cancelled{background:#f2dfdc;color:#975e58}
      .support-admin-chat{height:350px;border:1px solid #e5d8d1;border-radius:17px;overflow:hidden;display:flex;flex-direction:column;background:#fbf5f0}.support-admin-messages{flex:1;overflow:auto;padding:13px;display:flex;flex-direction:column;gap:8px}.support-admin-message{max-width:82%;padding:9px 11px;border-radius:14px;display:grid;gap:3px}.support-admin-message.customer{align-self:flex-start;background:#fff;color:#302621;border:1px solid #e5d8d1;border-bottom-left-radius:4px}.support-admin-message.admin{align-self:flex-end;background:#302621;color:#fffaf6;border-bottom-right-radius:4px}.support-admin-message small{font-size:8px;opacity:.65}.support-admin-message p{margin:0;font-size:11px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.support-admin-compose{display:flex;gap:7px;padding:9px;border-top:1px solid #e5d8d1;background:#fffaf6}.support-admin-compose textarea{flex:1;resize:none;border:1px solid #dfd1c8;border-radius:12px;padding:9px 10px;font:inherit;font-size:11px;min-height:40px}.support-admin-compose button{border:0;border-radius:12px;background:#302621;color:#fff;padding:0 13px;font-size:10px;font-weight:700;cursor:pointer}.support-admin-compose button:disabled{opacity:.55}
      .customer-detail-section-title{margin:0 0 10px;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#9b6c69;font-weight:700}.customer-detail-contact{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:17px}.customer-detail-contact>div{padding:10px 11px;background:#f4ebe6;border-radius:12px}.customer-detail-contact small{display:block;color:#9a8981;font-size:8px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px}.customer-detail-contact strong{display:block;color:#302621;font-size:11px;word-break:break-word}
      @media(max-width:900px){.customer-admin-layout{grid-template-columns:1fr}.customer-detail-panel{position:relative;top:auto}.customer-detail-contact{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function normalizeSupport(row){ return {...row, customerNumber:row.customer_number||'', customerKey:row.customer_browser_key||'', customerName:row.customer_name||'Unnamed customer', phone:row.customer_phone||''}; }
  function buildCustomers(bookings, conversations){
    const map=new Map();
    (bookings||[]).forEach(b=>{
      const key=b.customerBrowserKey||b.customer_browser_key||`number:${b.customerNumber||b.customer_number||b.phone||b.customerName}`;
      const id=b.customerNumber||b.customer_number||'';
      const cur=map.get(key)||{customerKey:key,customerNumber:id,customerName:b.customerName||b.customer_name||'Unnamed customer',phone:b.phone||'',bookings:[],conversation:null,lastActivity:b.createdAt||b.created_at||''};
      cur.bookings.push(b);cur.customerNumber=cur.customerNumber||id;cur.customerName=cur.customerName==='Unnamed customer'?(b.customerName||'Unnamed customer'):cur.customerName;cur.phone=cur.phone||b.phone||'';cur.lastActivity=[cur.lastActivity,b.updatedAt||b.updated_at||b.createdAt||b.created_at||''].sort().pop()||'';map.set(key,cur);
    });
    (conversations||[]).forEach(raw=>{
      const c=normalizeSupport(raw);const key=c.customerKey||`number:${c.customerNumber}`;const cur=map.get(key)||{customerKey:key,customerNumber:c.customerNumber,customerName:c.customerName||'Unnamed customer',phone:c.phone||'',bookings:[],conversation:null,lastActivity:c.updated_at||''};cur.conversation=c;cur.customerNumber=cur.customerNumber||c.customerNumber;cur.customerName=cur.customerName==='Unnamed customer'?(c.customerName||'Unnamed customer'):cur.customerName;cur.phone=cur.phone||c.phone||'';cur.lastActivity=[cur.lastActivity,c.updated_at||''].sort().pop()||'';map.set(key,cur);
    });
    return [...map.values()].sort((a,b)=>String(b.lastActivity).localeCompare(String(a.lastActivity)));
  }

  async function loadCustomerCenter(){
    customerStyles();
    const list=$('#customerList'),count=$('#customerCount');if(!list||!count)return;
    list.innerHTML='<div class="booking-empty">Loading customers…</div>';
    try{
      const [br,cr]=await Promise.all([apiGet('/api/bookings?limit=100&t='+Date.now()),apiGet('/api/support/conversations?t='+Date.now())]);
      const bookings=br.ok&&Array.isArray(br.body?.data)?br.body.data:[];
      const conversations=cr.ok&&Array.isArray(cr.body?.data)?cr.body.data:[];
      customerRows=buildCustomers(bookings,conversations);
      renderCustomerList();
      if(selectedCustomerKey){const found=customerRows.find(x=>x.customerKey===selectedCustomerKey);if(found)await selectCustomer(found,true);}
    }catch(e){list.innerHTML='<div class="booking-empty">Unable to load customers. Please refresh.</div>';count.textContent='0 customers'}
  }

  function renderCustomerList(){
    const list=$('#customerList'),count=$('#customerCount');if(!list||!count)return;
    const rows=customerRows.filter(c=>customerFilter==='all'?true:customerFilter==='open'?c.conversation?.status==='open':Number(c.conversation?.unread_admin||0)>0);
    count.textContent=`${rows.length} customer${rows.length===1?'':'s'}`;
    if(!rows.length){list.innerHTML=`<div class="booking-empty">${customerRows.length?'No customers match this filter.':'No customers yet.'}</div>`;return;}
    list.innerHTML=rows.map(c=>`<article class="customer-card ${c.customerKey===selectedCustomerKey?'active':''}" data-customer-key="${escC(c.customerKey)}"><div class="customer-card-top"><div><span class="customer-card-id">CUSTOMER ${escC(c.customerNumber||'—')}</span><h3>${escC(c.customerName||'Unnamed customer')}</h3></div><span class="customer-card-id">${escC(fmtC(c.lastActivity))}</span></div><p>${escC(c.phone||'No phone')} · ${c.bookings.length} booking${c.bookings.length===1?'':'s'}</p><div class="customer-card-meta">${c.conversation?.status?`<span class="customer-pill ${escC(c.conversation.status)}">${escC(c.conversation.status)} chat</span>`:''}${Number(c.conversation?.unread_admin||0)>0?`<span class="customer-pill unread">${Number(c.conversation.unread_admin)} unread</span>`:''}</div></article>`).join('');
    $$('#customerList [data-customer-key]').forEach(el=>el.onclick=()=>{const c=customerRows.find(x=>x.customerKey===el.dataset.customerKey);if(c)selectCustomer(c)});
  }

  async function selectCustomer(c,quiet=false){
    selectedCustomerKey=c.customerKey;renderCustomerList();
    const detail=$('#customerDetail');if(!detail)return;
    detail.innerHTML=`<div class="customer-detail-head"><div><span class="customer-card-id">CUSTOMER ${escC(c.customerNumber||'—')}</span><h3>${escC(c.customerName||'Unnamed customer')}</h3><p>${escC(c.phone||'No phone')}</p></div><button class="customer-detail-close" id="closeCustomerDetail">×</button></div><div class="customer-detail-tabs"><button class="active" data-customer-tab="overview">Overview</button><button data-customer-tab="chat">Need Help</button></div><div class="customer-detail-body" id="customerDetailBody"><div class="customer-detail-contact"><div><small>Customer ID</small><strong>${escC(c.customerNumber||'—')}</strong></div><div><small>Bookings</small><strong>${c.bookings.length}</strong></div></div><p class="customer-detail-section-title">Booking history</p>${c.bookings.length?c.bookings.map(b=>`<div class="customer-booking-row"><strong>${escC(b.service||'Service')}</strong><small>${escC(formatBookingDate(b.bookingDate||b.booking_date))} · ${escC(b.bookingTime||b.booking_time)} · ${escC(b.price||'Price on request')}</small><span class="customer-booking-status ${escC(b.status||'pending')}">${escC(b.status||'pending')}</span></div>`).join(''):'<div class="booking-empty">No bookings yet.</div>'}</div>`;
    $('#closeCustomerDetail').onclick=()=>{selectedCustomerKey='';renderCustomerList();detail.innerHTML='<div class="customer-detail-empty">Select a customer to view bookings and messages.</div>'};
    $$('#customerDetail [data-customer-tab]').forEach(btn=>btn.onclick=()=>{ $$('#customerDetail [data-customer-tab]').forEach(x=>x.classList.toggle('active',x===btn)); if(btn.dataset.customerTab==='chat')renderCustomerChat(c); else selectCustomer(c,true); });
    if(!quiet && c.conversation?.unread_admin) await markAdminConversationRead(c.customerKey);
  }

  async function markAdminConversationRead(key){
    // Reading is done server-side by the admin conversation GET so the badge is cleared when opened.
    try{await apiGet('/api/support/conversation/'+encodeURIComponent(key)+'?markRead=1');}catch{}
    const c=customerRows.find(x=>x.customerKey===key);if(c?.conversation)c.conversation.unread_admin=0;renderCustomerList();
  }

  async function renderCustomerChat(c){
    const body=$('#customerDetailBody');if(!body)return;
    body.innerHTML='<div class="booking-empty">Loading conversation…</div>';
    try{
      const r=await apiGet('/api/support/conversation/'+encodeURIComponent(c.customerKey)+'?t='+Date.now());
      if(!r.ok){body.innerHTML='<div class="booking-empty">Could not load this conversation.</div>';return;}
      selectedConversation=r.body;
      const messages=Array.isArray(r.body?.messages)?r.body.messages:[];
      body.innerHTML=`<p class="customer-detail-section-title">Need Help · Customer ${escC(r.body.customerNumber||c.customerNumber||'—')}</p><div class="support-admin-chat"><div class="support-admin-messages" id="supportAdminMessages">${messages.length?messages.map(m=>`<article class="support-admin-message ${m.sender_type==='admin'?'admin':'customer'}"><small>${m.sender_type==='admin'?'Beauty Studio':'Customer'} · ${escC(fmtC(m.created_at))}</small><p>${escC(m.message)}</p></article>`).join(''):'<div class="customer-detail-empty" style="min-height:180px">No messages yet.</div>'}</div><form class="support-admin-compose" id="supportAdminCompose"><textarea id="supportAdminInput" placeholder="Reply to this customer…" maxlength="2000"></textarea><button type="submit">Reply</button></form></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="mini" id="toggleConversationStatus">${r.body.conversation?.status==='closed'?'Reopen conversation':'Close conversation'}</button></div>`;
      const box=$('#supportAdminMessages');if(box)box.scrollTop=box.scrollHeight;
      $('#supportAdminCompose').onsubmit=async e=>{e.preventDefault();const input=$('#supportAdminInput'),btn=e.currentTarget.querySelector('button'),message=input.value.trim();if(!message)return;btn.disabled=true;try{const rr=await apiFetch('/api/support/messages',{method:'POST',body:JSON.stringify({customerKey:c.customerKey,message})});if(rr.ok){input.value='';await renderCustomerChat(c);await loadCustomerCenter();}else toast(rr.status===401?'ADMIN_TOKEN rejected':'Could not send reply');}catch{toast('Network error · Worker unavailable')}finally{btn.disabled=false}};
      $('#toggleConversationStatus').onclick=async()=>{const next=r.body.conversation?.status==='closed'?'open':'closed';const rr=await apiPut('/api/support/conversation/'+encodeURIComponent(c.customerKey),{status:next});if(rr.ok){toast(next==='closed'?'Conversation closed':'Conversation reopened');await loadCustomerCenter();await renderCustomerChat(c)}else toast('Could not update conversation')};
      await markAdminConversationRead(c.customerKey);
    }catch(e){body.innerHTML='<div class="booking-empty">Could not load this conversation.</div>'}
  }

  function bindCustomerCenter(){
    $('#refreshCustomers')?.addEventListener('click',loadCustomerCenter);
    $$('#customerFilters [data-customer-filter]').forEach(btn=>btn.onclick=()=>{customerFilter=btn.dataset.customerFilter;$$('#customerFilters [data-customer-filter]').forEach(x=>x.classList.toggle('active',x===btn));renderCustomerList()});
  }

  const originalShowView=window.showView;
  // showView is a local function in the existing script, so patch the nav behavior directly.
  $$('.nav-item[data-view="customers"]').forEach(btn=>btn.onclick=()=>{showView('customers');loadCustomerCenter()});
  $('#refreshCustomers')?.addEventListener('click',loadCustomerCenter);
  $$('#customerFilters [data-customer-filter]').forEach(btn=>btn.onclick=()=>{customerFilter=btn.dataset.customerFilter;$$('#customerFilters [data-customer-filter]').forEach(x=>x.classList.toggle('active',x===btn));renderCustomerList()});
  window.__beautyStudioLoadCustomers=loadCustomerCenter;
  customerStyles();
})();
