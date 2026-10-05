import {mkdirSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {previewBrands} from '../../src/data/brandDirectory.js';
mkdirSync('.qa',{recursive:true});
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://qa.local/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','location','HTMLElement','Element','Node','Event','MouseEvent','CustomEvent'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.BroadcastChannel=undefined;
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.confirm=()=>true;window.scrollTo=()=>{};
let brands=previewBrands.map(brand=>({...brand,departments:[...brand.departments]})),actions=[],connected=false,environmentManaged=false;
const settings={username:'store.qa',profile_url:'https://www.instagram.com/store.qa/',reels_to_display:10,is_enabled:false,autoplay_enabled:true,autoplay_interval_seconds:5,desktop_cards:4,mobile_cards:1.2};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input.url),method=init?.method||'GET',body=init?.body?JSON.parse(init.body):null;
 assert.equal(url.hostname,'ipqcxqsjzkbtxpljvdcy.supabase.co');
 let response;
 if(url.pathname==='/rest/v1/brands'){
  const id=url.searchParams.get('id')?.replace(/^eq\./,'');
  if(method==='PATCH'){const brand=brands.find(brand=>brand.id===id);Object.assign(brand,body);response=brand;}
  else if(method==='DELETE'){brands=brands.filter(brand=>brand.id!==id);response=[{id}];}
  else if(method==='POST'){const brand={id:'qa-created-brand',...body};brands.push(brand);response=brand;}
  else response=brands;
 }else if(url.pathname==='/rest/v1/instagram_reels'||url.pathname==='/rest/v1/products')response=[];
 else if(url.pathname==='/functions/v1/instagram-feed'){
  actions.push(body);
  if(body.action==='status')response={connected,connection_source:environmentManaged?'environment':'admin',username:connected?'store.qa':null,settings,meta_configured:false};
  else if(body.action==='save-settings'){Object.assign(settings,body);response={saved:true};}
  else if(body.action==='connect-token'){connected=true;response={connected:true,username:'store.qa'};}
  else if(body.action==='refresh')response={refreshed:2};
  else throw new Error('Unexpected admin action: '+body.action);
 }else throw new Error('Unexpected mocked endpoint: '+url.pathname);
 return new Response(JSON.stringify(response),{headers:{'Content-Type':'application/json'}});
};
await build({entryPoints:['tests/runtime/ui-entry.jsx'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/ui-management.cjs',external:['react','react-dom','react-dom/client','react-router-dom'],loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({VITE_STORE_PREVIEW:'false'})},jsx:'automatic'});
const require=createRequire(import.meta.url),React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{TestManagement}=require('../../.qa/ui-management.cjs');
const root=createRoot(document.getElementById('root'));let count=0;
async function settle(){await new Promise(resolve=>setTimeout(resolve,5));}
async function render(page){await act(async()=>{root.render(React.createElement(TestManagement,{page,key:page}));await settle();});await act(settle);}
async function click(element){assert.ok(element);await act(async()=>{element.click();await settle();});await act(settle);}
async function input(element,value){assert.ok(element);await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));await settle();});}
async function submit(form){await act(async()=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await settle();});await act(settle);}
function ok(label,value){assert.ok(value,label);count++;console.log('PASS',label);}
await render('brands');ok('Admin brand directory loads eighteen editable categories',document.querySelectorAll('.sf-brand-admin-grid article').length===18);
await click(document.querySelector('[aria-label="Edit Nike"]'));await input(document.querySelector('.sf-brand-editor input[maxlength="80"]'),'Nike Studio');await submit(document.querySelector('.sf-brand-editor form'));
ok('Saving a renamed brand persists and refreshes the admin list',brands[0].name==='Nike Studio'&&Boolean(document.querySelector('[aria-label="Edit Nike Studio"]')));
await click(document.querySelector('[aria-label="Edit Nike Studio"]'));await click([...document.querySelectorAll('.sf-brand-admin-departments label')].find(label=>label.textContent==='Kids').querySelector('input'));await submit(document.querySelector('.sf-brand-editor form'));
ok('Department selections persist without removing the other departments',brands[0].departments.join(',')==='men,women');
await click(document.querySelector('[aria-label="Delete Nike Studio"]'));ok('Deleting a category removes it from the managed directory',brands.length===17&&!document.querySelector('[aria-label="Delete Nike Studio"]'));
await render('instagram');ok('Instagram connection accepts a masked token without a configured Meta OAuth app',document.querySelector('.sf-ig-token-form input[type="password"]')&&document.querySelector('.admin-ig-connection__actions button').disabled);
const token='qa-manual-instagram-token-for-an-isolated-component-test';await input(document.querySelector('.sf-ig-token-form input[type="password"]'),token);await submit(document.querySelector('.sf-ig-token-form'));
ok('Connecting a token saves settings, submits it to the Edge Function and refreshes media',actions.some(action=>action.action==='connect-token'&&action.access_token===token)&&actions.some(action=>action.action==='refresh')&&connected);
ok('After connection the token is cleared from the form and never stored in localStorage',document.querySelector('.sf-ig-token-form input[type="password"]').value===''&&!JSON.stringify({...localStorage}).includes(token));
ok('Connected account status updates in the same admin screen',document.querySelector('#admin-ig-connection-title').textContent==='Connected as @store.qa');
environmentManaged=true;await render('brands');await render('instagram');
ok('An environment-managed account shows secret setup guidance and keeps only valid connection actions',!document.querySelector('.sf-ig-token-form')&&document.querySelector('.admin-ig-connection__notice').textContent.includes('INSTAGRAM_FEED_ENABLED=false')&&document.querySelectorAll('.admin-ig-connection__actions button').length===1&&document.querySelector('.admin-ig-settings__toggle input').disabled);
await act(async()=>root.unmount());console.log('ADMIN COMPONENT CHECKS PASSED:',count);
