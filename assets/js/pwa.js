(()=>{
const btn=document.getElementById('installAppBtn');
const modal=document.getElementById('installModal');
const platform=document.getElementById('installPlatform');
const now=document.getElementById('installNow');
let deferredPrompt=null;
const ua=navigator.userAgent||'';
const isIOS=/iPhone|iPad|iPod/i.test(ua);
const isAndroid=/Android/i.test(ua);
const isMac=/Macintosh|Mac OS X/i.test(ua);
const isWindows=/Windows/i.test(ua);
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
function showModal(){ if(!modal)return; modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); renderInstructions(); }
function hideModal(){ if(!modal)return; modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); }
function renderInstructions(){
 let title='',steps=[];
 if(deferredPrompt){ title='Install Beauty Studio Admin'; steps=['Tap “Install now” to add the Admin app to this device.']; now.hidden=false; }
 else if(isIOS){ title='iPhone / iPad'; steps=['Open this page in Safari.','Tap the Share button.','Choose “Add to Home Screen”.','Tap Add.']; now.hidden=true; }
 else if(isAndroid){ title='Android'; steps=['Open this page in Chrome.','Tap the ⋮ menu.','Choose “Add to Home screen” or “Install app”.','Confirm the installation.']; now.hidden=true; }
 else if(isMac){ title='Mac'; steps=['In Safari, use Share → Add to Dock, if available.','In Chrome or Edge, use the install icon/menu → Install Beauty Studio Admin.']; now.hidden=true; }
 else if(isWindows){ title='Windows'; steps=['Open this page in Chrome or Edge.','Use the install icon or ⋮ menu.','Choose “Install Beauty Studio Admin”.']; now.hidden=true; }
 else { title='Install on your device'; steps=['Use your browser menu and look for “Install app”, “Add to Home screen”, or “Add to Dock”.']; now.hidden=true; }
 platform.innerHTML='<h3>'+title+'</h3><ol>'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol>';
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;if(btn){btn.hidden=false;}});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;if(btn)btn.hidden=true;hideModal();});
if(btn){btn.hidden=isStandalone;btn.addEventListener('click',showModal);}
if(modal){modal.querySelectorAll('[data-install-close]').forEach(x=>x.addEventListener('click',hideModal));}
if(now){now.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;now.hidden=true;});}
// Show the install entry point on platforms where the browser does not expose beforeinstallprompt.
if(btn&&!isStandalone&&!deferredPrompt)btn.hidden=false;
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
