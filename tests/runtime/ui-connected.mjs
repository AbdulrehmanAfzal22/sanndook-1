// Exercise the configured frontend with mocked HTTP responses. No request
// leaves this process, and this suite never creates live users or sends email.
import {mkdirSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {previewBrands} from '../../src/data/brandDirectory.js';
mkdirSync('.qa',{recursive:true});
const dom=new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>',{url:'http://qa.local/',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','location','HTMLElement','Element','Node','Event','MouseEvent','CustomEvent','FormData'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
// jsdom has no browser BroadcastChannel. Node's implementation would retain a
// process handle after the React app unmounts.
globalThis.BroadcastChannel=undefined;
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);globalThis.IS_REACT_ACT_ENVIRONMENT=true;
window.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});window.scrollTo=()=>{};
// jsdom does not implement media playback; emulate only its DOM play/pause events.
dom.window.HTMLMediaElement.prototype.pause=function(){this.dispatchEvent(new Event('pause'));};
dom.window.HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('play'));return Promise.resolve();};
const requests=[];let failCatalog=false,showInstagram=false;
const igVideo={id:'ig-qa-video',media_type:'VIDEO',media_url:'https://cdn.example.invalid/reel.mp4',thumbnail_url:'https://cdn.example.invalid/poster.jpg',permalink:'https://www.instagram.com/reel/qa-video/',username:'store.qa',profile_image:'https://cdn.example.invalid/avatar.jpg',published_at:'2026-10-01T10:00:00Z',caption:'An actual feed fixture',view_count:1234,like_count:7,comment_count:2,product_id:'10000000-0000-4000-8000-000000000001'};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input.url);
 assert.equal(url.hostname,'ipqcxqsjzkbtxpljvdcy.supabase.co','All requests target the new shoe project');
 const headers=new Headers(init?.headers||input?.headers);
 assert.ok(headers.get('apikey')?.startsWith('sb_publishable_'),'Only a public client key is used');
 const body=init?.body?JSON.parse(init.body):null;requests.push({url,body,method:init?.method||'GET'});
 if(url.pathname==='/rest/v1/products')return new Response(JSON.stringify(failCatalog?{code:'XX000',message:'QA unavailable'}:[]),{status:failCatalog?503:200,headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/rest/v1/categories')return new Response('[]',{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/rest/v1/brands')return new Response(JSON.stringify(previewBrands.map(brand=>({...brand,id:brand.slug}))),{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/functions/v1/instagram-feed')return new Response(JSON.stringify(showInstagram?{success:true,connected:true,configured:true,items:body?.action==='more'?[{...igVideo,id:'ig-more',permalink:'https://www.instagram.com/reel/qa-more/'}]:[igVideo,{id:'ig-qa-photo',media_type:'IMAGE',thumbnail_url:'https://cdn.example.invalid/photo.jpg',permalink:'https://www.instagram.com/p/qa-photo/',caption:'A fresh drop'},{id:'ig-qa-album',media_type:'CAROUSEL_ALBUM',media_url:'https://cdn.example.invalid/album-first.jpg',permalink:'https://www.instagram.com/p/qa-album/',caption:'More details in our photo collection'},{id:'unsafe',permalink:'javascript:alert(1)'}],settings:{is_enabled:true,username:'store.qa',profile_url:'https://www.instagram.com/store.qa/',autoplay_enabled:true,desktop_cards:4,mobile_cards:1.2},next_offset:body?.action==='more'?null:3}:{success:true,connected:false,configured:false,items:[],settings:{is_enabled:false},next_offset:null}),{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/rest/v1/store_settings')return new Response('[{"id":true,"shipping_fee_cents":30000,"free_shipping_threshold_cents":1200000,"exchange_window_days":7}]',{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/auth/v1/signup')return new Response('{"id":"f0000000-0000-4000-8000-000000000001","email":"qa@example.invalid","identities":[]}',{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/auth/v1/recover')return new Response('{}',{headers:{'Content-Type':'application/json'}});
 if(url.pathname==='/auth/v1/token')return new Response('{"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}',{status:400,headers:{'Content-Type':'application/json'}});
 throw new Error('Unexpected mocked endpoint: '+url.pathname);
};
await build({entryPoints:['tests/runtime/ui-entry.jsx'],bundle:true,platform:'node',format:'cjs',outfile:'.qa/ui-connected.cjs',external:['react','react-dom','react-dom/client','react-router-dom'],loader:{'.css':'empty'},define:{'import.meta.env':JSON.stringify({VITE_STORE_PREVIEW:'false'})},jsx:'automatic'});
const require=createRequire(import.meta.url),React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{TestApp}=require('../../.qa/ui-connected.cjs');
const root=createRoot(document.getElementById('root'));let passed=0;
async function settle(){await new Promise(resolve=>setTimeout(resolve,5));}
async function render(path){await act(async()=>{root.render(React.createElement(TestApp,{path,key:path}));await settle();});await act(settle);}
async function submit(fields){for(const [name,value]of Object.entries(fields))document.querySelector(`[name="${name}"]`).value=value;await act(async()=>{document.querySelector('.auth-form form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await settle();});await act(settle);}
function ok(label,value){assert.ok(value,label);passed++;console.log('PASS',label);}
await render('/');
ok('Connected homepage reads the real product endpoint',requests.some(r=>r.url.pathname==='/rest/v1/products'));
ok('Empty hosted catalog never displays sample merchandise',document.querySelectorAll('.sf-card').length===0&&document.body.textContent.includes('New pairs are on the way.'));
ok('Connected brands and Instagram read the new shoe project',requests.some(r=>r.url.pathname==='/rest/v1/brands')&&requests.some(r=>r.url.pathname==='/functions/v1/instagram-feed'));
ok('An unconnected Instagram account shows no fabricated Reels',document.querySelectorAll('.sf-reel-card').length===0&&Boolean(document.querySelector('.sf-reels-waiting')));
showInstagram=true;await render('/?qa=instagram');
ok('Connected Instagram renders real feed items and filters unsafe links',document.querySelectorAll('.sf-reel-card').length===3&&!document.querySelector('[href^="javascript:"]'));
ok('Reel videos have a real source, muted playback and lazy loading',document.querySelector('.sf-reel-media video')?.getAttribute('src')===igVideo.media_url&&document.querySelector('.sf-reel-media video').getAttribute('preload')==='none'&&document.querySelector('.sf-reel-media video').muted);
ok('A Reel can open Instagram and its associated shoe',document.querySelector('.sf-reel-open')?.href===igVideo.permalink&&document.querySelector('.sf-reel-shop')?.getAttribute('href')==='/product/'+igVideo.product_id);
const cards=[...document.querySelectorAll('.sf-reel-card')];
ok('Cards display the account avatar, caption and only returned engagement metrics',cards[0].querySelector('.sf-reel-avatar img')?.src===igVideo.profile_image&&cards[0].querySelector('.sf-reel-card-caption').textContent===igVideo.caption&&cards[0].querySelector('[aria-label="7 likes"]')&&cards[0].querySelector('[aria-label="2 comments"]')&&cards[1].querySelector('.sf-reel-stats').children.length===0);
ok('The reference layout overlays account and caption on media, with real views and Instagram links',cards[0].querySelector('.sf-reel-media .sf-reel-author .sf-reel-card-caption')&&cards[0].querySelector('.sf-reel-media [aria-label="1,234 views"]')&&cards[0].querySelector('.sf-reel-instagram').href===igVideo.permalink&&!cards[1].querySelector('.sf-reel-views'));
ok('Photo and album posts use their images and open their actual Instagram posts',cards[1].querySelector('.sf-reel-media img').src==='https://cdn.example.invalid/photo.jpg'&&cards[2].querySelector('.sf-reel-tag').textContent.includes('PHOTO SET')&&cards[2].querySelector('.sf-reel-media img').src==='https://cdn.example.invalid/album-first.jpg'&&cards[2].querySelector('.sf-reel-open').textContent.includes('View Post'));
await act(async()=>{cards[0].querySelector('.sf-reel-play').click();await settle();});
ok('Visitors can explicitly play and pause a Reel',cards[0].querySelector('[aria-label="Pause this Reel"]'));
await act(async()=>{cards[0].querySelector('.sf-reel-play').click();await settle();});
await act(async()=>{cards[0].querySelector('.sf-reel-avatar img').dispatchEvent(new Event('error'));cards[1].querySelector('.sf-reel-media img').dispatchEvent(new Event('error'));await settle();});
ok('Unavailable Instagram imagery keeps a usable avatar and direct post link',!cards[0].querySelector('.sf-reel-avatar img')&&cards[0].querySelector('.sf-reel-avatar svg')&&cards[1].querySelector('.sf-reel-no-image')?.href==='https://www.instagram.com/p/qa-photo/');
const igTrack=document.querySelector('.sf-reels-track'),igScroll=[];
Object.defineProperties(igTrack,{clientWidth:{value:530},scrollWidth:{value:800}});
igTrack.firstElementChild.getBoundingClientRect=()=>({width:250});
igTrack.scrollTo=options=>{igScroll.push(options);igTrack.scrollLeft=options.left;};
await act(async()=>{igTrack.dispatchEvent(new window.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));await settle();});
await act(async()=>{igTrack.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));await settle();});
await act(async()=>{document.querySelector('[aria-label="Next Instagram moments"]').click();await settle();});
ok('Instagram rail supports keyboard boundaries and its next-moment control',igScroll[0].left===270&&igScroll[1].left===0&&igScroll[2].left===268);
await act(async()=>{document.querySelector('[aria-label="Pause automatic Reel playback"]').click();await settle();});
ok('Automatic Reel playback has an explicit pause control',document.querySelector('[aria-label="Resume automatic Reel playback"]')?.getAttribute('aria-pressed')==='true');
await act(async()=>{document.querySelector('.sf-reels-more button').click();await settle();});await act(settle);
ok('More moments loads the next page and keeps existing cards',document.querySelectorAll('.sf-reel-card').length===4&&requests.some(request=>request.body?.action==='more'&&request.body.offset===3));
showInstagram=false;
failCatalog=true;await render('/?qa=error');
ok('Catalog failure shows a retry state without sample fallback',document.body.textContent.includes("We couldn't load the collection.")&&document.querySelectorAll('.sf-card').length===0);
failCatalog=false;await act(async()=>{document.querySelector('.sf-empty button').click();await settle();});await act(settle);
ok('Collection retry recovers from the failed response',document.body.textContent.includes('New pairs are on the way.'));
await render('/admin');
ok('Configured admin requires sign-in and preserves the return destination',document.querySelector('.auth-submit')?.textContent.includes('Sign in')&&!document.querySelector('.sf-admin-card'));
await render('/login?returnTo=%2Fadmin%3Fcatalog%3Dlive');ok('Admin sign-in retains the studio context with catalog query parameters',document.querySelector('.auth-page--admin')&&document.querySelector('.auth-form__eyebrow').textContent==='SOLEFORM / ADMIN PORTAL');
await render('/register?returnTo=%2Fadmin');
ok('Connected registration is enabled without preview messaging',!document.querySelector('.auth-submit').disabled&&!document.querySelector('.auth-preview'));
await submit({full_name:'QA only',email:'qa@example.invalid',password:'Only-a-mocked-password-123'});
const signup=requests.find(r=>r.url.pathname==='/auth/v1/signup');
ok('Registration uses Supabase and requires verification',signup?.body.email==='qa@example.invalid'&&document.body.textContent.includes('verify your email before signing in'));
ok('Confirmation callback preserves the admin destination',signup?.url.searchParams.get('redirect_to')==='http://qa.local/login?returnTo=%2Fadmin');
await render('/reset-password?mode=forgot');await submit({email:'qa@example.invalid'});
ok('Recovery points back to the website reset route',requests.some(r=>r.url.pathname==='/auth/v1/recover'&&r.url.searchParams.get('redirect_to')==='http://qa.local/reset-password'));
await render('/login');await submit({email:'qa@example.invalid',password:'Only-a-mocked-password-123'});
ok('Unconfirmed sign-in errors remain visible and allow retry',document.querySelector('[role="alert"]')?.textContent.includes('Email not confirmed')&&!document.querySelector('.auth-submit').disabled);
await act(async()=>root.unmount());console.log('CONNECTED COMPONENT CHECKS PASSED:',passed);
